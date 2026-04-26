import { useState, useEffect } from "preact/hooks";

interface Tag {
  name: string;
  color: string;
}

interface Conversation {
  conversation_id: string;
  title: string;
  created_at: string;
}

interface VaultData {
  [tagName: string]: {
    color: string;
    conversations: Conversation[];
  };
}

export default function Vault() {
  const [vault, setVault] = useState<VaultData | null>(null);
  const [token, setToken] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");
  const [showAssignTag, setShowAssignTag] = useState<string | null>(null);
  const [selectedConvTag, setSelectedConvTag] = useState<string>("");

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      window.location.href = "/";
    } else {
      setToken(t);
      const savedDarkMode = localStorage.getItem("darkMode") === "true";
      setDarkMode(savedDarkMode);
      loadVault(t);
    }
  }, []);

  const loadVault = async (userToken: string) => {
    try {
      const res = await fetch("http://localhost:8000/vault", {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setVault(data);
      }
    } catch (err) {
      console.error("Error cargando vault:", err);
    } finally {
      setLoading(false);
    }
  };

  const createTag = async (tagName: string, color: string) => {
    if (!tagName.trim()) {
      alert("El nombre de la etiqueta no puede estar vacío");
      return;
    }
    
    try {
      // Para crear una etiqueta, la asignamos a una conversación
      // O simplemente recargamos el vault si ya existe
      setNewTagName("");
      setNewTagColor("#3b82f6");
      setShowCreateTag(false);
      alert("Etiqueta creada. Ahora puedes asignarla a conversaciones.");
    } catch (err) {
      console.error("Error creando etiqueta:", err);
    }
  };

  const addTagToConversation = async (convId: string, tagName: string, tagColor: string) => {
    if (!tagName.trim()) {
      alert("El nombre de la etiqueta no puede estar vacío");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/conversations/${convId}/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ tag: tagName, color: tagColor }),
      });

      if (res.ok) {
        setSelectedConvTag("");
        setShowAssignTag(null);
        loadVault(token);
      }
    } catch (err) {
      console.error("Error asignando etiqueta:", err);
    }
  };

  const removeTagFromConversation = async (convId: string, tagName: string) => {
    try {
      const res = await fetch(`http://localhost:8000/conversations/${convId}/tags/${tagName}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (res.ok) {
        loadVault(token);
      }
    } catch (err) {
      console.error("Error eliminando etiqueta:", err);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", String(newDarkMode));
  };

  const goToChat = (conversationId: string) => {
    window.location.href = `/chat?conv_id=${conversationId}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      class={`min-h-screen transition-colors ${
        darkMode
          ? "bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100"
          : "bg-gradient-to-br from-blue-50 to-green-50 text-slate-700"
      }`}
    >
      {/* Header */}
      <div
        class={`border-b ${
          darkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white/50 border-slate-200"
        } p-6 sticky top-0 z-10`}
      >
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = "/chat"}>
            <img
              src="/corazon.png"
              alt="Hermes"
              class="w-10 h-10"
              style="image-rendering: pixelated;"
            />
            <h1 class="text-3xl font-bold">Bóveda</h1>
          </div>
          <div class="flex items-center gap-4">
            {/*<button
              onClick={() => setShowCreateTag(true)}
              class={`px-4 py-2 rounded-lg transition-colors font-medium ${
                darkMode
                  ? "bg-green-900 hover:bg-green-800 text-green-100"
                  : "bg-green-100 hover:bg-green-200 text-green-700"
              }`}
            >
              + Nueva Etiqueta
            </button>*/}
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
      <div class="max-w-7xl mx-auto p-6">
        {loading ? (
          <div class="text-center py-12">
            <div class="inline-block animate-spin">⏳</div>
            <p class="mt-4">Cargando Chats...</p>
          </div>
        ) : vault && Object.keys(vault).length > 0 ? (
          <div class="space-y-8">
            {Object.entries(vault).map(([tagName, data]) => (
              <div key={tagName} class={`rounded-xl overflow-hidden ${
                darkMode ? "bg-slate-800/50" : "bg-white/50"
              }`}>
                {/* Tag Header */}
                <div
                  class="p-4 cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: data.color + "20", borderLeft: `4px solid ${data.color}` }}
                  onClick={() =>
                    setSelectedTag(selectedTag === tagName ? null : tagName)
                  }
                >
                  <div class="flex items-center justify-between">
                    <h2 class="text-2xl font-bold" style={{ color: data.color }}>
                      {tagName}
                    </h2>
                    <span
                      class={`text-2xl transition-transform ${
                        selectedTag === tagName ? "rotate-180" : ""
                      }`}
                    >
                      ▼
                    </span>
                  </div>
                  <p class="text-sm opacity-75 mt-1">
                    {data.conversations.length}{" "}
                    {data.conversations.length === 1
                      ? "conversación"
                      : "conversaciones"}
                  </p>
                </div>

                {/* Conversations List */}
                {selectedTag === tagName && (
                  <div
                    class={`divide-y ${
                      darkMode ? "divide-slate-700" : "divide-slate-200"
                    }`}
                  >
                    {data.conversations.map((conv) => (
                      <div
                        key={conv.conversation_id}
                        class={`p-4 transition-all ${
                          darkMode
                            ? "hover:bg-slate-700/50"
                            : "hover:bg-white/70"
                        }`}
                      >
                        <div class="flex items-start justify-between gap-4 group">
                          <div class="flex-1 min-w-0 cursor-pointer" onClick={() => goToChat(conv.conversation_id)}>
                            <h3 class="font-semibold truncate hover:underline">
                              {conv.title}
                            </h3>
                            <p class="text-sm opacity-60 mt-1">
                              {formatDate(conv.created_at)}
                            </p>
                          </div>
                          <div class="flex items-center gap-2">
                            <button
                              onClick={() => setShowAssignTag(conv.conversation_id)}
                              class={`px-3 py-1 rounded text-sm transition-colors opacity-0 group-hover:opacity-100 ${
                                darkMode
                                  ? "bg-slate-600 hover:bg-slate-500 text-slate-100"
                                  : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                              }`}
                              title="Añadir etiqueta"
                            >
                              + Tag
                            </button>
                            <button
                              onClick={() => goToChat(conv.conversation_id)}
                              class="text-xl opacity-0 group-hover:opacity-100 transition-opacity hover:text-teal-500"
                            >
                              →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div class="text-center py-12">
            <p class="text-xl opacity-60">
              No hay conversaciones etiquetadas aún
            </p>
            <button
              onClick={() => (window.location.href = "/chat")}
              class="mt-4 px-6 py-3 bg-teal-400 hover:bg-teal-500 text-white rounded-lg transition-colors"
            >
              Ir al Chat
            </button>
          </div>
        )}
      </div>

      {/* Modal para crear nueva etiqueta */}
      {showCreateTag && (
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            class={`rounded-xl shadow-lg p-6 w-full max-w-md ${
              darkMode ? "bg-slate-800" : "bg-white"
            }`}
          >
            <h2 class="text-2xl font-bold mb-4">Nueva Etiqueta</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-2">Nombre de la etiqueta</label>
                <input
                  type="text"
                  value={newTagName}
                  onInput={(e) => setNewTagName(e.currentTarget.value)}
                  placeholder="Ej: Ansiedad, Sueño, Relaciones..."
                  class={`w-full px-4 py-2 rounded-lg outline-none transition-colors ${
                    darkMode
                      ? "bg-slate-700 text-slate-100 placeholder-slate-500 focus:bg-slate-600"
                      : "bg-slate-100 text-slate-700 placeholder-slate-400 focus:bg-slate-200"
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      createTag(newTagName, newTagColor);
                    }
                  }}
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Color de la etiqueta</label>
                <div class="flex items-center gap-3">
                  <input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.currentTarget.value)}
                    class="w-16 h-10 rounded-lg cursor-pointer"
                  />
                  <div
                    class="w-12 h-10 rounded-lg border-2 border-slate-300"
                    style={{ backgroundColor: newTagColor }}
                  />
                </div>
              </div>

              <div class="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateTag(false);
                    setNewTagName("");
                    setNewTagColor("#3b82f6");
                  }}
                  class={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    darkMode
                      ? "bg-slate-700 hover:bg-slate-600 text-slate-100"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                  }`}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => createTag(newTagName, newTagColor)}
                  disabled={!newTagName.trim()}
                  class={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${
                    newTagName.trim()
                      ? darkMode
                        ? "bg-green-600 hover:bg-green-500 text-white"
                        : "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-slate-300 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  Crear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para asignar etiqueta a conversación */}
      {showAssignTag && (
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            class={`rounded-xl shadow-lg p-6 w-full max-w-md ${
              darkMode ? "bg-slate-800" : "bg-white"
            }`}
          >
            <h2 class="text-2xl font-bold mb-4">Asignar Etiqueta</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-2">Selecciona o crea una etiqueta</label>
                <input
                  type="text"
                  value={selectedConvTag}
                  onInput={(e) => setSelectedConvTag(e.currentTarget.value)}
                  placeholder="Nombre de la etiqueta..."
                  class={`w-full px-4 py-2 rounded-lg outline-none transition-colors ${
                    darkMode
                      ? "bg-slate-700 text-slate-100 placeholder-slate-500 focus:bg-slate-600"
                      : "bg-slate-100 text-slate-700 placeholder-slate-400 focus:bg-slate-200"
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addTagToConversation(showAssignTag, selectedConvTag, newTagColor);
                    }
                  }}
                />
              </div>

              <div>
  <label class="block text-sm font-medium mb-2">Elige un color</label>
  <div class="flex items-center gap-3">
    <input
      type="color"
      value={newTagColor}
      onChange={(e) => setNewTagColor(e.currentTarget.value)}
      class="w-16 h-10 cursor-pointer p-0 border-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-lg"
    />
  </div>
</div>

              <div class="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAssignTag(null);
                    setSelectedConvTag("");
                  }}
                  class={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    darkMode
                      ? "bg-slate-700 hover:bg-slate-600 text-slate-100"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                  }`}
                >
                  Cancelar
                </button>
                <button
                  onClick={() =>
                    addTagToConversation(showAssignTag, selectedConvTag, newTagColor)
                  }
                  disabled={!selectedConvTag.trim()}
                  class={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${
                    selectedConvTag.trim()
                      ? darkMode
                        ? "bg-teal-600 hover:bg-teal-500 text-white"
                        : "bg-teal-500 hover:bg-teal-600 text-white"
                      : "bg-slate-300 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  Asignar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
