import { useState, useEffect } from "preact/hooks";

interface Disorder {
  name: string;
  confidence: string;
  indicators: string[];
}

interface AnalysisResult {
  overall_assessment: string;
  detected_patterns: string[];
  possible_disorders: Disorder[];
  recommendations: string[];
  analysis_date: string;
}

export default function DisorderAnalysis() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [model, setModel] = useState("hermes");
  const [language, setLanguage] = useState("es");

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      window.location.href = "/";
    } else {
      setToken(t);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!token) return;
    
    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const response = await fetch("http://localhost:8000/disorder-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ model, language }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      } else {
        setError("Error al realizar el análisis. Por favor, intenta de nuevo.");
      }
    } catch (err) {
      setError("Error de conexión. Verifica que el servidor esté disponible.");
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case "alta":
        return "bg-red-100 border-red-300 text-red-800";
      case "media":
        return "bg-yellow-100 border-yellow-300 text-yellow-800";
      case "baja":
        return "bg-blue-100 border-blue-300 text-blue-800";
      default:
        return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  return (
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
      <div class="max-w-4xl mx-auto">
        {/* Header */}
        <div class="bg-white rounded-3xl shadow-lg p-8 mb-6 border border-slate-100">
          <h1 class="text-4xl font-bold text-teal-600 mb-2">Análisis de Bienestar</h1>
          <p class="text-slate-600 mb-6">
            Hermes analiza tus conversaciones para identificar patrones y posibles condiciones de salud mental.
          </p>

          {/* Controles */}
          <div class="flex gap-4 flex-wrap items-end">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Modelo</label>
              <select
                value={model}
                onInput={(e) => setModel(e.currentTarget.value)}
                class="px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-200 outline-none"
              >
                <option value="hermes">Hermes v2.0</option>
                <option value="hermes-mini">Hermes Mini</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Idioma</label>
              <select
                value={language}
                onInput={(e) => setLanguage(e.currentTarget.value)}
                class="px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-200 outline-none"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading}
              class={`px-6 py-2 rounded-xl font-semibold transition-all ${
                loading
                  ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                  : "bg-teal-600 text-white hover:bg-teal-700 shadow-lg hover:shadow-xl"
              }`}
            >
              {loading ? "Analizando..." : "Analizar Ahora"}
            </button>
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div class="bg-red-100 border border-red-300 text-red-800 px-6 py-4 rounded-2xl mb-6">
            {error}
          </div>
        )}

        {/* Resultados del análisis */}
        {analysis && (
          <div class="space-y-6">
            {/* Evaluación General */}
            <div class="bg-white rounded-3xl shadow-lg p-8 border border-slate-100">
              <h2 class="text-2xl font-bold text-teal-600 mb-4">Evaluación General</h2>
              <p class="text-lg text-slate-700 leading-relaxed">
                {analysis.overall_assessment || "No hay datos para mostrar"}
              </p>
            </div>

            {/* Patrones Detectados */}
            {analysis.detected_patterns && analysis.detected_patterns.length > 0 && (
              <div class="bg-white rounded-3xl shadow-lg p-8 border border-slate-100">
                <h2 class="text-2xl font-bold text-teal-600 mb-4">Patrones Detectados</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysis.detected_patterns.map((pattern, idx) => (
                    <div
                      key={idx}
                      class="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-slate-700"
                    >
                      • {pattern}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Posibles Condiciones */}
            {analysis.possible_disorders && analysis.possible_disorders.length > 0 && (
              <div class="bg-white rounded-3xl shadow-lg p-8 border border-slate-100">
                <h2 class="text-2xl font-bold text-teal-600 mb-4">Posibles Condiciones</h2>
                <div class="space-y-4">
                  {analysis.possible_disorders.map((disorder, idx) => (
                    <div
                      key={idx}
                      class={`rounded-2xl p-6 border ${getConfidenceColor(disorder.confidence)}`}
                    >
                      <div class="flex items-center justify-between mb-3">
                        <h3 class="text-xl font-bold">{disorder.name}</h3>
                        <span class="px-3 py-1 rounded-full text-sm font-semibold bg-white bg-opacity-70">
                          Confianza: {disorder.confidence}
                        </span>
                      </div>
                      {disorder.indicators && disorder.indicators.length > 0 && (
                        <div class="space-y-2">
                          <p class="text-sm font-semibold opacity-75">Indicadores detectados:</p>
                          <ul class="space-y-1">
                            {disorder.indicators.map((indicator, i) => (
                              <li key={i} class="text-sm opacity-90">
                                ✓ {indicator}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recomendaciones */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div class="bg-green-50 rounded-3xl shadow-lg p-8 border border-green-200">
                <h2 class="text-2xl font-bold text-green-700 mb-4">Recomendaciones</h2>
                <ul class="space-y-3">
                  {analysis.recommendations.map((rec, idx) => (
                    <li key={idx} class="flex items-start gap-3 text-green-800">
                      <span class="text-xl mt-1">✓</span>
                      <span class="text-lg">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Información de análisis */}
            <div class="text-center text-slate-500 text-sm">
              Análisis realizado: {new Date(analysis.analysis_date).toLocaleString()}
            </div>

            {/* Aviso legal */}
            <div class="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-amber-800 text-sm">
              <p class="font-semibold mb-2">⚠️ Aviso Importante</p>
              <p>
                Este análisis es informativo y no constituye un diagnóstico médico. Los resultados se basan en patrones de conversación y no reemplazan la evaluación de un profesional de la salud mental cualificado. Si experimentas síntomas severos, consulta con un médico o psicólogo inmediatamente.
              </p>
            </div>
          </div>
        )}

        {/* Estado inicial */}
        {!analysis && !error && !loading && (
          <div class="bg-white rounded-3xl shadow-lg p-12 text-center border border-slate-100">
            <div class="text-5xl mb-4">🔍</div>
            <h3 class="text-2xl font-bold text-slate-700 mb-2">Comienza el Análisis</h3>
            <p class="text-slate-600 mb-6">
              Hermes analizará tus conversaciones anteriores para identificar patrones y proporcionar información valiosa sobre tu bienestar emocional.
            </p>
            <button
              onClick={handleAnalyze}
              class="px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-all shadow-lg hover:shadow-xl"
            >
              Comenzar Análisis
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
