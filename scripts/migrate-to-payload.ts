/**
 * Payload CMS 数据迁移脚本
 * 
 * 将现有数据从 Prisma/Markdown/JSON 迁移到 Payload Collections
 * 
 * 用法: npx tsx scripts/migrate-to-payload.ts
 * 
 * 注意: 需要设置环境变量 DATABASE_URI 和 PAYLOAD_SECRET
 */

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { getPayload } from 'payload'
import config from '../payload.config'

const CONTENT_DIR = path.join(process.cwd(), 'content', 'posts')
const THOUGHTS_PATH = path.join(process.cwd(), 'data', 'thoughts.json')
const USERS_PATH = path.join(process.cwd(), 'data', 'users.json')

// ============================================
// Markdown → Lexical 转换（简化版）
// ============================================

function markdownToLexical(markdown: string): Record<string, unknown> {
  const lines = markdown.split('\n')
  const children: Record<string, unknown>[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // 标题
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      children.push({
        type: 'heading',
        format: level <= 6 ? `h${level}` : 'h6',
        children: [{ type: 'text', text: headingMatch[2], format: [] }],
      })
      continue
    }

    // 代码块
    if (trimmed.startsWith('```')) {
      // 跳过代码块标记，收集代码内容
      continue
    }

    // 引用
    if (trimmed.startsWith('> ')) {
      children.push({
        type: 'paragraph',
        children: [{ type: 'text', text: trimmed.slice(2), format: ['italic'] }],
        indent: 1,
      })
      continue
    }

    // 普通段落
    children.push({
      type: 'paragraph',
      children: parseInlineFormatting(trimmed),
    })
  }

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children,
    },
  }
}

function parseInlineFormatting(text: string): Record<string, unknown>[] {
  const nodes: Record<string, unknown>[] = []
  // 简单处理：移除 Markdown 标记，保留纯文本
  const cleanText = text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')

  if (cleanText) {
    nodes.push({ type: 'text', text: cleanText, format: [] })
  }
  return nodes
}

// ============================================
// 迁移函数
// ============================================

async function migrateUsers(payload: any) {
  console.log('\n📦 迁移用户...')
  
  if (!fs.existsSync(USERS_PATH)) {
    console.log('  ⚠️ 未找到 users.json，跳过')
    return
  }

  const data = JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'))
  const users = data.users || []

  for (const user of users) {
    try {
      // Payload 用户需要 email 字段
      const email = user.username + '@slowlog.dev'
      
      // 检查是否已存在
      const existing = await payload.find({
        collection: 'users',
        where: { email: { equals: email } },
      })

      if (existing.docs.length > 0) {
        console.log(`  ⏭️ 用户 ${email} 已存在，跳过`)
        continue
      }

      await payload.create({
        collection: 'users',
        data: {
          email,
          password: user.password, // bcrypt 哈希，Payload 会识别
          name: user.name,
          role: 'admin',
        },
      })
      console.log(`  ✅ 用户 ${email} 迁移成功`)
    } catch (e: any) {
      console.error(`  ❌ 用户迁移失败: ${e.message}`)
    }
  }
}

async function migratePosts(payload: any) {
  console.log('\n📝 迁移文章...')
  
  if (!fs.existsSync(CONTENT_DIR)) {
    console.log('  ⚠️ 未找到 content/posts/ 目录，跳过')
    return
  }

  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'))
  console.log(`  📄 找到 ${files.length} 篇文章`)

  for (const file of files) {
    try {
      const filePath = path.join(CONTENT_DIR, file)
      const raw = fs.readFileSync(filePath, 'utf-8')
      const parsed = matter(raw)
      const data = parsed.data
      const markdown = parsed.content.trim()
      const id = file.replace(/\.md$/, '')

      // 检查是否已存在
      const existing = await payload.find({
        collection: 'posts',
        where: { slug: { equals: id } },
      })

      if (existing.docs.length > 0) {
        console.log(`  ⏭️ 文章 "${data.title}" 已存在，跳过`)
        continue
      }

      // 转换 Markdown 为 Lexical 格式
      const lexicalContent = markdownToLexical(markdown)

      // 创建文章
      await payload.create({
        collection: 'posts',
        data: {
          title: data.title || id,
          titleZh: data.titleZh || data.title || id,
          slug: id,
          excerpt: data.excerpt || '',
          excerptZh: data.excerptZh || data.excerpt || '',
          content: lexicalContent,
          category: data.category || 'Design',
          author: data.author || 'Yahajiang',
          authorInitial: data.authorInitial || 'Y',
          date: data.date ? new Date(data.date) : new Date(),
          readTime: data.readTime || '5 min',
          featured: data.featured || false,
          tags: (data.tags || []).map((t: string) => ({ tag: t })),
          legacyContent: { markdown, format: 'tiptap' }, // 保留原始数据
        },
        locale: 'zh',
      })

      // 同时创建英文版本（如果有）
      if (data.titleZh && data.titleZh !== data.title) {
        await payload.update({
          collection: 'posts',
          id,
          data: {
            title: data.title,
            excerpt: data.excerpt,
          },
          locale: 'en',
        })
      }

      console.log(`  ✅ 文章 "${data.title}" 迁移成功`)
    } catch (e: any) {
      console.error(`  ❌ 文章迁移失败 (${file}): ${e.message}`)
    }
  }
}

async function migrateThoughts(payload: any) {
  console.log('\n💭 迁移随想...')
  
  if (!fs.existsSync(THOUGHTS_PATH)) {
    console.log('  ⚠️ 未找到 thoughts.json，跳过')
    return
  }

  const data = JSON.parse(fs.readFileSync(THOUGHTS_PATH, 'utf-8'))
  const thoughts = data.thoughts || []
  console.log(`  📄 找到 ${thoughts.length} 条随想`)

  for (const thought of thoughts) {
    try {
      // 使用文本内容作为标识
      const content = thought.textZh || thought.text || ''
      if (!content) continue

      // 检查是否已存在（通过内容匹配）
      const existing = await payload.find({
        collection: 'notes',
        where: { content: { equals: content } },
      })

      if (existing.docs.length > 0) {
        console.log(`  ⏭️ 随想已存在，跳过`)
        continue
      }

      await payload.create({
        collection: 'notes',
        data: {
          content,
          date: thought.createdAt ? new Date(thought.createdAt) : new Date(),
        },
      })

      console.log(`  ✅ 随想迁移成功: "${content.slice(0, 30)}..."`)
    } catch (e: any) {
      console.error(`  ❌ 随想迁移失败: ${e.message}`)
    }
  }
}

// ============================================
// 主函数
// ============================================

async function main() {
  console.log('🚀 开始数据迁移到 Payload CMS...\n')

  const payload = await getPayload({ config })

  try {
    await migrateUsers(payload)
    await migratePosts(payload)
    await migrateThoughts(payload)

    console.log('\n✅ 数据迁移完成！')
    console.log('📋 请访问 /admin 验证数据')
  } catch (e: any) {
    console.error('\n❌ 迁移过程中出错:', e.message)
  } finally {
    await payload.destroy()
  }
}

main()
