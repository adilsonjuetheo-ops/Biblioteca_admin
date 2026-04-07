import { useNavigate, useLocation } from 'react-router-dom';

const menus = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/livros', icon: '📚', label: 'Acervo' },
  { path: '/emprestimos', icon: '📋', label: 'Empréstimos' },
  { path: '/usuarios', icon: '👥', label: 'Usuários' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    localStorage.removeItem('admin_email');
    navigate('/');
  }

  return (
    <div style={s.sidebar}>
      <div style={s.logo}>
        <img src="./logo.png" alt="Logo" style={s.logoImg} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <div>
          <div style={s.logoTitle}>Biblioteca</div>
          <div style={s.logoSub}>Painel Admin</div>
        </div>
      </div>

      <nav style={s.nav}>
        {menus.map(menu => (
          <button key={menu.path}
            style={{ ...s.menuItem, ...(location.pathname === menu.path ? s.menuAtivo : {}) }}
            onClick={() => navigate(menu.path)}>
            <span style={s.menuIcon}>{menu.icon}</span>
            <span>{menu.label}</span>
          </button>
        ))}
      </nav>

      <button style={s.logoutBtn} onClick={handleLogout}>
        <span>🚪</span>
        <span>Sair</span>
      </button>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  sidebar: { width: 220, minHeight: '100vh', background: '#1a1208', display: 'flex', flexDirection: 'column', padding: '24px 16px', flexShrink: 0 },
  logo: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, padding: '0 8px' },
  logoImg: { width: 40, height: 40, objectFit: 'contain' },
  logoTitle: { fontSize: 14, fontWeight: 700, color: '#f5efe3' },
  logoSub: { fontSize: 11, color: '#8a7d68', marginTop: 1 },
  nav: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1 },
  menuItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', background: 'transparent', color: 'rgba(245,239,227,0.5)', fontSize: 14, fontWeight: 500, cursor: 'pointer', width: '100%', textAlign: 'left' },
  menuAtivo: { background: 'rgba(201,123,46,0.15)', color: '#f0a84a' },
  menuIcon: { fontSize: 18, width: 24 },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(245,239,227,0.1)', background: 'transparent', color: 'rgba(245,239,227,0.4)', fontSize: 14, cursor: 'pointer', width: '100%' },
};