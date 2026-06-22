import { Router } from "express"
import { verificarTokenJWT, esAdmin } from "../middlewares/JWT.js"
import { crearCategoria, obtenerCategorias } from "../controllers/categoria_controller.js"
import { crearProducto, obtenerProductos, obtenerProductoPorId } from "../controllers/producto_controller.js"
import upload from "../middlewares/multer.js"

const router = Router()

// 🌍 RUTAS PÚBLICAS 
router.get("/categorias", obtenerCategorias)
router.get("/productos", obtenerProductos)
router.get("/productos/:id", obtenerProductoPorId)

// 👑 RUTAS PRIVADAS (Solo el Administrador puede crear stock o nuevas categorías)
router.post("/categorias", verificarTokenJWT, esAdmin, crearCategoria)
router.post("/productos", verificarTokenJWT, esAdmin, upload.single('imagenUrl'), crearProducto)

export default router