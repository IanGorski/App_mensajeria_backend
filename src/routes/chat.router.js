import { Router } from "express";
import ChatController from "../controllers/chat.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const chatRouter = Router();

// Obtener todos los chats del usuario autenticado
chatRouter.get(
    '/',
    authMiddleware,
    ChatController.getAll
);

// Obtener un chat específico por ID
chatRouter.get(
    '/:chat_id',
    authMiddleware,
    ChatController.getById
);

// Crear un chat privado
chatRouter.post(
    '/private',
    authMiddleware,
    ChatController.createPrivateChat
);

// Crear un grupo
chatRouter.post(
    '/group',
    authMiddleware,
    ChatController.createGroupChat
);

// Archivar un chat
chatRouter.put(
    '/:chat_id/archive',
    authMiddleware,
    ChatController.archiveChat
);

// Eliminar un chat
chatRouter.delete(
    '/:chat_id',
    authMiddleware,
    ChatController.deleteChat
);

// Actualizar información del grupo
chatRouter.put(
    '/:chat_id/group',
    authMiddleware,
    ChatController.updateGroupInfo
);

export default chatRouter;
