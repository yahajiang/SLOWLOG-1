import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { Users } from './collections/Users'
import { Posts } from './collections/Posts'
import { Notes } from './collections/Notes'

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
