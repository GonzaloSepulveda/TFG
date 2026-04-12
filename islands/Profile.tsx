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

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      window.location.href = "/";
    } else {
      setToken(t);
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

  return (
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
      <div class="max-w-2xl mx-auto">
        {/* Header */}
        <div class="flex items-center justify-between mb-8">
          <h1 class="text-4xl font-bold text-teal-600">Mi Perfil</h1>
          <button
            onClick={() => (window.location.href = "/chat")}
            class="text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-2"
          >
            ← Volver al chat
          </button>
        </div>

        {/* Message */}
        {message && (
          <div class="mb-6 p-4 rounded-2xl bg-white shadow-md border-l-4 border-teal-400 text-sm font-medium">
            {message}
          </div>
        )}

        {/* Profile Card */}
        <div class="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-white">
          {/* Foto de Perfil */}
          <div class="mb-8 text-center">
            <div class="w-32 h-32 mx-auto mb-4 rounded-2xl overflow-hidden border-4 border-teal-200 shadow-md bg-slate-100 flex items-center justify-center">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Perfil"
                  class="w-full h-full object-cover"
                />
              ) : (
                <span class="text-4xl text-slate-300">📷</span>
              )}
            </div>
            <label class="inline-block">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                class="hidden"
              />
              <span class="px-6 py-2 bg-teal-400 hover:bg-teal-500 text-white rounded-2xl cursor-pointer transition-all font-medium">
                Cambiar foto
              </span>
            </label>
          </div>

          {/* Nombre completo */}
          <div class="mb-6">
            <label class="block text-sm font-semibold text-slate-700 mb-2">
              Nombre completo
            </label>
            <input
              type="text"
              value={profile.nome_completo}
              onInput={(e) => handleInputChange(e, "nome_completo")}
              placeholder="Tu nombre completo"
              class="w-full p-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-200 bg-white"
            />
          </div>

          {/* Edad */}
          <div class="mb-6">
            <label class="block text-sm font-semibold text-slate-700 mb-2">
              Edad
            </label>
            <input
              type="number"
              value={profile.edad || ""}
              onInput={(e) => handleInputChange(e, "edad")}
              placeholder="Tu edad"
              class="w-full p-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-200 bg-white"
            />
          </div>

          {/* Estado relación */}
          <div class="mb-6">
            <label class="block text-sm font-semibold text-slate-700 mb-2">
              Estado relacional
            </label>
            <select
              value={profile.estado_relacion}
              onChange={(e) =>
                handleInputChange(e as any, "estado_relacion")
              }
              class="w-full p-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-200 bg-white"
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
            <label class="block text-sm font-semibold text-slate-700 mb-2">
              Ocupación
            </label>
            <input
              type="text"
              value={profile.ocupacion}
              onInput={(e) => handleInputChange(e, "ocupacion")}
              placeholder="Tu ocupación o profesión"
              class="w-full p-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-200 bg-white"
            />
          </div>

          {/* Enfermedades pasadas */}
          <div class="mb-6">
            <label class="block text-sm font-semibold text-slate-700 mb-2">
              Enfermedades o problemas de salud pasados
            </label>
            <textarea
              value={profile.enfermedades_pasadas}
              onInput={(e) => handleInputChange(e, "enfermedades_pasadas")}
              placeholder="Describe enfermedades o problemas de salud que hayas tenido (ej: depresión, ansiedad, diabetes, etc.)"
              class="w-full p-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-200 bg-white resize-none h-24"
            ></textarea>
          </div>

          {/* Medicamentos actuales */}
          <div class="mb-6">
            <label class="block text-sm font-semibold text-slate-700 mb-2">
              Medicamentos actuales
            </label>
            <textarea
              value={profile.medicamentos_actuales}
              onInput={(e) => handleInputChange(e, "medicamentos_actuales")}
              placeholder="Medicamentos que estés tomando actualmente (se recomienda indicar dosis si es relevante)"
              class="w-full p-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-200 bg-white resize-none h-24"
            ></textarea>
          </div>

          {/* Alergias */}
          <div class="mb-6">
            <label class="block text-sm font-semibold text-slate-700 mb-2">
              Alergias
            </label>
            <textarea
              value={profile.alergias}
              onInput={(e) => handleInputChange(e, "alergias")}
              placeholder="Alergias que tengas (medicamentos, alimentos, etc.)"
              class="w-full p-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-200 bg-white resize-none h-20"
            ></textarea>
          </div>

          {/* Objetivos de bienestar */}
          <div class="mb-8">
            <label class="block text-sm font-semibold text-slate-700 mb-2">
              Objetivos de bienestar
            </label>
            <textarea
              value={profile.objetivos_bienestar}
              onInput={(e) => handleInputChange(e, "objetivos_bienestar")}
              placeholder="¿Cuáles son tus objetivos o metas de bienestar emocional? (ej: reducir estrés, mejorar autoestima, etc.)"
              class="w-full p-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-200 bg-white resize-none h-24"
            ></textarea>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            class={`w-full py-3 rounded-2xl font-bold text-white transition-all shadow-lg ${
              saving
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-teal-400 hover:bg-teal-500 active:scale-95"
            }`}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>

          {/* Info */}
          <p class="text-center text-xs text-slate-400 mt-6">
            Estos datos ayudan a Hermes a personalizar su apoyo y comprensión
            hacia ti.
          </p>
        </div>
      </div>
    </div>
  );
}
