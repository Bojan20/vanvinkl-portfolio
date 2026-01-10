/**
 * Casino Lounge Configuration
 *
 * Centralized config for all casino-related constants
 * Prevents hardcoded values scattered across codebase
 */

export const CASINO_CONFIG = {
  // AVATAR MOVEMENT
  avatar: {
    speed: 5, // Units/s
    acceleration: 18, // Units/s²
    deceleration: 22, // Units/s²
    rotationSpeed: 0.08, // Lerp factor
    collisionRadius: 1.5, // Collision with walls
    machineCollisionRadius: 3.2, // Collision with machines
    proximityDistance: 4.5, // Distance to trigger "near machine"
    startPosition: [0, 0.5, 8] as [number, number, number],
    startRotation: Math.PI // Facing forward
  },

  // CASINO ARCHITECTURE
  architecture: {
    wallBounds: {
      left: -40,
      right: 40,
      back: -15,
      front: 8
    },
    floorSize: [85, 30] as [number, number],
    ceilingHeight: 10,
    fogNear: 25,
    fogFar: 80,
    fogColor: '#050510'
  },

  // SLOT MACHINES
  machines: {
    spacing: 7, // Distance between machines
    scale: 2.0, // Machine scale
    glowIntensity: {
      idle: 0.8,
      near: 2.0,
      active: 1.5
    },
    labelScale: {
      idle: 1.0,
      near: 1.5
    }
  },

  // LIGHTING
  lighting: {
    ambient: {
      intensity: 0.15,
      color: '#ffffff'
    },
    chandelier: {
      count: 5,
      intensity: 12,
      distance: 25,
      color: '#FFF8E7',
      warmGlow: '#FF9D5C'
    },
    spotlight: {
      intensity: 3,
      angle: Math.PI / 6,
      penumbra: 0.5,
      distance: 15
    },
    avatarFollowLight: {
      intensity: 6,
      distance: 12,
      angle: Math.PI / 4,
      color: '#FFE8C5'
    },
    marblePanelLight: {
      intensity: 6,
      angle: Math.PI / 5,
      color: '#FFF8E7'
    }
  },

  // CAMERA
  camera: {
    fov: 75,
    near: 0.1,
    far: 100,
    followOffset: [0, 6, 12] as [number, number, number],
    cinematicDuration: 3000 // ms
  },

  // AUDIO
  audio: {
    spatial: {
      maxDistance: 8,
      ambientDistance: 30,
      volumeNear: 0.8,
      volumeFar: 0.3
    },
    ui: {
      clickVolume: 0.6,
      hoverVolume: 0.4,
      selectVolume: 0.7,
      footstepVolume: 0.3
    }
  },

  // ANIMATION
  animation: {
    celebration: {
      duration: 1.5, // seconds
      jumpHeight: 1.5 // units
    },
    blink: {
      duration: 0.15, // seconds
      minInterval: 2, // seconds
      maxInterval: 5 // seconds
    },
    walkCycle: {
      speed: 8, // multiplier
      legSwing: 0.6, // radians
      armSwing: 0.4, // radians
      bodyBob: 0.08 // units
    }
  },

  // PERFORMANCE
  performance: {
    targetFPS: 60,
    pixelRatioMax: 2,
    shadowMapSize: 2048,
    stars: {
      count: 150,
      radius: 50,
      depth: 30
    }
  },

  // MARBLE PANELS
  marblePanels: {
    texts: [
      { z: -8, text: 'FEELS\nGOOD' },
      { z: -4, text: 'SOUNDS\nBETTER' },
      { z: 0, text: 'PURE\nVIBES' },
      { z: 4, text: 'NO\nCAP' }
    ],
    material: {
      baseColor: '#F5F3EE', // Cream marble
      metalness: 0.15,
      roughness: 0.08
    },
    text: {
      fontSize: 0.35,
      color: '#2D1810', // Mahogany
      outlineColor: '#D4AF37', // Gold
      outlineWidth: 0.008,
      letterSpacing: 0.06,
      lineHeight: 1.25,
      maxWidth: 2.6
    },
    goldFrame: {
      color: '#D4AF37',
      metalness: 0.8,
      roughness: 0.2
    }
  },

  // UI
  ui: {
    instructionsOpacity: 0.7,
    instructionsBorderOpacity: 0.2
  }
} as const

/**
 * Portfolio machine definitions
 */
export const PORTFOLIO_MACHINES = (() => {
  const machines = [
    { id: 'skills', label: 'Skills' },
    { id: 'services', label: 'Services' },
    { id: 'about', label: 'About Me' },
    { id: 'projects', label: 'Projects' },
    { id: 'experience', label: 'Experience' },
    { id: 'contact', label: 'Contact' }
  ]

  const spacing = CASINO_CONFIG.machines.spacing
  const totalWidth = (machines.length - 1) * spacing
  const startX = -totalWidth / 2

  return machines.map((m, i) => {
    const x = startX + i * spacing
    const z = -5
    return {
      ...m,
      pos: [x, 0, z] as [number, number, number],
      rot: [0, 0, 0] as [number, number, number]
    }
  })
})()
