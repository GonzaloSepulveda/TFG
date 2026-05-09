import { useState } from "preact/hooks";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  // 1. Añadimos un nuevo estado para controlar el mensaje de error
  const [errorMsg, setErrorMsg] = useState("");

  const handleAuth = async (e: Event) => {
    e.preventDefault();
    setErrorMsg(""); // 2. Limpiamos cualquier error previo al intentar de nuevo

    const res = await fetch("http://localhost:8000/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, isRegister }),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("admin", data.admin ? "true" : "false");
      window.location.href = data.admin ? "/dashboard" : "/chat";
    } else {
      // 3. En lugar del alert, actualizamos nuestro estado
      setErrorMsg("Error en el acceso, compruebe sus credenciales");
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
      <div class="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl w-96 border border-white">
        <h2 class="text-3xl font-bold text-teal-600 text-center mb-6">Hermes</h2>
        <form onSubmit={handleAuth} class="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            onInput={(e) => {
              setEmail(e.currentTarget.value);
              setErrorMsg(""); // Opcional: limpiar error al escribir de nuevo
            }} 
            class="w-full p-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-200" 
          />
          <input 
            type="password" 
            placeholder="Contraseña" 
            onInput={(e) => {
              setPassword(e.currentTarget.value);
              setErrorMsg(""); // Opcional: limpiar error al escribir de nuevo
            }}
            class="w-full p-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-200" 
          />
          
          {/* 4. Renderizado condicional del mensaje de error en rojo */}
          {errorMsg && (
            <p class="text-red-500 text-sm font-medium text-center bg-red-50 p-2 rounded-lg">
              {errorMsg}
            </p>
          )}

          <button class="w-full py-3 bg-teal-400 hover:bg-teal-500 text-white font-bold rounded-2xl shadow-lg transition-all transform active:scale-95">
            {isRegister ? "Registrarse" : "Entrar"}
          </button>
        </form>
        <button 
          onClick={() => {
            setIsRegister(!isRegister);
            setErrorMsg(""); // Limpiar error al cambiar de modo
          }} 
          class="w-full mt-4 text-sm text-teal-500 underline"
        >
          {isRegister ? "¿Ya tienes cuenta?" : "¿Nuevo aquí?"}
        </button>
      </div>
    </div>
  );
}