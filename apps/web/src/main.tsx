import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createCache } from './platform/cache.ts'
import './brand/tokens.css'
import { StatusPage } from './hub/status/public.ts'

const root = document.getElementById('root')
if (root === null) throw new Error('index.html has no #root')

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={createCache()}>
      <StatusPage />
    </QueryClientProvider>
  </StrictMode>,
)
