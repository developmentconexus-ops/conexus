import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// tailwind-merge reads an unknown `text-*` as a colour and an unknown `rounded-*` as no radius, so
// without the brand's scales `text-label text-text-2` lost its size and two radii both stayed. The
// scales are tokens.css's; cn.test.ts fails when one there is missing here.
const merge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['display', 'title', 'body', 'label', 'eyebrow', 'fact'],
      radius: ['control', 'object', 'card', 'composer', 'pill'],
      spacing: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'],
    },
  },
})

export function cn(...inputs: ClassValue[]): string {
  return merge(clsx(inputs))
}
