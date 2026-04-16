import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const menus = [
  { path: '/dashboard', icon: '▪', label: 'Dashboard' },
  { path: '/livros',    icon: '▪', label: 'Acervo' },
  { path: '/emprestimos', icon: '▪', label: 'Empréstimos' },
  { path: '/usuarios',  icon: '▪', label: 'Usuários' },
  { path: '/comunicados', icon: '▪', label: 'Comunicados' },
];

const icones: Record<string, string> = {
  '/dashboard':   '📊',
  '/livros':      '📚',
  '/emprestimos': '🗂️',
  '/usuarios':    '👥',
  '/comunicados': '📢',
};

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hover, setHover] = useState<string | null>(null);

  function handleLogout() {
    localStorage.removeItem('admin_email');
    navigate('/');
  }

  return (
    <div style={s.sidebar}>
      <div style={s.logo}>
        <div style={s.logoImgWrap}>
          <img src="./logo.png" alt="Logo" style={s.logoImg}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
        <div>
          <div style={s.logoTitle}>Biblioteca Marlene de Souza Queiroz</div>
          <div style={s.logoSub}>Painel Admin</div>
        </div>
      </div>

      <nav style={s.nav}>
        {menus.map(menu => {
          const ativo = location.pathname === menu.path;
          const emHover = hover === menu.path;
          return (
            <button
              key={menu.path}
              style={{
                ...s.menuItem,
                ...(ativo ? s.menuAtivo : {}),
                ...(!ativo && emHover ? s.menuHover : {}),
              }}
              onClick={() => navigate(menu.path)}
              onMouseEnter={() => setHover(menu.path)}
              onMouseLeave={() => setHover(null)}
            >
              <span style={{ ...s.menuIcon, fontSize: 20 }}>{icones[menu.path]}</span>
              <span>{menu.label}</span>
              {ativo && <span style={s.ativoIndicador} />}
            </button>
          );
        })}
      </nav>

      <div style={s.divisor} />

      <button
        style={{
          ...s.logoutBtn,
          ...(hover === 'logout' ? s.logoutHover : {}),
        }}
        onClick={handleLogout}
        onMouseEnter={() => setHover('logout')}
        onMouseLeave={() => setHover(null)}
      >
        <span style={{ fontSize: 18 }}>🚪</span>
        <span>Sair</span>
      </button>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 220,
    height: '100vh',
    background: '#2d1f0e',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    flexShrink: 0,
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36, padding: '0 8px' },
  logoImgWrap: { width: 44, height: 44, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, flexShrink: 0 },
  logoImg: { width: 34, height: 34, objectFit: 'contain' },
  logoTitle: { fontSize: 12, lineHeight: 1.25, fontWeight: 700, color: '#f5efe3' },
  logoSub: { fontSize: 11, color: '#c9a97a', marginTop: 2 },
  nav: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minHeight: 0, overflowY: 'auto' },
  menuItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '11px 12px', borderRadius: 10, border: 'none',
    background: 'transparent', color: 'rgba(245,239,227,0.75)',
    fontSize: 14, fontWeight: 500, cursor: 'pointer',
    width: '100%', textAlign: 'left', position: 'relative',
    transition: 'background 0.15s, color 0.15s',
  },
  menuHover: {
    background: 'rgba(255,255,255,0.06)',
    color: '#f5efe3',
  },
  menuAtivo: {
    background: 'rgba(201,123,46,0.18)',
    color: '#f0a84a',
    fontWeight: 700,
  },
  ativoIndicador: {
    position: 'absolute', right: 10, top: '50%',
    transform: 'translateY(-50%)',
    width: 6, height: 6, borderRadius: '50%',
    background: '#c97b2e',
  },
  menuIcon: { width: 26, textAlign: 'center', flexShrink: 0 },
  divisor: {
    height: 1,
    background: 'rgba(245,239,227,0.1)',
    margin: '12px 8px',
    flexShrink: 0,
  },
  logoutBtn: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '11px 12px', borderRadius: 10,
    border: '1px solid rgba(245,239,227,0.12)',
    background: 'transparent', color: 'rgba(245,239,227,0.55)',
    fontSize: 14, cursor: 'pointer', width: '100%',
    flexShrink: 0, transition: 'background 0.15s, color 0.15s',
  },
  logoutHover: {
    background: 'rgba(184,76,46,0.15)',
    color: '#f0a84a',
    borderColor: 'rgba(184,76,46,0.3)',
  },
};
