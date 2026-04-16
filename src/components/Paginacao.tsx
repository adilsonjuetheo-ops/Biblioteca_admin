interface PaginacaoProps {
  total: number;
  porPagina: number;
  paginaAtual: number;
  onChange: (pagina: number) => void;
}

export default function Paginacao({ total, porPagina, paginaAtual, onChange }: PaginacaoProps) {
  const totalPaginas = Math.ceil(total / porPagina);
  if (totalPaginas <= 1) return null;

  const inicio = (paginaAtual - 1) * porPagina + 1;
  const fim = Math.min(paginaAtual * porPagina, total);

  return (
    <div style={s.wrap}>
      <span style={s.info}>
        {inicio}–{fim} de {total}
      </span>
      <div style={s.btns}>
        <button
          style={{ ...s.btn, opacity: paginaAtual === 1 ? 0.35 : 1 }}
          onClick={() => onChange(paginaAtual - 1)}
          disabled={paginaAtual === 1}
        >
          ← Anterior
        </button>
        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            style={{ ...s.btn, ...(p === paginaAtual ? s.btnAtivo : {}) }}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ))}
        <button
          style={{ ...s.btn, opacity: paginaAtual === totalPaginas ? 0.35 : 1 }}
          onClick={() => onChange(paginaAtual + 1)}
          disabled={paginaAtual === totalPaginas}
        >
          Próxima →
        </button>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 4px', flexWrap: 'wrap', gap: 12 },
  info: { fontSize: 13, color: '#8a7d68' },
  btns: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  btn: { padding: '6px 12px', borderRadius: 8, border: '1px solid #d9cfbe', background: '#fdfaf4', color: '#8a7d68', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnAtivo: { background: '#1a1208', color: '#f5efe3', borderColor: '#1a1208' },
};
