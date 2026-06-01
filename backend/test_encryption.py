"""
Script de prueba para verificar que la encriptación funciona correctamente.
Ejecutar: python test_encryption.py
"""

import sys
import os

# Permitir importar desde el directorio actual
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_encryption_system():
    print("🧪 Iniciando pruebas de encriptación...\n")
    
    try:
        try:
            from security import (
                hash_password, verify_password,
                encrypt_email, decrypt_email,
                ENCRYPTION_KEY
            )
        except ImportError:
            from backend.security import (
                hash_password, verify_password,
                encrypt_email, decrypt_email,
                ENCRYPTION_KEY
            )
        print("✅ Módulo security.py importado correctamente")
        print(f"✅ ENCRYPTION_KEY cargada (primeros 20 chars): {ENCRYPTION_KEY[:20]}...\n")
    except ValueError as e:
        print(f"❌ Error de configuración: {e}")
        return False
    except Exception as e:
        print(f"❌ Error importando security.py: {e}")
        return False
    
    # Test 1: Hashing de contraseñas
    print("📝 Test 1: Hash de contraseñas (bcrypt)")
    try:
        password = "MiContraseñaSegura123!"
        hashed = hash_password(password)
        print(f"   Password: {password}")
        print(f"   Hash: {hashed[:50]}...")
        
        # Verificar
        if verify_password(password, hashed):
            print("   ✅ Verificación correcta")
        else:
            print("   ❌ Verificación falló")
            return False
        
        # Intentar con contraseña incorrecta
        if not verify_password("ContraseñaIncorrecta", hashed):
            print("   ✅ Rechazó contraseña incorrecta")
        else:
            print("   ❌ Aceptó contraseña incorrecta (error grave)")
            return False
    except Exception as e:
        print(f"   ❌ Error en test de passwords: {e}")
        return False
    
    print()
    
    # Test 2: Encriptación de emails
    print("📧 Test 2: Encriptación de emails (Fernet)")
    try:
        email = "usuario@example.com"
        encrypted = encrypt_email(email)
        print(f"   Email: {email}")
        print(f"   Encriptado: {encrypted[:50]}...")
        
        # Desencriptar
        decrypted = decrypt_email(encrypted)
        if decrypted == email:
            print(f"   Desencriptado: {decrypted}")
            print("   ✅ Encriptación/Desencriptación correcta")
        else:
            print(f"   ❌ Email no coincide: {decrypted}")
            return False
    except Exception as e:
        print(f"   ❌ Error en test de emails: {e}")
        return False
    
    print()
    
    # Test 3: Múltiples emails generan encriptaciones diferentes
    print("🔐 Test 3: Seguridad - Múltiples encriptaciones")
    try:
        email1 = "user1@example.com"
        enc1a = encrypt_email(email1)
        enc1b = encrypt_email(email1)
        
        if enc1a != enc1b:
            print(f"   ✅ Mismo email genera diferentes encriptaciones (bueno)")
            print(f"      Esto es por seguridad (IV diferente cada vez)")
        else:
            print(f"   ⚠️  Mismo email genera misma encriptación")
        
        # Pero ambas se desencriptan al mismo valor
        if decrypt_email(enc1a) == decrypt_email(enc1b) == email1:
            print(f"   ✅ Ambas se desencriptan al email original")
    except Exception as e:
        print(f"   ❌ Error en test de seguridad: {e}")
        return False
    
    print()
    
    # Test 4: Verificación de bcrypt round
    print("⚙️  Test 4: Configuración de bcrypt")
    try:
        password = "test"
        hashed = hash_password(password)
        # bcrypt con rounds=12 genera hash que comienza con $2b$12$
        if "$2b$12$" in hashed:
            print(f"   ✅ Bcrypt rounds=12 configurado correctamente")
            print(f"      Hash: {hashed[:30]}...")
        else:
            print(f"   ⚠️  Rounds diferente: {hashed[:30]}")
    except Exception as e:
        print(f"   ❌ Error en test de bcrypt: {e}")
        return False
    
    print()
    print("=" * 60)
    print("✅ TODOS LOS TESTS PASARON")
    print("=" * 60)
    print("\n🎉 Tu sistema de encriptación está funcionando correctamente!")
    return True


if __name__ == "__main__":
    import sys
    success = test_encryption_system()
    sys.exit(0 if success else 1)
