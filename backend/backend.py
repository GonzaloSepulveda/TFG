from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import ollama
from db import users_collection, conversations_collection, messages_collection, profiles_collection
from datetime import datetime
from bson import ObjectId

# ✅ Título actualizado a Hermes
app = FastAPI(title="Hermes API - Bienestar Emocional")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_NAME = "hermes"

# El System Prompt define la identidad central
SYSTEM_PROMPT = (
    "Eres Hermes, un asistente empático especializado en bienestar emocional. "
    "Tu tono debe ser calmado, comprensivo y profesional. No sustituyes a un psicólogo, "
    "pero ofreces apoyo, validación emocional y escucha activa en español. "
    "Si detectas riesgo grave, sugiere amablemente buscar ayuda profesional."
)

class UserAuth(BaseModel):
    email: str
    password: str
    isRegister: bool = False

class MessageRequest(BaseModel):
    conversation_id: str
    message: str

class ProfileData(BaseModel):
    nome_completo: str | None = None
    edad: int | None = None
    estado_relacion: str | None = None
    ocupacion: str | None = None
    enfermedades_pasadas: str | None = None
    medicamentos_actuales: str | None = None
    alergias: str | None = None
    objetivos_bienestar: str | None = None
    foto_perfil: str | None = None  # base64 encoded image

# ===============================
# AUTENTICACIÓN
# ===============================
async def get_current_user(authorization: str = Header(...)):
    try:
        token = authorization.split(" ")[1]
        user = users_collection.find_one({"email": token})
        if not user: 
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"No autorizado: {str(e)}")

@app.post("/auth")
async def auth(user: UserAuth):
    if user.isRegister:
        if users_collection.find_one({"email": user.email}):
            raise HTTPException(status_code=400, detail="El usuario ya existe")
        users_collection.insert_one({"email": user.email, "password": user.password})
        return {"access_token": user.email} 
    
    db_user = users_collection.find_one({"email": user.email, "password": user.password})
    if not db_user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    return {"access_token": user.email}

# ===============================
# GESTIÓN DE PERFILES DE USUARIO
# ===============================
@app.get("/profile")
async def get_profile(current_user=Depends(get_current_user)):
    profile = profiles_collection.find_one({"user_id": str(current_user["_id"])})
    
    # Valores por defecto
    default_profile = {
        "nome_completo": "",
        "edad": None,
        "estado_relacion": "",
        "ocupacion": "",
        "enfermedades_pasadas": "",
        "medicamentos_actuales": "",
        "alergias": "",
        "objetivos_bienestar": "",
        "foto_perfil": ""
    }
    
    if not profile:
        return default_profile
    
    # Remover el ID de MongoDB de la respuesta
    profile.pop("_id", None)
    profile.pop("user_id", None)
    
    # Merge con valores por defecto para campos faltantes
    return {**default_profile, **profile}

@app.post("/profile")
async def update_profile(profile_data: ProfileData, current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # Solo incluir campos que no sean None
    profile_dict = {k: v for k, v in profile_data.dict().items() if v is not None}
    
    if not profile_dict:
        return {"msg": "No hay cambios para guardar"}
    
    result = profiles_collection.update_one(
        {"user_id": user_id},
        {"$set": {**profile_dict, "user_id": user_id}},
        upsert=True
    )
    
    return {"msg": "Perfil actualizado correctamente"}

# ===============================
# GESTIÓN DE CONVERSACIONES
# ===============================
@app.post("/conversations")
async def create_conv(current_user=Depends(get_current_user)):
    res = conversations_collection.insert_one({
        "user_id": str(current_user["_id"]),
        "title": "Nueva sesión",
        "created_at": datetime.now()
    })
    return {"conversation_id": str(res.inserted_id)}

@app.get("/conversations")
async def get_conversations(current_user=Depends(get_current_user)):
    convs = conversations_collection.find({"user_id": str(current_user["_id"])}).sort("created_at", -1)
    return [{"conversation_id": str(c["_id"]), "title": c.get("title", "Nueva sesión")} for c in convs]

@app.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, current_user=Depends(get_current_user)):
    conversations_collection.delete_one({"_id": ObjectId(conversation_id), "user_id": str(current_user["_id"])})
    messages_collection.delete_many({"conversation_id": conversation_id, "user_id": str(current_user["_id"])})
    return {"msg": "Conversación eliminada"}

# ===============================
# MENSAJES Y CHAT IA
# ===============================
@app.get("/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: str, current_user=Depends(get_current_user)):
    msgs = messages_collection.find({
        "conversation_id": conversation_id, 
        "user_id": str(current_user["_id"])
    }).sort("timestamp", 1)
    return [{"role": m.get("role"), "content": m.get("content")} for m in msgs]

@app.post("/chat/stream")
async def chat_stream(request: MessageRequest, current_user=Depends(get_current_user)):
    # Guardamos el mensaje del usuario
    messages_collection.insert_one({
        "conversation_id": request.conversation_id,
        "user_id": str(current_user["_id"]),
        "role": "user",
        "content": request.message,
        "timestamp": datetime.now()
    })

    # Si es el primer mensaje, actualizamos el título de la conversación
    conv = conversations_collection.find_one({"_id": ObjectId(request.conversation_id)})
    if conv and conv.get("title") == "Nueva sesión":
        nuevo_titulo = request.message[:30] + "..." if len(request.message) > 30 else request.message
        conversations_collection.update_one(
            {"_id": ObjectId(request.conversation_id)},
            {"$set": {"title": nuevo_titulo}}
        )

    # Recuperamos los últimos 4 mensajes para dar contexto al modelo (Memoria a corto plazo)
    historial = messages_collection.find({
        "conversation_id": request.conversation_id,
        "user_id": str(current_user["_id"])
    }).sort("timestamp", -1).limit(4)
    
    contexto_str = ""
    for msg in reversed(list(historial)):
        # ✅ AQUÍ: Cambiamos "Prometeo" por "Hermes" para las etiquetas del historial
        rol = "Usuario" if msg["role"] == "user" else "Hermes"
        contexto_str += f"{rol}: {msg['content']}\n"

    # Cargar perfil del usuario para personalizar la respuesta
    profile = profiles_collection.find_one({"user_id": str(current_user["_id"])})
    profile_context = ""
    if profile:
        # Solo incluir campos con contenido
        parts = []
        if profile.get('nome_completo'):
            parts.append(f"- Nombre: {profile.get('nome_completo')}")
        if profile.get('edad'):
            parts.append(f"- Edad: {profile.get('edad')}")
        if profile.get('estado_relacion'):
            parts.append(f"- Estado relación: {profile.get('estado_relacion')}")
        if profile.get('ocupacion'):
            parts.append(f"- Ocupación: {profile.get('ocupacion')}")
        if profile.get('enfermedades_pasadas'):
            parts.append(f"- Enfermedades pasadas: {profile.get('enfermedades_pasadas')}")
        if profile.get('medicamentos_actuales'):
            parts.append(f"- Medicamentos actuales: {profile.get('medicamentos_actuales')}")
        if profile.get('alergias'):
            parts.append(f"- Alergias: {profile.get('alergias')}")
        if profile.get('objetivos_bienestar'):
            parts.append(f"- Objetivos de bienestar: {profile.get('objetivos_bienestar')}")
        
        if parts:
            profile_context = f"\nInformación del usuario:\n" + "\n".join(parts)

    async def generator():
        # ✅ AQUÍ: Cambiamos "Prometeo:" por "Hermes:" al final del prompt para que él empiece a hablar
        full_prompt = f"{SYSTEM_PROMPT}{profile_context}\n\nHistorial reciente:\n{contexto_str}\nHermes:"
        accumulated = ""
        for chunk in ollama.generate(model=MODEL_NAME, prompt=full_prompt, stream=True):
            content = chunk['response']
            accumulated += content
            yield content
        
        # Guardamos la respuesta de la IA cuando termine
        messages_collection.insert_one({
            "conversation_id": request.conversation_id,
            "user_id": str(current_user["_id"]),
            "role": "bot",
            "content": accumulated,
            "timestamp": datetime.now()
        })

    return StreamingResponse(generator(), media_type="text/plain")