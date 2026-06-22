import mongoose, { Schema, model } from 'mongoose'

const categoriaSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    descripcion: {
        type: String,
        trim: true
    }
}, {
    timestamps: true // Les crea automáticamente el createdAt y updatedAt
})

// Exportación por defecto nativa de ES Modules
export default mongoose.model('Categoria', categoriaSchema)