/**
 * LoadingScreen - Suspense fallback for 3D scene
 */

import { Html } from '@react-three/drei'

export function LoadingScreen() {
  return (
    <Html center>
      <div style={{ color: '#00ffff', fontSize: '24px' }}>Loading...</div>
    </Html>
  )
}
