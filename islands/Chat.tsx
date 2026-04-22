import { useState, useEffect, useRef } from "preact/hooks";

interface Message {
  role: "user" | "bot";
  content: string;
  timestamp?: number;
  id?: string;
  rated?: "up" | "down" | null;
}

interface Conversation {
  conversation_id: string;
  title: string;
}

const translations = {
  en: {
    writing: "Writing...",
    placeholder: "How are you feeling today?",
    selectConv: "Select a conversation on the right or write a message to start",
    emotionalWellness: "Emotional wellness",
    stressManagement: "Stress management",
    emotionalIntelligence: "Emotional intelligence",
    relationships: "Relationships",
    connected: "Connected",
    disconnected: "Disconnected",
    disclaimer: "Hermes is an AI for emotional support and does not replace professional medical advice.",
    new: "New",
    profile: "Profile",
    stats: "Stats",
    search: "Search...",
    history: "History",
    signOut: "Sign out",
    copied: "✓ Copied",
    copy: "📋 Copy",
    useful: "👍",
    notUseful: "👎",
    errorConnection: "❌ Connection error.",
    stop: "Stop",
    send: "Send",
    errorCreatingConv: "Error creating new conversation.",
    errorAutoSession: "Error starting automatic session.",
  },
  es: {
    writing: "Escribiendo...",
    placeholder: "¿Cómo te sientes hoy?",
    selectConv: "Selecciona una conversación a la derecha o escribe un mensaje para empezar",
    emotionalWellness: "Bienestar emocional",
    stressManagement: "Manejo del estrés",
    emotionalIntelligence: "Inteligencia emocional",
    relationships: "Relaciones personales",
    connected: "Conectado",
    disconnected: "Desconectado",
    disclaimer: "Hermes es una IA de apoyo y no sustituye el consejo médico profesional.",
    new: "Nueva",
    profile: "Perfil",
    stats: "Stats",
    search: "Buscar...",
    history: "Historial",
    signOut: "Cerrar sesión",
    copied: "✓ Copiado",
    copy: "📋 Copiar",
    useful: "👍",
    notUseful: "👎",
    errorConnection: "❌ Error de conexión.",
    stop: "Detener",
    send: "Enviar",
    errorCreatingConv: "Error al crear nueva conversación.",
    errorAutoSession: "Error al iniciar la sesión automática.",
  }
};

type TranslationKey = keyof typeof translations.en;

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConv, setCurrentConv] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isConnected, setIsConnected] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [language, setLanguage] = useState<"en" | "es">("en");

  const endRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const t = (key: TranslationKey) => translations[language][key];
  
  const scrollDown = () => endRef.current?.scrollIntoView({ behavior: "smooth" });

  // Utilidades
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const saveDraftToStorage = (text: string) => {
    if (currentConv) {
      if (text.trim()) {
        localStorage.setItem(`draft_${currentConv}`, text);
      } else {
        localStorage.removeItem(`draft_${currentConv}`);
      }
    }
  };

  const loadDraftFromStorage = (convId: string) => {
    return localStorage.getItem(`draft_${convId}`) || "";
  };

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      window.location.href = "/";
    } else {
      setToken(t);
    }
    
    // Cargar preferencia de dark mode
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDarkMode);
    
    // Cargar preferencia de idioma
    const savedLanguage = (localStorage.getItem("language") || "en") as "en" | "es";
    setLanguage(savedLanguage);
    
    // Marcar que el componente está montado
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Cleanup adicional - si el componente se está desmontando (navegación)
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };

  const createMessage = (role: "user" | "bot", content: string, timestamp?: number): Message => ({
    role,
    content,
    timestamp: timestamp || Date.now(),
    id: `msg_${Date.now()}_${Math.random()}`,
    rated: null
  });

  const loadConversations = async () => {
    if (!token || !isMountedRef.current) return;
    try {
      const res = await fetch("http://localhost:8000/conversations", { 
        headers,
        signal: abortControllerRef.current?.signal 
      });
      if (res.ok && isMountedRef.current) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Error cargando conversaciones:", err);
      }
    }
  };

  const selectConversation = async (conv_id: string) => {
    setCurrentConv(conv_id);
    try {
      const res = await fetch(`http://localhost:8000/conversations/${conv_id}/messages`, { 
        headers,
        signal: abortControllerRef.current?.signal 
      });
      if (res.ok && isMountedRef.current) {
        const msgs = await res.json();
        // Agregar timestamps y IDs a los mensajes
        const messagesWithMeta = msgs.map((msg: Message, idx: number) => ({
          ...msg,
          id: `${conv_id}_${idx}`,
          timestamp: msg.timestamp || Date.now()
        }));
        setMessages(messagesWithMeta);
        // Cargar draft guardado para esta conversación
        const draft = loadDraftFromStorage(conv_id);
        setInput(draft);
        setTimeout(scrollDown, 100);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Error cargando mensajes:", err);
        setIsConnected(false);
      }
    }
  };

  const deleteConversation = async (conv_id: string) => {
    try {
      await fetch(`http://localhost:8000/conversations/${conv_id}`, { 
        method: "DELETE", 
        headers,
        signal: abortControllerRef.current?.signal 
      });
      if (!isMountedRef.current) return;
      if (currentConv === conv_id) setMessages([]);
      setCurrentConv(null);
      loadConversations();
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Error eliminando conversación:", err);
      }
    }
  };

  const createNewConversation = async () => {
    try {
      const res = await fetch("http://localhost:8000/conversations", {
        method: "POST",
        headers,
        signal: abortControllerRef.current?.signal 
      });
      if (res.ok && isMountedRef.current) {
        const data = await res.json();
        setCurrentConv(data.conversation_id);
        setMessages([]);
        loadConversations();
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Error creating conversation:", err);
        alert(t("errorCreatingConv"));
      }
    }
  };

  async function sendMessage() {
    if (!input.trim() || !token || !isMountedRef.current) return;

    let targetConv = currentConv;

    if (!targetConv) {
      try {
        const res = await fetch("http://localhost:8000/conversations", {
          method: "POST",
          headers,
          signal: abortControllerRef.current?.signal 
        });
        if (res.ok && isMountedRef.current) {
          const data = await res.json();
          targetConv = data.conversation_id;
          setCurrentConv(targetConv);
          loadConversations();
        } else {
          if (isMountedRef.current) {
            alert(t("errorAutoSession"));
          }
          return;
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Error creando conversación:", err);
          setIsConnected(false);
        }
        return;
      }
    }

    const userMsg = createMessage("user", input);
    setMessages((prev) => [...prev, userMsg]);
    const messageToSend = input;
    setInput("");
    saveDraftToStorage(""); // Limpiar draft después de enviar
    setTimeout(scrollDown, 50);

    setMessages((prev) => {
      const botMsg = createMessage("bot", t("writing"));
      const newMessages = [...prev, botMsg];
      const botIndex = newMessages.length - 1;
      streamBotResponse(botIndex, messageToSend, targetConv as string, language);
      return newMessages;
    });
  }

  async function streamBotResponse(botIndex: number, userInput: string, convId: string, lang: "en" | "es") {
    try {
      setIsGenerating(true);
      // Crear un nuevo AbortController para esta solicitud
      abortControllerRef.current = new AbortController();
      
      const res = await fetch("http://localhost:8000/chat/stream", {
        method: "POST",
        headers,
        body: JSON.stringify({ message: userInput, conversation_id: convId, language: lang }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.body) throw new Error("No hay body en la respuesta");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedText = "";

      while (!done) {
        // Verificar si el componente todavía está montado
        if (!isMountedRef.current) {
          console.log("Componente desmontado, cancelando stream");
          try {
            reader.cancel();
          } catch (e) {
            console.error("Error al cancelar reader:", e);
          }
          abortControllerRef.current?.abort();
          return;
        }

        try {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          
          if (value) {
            const chunk = decoder.decode(value);
            accumulatedText += chunk;
            
            // Solo actualizar estado si el componente sigue montado
            if (isMountedRef.current) {
              setMessages((m) => {
                const newMessages = [...m];
                newMessages[botIndex] = createMessage("bot", accumulatedText);
                return newMessages;
              });
              scrollDown();
            }
          }
        } catch (readErr) {
          if (readErr instanceof Error && readErr.name === "AbortError") {
            console.log("Stream abortado por el cliente");
            break;
          }
          throw readErr;
        }
      }
      
      // Al terminar de contestar, recargamos el historial por si cambió el título
      if (isMountedRef.current) {
        loadConversations();
        setIsGenerating(false);
      }
    } catch (err: unknown) {
      // No mostrar error si fue abortado intencionalmente
      if (err instanceof Error && err.name === "AbortError") {
        console.log("Streaming cancelado por el usuario");
        setIsGenerating(false);
        return;
      }
      
      if (err instanceof Error) {
        console.error("Error en streamBotResponse:", err.name, err.message);
      }
      
      if (isMountedRef.current) {
        setMessages((m) => [...m, createMessage("bot", t("errorConnection"))]);
        scrollDown();
        setIsGenerating(false);
      }
    } finally {
      // Limpiar el AbortController si es que no se va a usar más
      if (abortControllerRef.current?.signal.aborted) {
        abortControllerRef.current = null;
        setIsGenerating(false);
      }
    }
  }

  useEffect(() => { if (token) loadConversations(); }, [token]);

  // Filtrar conversaciones por búsqueda
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Manejar cambio de dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", String(newDarkMode));
  };

  const rateMessage = (messageId: string | undefined, rating: "up" | "down") => {
    if (!messageId) return;
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, rated: msg.rated === rating ? null : rating } : msg
      )
    );
  };

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  };

  const toggleLanguage = (lang: "en" | "es") => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };

  return (
    <div class={`flex h-screen text-slate-700 font-sans transition-colors ${
      darkMode
        ? "bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100"
        : "bg-gradient-to-br from-blue-50 to-green-50"
    }`}>
      
      {/* 1. CHAT AREA (A la izquierda) */}
      <div class="flex-1 flex flex-col relative">
        {/* Header con indicador de conexión */}
        <div class={`px-8 py-4 border-b ${
          darkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white/50 border-slate-200"
        }`}>
          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold">Hermes</h1>
            <div class="flex items-center gap-3">
              <span class={`flex items-center gap-2 text-sm ${
                isConnected ? "text-green-500" : "text-red-500"
              }`}>
                <span class={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></span>
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

        {/* Messages */}
        <div class={`flex-1 overflow-y-auto p-8 space-y-6 ${
          darkMode ? "bg-slate-900" : ""
        }`}>
          {!currentConv && messages.length === 0 && (
            <div class={`h-full flex flex-col items-center justify-center gap-4 ${
              darkMode ? "text-slate-500" : "text-slate-400"
            }`}>
              <div class="text-6xl mb-4">💬</div>
              <p class="italic">{t("selectConv")}</p>
              <div class="mt-8 grid grid-cols-2 gap-3 text-sm">
                <button
                  onClick={() => setInput(language === "es" ? "¿Cómo puedo mejorar mi bienestar emocional?" : "How can I improve my emotional wellness?")}
                  class={`px-4 py-2 rounded-lg transition-colors ${
                    darkMode
                      ? "bg-slate-700 hover:bg-slate-600"
                      : "bg-slate-200 hover:bg-slate-300"
                  }`}
                >
                  {t("emotionalWellness")}
                </button>
                <button
                  onClick={() => setInput(language === "es" ? "¿Cómo manejo el estrés?" : "How do I manage stress?")}
                  class={`px-4 py-2 rounded-lg transition-colors ${
                    darkMode
                      ? "bg-slate-700 hover:bg-slate-600"
                      : "bg-slate-200 hover:bg-slate-300"
                  }`}
                >
                  {t("stressManagement")}
                </button>
                <button
                  onClick={() => setInput(language === "es" ? "¿Qué es la inteligencia emocional?" : "What is emotional intelligence?")}
                  class={`px-4 py-2 rounded-lg transition-colors ${
                    darkMode
                      ? "bg-slate-700 hover:bg-slate-600"
                      : "bg-slate-200 hover:bg-slate-300"
                  }`}
                >
                  {t("emotionalIntelligence")}
                </button>
                <button
                  onClick={() => setInput(language === "es" ? "¿Cómo puedo mejorar mis relaciones?" : "How can I improve my relationships?")}
                  class={`px-4 py-2 rounded-lg transition-colors ${
                    darkMode
                      ? "bg-slate-700 hover:bg-slate-600"
                      : "bg-slate-200 hover:bg-slate-300"
                  }`}
                >
                  {t("relationships")}
                </button>
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} class={`flex ${m.role === "user" ? "justify-end" : "justify-start"} group`}>
              <div class={`max-w-[70%] flex flex-col gap-1`}>
                <div class={`px-6 py-4 rounded-3xl shadow-sm leading-relaxed whitespace-pre-wrap transition-colors ${
                  m.role === "user"
                    ? darkMode
                      ? "bg-teal-600 text-white rounded-tr-none"
                      : "bg-teal-400 text-white rounded-tr-none"
                    : darkMode
                    ? "bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700"
                    : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                }`}>
                  {m.content}
                </div>
                <div class={`flex items-center gap-2 px-2 text-xs ${
                  darkMode ? "text-slate-500" : "text-slate-400"
                }`}>
                  <span>{formatTime(m.timestamp)}</span>
                  {m.role === "bot" && m.content !== "Escribiendo..." && (
                    <>
                      <span>•</span>
                      <button
                        onClick={() => copyToClipboard(m.content, m.id || "")}
                        class={`opacity-0 group-hover:opacity-100 transition-opacity hover:text-teal-500`}
                        title={t("copy")}
                      >
                        {copiedId === m.id ? t("copied") : t("copy")}
                      </button>
                      <span>•</span>
                      <button
                        onClick={() => rateMessage(m.id, "up")}
                        class={`transition-colors ${
                          m.rated === "up" ? "text-green-500" : "hover:text-green-500"
                        }`}
                        title="Útil"
                      >
                        👍
                      </button>
                      <button
                        onClick={() => rateMessage(m.id, "down")}
                        class={`transition-colors ${
                          m.rated === "down" ? "text-red-500" : "hover:text-red-500"
                        }`}
                        title="No útil"
                      >
                        👎
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div class={`p-6 ${darkMode ? "bg-slate-800 border-t border-slate-700" : "bg-transparent"}`}>
          <div class={`max-w-4xl mx-auto relative flex items-center gap-3 p-2 rounded-3xl shadow-lg border ${
            darkMode
              ? "bg-slate-700 border-slate-600"
              : "bg-white border-slate-100"
          }`}>
            <input
              class={`flex-1 px-6 py-3 bg-transparent outline-none placeholder-slate-400 ${
                darkMode ? "text-slate-100" : "text-slate-700"
              }`}
              placeholder={t("placeholder")}
              value={input}
              onInput={(e) => {
                setInput(e.currentTarget.value);
                saveDraftToStorage(e.currentTarget.value);
              }}
              onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
            />
            {isGenerating ? (
              <button
                class={`p-3 rounded-2xl transition-all bg-red-500 hover:bg-red-600 text-white shadow-md`}
                onClick={stopStreaming}
                title={t("stop")}
              >
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <rect x="4" y="4" width="12" height="12" />
                </svg>
              </button>
            ) : (
              <button
                class={`p-3 rounded-2xl transition-all ${
                  input.trim()
                    ? darkMode
                      ? "bg-teal-600 hover:bg-teal-500 text-white shadow-md"
                      : "bg-teal-400 hover:bg-teal-500 text-white shadow-md"
                    : darkMode
                    ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                    : "bg-slate-100 text-slate-300 cursor-not-allowed"
                }`}
                onClick={sendMessage}
                disabled={!input.trim()}
                title={t("send")}
              >
                <svg class="w-6 h-6 rotate-90" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            )}
          </div>
          <p class={`text-center text-[10px] mt-3 ${
            darkMode ? "text-slate-500" : "text-slate-400"
          }`}>
            {t("disclaimer")}
          </p>
        </div>
      </div>

      {/* 2. SIDEBAR (A la derecha) */}
      <div class={`w-72 flex flex-col p-6 shadow-sm transition-colors ${
        darkMode
          ? "bg-slate-800 border-l border-slate-700"
          : "bg-white/60 backdrop-blur-md border-l border-white/50"
      }`}>
        <div class="flex items-center gap-2 mb-6 px-2 justify-center">
          <img src="/corazon.png" alt="Corazón Hermes" class="w-8 h-8 object-contain" style="image-rendering: pixelated;" />
          <h2 class={`text-xl font-semibold tracking-tight ${
            darkMode ? "text-slate-100" : "text-slate-800"
          }`}>Hermes</h2>
        </div>

        {/* Menu con scroll horizontal */}
        <div class="mb-6 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-transparent">
          <div class="flex gap-2 pb-2">
            <button
              class={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl shadow-md transition-all active:scale-95 font-medium text-sm whitespace-nowrap flex-shrink-0 ${
                darkMode
                  ? "bg-teal-600 hover:bg-teal-500 text-white"
                  : "bg-teal-400 hover:bg-teal-500 text-white"
              }`}
              onClick={createNewConversation}
            >
              <span class="text-xl">+</span> {t("new")}
            </button>
            <button
              class={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl shadow-md transition-all active:scale-95 font-medium text-sm whitespace-nowrap flex-shrink-0 ${
                darkMode
                  ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                  : "bg-slate-200 hover:bg-slate-300 text-slate-700"
              }`}
              onClick={() => window.location.href = "/profile"}
            >
              <span class="text-lg">👤</span> {t("profile")}
            </button>
            <button
              class={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl shadow-md transition-all active:scale-95 font-medium text-sm whitespace-nowrap flex-shrink-0 ${
                darkMode
                  ? "bg-purple-700 hover:bg-purple-600 text-purple-200"
                  : "bg-purple-100 hover:bg-purple-200 text-purple-700"
              }`}
              onClick={() => window.location.href = "/stats"}
            >
              <span class="text-lg">📊</span> Stats
            </button>
          </div>
        </div>

        {/* Search */}
        <div class="mb-4">
          <input
            type="text"
            placeholder={t("search")}
            value={searchQuery}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
            class={`w-full px-4 py-2 rounded-lg outline-none text-sm transition-colors ${
              darkMode
                ? "bg-slate-700 text-slate-100 placeholder-slate-500 focus:bg-slate-600"
                : "bg-slate-100 text-slate-700 placeholder-slate-400 focus:bg-slate-200"
            }`}
          />
        </div>

        <div class={`flex-1 overflow-y-auto space-y-2 pr-2`}>
          <p class={`text-xs font-bold uppercase tracking-widest mb-3 ml-2 ${
            darkMode ? "text-slate-500" : "text-slate-400"
          }`}>
            {t("history")} ({filteredConversations.length})
          </p>
          {filteredConversations.map((conv) => (
            <div
              key={conv.conversation_id}
              class={`group flex justify-between items-center px-4 py-3 rounded-2xl transition-all cursor-pointer ${
                currentConv === conv.conversation_id
                  ? darkMode
                    ? "bg-slate-700 shadow-sm ring-1 ring-teal-500"
                    : "bg-white shadow-sm ring-1 ring-slate-100"
                  : darkMode
                  ? "hover:bg-slate-700"
                  : "hover:bg-white/40"
              }`}
              onClick={() => selectConversation(conv.conversation_id)}
            >
              <span class={`text-sm truncate font-medium ${
                darkMode ? "text-slate-200" : "text-slate-600"
              }`}>
                {conv.title}
              </span>
              <button
                class={`opacity-0 group-hover:opacity-100 ml-2 font-bold transition-opacity ${
                  darkMode
                    ? "text-slate-500 hover:text-red-400"
                    : "text-slate-300 hover:text-red-400"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.conversation_id);
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/";
          }}
          class={`mt-4 text-xs font-semibold transition-colors ${
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