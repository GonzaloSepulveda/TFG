#!/usr/bin/env python3
"""
Script para generar y guardar la clave de encriptación en el archivo .env
Ejecutar una sola vez: python setup_encryption.py
"""

import os
import sys

# Permitir ejecutar desde cualquier directorio
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from cryptography.fernet import Fernet

def setup_encryption():
    env_file = ".env"
    
    # Verificar si .env ya existe y tiene ENCRYPTION_KEY
    if os.path.exists(env_file):
        with open(env_file, "r") as f:
            content = f.read()
            if "ENCRYPTION_KEY" in content:
                print("⚠️  ENCRYPTION_KEY ya existe en .env")
                print("Generando nueva clave de todas formas...")
    
    # Generar nueva clave
    key = Fernet.generate_key().decode()
    
    # Leer archivo .env si existe
    if os.path.exists(env_file):
        with open(env_file, "r") as f:
            lines = f.readlines()
        
        # Actualizar o agregar ENCRYPTION_KEY
        found = False
        for i, line in enumerate(lines):
            if line.startswith("ENCRYPTION_KEY="):
                lines[i] = f"ENCRYPTION_KEY={key}\n"
                found = True
                break
        
        if not found:
            lines.append(f"\n# ===============================\n")
            lines.append(f"# ENCRIPTACIÓN Y SEGURIDAD\n")
            lines.append(f"# ===============================\n")
            lines.append(f"ENCRYPTION_KEY={key}\n")
        
        with open(env_file, "w") as f:
            f.writelines(lines)
    else:
        # Crear nuevo archivo .env
        with open(env_file, "w") as f:
            f.write(f"# ===============================\n")
            f.write(f"# ENCRIPTACIÓN Y SEGURIDAD\n")
            f.write(f"# ===============================\n")
            f.write(f"ENCRYPTION_KEY={key}\n")
    
    print(f"✅ Clave de encriptación generada y guardada en {env_file}")
    print(f"\n🔐 Clave: {key}")
    print(f"\n⚠️  IMPORTANTE: ")
    print(f"   1. Guarda esta clave en un lugar seguro (es necesaria para recuperar datos encriptados)")
    print(f"   2. No compartas este archivo .env en tu repositorio (agrega .env a .gitignore)")
    print(f"   3. Todos los servidores necesitan la MISMA clave para desencriptar datos")
    
    return key

if __name__ == "__main__":
    setup_encryption()
