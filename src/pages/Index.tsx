import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MeshGradient } from "@paper-design/shaders-react";

// --- Types --------------------------------------------------------------
interface User {
  id: string;
  email: string;
  name?: string;
}

// Small utility to guard fetch with credentials and CSRF header
async function postJson<T = unknown>(url: string, body?: unknown): Promise<Response> {
  return fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      "x-csrf-token": "1",
    },
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
    <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-black/50 p-6 text-white shadow-xl backdrop-blur-xl">
      {children}
    </div>
  );
}

// A very thin error label
function ErrorNotice({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
      {message}
    </p>
  );
}

// --- Page ---------------------------------------------------------------
export default function IndexPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  // form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // gradient controls kept conservative for perf on low-end devices
  const gradientProps = useMemo(
    () => ({
      colors: [
        "#ff2d55", // red-ish
        "#ffffff", // white
        "#c4c4c4", // neutral
        "#ff7a7a", // warm
      ],
      distortion: 0.35,
      swirl: 0.15,
      speed: 0.35,
      style: { width: "100%", height: "100%" } as React.CSSProperties,
    }),
    []
  );

  // initial auth refresh check
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await postJson("/api/refresh");
        if (!mounted) return;
        if (res.ok) {
          const data = (await res.json()) as { user?: User };
          setUser(data.user ?? null);
        } else {
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const onSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(async (ev) => {
    ev.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await postJson("/api/login", { email, password });
      if (res.ok) {
        const data = (await res.json()) as { user?: User };
        setUser(data.user ?? null);
      } else {
        const text = await res.text();
        setError(text || "Credenciales inválidas / Invalid credentials");
        setUser(null);
      }
    } catch (e) {
      setError("No se pudo conectar al servidor / Could not reach server");
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  return (
    <main className="relative min-h-dvh w-full overflow-hidden bg-black">
      {/* Background shader */}
      <div className="pointer-events-none absolute inset-0">
        <MeshGradient {...gradientProps} />

        {/* Cheap overlay: subtle blur + film grain */}
        <div className="absolute inset-0 backdrop-blur-[2px]" />
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage:
              // tiny SVG noise; very lightweight and cacheable
              "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"64\">\n<filter id=\"n\">\n<feTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"2\" stitchTiles=\"stitch\"/>\n<feColorMatrix type=\"saturate\" values=\"0\"/>\n</filter>\n<rect width=\"100%\" height=\"100%\" filter=\"url(%23n)\" opacity=\"0.35\"/>\n</svg>')",
            backgroundRepeat: "repeat",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(0,0,0,0.25),transparent_45%),radial-gradient(ellipse_at_80%_70%,rgba(0,0,0,0.25),transparent_40%)]" />
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
            <p className="mb-4 text-sm text-white/80">
              Sesión activa / <span className="italic">Session active</span>.
            </p>
            <div className="text-sm text-white/80">
              <p>id: {user.id}</p>
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
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-white placeholder-white/50 outline-none ring-0 focus:border-white/20"
                  placeholder="tucorreo@ejemplo.com"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-white/70">Password</span>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-white placeholder-white/50 outline-none ring-0 focus:border-white/20"
                  placeholder="••••••••"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/90 px-4 py-2 font-medium text-black hover:bg-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Entrando… / Signing in…" : "Entrar / Sign in"}
              </button>

              <ErrorNotice message={error} />

              <p className="text-xs text-white/60">
                Autenticación con <code className="rounded bg-white/10 px-1 py-0.5">credentials: include</code> +
                <code className="rounded bg-white/10 px-1 py-0.5"> x-csrf-token: 1</code>
              </p>
            </form>
          </Card>
        )}
      </section>
    </main>
  );
}
