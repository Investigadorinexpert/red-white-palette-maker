import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("Validando credenciales...");
    try {
      const form = new URLSearchParams();
      form.set("usuario", usuario);
      form.set("password", password);
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMsg((data as any)?.detail || "Error de autenticación");
        return;
      }
      // Guardar CSRF para mutaciones
      const csrf = (document.cookie.split("; ").find(c=>c.startsWith("csrf-token="))||"").split("=")[1] || "";
      if (csrf) localStorage.setItem("csrf", decodeURIComponent(csrf));
      setMsg("Login ok. Redirigiendo...");
      navigate("/inicio");
    } catch {
      setMsg("Network error");
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f7fafc" }}>
      <form onSubmit={onSubmit} style={{ width: 360, display: "grid", gap: 12, padding: 24, borderRadius: 12, background: "white", boxShadow: "0 10px 30px rgba(0,0,0,.08)" }}>
        <h1>RIMAC</h1>
        <label>Usuario
          <input value={usuario} onChange={(e) => setUsuario(e.target.value)} />
        </label>
        <label>Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button type="submit" style={{ padding: "10px 12px", borderRadius: 8, background: "black", color: "white", border: "none" }}>Entrar</button>
        <div style={{ minHeight: 20, fontSize: 12 }}>{msg}</div>
        <div style={{ fontSize: 12, color: "#4a5568" }}>Usuario: fiorellamatta / Pass: RIMAC2025$.</div>
      </form>
    </div>
  );
}
