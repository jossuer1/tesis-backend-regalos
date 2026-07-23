import Producto from "../models/Producto.js"
import Categoria from "../models/Categoria.js"
import { subirImagenCloudinary, subirBase64Cloudinary } from "../helpers/cloudinary.js"

// 👑 CREAR PRODUCTO (Solo Admin - Soporta Multer Físico y Base64 de IA)
const crearProducto = async (req, res) => {
    try {
        const { nombre, descripcion, precio, stock, categoria, etiquetas, imagenBase64 } = req.body

        // Validar campos obligatorios básicos (quitamos imagenUrl porque se genera dinámicamente)
        if ([nombre, descripcion, precio, stock, categoria].includes("") || !nombre || !precio || !categoria) {
            return res.status(400).json({ msg: "Por favor, llena todos los campos obligatorios" })
        }

        // Verificar que la categoría exista en la BDD
        const existeCategoria = await Categoria.findById(categoria)
        if (!existeCategoria) {
            return res.status(404).json({ msg: "La categoría seleccionada no existe" })
        }

        let urlFinalImagen = ""

        // 🖼️ CASO A: El Administrador sube un archivo físico a través de Multer (Form-data)
        if (req.file) {
            const resultado = await subirImagenCloudinary(req.file.path)
            urlFinalImagen = resultado.secure_url // Guardamos la URL segura que nos da Cloudinary
        } 
        // 🤖 CASO B: El Frontend envía una imagen autogenerada por IA en formato Base64 (JSON)
        else if (imagenBase64 && imagenBase64.trim() !== "") {
            urlFinalImagen = await subirBase64Cloudinary(imagenBase64)
        } 
        // 🚨 CASO C: No se envió ninguna imagen por ningún medio
        else {
            return res.status(400).json({ msg: "Es obligatorio subir una imagen para el producto" })
        }

        // Parsear las etiquetas si vienen como un string (común al enviar datos por Form-data con Multer)
        let etiquetasFormateadas = etiquetas
        if (typeof etiquetas === 'string') {
            try {
                etiquetasFormateadas = JSON.parse(etiquetas)
            } catch (e) {
                // Si falla el parseo de JSON, separamos por comas de forma rústica
                etiquetasFormateadas = etiquetas.split(',').map(tag => tag.trim())
            }
        }

        const nuevoProducto = new Producto({
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            precio: Number(precio),
            stock: Number(stock),
            imagenUrl: urlFinalImagen, // Inyección de la URL de Cloudinary
            categoria,
            etiquetas: Array.isArray(etiquetasFormateadas) ? etiquetasFormateadas : []
        })

        await nuevoProducto.save()
        return res.status(201).json({ msg: "🎁 Regalo agregado y alojado en Cloudinary con éxito", nuevoProducto })

    } catch (error) {
        console.error("ERROR CREAR PRODUCTO:", error)
        return res.status(500).json({ msg: "❌ Error en el servidor al guardar el producto" })
    }
}

// OBTENER TODOS LOS PRODUCTOS (Público - Con opción de filtrar por categoría)
const obtenerProductos = async (req, res) => {
    try {
        const { categoria } = req.query
        let filtro = {}

        if (categoria) {
            filtro.categoria = categoria
        }

        const productos = await Producto.find(filtro).populate("categoria", "nombre").lean()
        return res.status(200).json(productos)

    } catch (error) {
        console.error("ERROR OBTENER PRODUCTOS:", error)
        return res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

// OBTENER UN SOLO PRODUCTO POR ID (Público)
const obtenerProductoPorId = async (req, res) => {
    try {
        const { id } = req.params
        const producto = await Producto.findById(id).populate("categoria", "nombre").lean()
        
        if (!producto) {
            return res.status(404).json({ msg: "El producto no existe" })
        }

        return res.status(200).json(producto)
    } catch (error) {
        console.error("ERROR DETALLE PRODUCTO:", error)
        return res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

// 👑 ACTUALIZAR PRODUCTO (Solo Admin - Soporta reemplazar imagen o mantener la actual)
const actualizarProducto = async (req, res) => {
    try {
        const { id } = req.params
        const { nombre, descripcion, precio, stock, categoria, etiquetas, imagenBase64 } = req.body

        const productoBDD = await Producto.findById(id)
        if (!productoBDD) {
            return res.status(404).json({ msg: "El producto no existe" })
        }

        // Si mandan categoría nueva, verificar que exista
        if (categoria) {
            const existeCategoria = await Categoria.findById(categoria)
            if (!existeCategoria) {
                return res.status(404).json({ msg: "La categoría seleccionada no existe" })
            }
            productoBDD.categoria = categoria
        }

        // 🖼️ Solo tocamos la imagen si mandaron una nueva (archivo o base64).
        // Si no mandan nada, se mantiene la imagen que ya tenía.
        if (req.file) {
            const resultado = await subirImagenCloudinary(req.file.path)
            productoBDD.imagenUrl = resultado.secure_url
        } else if (imagenBase64 && imagenBase64.trim() !== "") {
            productoBDD.imagenUrl = await subirBase64Cloudinary(imagenBase64)
        }

        // Parsear etiquetas si vienen como string (igual que en crearProducto)
        if (etiquetas !== undefined) {
            let etiquetasFormateadas = etiquetas
            if (typeof etiquetas === 'string') {
                try {
                    etiquetasFormateadas = JSON.parse(etiquetas)
                } catch (e) {
                    etiquetasFormateadas = etiquetas.split(',').map(tag => tag.trim())
                }
            }
            productoBDD.etiquetas = Array.isArray(etiquetasFormateadas) ? etiquetasFormateadas : []
        }

        // Actualizar solo los campos que vengan en el body
        if (nombre) productoBDD.nombre = nombre.trim()
        if (descripcion) productoBDD.descripcion = descripcion.trim()
        if (precio) productoBDD.precio = Number(precio)
        if (stock !== undefined) productoBDD.stock = Number(stock)

        await productoBDD.save()
        return res.status(200).json({ msg: "Producto actualizado con éxito", productoActualizado: productoBDD })

    } catch (error) {
        console.error("ERROR ACTUALIZAR PRODUCTO:", error)
        return res.status(500).json({ msg: "❌ Error en el servidor al actualizar el producto" })
    }
}

// 👑 ELIMINAR PRODUCTO (Solo Admin)
const eliminarProducto = async (req, res) => {
    try {
        const { id } = req.params

        const productoBDD = await Producto.findById(id)
        if (!productoBDD) {
            return res.status(404).json({ msg: "El producto no existe" })
        }

        await productoBDD.deleteOne()
        return res.status(200).json({ msg: "Producto eliminado con éxito" })

    } catch (error) {
        console.error("ERROR ELIMINAR PRODUCTO:", error)
        return res.status(500).json({ msg: "❌ Error en el servidor al eliminar el producto" })
    }
}

export {
    crearProducto,
    obtenerProductos,
    obtenerProductoPorId,
    actualizarProducto,
    eliminarProducto
}