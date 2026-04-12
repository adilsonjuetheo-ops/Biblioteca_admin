import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import jsPDF from 'jspdf';
import Toast from '../components/Toast';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
  dataDevolucao?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [livros, setLivros] = useState<Livro[]>([]);
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
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

  useEffect(() => {
    carregarDados(true);
    const refreshInterval = setInterval(() => { carregarDados(false); }, 15000);
    const clockInterval = setInterval(() => { setAgora(Date.now()); }, 60000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') carregarDados(false);
    };
    window.addEventListener('focus', handleVisibility);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(refreshInterval);
      clearInterval(clockInterval);
      window.removeEventListener('focus', handleVisibility);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  async function carregarDados(exibirSpinner = true) {
    if (exibirSpinner) { setCarregando(true); } else { setRefresandoSilencioso(true); }
    try {
      const [resLivros, resEmp] = await Promise.all([
        api.get('/livros'),
        api.get('/emprestimos'),
      ]);
      setLivros(resLivros.data);
      setEmprestimos(resEmp.data);
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
  const disponiveis = livros.filter(l => (l.disponiveis || 0) > 0);

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

  function formatarData(data?: string) {
    if (!data) return '—';
    return new Date(data).toLocaleDateString('pt-BR');
  }
  function exportarExcel() {
    const wb = XLSX.utils.book_new();
    const resumo = [
      { Indicador: 'Total de livros', Valor: livros.length },
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
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(livrosRows), 'Livros');
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
        ['Total de livros', String(livros.length)],
        ['Livros disponíveis', String(disponiveis.length)],
        ['Empréstimos ativos', String(ativos.length)],
        ['Em atraso', String(atrasados.length)],
        ['Total devolvidos', String(devolvidos.length)],
      ],
      headStyles: { fillColor: [201, 123, 46] },
    });
    let y = ((doc as any).lastAutoTable?.finalY || 80) + 24;
    doc.setFontSize(12);
    doc.setTextColor(26, 18, 8);
    doc.text('Livros', 40, y);
    autoTable(doc, {
      startY: y + 10,
      head: [['ID', 'Título', 'Autor', 'Gênero', 'Disp./Total']],
      body: livros.map(l => [String(l.id), l.titulo || '—', l.autor || '—', l.genero || '—', `${l.disponiveis || 0}/${l.totalExemplares || 0}`]),
      headStyles: { fillColor: [74, 124, 89] },
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
    { num: livros.length, label: 'Total de livros', icon: '📚', cor: '#c97b2e', link: '/livros', filtro: undefined },
    { num: ativos.length, label: 'Empréstimos ativos', icon: '📋', cor: '#4a7c59', link: '/emprestimos', filtro: 'retirado' },
    { num: atrasados.length, label: 'Em atraso', icon: '⚠️', cor: '#b84c2e', link: '/emprestimos', filtro: 'atrasado' },
    { num: disponiveis.length, label: 'Livros disponíveis', icon: '✓', cor: '#4a7c59', link: '/livros', filtro: undefined },
  ];
  return (
    <div style={s.page}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div style={s.topBar}>
        <div style={s.welcome}>
          <h1 style={s.titulo}>{saudacao}, {nome}! 👋</h1>
          <p style={s.subtitulo}>
            Aqui está o resumo da biblioteca hoje
            {refreshandoSilencioso && (
              <span style={{ marginLeft: 8, fontSize: 12, color: '#8a7d68' }}>↻ atualizando...</span>
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
        <>
          <div style={s.statsGrid}>
            {stats.map((st, i) => (
              <div key={i} style={{ ...s.statCard, cursor: 'pointer' }}
                onClick={() => navigate(st.link, { state: st.filtro ? { filtro: st.filtro } : undefined })}>
                <div style={s.statIcon}>{st.icon}</div>
                <div style={{ ...s.statNum, color: st.cor }}>{st.num}</div>
                <div style={s.statLabel}>{st.label}</div>
                <div style={{ fontSize: 11, color: '#c9b99a', marginTop: 6 }}>Ver →</div>
              </div>
            ))}
          </div>

          <div style={s.grid2}>
            <div style={s.card}>
              <h2 style={s.cardTitulo}>📊 Resumo do acervo</h2>
              <div style={s.resumoList}>
                {[
                  { label: 'Total de livros', valor: livros.length },
                  { label: 'Disponíveis', valor: disponiveis.length },
                  { label: 'Emprestados', valor: ativos.length },
                  { label: 'Em atraso', valor: atrasados.length },
                  { label: 'Total devolvidos', valor: devolvidos.length },
                ].map((item, i) => (
                  <div key={i} style={s.resumoItem}>
                    <span style={s.resumoLabel}>{item.label}</span>
                    <span style={{
                      ...s.resumoValor,
                      color: item.label === 'Em atraso' && item.valor > 0 ? '#b84c2e' : '#1a1208',
                    }}>{item.valor}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={s.card}>
              <h2 style={s.cardTitulo}>📋 Últimos empréstimos</h2>
              {emprestimos.length === 0 ? (
                <p style={s.empty}>Nenhum empréstimo registrado</p>
              ) : emprestimos.slice(0, 5).map((emp: any) => (
                <div key={emp.id} style={s.empItem}>
                  <div style={s.empId}>#{emp.id}</div>
                  <div style={s.empInfo}>
                    <div style={s.empTitulo}>{emp.livroTitulo || `Livro #${emp.livroId || emp.id}`}</div>
                    <div style={s.empStatus}>{emp.usuarioNome || emp.status}</div>
                  </div>
                  <span style={{
                    ...s.badge,
                    background: emp.status === 'devolvido' ? 'rgba(74,124,89,0.12)' :
                      emp.status === 'atrasado' ? 'rgba(184,76,46,0.12)' : 'rgba(201,123,46,0.12)',
                    color: emp.status === 'devolvido' ? '#4a7c59' :
                      emp.status === 'atrasado' ? '#b84c2e' : '#c97b2e',
                  }}>{emp.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={s.card}>
            <h2 style={s.cardTitulo}>📚 Livros mais emprestados</h2>
            {livrosMaisEmprestados.length === 0 ? (
              <p style={s.empty}>Nenhum empréstimo registrado para gerar ranking</p>
            ) : (
              <div style={s.rankingList}>
                {livrosMaisEmprestados.map((item, index) => (
                  <div key={item.titulo} style={s.rankingItem}>
                    <div style={s.rankingHeader}>
                      <span style={s.rankingTitulo}>{index + 1}. {item.titulo}</span>
                      <span style={s.rankingTotal}>{item.total} empréstimos</span>
                    </div>
                    <div style={s.rankingBarBg}>
                      <div style={{ ...s.rankingBar, width: `${(item.total / maiorTotalEmprestimos) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 32 },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24, flexWrap: 'wrap' },
  welcome: { marginBottom: 8 },
  titulo: { fontSize: 26, fontWeight: 700, color: '#1a1208', marginBottom: 4 },
  subtitulo: { fontSize: 15, color: '#8a7d68' },
  exportBtns: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  btnPdf: { background: '#4a6490', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnExcel: { background: '#4a7c59', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 },
  statCard: { background: '#fdfaf4', border: '1px solid #d9cfbe', borderRadius: 16, padding: 24, textAlign: 'center' },
  statIcon: { fontSize: 28, marginBottom: 10 },
  statNum: { fontSize: 32, fontWeight: 700, marginBottom: 6 },
  statLabel: { fontSize: 13, color: '#8a7d68', fontWeight: 500 },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 20 },
  card: { background: '#fdfaf4', border: '1px solid #d9cfbe', borderRadius: 16, padding: 24 },
  cardTitulo: { fontSize: 16, fontWeight: 700, color: '#1a1208', marginBottom: 20 },
  resumoList: { display: 'flex', flexDirection: 'column', gap: 12 },
  resumoItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0e8dc' },
  resumoLabel: { fontSize: 14, color: '#8a7d68' },
  resumoValor: { fontSize: 18, fontWeight: 700, color: '#1a1208' },
  empItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f0e8dc' },
  empId: { width: 36, height: 36, borderRadius: 10, background: '#f5efe3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#8a7d68', flexShrink: 0 },
  empInfo: { flex: 1 },
  empTitulo: { fontSize: 14, fontWeight: 600, color: '#1a1208' },
  empStatus: { fontSize: 12, color: '#8a7d68', marginTop: 2 },
  badge: { padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
  rankingList: { display: 'flex', flexDirection: 'column', gap: 14 },
  rankingItem: { display: 'flex', flexDirection: 'column', gap: 6 },
  rankingHeader: { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
  rankingTitulo: { color: '#1a1208', fontSize: 14, fontWeight: 600 },
  rankingTotal: { color: '#8a7d68', fontSize: 12, fontWeight: 700 },
  rankingBarBg: { width: '100%', height: 10, borderRadius: 999, background: '#efe6d8', overflow: 'hidden' },
  rankingBar: { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #c97b2e 0%, #4a7c59 100%)' },
  loading: { textAlign: 'center', padding: 60, color: '#8a7d68', fontSize: 16 },
  empty: { color: '#8a7d68', fontSize: 14, textAlign: 'center', marginTop: 20 },
};