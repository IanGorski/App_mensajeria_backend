import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    isGroup: {
        type: Boolean,
        default: false
    },
    groupName: {
        type: String,
        default: null
    },
    groupAvatar: {
        type: String,
        default: null
    },
    groupAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now,
        required: true
    },
    archived: {
        type: Boolean,
        default: false
    },
    active: {
        type: Boolean,
        default: true
    }
});

// Índice para búsquedas para usuarios en chats privados y grupales
chatSchema.index({ participants: 1 });
chatSchema.index({ created_at: -1 });

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
