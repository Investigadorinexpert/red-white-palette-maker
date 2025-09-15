import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Inicio() {
  const [username, setUsername] = useState<string>("");
  const [publicos, setPublicos] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      const v = await apiFetch("/api/refresh", { method: "POST", credentials: "include" }); // best effort refresh
      await v.ok;
      const p = await apiFetch("/api/publicos", { credentials: "include" });
      if (!p.ok) { navigate("/login"); return; }
      const pd = await p.json();
      setUsername("fiorellamatta");
      setPublicos(pd);
    }
    fetchData();
  }, [navigate]);

  async function logout() {
    await apiFetch("/api/logout", { method: "POST", credentials: "include" });
    navigate("/login");
  }

  async function crearExp() {
    const csrf = localStorage.getItem("csrf") || "";
    const res = await apiFetch("/api/experimentos/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "X-CSRF-Token": csrf },
      body: new URLSearchParams({ nombre: "Nuevo experimento" }),
      credentials: "include",
    });
    if (res.ok) {
      const p = await apiFetch("/api/publicos", { credentials: "include" });
      setPublicos(await p.json());
      alert("Creado (mock)");
    } else {
      alert("Fallo al crear");
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Hola, {username} 👋</h1>
      <p>Dashboard de ejemplo.</p>
      <h2>Públicos</h2>
      <ul>
        {publicos.map((p) => (
          <li key={p.id}>{p.nombre} — {p.estado}</li>
        ))}
      </ul>
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={crearExp}>Crear experimento</button>
        <button onClick={logout}>Cerrar sesión</button>
      </div>
    </div>
  );
}
