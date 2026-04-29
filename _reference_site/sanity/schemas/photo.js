// sanity/schemas/photo.js
// Run `npm create sanity@latest` in the project root to scaffold Sanity Studio,
// then add this schema to your schemas array in sanity.config.js

export default {
  name: 'photo',
  title: 'Photo',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      validation: Rule => Rule.required(),
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Portraits',            value: 'portraits' },
          { title: 'Landscapes',           value: 'landscapes' },
          { title: 'Commercial/Corporate', value: 'commercial' },
          { title: 'Weddings',             value: 'weddings' },
        ],
        layout: 'radio',
      },
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    },
    {
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    },
  ],
  preview: {
    select: {
      title:  'title',
      media:  'image',
      subtitle: 'category',
    },
  },
};