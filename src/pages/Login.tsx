import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'https://bibliotecaapi-production-7ee0.up.railway.app';
const DOMINIO = '@educacao.mg.gov.br';

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
      if (data.perfil !== 'bibliotecario') {
        setErro('Acesso restrito ao bibliotecário');
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
      `}</style>
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.logoWrap}>
            <img src="./logo.png" alt="Logo" style={s.logo}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <h1 style={s.title}>Biblioteca Marlene de Souza Queiroz</h1>
          <p style={s.subtitle}>E. E. Cel. José Venâncio de Souza</p>
          <p style={s.painelLabel}>Painel Administrativo</p>
          <form onSubmit={handleLogin} style={s.form}>
            {erro && <div style={s.erro}>{erro}</div>}
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
                  {mostrarSenha ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <button
              style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
              type="submit"
              disabled={loading}
            >
              {loading ? '⏳ Entrando...' : 'Entrar no painel'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f5efe3',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    background: '#fdfaf4',
    borderRadius: 20,
    padding: 40,
    width: '100%',
    maxWidth: 420,
    border: '1px solid #d9cfbe',
    boxShadow: '0 4px 24px rgba(26,18,8,0.10)',
    animation: 'fadeSlideUp 0.35s ease',
  },
  logoWrap: { display: 'flex', justifyContent: 'center', marginBottom: 16 },
  logo: { width: 90, height: 90, objectFit: 'contain' },
  title: { fontSize: 18, fontWeight: 700, color: '#1a1208', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#4a7c59', textAlign: 'center', fontWeight: 600, marginBottom: 4 },
  painelLabel: { fontSize: 12, color: '#8a7d68', textAlign: 'center', marginBottom: 28, textTransform: 'uppercase', letterSpacing: 1 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 700, color: '#8a7d68', textTransform: 'uppercase', letterSpacing: 0.5 },
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
    fontSize: 16,
    lineHeight: 1,
    padding: 4,
  },
  btn: {
    height: 48,
    borderRadius: 12,
    background: '#c97b2e',
    color: '#1a1208',
    fontWeight: 700,
    fontSize: 15,
    border: 'none',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  erro: {
    background: 'rgba(184,76,46,0.08)',
    color: '#b84c2e',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    textAlign: 'center',
  },
};
