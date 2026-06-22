import jwt from "jsonwebtoken"
import Usuario from "../models/Usuario.js"

// 1. Generar el Token (Se queda igual, impecable)
const crearTokenJWT = (id, rol) => {
    return jwt.sign({ id, rol }, process.env.JWT_SECRET, { expiresIn: "1d" })
}

// 2. Middleware base: Verifica si el usuario está logueado (Cualquier rol válido)
const verificarTokenJWT = async (req, res, next) => {
    const { authorization } = req.headers
    if (!authorization) return res.status(401).json({ msg: "Acceso denegado: token no proporcionado" })
    
    try {
        const token = authorization.split(" ")[1]
        const { id, rol } = jwt.verify(token, process.env.JWT_SECRET)
        
        // Buscamos al usuario en la BDD sin importar si es Cliente o Admin
        const usuarioBDD = await Usuario.findById(id).lean().select("-password")
        if (!usuarioBDD) return res.status(401).json({ msg: "Usuario no encontrado" })
        
        // Guardamos todo el objeto del usuario en la 'req' para usarlo en los controladores
        req.usuario = usuarioBDD 
        
        return next() 
    } catch (error) {
        console.log(error)
        return res.status(401).json({ msg: `Token inválido o expirado - ${error.message}` })
    }
}

// 3. Middleware exclusivo para proteger rutas de Administrador
const esAdmin = (req, res, next) => {
    // req.usuario ya existe gracias a que 'verificarTokenJWT' se ejecuta antes
    if (req.usuario && req.usuario.rol === "Admin") {
        return next()
    }
    return res.status(403).json({ msg: "Acceso denegado: Se requieren permisos de Administrador" })
}

// 4. Middleware opcional si quieres blindar rutas exclusivas de Clientes
const esCliente = (req, res, next) => {
    if (req.usuario && req.usuario.rol === "Cliente") {
        return next()
    }
    return res.status(403).json({ msg: "Acceso denegado: Ruta exclusiva para clientes" })
}

export { 
    crearTokenJWT,
    verificarTokenJWT,
    esAdmin,
    esCliente
}