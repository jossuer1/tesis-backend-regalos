import { crearTokenJWT } from "../middlewares/JWT.js"
import { sendMailToRecoveryPassword, sendMailToRegister } from "../helpers/sendMail.js"
import Usuario from "../models/Usuario.js"

// REGISTRO DE USUARIO (Con validaciones completas)
const registro = async (req, res) => {
    try {
        let { nombre, apellido, telefono, email, password } = req.body

        // Validar campos vacíos
        if (Object.values(req.body).includes("")) {
            return res.status(400).json({
                msg: "Lo sentimos, debes llenar todos los campos"
            })
        }

        // Normalizar datos antes de validar
        nombre = nombre?.trim()
        apellido = apellido?.trim()
        email = email?.toLowerCase().trim()

        // Validar nombre
        const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/
        if (!nombre || !regexNombre.test(nombre)) {
            return res.status(400).json({
                msg: "El nombre solo puede contener letras"
            })
        }

        // Validar apellido 
        if (apellido && !regexNombre.test(apellido)) {
            return res.status(400).json({
                msg: "El apellido solo puede contener letras"
            })
        }

        // Validar teléfono
        const regexTelefono = /^\d{7,15}$/
        if (!regexTelefono.test(telefono)) {
            return res.status(400).json({
                msg: "El teléfono solo debe contener números (entre 7 y 15 dígitos)"
            })
        }

        // Validar email
        const regexEmail = /\S+@\S+\.\S+/
        if (!regexEmail.test(email)) {
            return res.status(400).json({
                msg: "Correo electrónico inválido"
            })
        }

        // Validar password (mínimo 8 caracteres, una mayúscula y un número)
        const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
        if (!regexPassword.test(password)) {
            return res.status(400).json({
                msg: "La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número"
            })
        }

        // Verificar si el email ya existe en la Base de Datos
        const verificarEmailBDD = await Usuario.findOne({ email })
        if (verificarEmailBDD) {
            return res.status(400).json({
                msg: "Lo sentimos, el email ya se encuentra registrado"
            })
        }

        // Crear la instancia del nuevo usuario
        const nuevoUsuario = new Usuario({
            ...req.body,
            nombre,
            apellido,
            email
        })

        // Encriptar password
        nuevoUsuario.password = await nuevoUsuario.encryptPassword(password)

        // Generar Token de confirmación
        const token = nuevoUsuario.createToken()

        // Guardar en la Base de Datos
        await nuevoUsuario.save()

        // Enviar correo de confirmación
        await sendMailToRegister(email, token)

        return res.status(200).json({
            msg: "Revisa tu correo electrónico para confirmar tu cuenta"
        })

    } catch (error) {
        console.error("ERROR EN REGISTRO:", error)
        return res.status(500).json({
            msg: "❌ Error en el servidor"
        })
    }
}

// CONFIRMAR EMAIL
const confirmarMail = async (req, res) => {
    try {
        const { token } = req.params

        const usuarioBDD = await Usuario.findOne({ token })
        if (!usuarioBDD) {
            return res.status(404).json({ msg: "Token inválido o cuenta ya confirmada" })
        }

        usuarioBDD.token = null
        usuarioBDD.confirmEmail = true
        await usuarioBDD.save()

        return res.status(200).json({ msg: "Cuenta confirmada, ya puedes iniciar sesión" })

    } catch (error) {
        console.error("ERROR EN CONFIRMAR MAIL:", error)
        return res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

// RECUPERAR CONTRASEÑA
const recuperarPassword = async (req, res) => {
    try {
        const { email } = req.body

        if (Object.values(req.body).includes("")) {
            return res.status(400).json({ msg: "Todos los campos son obligatorios" })
        }

        // Normalizar email para la búsqueda
        const emailNormalizado = email?.toLowerCase().trim()

        const usuarioBDD = await Usuario.findOne({ email: emailNormalizado })
        if (!usuarioBDD) {
            return res.status(404).json({ msg: "El usuario no se encuentra registrado" })
        }

        const token = usuarioBDD.createToken()
        usuarioBDD.token = token
        
        await sendMailToRecoveryPassword(emailNormalizado, token)
        await usuarioBDD.save()

        return res.status(200).json({ msg: "Revisa tu correo electrónico para restablecer tu cuenta" })

    } catch (error) {
        console.error("ERROR EN RECUPERAR PASSWORD:", error)
        return res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

// COMPROBAR TOKEN DE CONTRASEÑA
const comprobarTokenPassword = async (req, res) => {
    try {
        const { token } = req.params

        const usuarioBDD = await Usuario.findOne({ token })
        if (!usuarioBDD) {
            return res.status(404).json({
                msg: "Lo sentimos, no se puede recuperar la contraseña"
            })
        }

        return res.status(200).json({
            msg: "Token confirmado"
        })

    } catch (error) {
        console.error("ERROR EN COMPROBAR TOKEN:", error)
        return res.status(500).json({
            msg: "❌ Error en el servidor"
        })
    }
}

// CREAR NUEVO PASSWORD
const crearNuevoPassword = async (req, res) => {
    try {
        const { token } = req.params
        const { password, confirmpassword } = req.body

        const usuarioBDD = await Usuario.findOne({ token })
        if (!usuarioBDD) {
            return res.status(404).json({
                msg: "No se puede validar la cuenta"
            })
        }

        if (password !== confirmpassword) {
            return res.status(400).json({
                msg: "Las contraseñas no coinciden"
            })
        }

        usuarioBDD.token = null
        usuarioBDD.password = await usuarioBDD.encryptPassword(password)
        await usuarioBDD.save()

        return res.status(200).json({
            msg: "Contraseña actualizada correctamente"
        })

    } catch (error) {
        console.error("ERROR EN CREAR NUEVO PASSWORD:", error)
        return res.status(500).json({
            msg: "❌ Error en el servidor"
        })
    }
}

// INICIO DE SESIÓN (LOGIN)
const login = async (req, res) => {
    try {
        const { email, password } = req.body

        if (Object.values(req.body).includes("")) {
            return res.status(400).json({ msg: "Debes llenar todos los campos" })
        }

        const emailNormalizado = email?.toLowerCase().trim()

        const usuarioBDD = await Usuario.findOne({ email: emailNormalizado }).select("-status -__v -token -updatedAt -createdAt")
        if (!usuarioBDD) {
            return res.status(404).json({ msg: "El usuario no se encuentra registrado" })
        }

        if (!usuarioBDD.confirmEmail) {
            return res.status(403).json({ msg: "Debes verificar tu cuenta antes de iniciar sesión" })
        }

        const verificarPassword = await usuarioBDD.matchPassword(password)
        if (!verificarPassword) {
            return res.status(401).json({ msg: "El password no es correcto" })
        }

        const { nombre, apellido, direccion, telefono, _id, rol } = usuarioBDD
        const token = crearTokenJWT(_id, rol || "usuario")

        return res.status(200).json({
            token,
            nombre,
            apellido,
            direccion,
            telefono,
            _id,
            email: usuarioBDD.email
        })

    } catch (error) {
        console.error("ERROR EN LOGIN:", error)
        return res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}


// PERFIL DEL USUARIO AUTENTICADO

const perfil = (req, res) => {
    try {
        const usuarioAutenticado = req.usuarioHeader

        if (!usuarioAutenticado) {
            return res.status(404).json({ msg: "No se encontró el perfil del usuario" })
        }

        return res.status(200).json(usuarioAutenticado)

    } catch (error) {
        console.error("ERROR EN PERFIL:", error)
        return res.status(500).json({ msg: "❌ Error en el servidor al obtener el perfil" })
    }
}

export {
    registro,
    confirmarMail,
    recuperarPassword,
    comprobarTokenPassword,
    crearNuevoPassword,
    login,
    perfil
}