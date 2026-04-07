import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Livros from './pages/Livros';
import Emprestimos from './pages/Emprestimos';
import Usuarios from './pages/Usuarios';
import Sidebar from './components/Sidebar';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5efe3' }}>
      <Sidebar />
      <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
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
      </Routes>
    </BrowserRouter>
  );
}