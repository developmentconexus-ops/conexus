import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// tailwind-merge reads an unknown `text-*` or `shadow-*` as a colour and an unknown `rounded-*` as no radius, so
// without the brand's scales `text-label text-text-2` lost its size and two radii both stayed. The
// scales are tokens.css's; cn.test.ts fails when one there is missing here.
const merge = extendTailwindMerge({
  extend: {
    // The frame's two grounds are background colours: one of them wins over a `bg-*` before it.
    classGroups: { 'bg-color': ['frame-ground', 'frame-current'] },
    theme: {
      text: [
        'display',
        'display-narrow',
        'heading',
        'title',
        'reading',
        'body',
        'label',
        'eyebrow',
        'fact',
      ],
      radius: ['control', 'object', 'card', 'composer', 'pill', 'phone'],
      shadow: ['ring', '1', '2', 'float', 'composer'],
      spacing: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', 'row', 'control', 'control-sm'],
    },
  },
})

export function cn(...inputs: ClassValue[]): string {
  return merge(clsx(inputs))
}
