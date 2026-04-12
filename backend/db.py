from pymongo import MongoClient

# Configuración de MongoDB Atlas
MONGO_URI = "localhost:27017"

client = MongoClient(MONGO_URI)
db = client["Prometeo"]

# Exportamos las colecciones
users_collection = db["Users"]
conversations_collection = db["Conversations"]
messages_collection = db["Messages"]
profiles_collection = db["Profiles"]

def check_db():
    try:
        client.admin.command('ping')
        print("✅ MongoDB conectado correctamente")
        return True
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False