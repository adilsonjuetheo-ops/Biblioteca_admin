import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Emprestimos() {
  const [emprestimos, setEmprestimos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [filtro, setFiltro] = useState('todos');
  const [buscaUsuario, setBuscaUsuario] = useState('');
  const [filtroAluno, setFiltroAluno] = useState('todos');
  const [filtroTurma, setFiltroTurma] = useState('todos');

  useEffect(() => { carregarEmprestimos(); }, []);

  async function carregarEmprestimos() {
    try {
      setCarregando(true);
      const { data } = await api.get('/emprestimos');
      setEmprestimos(data);
    } catch {
      alert('Erro ao carregar empréstimos');
    } finally {
      setCarregando(false);
    }
  }

  async function handleRetirar(id: number) {
    if (!confirm('Confirmar retirada física do livro?')) return;
    try {
      await api.patch(`/emprestimos/${id}/retirar`);
      alert('Retirada registrada com sucesso!');
      carregarEmprestimos();
    } catch {
      alert('Erro ao registrar retirada');
    }
  }

  async function handleDevolver(id: number) {
    if (!confirm('Confirmar devolução do livro?')) return;
    try {
      await api.patch(`/emprestimos/${id}/devolver`);
      alert('Devolução registrada com sucesso!');
      carregarEmprestimos();
    } catch {
      alert('Erro ao registrar devolução');
    }
  }

  function limparFiltros() {
    setBuscaUsuario('');
    setFiltro('todos');
    setFiltroAluno('todos');
    setFiltroTurma('todos');
  }

  const alunos = Array.from(
    new Set((emprestimos as any[]).map(e => e.usuarioNome).filter(Boolean))
  ).sort();

  const turmas = Array.from(
    new Set((emprestimos as any[]).map(e => e.usuarioTurma).filter(Boolean))
  ).sort();

  const filtrados = (emprestimos as any[]).filter(e => {
    const filtroOk = filtro === 'todos' || e.status === filtro;
    const alunoOk = filtroAluno === 'todos' || e.usuarioNome === filtroAluno;
    const turmaOk = filtroTurma === 'todos' || e.usuarioTurma === filtroTurma;
    const usuarioOk = !buscaUsuario ||
      e.usuarioNome?.toLowerCase().includes(buscaUsuario.toLowerCase()) ||
      e.usuarioMatricula?.toLowerCase().includes(buscaUsuario.toLowerCase());
    return filtroOk && alunoOk && turmaOk && usuarioOk;
  });

  const cores: any = {
    reservado: { bg: 'rgba(201,123,46,0.12)', color: '#c97b2e' },
    retirado: { bg: 'rgba(74,100,144,0.12)', color: '#4a6490' },
    devolvido: { bg: 'rgba(74,124,89,0.12)', color: '#4a7c59' },
    atrasado: { bg: 'rgba(184,76,46,0.12)', color: '#b84c2e' },
  };

  return (
    <div style={s.page}>
      <div style={s.topBar}>
        <div>
          <h1 style={s.titulo}>Empréstimos</h1>
          <p style={s.subtitulo}>{emprestimos.length} registros no total</p>
        </div>
      </div>

      <div style={s.filtros}>
        <input
          style={s.busca}
          placeholder="👤 Buscar usuário por nome ou matrícula..."
          value={buscaUsuario}
          onChange={e => setBuscaUsuario(e.target.value)}
        />
        <div style={s.selectsRow}>
          <select
            style={s.selectFiltro}
            value={filtroAluno}
            onChange={e => setFiltroAluno(e.target.value)}
          >
            <option value="todos">Todos os alunos</option>
            {alunos.map((nome: string) => (
              <option key={nome} value={nome}>{nome}</option>
            ))}
          </select>

          <select
            style={s.selectFiltro}
            value={filtroTurma}
            onChange={e => setFiltroTurma(e.target.value)}
          >
            <option value="todos">Todas as turmas</option>
            {turmas.map((turma: string) => (
              <option key={turma} value={turma}>{turma}</option>
            ))}
          </select>
        </div>
        <div style={s.filtroRow}>
          {['todos', 'reservado', 'retirado', 'atrasado', 'devolvido'].map(f => (
            <button key={f}
              style={{ ...s.filtroBtn, ...(filtro === f ? s.filtroAtivo : {}) }}
              onClick={() => setFiltro(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <button style={s.btnLimpar} onClick={limparFiltros}>
            Limpar filtros
          </button>
        </div>
      </div>

      {carregando ? (
        <div style={s.loading}>Carregando empréstimos...</div>
      ) : filtrados.length === 0 ? (
        <div style={s.empty}>
          <p style={s.emptyText}>Nenhum empréstimo encontrado</p>
        </div>
      ) : (
        <div style={s.tabela}>
          <div style={s.tabelaHeader}>
            <span style={{ flex: 3 }}>Livro</span>
            <span style={{ flex: 2 }}>Aluno</span>
            <span style={{ flex: 1 }}>Data reserva</span>
            <span style={{ flex: 1, textAlign: 'center' }}>Status</span>
            <span style={{ flex: 2, textAlign: 'center' }}>Ações</span>
          </div>
          {filtrados.map((emp: any) => (
            <div key={emp.id} style={s.tabelaRow}>
              <div style={{ flex: 3 }}>
                <div style={s.livroTitulo}>{emp.livroTitulo || `Livro #${emp.livroId}`}</div>
                <div style={s.livroAutor}>{emp.livroAutor || '—'}</div>
              </div>
              <div style={{ flex: 2 }}>
                <div style={s.livroTitulo}>{emp.usuarioNome || `Usuário #${emp.usuarioId}`}</div>
                <div style={s.livroAutor}>
                  {emp.usuarioTurma ? `Turma ${emp.usuarioTurma}` : ''}
                  {emp.usuarioMatricula ? ` · Mat. ${emp.usuarioMatricula}` : ''}
                </div>
              </div>
              <span style={{ flex: 1, fontSize: 13, color: '#8a7d68' }}>
                {emp.dataReserva ? new Date(emp.dataReserva).toLocaleDateString('pt-BR') : '—'}
              </span>
              <span style={{ flex: 1, textAlign: 'center' }}>
                <span style={{
                  ...s.badge,
                  background: cores[emp.status]?.bg || 'rgba(138,125,104,0.12)',
                  color: cores[emp.status]?.color || '#8a7d68',
                }}>
                  {emp.status}
                </span>
              </span>
              <div style={{ flex: 2, display: 'flex', justifyContent: 'center', gap: 8 }}>
                {emp.status === 'reservado' && (
                  <button style={s.btnRetirar} onClick={() => handleRetirar(emp.id)}>
                    📦 Confirmar retirada
                  </button>
                )}
                {emp.status === 'retirado' && (
                  <button style={s.btnDevolver} onClick={() => handleDevolver(emp.id)}>
                    ✓ Devolver
                  </button>
                )}
                {emp.status === 'devolvido' && (
                  <span style={{ fontSize: 12, color: '#8a7d68' }}>
                    Dev. {emp.dataDevolucao ? new Date(emp.dataDevolucao).toLocaleDateString('pt-BR') : '—'}
                  </span>
                )}
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
  filtros: { marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 },
  busca: { width: '100%', height: 44, borderRadius: 10, border: '1px solid #d9cfbe', background: '#fdfaf4', padding: '0 16px', fontSize: 14, color: '#1a1208', outline: 'none', boxSizing: 'border-box' },
  selectsRow: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 },
  selectFiltro: { height: 40, borderRadius: 10, border: '1px solid #d9cfbe', background: '#fdfaf4', padding: '0 12px', fontSize: 13, color: '#1a1208', outline: 'none' },
  filtroRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  filtroBtn: { padding: '8px 16px', borderRadius: 20, border: '1px solid #d9cfbe', background: '#fdfaf4', color: '#8a7d68', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  filtroAtivo: { background: '#1a1208', color: '#f5efe3', borderColor: '#1a1208' },
  btnLimpar: { padding: '8px 16px', borderRadius: 20, border: '1px solid rgba(184,76,46,0.35)', background: 'rgba(184,76,46,0.08)', color: '#b84c2e', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  tabela: { background: '#fdfaf4', border: '1px solid #d9cfbe', borderRadius: 16, overflow: 'hidden' },
  tabelaHeader: { display: 'flex', padding: '12px 20px', background: '#f5efe3', borderBottom: '1px solid #d9cfbe', fontSize: 11, fontWeight: 700, color: '#8a7d68', textTransform: 'uppercase', letterSpacing: 0.5 },
  tabelaRow: { display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #f0e8dc' },
  livroTitulo: { fontSize: 14, fontWeight: 700, color: '#1a1208', marginBottom: 2 },
  livroAutor: { fontSize: 12, color: '#8a7d68' },
  badge: { padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
  btnRetirar: { background: 'rgba(74,100,144,0.12)', color: '#4a6490', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  btnDevolver: { background: 'rgba(74,124,89,0.12)', color: '#4a7c59', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  loading: { textAlign: 'center', padding: 60, color: '#8a7d68', fontSize: 16 },
  empty: { background: '#fdfaf4', border: '1px dashed #d9cfbe', borderRadius: 16, padding: 60, textAlign: 'center' },
  emptyText: { color: '#8a7d68', fontSize: 16 },
};