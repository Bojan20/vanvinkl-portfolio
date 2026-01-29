/**
 * Shared Materials - Created ONCE, reused everywhere
 * This eliminates per-component material creation
 */

import * as THREE from 'three'

export const SHARED_MATERIALS = {
  // Floor
  floor: new THREE.MeshStandardMaterial({ color: '#1a1520', metalness: 0.4, roughness: 0.7 }),
  // Walls
  wall: new THREE.MeshStandardMaterial({ color: '#1a1420', metalness: 0.6, roughness: 0.4 }),
  // Ceiling
  ceiling: new THREE.MeshStandardMaterial({ color: '#151218', metalness: 0.7, roughness: 0.3 }),
  ceilingPanel: new THREE.MeshStandardMaterial({ color: '#201828', metalness: 0.8, roughness: 0.2 }),
  // Furniture
  velvetPurple: new THREE.MeshStandardMaterial({ color: '#6b2d7b', metalness: 0.05, roughness: 0.9 }),
  velvetTeal: new THREE.MeshStandardMaterial({ color: '#1a5c6b', metalness: 0.05, roughness: 0.9 }),
  velvetWine: new THREE.MeshStandardMaterial({ color: '#7b2d4a', metalness: 0.05, roughness: 0.9 }),
  goldChrome: new THREE.MeshStandardMaterial({ color: '#c9a227', metalness: 1, roughness: 0.15 }),
  chrome: new THREE.MeshStandardMaterial({ color: '#666', metalness: 1, roughness: 0.1 }),
  glass: new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.25 }),
  darkMetal: new THREE.MeshStandardMaterial({ color: '#0a0a12', metalness: 0.7, roughness: 0.3 }),
  // Bar
  barTop: new THREE.MeshStandardMaterial({ color: '#1a1a28', metalness: 0.8, roughness: 0.2 }),
  barBody: new THREE.MeshStandardMaterial({ color: '#080810', metalness: 0.6, roughness: 0.4 }),
  barShelf: new THREE.MeshStandardMaterial({ color: '#0a0a14', metalness: 0.5, roughness: 0.5 }),
  // Rope
  velvetRope: new THREE.MeshStandardMaterial({ color: '#8B0020', metalness: 0.2, roughness: 0.8 })
}

export const COLORS = {
  magenta: '#ff00aa',
  cyan: '#00ffff',
  purple: '#8844ff',
  gold: '#ffd700',
  blue: '#4466ff',
  deepPurple: '#2a0040',
  black: '#050508'
}
