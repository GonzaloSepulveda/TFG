import { useState, useEffect, useRef } from "preact/hooks";

interface Message {
  role: "user" | "bot";
  content: string;
}

interface Conversation {
  conversation_id: string;
  title: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConv, setCurrentConv] = useState<string | null>(null);
  const [token, setToken] = useState("");

  const endRef = useRef<HTMLDivElement>(null);
  const scrollDown = () => endRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      window.location.href = "/";
    } else {
      setToken(t);
    }
  }, []);

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };

  const createMessage = (role: "user" | "bot", content: string): Message => ({ role, content });

  const loadConversations = async () => {
    if (!token) return;
    const res = await fetch("http://localhost:8000/conversations", { headers });
    if (res.ok) {
      const data = await res.json();
      setConversations(data);
    }
  };

  const selectConversation = async (conv_id: string) => {
    setCurrentConv(conv_id);
    const res = await fetch(`http://localhost:8000/conversations/${conv_id}/messages`, { headers });
    if (res.ok) {
      const msgs = await res.json();
      setMessages(msgs);
      setTimeout(scrollDown, 100);
    }
  };

  const deleteConversation = async (conv_id: string) => {
    await fetch(`http://localhost:8000/conversations/${conv_id}`, { method: "DELETE", headers });
    if (currentConv === conv_id) setMessages([]);
    setCurrentConv(null);
    loadConversations();
  };

  const createNewConversation = async () => {
    const res = await fetch("http://localhost:8000/conversations", {
      method: "POST",
      headers,
    });
    if (res.ok) {
      const data = await res.json();
      setCurrentConv(data.conversation_id);
      setMessages([]); // Limpia la pantalla al instante para mejor UX
      loadConversations();
    }
  };

  async function sendMessage() {
    if (!input.trim() || !token) return;

    let targetConv = currentConv;

    if (!targetConv) {
      const res = await fetch("http://localhost:8000/conversations", {
        method: "POST",
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        targetConv = data.conversation_id;
        setCurrentConv(targetConv);
        loadConversations();
      } else {
        alert("Error al iniciar la sesión automática.");
        return;
      }
    }

    const userMsg = createMessage("user", input);
    setMessages((prev) => [...prev, userMsg]);
    const messageToSend = input;
    setInput("");
    setTimeout(scrollDown, 50);

    setMessages((prev) => {
      const botMsg = createMessage("bot", "Escribiendo...");
      const newMessages = [...prev, botMsg];
      const botIndex = newMessages.length - 1;
      streamBotResponse(botIndex, messageToSend, targetConv as string);
      return newMessages;
    });
  }

  async function streamBotResponse(botIndex: number, userInput: string, convId: string) {
    try {
      const res = await fetch("http://localhost:8000/chat/stream", {
        method: "POST",
        headers,
        body: JSON.stringify({ message: userInput, conversation_id: convId }),
      });

      if (!res.body) throw new Error("No hay body en la respuesta");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedText = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value);
          accumulatedText += chunk;
          setMessages((m) => {
            const newMessages = [...m];
            newMessages[botIndex] = createMessage("bot", accumulatedText);
            return newMessages;
          });
          scrollDown();
        }
      }
      // Al terminar de contestar, recargamos el historial por si cambió el título
      loadConversations();
    } catch (err) {
      setMessages((m) => [...m, createMessage("bot", "❌ Error de conexión.")]);
      scrollDown();
    }
  }

  useEffect(() => { if (token) loadConversations(); }, [token]);

  return (
    <div class="flex h-screen bg-gradient-to-br from-blue-50 to-green-50 text-slate-700 font-sans">
      
      {/* 1. CHAT AREA (A la izquierda) */}
      <div class="flex-1 flex flex-col relative">
        <div class="flex-1 overflow-y-auto p-8 space-y-6">
          {!currentConv && messages.length === 0 && (
            <div class="h-full flex items-center justify-center text-slate-400 italic">
              Selecciona una conversación a la derecha o escribe un mensaje para empezar
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} class={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div class={`max-w-[70%] px-6 py-4 rounded-3xl shadow-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user" 
                  ? "bg-teal-400 text-white rounded-tr-none" 
                  : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div class="p-6 bg-transparent">
          <div class="max-w-4xl mx-auto relative flex items-center gap-3 bg-white p-2 rounded-3xl shadow-lg border border-slate-100">
            <input
              class="flex-1 px-6 py-3 bg-transparent outline-none text-slate-700 placeholder-slate-400"
              placeholder="¿Cómo te sientes hoy?"
              value={input}
              onInput={(e) => setInput(e.currentTarget.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
            />
            <button 
              class={`p-3 rounded-2xl transition-all ${input.trim() ? 'bg-teal-400 text-white shadow-md' : 'bg-slate-100 text-slate-300'}`} 
              onClick={sendMessage}
              disabled={!input.trim()}
            >
              <svg class="w-6 h-6 rotate-90" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
          <p class="text-center text-[10px] text-slate-400 mt-3">
            Hermes es una IA de apoyo y no sustituye el consejo médico profesional.
          </p>
        </div>
      </div>

      {/* 2. SIDEBAR (A la derecha) */}
      <div class="w-72 bg-white/60 backdrop-blur-md border-l border-white/50 flex flex-col p-6 shadow-sm">
        <div class="flex items-center gap-2 mb-4 px-2 justify-center">
        {/* Usamos tu imagen del corazón. Asegúrate de que el nombre coincida */}
        <img src="/corazon.png" alt="Corazón Hermes" class="w-8 h-8 object-contain" style="image-rendering: pixelated;" />
        <h2 class="text-xl font-semibold text-slate-800 tracking-tight">Hermes</h2>
      </div>

        <div class="flex gap-2 mb-6">
          <button 
            class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-teal-400 hover:bg-teal-500 text-white rounded-2xl shadow-md transition-all active:scale-95 font-medium text-sm" 
            onClick={createNewConversation}
          >
            <span class="text-xl">+</span> Nueva
          </button>
          <button 
            class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-2xl shadow-md transition-all active:scale-95 font-medium text-sm" 
            onClick={() => window.location.href = "/profile"}
          >
            <span class="text-lg">👤</span> Perfil
          </button>
        </div>

        <div class="flex-1 overflow-y-auto space-y-2 pr-2">
          <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2">Historial</p>
          {conversations.map((conv) => (
            <div 
              key={conv.conversation_id} 
              class={`group flex justify-between items-center px-4 py-3 rounded-2xl transition-all cursor-pointer ${currentConv === conv.conversation_id ? 'bg-white shadow-sm ring-1 ring-slate-100' : 'hover:bg-white/40'}`}
              onClick={() => selectConversation(conv.conversation_id)}
            >
              <span class="text-sm truncate font-medium text-slate-600">
                {conv.title}
              </span>
              <button 
                class="opacity-0 group-hover:opacity-100 ml-2 text-slate-300 hover:text-red-400 font-bold transition-opacity" 
                onClick={(e) => { e.stopPropagation(); deleteConversation(conv.conversation_id); }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        
        <button 
          onClick={() => { localStorage.removeItem("token"); window.location.href = "/"; }}
          class="mt-4 text-xs font-semibold text-slate-400 hover:text-red-400 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>

    </div>
  );
}