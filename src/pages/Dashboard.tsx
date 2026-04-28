import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import jsPDF from 'jspdf';
import Toast from '../components/Toast';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import useSmartRefresh from '../hooks/useSmartRefresh';

interface Livro {
  id: number;
  titulo?: string;
  autor?: string;
  genero?: string;
  disponiveis?: number;
  totalExemplares?: number;
}

interface Emprestimo {
  id: number;
  status?: string;
  livroTitulo?: string;
  usuarioNome?: string;
  dataReserva?: string;
  dataRetirada?: string;
  dataDevolucao?: string;
}

interface DashboardResumoResponse {
  resumo?: {
    totalLivros?: number;
    livrosDisponiveis?: number;
    emprestimosAtivos?: number;
    emprestimosAtrasados?: number;
    emprestimosDevolvidos?: number;
  };
  ultimosEmprestimos?: Emprestimo[];
  livrosMaisEmprestados?: Array<{
    id?: number;
    titulo?: string;
    total?: number;
  }>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [livros, setLivros] = useState<Livro[]>([]);
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [emprestimosGrafico, setEmprestimosGrafico] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [refreshandoSilencioso, setRefresandoSilencioso] = useState(false);
  const [agora, setAgora] = useState(Date.now());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
  }

  const email = localStorage.getItem('admin_email') || '';
  const nome = email.split('@')[0]
    .replace(/\./g, ' ')
    .split(' ')
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');

  const horaAtual = Number(new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    hour12: false,
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(agora)));
  const saudacao = horaAtual < 12 ? 'Bom dia' : horaAtual < 18 ? 'Boa tarde' : 'Boa noite';

  useSmartRefresh(carregarDados, { intervalMs: 45000, minRefetchGapMs: 8000 });

  useEffect(() => {
    const clockInterval = setInterval(() => { setAgora(Date.now()); }, 60000);
    return () => { clearInterval(clockInterval); };
  }, []);

  async function carregarDados(exibirSpinner = true) {
    if (exibirSpinner) { setCarregando(true); } else { setRefresandoSilencioso(true); }
    try {
      const resEmpGrafico = await api.get('/emprestimos');
      setEmprestimosGrafico(resEmpGrafico.data);

      try {
        const { data } = await api.get<DashboardResumoResponse>('/dashboard/resumo');
        if (!data?.resumo) throw new Error('Resumo indisponivel');

        setLivros([
          {
            id: 1,
            titulo: 'Resumo do acervo',
            disponiveis: data.resumo.livrosDisponiveis || 0,
            totalExemplares: data.resumo.totalLivros || 0,
          },
        ]);
        setEmprestimos(data.ultimosEmprestimos || []);
        return;
      } catch (err: any) {
        const status = err?.response?.status;
        if (status && status !== 404 && status !== 403) {
          throw err;
        }
      }

      const [resLivros, resEmp] = await Promise.all([
        api.get('/livros'),
        api.get('/emprestimos'),
      ]);
      setLivros(resLivros.data);
      setEmprestimos(resEmp.data);
      setEmprestimosGrafico(resEmp.data);
    } catch {
      if (exibirSpinner) showToast('Erro ao carregar dados', 'error');
    } finally {
      setCarregando(false);
      setRefresandoSilencioso(false);
    }
  }

  const ativos = emprestimos.filter(e => e.status === 'reservado' || e.status === 'retirado');
  const atrasados = emprestimos.filter(e => e.status === 'atrasado');
  const devolvidos = emprestimos.filter(e => e.status === 'devolvido');
  const totalLivros = livros.length === 1 && livros[0]?.titulo === 'Resumo do acervo'
    ? livros[0].totalExemplares || 0
    : livros.length;
  const disponiveis = livros.length === 1 && livros[0]?.titulo === 'Resumo do acervo'
    ? Array.from({ length: livros[0].disponiveis || 0 }, (_, index) => ({ id: index + 1 }))
    : livros.filter(l => (l.disponiveis || 0) > 0);

  const livrosMaisEmprestados = Object.entries(
    emprestimos.reduce((acc, emp: any) => {
      const titulo = emp.livroTitulo || `Livro #${emp.livroId || emp.id}`;
      acc[titulo] = (acc[titulo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([titulo, total]) => ({ titulo, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const maiorTotalEmprestimos = livrosMaisEmprestados[0]?.total || 1;

  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth();
  const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const emprestimosporMes = nomesMeses.map((mes, i) => ({
    mes,
    total: emprestimosGrafico.filter(e => {
      const dataStr = e.dataReserva || e.dataRetirada || e.criadoEm;
      if (!dataStr) return false;
      const d = new Date(dataStr);
      return d.getFullYear() === anoAtual && d.getMonth() === i;
    }).length,
  }));
  const maxPorMes = Math.max(...emprestimosporMes.map(m => m.total), 1);
  const totalAno = emprestimosporMes.reduce((sum, m) => sum + m.total, 0);
  const todosMesZero = totalAno === 0;

  function formatarData(data?: string) {
    if (!data) return '—';
    return new Date(data).toLocaleDateString('pt-BR');
  }

  function exportarExcel() {
    const wb = XLSX.utils.book_new();
    const resumo = [
      { Indicador: 'Total de livros', Valor: totalLivros },
      { Indicador: 'Livros disponíveis', Valor: disponiveis.length },
      { Indicador: 'Empréstimos ativos', Valor: ativos.length },
      { Indicador: 'Em atraso', Valor: atrasados.length },
      { Indicador: 'Total devolvidos', Valor: devolvidos.length },
      { Indicador: 'Gerado em', Valor: new Date().toLocaleString('pt-BR') },
    ];
    const livrosRows = livros.map(l => ({
      ID: l.id, Titulo: l.titulo || '—', Autor: l.autor || '—',
      Genero: l.genero || '—', Exemplares: l.totalExemplares || 0, Disponiveis: l.disponiveis || 0,
    }));
    const emprestimosRows = emprestimos.map(e => ({
      ID: e.id, Livro: e.livroTitulo || '—', Aluno: e.usuarioNome || '—',
      Status: e.status || '—', Reserva: formatarData(e.dataReserva), Devolucao: formatarData(e.dataDevolucao),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumo), 'Resumo');
    if (livros.length !== 1 || livros[0]?.titulo !== 'Resumo do acervo') {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(livrosRows), 'Livros');
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(emprestimosRows), 'Emprestimos');
    XLSX.writeFile(wb, `relatorio-biblioteca-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function exportarPdf() {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const dataGeracao = new Date().toLocaleString('pt-BR');
    doc.setFontSize(16);
    doc.text('Relatório Administrativo da Biblioteca', 40, 44);
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text(`Gerado em: ${dataGeracao}`, 40, 62);
    autoTable(doc, {
      startY: 80,
      head: [['Indicador', 'Valor']],
      body: [
        ['Total de livros', String(totalLivros)],
        ['Livros disponíveis', String(disponiveis.length)],
        ['Empréstimos ativos', String(ativos.length)],
        ['Em atraso', String(atrasados.length)],
        ['Total devolvidos', String(devolvidos.length)],
      ],
      headStyles: { fillColor: [200, 144, 46] },
    });
    let y = ((doc as any).lastAutoTable?.finalY || 80) + 24;
    doc.setFontSize(12);
    doc.setTextColor(44, 31, 18);
    doc.text('Livros', 40, y);
    autoTable(doc, {
      startY: y + 10,
      head: [['ID', 'Título', 'Autor', 'Gênero', 'Disp./Total']],
      body: livros.length === 1 && livros[0]?.titulo === 'Resumo do acervo'
        ? [[String(totalLivros), 'Resumo do acervo', '—', '—', `${disponiveis.length}/${totalLivros}`]]
        : livros.map(l => [String(l.id), l.titulo || '—', l.autor || '—', l.genero || '—', `${l.disponiveis || 0}/${l.totalExemplares || 0}`]),
      headStyles: { fillColor: [44, 122, 75] },
      styles: { fontSize: 9 },
    });
    y = ((doc as any).lastAutoTable?.finalY || y) + 24;
    if (y > 760) { doc.addPage(); y = 44; }
    doc.setFontSize(12);
    doc.text('Empréstimos', 40, y);
    autoTable(doc, {
      startY: y + 10,
      head: [['ID', 'Livro', 'Aluno', 'Status', 'Reserva', 'Devolução']],
      body: emprestimos.map(e => [String(e.id), e.livroTitulo || '—', e.usuarioNome || '—', e.status || '—', formatarData(e.dataReserva), formatarData(e.dataDevolucao)]),
      headStyles: { fillColor: [74, 100, 144] },
      styles: { fontSize: 9 },
    });
    doc.save(`relatorio-biblioteca-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  const stats = [
    { num: totalLivros,        label: 'Total de livros',    unidade: 'títulos',     cor: '#C8902E', link: '/livros',      filtro: undefined },
    { num: ativos.length,      label: 'Empréstimos ativos', unidade: 'em curso',    cor: '#3A7BC8', link: '/emprestimos', filtro: 'retirado' },
    { num: atrasados.length,   label: 'Em atraso',          unidade: 'ocorrências', cor: '#C84040', link: '/emprestimos', filtro: 'atrasado' },
    { num: disponiveis.length, label: 'Livros disponíveis', unidade: 'livres',      cor: '#2C7A4B', link: '/livros',      filtro: undefined },
  ];

  const resumoItems = [
    { label: 'Total de livros',  valor: totalLivros,        cor: '#C8902E', pct: 1 },
    { label: 'Disponíveis',      valor: disponiveis.length, cor: '#2C7A4B', pct: totalLivros > 0 ? disponiveis.length / totalLivros : 0 },
    { label: 'Emprestados',      valor: ativos.length,      cor: '#3A7BC8', pct: totalLivros > 0 ? ativos.length / totalLivros : 0 },
    { label: 'Em atraso',        valor: atrasados.length,   cor: '#C84040', pct: totalLivros > 0 ? atrasados.length / totalLivros : 0 },
    { label: 'Total devolvidos', valor: devolvidos.length,  cor: '#8B7355', pct: totalLivros > 0 ? devolvidos.length / totalLivros : 0 },
  ];

  return (
    <div style={s.page}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Top bar */}
      <div style={s.topBar}>
        <div>
          <h1 style={s.titulo}>{saudacao}, {nome}! 👋</h1>
          <p style={s.subtitulo}>
            Aqui está o resumo da biblioteca hoje
            {refreshandoSilencioso && (
              <span style={{ marginLeft: 8, fontSize: 12, color: '#8B7355' }}>↻ atualizando...</span>
            )}
          </p>
        </div>
        <div style={s.exportBtns}>
          <button style={s.btnPdf} onClick={exportarPdf}>Exportar PDF</button>
          <button style={s.btnExcel} onClick={exportarExcel}>Exportar Excel</button>
        </div>
      </div>

      {carregando ? (
        <div style={s.loading}>Carregando dados...</div>
      ) : (
        <div style={s.content}>
          {/* KPI cards */}
          <div style={s.statsGrid}>
            {stats.map((st, i) => (
              <div
                key={i}
                style={{ ...s.statCard, borderLeftColor: st.cor, cursor: 'pointer' }}
                onClick={() => navigate(st.link, { state: st.filtro ? { filtro: st.filtro } : undefined })}
              >
                <div style={s.statLabel}>{st.label}</div>
                <div style={s.statNumRow}>
                  <span style={{ ...s.statNum, color: st.cor }}>{st.num}</span>
                  <span style={s.statUnidade}>{st.unidade}</span>
                </div>
                <div style={s.statLink}>Ver →</div>
              </div>
            ))}
          </div>

          {/* Two-column panels */}
          <div style={s.grid2}>
            {/* Resumo do acervo */}
            <div style={s.card}>
              <div style={s.cardHeader}>
                <span>📊</span>
                <span style={s.cardTitulo}>Resumo do acervo</span>
              </div>
              <div style={s.cardBody}>
                {resumoItems.map((item, i) => (
                  <div key={i} style={s.resumoItem}>
                    <span style={s.resumoLabel}>{item.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={s.resumoBarBg}>
                        <div style={{ ...s.resumoBarFill, width: `${item.pct * 100}%`, background: item.cor }} />
                      </div>
                      <span style={{
                        ...s.resumoValor,
                        color: item.label === 'Em atraso' && item.valor > 0 ? '#C84040' : '#2C1F12',
                      }}>{item.valor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Últimos empréstimos */}
            <div style={s.card}>
              <div style={s.cardHeader}>
                <span>📋</span>
                <span style={s.cardTitulo}>Últimos empréstimos</span>
              </div>
              <div style={s.cardBody}>
                {emprestimos.length === 0 ? (
                  <p style={s.empty}>Nenhum empréstimo registrado</p>
                ) : emprestimos.slice(0, 5).map((emp: any) => (
                  <div key={emp.id} style={s.empItem}>
                    <div style={s.empId}>#{emp.id}</div>
                    <div style={s.empInfo}>
                      <div style={s.empTitulo}>{emp.livroTitulo || `Livro #${emp.livroId || emp.id}`}</div>
                      <div style={s.empNome}>{emp.usuarioNome || '—'}</div>
                    </div>
                    <span style={{
                      ...s.badge,
                      background: emp.status === 'devolvido' ? 'rgba(44,122,75,0.12)' :
                        emp.status === 'atrasado' ? 'rgba(200,64,64,0.12)' : 'rgba(200,144,46,0.12)',
                      color: emp.status === 'devolvido' ? '#2C7A4B' :
                        emp.status === 'atrasado' ? '#C84040' : '#A06A1A',
                    }}>{emp.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ranking */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <span>🏆</span>
              <span style={s.cardTitulo}>Livros mais emprestados</span>
            </div>
            <div style={s.cardBody}>
              {livrosMaisEmprestados.length === 0 ? (
                <p style={s.empty}>Nenhum empréstimo registrado para gerar ranking</p>
              ) : (
                <div style={s.rankingList}>
                  {livrosMaisEmprestados.map((item, index) => {
                    const medalhas = ['🥇', '🥈', '🥉'];
                    const icone = medalhas[index] ?? `${index + 1}.`;
                    const isPrimeiro = index === 0;
                    const label = `${item.total} empréstimo${item.total !== 1 ? 's' : ''}`;
                    return (
                      <div key={item.titulo} style={s.rankingItem}>
                        <div style={s.rankingHeader}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: medalhas[index] ? 18 : 13, flexShrink: 0, minWidth: 26, textAlign: 'center' }}>
                              {icone}
                            </span>
                            <span style={{
                              ...s.rankingTitulo,
                              fontSize: isPrimeiro ? 15 : 13,
                              fontWeight: isPrimeiro ? 700 : 500,
                              color: isPrimeiro ? '#2C1F12' : '#5a4a3a',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>{item.titulo}</span>
                          </div>
                          <span style={{
                            ...s.rankingBadge,
                            background: isPrimeiro ? 'rgba(200,144,46,0.15)' : 'rgba(44,122,75,0.1)',
                            color: isPrimeiro ? '#C8902E' : '#2C7A4B',
                          }}>{label}</span>
                        </div>
                        <div style={{ paddingLeft: 36 }}>
                          <div style={s.rankingBarBg}>
                            <div style={{
                              ...s.rankingBar,
                              width: `${(item.total / maiorTotalEmprestimos) * 100}%`,
                              background: isPrimeiro
                                ? 'linear-gradient(90deg, #e8943a 0%, #C8902E 100%)'
                                : 'linear-gradient(90deg, #C8902E 0%, #2C7A4B 100%)',
                            }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Gráfico mensal */}
          <div style={{ ...s.card, marginTop: 0 }}>
            <div style={s.cardHeader}>
              <span>📈</span>
              <div style={{ display: 'flex', flex: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={s.cardTitulo}>Empréstimos por mês — {anoAtual}</span>
                <span style={{ fontSize: 13, color: '#8B7355', fontWeight: 500 }}>
                  Total: <span style={{ color: '#C8902E', fontWeight: 700 }}>{totalAno}</span>
                </span>
              </div>
            </div>
            <div style={s.cardBody}>
              {todosMesZero ? (
                <p style={s.empty}>Sem empréstimos registrados em {anoAtual}</p>
              ) : (
                <div style={s.graficoWrap}>
                  {emprestimosporMes.map(({ mes, total }, i) => {
                    const isAtual = i === mesAtual;
                    return (
                      <div key={mes} style={s.graficoColuna} title={`${mes}: ${total} empréstimo${total !== 1 ? 's' : ''}`}>
                        <span style={{ ...s.graficoValor, visibility: total > 0 ? 'visible' : 'hidden' }}>{total}</span>
                        <div style={s.graficoEixo}>
                          <div style={{
                            ...s.graficoBarraFill,
                            height: total === 0 ? 2 : `${Math.max((total / maxPorMes) * 100, 4)}%`,
                            opacity: total === 0 ? 0.25 : 1,
                            background: isAtual
                              ? 'linear-gradient(180deg, #e8943a 0%, #2C7A4B 100%)'
                              : 'linear-gradient(180deg, #C8902E 0%, #2C7A4B 100%)',
                            boxShadow: isAtual && total > 0 ? '0 2px 12px rgba(200,144,46,0.4)' : 'none',
                            borderRadius: total === 0 ? 2 : '6px 6px 3px 3px',
                          }} />
                        </div>
                        <span style={{
                          ...s.graficoMes,
                          color: isAtual ? '#C8902E' : '#8B7355',
                          fontWeight: isAtual ? 700 : 500,
                        }}>{mes}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { background: '#F5F0E8', minHeight: '100vh', display: 'flex', flexDirection: 'column' },

  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    gap: 16, flexWrap: 'wrap',
    background: '#FAF6EE',
    borderBottom: '1px solid rgba(100,60,20,0.1)',
    padding: '16px 24px',
    flexShrink: 0,
  },
  titulo: { fontSize: 22, fontWeight: 600, color: '#2C1F12', marginBottom: 3 },
  subtitulo: { fontSize: 14, color: '#8B7355' },
  exportBtns: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  btnPdf: {
    background: 'transparent', border: '1px solid #C8902E', color: '#C8902E',
    borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
  },
  btnExcel: {
    background: '#2C7A4B', border: '1px solid #2C7A4B', color: '#fff',
    borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
  },

  content: { padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 },
  statCard: {
    background: '#FAF6EE',
    border: '0.5px solid rgba(100,60,20,0.12)',
    borderLeft: '3px solid',
    borderRadius: 12,
    padding: '16px 18px',
    boxSizing: 'border-box',
  },
  statLabel: { fontSize: 11, color: '#8B7355', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 },
  statNumRow: { display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 },
  statNum: { fontSize: 26, fontWeight: 500, lineHeight: 1 },
  statUnidade: { fontSize: 13, color: '#8B7355' },
  statLink: { fontSize: 11, color: '#C8902E', fontWeight: 500 },

  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 },

  card: { background: '#FAF6EE', border: '0.5px solid rgba(100,60,20,0.12)', borderRadius: 12, overflow: 'hidden' },
  cardHeader: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '13px 16px',
    borderBottom: '0.5px solid rgba(100,60,20,0.1)',
  },
  cardTitulo: { fontSize: 14, fontWeight: 600, color: '#2C1F12' },
  cardBody: { padding: 16 },

  resumoItem: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 0', borderBottom: '0.5px solid rgba(100,60,20,0.07)',
  },
  resumoLabel: { fontSize: 13, color: '#8B7355' },
  resumoValor: { fontSize: 14, fontWeight: 500, color: '#2C1F12', minWidth: 24, textAlign: 'right' },
  resumoBarBg: { width: 100, height: 4, borderRadius: 2, background: 'rgba(100,60,20,0.1)', overflow: 'hidden', flexShrink: 0 },
  resumoBarFill: { height: '100%', borderRadius: 2, transition: 'width 0.5s ease' },

  empItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '9px 0', borderBottom: '0.5px solid rgba(100,60,20,0.07)',
  },
  empId: {
    width: 28, height: 28, borderRadius: 8,
    background: 'rgba(200,144,46,0.12)', color: '#C8902E',
    fontSize: 11, fontWeight: 500,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  empInfo: { flex: 1, minWidth: 0 },
  empTitulo: { fontSize: 13, fontWeight: 500, color: '#2C1F12', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  empNome: { fontSize: 11, color: '#8B7355', marginTop: 1 },
  badge: { padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 500, flexShrink: 0 },

  rankingList: { display: 'flex', flexDirection: 'column', gap: 14 },
  rankingItem: { display: 'flex', flexDirection: 'column', gap: 7 },
  rankingHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  rankingTitulo: { color: '#2C1F12', fontSize: 14, fontWeight: 500 },
  rankingBadge: { flexShrink: 0, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 },
  rankingBarBg: { width: '100%', height: 7, borderRadius: 999, background: 'rgba(100,60,20,0.1)', overflow: 'hidden' },
  rankingBar: { height: '100%', borderRadius: 999, transition: 'width 0.5s ease' },

  loading: { textAlign: 'center', padding: 60, color: '#8B7355', fontSize: 16 },
  empty: { color: '#8B7355', fontSize: 14, textAlign: 'center', padding: '20px 0' },

  graficoWrap: { display: 'flex', alignItems: 'flex-end', gap: 6, height: 200, paddingTop: 8 },
  graficoColuna: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', cursor: 'default' },
  graficoValor: { fontSize: 11, fontWeight: 700, color: '#C8902E', marginBottom: 4, minHeight: 16, lineHeight: '16px' },
  graficoEixo: { flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  graficoBarraFill: { width: '100%', transition: 'height 0.5s ease' },
  graficoMes: { fontSize: 11, color: '#8B7355', marginTop: 6, fontWeight: 500 },
};
