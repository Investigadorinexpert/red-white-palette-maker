import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MeshGradient } from "@paper-design/shaders-react";

// --- Types --------------------------------------------------------------
interface User {
  id?: string;
  email?: string;
  name?: string;
}

interface LoginOk {
  auth: true;
  jsessionid: string;
  expires_at?: string;
}

interface LoginFail {
  auth: false;
  reason?: string;
}

// --- Constants ----------------------------------------------------------
// N8N Webhook con JWT y path "session" (no "sesion")
const WEBHOOK = "https://rimac-n8n.yusqmz.easypanel.host/webhook/session";
const STORAGE_KEY = "jsessionid";
const JWT_ENV = (import.meta as any)?.env?.VITE_N8N_JWT as string | undefined;

// Small utility to guard fetch with credentials, CSRF and optional JWT
async function postJson<T = unknown>(url: string, body?: unknown): Promise<Response> {
  const token = JWT_ENV || localStorage.getItem('N8N_JWT') || undefined;
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-csrf-token": "1",
  };
  if (token) headers["authorization"] = `Bearer ${token}`;

  return fetch(url, {
    method: "POST",
    credentials: "include",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

// --- UI bits ------------------------------------------------------------
function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={
        "animate-pulse rounded-xl bg-white/10 dark:bg-white/5 " + className
      }
      aria-hidden
    />
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full max-w-md rounded-2xl border border-white/20 bg-black/75 p-6 text-white shadow-2xl backdrop-blur-xl">
      {children}
    </div>
  );
}

function ErrorNotice({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p className="mt-3 rounded-md border border-red-500/40 bg-red-500/20 px-3 py-2 text-sm text-red-100">
      {message}
    </p>
  );
}

// --- Page ---------------------------------------------------------------
export default function IndexPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Gradient EXACT as requested (no speed reduction ever)
  const gradientProps = useMemo(
    () => ({
      colors: ["#e31c23", "#cd3737", "#c85656"],
      distortion: 0.56,
      swirl: 1.0,
      speed: 1.64,
      offsetX: -1.0,
      offsetY: -0.32,
      scale: 1.56,
      rotation: 48,
      style: { width: "100%", height: "100%" } as React.CSSProperties,
    } as any),
    []
  );

  // initial session check (form 333)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const jsessionid = localStorage.getItem(STORAGE_KEY);
        if (!jsessionid) { setUser(null); return; }
        const res = await postJson(WEBHOOK, { form: 333, sessionkey: jsessionid });
        if (!mounted) return;
        if (res.ok) {
          const data = (await res.json()) as { result?: boolean };
          setUser(data?.result ? { email: "session@active" } : null);
        } else { setUser(null); }
      } catch { setUser(null); }
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  const onSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(async (ev) => {
    ev.preventDefault();
    setError("");
    setLoading(true);
    try {
      // webhook expects usuario; send both usuario and email
      const res = await postJson(WEBHOOK, { form: 111, email, usuario: email, password });
      if (res.ok) {
        const data = (await res.json()) as LoginOk | LoginFail;
        if ((data as LoginOk).auth === true) {
          const ok = data as LoginOk;
          localStorage.setItem(STORAGE_KEY, ok.jsessionid);
          setUser({ email });
        } else {
          const fail = data as LoginFail;
          setError(fail.reason || "Credenciales inválidas / Invalid credentials");
          setUser(null);
        }
      } else {
        const text = await res.text();
        setError(text || "Error de autenticación / Authentication error");
        setUser(null);
      }
    } catch {
      setError("No se pudo conectar al servidor / Could not reach server");
    } finally { setLoading(false); }
  }, [email, password]);

  return (
    <main className="relative min-h-dvh w-full overflow-hidden bg-black">
      {/* Background shader */}
      <div className="pointer-events-none absolute inset-0">
        {/* @ts-expect-error: extended props present in project */}
        <MeshGradient {...(gradientProps as any)} />
        {/* Blur layer + occasional grain */}
        <div className="absolute inset-0 backdrop-blur-[2px]" />
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage:
              "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"64\">\n<filter id=\"n\">\n<feTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"2\" stitchTiles=\"stitch\"/>\n<feColorMatrix type=\"saturate\" values=\"0\"/>\n</filter>\n<rect width=\"100%\" height=\"100%\" filter=\"url(%23n)\" opacity=\"0.35\"/>\n</svg>')",
            backgroundRepeat: "repeat",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(0,0,0,0.35),transparent_45%),radial-gradient(ellipse_at_80%_70%,rgba(0,0,0,0.35),transparent_40%)]" />
      </div>

      {/* Foreground content */}
      <section className="relative z-10 mx-auto flex min-h-dvh w-full max-w-7xl items-center justify-center px-6 py-10">
        {loading ? (
          <Card>
            <div className="flex flex-col gap-4">
              <SkeletonBlock className="h-6 w-32" />
              <SkeletonBlock className="h-10 w-full" />
              <SkeletonBlock className="h-10 w-full" />
              <SkeletonBlock className="h-10 w-full" />
              <SkeletonBlock className="h-5 w-48" />
            </div>
          </Card>
        ) : user ? (
          <Card>
            <h1 className="mb-2 text-xl font-semibold">Hola, {user.name ?? user.email}</h1>
            <p className="mb-4 text-sm text-white/80">Sesión activa / <span className="italic">Session active</span>.</p>
            <div className="text-sm text-white/80">
              <p>email: {user.email}</p>
            </div>
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
                  className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white placeholder-white/50 outline-none ring-0 focus:border-white/30" placeholder="tucorreo@ejemplo.com" />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-white/70">Password</span>
                <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white placeholder-white/50 outline-none ring-0 focus:border-white/30" placeholder="••••••••" />
              </label>

              <button type="submit" disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 font-medium text-black hover:bg-white/90 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Entrando… / Signing in…" : "Entrar / Sign in"}
              </button>

              <ErrorNotice message={error} />

              <p className="text-xs text-white/70">Autenticación con <code className="rounded bg-white/10 px-1 py-0.5">credentials: include</code> +<code className="rounded bg-white/10 px-1 py-0.5"> x-csrf-token: 1</code> + <code className="rounded bg-white/10 px-1 py-0.5">Bearer JWT</code></p>
            </form>
          </Card>
        )}
      </section>
    </main>
  );
}
