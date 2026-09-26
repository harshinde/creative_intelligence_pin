import React from 'react';
import { colors, fonts, radius } from '../tokens';

export interface TagProps {
  children: React.ReactNode;
  accent?: boolean;
}

export function Tag({ children, accent = false }: TagProps) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: fonts.mono,
        fontSize: 10,
        padding: '3px 9px',
        borderRadius: radius.tag,
        marginRight: 4,
        marginBottom: 4,
        background: accent ? colors.accentBg : 'transparent',
        color: accent ? colors.accent : colors.textBody,
        border: `1px solid ${accent ? colors.accentBorder : colors.border}`,
        letterSpacing: '0.02em',
      }}
    >
      {children}
    </span>
  );
}
