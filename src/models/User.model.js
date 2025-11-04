import mongoose, { mongo } from "mongoose";

//Creación schema para usuarios
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        created_at: {
            type: Date,
            default: Date.now,
            required: true
        },
        modified_at: {
            type: Date,
            default: null
        },
        active: {
            type: Boolean,
            default: true,
            required: true
        },
        verified_email: {
            type: Boolean,
            default: false
        }
    }
)

//Registro de schema para uso en la BD
const User = mongoose.model('User', userSchema)

export default User