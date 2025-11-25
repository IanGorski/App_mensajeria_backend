### Problemas que encontré (y cómo los resolví)

En este proyecto me topé con varios problemas mientras lo desarrollaba. Acá te dejo una lista de los más importantes y cómo los solucioné, por si te pasa algo parecido.

---

#### 1. **MongoDB no conectaba**
Cuando levantaba el servidor, me daba error de conexión con MongoDB. Después de revisar todo, me di cuenta de que:
- La URI en el `.env` estaba mal (la contraseña no era correcta).
- En MongoDB Atlas no había agregado mi IP a la whitelist.
- En local, el servicio de MongoDB estaba trabado y tuve que reiniciarlo.

**Solución:** Revisé la URI, agregué mi IP en Atlas y verifiqué que el servicio estuviera corriendo con `mongod --version`.

---

#### 2. **Los tokens JWT expiraban muy rápido**
Los tokens duraban solo una hora porque configuré mal el `JWT_EXPIRE` en el `.env`. Era muy molesto tener que loguearme cada vez que volvía a la app.

**Solución:** Cambié `JWT_EXPIRE=1h` por `JWT_EXPIRE=7d` para que duren una semana.

---

#### 3. **El logger no funcionaba**
Estaba importando el logger así: `import { logger } from '../config/logger.js'`, pero me daba error porque no era un named export.

**Solución:** Cambié el import a `import logger from '../config/logger.js'` (sin las llaves).

---

#### 4. **CORS bloqueaba las peticiones del frontend**
Cuando conecté el frontend con el backend, todas las peticiones daban error de CORS. En desarrollo funcionaba, pero en producción no.

**Solución:** Configuré bien el `URL_FRONTEND` en el `.env` con la URL de Vercel y agregué `credentials: true` en la configuración de CORS.

---

#### 5. **Los emails de verificación no llegaban**
Nodemailer estaba configurado, pero los emails no llegaban. Probé con mi Gmail personal y tampoco funcionaba.

**Solución:** Habilité la verificación en dos pasos en Gmail, generé una contraseña de aplicación y la usé en `EMAIL_PASSWORD` del `.env`.

---

#### 6. **Socket.IO no enviaba mensajes en tiempo real**
Los mensajes se enviaban, pero no llegaban al otro usuario en tiempo real. El WebSocket se conectaba, pero no transmitía los eventos.

**Solución:** Configuré el CORS en Socket.IO así:
```javascript
const io = new Server(server, {
  cors: {
    origin: process.env.URL_FRONTEND,
    credentials: true
  }
});
```

---

#### 7. **Los archivos subidos se perdían al hacer redeploy en Render**
Subía imágenes y todo funcionaba bien, pero cuando Render hacía un nuevo deploy, los archivos desaparecían.

**Por qué pasa:** Render usa un sistema de archivos efímero, así que todo se borra con cada deploy.

**Solución:** Todavía no lo implementé, pero debería usar un servicio externo como Cloudinary o AWS S3 para guardar los archivos.

---

#### 8. **Render no aparecía en los checks de GitHub**
Configuré el webhook de Render para que se desplegara automáticamente con cada push, pero no aparecía como "check" en GitHub.

**Por qué pasa:** Render no soporta la API de GitHub Checks. Es una limitación de Render, no algo que pueda arreglar.

---

#### 9. **Las variables de entorno no se cargaban en producción**
Subí el código a Render y me daba errores porque las variables de entorno estaban undefined.

**Solución:** Configuré las variables manualmente en el dashboard de Render (Settings > Environment).

---

#### 10. **Los logs llenaban la consola**
Tenía demasiados `console.log` y `console.error` en el código, lo que hacía imposible debuggear.

**Solución:** Reemplacé todos los `console.log` por `logger.info()` y los `console.error` por `logger.error()`. Ahora los logs se guardan en archivos y puedo filtrarlos por nivel.

---

#### 11. **El servidor se trababa al recibir muchos mensajes**
En las pruebas, cuando mandaba mensajes muy rápido, el servidor se colgaba.

**Por qué pasa:** No tenía un límite de rate, así que cualquiera podía hacer spam de requests.

**Solución pendiente:** Implementar rate limiting con `express-rate-limit`.

---

#### 12. **Los mensajes no se marcaban como leídos**
Cuando un usuario leía los mensajes, el estado de "leído" no se actualizaba para el otro usuario.

**Solución:** Configuré el evento `markAsRead` en Socket.IO para que se emitiera a todos los participantes del chat.

---

#### 13. **Multer rechazaba archivos grandes**
Intenté subir un PDF de 15MB y me daba error sin explicar por qué.

**Solución:** Agregué validación de tamaño antes de procesar el archivo y devuelvo un error claro: "El archivo supera el tamaño máximo permitido (10MB)".

---

### Tips para debugging

Si algo no funciona, probá esto:

```bash
# Ver los logs en tiempo real
tail -f logs/app.log

# Verificar que MongoDB esté conectado
# (debería aparecer un mensaje en los logs)

# Testear un endpoint con curl
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# Ver qué puerto está usando el servidor
netstat -ano | findstr :3000
```