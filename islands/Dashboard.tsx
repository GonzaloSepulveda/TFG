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
    disordersAnalysis: "Disorders Analysis",
    analyzeAllPatients: "Analyze All Patients",
    analyzing: "Analyzing...",
    patient: "Patient",
    assessment: "Assessment",
    patterns: "Patterns",
    disorders: "Possible Disorders",
    recommendations: "Recommendations",
    totalMessagesLabel: "Total Messages",
    confidence: "Confidence",
    indicators: "Indicators",
    noDisorders: "No disorders detected",
    noPatients: "No patients to analyze",
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
    disordersAnalysis: "Análisis de Trastornos",
    analyzeAllPatients: "Analizar Todos los Pacientes",
    analyzing: "Analizando...",
    patient: "Paciente",
    assessment: "Evaluación",
    patterns: "Patrones Detectados",
    disorders: "Posibles Trastornos",
    recommendations: "Recomendaciones",
    totalMessagesLabel: "Total de Mensajes",
    confidence: "Confianza",
    indicators: "Indicadores",
    noDisorders: "Sin trastornos detectados",
    noPatients: "Sin pacientes para analizar",
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
  const [activeTab, setActiveTab] = useState<"conversations" | "disorders">("conversations");
  const [disordersAnalysis, setDisordersAnalysis] = useState<any[]>([]);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
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

  const loadDisordersAnalysis = async () => {
    if (!token) return;
    
    setLoadingAnalysis(true);
    setAnalysisProgress(10);
    
    try {
      // Simular progreso mientras se carga
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) return 90; // No superar 90% hasta que termine
          const nextProgress = prev + Math.random() * 15;
          return nextProgress > 90 ? 90 : nextProgress;
        });
      }, 300);
      
      const res = await fetch("http://localhost:8000/admin/disorders-analysis", {
        headers,
        signal: abortControllerRef.current?.signal,
      });
      
      clearInterval(progressInterval);
      
      if (res.ok) {
        const data = await res.json();
        setDisordersAnalysis(data.analysis || []);
        setAnalysisProgress(100); // Establecer a 100% cuando termina
        
        // Limpiar progreso después de 1.5 segundos
        setTimeout(() => {
          setAnalysisProgress(0);
          setLoadingAnalysis(false);
        }, 1500);
      } else {
        setAnalysisProgress(0);
        setLoadingAnalysis(false);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Error cargando análisis:", err);
      }
      setAnalysisProgress(0);
      setLoadingAnalysis(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case "alta":
        return darkMode 
          ? "bg-red-900 border-red-700 text-red-100" 
          : "bg-red-100 border-red-300 text-red-800";
      case "media":
        return darkMode 
          ? "bg-yellow-900 border-yellow-700 text-yellow-100" 
          : "bg-yellow-100 border-yellow-300 text-yellow-800";
      case "baja":
        return darkMode 
          ? "bg-blue-900 border-blue-700 text-blue-100" 
          : "bg-blue-100 border-blue-300 text-blue-800";
      default:
        return darkMode 
          ? "bg-gray-900 border-gray-700 text-gray-100" 
          : "bg-gray-100 border-gray-300 text-gray-800";
    }
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
        {/* Tabs */}
        <div class="mb-6 flex gap-4 border-b" style={`border-color: ${darkMode ? '#475569' : '#e2e8f0'}`}>
          <button
            onClick={() => setActiveTab("conversations")}
            class={`px-6 py-3 font-semibold transition-all border-b-2 ${
              activeTab === "conversations"
                ? `border-teal-500 text-teal-600 ${darkMode ? "bg-slate-700/30" : ""}`
                : `border-transparent ${darkMode ? "text-slate-400 hover:text-slate-300" : "text-slate-600 hover:text-slate-700"}`
            }`}
          >
            💬 {t("allConversations")}
          </button>
          <button
            onClick={() => {
              setActiveTab("disorders");
              if (disordersAnalysis.length === 0) {
                loadDisordersAnalysis();
              }
            }}
            class={`px-6 py-3 font-semibold transition-all border-b-2 ${
              activeTab === "disorders"
                ? `border-orange-500 text-orange-600 ${darkMode ? "bg-slate-700/30" : ""}`
                : `border-transparent ${darkMode ? "text-slate-400 hover:text-slate-300" : "text-slate-600 hover:text-slate-700"}`
            }`}
          >
            🧠 {t("disordersAnalysis")}
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === "conversations" ? (
          <>
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
          </>
        ) : (
          <>
            {/* Disorders Analysis Tab */}
            <div class="mb-6 flex items-center justify-between">
              <h2 class="text-2xl font-bold">{t("disordersAnalysis")}</h2>
              <button
                onClick={loadDisordersAnalysis}
                disabled={loadingAnalysis}
                class={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  loadingAnalysis
                    ? "bg-slate-400 text-slate-600 cursor-not-allowed"
                    : darkMode
                    ? "bg-orange-600 hover:bg-orange-500 text-white"
                    : "bg-orange-500 hover:bg-orange-600 text-white"
                }`}
              >
                {loadingAnalysis ? t("analyzing") : t("analyzeAllPatients")}
              </button>
            </div>

            {/* Progress Bar */}
            {(loadingAnalysis || analysisProgress > 0) && (
              <div class="mb-6">
                <div
                  class={`w-full h-3 rounded-full overflow-hidden ${
                    darkMode ? "bg-slate-700" : "bg-slate-200"
                  }`}
                >
                  <style>{`
                    @keyframes progress-pulse {
                      0% { opacity: 1; }
                      50% { opacity: 0.7; }
                      100% { opacity: 1; }
                    }
                    .progress-bar {
                      animation: progress-pulse 1s ease-in-out infinite;
                    }
                  `}</style>
                  <div
                    class={`h-full ${
                      analysisProgress === 100
                        ? "bg-green-500"
                        : "bg-gradient-to-r from-orange-400 to-orange-600 progress-bar"
                    }`}
                    style={{
                      width: `${analysisProgress}%`,
                      transition: analysisProgress === 100 ? "width 0.3s ease-out" : "width 0.1s linear",
                    }}
                  />
                </div>
                <p class={`text-sm mt-2 text-center ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                  {analysisProgress === 100
                    ? "✓ Análisis completado"
                    : `Analizando... ${Math.floor(analysisProgress)}%`}
                </p>
              </div>
            )}

            {disordersAnalysis.length > 0 ? (
              <div class="space-y-6">
                {disordersAnalysis.map((patient, idx) => (
                  <div
                    key={idx}
                    class={`rounded-lg overflow-hidden shadow-lg ${
                      darkMode ? "bg-slate-800" : "bg-white"
                    }`}
                  >
                    {/* Patient Header */}
                    <div
                      class={`px-6 py-4 border-b ${
                        darkMode
                          ? "bg-slate-700 border-slate-600"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div class="flex justify-between items-start">
                        <div>
                          <p class="text-sm font-medium opacity-75">{t("patient")}</p>
                          <p class={`text-lg font-semibold ${darkMode ? "text-slate-100" : "text-slate-800"}`}>
                            {patient.user_email}
                          </p>
                        </div>
                        <div class="text-right">
                          <p class="text-sm opacity-75">{t("totalMessagesLabel")}</p>
                          <p class="text-2xl font-bold text-teal-500">{patient.total_messages}</p>
                        </div>
                      </div>
                    </div>

                    {/* Patient Content */}
                    <div class="px-6 py-4 space-y-4">
                      {/* Overall Assessment */}
                      <div>
                        <h4 class={`font-semibold mb-2 ${darkMode ? "text-orange-400" : "text-orange-600"}`}>
                          {t("assessment")}
                        </h4>
                        <p class={darkMode ? "text-slate-300" : "text-slate-700"}>
                          {patient.overall_assessment || "N/A"}
                        </p>
                      </div>

                      {/* Detected Patterns */}
                      {patient.detected_patterns && patient.detected_patterns.length > 0 && (
                        <div>
                          <h4 class={`font-semibold mb-2 ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                            {t("patterns")}
                          </h4>
                          <div class="flex flex-wrap gap-2">
                            {patient.detected_patterns.map((pattern: string, i: number) => (
                              <span
                                key={i}
                                class={`px-3 py-1 rounded-full text-sm ${
                                  darkMode
                                    ? "bg-blue-900 text-blue-100"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {pattern}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Possible Disorders */}
                      {patient.possible_disorders && patient.possible_disorders.length > 0 ? (
                        <div>
                          <h4 class={`font-semibold mb-3 ${darkMode ? "text-red-400" : "text-red-600"}`}>
                            {t("disorders")}
                          </h4>
                          <div class="space-y-3">
                            {patient.possible_disorders.map((disorder: any, i: number) => (
                              <div
                                key={i}
                                class={`rounded-lg p-4 border ${getConfidenceColor(disorder.confidence)}`}
                              >
                                <div class="flex justify-between items-center mb-2">
                                  <h5 class="font-semibold">{disorder.name}</h5>
                                  <span class="text-sm font-semibold">
                                    {t("confidence")}: {disorder.confidence}
                                  </span>
                                </div>
                                {disorder.indicators && disorder.indicators.length > 0 && (
                                  <div>
                                    <p class="text-sm font-medium mb-1 opacity-75">{t("indicators")}:</p>
                                    <ul class="text-sm space-y-1">
                                      {disorder.indicators.map((indicator: string, j: number) => (
                                        <li key={j}>• {indicator}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p class={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                          ✓ {t("noDisorders")}
                        </p>
                      )}

                      {/* Recommendations */}
                      {patient.recommendations && patient.recommendations.length > 0 && (
                        <div>
                          <h4 class={`font-semibold mb-2 ${darkMode ? "text-green-400" : "text-green-600"}`}>
                            {t("recommendations")}
                          </h4>
                          <ul class={`space-y-1 text-sm ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                            {patient.recommendations.map((rec: string, i: number) => (
                              <li key={i}>• {rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                class={`rounded-lg p-12 text-center shadow-lg ${
                  darkMode ? "bg-slate-800" : "bg-white"
                }`}
              >
                <p class={`text-lg ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                  {loadingAnalysis ? t("loading") : t("noPatients")}
                </p>
              </div>
            )}
          </>
        )}
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
