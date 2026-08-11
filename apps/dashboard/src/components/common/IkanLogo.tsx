import React from 'react';

interface LogoProps {
  variant?: 'light' | 'dark' | 'lime';
  size?: number;
  showText?: boolean;
}

export default function IkanLogo({ variant = 'dark', size = 32, showText = true }: LogoProps) {
  // Variations de couleurs selon le fond
  const cubeLeft = variant === 'lime' ? '#02302D' : '#75B72A';
  const cubeRight = variant === 'lime' ? '#02302D' : (variant === 'light' ? '#FFFFFF' : '#3C7730');
  const textColor = variant === 'light' ? '#FFFFFF' : '#02302D';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: size > 30 ? '10px' : '8px' }}>
      {/* SVG Cube 3D Isométrique Officiel IKAN AI */}
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Face droite / bloc inférieur (Forest Green / White / Dark) */}
        <path d="M50 48 L85 28 L85 70 L50 90 L50 48 Z" fill={cubeRight} />
        {/* Face supérieure (Lime Green / Dark) */}
        <path d="M15 30 L50 10 L85 30 L50 50 L15 30 Z" fill={cubeLeft} opacity="0.9" />
        {/* Face gauche (Lime Green / Dark) */}
        <path d="M15 30 L50 50 L50 90 L15 70 L15 30 Z" fill={cubeLeft} />
        {/* Découpe géométrique intérieure ruban */}
        <path d="M35 42 L50 33 L65 42 L50 51 Z" fill={variant === 'lime' ? '#BCCF00' : '#FFFFFF'} opacity="0.3" />
      </svg>

      {showText && (
        <span style={{
          fontSize: `${size * 0.58}px`,
          fontWeight: 900,
          letterSpacing: '-0.02em',
          color: textColor,
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          lineHeight: 1,
        }}>
          IKAN <span style={{ color: variant === 'light' ? '#BCCF00' : '#75B72A' }}>AI</span>
        </span>
      )}
    </div>
  );
}
