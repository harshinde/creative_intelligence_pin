import React from 'react';

interface PinButtonProps {
  onClick: () => void;
  top: number;
  left: number;
}

export function PinButton({ onClick, top, left }: PinButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        top,
        left,
        zIndex: 2147483647,
        padding: '6px 12px',
        background: '#ED2224',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        fontSize: '13px',
        fontFamily: 'sans-serif',
        cursor: 'pointer',
        pointerEvents: 'auto',
      }}
    >
      Analyze
    </button>
  );
}
