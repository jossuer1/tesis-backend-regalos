import Categoria from "../models/Categoria.js"

// CREAR CATEGORÍA (Solo Admin)
const crearCategoria = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body

        if (!nombre || nombre.trim() === "") {
            return res.status(400).json({ msg: "El nombre de la categoría es obligatorio" })
        }

        const nombreNormalizado = nombre.trim()

        // Verificar si ya existe
        const existeCategoria = await Categoria.findOne({ nombre: nombreNormalizado })
        if (existeCategoria) {
            return res.status(400).json({ msg: "Esta categoría ya existe" })
        }

        const nuevaCategoria = new Categoria({
            nombre: nombreNormalizado,
            descripcion: descripcion?.trim()
        })

        await nuevaCategoria.save()
        return res.status(201).json({ msg: "Categoría creada con éxito", nuevaCategoria })

    } catch (error) {
        console.error("ERROR CREAR CATEGORÍA:", error)
        return res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

// OBTENER TODAS LAS CATEGORÍAS (Público)
const obtenerCategorias = async (req, res) => {
    try {
        const categorias = await Categoria.find().lean()
        return res.status(200).json(categorias)
    } catch (error) {
        console.error("ERROR OBTENER CATEGORÍAS:", error)
        return res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

export {
    crearCategoria,
    obtenerCategorias
}