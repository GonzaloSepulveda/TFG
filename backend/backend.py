from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import ollama
from db import users_collection, conversations_collection, messages_collection, profiles_collection, ratings_collection, stats_collection
from datetime import datetime
from bson import ObjectId
import asyncio
import logging
import base64

# Configurar logging para ver excepciones de socket
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ✅ Título actualizado a Hermes
app = FastAPI(title="Hermes API - Bienestar Emocional")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_NAME = "hermes"

# System Prompts en español e inglés
SYSTEM_PROMPT_EN = (
    "You are Hermes, an empathetic assistant specialized in emotional wellness. "
    "Your tone should be calm, understanding, and professional. You are not a replacement for a psychologist, "
    "but you offer support, emotional validation, and active listening in English. "
    "If you detect serious risk, gently suggest seeking professional help."
)

SYSTEM_PROMPT_ES = (
    "Eres Hermes, un asistente empático especializado en bienestar emocional. "
    "Tu tono debe ser calmado, comprensivo y profesional. No sustituyes a un psicólogo, "
    "pero ofreces apoyo, validación emocional y escucha activa en español. "
    "Si detectas riesgo grave, sugiere amablemente buscar ayuda profesional."
)

def get_system_prompt(language: str = "en") -> str:
    """Get system prompt based on language code"""
    return SYSTEM_PROMPT_ES if language == "es" else SYSTEM_PROMPT_EN

class UserAuth(BaseModel):
    email: str
    password: str
    isRegister: bool = False

class MessageRequest(BaseModel):
    conversation_id: str
    message: str
    language: str = "en"  # "en" o "es"
    model: str = "hermes"  # "hermes" o "hermes-mini"

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

class MessageRating(BaseModel):
    message_id: str
    conversation_id: str
    rating: str  # "up" o "down"

class TagRequest(BaseModel):
    tag: str
    color: str = "#3b82f6"  # Color por defecto azul

class DisorderAnalysisRequest(BaseModel):
    language: str = "en"  # "en" o "es"
    model: str = "hermes"

class DisorderAnalysisResponse(BaseModel):
    overall_assessment: str
    detected_patterns: list[str]
    possible_disorders: list[dict]  # {"name": str, "confidence": str, "indicators": list}
    recommendations: list[str]
    analysis_date: str

# ===============================
# AUTENTICACIÓN
# ===============================
async def get_current_user(authorization: str = Header(...)):
    try:
        token = authorization.split(" ")[1]
        # Decodificar token Base64 para obtener el email
        decoded_email = base64.b64decode(token).decode('utf-8')
        user = users_collection.find_one({"email": decoded_email})
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
        users_collection.insert_one({"email": user.email, "password": user.password, "admin": False})
        # Generar token enmascarado con Base64
        token = base64.b64encode(user.email.encode('utf-8')).decode('utf-8')
        return {"access_token": token, "admin": False} 
    
    db_user = users_collection.find_one({"email": user.email, "password": user.password})
    if not db_user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    # Generar token enmascarado con Base64
    token = base64.b64encode(user.email.encode('utf-8')).decode('utf-8')
    admin = db_user.get("admin", False)
    return {"access_token": token, "admin": admin}

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
# ELIMINAR CUENTA
# ===============================
@app.delete("/account")
async def delete_account(current_user=Depends(get_current_user)):
    """Eliminar la cuenta del usuario y todos sus datos asociados"""
    user_id = str(current_user["_id"])
    
    try:
        # Eliminar usuario de la colección users
        users_collection.delete_one({"_id": ObjectId(user_id)})
        
        # Eliminar todas las conversaciones del usuario
        conversations_collection.delete_many({"user_id": user_id})
        
        # Eliminar todos los mensajes del usuario
        messages_collection.delete_many({"user_id": user_id})
        
        # Eliminar todos los ratings del usuario
        ratings_collection.delete_many({"user_id": user_id})
        
        # Eliminar el perfil del usuario
        profiles_collection.delete_one({"user_id": user_id})
        
        # Eliminar las estadísticas del usuario
        stats_collection.delete_one({"user_id": user_id})
        
        return {"msg": "Cuenta eliminada correctamente"}
    except Exception as e:
        logger.error(f"Error al eliminar cuenta: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al eliminar la cuenta: {str(e)}")

# ===============================
# GESTIÓN DE TAGS/ETIQUETAS
# ===============================
@app.get("/tags")
async def get_user_tags(current_user=Depends(get_current_user)):
    """Obtener todas las etiquetas únicas del usuario"""
    user_id = str(current_user["_id"])
    convs = conversations_collection.find({"user_id": user_id})
    
    # Extraer todas las etiquetas únicas
    tags_dict = {}
    for conv in convs:
        for tag in conv.get("tags", []):
            tag_name = tag["name"]
            if tag_name not in tags_dict:
                tags_dict[tag_name] = tag.get("color", "#3b82f6")
    
    return [{"name": name, "color": color} for name, color in tags_dict.items()]

@app.get("/vault")
async def get_vault(current_user=Depends(get_current_user)):
    """Obtener todas las conversaciones agrupadas por etiquetas"""
    user_id = str(current_user["_id"])
    convs = list(conversations_collection.find({"user_id": user_id}).sort("created_at", -1))
    
    # Agrupar por etiquetas
    vault = {}
    sin_tags = []
    
    for conv in convs:
        tags = conv.get("tags", [])
        conv_data = {
            "conversation_id": str(conv["_id"]),
            "title": conv.get("title", "Nueva sesión"),
            "created_at": conv["created_at"].isoformat()
        }
        
        if not tags:
            sin_tags.append(conv_data)
        else:
            for tag in tags:
                tag_name = tag["name"]
                if tag_name not in vault:
                    vault[tag_name] = {"color": tag.get("color", "#3b82f6"), "conversations": []}
                vault[tag_name]["conversations"].append(conv_data)
    
    if sin_tags:
        vault["Sin etiqueta"] = {"color": "#9ca3af", "conversations": sin_tags}
    
    return vault

@app.post("/conversations/{conversation_id}/tags")
async def add_tag(conversation_id: str, tag_req: TagRequest, current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])
    conv = conversations_collection.find_one({"_id": ObjectId(conversation_id), "user_id": user_id})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    
    tag_obj = {"name": tag_req.tag, "color": tag_req.color}
    # Evitar duplicados
    if tag_obj not in conv.get("tags", []):
        conversations_collection.update_one(
            {"_id": ObjectId(conversation_id)},
            {"$push": {"tags": tag_obj}}
        )
    return {"msg": "Etiqueta agregada"}

@app.delete("/conversations/{conversation_id}/tags/{tag_name}")
async def remove_tag(conversation_id: str, tag_name: str, current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])
    conv = conversations_collection.find_one({"_id": ObjectId(conversation_id), "user_id": user_id})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    
    conversations_collection.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$pull": {"tags": {"name": tag_name}}}
    )
    return {"msg": "Etiqueta eliminada"}

# ===============================
# GESTIÓN DE CONVERSACIONES
# ===============================
@app.post("/conversations")
async def create_conv(current_user=Depends(get_current_user)):
    res = conversations_collection.insert_one({
        "user_id": str(current_user["_id"]),
        "title": "Nueva sesión",
        "created_at": datetime.now(),
        "tags": []
    })
    return {"conversation_id": str(res.inserted_id)}

@app.get("/conversations")
async def get_conversations(current_user=Depends(get_current_user)):
    convs = conversations_collection.find({"user_id": str(current_user["_id"])}).sort("created_at", -1)
    return [{"conversation_id": str(c["_id"]), "title": c.get("title", "Nueva sesión"), "tags": c.get("tags", [])} for c in convs]

@app.get("/conversations/all")
async def get_all_conversations(current_user=Depends(get_current_user)):
    # Solo admins pueden ver todas las conversaciones
    if not current_user.get("admin", False):
        raise HTTPException(status_code=403, detail="No tienes permisos para acceder a este recurso")
    convs = conversations_collection.find().sort("created_at", -1)
    return [{"conversation_id": str(c["_id"]), "title": c.get("title", "Nueva sesión"), "user_id": c.get("user_id"), "created_at": c.get("created_at"), "tags": c.get("tags", [])} for c in convs]

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
    # Admins pueden ver mensajes de cualquier conversación, usuarios solo sus propias
    if current_user.get("admin", False):
        msgs = messages_collection.find({
            "conversation_id": conversation_id
        }).sort("timestamp", 1)
    else:
        msgs = messages_collection.find({
            "conversation_id": conversation_id, 
            "user_id": str(current_user["_id"])
        }).sort("timestamp", 1)
    return [{"_id": str(m.get("_id")), "role": m.get("role"), "content": m.get("content"), "rating": m.get("rating", None), "timestamp": m.get("timestamp")} for m in msgs]

@app.post("/chat/stream")
async def chat_stream(request: MessageRequest, current_user=Depends(get_current_user)):
    # Guardamos el mensaje del usuario
    messages_collection.insert_one({
        "conversation_id": request.conversation_id,
        "user_id": str(current_user["_id"]),
        "role": "user",
        "content": request.message,
        "timestamp": datetime.now(),
        "rating": None
    })

    # Si es el primer mensaje, actualizamos el título de la conversación
    conv = conversations_collection.find_one({"_id": ObjectId(request.conversation_id)})
    if conv and conv.get("title") == "Nueva sesión":
        nuevo_titulo = request.message[:30] + "..." if len(request.message) > 30 else request.message
        conversations_collection.update_one(
            {"_id": ObjectId(request.conversation_id)},
            {"$set": {"title": nuevo_titulo}}
        )

    # Recuperamos los últimos 5 para excluir el actual (que acabo de guardar)
    historial_raw = list(messages_collection.find({
        "conversation_id": request.conversation_id,
        "user_id": str(current_user["_id"])
    }).sort("timestamp", -1).limit(5))
    
    # Excluir el último mensaje (el que acabo de guardar) del contexto histórico
    if historial_raw:
        historial_raw = historial_raw[1:]  # Saltamos el más reciente
    
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
            profile_context = f"Información del usuario:\n" + "\n".join(parts)

    # 1. Construir el prompt del sistema
    system_prompt = get_system_prompt(request.language)
    if profile_context:
        system_prompt += f"\n{profile_context}"

    # 2. Inicializar el array de mensajes estructurados
    mensajes_estructurados = [
        {"role": "system", "content": system_prompt}
    ]

    # 3. Añadir el historial (mapeando "bot" a "assistant" para Ollama)
    for msg in reversed(historial_raw):
        role_ollama = "assistant" if msg["role"] == "bot" else "user"
        mensajes_estructurados.append({
            "role": role_ollama,
            "content": msg["content"]
        })

    # 4. Añadir el mensaje actual del usuario
    mensajes_estructurados.append({
        "role": "user",
        "content": request.message
    })

    async def generator():
        accumulated = ""
        try:
            # Usar ollama.chat en lugar de generate para mantener el contexto de chat
            for chunk in ollama.chat(model=request.model, messages=mensajes_estructurados, stream=True):
                content = chunk['message']['content']
                accumulated += content
                try:
                    yield content
                except (BrokenPipeError, ConnectionResetError, RuntimeError) as e:
                    # El cliente cerró la conexión, salir sin error
                    logger.info(f"Cliente desconectado durante streaming: {type(e).__name__}")
                    break
        except GeneratorExit:
            # El cliente cerró la conexión, salir gracefully
            logger.info("GeneratorExit: cliente cerró la conexión")
            pass
        except (BrokenPipeError, ConnectionResetError, RuntimeError) as e:
            # Errores de socket cuando el cliente se desconecta
            logger.info(f"Error de socket durante generación: {type(e).__name__}")
            pass
        except Exception as e:
            logger.error(f"Error inesperado durante streaming: {str(e)}")
            # Si hay error, intentar actualizar si es posible
            if accumulated:
                try:
                    messages_collection.insert_one({
                        "conversation_id": request.conversation_id,
                        "user_id": str(current_user["_id"]),
                        "role": "bot",
                        "content": accumulated,
                        "timestamp": datetime.now(),
                        "rating": None
                    })
                except Exception as db_err:
                    logger.error(f"Error guardando mensaje en BD: {str(db_err)}")
            return
        
        # Guardamos la respuesta de la IA cuando termine normalmente
        if accumulated:
            try:
                messages_collection.insert_one({
                    "conversation_id": request.conversation_id,
                    "user_id": str(current_user["_id"]),
                    "role": "bot",
                    "content": accumulated,
                    "timestamp": datetime.now(),
                    "rating": None
                })
            except Exception as e:
                logger.error(f"Error guardando respuesta en BD: {str(e)}")

    return StreamingResponse(generator(), media_type="text/plain")

# ===============================
# RATING DE MENSAJES
# ===============================
class RatingUpdate(BaseModel):
    rating: str  # "liked", "disliked" o None

@app.post("/conversations/{conversation_id}/messages/{message_id}/rate")
async def rate_message(conversation_id: str, message_id: str, rating_update: RatingUpdate, current_user=Depends(get_current_user)):
    try:
        rating_value = rating_update.rating
        
        # Normalizar valores antiguos (up/down) a nuevos (liked/disliked)
        
        
        # Validar que el mensaje pertenece al usuario
        msg = messages_collection.find_one({
            "_id": ObjectId(message_id),
            "user_id": str(current_user["_id"]),
            "conversation_id": conversation_id
        })
        
        if not msg:
            raise HTTPException(status_code=404, detail="Mensaje no encontrado")
        
        # Solo se puede dar rating a mensajes del bot
        if msg.get("role") != "bot":
            raise HTTPException(status_code=400, detail="Solo se puede dar rating a respuestas del bot")
        
        # Toggle del rating: si ya tiene ese rating, lo elimina (None); si no, lo asigna
        new_rating = rating_value if msg.get("rating") != rating_value else None
        messages_collection.update_one(
            {"_id": ObjectId(message_id)},
            {"$set": {"rating": new_rating}}
        )
        
        return {"msg": "Rating guardado", "rating": new_rating}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error guardando rating: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al guardar el rating")

# ===============================
# ESTADÍSTICAS DEL USUARIO
# ===============================
@app.get("/stats")
async def get_user_stats(current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # Total de conversaciones
    total_conversations = conversations_collection.count_documents({"user_id": user_id})
    
    # Total de mensajes
    total_messages = messages_collection.count_documents({"user_id": user_id})
    
    # Total de mensajes del usuario vs del bot
    user_messages = messages_collection.count_documents({"user_id": user_id, "role": "user"})
    bot_messages = messages_collection.count_documents({"user_id": user_id, "role": "bot"})
    
    # CORRECCIÓN 1: Buscar los ratings en 'messages_collection' en lugar de 'ratings_collection'
    # CORRECCIÓN 2: Renombrar a 'liked_messages' y 'disliked_messages' para que encaje con Preact
    liked_messages = messages_collection.count_documents({"user_id": user_id, "rating": "up"})
    disliked_messages = messages_collection.count_documents({"user_id": user_id, "rating": "down"})
    
    # Calcular porcentaje de satisfacción
    total_ratings = liked_messages + disliked_messages
    satisfaction_rate = round((liked_messages / total_ratings * 100), 1) if total_ratings > 0 else 0
    
    return {
        "total_conversations": total_conversations,
        "total_messages": total_messages,
        "user_messages": user_messages,
        "bot_messages": bot_messages,
        "liked_messages": liked_messages,
        "disliked_messages": disliked_messages,
        "satisfaction_rate": satisfaction_rate
    }

@app.get("/conversations/{conversation_id}/stats")
async def get_conversation_stats(conversation_id: str, current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # Validar que pertenezca al usuario
    conv = conversations_collection.find_one({"_id": ObjectId(conversation_id), "user_id": user_id})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    
    # Mensaje más reciente
    last_message = messages_collection.find_one(
        {"conversation_id": conversation_id, "user_id": user_id},
        sort=[("timestamp", -1)]
    )
    
    # Duración de la conversación
    first_message = messages_collection.find_one(
        {"conversation_id": conversation_id, "user_id": user_id},
        sort=[("timestamp", 1)]
    )
    
    if first_message and last_message:
        duration = (last_message["timestamp"] - first_message["timestamp"]).total_seconds() / 60
    else:
        duration = 0
    
    # Total de mensajes
    total_msgs = messages_collection.count_documents({"conversation_id": conversation_id, "user_id": user_id})
    
    # Likes y dislikes en esta conversación
    liked_msgs = messages_collection.count_documents({"conversation_id": conversation_id, "user_id": user_id, "role": "bot", "rating": "liked"})
    disliked_msgs = messages_collection.count_documents({"conversation_id": conversation_id, "user_id": user_id, "role": "bot", "rating": "disliked"})
    
    # Satisfacción en esta conversación
    total_rated = liked_msgs + disliked_msgs
    satisfaction = round((liked_msgs / total_rated * 100), 1) if total_rated > 0 else 0
    
    return {
        "title": conv.get("title", "Nueva sesión"),
        "created_at": conv.get("created_at"),
        "total_messages": total_msgs,
        "duration_minutes": round(duration, 1),
        "last_message_at": last_message.get("timestamp") if last_message else None,
        "liked_messages": liked_msgs,
        "disliked_messages": disliked_msgs,
        "satisfaction_rate": satisfaction
    }

# ===============================
# ANÁLISIS DE TRASTORNOS CON IA
# ===============================
@app.post("/disorder-analysis")
async def analyze_disorders(request: DisorderAnalysisRequest, current_user=Depends(get_current_user)):
    """
    Analiza las conversaciones del usuario para detectar posibles trastornos
    usando el modelo Hermes.
    """
    user_id = str(current_user["_id"])
    
    try:
        # Obtener todos los mensajes del usuario
        all_messages = list(messages_collection.find({
            "user_id": user_id
        }).sort("timestamp", 1))
        
        if not all_messages:
            return {
                "overall_assessment": "Sin datos suficientes para análisis",
                "detected_patterns": [],
                "possible_disorders": [],
                "recommendations": ["Mantén conversaciones regulares con Hermes para un análisis más preciso"],
                "analysis_date": datetime.now().isoformat()
            }
        
        # Construir contexto con los mensajes del usuario
        user_messages = [msg["content"] for msg in all_messages if msg["role"] == "user"]
        conversation_context = "\n".join([f"Usuario: {msg}" for msg in user_messages[-50:]])  # Últimos 50 mensajes
        
        # Prompt especializado en análisis psicológico
        analysis_prompt = f"""Eres un asistente psicológico especializado en análisis de patrones de comportamiento y síntomas.
        
Analiza las siguientes expresiones del usuario y proporciona un análisis estructurado sobre posibles trastornos o condiciones mentales.

CONVERSACIONES DEL USUARIO:
{conversation_context}

Por favor, proporciona tu análisis en el siguiente formato JSON exactamente:
{{
    "overall_assessment": "Una evaluación general breve sobre el estado emocional del usuario",
    "detected_patterns": ["patrón 1", "patrón 2", ...],
    "possible_disorders": [
        {{
            "name": "nombre del trastorno (ej: Depresión, Ansiedad)",
            "confidence": "Alta/Media/Baja",
            "indicators": ["indicador 1", "indicador 2", ...]
        }},
        ...
    ],
    "recommendations": ["recomendación 1", "recomendación 2", ...]
}}

IMPORTANTE:
- Sé empático y profesional
- No hagas diagnósticos definitivos, solo sugerencias basadas en patrones
- Siempre recomienda buscar ayuda profesional si detectas riesgo grave
- Responde SOLO en JSON válido sin texto adicional
- Si no hay datos suficientes, deja los arrays vacíos"""

        # Llamar al LLM
        response = ollama.generate(
            model=request.model,
            prompt=analysis_prompt,
            stream=False
        )
        
        # Procesar la respuesta
        import json
        response_text = response.get("response", "").strip()
        
        # Intentar extraer JSON si está envuelto en markdown
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        analysis_data = json.loads(response_text)
        
        # Asegurar que tiene la estructura correcta
        return {
            "overall_assessment": analysis_data.get("overall_assessment", ""),
            "detected_patterns": analysis_data.get("detected_patterns", []),
            "possible_disorders": analysis_data.get("possible_disorders", []),
            "recommendations": analysis_data.get("recommendations", []),
            "analysis_date": datetime.now().isoformat()
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"Error al parsear JSON del análisis: {str(e)}")
        return {
            "overall_assessment": "Error al procesar el análisis. Por favor, intenta de nuevo.",
            "detected_patterns": [],
            "possible_disorders": [],
            "recommendations": [],
            "analysis_date": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error en análisis de trastornos: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error en análisis: {str(e)}")

@app.get("/admin/disorders-analysis")
async def analyze_all_disorders(current_user=Depends(get_current_user)):
    """
    Solo para admins: Analiza todos los usuarios y retorna análisis de trastornos con progreso.
    Usa procesamiento paralelo para acelerar el análisis.
    """
    # Verificar permisos de admin
    if not current_user.get("admin", False):
        raise HTTPException(status_code=403, detail="No tienes permisos para acceder a este recurso")
    
    try:
        import json
        from concurrent.futures import ThreadPoolExecutor, as_completed, TimeoutError
        
        logger.info("🔍 Iniciando análisis de trastornos para todos los usuarios")
        
        # Obtener todos los usuarios
        all_users = list(users_collection.find({}))
        logger.info(f"📊 Total de usuarios encontrados: {len(all_users)}")
        
        all_analysis = []
        
        def analyze_user(user):
            """Función para analizar un único usuario"""
            try:
                user_id = str(user["_id"])
                user_email = user.get("email", "desconocido")
                logger.info(f"👤 Analizando usuario: {user_email}")
                
                # Obtener mensajes del usuario
                user_messages = list(messages_collection.find({
                    "user_id": user_id
                }).sort("timestamp", 1))
                
                logger.info(f"   → {user_email} tiene {len(user_messages)} mensajes totales")
                
                if not user_messages:
                    logger.info(f"   ⏭️  {user_email} sin mensajes, saltando...")
                    return None  # Saltar usuarios sin mensajes
                
                # Construir contexto
                user_msgs = [msg["content"] for msg in user_messages if msg["role"] == "user"]
                if not user_msgs:
                    logger.info(f"   ⏭️  {user_email} sin mensajes de usuario, saltando...")
                    return None
                
                logger.info(f"   📝 Preparando contexto con {len(user_msgs[-20:])} últimos mensajes")
                conversation_context = "\n".join([f"Usuario: {msg}" for msg in user_msgs[-20:]])
                
                # Prompt para análisis
                analysis_prompt = f"""Eres un asistente psicológico especializado en análisis de patrones de comportamiento y síntomas.
        
Analiza las siguientes expresiones del usuario y proporciona un análisis estructurado sobre posibles trastornos o condiciones mentales.

CONVERSACIONES DEL USUARIO:
{conversation_context}

Por favor, proporciona tu análisis en el siguiente formato JSON exactamente:
{{
    "overall_assessment": "Una evaluación general breve sobre el estado emocional del usuario",
    "detected_patterns": ["patrón 1", "patrón 2", ...],
    "possible_disorders": [
        {{
            "name": "nombre del trastorno (ej: Depresión, Ansiedad)",
            "confidence": "Alta/Media/Baja",
            "indicators": ["indicador 1", "indicador 2", ...]
        }},
        ...
    ],
    "recommendations": ["recomendación 1", "recomendación 2", ...]
}}

IMPORTANTE:
- Sé empático y profesional
- No hagas diagnósticos definitivos, solo sugerencias basadas en patrones
- Responde SOLO en JSON válido sin texto adicional
- Si no hay datos suficientes, deja los arrays vacíos"""
                
                logger.info(f"   🤖 Llamando a Hermes para {user_email}...")
                response = ollama.generate(
                    model="hermes",
                    prompt=analysis_prompt,
                    stream=False
                )
                
                logger.info(f"   ✅ Respuesta recibida de {user_email}")
                response_text = response.get("response", "").strip()
                
                # Extraer JSON
                if "```json" in response_text:
                    response_text = response_text.split("```json")[1].split("```")[0].strip()
                elif "```" in response_text:
                    response_text = response_text.split("```")[1].split("```")[0].strip()
                
                analysis_data = json.loads(response_text)
                logger.info(f"   📋 Análisis completado para {user_email}")
                
                return {
                    "user_id": user_id,
                    "user_email": user_email,
                    "overall_assessment": analysis_data.get("overall_assessment", ""),
                    "detected_patterns": analysis_data.get("detected_patterns", []),
                    "possible_disorders": analysis_data.get("possible_disorders", []),
                    "recommendations": analysis_data.get("recommendations", []),
                    "analysis_date": datetime.now().isoformat(),
                    "total_messages": len(user_msgs)
                }
                
            except json.JSONDecodeError as e:
                logger.error(f"   ❌ Error JSON para {user.get('email', 'desconocido')}: {str(e)}")
                return None
            except Exception as e:
                logger.error(f"   ❌ Error analizando usuario {user.get('email', 'desconocido')}: {str(e)}")
                return None
        
        # Procesamiento paralelo: máx 3 análisis simultáneos para no saturar
        logger.info("⚙️  Iniciando procesamiento paralelo (max 3 workers)...")
        
        all_analysis = []
        with ThreadPoolExecutor(max_workers=3, thread_name_prefix="analysis_") as executor:
            futures = {executor.submit(analyze_user, user): user for user in all_users}
            completed = 0
            
            for future in as_completed(futures, timeout=300):  # 5 minutos timeout
                try:
                    result = future.result(timeout=60)  # 1 minuto timeout por usuario
                    if result:
                        all_analysis.append(result)
                    completed += 1
                    logger.info(f"📈 Progreso: {completed}/{len(all_users)} usuarios analizados")
                except Exception as e:
                    logger.error(f"❌ Error en worker: {str(e)}")
                    completed += 1
        
        logger.info(f"✅ Análisis completado. Total: {len(all_analysis)} usuarios analizados")
        return {
            "total_users_analyzed": len(all_analysis),
            "analysis": all_analysis
        }
        
    except Exception as e:
        logger.error(f"❌ Error general en análisis de todos los trastornos: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error en análisis: {str(e)}")