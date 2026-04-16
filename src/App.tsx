import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Livros from './pages/Livros';
import Emprestimos from './pages/Emprestimos';
import Usuarios from './pages/Usuarios';
import Comunicados from './pages/Comunicados';
import Sidebar from './components/Sidebar';

function Layout({ children }: { children: React.ReactNode }) {
  const anoAtual = new Date().getFullYear();

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f5efe3', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
        <footer style={{
          borderTop: '1px solid #d9cfbe',
          background: '#fdfaf4',
          color: '#8a7d68',
          fontSize: 12,
          textAlign: 'center',
          padding: '12px 16px',
        }}>
          © {anoAtual} Biblioteca Marlene de Souza Queiroz. Todos os direitos reservados. Prof. Adilson_Dev e Terceirão 2k26.
        </footer>
      </div>
    </div>
  );
}

function RotaProtegida({ children }: { children: React.ReactNode }) {
  const logado = localStorage.getItem('admin_email');
  return logado ? <>{children}</> : <Navigate to="/" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/usuarios" element={
  <RotaProtegida><Layout><Usuarios /></Layout></RotaProtegida>
} />
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={
          <RotaProtegida><Layout><Dashboard /></Layout></RotaProtegida>
        } />
        <Route path="/livros" element={
          <RotaProtegida><Layout><Livros /></Layout></RotaProtegida>
        } />
        <Route path="/emprestimos" element={
          
          <RotaProtegida><Layout><Emprestimos /></Layout></RotaProtegida>
        } />
        <Route path="/comunicados" element={
          <RotaProtegida><Layout><Comunicados /></Layout></RotaProtegida>
        } />
      </Routes>
    </BrowserRouter>
  );
}