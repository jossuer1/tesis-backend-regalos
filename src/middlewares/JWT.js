import jwt from "jsonwebtoken"
import Usuario from "../models/Usuario.js"

const crearTokenJWT = (id, rol) => {
    return jwt.sign({ id, rol }, process.env.JWT_SECRET, { expiresIn: "1d" })
}

const verificarTokenJWT = async (req, res, next) => {
    const { authorization } = req.headers
    if (!authorization) return res.status(401).json({ msg: "Acceso denegado: token no proporcionado" })
    
    try {
        const token = authorization.split(" ")[1]
        const { id, rol } = jwt.verify(token, process.env.JWT_SECRET)
        
        // Validamos el rol (Vendedor) de forma segura
        if (rol && rol.toLowerCase() === "Vendedor") {
            const usuarioBDD = await Usuario.findById(id).lean().select("-password")
            if (!usuarioBDD) return res.status(401).json({ msg: "Usuario no encontrado" })
            
            
            req.usuarioHeader = usuarioBDD
            return next() 
        } else {
            return res.status(403).json({ msg: "Acceso denegado: Rol no autorizado" })
        }

    } catch (error) {
        console.log(error)
        return res.status(401).json({ msg: `Token inválido o expirado - ${error.message}` })
    }
}

export { 
    crearTokenJWT,
    verificarTokenJWT 
}