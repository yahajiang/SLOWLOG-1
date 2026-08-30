import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'createdAt'],
  },
  versions: {
    maxPerDoc: 5,
    drafts: {
      autosave: {
        interval: 3000,
      },
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      localized: true,
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      localized: true,
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Design', value: 'Design' },
        { label: 'Plugin', value: 'Plugin' },
        { label: 'Engineering', value: 'Engineering' },
        { label: 'Typography', value: 'Typography' },
        { label: 'Frontend', value: 'Frontend' },
        { label: 'Snippet', value: 'Snippet' },
      ],
      defaultValue: 'Design',
    },
    {
      name: 'author',
      type: 'text',
      defaultValue: 'Yahajiang',
    },
    {
      name: 'authorInitial',
      type: 'text',
      defaultValue: 'Y',
    },
    {
      name: 'date',
      type: 'date',
      required: true,
    },
    {
      name: 'readTime',
      type: 'text',
      defaultValue: '5 min',
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
    {
      name: 'legacyContent',
      type: 'json',
      admin: {
        hidden: true,
      },
    },
  ],
}
