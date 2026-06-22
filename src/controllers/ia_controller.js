import { pipeline } from '@xenova/transformers'
import Producto from "../models/Producto.js"

// Función matemática para calcular la similitud de coseno entre dos vectores

const similitudCoseno = (vecA, vecB) => {
    let dotProduct = 0
    let normA = 0
    let normB = 0
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i]
        normA += vecA[i] * vecA[i]
        normB += vecB[i] * vecB[i]
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

// 🧠 ENDPOINT PRINCIPAL: ORQUESTACIÓN DE RECOMENDACIÓN Y BÚSQUEDA INTELIGENTE
const recomendarRegalos = async (req, res) => {
    try {
        const { busquedaHumana, presupuestoMaximo, ocasion } = req.body

        // 1. Validar que al menos haya un texto de búsqueda o intención
        if (!busquedaHumana) {
            return res.status(400).json({ msg: "Por favor, escribe qué estás buscando" })
        }

        // 2. Traer los productos con stock de MongoDB
        let filtroBase = { stock: { $gt: 0 } }
        if (presupuestoMaximo) {
            filtroBase.precio = { $lte: Number(presupuestoMaximo) }
        }

        const productos = await Producto.find(filtroBase).lean()

        if (productos.length === 0) {
            return res.status(200).json({ msg: "No hay productos disponibles dentro de ese presupuesto", recomendaciones: [] })
        }

        // 3. Inicializar el pipeline de Hugging Face (Feature Extraction)
        // Este modelo convierte texto en vectores numéricos que representan ideas
        const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')

        // 4. Convertir la búsqueda del usuario en un vector
        const textoEntrada = `${busquedaHumana} ${ocasion || ""}`
        const salidaUsuario = await extractor(textoEntrada, { pooling: 'mean', normalize: true })
        const vectorUsuario = Array.from(salidaUsuario.data)

        // 5. Comparar la intención del usuario con cada producto de tu base de datos
        const productosConPuntaje = await Promise.all(productos.map(async (producto) => {
            // Unimos el nombre, descripción y etiquetas del producto para que la IA tenga contexto completo
            const textoProducto = `${producto.nombre} ${producto.descripcion} ${producto.etiquetas.join(" ")}`
            
            const salidaProducto = await extractor(textoProducto, { pooling: 'mean', normalize: true })
            const vectorProducto = Array.from(salidaProducto.data)

            // Calculamos qué tan parecida es la idea del usuario con el producto real
            const puntajeSimilitud = similitudCoseno(vectorUsuario, vectorProducto)

            return {
                ...producto,
                iaPuntajeMatch: puntajeSimilitud // Agregamos el porcentaje de coincidencia
            }
        }))

        // 6. Ordenar los productos de mayor a menor coincidencia y tomar los 3 mejores
        const recomendacionesFinales = productosConPuntaje
            .sort((a, b) => b.iaPuntajeMatch - a.iaPuntajeMatch)
            .slice(0, 3)

        return res.status(200).json({
            msg: "Búsqueda inteligente procesada localmente con Hugging Face 🤖",
            totalEncontrados: recomendacionesFinales.length,
            recomendaciones: recomendacionesFinales
        })

    } catch (error) {
        console.error("ERROR EN EL BACKEND IA:", error)
        return res.status(500).json({ msg: "❌ Error interno en el motor de orquestación de IA" })
    }
}

export {
    recomendarRegalos
}