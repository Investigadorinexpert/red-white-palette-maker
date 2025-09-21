// src/pages/Dashboard.tsx
import React, { useCallback, useState } from "react";

async function postJson(url: string, body?: unknown): Promise<Response> {
  return fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json", "x-csrf-token": "1" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const p = (() => { try { return JSON.parse(localStorage.getItem("profile") || "null"); } catch { return null; } })();
  const email = p?.email || "usuario";

  const onLogout = useCallback(async () => {
    setLoading(true);
    try { await postJson("/api/logout", { form: 222 }); } catch {}
    finally {
      try { localStorage.removeItem("profile"); } catch {}
      window.location.replace("/"); // hard redirect to clear SPA state
    }
  }, []);

  return (
    <div className="p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Inicio / Dashboard</h1>
          <p className="text-sm text-white/70">Hola {email}. Bienvenido / Welcome.</p>
        </div>
        <button
          onClick={onLogout}
          disabled={loading}
          className="rounded-xl bg-white px-4 py-2 font-medium text-black disabled:opacity-60"
        >
          {loading ? "Saliendo…" : "Cerrar sesión / Logout"}
        </button>
      </header>

      {/* Placeholders para tus widgets */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-white/15 p-4">Stats / KPIs</div>
        <div className="rounded-xl border border-white/15 p-4">Tasks</div>
        <div className="rounded-xl border border-white/15 p-4">Team / Collab</div>
      </div>
    </div>
  );
}
