interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ message, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      background: 'rgba(26,18,8,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fdfaf4', border: '1px solid #d9cfbe',
        borderRadius: 16, padding: 32, maxWidth: 420, width: '90%',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
      }}>
        <p style={{
          fontSize: 15, fontWeight: 600, color: '#1a1208',
          marginBottom: 28, lineHeight: 1.6,
        }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            background: 'transparent', border: '1px solid #d9cfbe',
            borderRadius: 10, padding: '10px 20px',
            fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#8a7d68',
          }}>
            Cancelar
          </button>
          <button onClick={onConfirm} style={{
            background: '#b84c2e', color: '#fff', border: 'none',
            borderRadius: 10, padding: '10px 24px',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
