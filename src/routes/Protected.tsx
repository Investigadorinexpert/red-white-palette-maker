import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Protected({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [state, setState] = useState<'loading'|'ok'|'deny'>('loading');

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch('/api/session', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json', 'x-csrf-token': '1' },
          body: JSON.stringify({ form: 333 }),
          signal: ac.signal,
        });
        if (!res.ok) { setState('deny'); return navigate('/', { replace: true }); }
        const json = await res.json();
        if (json?.result === true) setState('ok');
        else { setState('deny'); navigate('/', { replace: true }); }
      } catch {
        if (!ac.signal.aborted) { setState('deny'); navigate('/', { replace: true }); }
      }
    })();
    return () => ac.abort();
  }, [navigate]);

  if (state === 'loading') return <div className="p-6 text-sm">Validando sesión… / Validating session…</div>;
  if (state === 'deny') return null;
  return <>{children}</>;
}
