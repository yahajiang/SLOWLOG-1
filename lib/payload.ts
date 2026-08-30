import { getPayload } from 'payload'
import config from '@payload-config'
import type { Post } from './types'

/**
 * Payload Local API 封装 + 类型适配
 * 将 Payload 数据转换为现有 Post 类型
 */

function payloadPostToPost(doc: any, locale: string = 'zh'): Post {
  const isZh = locale === 'zh'
  return {
    id: doc.slug || doc.id,
    title: isZh ? (doc.titleZh || doc.title) : doc.title,
    titleZh: doc.titleZh || doc.title,
    excerpt: isZh ? (doc.excerptZh || doc.excerpt) : doc.excerpt,
    excerptZh: doc.excerptZh || doc.excerpt,
    category: doc.category || 'Design',
    author: doc.author || 'Yahajiang',
    authorInitial: doc.authorInitial || 'Y',
    date: doc.date ? new Date(doc.date).toISOString().slice(0, 10) : '',
    displayDate: doc.displayDate || '',
    readTime: doc.readTime || '5 min',
    featured: doc.featured || false,
    draft: doc._status === 'draft',
    tags: (doc.tags || []).map((t: any) => t.tag || t),
    markdown: doc.legacyContent?.markdown || '',
    markdownZh: doc.legacyContent?.markdown || '',
    html: '',
    htmlZh: '',
    headings: [],
    headingsZh: [],
    createdAt: doc.createdAt,
  }
}

export async function getAllPosts(locale: string = 'zh') {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    sort: '-createdAt',
    locale: locale as 'zh' | 'en',
    limit: 100,
  })
  return result.docs.map((doc: any) => payloadPostToPost(doc, locale))
}

export async function getPostBySlug(slug: string, locale: string = 'zh') {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    locale: locale as 'zh' | 'en',
    limit: 1,
  })
  if (!result.docs[0]) return null
  return payloadPostToPost(result.docs[0], locale)
}

export async function getPostById(id: string) {
  const payload = await getPayload({ config })
  try {
    const doc = await payload.findByID({ collection: 'posts', id })
    return payloadPostToPost(doc)
  } catch {
    return null
  }
}

export async function getNotes(locale: string = 'zh') {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'notes',
    sort: '-date',
    locale: locale as 'zh' | 'en',
    limit: 50,
  })
  return result.docs.map((doc: any) => ({
    id: doc.id,
    text: doc.content || '',
    textZh: doc.content || '',
    time: 'just now',
    timeZh: '刚刚',
    createdAt: doc.createdAt || doc.date,
  }))
}

export async function getFeaturedPost(locale: string = 'zh') {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'posts',
    where: {
      and: [
        { featured: { equals: true } },
        { _status: { equals: 'published' } },
      ],
    },
    locale: locale as 'zh' | 'en',
    limit: 1,
  })
  if (!result.docs[0]) return null
  return payloadPostToPost(result.docs[0], locale)
}

export async function getAllPostSlugs() {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    select: { slug: true },
    limit: 1000,
  })
  return result.docs.map((doc: any) => doc.slug)
}
