import { useState, useEffect, useRef } from "preact/hooks";

interface Conversation {
  conversation_id: string;
  title: string;
  user_id: string;
  created_at?: string;
  tags?: any[];
}

interface Message {
  _id: string;
  role: "user" | "bot";
  content: string;
  rating?: string | null;
  timestamp?: number;
}

const translations = {
  en: {
    dashboard: "Admin Dashboard",
    allConversations: "All Conversations",
    user: "User",
    created: "Created",
    search: "Search...",
    connected: "Connected",
    disconnected: "Disconnected",
    signOut: "Sign out",
    messages: "Messages",
    loading: "Loading...",
  },
  es: {
    dashboard: "Panel de Administración",
    allConversations: "Todas las Conversaciones",
    user: "Usuario",
    created: "Creada",
    search: "Buscar...",
    connected: "Conectado",
    disconnected: "Desconectado",
    signOut: "Cerrar sesión",
    messages: "Mensajes",
    loading: "Cargando...",
  }
};

type TranslationKey = keyof typeof translations.en;

export default function Dashboard() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [token, setToken] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isConnected, setIsConnected] = useState(true);
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [isAdmin, setIsAdmin] = useState(false);
  const [expandedConv, setExpandedConv] = useState<string | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const t = (key: TranslationKey) => translations[language][key];

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", { year: "numeric", month: "2-digit", day: "2-digit" }) +
           " " +
           date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedAdmin = localStorage.getItem("admin") === "true";
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    const savedLanguage = (localStorage.getItem("language") || "en") as "en" | "es";

    if (!storedToken || !storedAdmin) {
      window.location.href = "/";
      return;
    }

    setToken(storedToken);
    setIsAdmin(storedAdmin);
    setDarkMode(savedDarkMode);
    setLanguage(savedLanguage);
  }, []);

  useEffect(() => {
    if (token && isAdmin) {
      loadAllConversations();
    }
  }, [token, isAdmin]);

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };

  const loadAllConversations = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:8000/conversations/all", {
        headers,
        signal: abortControllerRef.current?.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        setIsConnected(true);
      } else if (res.status === 403) {
        window.location.href = "/chat";
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Error cargando conversaciones:", err);
        setIsConnected(false);
      }
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", String(newDarkMode));
  };

  const toggleLanguage = (lang: "en" | "es") => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };

  const loadConversationMessages = async (convId: string) => {
    if (expandedConv === convId) {
      setExpandedConv(null);
      setExpandedMessages([]);
      return;
    }

    setLoadingMessages(true);
    try {
      const res = await fetch(`http://localhost:8000/conversations/${convId}/messages`, {
        headers,
        signal: abortControllerRef.current?.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setExpandedMessages(data);
        setExpandedConv(convId);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Error cargando mensajes:", err);
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (conv.user_id && conv.user_id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
        class={`px-8 py-4 border-b ${
          darkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white/50 border-slate-200"
        }`}
      >
        <div class="flex items-center justify-between max-w-7xl mx-auto">
          <h1 class="text-3xl font-bold">🔐 {t("dashboard")}</h1>
          <div class="flex items-center gap-4">
            <span
              class={`flex items-center gap-2 text-sm ${
                isConnected ? "text-green-500" : "text-red-500"
              }`}
            >
              <span
                class={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></span>
              {isConnected ? t("connected") : t("disconnected")}
            </span>
            <div class="flex gap-1 bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
              <button
                onClick={() => toggleLanguage("es")}
                class={`px-3 py-1 rounded transition-all text-sm font-medium ${
                  language === "es"
                    ? darkMode
                      ? "bg-slate-600 text-white"
                      : "bg-white text-slate-800 shadow"
                    : "text-slate-700 dark:text-slate-300 hover:opacity-70"
                }`}
                title="Español"
              >
                🇪🇸
              </button>
              <button
                onClick={() => toggleLanguage("en")}
                class={`px-3 py-1 rounded transition-all text-sm font-medium ${
                  language === "en"
                    ? darkMode
                      ? "bg-slate-600 text-white"
                      : "bg-white text-slate-800 shadow"
                    : "text-slate-700 dark:text-slate-300 hover:opacity-70"
                }`}
                title="English"
              >
                🇬🇧
              </button>
            </div>
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div class="max-w-7xl mx-auto px-8 py-8">
        <div class="mb-6">
          <h2 class="text-2xl font-bold mb-4">{t("allConversations")}</h2>
          <input
            type="text"
            placeholder={t("search")}
            value={searchQuery}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
            class={`w-full px-4 py-3 rounded-lg outline-none text-sm transition-colors ${
              darkMode
                ? "bg-slate-700 text-slate-100 placeholder-slate-500 focus:bg-slate-600"
                : "bg-white text-slate-700 placeholder-slate-400 focus:bg-slate-50"
            }`}
          />
        </div>

        {/* Conversations Table */}
        <div
          class={`rounded-lg shadow-lg overflow-hidden ${
            darkMode ? "bg-slate-800" : "bg-white"
          }`}
        >
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead
                class={`${
                  darkMode
                    ? "bg-slate-700 text-slate-100"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                <tr>
                  <th class="px-6 py-4 text-left font-semibold w-10"></th>
                  <th class="px-6 py-4 text-left font-semibold">Title</th>
                  <th class="px-6 py-4 text-left font-semibold">{t("user")}</th>
                  <th class="px-6 py-4 text-left font-semibold">{t("created")}</th>
                </tr>
              </thead>
              <tbody
                class={`divide-y ${
                  darkMode
                    ? "divide-slate-700"
                    : "divide-slate-200"
                }`}
              >
                {filteredConversations.length > 0 ? (
                  filteredConversations.flatMap((conv) => [
                    <tr
                      key={`row-${conv.conversation_id}`}
                      class={`cursor-pointer transition-colors ${
                        darkMode
                          ? "hover:bg-slate-700"
                          : "hover:bg-slate-50"
                      }`}
                      onClick={() => loadConversationMessages(conv.conversation_id)}
                    >
                      <td class="px-6 py-4 text-center">
                        <span class={`text-lg inline-block transition-transform ${expandedConv === conv.conversation_id ? "rotate-90" : ""}`}>
                          ▶
                        </span>
                      </td>
                      <td
                        class={`px-6 py-4 font-medium truncate max-w-xs ${
                          darkMode ? "text-slate-100" : "text-slate-700"
                        }`}
                      >
                        {conv.title}
                      </td>
                      <td
                        class={`px-6 py-4 text-sm font-mono ${
                          darkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {conv.user_id}
                      </td>
                      <td
                        class={`px-6 py-4 text-sm ${
                          darkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {formatDate(conv.created_at)}
                      </td>
                    </tr>,
                    expandedConv === conv.conversation_id && (
                      <tr key={`expand-${conv.conversation_id}`}>
                        <td colSpan={4} class={`px-6 py-4 ${darkMode ? "bg-slate-700" : "bg-slate-50"}`}>
                          <div class={`rounded-lg p-4 max-h-96 overflow-y-auto space-y-3 ${darkMode ? "bg-slate-800" : "bg-white"}`}>
                            {loadingMessages ? (
                              <p class={`text-center ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{t("loading")}</p>
                            ) : expandedMessages.length > 0 ? (
                              expandedMessages.map((msg) => (
                                <div
                                  key={msg._id}
                                  class={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} group`}
                                >
                                  <div
                                    class={`max-w-xs px-4 py-3 rounded-2xl ${
                                      msg.role === "user"
                                        ? darkMode
                                          ? "bg-teal-600 text-white rounded-tr-none"
                                          : "bg-teal-400 text-white rounded-tr-none"
                                        : darkMode
                                        ? "bg-slate-700 text-slate-100 rounded-tl-none border border-slate-600"
                                        : "bg-gray-100 text-slate-700 rounded-tl-none border border-slate-200"
                                    }`}
                                  >
                                    <p class="text-sm break-words">{msg.content}</p>
                                    <p class={`text-xs mt-1 ${msg.role === "user" ? "text-teal-100" : darkMode ? "text-slate-400" : "text-slate-500"}`}>
                                      {formatTime(msg.timestamp)}
                                    </p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p class={`text-center ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                                {t("messages")}: 0
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ),
                  ])
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      class={`px-6 py-8 text-center ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {t("search")}: {searchQuery}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        <div class="mt-8 grid grid-cols-3 gap-4">
          <div
            class={`p-6 rounded-lg shadow ${
              darkMode ? "bg-slate-800" : "bg-white"
            }`}
          >
            <p
              class={`text-sm font-medium mb-2 ${
                darkMode ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Total Conversations
            </p>
            <p class="text-3xl font-bold text-teal-500">
              {conversations.length}
            </p>
          </div>
          <div
            class={`p-6 rounded-lg shadow ${
              darkMode ? "bg-slate-800" : "bg-white"
            }`}
          >
            <p
              class={`text-sm font-medium mb-2 ${
                darkMode ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Filtered Results
            </p>
            <p class="text-3xl font-bold text-blue-500">
              {filteredConversations.length}
            </p>
          </div>
          <div
            class={`p-6 rounded-lg shadow ${
              darkMode ? "bg-slate-800" : "bg-white"
            }`}
          >
            <p
              class={`text-sm font-medium mb-2 ${
                darkMode ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Unique Users
            </p>
            <p class="text-3xl font-bold text-purple-500">
              {new Set(conversations.map((c) => c.user_id)).size}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div class="max-w-7xl mx-auto px-8 py-6 text-right">
        <button
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("admin");
            window.location.href = "/";
          }}
          class={`text-sm font-semibold transition-colors ${
            darkMode
              ? "text-slate-500 hover:text-red-400"
              : "text-slate-400 hover:text-red-400"
          }`}
        >
          {t("signOut")}
        </button>
      </div>
    </div>
  );
}
