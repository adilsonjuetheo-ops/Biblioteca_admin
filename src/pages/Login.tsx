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
      `}</style>
      <div style={s.page}>
        <div style={s.card}>

          {/* Cabeçalho */}
          <div style={s.cabecalho}>
            <div style={s.logoWrap}>
              <img src="./logo.png" alt="Logo" style={s.logo}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
            <h1 style={s.title}>Biblioteca Marlene de Souza Queiroz</h1>
            <p style={s.subtitle}>E. E. Cel. José Venâncio de Souza</p>
            <span style={s.painelBadge}>Painel Administrativo</span>
          </div>

          <div style={s.divisor} />

          {/* Formulário */}
          <form onSubmit={handleLogin} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>E-mail institucional</label>
              <input
                style={{
                  ...s.input,
                  borderColor: emailFocado ? '#c97b2e' : '#d9cfbe',
                  boxShadow: emailFocado ? '0 0 0 3px rgba(201,123,46,0.15)' : 'none',
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
                  style={{
                    ...s.input,
                    paddingRight: 44,
                    borderColor: senhaFocada ? '#c97b2e' : '#d9cfbe',
                    boxShadow: senhaFocada ? '0 0 0 3px rgba(201,123,46,0.15)' : 'none',
                    width: '100%',
                    boxSizing: 'border-box',
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
  page: {
    minHeight: '100vh',
    background: '#f5efe3',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 16,
  },
  card: {
    background: '#fdfaf4',
    borderRadius: 20,
    padding: '36px 40px 40px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 4px 6px rgba(26,18,8,0.04), 0 10px 40px rgba(26,18,8,0.10)',
    animation: 'fadeSlideUp 0.35s ease',
  },
  cabecalho: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoWrap: { display: 'flex', justifyContent: 'center', marginBottom: 14 },
  logo: { width: 88, height: 88, objectFit: 'contain' },
  title: { fontSize: 18, fontWeight: 700, color: '#1a1208', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#4a7c59', textAlign: 'center', fontWeight: 600, marginBottom: 10 },
  painelBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: '#8a7d68',
    background: 'rgba(138,125,104,0.1)',
    borderRadius: 20,
    padding: '4px 12px',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  divisor: {
    height: 1,
    background: '#ede5d8',
    marginBottom: 28,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#5a4f3f',
  },
  input: {
    height: 44,
    borderRadius: 10,
    border: '1px solid #d9cfbe',
    background: '#f5efe3',
    padding: '0 14px',
    fontSize: 14,
    color: '#1a1208',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  olho: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#8a7d68',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    lineHeight: 1,
  },
  btn: {
    height: 48,
    borderRadius: 12,
    background: '#c97b2e',
    color: '#1a1208',
    fontWeight: 700,
    fontSize: 15,
    border: 'none',
    transition: 'opacity 0.15s',
    marginTop: 4,
  },
  spinner: {
    display: 'inline-block',
    width: 16,
    height: 16,
    border: '2px solid rgba(26,18,8,0.2)',
    borderTopColor: '#1a1208',
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
  },
  erroIcone: {
    fontSize: 14,
    flexShrink: 0,
  },
  footer: {
    fontSize: 12,
    color: '#b0a494',
    textAlign: 'center',
  },
};
