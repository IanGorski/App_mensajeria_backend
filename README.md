# 💬  API Backend - Aplicación de Mensajería en Tiempo Real

API RESTful y servidor WebSocket para aplicación de mensajería instantánea con arquitectura Node.js, Express, MongoDB y Socket.IO.

## 🛠️ Stacks Tecnológicos

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.x-brightgreen.svg)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-black.svg)](https://socket.io/)
[![Winston](https://img.shields.io/badge/Winston-3.x-yellow.svg)](https://github.com/winstonjs/winston)
[![Joi](https://img.shields.io/badge/Joi-17.x-orange.svg)](https://joi.dev/)
[![Nodemailer](https://img.shields.io/badge/Nodemailer-6.x-red.svg)](https://nodemailer.com/)

## 🌐 Despliegue

- [![Backend en Render](https://img.shields.io/badge/Render-Deploy-blue.svg)](https://app-mensajeria-websockets.onrender.com/)
- [![Backend en Vercel](https://img.shields.io/badge/Vercel-Deploy-black.svg)](https://app-mensajeria-backend.vercel.app/)

## 🚀 Características Principales

- ✅ **Autenticación JWT** - Sistema de autenticación seguro con tokens
- ✅ **Mensajería en Tiempo Real** - WebSocket con Socket.IO
- ✅ **Gestión de Chats** - Chats privados y grupales
- ✅ **Estados de Conexión** - Indicadores de usuario online/offline
- ✅ **Indicadores de Escritura** - Notificaciones en tiempo real
- ✅ **Mensajes Leídos** - Tracking de estado de lectura
- ✅ **Búsqueda de Usuarios** - Sistema de búsqueda por email/nombre
- ✅ **Historial de Mensajes** - Paginación y límite de 300 mensajes
- ✅ **Subida de Archivos** - Gestión de multimedia con Multer
- ✅ **Base de Datos MongoDB** - Persistencia con Mongoose
- ✅ **Logging Estructurado** - Sistema de logs con Winston
- ✅ **Verificación de Email** - Validación de cuentas con Nodemailer

### Prerrequisitos

- **Node.js** >= 20.x
- **MongoDB** >= 8.x
- **npm** o **yarn**

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd Backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones
```

## ⚙️ Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Servidor
PORT=3000
SOCKET_PORT=3001

# Base de Datos
MONGO_URI=mongodb://localhost:27017/mensajeria_app
# O usar MongoDB Atlas:
# MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/mensajeria_app

# Seguridad
JWT_SECRET=
JWT_EXPIRE=

# CORS - Frontend URLs permitidos
URL_FRONTEND=http://localhost:5173

# Email (Opcional - para verificación de cuenta)
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_contraseña_de_aplicación
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# Entorno
NODE_ENV=development
```

## 🏃‍♂️ Ejecución

### Desarrollo (con hot-reload)

```bash
npm run dev
```

### Producción

```bash
npm start
```

El servidor estará disponible en:
- **API HTTP**: `http://localhost:3000`
- **WebSocket**: `http://localhost:3001`

## 📚 Documentación Técnica

Para más detalles sobre la estructura del proyecto, eventos de WebSocket y modelos de base de datos, consulta la [Documentación Técnica del Backend](./DOCUMENTACION.md).

### Flujo de Datos

El flujo de datos en la aplicación sigue el siguiente patrón:

Cliente → Router → Middleware → Controller → Service → Repository → MongoDB

## 📖 Documentación de la API

La documentación completa de todos los endpoints está disponible en [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

### Endpoints Principales:

#### Autenticación

- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/verify` - Verificar token
- `GET /api/auth/verify-email/:token` - Verificar email

#### Chats

- `GET /api/chats` - Obtener todos los chats
- `GET /api/chats/:chat_id` - Obtener chat por ID
- `POST /api/chats/private` - Crear chat privado
- `POST /api/chats/group` - Crear grupo
- `PUT /api/chats/:chat_id/archive` - Archivar chat
- `DELETE /api/chats/:chat_id` - Eliminar chat
- `PUT /api/chats/:chat_id/group` - Actualizar info del grupo

#### Mensajes

- `GET /api/messages/:chat_id` - Obtener mensajes
- `POST /api/messages` - Enviar mensaje
- `PUT /api/messages/:message_id/read` - Marcar mensaje como leído
- `PUT /api/messages/chat/:chat_id/read` - Marcar todos como leídos
- `GET /api/messages/chat/:chat_id/unread` - Obtener conteo de no leídos
- `DELETE /api/messages/:message_id` - Eliminar mensaje

#### Upload

- `POST /api/upload` - Subir archivo


## 📝 Scripts Disponibles

```bash
# Desarrollo con hot reload
npm run dev

# Producción
npm start

# Desarrollo con nodemon alternativo
npm run nodemon-dev
```

## 🔒 Seguridad

- ✅ Contraseñas hasheadas con bcrypt (10 salt rounds)
- ✅ Tokens JWT con expiración configurable
- ✅ Validación de datos con Joi
- ✅ CORS configurado
- ✅ Autenticación requerida en rutas protegidas
- ✅ Sanitización de inputs
- ✅ Variables de entorno para credenciales sensibles

## 📈 Estado del Proyecto

- ✅ Autenticación y autorización
- ✅ Sistema de chats privados y grupales
- ✅ Mensajería en tiempo real
- ✅ Carga de archivos
- ✅ Verificación por email
- ✅ Sistema de archivado
- ✅ Logging y manejo de errores

## 🛠️ Troubleshooting

En esta sección realicé un resumen de los problemas que se me fueron presentando y sus soluciones. [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

## 📄 Licencia

ISC License

## 👤 Autor

**Ian Gorski**
- GitHub: [@IanGorski](https://github.com/IanGorski)

---