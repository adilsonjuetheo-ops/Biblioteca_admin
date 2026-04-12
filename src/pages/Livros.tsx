import { useState, useEffect } from 'react';
import api from '../services/api';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

interface Livro {
  id: number;
  titulo: string;
  autor: string;
  isbn: string;
  genero: string;
  sinopse: string;
  capa: string;
  totalExemplares: number;
  disponiveis: number;
}

export default function Livros() {
  const [livros, setLivros] = useState<Livro[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<Livro | null>(null);
  const [busca, setBusca] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [modal, setModal] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const [form, setForm] = useState({
    titulo: '', autor: '', isbn: '', genero: '',
    sinopse: '', capa: '', totalExemplares: 1, disponiveis: 1,
  });

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
  }

  useEffect(() => {
    carregarLivros();

    const refreshInterval = setInterval(() => {
      carregarLivros(false);
    }, 15000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        carregarLivros(false);
      }
    };

    window.addEventListener('focus', handleVisibility);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('focus', handleVisibility);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  async function carregarLivros(mostrarErro = true) {
    try {
      setCarregando(true);
      const { data } = await api.get('/livros');
      setLivros(data);
    } catch {
      if (mostrarErro) showToast('Erro ao carregar livros', 'error');
    } finally {
      setCarregando(false);
    }
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editando) {
        await api.put(`/livros/${editando.id}`, form);
        showToast('Livro atualizado com sucesso!', 'success');
      } else {
        await api.post('/livros', form);
        showToast('Livro cadastrado com sucesso!', 'success');
      }
      setMostrarForm(false);
      setEditando(null);
      setForm({ capa: '', titulo: '', autor: '', isbn: '', genero: '', sinopse: '', totalExemplares: 1, disponiveis: 1 });
      carregarLivros();
    } catch {
      showToast('Erro ao salvar livro', 'error');
    }
  }

  function handleEditar(livro: Livro) {
    setEditando(livro);
    setForm({
      capa: livro.capa || '',
      titulo: livro.titulo,
      autor: livro.autor,
      isbn: livro.isbn || '',
      genero: livro.genero || '',
      sinopse: livro.sinopse || '',
      totalExemplares: livro.totalExemplares || 1,
      disponiveis: livro.disponiveis || 1,
    });
    setMostrarForm(true);
  }

  function handleExcluir(livro: Livro) {
    setModal({
      message: `Excluir "${livro.titulo}"? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        setModal(null);
        try {
          await api.delete(`/livros/${livro.id}`);
          showToast('Livro excluído com sucesso!', 'success');
          carregarLivros();
        } catch {
          showToast('Erro ao excluir livro', 'error');
        }
      },
    });
  }

  function handleNovo() {
    setEditando(null);
    setForm({ capa: '', titulo: '', autor: '', isbn: '', genero: '', sinopse: '', totalExemplares: 1, disponiveis: 1 });
    setMostrarForm(true);
  }

  const livrosFiltrados = livros.filter(l =>
    l.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
    l.autor?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div style={s.page}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {modal && <ConfirmModal message={modal.message} onConfirm={modal.onConfirm} onCancel={() => setModal(null)} />}

      <div style={s.topBar}>
        <div>
          <h1 style={s.titulo}>Acervo de Livros</h1>
          <p style={s.subtitulo}>{livros.length} livros cadastrados</p>
        </div>
        <button style={s.btnNovo} onClick={handleNovo}>+ Adicionar livro</button>
      </div>

      <input style={s.busca} placeholder="🔍  Buscar por título ou autor..."
        value={busca} onChange={e => setBusca(e.target.value)} />

      {mostrarForm && (
        <div style={s.formCard}>
          <h2 style={s.formTitulo}>{editando ? '✏️ Editar livro' : '➕ Novo livro'}</h2>
          <form onSubmit={handleSalvar} style={s.form}>
            <div style={s.formGrid}>
              <div style={s.field}>
                <label style={s.label}>Título *</label>
                <input style={s.input} required placeholder="Título do livro"
                  value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Autor *</label>
                <input style={s.input} required placeholder="Nome do autor"
                  value={form.autor} onChange={e => setForm({ ...form, autor: e.target.value })} />
              </div>
              <div style={s.field}>
                <label style={s.label}>ISBN</label>
                <input style={s.input} placeholder="ISBN do livro"
                  value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value })} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Gênero</label>
                <select style={s.input}
                  value={form.genero} onChange={e => setForm({ ...form, genero: e.target.value })}>
                  <option value="">Selecione...</option>
                  <option>Romance</option>
                  <option>Literatura Brasileira</option>
                  <option>Ficção Científica</option>
                  <option>Aventura</option>
                  <option>Poesia</option>
                  <option>História</option>
                  <option>Filosofia</option>
                  <option>Biografia</option>
                  <option>Didático</option>
                  <option>Outro</option>
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Total de exemplares</label>
                <input style={s.input} type="number" min={1}
                  value={form.totalExemplares}
                  onChange={e => setForm({ ...form, totalExemplares: Number(e.target.value), disponiveis: Number(e.target.value) })} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Disponíveis</label>
                <input style={s.input} type="number" min={0}
                  value={form.disponiveis}
                  onChange={e => setForm({ ...form, disponiveis: Number(e.target.value) })} />
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>URL da capa</label>
              <input style={s.input} placeholder="https://... (link da imagem)"
                value={form.capa} onChange={e => setForm({ ...form, capa: e.target.value })} />
              <small style={{ fontSize: 11, color: '#8a7d68', marginTop: 4 }}>
                Cole o link de uma imagem do Google, Open Library ou qualquer URL pública
              </small>
            </div>
            <div style={s.field}>
              <label style={s.label}>Sinopse</label>
              <textarea style={{ ...s.input, height: 80, resize: 'vertical' }}
                placeholder="Breve descrição do livro"
                value={form.sinopse}
                onChange={e => setForm({ ...form, sinopse: e.target.value })} />
            </div>
            <div style={s.formBtns}>
              <button type="button" style={s.btnCancelar}
                onClick={() => { setMostrarForm(false); setEditando(null); }}>
                Cancelar
              </button>
              <button type="submit" style={s.btnSalvar}>
                {editando ? 'Salvar alterações' : 'Cadastrar livro'}
              </button>
            </div>
          </form>
        </div>
      )}

      {carregando ? (
        <div style={s.loading}>Carregando livros...</div>
      ) : livrosFiltrados.length === 0 ? (
        <div style={s.empty}>
          <p style={s.emptyText}>
            {busca ? 'Nenhum livro encontrado para essa busca' : 'Nenhum livro cadastrado ainda'}
          </p>
        </div>
      ) : (
        <div style={s.tabela}>
          <div style={s.tabelaHeader}>
            <span style={{ width: 52, flexShrink: 0 }}></span>
            <span style={{ flex: 3 }}>Título / Autor</span>
            <span style={{ flex: 1 }}>Gênero</span>
            <span style={{ flex: 1, textAlign: 'center' }}>Exemplares</span>
            <span style={{ flex: 1, textAlign: 'center' }}>Disponíveis</span>
            <span style={{ flex: 1, textAlign: 'center' }}>Ações</span>
          </div>
          {livrosFiltrados.map(livro => (
            <div key={livro.id} style={s.tabelaRow}>
              <div style={{ width: 52, flexShrink: 0 }}>
                {livro.capa ? (
                  <img
                    src={livro.capa}
                    alt={livro.titulo}
                    style={s.capa}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div style={s.capaPlaceholder}>📖</div>
                )}
              </div>
              <div style={{ flex: 3 }}>
                <div style={s.livroTitulo}>{livro.titulo}</div>
                <div style={s.livroAutor}>{livro.autor}</div>
              </div>
              <span style={{ flex: 1, fontSize: 13, color: '#8a7d68' }}>{livro.genero || '—'}</span>
              <span style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#1a1208' }}>
                {livro.totalExemplares || 1}
              </span>
              <span style={{ flex: 1, textAlign: 'center' }}>
                <span style={{
                  ...s.badge,
                  background: livro.disponiveis > 0 ? 'rgba(74,124,89,0.12)' : 'rgba(184,76,46,0.12)',
                  color: livro.disponiveis > 0 ? '#4a7c59' : '#b84c2e',
                }}>
                  {livro.disponiveis > 0 ? `✓ ${livro.disponiveis}` : '✗ 0'}
                </span>
              </span>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 8 }}>
                <button style={s.btnEditar} onClick={() => handleEditar(livro)}>✏️ Editar</button>
                <button style={s.btnExcluir} onClick={() => handleExcluir(livro)}>🗑️ Excluir</button>
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
  busca: { width: '100%', height: 44, borderRadius: 10, border: '1px solid #d9cfbe', background: '#fdfaf4', padding: '0 16px', fontSize: 14, color: '#1a1208', marginBottom: 24, outline: 'none', boxSizing: 'border-box' },
  formCard: { background: '#fdfaf4', border: '1px solid #d9cfbe', borderRadius: 16, padding: 28, marginBottom: 28 },
  formTitulo: { fontSize: 18, fontWeight: 700, color: '#1a1208', marginBottom: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 700, color: '#8a7d68', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { height: 44, borderRadius: 10, border: '1px solid #d9cfbe', background: '#f5efe3', padding: '0 14px', fontSize: 14, color: '#1a1208', outline: 'none', width: '100%', boxSizing: 'border-box' },
  formBtns: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 },
  btnCancelar: { background: 'transparent', border: '1px solid #d9cfbe', borderRadius: 10, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#8a7d68' },
  btnSalvar: { background: '#4a7c59', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  tabela: { background: '#fdfaf4', border: '1px solid #d9cfbe', borderRadius: 16, overflow: 'hidden' },
  tabelaHeader: { display: 'flex', alignItems: 'center', padding: '12px 20px', background: '#f5efe3', borderBottom: '1px solid #d9cfbe', fontSize: 11, fontWeight: 700, color: '#8a7d68', textTransform: 'uppercase', letterSpacing: 0.5 },
  tabelaRow: { display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #f0e8dc', gap: 12 },
  capa: { width: 40, height: 55, objectFit: 'cover', borderRadius: 6, border: '1px solid #d9cfbe', display: 'block' },
  capaPlaceholder: { width: 40, height: 55, borderRadius: 6, border: '1px solid #d9cfbe', background: '#f5efe3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 },
  livroTitulo: { fontSize: 14, fontWeight: 700, color: '#1a1208', marginBottom: 2 },
  livroAutor: { fontSize: 12, color: '#8a7d68' },
  badge: { padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
  btnEditar: { background: 'rgba(201,123,46,0.12)', color: '#c97b2e', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  btnExcluir: { background: 'rgba(184,76,46,0.12)', color: '#b84c2e', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  loading: { textAlign: 'center', padding: 60, color: '#8a7d68', fontSize: 16 },
  empty: { background: '#fdfaf4', border: '1px dashed #d9cfbe', borderRadius: 16, padding: 60, textAlign: 'center' },
  emptyText: { color: '#8a7d68', fontSize: 16 },
};
