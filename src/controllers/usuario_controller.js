import { crearTokenJWT } from "../middlewares/JWT.js" 
import { sendMailToRecoveryPassword, sendMailToRegister,sendMailToNuevoUsuarioAdmin } from "../helpers/sendMail.js"
import Usuario from "../models/Usuario.js"

// REGISTRO DE USUARIO 
const registro = async (req, res) => {
    try {
        let { nombre, apellido, telefono, email, password } = req.body

        if (Object.values(req.body).includes("")) {
            return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos" })
        }

        nombre = nombre?.trim()
        apellido = apellido?.trim()
        email = email?.toLowerCase().trim()

        const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/
        if (!nombre || !regexNombre.test(nombre)) {
            return res.status(400).json({ msg: "El nombre solo puede contener letras" })
        }

        if (apellido && !regexNombre.test(apellido)) {
            return res.status(400).json({ msg: "El apellido solo puede contener letras" })
        }

        const regexTelefono = /^\d{7,15}$/
        if (!regexTelefono.test(telefono)) {
            return res.status(400).json({ msg: "El teléfono solo debe contener números (entre 7 y 15 dígitos)" })
        }

        const regexEmail = /\S+@\S+\.\S+/
        if (!regexEmail.test(email)) {
            return res.status(400).json({ msg: "Correo electrónico inválido" })
        }

        const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
        if (!regexPassword.test(password)) {
            return res.status(400).json({ msg: "La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número" })
        }

        const verificarEmailBDD = await Usuario.findOne({ email })
        if (verificarEmailBDD) {
            return res.status(400).json({ msg: "Lo sentimos, el email ya se encuentra registrado" })
        }

        const nuevoUsuario = new Usuario({
            ...req.body,
            nombre,
            apellido,
            email
        })

        nuevoUsuario.password = await nuevoUsuario.encryptPassword(password)
        const token = nuevoUsuario.createToken()
        await nuevoUsuario.save()

        await sendMailToRegister(email, token)

        return res.status(200).json({ msg: "Revisa tu correo electrónico para confirmar tu cuenta" })

    } catch (error) {
        console.error("ERROR EN REGISTRO:", error)
        return res.status(500).json({ msg: "❌ Error en el servidor" })
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
            return res.status(404).json({ msg: "Lo sentimos, no se puede recuperar la contraseña" })
        }
        return res.status(200).json({ msg: "Token confirmado" })
    } catch (error) {
        console.error("ERROR EN COMPROBAR TOKEN:", error)
        return res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

// CREAR NUEVO PASSWORD 
const crearNuevoPassword = async (req, res) => {
    try {
        const { token } = req.params
        const { password, confirmpassword } = req.body

        const usuarioBDD = await Usuario.findOne({ token })
        if (!usuarioBDD) {
            return res.status(404).json({ msg: "No se puede validar la cuenta" })
        }

        if (password !== confirmpassword) {
            return res.status(400).json({ msg: "Las contraseñas no coinciden" })
        }

        usuarioBDD.token = null
        usuarioBDD.password = await usuarioBDD.encryptPassword(password)
        await usuarioBDD.save()

        return res.status(200).json({ msg: "Contraseña actualizada correctamente" })
    } catch (error) {
        console.error("ERROR EN CREAR NUEVO PASSWORD:", error)
        return res.status(500).json({ msg: "❌ Error en el servidor" })
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
        
        const token = crearTokenJWT(_id, rol)

        return res.status(200).json({
            token,
            nombre,
            apellido,
            direccion,
            telefono,
            _id,
            email: usuarioBDD.email,
            rol // Enviarlo al frontend ayuda a saber si renderizar vista Cliente o Admin
        })

    } catch (error) {
        console.error("ERROR EN LOGIN:", error)
        return res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

// PERFIL DEL USUARIO AUTENTICADO - 🛠️ Ajustado para usar req.usuario
const perfil = (req, res) => {
    try {
        // 🛠️ MODIFICACIÓN: Cambiado de 'req.usuarioHeader' a 'req.usuario' para acoplarse al middleware
        const usuarioAutenticado = req.usuario

        if (!usuarioAutenticado) {
            return res.status(404).json({ msg: "No se encontró el perfil del usuario" })
        }

        return res.status(200).json(usuarioAutenticado)

    } catch (error) {
        console.error("ERROR EN PERFIL:", error)
        return res.status(500).json({ msg: "❌ Error en el servidor al obtener el perfil" })
    }
}


// 👑 CREAR USUARIO DESDE EL PANEL (Registrar Clientes o Empleados con envío de credenciales)
const crearUsuarioDesdeAdmin = async (req, res) => {
    try {
        const { nombre, apellido, email, direccion, telefono, rol } = req.body

        // 1. Validación de campos obligatorios
        if ([nombre, email, rol].includes("") || !nombre || !email || !rol) {
            return res.status(400).json({ msg: "Por favor, llena los campos esenciales (Nombre, Email y Rol)" })
        }

        // 2. Control estricto de roles válidos para tu modelo de negocio
        const rolesValidos = ["Cliente", "Admin", "Vendedor"]
        if (!rolesValidos.includes(rol)) {
            return res.status(400).json({ msg: "El rol seleccionado no es válido en el sistema" })
        }

        // 3. Verificar duplicados por correo
        const existeUsuario = await Usuario.findOne({ email: email.trim().toLowerCase() })
        if (existeUsuario) {
            return res.status(400).json({ msg: "El email ya se encuentra registrado" })
        }

        // 4. Clonamos la lógica de generación automática de password del Inge
        // Genera un string aleatorio de 3 caracteres en mayúsculas (ej: A4F)
        const semillaPassword = Math.random().toString(36).toUpperCase().slice(2, 5)
        const passwordPlano = "MAGIC" + semillaPassword // Contraseña en texto plano para el correo

        // 5. Creamos la instancia apuntando a tu modelo Usuario
        const nuevoUsuario = new Usuario({
            nombre: nombre.trim(),
            apellido: apellido?.trim(),
            email: email.trim().toLowerCase(),
            direccion: direccion?.trim(),
            telefono: telefono?.trim(),
            role: rol,
            confirmado: true, // Queda verificado de inmediato para que puedan usarlo
            token: null,
            confirmEmail: true
        })

        // Encriptamos la contraseña usando el método del modelo Usuario (pre-save o directo si tienes el método)
        // Si tu modelo maneja un método .encryptPassword lo llamas así, sino Mongoose lo hace en su hook pre-save.
        if (typeof nuevoUsuario.encryptPassword === 'function') {
            nuevoUsuario.password = await nuevoUsuario.encryptPassword(passwordPlano)
        } else {
            // Si confías en el pre-save de tu modelo, simplemente asígnala en texto plano y se encriptará sola:
            nuevoUsuario.password = passwordPlano
        }

        // 6. Persistir en MongoDB
        await nuevoUsuario.save()

        // 7. Despachar correo electrónico con el password limpio
        await sendMailToNuevoUsuarioAdmin(nuevoUsuario.email, passwordPlano, rol)

        return res.status(201).json({ 
            msg: `Registro exitoso del ${rol} y credenciales enviadas a su correo.` 
        })

    } catch (error) {
        console.error("ERROR CREAR USUARIO ADMIN:", error)
        return res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

export {
    registro,
    confirmarMail,
    recuperarPassword,
    comprobarTokenPassword,
    crearNuevoPassword,
    login,
    perfil,
    crearUsuarioDesdeAdmin
}