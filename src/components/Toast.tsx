import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, []);

  const bg = type === 'success' ? '#4a7c59' : '#b84c2e';
  const icon = type === 'success' ? '✓' : '✕';

  return (
    <div style={{
      position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
      background: bg, color: '#fff',
      borderRadius: 12, padding: '14px 20px',
      fontSize: 14, fontWeight: 600,
      boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
      display: 'flex', alignItems: 'center', gap: 10,
      maxWidth: 380, minWidth: 220,
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{
        background: 'none', border: 'none', color: '#fff',
        cursor: 'pointer', fontSize: 18, opacity: 0.8, lineHeight: 1,
        padding: '0 0 0 8px',
      }}>×</button>
    </div>
  );
}
