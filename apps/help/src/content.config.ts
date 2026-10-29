import { defineCollection } from 'astro:content'
import { docsSchema } from '@astrojs/starlight/schema'
import { glob } from 'astro/loaders'

// The site's pages and each connector's guide are one collection: Starlight's `docsLoader()`
// beside a second loader would drop the pages of the first.
export const collections = {
  docs: defineCollection({
    loader: glob({
      base: '../..',
      pattern: ['apps/help/src/content/docs/**/*.md', 'packages/connectors/src/*/guide/**/*.md'],
      generateId: ({ entry }) =>
        entry.startsWith('packages/')
          ? entry.replace(
              /^packages\/connectors\/src\/([^/]+)\/guide\/(.+)\.md$/,
              'conectores/$1/$2',
            )
          : entry.replace(/^apps\/help\/src\/content\/docs\//, '').replace(/\.md$/, ''),
    }),
    schema: docsSchema(),
  }),
}
