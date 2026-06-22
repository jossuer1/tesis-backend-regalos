import mongoose, { Schema, model } from 'mongoose'

const productoSchema = new Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    descripcion: {
        type: String,
        required: true,
        trim: true
    },
    precio: {
        type: Number,
        required: true,
        default: 0
    },
    stock: {
        type: Number,
        required: true,
        default: 0
    },
    imagenUrl: {
        type: String,
        trim: true
    },
    categoria: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categoria',
        required: true
    },
    etiquetas: {
        type: [String],
        default: []
    }
}, {
    timestamps: true
})

// Exportación por defecto moderna para que calce con tus controladores
export default model('Producto', productoSchema)