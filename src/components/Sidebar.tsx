import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const menus = [
  { path: '/dashboard',    icon: '📊', label: 'Dashboard' },
  { path: '/livros',       icon: '📚', label: 'Acervo' },
  { path: '/emprestimos',  icon: '🗂️', label: 'Empréstimos' },
  { path: '/usuarios',     icon: '👥', label: 'Usuários' },
  { path: '/comunicados',  icon: '📢', label: 'Comunicados' },
];

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
              <span style={s.menuIcon}>{menu.icon}</span>
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
    background: '#2C1F12',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 12px',
    flexShrink: 0,
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36, padding: '0 4px' },
  logoImgWrap: { width: 44, height: 44, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, flexShrink: 0 },
  logoImg: { width: 34, height: 34, objectFit: 'contain' },
  logoTitle: { fontSize: 12, lineHeight: 1.25, fontWeight: 700, color: '#F0E6D0' },
  logoSub: { fontSize: 11, color: '#C8902E', marginTop: 2 },
  nav: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minHeight: 0, overflowY: 'auto' },
  menuItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 12px', borderRadius: 10, border: 'none',
    background: 'transparent', color: 'rgba(240,230,208,0.65)',
    fontSize: 14, fontWeight: 400, cursor: 'pointer',
    width: '100%', textAlign: 'left', position: 'relative',
    transition: 'background 0.15s, color 0.15s',
  },
  menuHover: {
    background: 'rgba(255,255,255,0.06)',
    color: '#F0E6D0',
  },
  menuAtivo: {
    background: 'rgba(200,144,46,0.18)',
    color: '#E8A83A',
    fontWeight: 500,
  },
  ativoIndicador: {
    position: 'absolute', right: 10, top: '50%',
    transform: 'translateY(-50%)',
    width: 6, height: 6, borderRadius: '50%',
    background: '#C8902E',
    marginLeft: 'auto',
  },
  menuIcon: { width: 24, textAlign: 'center', flexShrink: 0, fontSize: 18 },
  divisor: {
    borderTop: '0.5px solid rgba(255,255,255,0.08)',
    margin: '12px 4px',
    flexShrink: 0,
  },
  logoutBtn: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 12px', borderRadius: 10,
    border: '1px solid rgba(240,230,208,0.1)',
    background: 'transparent', color: 'rgba(240,230,208,0.5)',
    fontSize: 14, cursor: 'pointer', width: '100%',
    flexShrink: 0, transition: 'background 0.15s, color 0.15s',
  },
  logoutHover: {
    background: 'rgba(200,64,64,0.12)',
    color: '#F0E6D0',
    borderColor: 'rgba(200,64,64,0.25)',
  },
};
