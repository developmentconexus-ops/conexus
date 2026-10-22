/**
 * The packages an app may import without asking: the starter's own, at the versions it pins. The
 * server owns the list and hands it to every check with the Projeto's grants (code C26).
 */
export const PREAPPROVED_PACKAGES: ReadonlySet<string> = new Set([
  '@base-ui/react',
  '@hookform/resolvers',
  '@tailwindcss/vite',
  '@tanstack/react-query',
  '@tanstack/react-router',
  '@tanstack/react-table',
  '@types/react',
  '@types/react-dom',
  '@vitejs/plugin-react',
  'class-variance-authority',
  'clsx',
  'date-fns',
  'lucide-react',
  'react',
  'react-day-picker',
  'react-dom',
  'react-hook-form',
  'recharts',
  'tailwind-merge',
  'tailwindcss',
  'typescript',
  'vite',
  'zod',
])
