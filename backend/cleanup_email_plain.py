"""
Script para limpiar el campo email_plain de la BD (en caso de que ya fue migrado).
Ejecutar: python cleanup_email_plain.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from db import users_collection
except ImportError:
    from backend.db import users_collection

if __name__ == "__main__":
    print("🧹 Limpiando campo email_plain de usuarios migrantes...\n")
    
    try:
        # Encontrar todos los usuarios que tienen el campo email_plain
        users_with_plain = users_collection.find({"email_plain": {"$exists": True}})
        count = 0
        
        for user in users_with_plain:
            users_collection.update_one(
                {"_id": user["_id"]},
                {"$unset": {"email_plain": ""}}  # Eliminar el campo
            )
            count += 1
            print(f"✅ Eliminado email_plain de usuario {user['_id']}")
        
        print(f"\n✅ Limpieza completada: {count} usuario(s) actualizado(s)")
        
        if count == 0:
            print("ℹ️  No hay usuarios con email_plain en la BD")
        
    except Exception as e:
        print(f"❌ Error durante la limpieza: {str(e)}")
        sys.exit(1)
