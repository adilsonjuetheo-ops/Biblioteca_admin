import { useState, useEffect } from 'react';
import api from '../services/api';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

interface Comunicado {
  id: number;
  titulo: string;
  mensagem: string;
  autor: string;
  destinatario: string;
  criadoEm: string;
}

export default function Comunicados() {
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({
    titulo: '', mensagem: '', destinatario: 'todos',
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [modal, setModal] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const email = localStorage.getItem('admin_email') || '';

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
  }

  useEffect(() => { carregarComunicados(); }, []);

  async function carregarComunicados() {
    try {
      setCarregando(true);
      const { data } = await api.get('/comunicados');
      setComunicados(data);
    } catch {
      showToast('Erro ao carregar comunicados', 'error');
    } finally {
      setCarregando(false);
    }
  }

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo || !form.mensagem) {
      alert('Título e mensagem são obrigatórios'); return;
    }
    try {
      await api.post('/comunicados', { ...form, autor: email });
      showToast('Comunicado enviado com sucesso!', 'success');
      setMostrarForm(false);
      setForm({ titulo: '', mensagem: '', destinatario: 'todos' });
      carregarComunicados();
    } catch {
      showToast('Erro ao enviar comunicado', 'error');
    }
  }

  function handleExcluir(id: number) {
    setModal({
      message: 'Deseja excluir este comunicado? Esta ação não pode ser desfeita.',
      onConfirm: async () => {
        setModal(null);
        try {
          await api.delete(`/comunicados/${id}`);
          showToast('Comunicado excluído com sucesso!', 'success');
          carregarComunicados();
        } catch {
          showToast('Erro ao excluir comunicado', 'error');
        }
      },
    });
  }

  const coresDestinatario: any = {
    todos: { bg: 'rgba(74,124,89,0.12)', color: '#4a7c59', label: '👥 Todos' },
    alunos: { bg: 'rgba(201,123,46,0.12)', color: '#c97b2e', label: '🎒 Alunos' },
    professores: { bg: 'rgba(74,100,144,0.12)', color: '#4a6490', label: '📖 Professores' },
  };

  return (
    <div style={s.page}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {modal && <ConfirmModal message={modal.message} onConfirm={modal.onConfirm} onCancel={() => setModal(null)} />}
      <div style={s.topBar}>
        <div>
          <h1 style={s.titulo}>Comunicados</h1>
          <p style={s.subtitulo}>{comunicados.length} comunicados enviados</p>
        </div>
        <button style={s.btnNovo} onClick={() => setMostrarForm(!mostrarForm)}>
          {mostrarForm ? '✕ Fechar' : '📢 Novo comunicado'}
        </button>
      </div>

      {mostrarForm && (
        <div style={s.formCard}>
          <h2 style={s.formTitulo}>📢 Enviar comunicado</h2>
          <form onSubmit={handleEnviar} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Destinatário</label>
              <div style={s.radioRow}>
                {[
                  { key: 'todos', label: '👥 Todos' },
                  { key: 'alunos', label: '🎒 Alunos' },
                  { key: 'professores', label: '📖 Professores' },
                ].map(d => (
                  <button key={d.key} type="button"
                    style={{ ...s.radioBtn, ...(form.destinatario === d.key ? s.radioBtnAtivo : {}) }}
                    onClick={() => setForm({ ...form, destinatario: d.key })}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Título *</label>
              <input style={s.input} required placeholder="Título do comunicado"
                value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Mensagem *</label>
              <textarea style={{ ...s.input, height: 120, resize: 'vertical', paddingTop: 10 }}
                required placeholder="Digite a mensagem do comunicado..."
                value={form.mensagem} onChange={e => setForm({ ...form, mensagem: e.target.value })} />
            </div>
            <div style={s.formBtns}>
              <button type="button" style={s.btnCancelar}
                onClick={() => setMostrarForm(false)}>Cancelar</button>
              <button type="submit" style={s.btnEnviar}>📢 Enviar comunicado</button>
            </div>
          </form>
        </div>
      )}

      {carregando ? (
        <div style={s.loading}>Carregando comunicados...</div>
      ) : comunicados.length === 0 ? (
        <div style={s.empty}>
          <p style={s.emptyIcon}>📢</p>
          <p style={s.emptyText}>Nenhum comunicado enviado ainda</p>
        </div>
      ) : (
        <div style={s.lista}>
          {comunicados.map(com => (
            <div key={com.id} style={s.card}>
              <div style={s.cardHeader}>
                <div style={s.cardTitulo}>{com.titulo}</div>
                <div style={s.cardAcoes}>
                  <span style={{
                    ...s.badge,
                    background: coresDestinatario[com.destinatario]?.bg,
                    color: coresDestinatario[com.destinatario]?.color,
                  }}>
                    {coresDestinatario[com.destinatario]?.label || com.destinatario}
                  </span>
                  <button style={s.btnExcluir} onClick={() => handleExcluir(com.id)}>
                    🗑
                  </button>
                </div>
              </div>
              <p style={s.cardMensagem}>{com.mensagem}</p>
              <div style={s.cardRodape}>
                <span style={s.cardAutor}>Por: {com.autor}</span>
                <span style={s.cardData}>
                  {com.criadoEm ? new Date(com.criadoEm).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  }) : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 32 },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  titulo: { fontSize: 24, fontWeight: 700, color: '#1a1208', marginBottom: 4 },
  subtitulo: { fontSize: 14, color: '#8a7d68' },
  btnNovo: { background: '#c97b2e', color: '#1a1208', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  formCard: { background: '#fdfaf4', border: '1px solid #d9cfbe', borderRadius: 16, padding: 28, marginBottom: 24 },
  formTitulo: { fontSize: 18, fontWeight: 700, color: '#1a1208', marginBottom: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 12, fontWeight: 700, color: '#8a7d68', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { height: 44, borderRadius: 10, border: '1px solid #d9cfbe', background: '#f5efe3', padding: '0 14px', fontSize: 14, color: '#1a1208', outline: 'none', width: '100%', boxSizing: 'border-box' },
  radioRow: { display: 'flex', gap: 8 },
  radioBtn: { flex: 1, height: 40, borderRadius: 10, border: '1px solid #d9cfbe', background: '#f5efe3', color: '#8a7d68', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  radioBtnAtivo: { background: '#1a1208', color: '#f5efe3', borderColor: '#1a1208' },
  formBtns: { display: 'flex', gap: 12, justifyContent: 'flex-end' },
  btnCancelar: { background: 'transparent', border: '1px solid #d9cfbe', borderRadius: 10, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#8a7d68' },
  btnEnviar: { background: '#4a7c59', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  lista: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: { background: '#fdfaf4', border: '1px solid #d9cfbe', borderRadius: 16, padding: 24 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitulo: { fontSize: 16, fontWeight: 700, color: '#1a1208', flex: 1 },
  cardAcoes: { display: 'flex', alignItems: 'center', gap: 10 },
  cardMensagem: { fontSize: 14, color: '#1a1208', lineHeight: 1.7, marginBottom: 16 },
  cardRodape: { display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #f0e8dc' },
  cardAutor: { fontSize: 12, color: '#8a7d68' },
  cardData: { fontSize: 12, color: '#8a7d68' },
  badge: { padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
  btnExcluir: { background: 'rgba(184,76,46,0.12)', color: '#b84c2e', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 14, cursor: 'pointer' },
  loading: { textAlign: 'center', padding: 60, color: '#8a7d68', fontSize: 16 },
  empty: { background: '#fdfaf4', border: '1px dashed #d9cfbe', borderRadius: 16, padding: 60, textAlign: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#8a7d68', fontSize: 16 },
};