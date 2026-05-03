import { useState, useEffect } from "preact/hooks";

interface ProfileData {
  nome_completo: string;
  edad: number | null;
  estado_relacion: string;
  ocupacion: string;
  enfermedades_pasadas: string;
  medicamentos_actuales: string;
  alergias: string;
  objetivos_bienestar: string;
  foto_perfil: string;
}

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData>({
    nome_completo: "",
    edad: null,
    estado_relacion: "",
    ocupacion: "",
    enfermedades_pasadas: "",
    medicamentos_actuales: "",
    alergias: "",
    objetivos_bienestar: "",
    foto_perfil: "",
  });

  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  // Nuevos estados para el modal de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      window.location.href = "/";
    } else {
      setToken(t);
      const savedDarkMode = localStorage.getItem("darkMode") === "true";
      setDarkMode(savedDarkMode);
      loadProfile(t);
    }
  }, []);

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };

  const loadProfile = async (userToken: string) => {
    const res = await fetch("http://localhost:8000/profile", {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userToken}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
      if (data.foto_perfil) {
        setPhotoPreview(data.foto_perfil);
      }
    }
  };

  const handleInputChange = (
    e: Event,
    field: keyof ProfileData
  ) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    const value =
      field === "edad"
        ? target.value === ""
          ? null
          : parseInt(target.value)
        : target.value;
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotoPreview(base64);
        setProfile((prev) => ({ ...prev, foto_perfil: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("http://localhost:8000/profile", {
        method: "POST",
        headers,
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setMessage("✅ Perfil guardado correctamente");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("❌ Error al guardar el perfil");
      }
    } catch (err) {
      setMessage("❌ Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  // Funciones para manejar el nuevo modal
  const openDeleteModal = () => {
    setDeleteStep(1);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteStep(1);
  };

  const handleConfirmDeleteStep = () => {
    if (deleteStep === 1) {
      setDeleteStep(2); // Pasamos a la segunda advertencia
    } else {
      executeDelete(); // Si ya estamos en el paso 2, ejecutamos el borrado
    }
  };

  const executeDelete = async () => {
    try {
      setSaving(true);
      setShowDeleteModal(false); // Cerramos el modal mientras carga
      const res = await fetch("http://localhost:8000/account", {
        method: "DELETE",
        headers,
      });

      if (res.ok) {
        setMessage("✅ Cuenta eliminada correctamente. Redirigiendo...");
        localStorage.removeItem("token");
        localStorage.removeItem("darkMode");
        localStorage.removeItem("language");
        localStorage.removeItem("model");
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      } else {
        setMessage("❌ Error al eliminar la cuenta. Intenta más tarde.");
        setSaving(false);
      }
    } catch (err) {
      setMessage("❌ Error de conexión. Intenta más tarde.");
      setSaving(false);
    }
  };

  return (
    <div class={`min-h-screen transition-colors relative ${
      darkMode
        ? "bg-gradient-to-br from-slate-900 to-slate-800"
        : "bg-gradient-to-br from-blue-50 to-green-50"
    } p-6`}>
      <div class={`max-w-2xl mx-auto`}>
        {/* Header */}
        <div class={`flex items-center justify-between mb-8 p-6 rounded-2xl shadow-lg ${
          darkMode
            ? "bg-slate-800 border border-slate-700"
            : "bg-white/50 border border-slate-100"
        }`}>
          <h1 class={`text-4xl font-bold ${darkMode ? "text-teal-400" : "text-teal-600"}`}>Mi Perfil</h1>
          <div class="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              class={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? "bg-slate-700 hover:bg-slate-600"
                  : "bg-slate-100 hover:bg-slate-200"
              }`}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button
              onClick={() => (window.location.href = "/chat")}
              class={`py-2 px-4 rounded-lg font-semibold flex items-center gap-2 transition-colors ${
                darkMode
                  ? "text-teal-400 hover:text-teal-300"
                  : "text-teal-600 hover:text-teal-700"
              }`}
            >
              ← Volver
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div class={`mb-6 p-4 rounded-2xl shadow-md border-l-4 text-sm font-medium ${
            message.includes("✅")
              ? darkMode
                ? "bg-green-900 border-green-500 text-green-100"
                : "bg-green-100 border-green-400 text-green-700"
              : darkMode
              ? "bg-red-900 border-red-500 text-red-100"
              : "bg-red-100 border-red-400 text-red-700"
          }`}>
            {message}
          </div>
        )}

        {/* Profile Card */}
        <div class={`rounded-3xl shadow-xl p-8 transition-colors ${
          darkMode
            ? "bg-slate-800 border border-slate-700"
            : "bg-white/80 backdrop-blur-md border border-white"
        }`}>
          {/* Foto de Perfil */}
          <div class="mb-8 text-center">
            <div class={`w-32 h-32 mx-auto mb-4 rounded-2xl overflow-hidden shadow-md flex items-center justify-center border-4 ${
              darkMode
                ? "border-teal-600 bg-slate-700"
                : "border-teal-200 bg-slate-100"
            }`}>
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Perfil"
                  class="w-full h-full object-cover"
                />
              ) : (
                <span class={`text-4xl ${darkMode ? "text-slate-500" : "text-slate-300"}`}>📷</span>
              )}
            </div>
            <label class="inline-block">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                class="hidden"
              />
              <span class={`px-6 py-2 rounded-2xl cursor-pointer transition-all font-medium ${
                darkMode
                  ? "bg-teal-600 hover:bg-teal-500 text-white"
                  : "bg-teal-400 hover:bg-teal-500 text-white"
              }`}>
                Cambiar foto
              </span>
            </label>
          </div>

          {/* Nombre completo */}
          <div class="mb-6">
            <label class={`block text-sm font-semibold mb-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
              Nombre completo
            </label>
            <input
              type="text"
              value={profile.nome_completo}
              onInput={(e) => handleInputChange(e, "nome_completo")}
              placeholder="Tu nombre completo"
              class={`w-full p-3 rounded-2xl border outline-none focus:ring-2 transition-colors ${
                darkMode
                  ? "bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500 focus:ring-teal-500"
                  : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-teal-200"
              }`}
            />
          </div>

          {/* Edad */}
          <div class="mb-6">
            <label class={`block text-sm font-semibold mb-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
              Edad
            </label>
            <input
              type="number"
              value={profile.edad || ""}
              onInput={(e) => handleInputChange(e, "edad")}
              placeholder="Tu edad"
              class={`w-full p-3 rounded-2xl border outline-none focus:ring-2 transition-colors ${
                darkMode
                  ? "bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500 focus:ring-teal-500"
                  : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-teal-200"
              }`}
            />
          </div>

          {/* Estado relación */}
          <div class="mb-6">
            <label class={`block text-sm font-semibold mb-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
              Estado relacional
            </label>
            <select
              value={profile.estado_relacion}
              onChange={(e) =>
                handleInputChange(e as any, "estado_relacion")
              }
              class={`w-full p-3 rounded-2xl border outline-none focus:ring-2 transition-colors ${
                darkMode
                  ? "bg-slate-700 border-slate-600 text-slate-100 focus:ring-teal-500"
                  : "bg-white border-slate-200 text-slate-900 focus:ring-teal-200"
              }`}
            >
              <option value="">Selecciona una opción</option>
              <option value="Soltero/a">Soltero/a</option>
              <option value="En pareja">En pareja</option>
              <option value="Casado/a">Casado/a</option>
              <option value="Separado/a">Separado/a</option>
              <option value="Divorciado/a">Divorciado/a</option>
              <option value="Viudo/a">Viudo/a</option>
              <option value="Prefiero no decir">Prefiero no decir</option>
            </select>
          </div>

          {/* Ocupación */}
          <div class="mb-6">
            <label class={`block text-sm font-semibold mb-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
              Ocupación
            </label>
            <input
              type="text"
              value={profile.ocupacion}
              onInput={(e) => handleInputChange(e, "ocupacion")}
              placeholder="Tu ocupación o profesión"
              class={`w-full p-3 rounded-2xl border outline-none focus:ring-2 transition-colors ${
                darkMode
                  ? "bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500 focus:ring-teal-500"
                  : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-teal-200"
              }`}
            />
          </div>

          {/* Enfermedades pasadas */}
          <div class="mb-6">
            <label class={`block text-sm font-semibold mb-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
              Enfermedades o problemas de salud pasados
            </label>
            <textarea
              value={profile.enfermedades_pasadas}
              onInput={(e) => handleInputChange(e, "enfermedades_pasadas")}
              placeholder="Describe enfermedades o problemas de salud que hayas tenido (ej: depresión, ansiedad, diabetes, etc.)"
              class={`w-full p-3 rounded-2xl border outline-none focus:ring-2 transition-colors resize-none h-24 ${
                darkMode
                  ? "bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500 focus:ring-teal-500"
                  : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-teal-200"
              }`}
            ></textarea>
          </div>

          {/* Medicamentos actuales */}
          <div class="mb-6">
            <label class={`block text-sm font-semibold mb-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
              Medicamentos actuales
            </label>
            <textarea
              value={profile.medicamentos_actuales}
              onInput={(e) => handleInputChange(e, "medicamentos_actuales")}
              placeholder="Medicamentos que estés tomando actualmente (se recomienda indicar dosis si es relevante)"
              class={`w-full p-3 rounded-2xl border outline-none focus:ring-2 transition-colors resize-none h-24 ${
                darkMode
                  ? "bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500 focus:ring-teal-500"
                  : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-teal-200"
              }`}
            ></textarea>
          </div>

          {/* Alergias */}
          <div class="mb-6">
            <label class={`block text-sm font-semibold mb-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
              Alergias
            </label>
            <textarea
              value={profile.alergias}
              onInput={(e) => handleInputChange(e, "alergias")}
              placeholder="Alergias que tengas (medicamentos, alimentos, etc.)"
              class={`w-full p-3 rounded-2xl border outline-none focus:ring-2 transition-colors resize-none h-20 ${
                darkMode
                  ? "bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500 focus:ring-teal-500"
                  : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-teal-200"
              }`}
            ></textarea>
          </div>

          {/* Objetivos de bienestar */}
          <div class="mb-8">
            <label class={`block text-sm font-semibold mb-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
              Objetivos de bienestar
            </label>
            <textarea
              value={profile.objetivos_bienestar}
              onInput={(e) => handleInputChange(e, "objetivos_bienestar")}
              placeholder="¿Cuáles son tus objetivos o metas de bienestar emocional? (ej: reducir estrés, mejorar autoestima, etc.)"
              class={`w-full p-3 rounded-2xl border outline-none focus:ring-2 transition-colors resize-none h-24 ${
                darkMode
                  ? "bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500 focus:ring-teal-500"
                  : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-teal-200"
              }`}
            ></textarea>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            class={`w-full py-3 rounded-2xl font-bold text-white transition-all shadow-lg ${
              saving
                ? darkMode
                  ? "bg-slate-600 cursor-not-allowed"
                  : "bg-slate-300 cursor-not-allowed"
                : darkMode
                ? "bg-teal-600 hover:bg-teal-500 active:scale-95"
                : "bg-teal-400 hover:bg-teal-500 active:scale-95"
            }`}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>

          {/* Info */}
          <p class={`text-center text-xs mt-6 ${
            darkMode ? "text-slate-500" : "text-slate-400"
          }`}>
            Estos datos ayudan a Hermes a personalizar su apoyo y comprensión hacia ti.
          </p>

          {/* Delete Account Button */}
          <button
            onClick={openDeleteModal}
            disabled={saving}
            class={`w-full py-3 rounded-2xl font-bold text-white transition-all shadow-lg mt-8 border-2 ${
              saving
                ? "bg-slate-400 border-slate-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 border-red-700 active:scale-95"
            }`}
          >
            🗑️ Eliminar cuenta
          </button>
          <p class={`text-center text-xs mt-2 ${
            darkMode ? "text-red-400" : "text-red-500"
          }`}>
            Esta acción es permanente e irreversible
          </p>
        </div>
      </div>

      {/* Modal Personalizado de Eliminación */}
      {showDeleteModal && (
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div class={`max-w-md w-full p-6 rounded-3xl shadow-2xl ${
            darkMode ? "bg-slate-800 text-slate-100 border border-slate-700" : "bg-white text-slate-800"
          }`}>
            <h2 class={`text-2xl font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-red-400" : "text-red-600"}`}>
              ⚠️ Advertencia
            </h2>
            
            {deleteStep === 1 ? (
              <p class="mb-6 opacity-90">
                ¿Estás completamente seguro? Esta acción eliminará tu cuenta y <strong>TODOS</strong> tus datos (conversaciones, perfil, tags, etc.) de forma permanente e irreversible.
              </p>
            ) : (
              <p class="mb-6 font-semibold">
                Esta es tu última oportunidad. ¿Estás seguro de que deseas eliminar la cuenta de forma definitiva?
              </p>
            )}

            <div class="flex gap-3 mt-8">
              <button
                onClick={closeDeleteModal}
                class={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
                  darkMode
                    ? "bg-slate-700 hover:bg-slate-600 text-slate-200"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteStep}
                class={`flex-1 py-3 px-4 rounded-xl font-bold text-white transition-all shadow-md active:scale-95 ${
                  deleteStep === 1
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-red-700 hover:bg-red-800 animate-pulse"
                }`}
              >
                {deleteStep === 1 ? "Sí, eliminar" : "Sí, estoy seguro"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}