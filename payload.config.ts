import { buildConfig, type CollectionConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'

const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      defaultValue: 'editor',
    },
  ],
}

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || '',
  
  admin: {
    user: 'users',
    meta: { titleSuffix: ' - 慢日志后台' },
  },

  collections: [Users],

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL || '',
    },
  }),

  editor: lexicalEditor({}),
  
  typescript: {
    outputFile: path.resolve(process.cwd(), 'payload-types.ts'),
  },
})
