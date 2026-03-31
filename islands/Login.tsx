import { useState } from "preact/hooks";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  const handleAuth = async (e: Event) => {
    e.preventDefault();
    const res = await fetch("http://localhost:8000/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, isRegister }),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      window.location.href = "/chat"; // Redirección de Fresh
    } else {
      alert("Error en el acceso");
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
      <div class="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl w-96 border border-white">
        <h2 class="text-3xl font-bold text-teal-600 text-center mb-6">Hermes</h2>
        <form onSubmit={handleAuth} class="space-y-4">
          <input type="email" placeholder="Email" onInput={(e) => setEmail(e.currentTarget.value)} 
            class="w-full p-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-200" />
          <input type="password" placeholder="Contraseña" onInput={(e) => setPassword(e.currentTarget.value)}
            class="w-full p-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-200" />
          <button class="w-full py-3 bg-teal-400 hover:bg-teal-500 text-white font-bold rounded-2xl shadow-lg transition-all transform active:scale-95">
            {isRegister ? "Registrarse" : "Entrar"}
          </button>
        </form>
        <button onClick={() => setIsRegister(!isRegister)} class="w-full mt-4 text-sm text-teal-500 underline">
          {isRegister ? "¿Ya tienes cuenta?" : "¿Nuevo aquí?"}
        </button>
      </div>
    </div>
  );
}