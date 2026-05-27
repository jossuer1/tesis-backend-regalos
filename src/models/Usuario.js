import { Schema, model } from "mongoose"
import bcrypt from "bcryptjs"

const usuarioSchema = new Schema(
{
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    apellido: {
        type: String,
        trim: true,
        default: null
    },
    telefono: { 
        type: String,
        required: true
    },
    direccion: { 
        type: String,
        default: null
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    },
    token: {
        type: String,
        default: null
    },
    confirmEmail: {
        type: Boolean,
        default: false
    },
    rol: {
        type: String,
        default: "Cliente" 
    }
},
{
    timestamps: true
}
)

// Cifrar password
usuarioSchema.methods.encryptPassword = async function (password) {
    const salt = await bcrypt.genSalt(10)
    return await bcrypt.hash(password, salt)
}

// Comparar passwords
usuarioSchema.methods.matchPassword = async function (password) {
    return await bcrypt.compare(password, this.password)
}

// Generar token
usuarioSchema.methods.createToken = function () {
    const tokenGenerado = Math.random().toString(36).slice(2)
    this.token = tokenGenerado
    return tokenGenerado
}

// Exportamos como "Usuario" que es lo que busca tu controlador
export default model("Usuario", usuarioSchema)