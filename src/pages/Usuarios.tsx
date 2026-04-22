import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import Paginacao from '../components/Paginacao';

const POR_PAGINA = 10;

interface Usuario {
  id: number;
  nome: string;
  email: string;
  matricula: string;
  turma: string;
  perfil: string;
  criadoEm: string;
}

interface Emprestimo {
  id: number;
  livroId: number;
  livroTitulo: string;
  livroAutor: string;
  status: string;
  dataReserva: string;
  dataDevolucao: string;
  renovado: boolean;
}

const formVazio = { nome: '', email: '', senha: '', matricula: '', turma: '', perfil: 'aluno' };

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroPerfil, setFiltroPerfil] = useState('todos');
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
  const [historicoUsuario, setHistoricoUsuario] = useState<Emprestimo[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [modal, setModal] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [pagina, setPagina] = useState(1);
  const [form, setForm] = useState(formVazio);
  const historicoCacheRef = useRef<Emprestimo[] | null>(null);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
  }

  useEffect(() => { carregarUsuarios(); }, []);

  async function carregarUsuarios() {
    try {
      setCarregando(true);
      const { data } = await api.get('/usuarios');
      setUsuarios(data);
    } catch {
      showToast('Erro ao carregar usuários', 'error');
    } finally {
      setCarregando(false);
    }
  }

  async function carregarHistorico(usuario: Usuario) {
    try {
      setCarregandoHistorico(true);
      setUsuarioSelecionado(usuario);
      let emprestimos = historicoCacheRef.current;
      if (!emprestimos) {
        const { data } = await api.get('/emprestimos');
        emprestimos = data;
        historicoCacheRef.current = data;
      }
      setHistoricoUsuario(emprestimos.filter((e: any) => e.usuarioId === usuario.id));
    } catch {
      showToast('Erro ao carregar histórico', 'error');
    } finally {
      setCarregandoHistorico(false);
    }
  }

  function handleEditar(u: Usuario) {
    setEditando(u);
    setForm({ nome: u.nome, email: u.email, senha: '', matricula: u.matricula || '', turma: u.turma || '', perfil: u.perfil });
    setMostrarForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function fecharForm() {
    setMostrarForm(false);
    setEditando(null);
    setForm(formVazio);
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome || !form.email) {
      showToast('Nome e e-mail são obrigatórios', 'error');
      return;
    }
    if (!editando && form.senha.length < 6) {
      showToast('Senha deve ter pelo menos 6 caracteres', 'error');
      return;
    }
    try {
      if (editando) {
        const payload: any = { nome: form.nome, email: form.email, matricula: form.matricula, turma: form.turma, perfil: form.perfil };
        if (form.senha.length >= 6) payload.senha = form.senha;
        await api.put(`/usuarios/${editando.id}`, payload);
        showToast('Usuário atualizado com sucesso!', 'success');
      } else {
        await api.post('/usuarios', form);
        showToast('Usuário cadastrado com sucesso!', 'success');
      }
      fecharForm();
      carregarUsuarios();
    } catch (err: any) {
      showToast(err.response?.data?.erro || 'Erro ao salvar usuário', 'error');
    }
  }

  function handleExcluir(id: number, nome: string) {
    setModal({
      message: `Deseja excluir o usuário ${nome}? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        setModal(null);
        try {
          await api.delete(`/usuarios/${id}`);
          showToast('Usuário removido com sucesso!', 'success');
          carregarUsuarios();
        } catch {
          showToast('Erro ao remover usuário', 'error');
        }
      },
    });
  }

  const usuariosFiltrados = usuarios.filter(u => {
    const textoOk = u.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      u.email?.toLowerCase().includes(busca.toLowerCase()) ||
      u.matricula?.toLowerCase().includes(busca.toLowerCase());
    const perfilOk = filtroPerfil === 'todos' || u.perfil === filtroPerfil;
    return textoOk && perfilOk;
  });
  const usuariosPaginados = usuariosFiltrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const coresPerfil: any = {
    aluno: { bg: 'rgba(74,124,89,0.12)', color: '#4a7c59' },
    professor: { bg: 'rgba(201,123,46,0.12)', color: '#c97b2e' },
    bibliotecario: { bg: 'rgba(74,100,144,0.12)', color: '#4a6490' },
    coordenacao: { bg: 'rgba(184,76,46,0.12)', color: '#b84c2e' },
  };

  const coresStatus: any = {
    reservado: { bg: 'rgba(201,123,46,0.12)', color: '#c97b2e' },
    retirado: { bg: 'rgba(74,100,144,0.12)', color: '#4a6490' },
    devolvido: { bg: 'rgba(74,124,89,0.12)', color: '#4a7c59' },
    atrasado: { bg: 'rgba(184,76,46,0.12)', color: '#b84c2e' },
  };

  const ativos = historicoUsuario.filter(e => e.status === 'reservado' || e.status === 'retirado');
  const devolvidos = historicoUsuario.filter(e => e.status === 'devolvido');

  if (usuarioSelecionado) {
    return (
      <div style={s.page}>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div style={s.topBar}>
          <div>
            <button style={s.btnVoltar} onClick={() => { setUsuarioSelecionado(null); setHistoricoUsuario([]); }}>
              ← Voltar
            </button>
            <h1 style={s.titulo}>Histórico de {usuarioSelecionado.nome}</h1>
            <p style={s.subtitulo}>
              {usuarioSelecionado.email}
              {usuarioSelecionado.turma ? ` · Turma ${usuarioSelecionado.turma}` : ''}
              {usuarioSelecionado.matricula ? ` · Mat. ${usuarioSelecionado.matricula}` : ''}
            </p>
          </div>
        </div>

        <div style={s.statsRow}>
          {[
            { num: historicoUsuario.length, label: 'Total de empréstimos', cor: '#1a1208' },
            { num: ativos.length, label: 'Empréstimos ativos', cor: '#c97b2e' },
            { num: devolvidos.length, label: 'Livros devolvidos', cor: '#4a7c59' },
          ].map((st, i) => (
            <div key={i} style={s.statCard}>
              <div style={{ ...s.statNum, color: st.cor }}>{st.num}</div>
              <div style={s.statLabel}>{st.label}</div>
            </div>
          ))}
        </div>

        {carregandoHistorico ? (
          <div style={s.loading}>Carregando histórico...</div>
        ) : historicoUsuario.length === 0 ? (
          <div style={s.empty}>
            <p style={s.emptyText}>Nenhum empréstimo registrado para este usuário</p>
          </div>
        ) : (
          <>
            {ativos.length > 0 && (
              <>
                <h2 style={s.secaoTitulo}>📋 Empréstimos ativos</h2>
                <div style={s.tabela}>
                  <div style={s.tabelaHeader}>
                    <span style={{ flex: 3 }}>Livro</span>
                    <span style={{ flex: 1 }}>Data reserva</span>
                    <span style={{ flex: 1, textAlign: 'center' }}>Status</span>
                    <span style={{ flex: 1, textAlign: 'center' }}>Renovado</span>
                  </div>
                  {ativos.map(emp => (
                    <div key={emp.id} style={s.tabelaRow}>
                      <div style={{ flex: 3 }}>
                        <div style={s.livroTitulo}>{emp.livroTitulo || `Livro #${emp.livroId}`}</div>
                        <div style={s.livroAutor}>{emp.livroAutor || '—'}</div>
                      </div>
                      <span style={{ flex: 1, fontSize: 13, color: '#8a7d68' }}>
                        {emp.dataReserva ? new Date(emp.dataReserva).toLocaleDateString('pt-BR') : '—'}
                      </span>
                      <span style={{ flex: 1, textAlign: 'center' }}>
                        <span style={{ ...s.badge, background: coresStatus[emp.status]?.bg, color: coresStatus[emp.status]?.color }}>
                          {emp.status}
                        </span>
                      </span>
                      <span style={{ flex: 1, textAlign: 'center', fontSize: 13, color: emp.renovado ? '#4a7c59' : '#8a7d68' }}>
                        {emp.renovado ? '✓ Sim' : '✗ Não'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {devolvidos.length > 0 && (
              <>
                <h2 style={{ ...s.secaoTitulo, marginTop: 24 }}>📚 Histórico de devoluções</h2>
                <div style={s.tabela}>
                  <div style={s.tabelaHeader}>
                    <span style={{ flex: 3 }}>Livro</span>
                    <span style={{ flex: 1 }}>Data reserva</span>
                    <span style={{ flex: 1 }}>Data devolução</span>
                    <span style={{ flex: 1, textAlign: 'center' }}>Renovado</span>
                  </div>
                  {devolvidos.map(emp => (
                    <div key={emp.id} style={s.tabelaRow}>
                      <div style={{ flex: 3 }}>
                        <div style={s.livroTitulo}>{emp.livroTitulo || `Livro #${emp.livroId}`}</div>
                        <div style={s.livroAutor}>{emp.livroAutor || '—'}</div>
                      </div>
                      <span style={{ flex: 1, fontSize: 13, color: '#8a7d68' }}>
                        {emp.dataReserva ? new Date(emp.dataReserva).toLocaleDateString('pt-BR') : '—'}
                      </span>
                      <span style={{ flex: 1, fontSize: 13, color: '#4a7c59' }}>
                        {emp.dataDevolucao ? new Date(emp.dataDevolucao).toLocaleDateString('pt-BR') : '—'}
                      </span>
                      <span style={{ flex: 1, textAlign: 'center', fontSize: 13, color: emp.renovado ? '#4a7c59' : '#8a7d68' }}>
                        {emp.renovado ? '✓ Sim' : '✗ Não'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div style={s.page}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {modal && <ConfirmModal message={modal.message} onConfirm={modal.onConfirm} onCancel={() => setModal(null)} />}

      <div style={s.topBar}>
        <div>
          <h1 style={s.titulo}>Usuários</h1>
          <p style={s.subtitulo}>{usuarios.length} usuários cadastrados</p>
        </div>
        <button style={s.btnNovo} onClick={() => mostrarForm && !editando ? fecharForm() : (fecharForm(), setMostrarForm(true))}>
          {mostrarForm ? '✕ Fechar' : '+ Cadastrar usuário'}
        </button>
      </div>

      {mostrarForm && (
        <div style={s.formCard}>
          <h2 style={s.formTitulo}>{editando ? '✏️ Editar usuário' : '➕ Novo usuário'}</h2>
          <form onSubmit={handleSalvar} style={s.form}>
            <div style={s.formGrid}>
              <div style={s.field}>
                <label style={s.label}>Nome completo *</label>
                <input style={s.input} required placeholder="Nome completo"
                  value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div style={s.field}>
                <label style={s.label}>E-mail *</label>
                <input style={s.input} required type="email" placeholder="E-mail institucional"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div style={s.field}>
                <label style={s.label}>{editando ? 'Nova senha (deixe em branco para manter)' : 'Senha *'}</label>
                <input style={s.input} type="password"
                  required={!editando}
                  placeholder={editando ? 'Deixe em branco para não alterar' : 'Mínimo 6 caracteres'}
                  value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Perfil</label>
                <select style={s.input}
                  value={form.perfil} onChange={e => setForm({ ...form, perfil: e.target.value })}>
                  <option value="aluno">Aluno</option>
                  <option value="professor">Professor</option>
                  <option value="bibliotecario">Bibliotecário</option>
                  <option value="coordenacao">Coordenação</option>
                </select>
              </div>
              {(form.perfil === 'aluno' || form.perfil === 'professor') && (
                <>
                  <div style={s.field}>
                    <label style={s.label}>Matrícula</label>
                    <input style={s.input} placeholder="Número de matrícula"
                      value={form.matricula} onChange={e => setForm({ ...form, matricula: e.target.value })} />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Turma</label>
                    <input style={s.input} placeholder="Ex: 3A, 2B"
                      value={form.turma} onChange={e => setForm({ ...form, turma: e.target.value })} />
                  </div>
                </>
              )}
            </div>
            <div style={s.formBtns}>
              <button type="button" style={s.btnCancelar} onClick={fecharForm}>Cancelar</button>
              <button type="submit" style={s.btnSalvar}>
                {editando ? 'Salvar alterações' : 'Cadastrar usuário'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={s.filtros}>
        <input style={s.busca} placeholder="🔍  Buscar por nome, e-mail ou matrícula..."
          value={busca} onChange={e => { setBusca(e.target.value); setPagina(1); }} />
        <div style={s.filtroRow}>
          {['todos', 'aluno', 'professor', 'bibliotecario', 'coordenacao'].map(p => (
            <button key={p} style={{ ...s.filtroBtn, ...(filtroPerfil === p ? s.filtroAtivo : {}) }}
              onClick={() => { setFiltroPerfil(p); setPagina(1); }}>
              {p === 'todos' ? 'Todos' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {carregando ? (
        <div style={s.loading}>Carregando usuários...</div>
      ) : usuariosFiltrados.length === 0 ? (
        <div style={s.empty}>
          <p style={s.emptyText}>Nenhum usuário encontrado</p>
        </div>
      ) : (
        <div style={s.tabela}>
          <div style={s.tabelaHeader}>
            <span style={{ flex: 3 }}>Nome / E-mail</span>
            <span style={{ flex: 1 }}>Matrícula</span>
            <span style={{ flex: 1 }}>Turma</span>
            <span style={{ flex: 1, textAlign: 'center' }}>Perfil</span>
            <span style={{ flex: 2, textAlign: 'center' }}>Ações</span>
          </div>
          {usuariosPaginados.map(u => (
            <div key={u.id} style={s.tabelaRow}>
              <div style={{ flex: 3 }}>
                <div style={s.userNome}>{u.nome}</div>
                <div style={s.userEmail}>{u.email}</div>
              </div>
              <span style={{ flex: 1, fontSize: 13, color: '#8a7d68' }}>{u.matricula || '—'}</span>
              <span style={{ flex: 1, fontSize: 13, color: '#8a7d68' }}>{u.turma || '—'}</span>
              <span style={{ flex: 1, textAlign: 'center' }}>
                <span style={{
                  ...s.badge,
                  background: coresPerfil[u.perfil]?.bg || 'rgba(138,125,104,0.12)',
                  color: coresPerfil[u.perfil]?.color || '#8a7d68',
                }}>
                  {u.perfil}
                </span>
              </span>
              <div style={{ flex: 2, display: 'flex', justifyContent: 'center', gap: 8 }}>
                <button style={s.btnHistorico} onClick={() => carregarHistorico(u)}>📋 Histórico</button>
                <button style={s.btnEditar} onClick={() => handleEditar(u)}>✏️ Editar</button>
                <button style={s.btnExcluir} onClick={() => handleExcluir(u.id, u.nome)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Paginacao
        total={usuariosFiltrados.length}
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
  btnVoltar: { background: 'transparent', border: 'none', color: '#c97b2e', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 8 },
  secaoTitulo: { fontSize: 16, fontWeight: 700, color: '#1a1208', marginBottom: 12 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 },
  statCard: { background: '#fdfaf4', border: '1px solid #d9cfbe', borderRadius: 16, padding: 20, textAlign: 'center' },
  statNum: { fontSize: 32, fontWeight: 700, marginBottom: 6 },
  statLabel: { fontSize: 13, color: '#8a7d68', fontWeight: 500 },
  formCard: { background: '#fdfaf4', border: '1px solid #d9cfbe', borderRadius: 16, padding: 28, marginBottom: 24 },
  formTitulo: { fontSize: 18, fontWeight: 700, color: '#1a1208', marginBottom: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 700, color: '#8a7d68', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { height: 44, borderRadius: 10, border: '1px solid #d9cfbe', background: '#f5efe3', padding: '0 14px', fontSize: 14, color: '#1a1208', outline: 'none', width: '100%', boxSizing: 'border-box' },
  formBtns: { display: 'flex', gap: 12, justifyContent: 'flex-end' },
  btnCancelar: { background: 'transparent', border: '1px solid #d9cfbe', borderRadius: 10, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#8a7d68' },
  btnSalvar: { background: '#4a7c59', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  filtros: { marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 },
  busca: { width: '100%', height: 44, borderRadius: 10, border: '1px solid #d9cfbe', background: '#fdfaf4', padding: '0 16px', fontSize: 14, color: '#1a1208', outline: 'none', boxSizing: 'border-box' },
  filtroRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  filtroBtn: { padding: '8px 16px', borderRadius: 20, border: '1px solid #d9cfbe', background: '#fdfaf4', color: '#8a7d68', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  filtroAtivo: { background: '#1a1208', color: '#f5efe3', borderColor: '#1a1208' },
  tabela: { background: '#fdfaf4', border: '1px solid #d9cfbe', borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  tabelaHeader: { display: 'flex', padding: '12px 20px', background: '#f5efe3', borderBottom: '1px solid #d9cfbe', fontSize: 11, fontWeight: 700, color: '#8a7d68', textTransform: 'uppercase', letterSpacing: 0.5 },
  tabelaRow: { display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #f0e8dc' },
  userNome: { fontSize: 14, fontWeight: 700, color: '#1a1208', marginBottom: 2 },
  userEmail: { fontSize: 12, color: '#8a7d68' },
  livroTitulo: { fontSize: 14, fontWeight: 700, color: '#1a1208', marginBottom: 2 },
  livroAutor: { fontSize: 12, color: '#8a7d68' },
  badge: { padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
  btnHistorico: { background: 'rgba(201,123,46,0.12)', color: '#c97b2e', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  btnEditar: { background: 'rgba(74,100,144,0.12)', color: '#4a6490', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  btnExcluir: { background: 'rgba(184,76,46,0.12)', color: '#b84c2e', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 14, cursor: 'pointer' },
  loading: { textAlign: 'center', padding: 60, color: '#8a7d68', fontSize: 16 },
  empty: { background: '#fdfaf4', border: '1px dashed #d9cfbe', borderRadius: 16, padding: 60, textAlign: 'center' },
  emptyText: { color: '#8a7d68', fontSize: 16 },
};
