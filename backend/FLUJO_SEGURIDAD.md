# 🔐 Flujo de Seguridad Visual

## 1️⃣ REGISTRO DE USUARIO

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Preact/TSX)                        │
│  Usuario: email@example.com                                     │
│  Password: miContraseña123                                      │
│                                                                 │
│  onClick → POST /auth                                           │
│         {email, password, isRegister: true}                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI)                             │
│                                                                 │
│  1. Encriptar email:                                            │
│     encrypt_email("email@example.com")                          │
│     → "gAAAAABm8J8X9V4K..."                                    │
│                                                                 │
│  2. Hashear password:                                           │
│     hash_password("miContraseña123")                            │
│     → "$2b$12$XMJkVn..."                                        │
│                                                                 │
│  3. Guardar en BD:                                              │
│     {                                                           │
│       email: "gAAAAABm8J8X9V4K...",  ← Encriptado             │
│       password: "$2b$12$XMJkVn...",   ← Hasheado              │
│       admin: false                                              │
│     }                                                           │
│                                                                 │
│  4. Generar token:                                              │
│     email_encriptado_en_base64                                  │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼ Devuelve token
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Preact/TSX)                        │
│                                                                 │
│  localStorage.setItem("token", token)                           │
│  Redirige a /dashboard                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2️⃣ LOGIN DE USUARIO

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Preact/TSX)                        │
│  Usuario: email@example.com                                     │
│  Password: miContraseña123                                      │
│                                                                 │
│  onClick → POST /auth                                           │
│         {email, password, isRegister: false}                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI)                             │
│                                                                 │
│  1. Encriptar email:                                            │
│     encrypted_email = encrypt_email("email@example.com")        │
│     → "gAAAAABm8J8X9V4K..."                                    │
│                                                                 │
│  2. Buscar en BD por email encriptado:                          │
│     db.users.find_one({email: "gAAAAABm8J8X9V4K..."})         │
│     ✓ Encontrado                                                │
│                                                                 │
│  3. Verificar password:                                         │
│     verify_password("miContraseña123",                          │
│                     "$2b$12$XMJkVn...")                         │
│     ✓ Correcto!                                                 │
│                                                                 │
│  4. Generar token y devolver                                    │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼ Token válido
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Preact/TSX)                        │
│                                                                 │
│  localStorage.setItem("token", token)                           │
│  Redirige a /dashboard                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3️⃣ OBTENER DATOS DEL USUARIO

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Preact/TSX)                        │
│                                                                 │
│  useEffect(() => {                                              │
│    fetch("/me", {                                               │
│      headers: {                                                  │
│        Authorization: `Bearer ${token}`                          │
│      }                                                           │
│    })                                                            │
│  })                                                              │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼ GET /me
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI)                             │
│                                                                 │
│  1. Recibir token:                                              │
│     "Authorization: Bearer base64(email_encriptado)"            │
│                                                                 │
│  2. Decodificar token:                                          │
│     token → email_encriptado                                    │
│                                                                 │
│  3. Desencriptar email:                                         │
│     decrypt_email(email_encriptado)                             │
│     → "email@example.com" ✓ DESENCRIPTADO                       │
│                                                                 │
│  4. Buscar usuario:                                             │
│     db.users.find_one({email: email_encriptado})                │
│                                                                 │
│  5. Responder al frontend:                                      │
│     {                                                           │
│       user_id: "507f...",                                       │
│       email: "email@example.com",  ← DESENCRIPTADO ✅          │
│       admin: false                                              │
│     }                                                           │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼ Datos desencriptados
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Preact/TSX)                        │
│                                                                 │
│  <div>Bienvenido, email@example.com</div>  ← Se ve normal ✅   │
│  <button>Chat</button>                                          │
│  <button>Perfil</button>                                        │
│                                                                 │
│  El usuario NO ve ninguna diferencia                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4️⃣ BASE DE DATOS

```
┌──────────────────────────────────────────────────────────────────┐
│                    MONGO DB - Users                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  _id: ObjectId("507f1f77bcf86cd799439011")                       │
│  email: "gAAAAABm8J8X9V4Ky5p9..."        ← Encriptado          │
│  password: "$2b$12$XMJkVnV4K9Ky5p9X..."  ← Hasheado            │
│  admin: false                                                    │
│                                                                  │
│  _id: ObjectId("507f1f77bcf86cd799439012")                       │
│  email: "gAAAAACn9K9X0V5Lz6q0..."        ← Encriptado          │
│  password: "$2b$12$YNKlWoW5L0Lz6q0Y..."  ← Hasheado            │
│  admin: true                                                     │
│                                                                  │
│  ✅ Nadie que vea la BD sin ENCRYPTION_KEY puede                 │
│     saber los emails o passwords                                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5️⃣ MATRIZ DE SEGURIDAD

```
┌─────────────────────┬──────────────┬────────────────┐
│ Componente          │ Antes        │ Después        │
├─────────────────────┼──────────────┼────────────────┤
│ Email en BD         │ Visible ❌   │ Encriptado ✅  │
│ Password en BD      │ Visible ❌   │ Hash ✅        │
│ Email en Token      │ Base64 ❌    │ Base64 Enc ✅  │
│ Frontend ve email   │ Normal ✅    │ Normal ✅      │
│ Frontend ve pwd     │ N/A          │ N/A ✅         │
│ Si roban la BD      │ Datos ❌     │ Inútil ✅      │
│ Si roban el token   │ Email ❌     │ Sin clave ✅   │
└─────────────────────┴──────────────┴────────────────┘
```

---

## 6️⃣ FLUJO DE TOKENS

```
ANTES (Inseguro):
━━━━━━━━━━━━━━━━
  Email: "email@example.com"
    ↓ (base64)
  Token: "ZW1haWxAZXhhbXBsZS5jb20="
  
  ⚠️  Si alguien ve el token → conoce el email


DESPUÉS (Seguro):
━━━━━━━━━━━━━━━━
  Email: "email@example.com"
    ↓ (encrypt)
  Email Enc: "gAAAAABm8J8X9V4K..."
    ↓ (base64)
  Token: "Z0FBQUFBQm04SjhYOVY0Sy4uLg=="
  
  ✅ Si alguien ve el token → no puede saber el email
     (sin ENCRYPTION_KEY)
```

---

## 🔐 Seguridad de Claves

```
┌──────────────────────────────────────────────────────────┐
│           DONDE GUARDAR ENCRYPTION_KEY                   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ✅ BIEN:                                                │
│  ├─ Archivo .env (gitignored)                            │
│  ├─ Variables de entorno del servidor                    │
│  ├─ Gestor de secretos (AWS Secrets, HashiCorp, etc)     │
│  └─ Bóveda segura (1Password, Bitwarden, etc)            │
│                                                          │
│  ❌ MAL:                                                 │
│  ├─ Hardcodeada en el código                             │
│  ├─ En un archivo público                                │
│  ├─ En el repositorio de Git                             │
│  └─ En un comentario del código                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🚀 Resumen

| Acción | Antes | Después |
|--------|-------|---------|
| **Registro** | email/pwd visible | email/pwd protegidos |
| **Login** | búsqueda en texto plano | búsqueda encriptada |
| **BD robo** | datos accesibles | datos inútiles sin clave |
| **Token robo** | expone email | inútil sin clave |
| **Frontend** | igual | igual ✨ |

---

**Resultado Final:** 🎯
- ✅ Máxima seguridad
- ✅ Experiencia de usuario idéntica
- ✅ Compatible con base de datos existente
- ✅ Escalable y mantenible
