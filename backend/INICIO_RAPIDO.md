# ⚡ Inicio Rápido - Encriptación

## 🎯 3 pasos para activar encriptación de seguridad

### 1. Generar clave de encriptación

```bash
cd backend
python setup_encryption.py
```

✅ Crea archivo `.env` con `ENCRYPTION_KEY`

### 2. Instalar dependencia nueva

```bash
pip install cryptography==43.0.0
```

(bcrypt ya estaba en requirements.txt)

### 3. Migrar usuarios existentes (si los hay)

```bash
cd backend
python migrate.py
```

⚠️ Ejecutar solo UNA VEZ

---

## ✅ Listo

- ✅ Contraseñas hasheadas con bcrypt
- ✅ Emails encriptados con Fernet
- ✅ Frontend sin cambios
- ✅ Base de datos protegida

---

## 📚 Documentación

- [ENCRYPTION_SETUP.md](./ENCRYPTION_SETUP.md) - Guía completa
- [CAMBIOS_SEGURIDAD.md](./CAMBIOS_SEGURIDAD.md) - Qué se cambió
- [FLUJO_SEGURIDAD.md](./FLUJO_SEGURIDAD.md) - Diagramas visuales

---

## 🆘 Problemas comunes

| Error | Solución |
|-------|----------|
| `ENCRYPTION_KEY no está configurada` | Ejecuta `python setup_encryption.py` |
| `No module named cryptography` | Ejecuta `pip install cryptography==43.0.0` |
| Usuarios antiguos sin encriptar | Ejecuta `python migrate.py` |
| Emails no se desencriptan | Verifica que `.env` tenga la misma clave |

---

¡Listo! Tu aplicación ahora tiene encriptación de grado producción.
