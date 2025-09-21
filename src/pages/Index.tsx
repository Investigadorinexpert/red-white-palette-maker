/* production: HttpOnly session + personalize + navigate */
import React, { useCallback, useEffect, useState, useRef } from "react";
import { MeshGradient } from "@paper-design/shaders-react";
import { useNavigate } from "react-router-dom";

interface User { id?: string; email?: string; name?: string; }
interface LoginOk { auth: true; [k: string]: any }
interface LoginFail { auth: false; reason?: string }

const API = {
  login: "/api/login",
  session: "/api/session",
  logout: "/api/session", // use form 222
};

// POST helper (cookies incluidas / cookies included)
async function postJson(url: string, body?: unknown): Promise<Response> {
  return fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json", "x-csrf-token": "1" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/10 dark:bg-white/5 ${className}`} aria-hidden />;
}
function Card({ children }: { children: React.ReactNode }) {
  return <div className="relative w-full max-w-md rounded-2xl border border-white/20 bg-black/75 p-6 text-white shadow-2xl backdrop-blur-xl">{children}</div>;
}
function ErrorNotice({ message }: { message: string }) {
  if (!message) return null;
  return <p className="mt-3 rounded-md border border-red-500/40 bg-red-500/20 px-3 py-2 text-sm text-red-100">{message}</p>;
}

export default function IndexPage() {
  const navigate = useNavigate(); // ✅ hook dentro del componente
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Evita doble fetch en StrictMode dev
  const ranOnce = useRef(false);

  // Session check (cookie HttpOnly) / Validación de sesión (solo cookie)
  useEffect(() => {
    if (ranOnce.current) return; ranOnce.current = true;

    let mounted = true;
    (async () => {
      try {
        const res = await postJson(API.session, { form: 333 }); // no sessionkey
        if (!mounted) return;
        if (res.ok) {
          const data = (await res.json()) as { result?: boolean };
          setUser(data?.result ? { email: "session@active" } : null);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  // Login → navigate('/inicio')
  const onSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(async (ev) => {
    ev.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await postJson(API.login, { email, usuario: email, password, form: 111 });
      const data = (await res.json()) as LoginOk | LoginFail;

      if (res.ok && (data as LoginOk).auth === true) {
        // Optional personalization (non-sensitive)
        try { localStorage.setItem("profile", JSON.stringify(data)); } catch {}
        navigate("/inicio", { replace: true }); // SPA, no full reload
        return;
      } else {
        const fail = data as LoginFail;
        setError(fail.reason || "Credenciales inválidas / Invalid credentials");
        setUser(null);
      }
    } catch {
      setError("No se pudo conectar al servidor / Could not reach server");
    } finally {
      setLoading(false);
    }
  }, [email, password, navigate]);

  // Logout (server clears cookie) / Servidor invalida la cookie
  const onLogout = useCallback(async () => {
    setLoading(true);
    try { await postJson(API.logout, { form: 222 }); } catch {}
    finally {
      setUser(null); setLoading(false);
      try { localStorage.removeItem("profile"); } catch {}
      navigate("/", { replace: true });
    }
  }, [navigate]);

  return (
    <main className="relative min-h-dvh w-full overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0">
        <MeshGradient {...({ colors: ['#e31c23', '#cd3737', '#c85656'], distortion: 0.56, swirl: 1.0, speed: 1.64, offsetX: -1.0, offsetY: -0.32, scale: 1.56, rotation: 48, style: { width: '100%', height: '100%' } } as any)} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(0,0,0,0.35),transparent_45%),radial-gradient(ellipse_at_80%_70%,rgba(0,0,0,0.35),transparent_40%)]" />
      </div>

      <section className="relative z-10 mx-auto flex min-h-dvh w-full max-w-7xl items-center justify-center px-6 py-10">
        {loading ? (
          <Card>
            <div className="flex flex-col gap-4">
              <SkeletonBlock className="h-6 w-32" />
              <SkeletonBlock className="h-10 w-full" />
              <SkeletonBlock className="h-10 w-full" />
              <SkeletonBlock className="h-5 w-48" />
            </div>
          </Card>
        ) : user ? (
          <Card>
            {(() => {
              const p = (() => { try { return JSON.parse(localStorage.getItem("profile") || "null"); } catch { return null; } })();
              const emailPerfil = p?.email_perfil || p?.email || user?.email || "usuario";
              const empresa = p?.nombre_empresa || "";
              const equipo = p?.nombre_equipo || "";
              const vence = p?.expires_jsessionid || p?.expires_at;
              return (
                <>
                  <h1 className="mb-2 text-xl font-semibold">Hola, {emailPerfil}</h1>
                  <p className="mb-4 text-sm text-white/80">Sesión activa / <span className="italic">Session active</span>.</p>
                  <div className="mb-4 text-sm text-white/80"><p>email: {emailPerfil}</p></div>
                  <div className="mb-4 text-xs text-white/70">{empresa || equipo ? `${empresa}${empresa && equipo ? " / " : ""}${equipo}` : null}</div>
                  {vence ? (<p className="text-xs text-white/70">Vence: {vence}</p>) : null}
                  <button onClick={onLogout} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 font-medium text-black hover:bg-white focus:outline-none">
                    Cerrar sesión / Logout
                  </button>
                </>
              );
            })()}
          </Card>
        ) : (
          <Card>
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <header>
                <h1 className="text-xl font-semibold">Inicia sesión</h1>
                <p className="text-sm text-white/75">Login to continue</p>
              </header>
              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-white/70">Email</span>
                <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white placeholder-white/50 outline-none ring-0 focus:border-white/30"
                  placeholder="tucorreo@ejemplo.com" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-white/70">Password</span>
                <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white placeholder-white/50 outline-none ring-0 focus:border-white/30"
                  placeholder="••••••••" />
              </label>
              <button type="submit" disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 font-medium text-black hover:bg-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Entrando… / Signing in…" : "Entrar / Sign in"}
              </button>
              <ErrorNotice message={error} />
              <p className="text-xs text-white/70">
                Autenticación con <code className="rounded bg-white/10 px-1 py-0.5">credentials: include</code> + <code className="rounded bg-white/10 px-1 py-0.5">x-csrf-token: 1</code>
              </p>
            </form>
          </Card>
        )}
      </section>
    </main>
  );
}
