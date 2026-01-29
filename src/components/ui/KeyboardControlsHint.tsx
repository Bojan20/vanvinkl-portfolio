/**
 * KeyboardControlsHint - Shows arrow keys at bottom center
 */

export function KeyboardControlsHint() {
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 18px',
      background: 'rgba(5, 5, 15, 0.75)',
      border: '1px solid rgba(0, 255, 255, 0.2)',
      borderRadius: '20px',
      backdropFilter: 'blur(8px)',
      zIndex: 100,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Arrow keys display */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
        <div style={{
          width: '22px',
          height: '22px',
          background: 'rgba(0, 255, 255, 0.15)',
          border: '1px solid rgba(0, 255, 255, 0.4)',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#00ffff',
          fontSize: '10px',
          fontWeight: 'bold'
        }}>↑</div>
        <div style={{ display: 'flex', gap: '2px' }}>
          {['←', '↓', '→'].map(arrow => (
            <div key={arrow} style={{
              width: '22px',
              height: '22px',
              background: 'rgba(0, 255, 255, 0.15)',
              border: '1px solid rgba(0, 255, 255, 0.4)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00ffff',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>{arrow}</div>
          ))}
        </div>
      </div>

      <span style={{ color: '#888899', fontSize: '11px', marginLeft: '4px' }}>MOVE</span>

      <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />

      <div style={{
        padding: '6px 12px',
        background: 'rgba(136, 68, 255, 0.15)',
        border: '1px solid rgba(136, 68, 255, 0.4)',
        borderRadius: '6px',
        color: '#8844ff',
        fontSize: '11px',
        fontWeight: 'bold',
        letterSpacing: '1px'
      }}>SPACE</div>

      <span style={{ color: '#888899', fontSize: '11px' }}>SLOT SPIN</span>
    </div>
  )
}
