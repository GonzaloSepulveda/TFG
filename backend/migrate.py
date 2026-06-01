"""
Script para migrar usuarios existentes a encriptación segura.
Ejecutar una sola vez: python migrate.py
"""

import sys
import os

# Permitir importar desde el directorio actual o desde backend/
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from db import users_collection
    from security import migrate_existing_users
except ImportError:
    from backend.db import users_collection
    from backend.security import migrate_existing_users

if __name__ == "__main__":
    print("🔄 Iniciando migración de usuarios...")
    count = migrate_existing_users(users_collection)
    print(f"\n✅ Migración completada: {count} usuario(s) actualizado(s)")
