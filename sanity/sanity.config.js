import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Cheyenne Simone Photography Portfolio Site',

  projectId: '76kejomt',
  dataset: 'live',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
