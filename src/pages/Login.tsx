// src/pages/Login.tsx
import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MeshGradient } from "@paper-design/shaders-react";

const API = { login: "/api/login" };

async function postJson(url: string, body?: unknown): Promise<Response> {
  return fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json", "x-csrf-token": "1" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="relative w-full max-w-md rounded-2xl border border-white/20 bg-black/75 p-6 text-white shadow-2xl backdrop-blur-xl">{children}</div>;
}
function ErrorNotice({ message }: { message: string }) {
  if (!message) return null;
  return <p className="mt-3 rounded-md border border-red-500/40 bg-red-500/20 px-3 py-2 text-sm text-red-100">{message}</p>;
}

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(async (ev) => {
    ev.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await postJson(API.login, { email, usuario: email, password, form: 111 });
      if (!res.ok) { setError("Credenciales inválidas / Invalid credentials"); setLoading(false); return; }
      const data = await res.json();
      if (data?.auth === true) {
        // ES: personalización no sensible (email); EN: non-sensitive UI hints
        try { localStorage.setItem("profile", JSON.stringify({ email })); } catch {}
        navigate("/inicio", { replace: true });
      } else {
        setError("Credenciales inválidas / Invalid credentials");
      }
    } catch {
      setError("No se pudo conectar al servidor / Could not reach server");
    } finally { setLoading(false); }
  }, [email, password, navigate]);

  return (
    <main className="relative min-h-dvh w-full overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0">
        <MeshGradient {...({ colors: ['#e31c23', '#cd3737', '#c85656'], distortion: 0.56, swirl: 1.0, speed: 1.64, offsetX: -1.0, offsetY: -0.32, scale: 1.56, rotation: 48, style: { width: '100%', height: '100%' } } as any)} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(0,0,0,0.35),transparent_45%),radial-gradient(ellipse_at_80%_70%,rgba(0,0,0,0.35),transparent_40%)]" />
      </div>
      <section className="relative z-10 mx-auto flex min-h-dvh w-full max-w-7xl items-center justify-center px-6 py-10">
        <Card>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <header><h1 className="text-xl font-semibold">Inicia sesión</h1><p className="text-sm text-white/75">Login to continue</p></header>
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-white/70">Email</span>
              <input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}
                className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white placeholder-white/50 outline-none focus:border-white/30"
                placeholder="tucorreo@ejemplo.com" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-white/70">Password</span>
              <input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}
                className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white placeholder-white/50 outline-none focus:border-white/30"
                placeholder="••••••••" />
            </label>
            <button type="submit" disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 font-medium text-black disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "Entrando… / Signing in…" : "Entrar / Sign in"}
            </button>
            <ErrorNotice message={error} />
            <p className="text-xs text-white/70">Auth con <code className="rounded bg-white/10 px-1">credentials: include</code> + <code className="rounded bg-white/10 px-1">x-csrf-token: 1</code></p>
          </form>
        </Card>
      </section>
    </main>
  );
}
