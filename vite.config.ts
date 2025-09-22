// vite.config.ts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const DEV_PORT = Number(env.VITE_PORT || process.env.VITE_PORT || 45855);
  const PROXY_TARGET = env.VITE_PROXY_TARGET || process.env.VITE_PROXY_TARGET || "http://127.0.0.1:35669";

  return {
    plugins: [react()],
    resolve: {
      alias: { "@": path.resolve(__dirname, "src") }, // 👈 alias clave
    },
    server: {
      host: true,
      port: DEV_PORT,
      strictPort: true,
      headers: { "Cache-Control": "no-store" },
      allowedHosts: ["host.docker.internal", "localhost", "127.0.0.1", "75.119.157.31"],
      proxy: {
        "/api": {
          target: PROXY_TARGET,
          changeOrigin: false,
          ws: true,
          secure: false,
          rewrite: (p) => p,
          configure: (proxy) => {
            proxy.on("proxyRes", (proxyRes) => {
              const sc = proxyRes.headers["set-cookie"];
              if (sc) {
                const arr = Array.isArray(sc) ? sc : [sc];
                proxyRes.headers["set-cookie"] = arr.map((v) => v.replace(/;\s*Secure/gi, ""));
              }
            });
          },
        },
      },
      // opcional: apagar overlay si estorba:
      // hmr: { overlay: false },
    },
    preview: { port: DEV_PORT, strictPort: true },
    define: { __APP_PROXY_TARGET__: JSON.stringify(PROXY_TARGET) },
  };
});
