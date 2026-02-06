/**
 * ServiceDetail - Service modal content with floating icon and orbiting particles
 *
 * PRODUCTION CODE - AAA quality modal with staggered animations
 */

import { memo } from 'react'

interface ServiceData {
  icon: string
  title: string
  description: string
  features: string[]
}

interface ServiceDetailProps {
  data: ServiceData
  showContent: boolean
}

export const ServiceDetail = memo(function ServiceDetail({
  data: service,
  showContent
}: ServiceDetailProps) {
  return (
    <div>
      {/* Floating icon with particles */}
      <div style={{
        position: 'relative',
        textAlign: 'center',
        marginBottom: 'clamp(16px, 4vw, 30px)'
      }}>
        <div style={{
          fontSize: 'clamp(56px, 18vw, 100px)',
          animation: 'modalIconFloat 3s ease-in-out infinite',
          filter: 'drop-shadow(0 0 40px rgba(255,0,170,0.5))'
        }}>{service.icon}</div>
        {/* Orbiting particles */}
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '8px',
            height: '8px',
            background: '#ff00aa',
            borderRadius: '50%',
            boxShadow: '0 0 15px #ff00aa',
            animation: `modalOrbit 3s linear infinite`,
            animationDelay: `${i * 1}s`,
            transformOrigin: '0 0'
          }} />
        ))}
      </div>

      <h2 style={{
        margin: '0 0 clamp(12px, 3vw, 20px) 0',
        fontSize: 'clamp(24px, 6vw, 40px)',
        color: '#ff00aa',
        fontWeight: 900,
        textAlign: 'center',
        textShadow: '0 0 30px rgba(255,0,170,0.5)',
        animation: showContent ? 'modalTitleReveal 0.5s ease-out' : 'none'
      }}>{service.title}</h2>

      <p style={{
        color: '#999',
        fontSize: 'clamp(14px, 3.5vw, 18px)',
        lineHeight: 1.8,
        marginBottom: 'clamp(16px, 4vw, 35px)',
        textAlign: 'center',
        animation: showContent ? 'modalTextReveal 0.6s ease-out 0.1s both' : 'none'
      }}>{service.description}</p>

      {/* Feature tags with staggered animation */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(6px, 2vw, 12px)', justifyContent: 'center' }}>
        {service.features.map((f, i) => (
          <span key={f} style={{
            fontSize: 'clamp(12px, 3vw, 14px)',
            padding: 'clamp(8px, 2vw, 12px) clamp(14px, 4vw, 24px)',
            background: 'linear-gradient(135deg, rgba(255,0,170,0.2), rgba(255,0,170,0.1))',
            borderRadius: '30px',
            color: '#ff00aa',
            fontWeight: '600',
            border: '1px solid rgba(255,0,170,0.4)',
            boxShadow: '0 4px 20px rgba(255,0,170,0.2)',
            animation: showContent ? `modalTagReveal 0.4s ease-out ${0.1 + i * 0.05}s both` : 'none',
            cursor: 'default',
            transition: 'all 0.3s ease'
          }}>{f}</span>
        ))}
      </div>
    </div>
  )
})
