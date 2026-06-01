import os
import bcrypt
import hashlib
from cryptography.fernet import Fernet

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("⚠️  python-dotenv no instalado. Usando solo variables de entorno del sistema.")

# ===============================
# CONFIGURACIÓN DE CLAVES DE ENCRIPTACIÓN
# ===============================

ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")

if not ENCRYPTION_KEY:
    try:
        with open(".env", "r") as f:
            for line in f:
                if line.startswith("ENCRYPTION_KEY="):
                    ENCRYPTION_KEY = line.split("=", 1)[1].strip()
                    break
    except FileNotFoundError:
        pass

if not ENCRYPTION_KEY:
    raise ValueError(
        "❌ ENCRYPTION_KEY no está configurada.\n\n"
        "Ejecuta: python backend/setup_encryption.py"
    )

try:
    cipher = Fernet(ENCRYPTION_KEY.encode())
except Exception as e:
    raise ValueError(f"❌ ENCRYPTION_KEY inválida: {str(e)}")

# ===============================
# FUNCIONES DE HASHING DE CONTRASEÑAS
# ===============================

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

# ===============================
# FUNCIONES DE ENCRIPTACIÓN DE EMAILS
# ===============================

def encrypt_email(email: str) -> str:
    return cipher.encrypt(email.encode('utf-8')).decode('utf-8')

def decrypt_email(encrypted_email: str) -> str:
    return cipher.decrypt(encrypted_email.encode('utf-8')).decode('utf-8')

def get_email_hash(email: str) -> str:
    """Genera un hash determinista del email para búsquedas exactas."""
    return hashlib.sha256(email.encode('utf-8')).hexdigest()

# ===============================
# FUNCIÓN AUXILIAR PARA BÚSQUEDAS
# ===============================

def find_user_by_email(email: str, users_collection):
    email_hash = get_email_hash(email)
    return users_collection.find_one({"email_hash": email_hash})

# ===============================
# FUNCIÓN DE MIGRACIÓN Y REPARACIÓN
# ===============================

def migrate_existing_users(users_collection):
    users = users_collection.find({})
    count = 0
    
    for user in users:
        needs_update = False
        password = user.get("password", "")
        email = user.get("email", "")
        
        # 1. Hashear contraseña si está en texto plano
        if not password.startswith("$2b$"):
            hashed_pwd = hash_password(password)
            needs_update = True
        else:
            hashed_pwd = password
            
        # 2. Arreglar el email y añadir el hash
        if "email_hash" not in user:
            needs_update = True
            if email.startswith("gAAAA"): # Ya estaba encriptado
                try:
                    actual_email = decrypt_email(email)
                    email_hash = get_email_hash(actual_email)
                    encrypted_email = email
                except:
                    continue # Error al desencriptar, saltar
            else: # Estaba en texto plano
                encrypted_email = encrypt_email(email)
                email_hash = get_email_hash(email)
        else:
            encrypted_email = email
            email_hash = user.get("email_hash")
            
        # 3. Guardar cambios en BD
        if needs_update:
            try:
                users_collection.update_one(
                    {"_id": user["_id"]},
                    {"$set": {
                        "password": hashed_pwd,
                        "email": encrypted_email,
                        "email_hash": email_hash
                    }}
                )
                count += 1
                print(f"✅ Usuario reparado/migrado con éxito.")
            except Exception as e:
                print(f"❌ Error migrando usuario {user.get('_id')}: {str(e)}")
                
    return count