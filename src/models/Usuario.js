import { Schema, model } from "mongoose"
import bcrypt from "bcryptjs"

const usuarioSchema = new Schema(
{
    nombre: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50,
        match: [/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/, "Solo letras permitidas"]
    },

    apellido: {
        type: String,
        trim: true,
        default: null,
        minlength: 2,
        maxlength: 50,
        match: [/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/, "Solo letras permitidas"]
    },

    telefono: { 
        type: String,
        required: function () {
            return this.authProvider === "local"
        },
        default: null,
        match: [/^\d{7,15}$/, "Solo números válidos"]
    },

    direccion: { 
        type: String,
        default: null,
        maxlength: 150
    },

    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, "Correo inválido"]
    },

    password: {
        type: String,
        required: function () {
            return this.authProvider === "local"
        },
        default: null,
        minlength: 8
    },

    authProvider: {
        type: String,
        enum: ["local", "google"],
        default: "local"
    },

    googleId: {
        type: String,
        default: null,
        unique: true,
        sparse: true 
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
        enum: ["Cliente", "Admin", "Vendedor"],
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