'use client'

import dynamic from 'next/dynamic'
import { RenderingProvider } from '@/contexts/RenderingContext'

// Dynamic import - disable SSR for R3F components
const CasinoLoungeUltra = dynamic(
  () => import('@/components/casino').then(mod => ({ default: mod.CasinoLoungeUltra })),
  { ssr: false }
)

export default function Casino3DPage() {
  return (
    <RenderingProvider initialQuality="performance" enableAdaptive={true}>
      <CasinoLoungeUltra />
    </RenderingProvider>
  )
}
