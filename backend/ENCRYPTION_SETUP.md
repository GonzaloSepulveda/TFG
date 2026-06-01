# 🔐 Guía de Encriptación - Hermes Backend

## Descripción

Este proyecto implementa encriptación segura para:
- ✅ **Contraseñas**: Hasheadas con bcrypt (nunca en texto plano)
- ✅ **Emails**: Encriptados reversibles con Fernet

El frontend **NO ve ninguna diferencia** - los datos se desencriptan automáticamente en el backend.

---

## 🚀 Configuración Inicial

### 1. Instalar dependencias

```bash
pip install -r requirements.txt
```

Verifica que tengas:
- `bcrypt==5.0.0`
- `cryptography==43.0.0`

### 2. Generar clave de encriptación

Ejecuta el script de setup:

```bash
python backend/setup_encryption.py
```

Esto:
- ✅ Genera una nueva clave Fernet
- ✅ La guarda en `.env`
- ✅ Te muestra la clave para que la guardes en un lugar seguro

### 3. Verificar archivo .env

Tu archivo `.env` debe tener:

```env
ENCRYPTION_KEY=tu_clave_generada_aqui
```

⚠️ **IMPORTANTE**: Agrega `.env` a `.gitignore` para que no se suba al repositorio

```bash
# En la raíz del proyecto
echo ".env" >> .gitignore
```

---

## 📊 Migración de Usuarios Existentes

Si ya tienes usuarios con contraseñas y emails en texto plano:

```bash
python backend/migrate.py
```

Esto:
- ✅ Hashea todas las contraseñas con bcrypt
- ✅ Encripta todos los emails
- ✅ Muestra el progreso de cada usuario

**Ejecuta esto UNA SOLA VEZ**

---

## 🔄 Flujo de Seguridad

### Registro (POST /auth)

```
Usuario envía: email + password (en texto plano)
        ↓
Backend encripta email → email_encriptado
Backend hashea password → password_hash
        ↓
Se guardan en BD:
  - email: email_encriptado
  - password: password_hash
        ↓
Backend devuelve: token (email_encriptado en base64)
```

### Login (POST /auth)

```
Usuario envía: email + password
        ↓
Backend encripta email → email_encriptado
Backend busca en BD por email_encriptado
        ↓
Si encontrado:
  Backend verifica password con bcrypt
  Si correcto → genera token
```

### Obtener datos del usuario (GET /profile, etc.)

```
Frontend envía: Authorization: Bearer token
        ↓
Backend decodifica token
Backend desencripta email
Backend busca usuario por email_encriptado
        ↓
Backend devuelve datos:
  - Email DESENCRIPTADO (el usuario lo ve normal)
  - Perfil sin cambios
```

---

## 🛠️ API de Seguridad

En `backend/security.py` tienes:

```python
# Hashear password
password_hash = hash_password("mi_contraseña")

# Verificar password
is_correct = verify_password("mi_contraseña", password_hash)

# Encriptar email
encrypted = encrypt_email("user@example.com")

# Desencriptar email
decrypted = decrypt_email(encrypted)

# Migrar usuarios existentes
count = migrate_existing_users(users_collection)
```

---

## 🚨 Consideraciones Importantes

### Pérdida de la clave
- ❌ Si pierdes la `ENCRYPTION_KEY`, **NO podrás recuperar los emails encriptados**
- ✅ Las contraseñas hasheadas pueden regenerarse (bcrypt no es reversible, es por diseño)
- 💾 **Guarda la clave en un lugar seguro** (gestor de contraseñas, bóveda, etc.)

### Múltiples servidores
- Todos los servidores deben tener la **MISMA** `ENCRYPTION_KEY`
- Sin ella, no podrán desencriptar los datos

### Base de datos
- Los emails en la BD ven así: `gAAAAABm...` (encriptado)
- Las passwords ven así: `$2b$12$...` (hash bcrypt)
- El frontend sigue viendo emails normales ✅

---

## ✅ Checklist de Verificación

- [ ] Instalaste dependencias (`pip install -r requirements.txt`)
- [ ] Ejecutaste `python backend/setup_encryption.py`
- [ ] Tienes `.env` con `ENCRYPTION_KEY`
- [ ] Agregaste `.env` a `.gitignore`
- [ ] Si tienes usuarios existentes, ejecutaste `python backend/migrate.py`
- [ ] Probaste login/registro con nuevas credenciales
- [ ] Verificas que el dashboard muestra emails correctamente

---

## 📝 Notas Técnicas

- **bcrypt rounds**: Configurado en 12 (security.py line 30)
- **Fernet**: Usa cifrado AES-128 en modo CBC
- **Token**: Email encriptado en base64 (no es un JWT, es más simple y seguro para este caso)

---

¿Preguntas? Revisa `backend/security.py` para ver la implementación completa.
