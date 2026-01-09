'use client'

import dynamic from 'next/dynamic'

const CasinoLounge3D = dynamic(
  () => import('@/components/3d/CasinoLounge3D'),
  { ssr: false }
)

export default function Casino3DPage() {
  return <CasinoLounge3D />
}
