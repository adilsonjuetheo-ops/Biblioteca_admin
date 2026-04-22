import { useEffect, useRef } from 'react';

type RefreshFn = (showSpinner?: boolean) => Promise<void> | void;

interface UseSmartRefreshOptions {
  intervalMs?: number;
  minRefetchGapMs?: number;
  runOnMount?: boolean;
}

export default function useSmartRefresh(
  refreshFn: RefreshFn,
  options: UseSmartRefreshOptions = {}
) {
  const {
    intervalMs = 45000,
    minRefetchGapMs = 8000,
    runOnMount = true,
  } = options;

  const refreshRef = useRef(refreshFn);
  const inFlightRef = useRef(false);
  const lastRunRef = useRef(0);

  refreshRef.current = refreshFn;

  useEffect(() => {
    let ativo = true;

    async function executar(showSpinner = false, force = false) {
      if (!ativo) return;
      if (!force && document.visibilityState === 'hidden') return;
      if (inFlightRef.current) return;

      const agora = Date.now();
      if (!force && agora - lastRunRef.current < minRefetchGapMs) return;

      inFlightRef.current = true;
      lastRunRef.current = agora;

      try {
        await refreshRef.current(showSpinner);
      } finally {
        inFlightRef.current = false;
      }
    }

    if (runOnMount) {
      void executar(true, true);
    }

    const refreshInterval = window.setInterval(() => {
      void executar(false);
    }, intervalMs);

    const handleFocus = () => {
      void executar(false);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void executar(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      ativo = false;
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [intervalMs, minRefetchGapMs, runOnMount]);
}
