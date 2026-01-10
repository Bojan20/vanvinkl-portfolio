'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * LOD (Level of Detail) Hook
 *
 * Returns LOD level (0=high, 1=medium, 2=low) based on distance to camera
 */
export function useLOD(position: THREE.Vector3, thresholds = [15, 30]): number {
  const lodLevel = useRef(0)

  useFrame(({ camera }) => {
    const distance = camera.position.distanceTo(position)

    if (distance < thresholds[0]) {
      lodLevel.current = 0 // High detail
    } else if (distance < thresholds[1]) {
      lodLevel.current = 1 // Medium detail
    } else {
      lodLevel.current = 2 // Low detail
    }
  })

  return lodLevel.current
}

/**
 * Frustum Culling Hook
 *
 * Returns true if object is visible in camera frustum
 */
export function useFrustumCulling(meshRef: React.RefObject<THREE.Mesh>): boolean {
  const isVisible = useRef(true)
  const frustum = useMemo(() => new THREE.Frustum(), [])
  const projectionMatrix = useMemo(() => new THREE.Matrix4(), [])

  useFrame(({ camera }) => {
    if (!meshRef.current) return

    projectionMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    )
    frustum.setFromProjectionMatrix(projectionMatrix)

    isVisible.current = frustum.intersectsObject(meshRef.current)
  })

  return isVisible.current
}

/**
 * Performance Monitor
 *
 * Tracks FPS and adjusts quality dynamically
 */
export class PerformanceMonitor {
  private frameCount = 0
  private lastTime = performance.now()
  private fps = 60
  private fpsHistory: number[] = []
  private readonly historySize = 60 // 1 second at 60fps

  update(): number {
    this.frameCount++
    const currentTime = performance.now()

    if (currentTime >= this.lastTime + 1000) {
      this.fps = (this.frameCount * 1000) / (currentTime - this.lastTime)
      this.frameCount = 0
      this.lastTime = currentTime

      // Update history
      this.fpsHistory.push(this.fps)
      if (this.fpsHistory.length > this.historySize) {
        this.fpsHistory.shift()
      }
    }

    return this.fps
  }

  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 60

    const sum = this.fpsHistory.reduce((a, b) => a + b, 0)
    return sum / this.fpsHistory.length
  }

  shouldReduceQuality(): boolean {
    return this.getAverageFPS() < 45 // Below 45fps = reduce quality
  }

  shouldIncreaseQuality(): boolean {
    return this.getAverageFPS() > 55 // Above 55fps = can increase
  }

  getQualityLevel(): 'low' | 'medium' | 'high' {
    const avgFPS = this.getAverageFPS()

    if (avgFPS < 30) return 'low'
    if (avgFPS < 50) return 'medium'
    return 'high'
  }
}

/**
 * Adaptive Quality System
 *
 * Automatically adjusts rendering quality based on performance
 */
export function useAdaptiveQuality() {
  const monitor = useMemo(() => new PerformanceMonitor(), [])
  const qualityLevel = useRef<'low' | 'medium' | 'high'>('high')

  useFrame(() => {
    monitor.update()

    // Check every second
    if (Math.random() < 0.016) {
      // ~1 in 60 frames
      qualityLevel.current = monitor.getQualityLevel()
    }
  })

  return {
    qualityLevel: qualityLevel.current,
    enableSSAO: qualityLevel.current !== 'low',
    enableSSR: qualityLevel.current === 'high',
    particleCount: qualityLevel.current === 'high' ? 500 : qualityLevel.current === 'medium' ? 250 : 100,
    shadowMapSize: qualityLevel.current === 'high' ? 2048 : qualityLevel.current === 'medium' ? 1024 : 512
  }
}

/**
 * Object Pooling for Particles
 *
 * Reuses Three.js objects instead of creating/destroying
 */
export class ObjectPool<T extends THREE.Object3D> {
  private pool: T[] = []
  private active: Set<T> = new Set()

  constructor(private factory: () => T, initialSize = 10) {
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory())
    }
  }

  acquire(): T {
    let obj = this.pool.pop()

    if (!obj) {
      obj = this.factory()
    }

    this.active.add(obj)
    return obj
  }

  release(obj: T) {
    this.active.delete(obj)
    this.pool.push(obj)

    // Reset object state
    obj.visible = false
    obj.position.set(0, 0, 0)
    obj.rotation.set(0, 0, 0)
    obj.scale.set(1, 1, 1)
  }

  releaseAll() {
    this.active.forEach((obj) => this.release(obj))
  }

  getActiveCount(): number {
    return this.active.size
  }

  getPoolSize(): number {
    return this.pool.length
  }
}

/**
 * Memory Management Utilities
 */
export function disposeObject(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) {
        child.geometry.dispose()
      }

      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => disposeMaterial(material))
        } else {
          disposeMaterial(child.material)
        }
      }
    }
  })
}

function disposeMaterial(material: THREE.Material) {
  material.dispose()

  // Dispose textures
  Object.keys(material).forEach((key) => {
    const value = (material as any)[key]
    if (value && value instanceof THREE.Texture) {
      value.dispose()
    }
  })
}

/**
 * Texture Atlas Generator
 *
 * Combines multiple textures into single atlas to reduce draw calls
 */
export function createTextureAtlas(
  textures: THREE.Texture[],
  atlasSize = 2048
): { atlas: THREE.Texture; uvOffsets: THREE.Vector4[] } {
  const canvas = document.createElement('canvas')
  canvas.width = atlasSize
  canvas.height = atlasSize
  const ctx = canvas.getContext('2d')!

  const uvOffsets: THREE.Vector4[] = []
  const cols = Math.ceil(Math.sqrt(textures.length))
  const cellSize = atlasSize / cols

  textures.forEach((texture, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)

    const x = col * cellSize
    const y = row * cellSize

    // Draw texture to atlas
    if (texture.image instanceof HTMLImageElement ||
        texture.image instanceof HTMLCanvasElement ||
        texture.image instanceof ImageBitmap) {
      ctx.drawImage(texture.image, x, y, cellSize, cellSize)
    }

    // Store UV offset (x, y, width, height) in normalized coords
    uvOffsets.push(
      new THREE.Vector4(
        x / atlasSize,
        y / atlasSize,
        cellSize / atlasSize,
        cellSize / atlasSize
      )
    )
  })

  const atlas = new THREE.CanvasTexture(canvas)
  atlas.needsUpdate = true

  return { atlas, uvOffsets }
}
