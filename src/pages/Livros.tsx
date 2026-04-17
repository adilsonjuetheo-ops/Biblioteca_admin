import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import Paginacao from '../components/Paginacao';

const POR_PAGINA = 10;

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
  prateleira: string;
}

interface Sugestao {
  titulo: string;
  autor: string;
  isbn: string;
  sinopse: string;
  capa: string;
}

const FORM_VAZIO = {
  capa: '', titulo: '', autor: '', isbn: '', genero: '',
  sinopse: '', totalExemplares: 1, disponiveis: 1, prateleira: '',
};

export default function Livros() {
  const [livros, setLivros] = useState<Livro[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<Livro | null>(null);
  const [busca, setBusca] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [modal, setModal] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [pagina, setPagina] = useState(1);
  const [form, setForm] = useState({ ...FORM_VAZIO });

  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [buscandoLivro, setBuscandoLivro] = useState(false);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [tituloDigitado, setTituloDigitado] = useState(false);
  const tituloWrapRef = useRef<HTMLDivElement>(null);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
  }

  useEffect(() => {
    carregarLivros();
    const refreshInterval = setInterval(() => carregarLivros(false), 15000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') carregarLivros(false);
    };
    window.addEventListener('focus', handleVisibility);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('focus', handleVisibility);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Fecha sugestões ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (tituloWrapRef.current && !tituloWrapRef.current.contains(e.target as Node)) {
        setMostrarSugestoes(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Busca Google Books com debounce de 700ms
  useEffect(() => {
    if (!tituloDigitado || form.titulo.length < 3) {
      setSugestoes([]);
      setMostrarSugestoes(false);
      return;
    }
    const timer = setTimeout(async () => {
      setBuscandoLivro(true);
      try {
        const resp = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(form.titulo)}&maxResults=6`
        );
        const data = await resp.json();
        const items: Sugestao[] = (data.items || []).map((item: any) => {
          const v = item.volumeInfo;
          const isbn =
            (v.industryIdentifiers || []).find((id: any) => id.type === 'ISBN_13')?.identifier ||
            (v.industryIdentifiers || []).find((id: any) => id.type === 'ISBN_10')?.identifier || '';
          return {
            titulo: v.title || '',
            autor: (v.authors || []).join(', '),
            sinopse: v.description || '',
            isbn,
            capa: v.imageLinks?.thumbnail?.replace('http://', 'https://') || '',
          };
        });
        setSugestoes(items);
        setMostrarSugestoes(items.length > 0);
      } catch {
        // silently fail
      } finally {
        setBuscandoLivro(false);
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [form.titulo, tituloDigitado]);

  function selecionarSugestao(sug: Sugestao) {
    setForm(prev => ({
      ...prev,
      titulo: sug.titulo || prev.titulo,
      autor: sug.autor || prev.autor,
      isbn: sug.isbn || prev.isbn,
      sinopse: sug.sinopse || prev.sinopse,
      capa: sug.capa || prev.capa,
    }));
    setMostrarSugestoes(false);
    setSugestoes([]);
    setTituloDigitado(false);
  }

  async function carregarLivros(exibirSpinner = true) {
    try {
      if (exibirSpinner) setCarregando(true);
      const { data } = await api.get('/livros');
      setLivros(data);
    } catch {
      if (exibirSpinner) showToast('Erro ao carregar livros', 'error');
    } finally {
      setCarregando(false);
    }
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    const tituloNormalizado = form.titulo.trim().toLowerCase();
    const duplicado = livros.some(l =>
      l.titulo.trim().toLowerCase() === tituloNormalizado && l.id !== editando?.id
    );
    if (duplicado) {
      showToast('Já existe um livro com esse título no acervo.', 'error');
      return;
    }
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
      setForm({ ...FORM_VAZIO });
      setTituloDigitado(false);
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
      prateleira: livro.prateleira || '',
    });
    setTituloDigitado(false);
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
    setForm({ ...FORM_VAZIO });
    setTituloDigitado(false);
    setMostrarForm(true);
  }

  const livrosFiltrados = livros.filter(l =>
    l.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
    l.autor?.toLowerCase().includes(busca.toLowerCase())
  );
  const livrosPaginados = livrosFiltrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

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
        value={busca} onChange={e => { setBusca(e.target.value); setPagina(1); }} />

      {mostrarForm && (
        <div style={s.formCard}>
          <h2 style={s.formTitulo}>{editando ? '✏️ Editar livro' : '➕ Novo livro'}</h2>
          <form onSubmit={handleSalvar} style={s.form}>
            <div style={s.formGrid}>

              {/* Campo Título com busca automática */}
              <div style={s.field} ref={tituloWrapRef}>
                <label style={s.label}>
                  Título *
                  {buscandoLivro && (
                    <span style={s.buscandoTag}>🔍 buscando...</span>
                  )}
                  {!editando && !buscandoLivro && form.titulo.length >= 3 && tituloDigitado && (
                    <span style={s.dicaTag}>↓ selecione uma sugestão abaixo</span>
                  )}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    style={s.input}
                    required
                    placeholder="Digite o título para buscar automaticamente..."
                    value={form.titulo}
                    onChange={e => {
                      setTituloDigitado(true);
                      setForm({ ...form, titulo: e.target.value });
                    }}
                  />
                  {mostrarSugestoes && (
                    <div style={s.sugestoesList}>
                      <div style={s.sugestoesHeader}>
                        Resultados do Google Books — clique para preencher o formulário
                      </div>
                      {sugestoes.map((sug, i) => (
                        <button
                          key={i}
                          type="button"
                          style={s.sugestaoItem}
                          onClick={() => selecionarSugestao(sug)}
                        >
                          {sug.capa ? (
                            <img src={sug.capa} alt="" style={s.sugestaoCapa}
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <div style={s.sugestaoCapaPlaceholder}>📖</div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={s.sugestaoTitulo}>{sug.titulo}</div>
                            <div style={s.sugestaoAutor}>{sug.autor || 'Autor desconhecido'}</div>
                            {sug.sinopse && (
                              <div style={s.sugestaoSinopse}>
                                {sug.sinopse.slice(0, 100)}...
                              </div>
                            )}
                          </div>
                          <span style={s.sugestaoBtn}>Usar</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
                  <option>Aventura</option>
                  <option>Biografia</option>
                  <option>Conto</option>
                  <option>Crônica</option>
                  <option>Didático</option>
                  <option>Drama</option>
                  <option>Fábula</option>
                  <option>Fantasia</option>
                  <option>Ficção Científica</option>
                  <option>Filosofia</option>
                  <option>História</option>
                  <option>Horror</option>
                  <option>Humor</option>
                  <option>Infanto-Juvenil</option>
                  <option>Literatura Brasileira</option>
                  <option>Literatura Estrangeira</option>
                  <option>Mangá</option>
                  <option>Mistério</option>
                  <option>Poesia</option>
                  <option>Religião</option>
                  <option>Romance</option>
                  <option>Suspense</option>
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
              <div style={s.field}>
                <label style={s.label}>Prateleira</label>
                <input style={s.input} placeholder="Ex: A1, B3, Corredor 2..."
                  value={form.prateleira} onChange={e => setForm({ ...form, prateleira: e.target.value })} />
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>URL da capa</label>
              <input style={s.input} placeholder="https://... (preenchido automaticamente ou cole um link)"
                value={form.capa} onChange={e => setForm({ ...form, capa: e.target.value })} />
              {form.capa && (
                <img src={form.capa} alt="Pré-visualização da capa" style={s.capaPreview}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
            </div>
            <div style={s.field}>
              <label style={s.label}>Sinopse</label>
              <textarea style={{ ...s.input, height: 100, resize: 'vertical' }}
                placeholder="Preenchida automaticamente ou escreva aqui"
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
            <span style={{ flex: 1 }}>Prateleira</span>
            <span style={{ flex: 1, textAlign: 'center' }}>Exemplares</span>
            <span style={{ flex: 1, textAlign: 'center' }}>Disponíveis</span>
            <span style={{ flex: 1, textAlign: 'center' }}>Ações</span>
          </div>
          {livrosPaginados.map(livro => (
            <div key={livro.id} style={s.tabelaRow}>
              <div style={{ width: 52, flexShrink: 0 }}>
                {livro.capa ? (
                  <img src={livro.capa} alt={livro.titulo} style={s.capa}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div style={s.capaPlaceholder}>📖</div>
                )}
              </div>
              <div style={{ flex: 3 }}>
                <div style={s.livroTitulo}>{livro.titulo}</div>
                <div style={s.livroAutor}>{livro.autor}</div>
              </div>
              <span style={{ flex: 1, fontSize: 13, color: '#8a7d68' }}>{livro.genero || '—'}</span>
              <span style={{ flex: 1, fontSize: 13, color: '#8a7d68' }}>{livro.prateleira || '—'}</span>
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
      <Paginacao
        total={livrosFiltrados.length}
        porPagina={POR_PAGINA}
        paginaAtual={pagina}
        onChange={p => { setPagina(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
      />
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
  label: { fontSize: 12, fontWeight: 700, color: '#8a7d68', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 8 },
  buscandoTag: { fontSize: 11, color: '#c97b2e', fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
  dicaTag: { fontSize: 11, color: '#4a7c59', fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
  input: { height: 44, borderRadius: 10, border: '1px solid #d9cfbe', background: '#f5efe3', padding: '0 14px', fontSize: 14, color: '#1a1208', outline: 'none', width: '100%', boxSizing: 'border-box' },
  sugestoesList: {
    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
    background: '#fdfaf4', border: '1px solid #d9cfbe', borderRadius: 12,
    boxShadow: '0 8px 32px rgba(26,18,8,0.12)', marginTop: 4,
    maxHeight: 360, overflowY: 'auto',
  },
  sugestoesHeader: {
    padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#8a7d68',
    textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #f0e8dc',
  },
  sugestaoItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    width: '100%', padding: '12px 14px', background: 'none', border: 'none',
    borderBottom: '1px solid #f0e8dc', cursor: 'pointer', textAlign: 'left',
  },
  sugestaoCapa: { width: 36, height: 50, objectFit: 'cover', borderRadius: 4, flexShrink: 0 },
  sugestaoCapaPlaceholder: {
    width: 36, height: 50, borderRadius: 4, background: '#f5efe3',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
  },
  sugestaoTitulo: { fontSize: 13, fontWeight: 700, color: '#1a1208', marginBottom: 2 },
  sugestaoAutor: { fontSize: 12, color: '#8a7d68', marginBottom: 2 },
  sugestaoSinopse: { fontSize: 11, color: '#a89880', lineHeight: 1.4 },
  sugestaoBtn: {
    flexShrink: 0, fontSize: 12, fontWeight: 700, color: '#c97b2e',
    background: 'rgba(201,123,46,0.1)', borderRadius: 8, padding: '4px 10px',
  },
  capaPreview: { width: 60, height: 84, objectFit: 'cover', borderRadius: 8, border: '1px solid #d9cfbe', marginTop: 8 },
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
