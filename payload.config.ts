import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import fs from 'fs'
import { Users } from './collections/Users'
import { Posts } from './collections/Posts'
import { Notes } from './collections/Notes'

// 手动加载 .env 文件
const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim()
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || '',
  
  admin: {
    user: 'users',
    meta: { titleSuffix: ' - 慢日志后台' },
  },

  collections: [Users, Posts, Notes],

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL || '',
    },
  }),

  editor: lexicalEditor({}),
  
  typescript: {
    outputFile: path.resolve(process.cwd(), 'payload-types.ts'),
  },

  localization: {
    locales: [
      { label: '中文', code: 'zh' },
      { label: 'English', code: 'en' },
    ],
    defaultLocale: 'zh',
    fallback: true,
  },
})
