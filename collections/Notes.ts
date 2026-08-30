import type { CollectionConfig } from 'payload'

export const Notes: CollectionConfig = {
  slug: 'notes',
  admin: {
    useAsTitle: 'content',
  },
  fields: [
    {
      name: 'content',
      type: 'text',
      required: true,
    },
    {
      name: 'date',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
