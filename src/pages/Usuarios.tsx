import { useState, useEffect } from 'react';
import api from '../services/api';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  matricula: string;
  turma: string;
  perfil: string;
  criadoEm: string;
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroPerfil, setFiltroPerfil] = useState('todos');

  const [form, setForm] = useState({
    nome: '', email: '', senha: '',
    matricula: '', turma: '', perfil: 'aluno',
  });

  useEffect(() => { carregarUsuarios(); }, []);

  async function carregarUsuarios() {
    try {
      setCarregando(true);
      const { data } = await api.get('/usuarios');
      setUsuarios(data);
    } catch {
      alert('Erro ao carregar usuários');
    } finally {
      setCarregando(false);
    }
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome || !form.email || !form.senha) {
      alert('Nome, e-mail e senha são obrigatórios'); return;
    }
    try {
      await api.post('/usuarios', form);
      alert(`${form.perfil === 'aluno' ? 'Aluno' : 'Professor'} cadastrado com sucesso!`);
      setMostrarForm(false);
      setForm({ nome: '', email: '', senha: '', matricula: '', turma: '', perfil: 'aluno' });
      carregarUsuarios();
    } catch (err: any) {
      alert(err.response?.data?.erro || 'Erro ao cadastrar usuário');
    }
  }

  async function handleExcluir(id: number, nome: string) {
    if (!confirm(`Deseja excluir o usuário ${nome}?`)) return;
    try {
      await api.delete(`/usuarios/${id}`);
      alert('Usuário removido com sucesso!');
      carregarUsuarios();
    } catch {
      alert('Erro ao remover usuário');
    }
  }

  const usuariosFiltrados = usuarios.filter(u => {
    const textoOk = u.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      u.email?.toLowerCase().includes(busca.toLowerCase()) ||
      u.matricula?.toLowerCase().includes(busca.toLowerCase());
    const perfilOk = filtroPerfil === 'todos' || u.perfil === filtroPerfil;
    return textoOk && perfilOk;
  });

  const coresPerfil: any = {
    aluno: { bg: 'rgba(74,124,89,0.12)', color: '#4a7c59' },
    professor: { bg: 'rgba(201,123,46,0.12)', color: '#c97b2e' },
    bibliotecario: { bg: 'rgba(74,100,144,0.12)', color: '#4a6490' },
    coordenacao: { bg: 'rgba(184,76,46,0.12)', color: '#b84c2e' },
  };

  return (
    <div style={s.page}>
      <div style={s.topBar}>
        <div>
          <h1 style={s.titulo}>Usuários</h1>
          <p style={s.subtitulo}>{usuarios.length} usuários cadastrados</p>
        </div>
        <button style={s.btnNovo} onClick={() => setMostrarForm(!mostrarForm)}>
          {mostrarForm ? '✕ Fechar' : '+ Cadastrar usuário'}
        </button>
      </div>

      {mostrarForm && (
        <div style={s.formCard}>
          <h2 style={s.formTitulo}>➕ Novo usuário</h2>
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
                <label style={s.label}>Senha *</label>
                <input style={s.input} required type="password" placeholder="Mínimo 6 caracteres"
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
              {form.perfil === 'aluno' && (
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
              <button type="button" style={s.btnCancelar}
                onClick={() => setMostrarForm(false)}>Cancelar</button>
              <button type="submit" style={s.btnSalvar}>Cadastrar usuário</button>
            </div>
          </form>
        </div>
      )}

      <div style={s.filtros}>
        <input style={s.busca} placeholder="🔍  Buscar por nome, e-mail ou matrícula..."
          value={busca} onChange={e => setBusca(e.target.value)} />
        <div style={s.filtroRow}>
          {['todos', 'aluno', 'professor', 'bibliotecario', 'coordenacao'].map(p => (
            <button key={p} style={{ ...s.filtroBtn, ...(filtroPerfil === p ? s.filtroAtivo : {}) }}
              onClick={() => setFiltroPerfil(p)}>
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
            <span style={{ flex: 1, textAlign: 'center' }}>Ações</span>
          </div>
          {usuariosFiltrados.map(u => (
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
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <button style={s.btnExcluir} onClick={() => handleExcluir(u.id, u.nome)}>
                  🗑 Excluir
                </button>
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
  tabela: { background: '#fdfaf4', border: '1px solid #d9cfbe', borderRadius: 16, overflow: 'hidden' },
  tabelaHeader: { display: 'flex', padding: '12px 20px', background: '#f5efe3', borderBottom: '1px solid #d9cfbe', fontSize: 11, fontWeight: 700, color: '#8a7d68', textTransform: 'uppercase', letterSpacing: 0.5 },
  tabelaRow: { display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #f0e8dc' },
  userNome: { fontSize: 14, fontWeight: 700, color: '#1a1208', marginBottom: 2 },
  userEmail: { fontSize: 12, color: '#8a7d68' },
  badge: { padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
  btnExcluir: { background: 'rgba(184,76,46,0.12)', color: '#b84c2e', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  loading: { textAlign: 'center', padding: 60, color: '#8a7d68', fontSize: 16 },
  empty: { background: '#fdfaf4', border: '1px dashed #d9cfbe', borderRadius: 16, padding: 60, textAlign: 'center' },
  emptyText: { color: '#8a7d68', fontSize: 16 },
};