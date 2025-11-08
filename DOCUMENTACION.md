# 📚 Documentación Técnica del Backend

## 📁 Estructura del Proyecto

```
Backend/
├── src/
│   ├── config/              # Configuraciones
│   │   ├── configMongoDB.config.js    # Configuración de MongoDB
│   │   ├── environment.config.js      # Variables de entorno
│   │   └── mailTransporter.config.js  # Configuración de Nodemailer
│   ├── controllers/         # Controladores (manejo de requests)
│   │   ├── auth.controller.js
│   │   ├── chat.controller.js
│   │   └── message.controller.js
│   ├── services/            # Lógica de negocio
│   │   ├── auth.service.js
│   │   ├── chat.service.js
│   │   └── message.service.js
│   ├── repositories/        # Acceso a datos
│   │   ├── user.repository.js
│   │   ├── chat.repository.js
│   │   └── message.repository.js
│   ├── models/              # Modelos de MongoDB
│   │   ├── User.model.js
│   │   ├── Chat.model.js
│   │   └── Message.model.js
│   ├── routes/              # Definición de rutas
│   │   ├── auth.router.js
│   │   ├── chat.router.js
│   │   └── message.router.js
│   ├── middlewares/         # Middlewares personalizados
│   │   ├── authMiddleware.js
│   │   └── validateRequest.middleware.js
│   ├── schemas/             # Esquemas de validación
│   │   └── auth.schema.js
│   ├── error.js            # Manejo de errores
│   └── main.js             # Punto de entrada
├── uploads/                # Archivos subidos
├── .env                    # Variables de entorno
├── .gitignore
├── package.json
└── README.md
```

## 🔌 WebSocket Events

### Cliente → Servidor

- `joinChat` - Unirse a un chat
- `sendMessage` - Enviar mensaje
- `typing` - Indicar que está escribiendo
- `stopTyping` - Dejar de escribir

### Servidor → Cliente

- `receiveMessage` - Recibir mensaje nuevo
- `userTyping` - Usuario está escribiendo
- `userStoppedTyping` - Usuario dejó de escribir
- `error` - Error en operación

## 🗄️ Modelos de Base de Datos

### User
```javascript
{
  name: String,                    // Nombre del usuario
  email: String,                   // Email único
  password: String,                // Hash bcrypt
  verified_email: Boolean,         // Email verificado
  verification_token: String,      // Token de verificación
  created_at: Date,               // Fecha de registro
  active: Boolean                 // Cuenta activa
}
```

### Chat
```javascript
{
  participants: [ObjectId],        // Referencias a User
  isGroup: Boolean,               // Chat de grupo o privado
  groupName: String,              // Nombre del grupo (opcional)
  groupAvatar: String,            // Avatar del grupo (opcional)
  groupAdmin: ObjectId,           // Administrador del grupo
  lastMessage: ObjectId,          // Último mensaje enviado
  archived: Boolean,              // Chat archivado
  created_at: Date,              // Fecha de creación
  active: Boolean                // Chat activo
}
```

### Message
```javascript
{
  chat_id: ObjectId,              // Referencia a Chat
  sender_id: ObjectId,            // Referencia a User
  content: String,                // Contenido del mensaje
  type: String,                   // text|image|audio|video|file
  fileUrl: String,                // URL del archivo (opcional)
  read_by: [{                     // Usuarios que leyeron
    user_id: ObjectId,
    read_at: Date
  }],
  created_at: Date,              // Fecha de envío
  deleted: Boolean               // Mensaje eliminado
}
```