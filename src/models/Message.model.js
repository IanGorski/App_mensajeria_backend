import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    chat_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    sender_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'image', 'audio', 'video', 'file'],
        default: 'text'
    },
    fileUrl: {
        type: String,
        default: null
    },
    read_by: [{
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        read_at: {
            type: Date,
            default: Date.now
        }
    }],
    created_at: {
        type: Date,
        default: Date.now,
        required: true
    },
    deleted: {
        type: Boolean,
        default: false
    }
});

// Índices para búsquedas eficientes
messageSchema.index({ chat_id: 1, created_at: 1 });
messageSchema.index({ sender_id: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
