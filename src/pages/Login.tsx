import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'https://bibliotecaapi-production-7ee0.up.railway.app';
const DOMINIO = '@educacao.mg.gov.br';

function IconeOlho({ aberto }: { aberto: boolean }) {
  return aberto ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [emailFocado, setEmailFocado] = useState(false);
  const [senhaFocada, setSenhaFocada] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (!email.endsWith(DOMINIO)) {
      setErro(`Use seu e-mail institucional (${DOMINIO})`);
      return;
    }
    if (senha.length < 6) {
      setErro('Senha deve ter pelo menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/usuarios/login`, { email, senha });
      if (data.perfil !== 'bibliotecario' && data.perfil !== 'coordenacao') {
        setErro('Acesso restrito ao bibliotecário ou coordenação');
        return;
      }
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_email', email);
      navigate('/dashboard');
    } catch (err: any) {
      setErro(err?.response?.data?.erro || 'E-mail ou senha incorretos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .login-page {
          position: relative;
          min-height: 100vh;
          background: #F0EBE0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 20px;
        }
        .login-page::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(150,100,40,0.07) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }
        .login-input::placeholder {
          color: #B8A899;
        }
        .login-btn:hover:not(:disabled) {
          background: #B07A22 !important;
        }
      `}</style>

      <div className="login-page">
        <div style={s.card}>

          {/* Cabeçalho */}
          <div style={s.cabecalho}>
            <div style={s.logoWrap}>
              <img
                src="./logo.png"
                alt="Logo"
                style={s.logo}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <h1 style={s.title}>Biblioteca Marlene de Souza Queiroz</h1>
            <p style={s.subtitle}>E. E. Cel. José Venâncio de Souza</p>
            <span style={s.painelBadge}>Painel Administrativo</span>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>E-mail institucional</label>
              <input
                className="login-input"
                style={{
                  ...s.input,
                  borderColor: emailFocado ? '#C8902E' : 'rgba(100,60,20,0.18)',
                  background: emailFocado ? '#ffffff' : '#FAF6EE',
                }}
                type="email"
                autoComplete="email"
                placeholder={`seu.nome${DOMINIO}`}
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setEmailFocado(true)}
                onBlur={() => setEmailFocado(false)}
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Senha</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="login-input"
                  style={{
                    ...s.input,
                    paddingRight: 42,
                    width: '100%',
                    boxSizing: 'border-box',
                    borderColor: senhaFocada ? '#C8902E' : 'rgba(100,60,20,0.18)',
                    background: senhaFocada ? '#ffffff' : '#FAF6EE',
                  }}
                  type={mostrarSenha ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  onFocus={() => setSenhaFocada(true)}
                  onBlur={() => setSenhaFocada(false)}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(v => !v)}
                  style={s.olho}
                  tabIndex={-1}
                  title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <IconeOlho aberto={mostrarSenha} />
                </button>
              </div>
            </div>

            <button
              className="login-btn"
              style={{
                ...s.btn,
                opacity: loading ? 0.8 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={s.spinner} />
                  Entrando...
                </span>
              ) : 'Entrar no painel'}
            </button>

            {erro && (
              <div style={s.erro}>
                <span style={s.erroIcone}>⚠</span>
                {erro}
              </div>
            )}
          </form>
        </div>

        <p style={s.footer}>Acesso restrito a funcionários autorizados</p>
      </div>
    </>
  );
}

const s: Record<string, React.CSSProperties> = {
  card: {
    background: '#FFFFFF',
    borderRadius: 20,
    padding: '40px 44px 36px',
    width: '100%',
    maxWidth: 460,
    border: '0.5px solid rgba(100,60,20,0.12)',
    animation: 'fadeSlideUp 0.35s ease',
    position: 'relative',
    zIndex: 1,
    boxSizing: 'border-box',
  },
  cabecalho: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderBottom: '1px solid rgba(100,60,20,0.08)',
    paddingBottom: 24,
    marginBottom: 28,
  },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 20,
    background: '#FAF6EE',
    border: '1px solid rgba(100,60,20,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  logo: { maxWidth: 68, maxHeight: 68, objectFit: 'contain' },
  title: {
    fontSize: 20,
    fontWeight: 600,
    color: '#2C1F12',
    textAlign: 'center',
    lineHeight: 1.25,
    letterSpacing: '-0.3px',
    marginBottom: 6,
    maxWidth: 300,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 500,
    color: '#2C7A4B',
    textAlign: 'center',
    marginBottom: 8,
  },
  painelBadge: {
    fontSize: 10,
    fontWeight: 500,
    color: '#A06A1A',
    background: 'rgba(200,144,46,0.1)',
    border: '0.5px solid rgba(200,144,46,0.25)',
    borderRadius: 20,
    padding: '4px 12px',
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 0 },
  field: { display: 'flex', flexDirection: 'column', marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: 500,
    color: '#6B5240',
    display: 'block',
    marginBottom: 7,
    letterSpacing: '0.2px',
  },
  input: {
    height: 48,
    borderRadius: 10,
    border: '1px solid rgba(100,60,20,0.18)',
    background: '#FAF6EE',
    padding: '0 14px',
    fontSize: 14,
    color: '#2C1F12',
    outline: 'none',
    transition: 'border-color 0.15s, background 0.15s',
    width: '100%',
    boxSizing: 'border-box',
  },
  olho: {
    position: 'absolute',
    right: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#B8A899',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    lineHeight: 1,
  },
  btn: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    background: '#C8902E',
    color: '#ffffff',
    fontWeight: 500,
    fontSize: 15,
    letterSpacing: '0.2px',
    border: 'none',
    marginTop: 8,
    transition: 'background 0.15s',
  },
  spinner: {
    display: 'inline-block',
    width: 16,
    height: 16,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    flexShrink: 0,
  },
  erro: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(184,76,46,0.08)',
    color: '#b84c2e',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 13,
    border: '1px solid rgba(184,76,46,0.15)',
    marginTop: 12,
  },
  erroIcone: {
    fontSize: 14,
    flexShrink: 0,
  },
  footer: {
    fontSize: 11,
    color: '#B8A899',
    textAlign: 'center',
    marginTop: 20,
    position: 'relative',
    zIndex: 1,
  },
};
