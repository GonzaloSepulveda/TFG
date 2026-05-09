import { useState, useEffect } from "preact/hooks";

interface UserStats {
  total_conversations: number;
  total_messages: number;
  user_messages: number;
  bot_messages: number;
  liked_messages: number;
  disliked_messages: number;
  satisfaction_rate: number;
}

export default function Stats() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [token, setToken] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      window.location.href = "/";
    } else {
      setToken(t);
      const savedDarkMode = localStorage.getItem("darkMode") === "true";
      setDarkMode(savedDarkMode);
      loadStats(t);
    }
  }, []);

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };

  const loadStats = async (userToken: string) => {
    try {
      const res = await fetch("http://localhost:8000/stats", {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error cargando estadísticas:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", String(newDarkMode));
  };

  return (
    <div class={`min-h-screen transition-colors ${
      darkMode
        ? "bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100"
        : "bg-gradient-to-br from-blue-50 to-green-50 text-slate-700"
    }`}>
      {/* Header */}
      <div class={`border-b ${
        darkMode
          ? "bg-slate-800 border-slate-700"
          : "bg-white/50 border-slate-200"
      } p-6`}>
        <div class="max-w-6xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = "/chat"}>
            <img src="/corazon.png" alt="Hermes" class="w-10 h-10" style="image-rendering: pixelated;" />
            <h1 class="text-3xl font-bold">Estadísticas</h1>
          </div>
          <div class="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              class={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? "bg-slate-700 hover:bg-slate-600"
                  : "bg-slate-100 hover:bg-slate-200"
              }`}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/";
              }}
              class={`px-4 py-2 rounded-lg transition-colors ${
                darkMode
                  ? "bg-red-900 hover:bg-red-800 text-red-100"
                  : "bg-red-100 hover:bg-red-200 text-red-700"
              }`}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div class="max-w-6xl mx-auto p-6">
        {loading ? (
          <div class="text-center py-12">
            <p class="text-lg">Cargando estadísticas...</p>
          </div>
        ) : stats ? (
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card: Conversaciones */}
            <div class={`p-6 rounded-2xl shadow-lg ${
              darkMode ? "bg-slate-800 border border-slate-700" : "bg-white border border-slate-100"
            }`}>
              <div class="flex items-center justify-between">
                <div>
                  <p class={`text-sm font-semibold ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                    Conversaciones
                  </p>
                  <p class="text-4xl font-bold mt-2">{stats.total_conversations}</p>
                </div>
                <div class="text-5xl">💬</div>
              </div>
            </div>

            {/* Card: Total de Mensajes */}
            <div class={`p-6 rounded-2xl shadow-lg ${
              darkMode ? "bg-slate-800 border border-slate-700" : "bg-white border border-slate-100"
            }`}>
              <div class="flex items-center justify-between">
                <div>
                  <p class={`text-sm font-semibold ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                    Total de Mensajes
                  </p>
                  <p class="text-4xl font-bold mt-2">{stats.total_messages}</p>
                </div>
                <div class="text-5xl">✉️</div>
              </div>
            </div>

            {/* Card: Tus Mensajes */}
            <div class={`p-6 rounded-2xl shadow-lg ${
              darkMode ? "bg-slate-800 border border-slate-700" : "bg-white border border-slate-100"
            }`}>
              <div class="flex items-center justify-between">
                <div>
                  <p class={`text-sm font-semibold ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                    Tus Mensajes
                  </p>
                  <p class="text-4xl font-bold mt-2">{stats.user_messages}</p>
                </div>
                <div class="text-5xl">👤</div>
              </div>
            </div>

            {/* Card: Respuestas de Hermes */}
            <div class={`p-6 rounded-2xl shadow-lg ${
              darkMode ? "bg-slate-800 border border-slate-700" : "bg-white border border-slate-100"
            }`}>
              <div class="flex items-center justify-between">
                <div>
                  <p class={`text-sm font-semibold ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                    Respuestas de Hermes
                  </p>
                  <p class="text-4xl font-bold mt-2">{stats.bot_messages}</p>
                </div>
                <div class="text-5xl">🤖</div>
              </div>
            </div>

            {/* Card: Satisfacción */}
            <div class={`p-6 rounded-2xl shadow-lg ${
              darkMode ? "bg-slate-800 border border-slate-700" : "bg-white border border-slate-100"
            }`}>
              <div class="flex items-center justify-between">
                <div>
                  <p class={`text-sm font-semibold ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                    Satisfacción
                  </p>
                  <p class="text-4xl font-bold mt-2">{stats.satisfaction_rate}%</p>
                  <div class="mt-2 w-full bg-gray-300 rounded-full h-2">
                    <div
                      class="bg-green-500 h-2 rounded-full"
                      style={{ width: `${stats.satisfaction_rate}%` }}
                    ></div>
                  </div>
                </div>
                <div class="text-5xl">⭐</div>
              </div>
            </div>

            {/* Card: Feedback Total */}
            <div class={`p-6 rounded-2xl shadow-lg ${
              darkMode ? "bg-slate-800 border border-slate-700" : "bg-white border border-slate-100"
            }`}>
              <div class="flex items-center justify-between">
                <div>
                  <p class={`text-sm font-semibold ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                    Feedback Total
                  </p>
                  <div class="mt-2 flex gap-4">
                    <div>
                      <p class="text-2xl font-bold text-green-500">👍 {stats.liked_messages}</p>
                      <p class={`text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Me gusta</p>
                    </div>
                    <div>
                      <p class="text-2xl font-bold text-red-500">👎 {stats.disliked_messages}</p>
                      <p class={`text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}>No me gusta</p>
                    </div>
                  </div>
                </div>
                <div class="text-5xl">📊</div>
              </div>
            </div>
          </div>
        ) : (
          <div class={`text-center py-12 p-6 rounded-2xl ${
            darkMode ? "bg-slate-800" : "bg-white"
          }`}>
            <p class="text-lg">No hay estadísticas disponibles aún.</p>
            <button
              onClick={() => window.location.href = "/chat"}
              class="mt-4 px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
            >
              Ir al Chat
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div class={`border-t mt-12 py-6 text-center text-sm ${
        darkMode
          ? "bg-slate-800 border-slate-700 text-slate-500"
          : "bg-white/50 border-slate-200 text-slate-400"
      }`}>
        <p>Hermes es una IA de apoyo emocional. Los datos se guardan de forma segura.</p>
      </div>
    </div>
  );
}
