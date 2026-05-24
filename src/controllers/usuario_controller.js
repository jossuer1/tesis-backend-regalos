import { crearTokenJWT } from "../middlewares/JWT.js"

import { sendMailToRecoveryPassword, sendMailToRegister } from "../helpers/sendMail.js"
import Usuario from "../models/Usuario.js"

const registro = async (req, res) => {

    try {

        const { email, password } = req.body

        // validar campos vacíos
        if (Object.values(req.body).includes("")) {return res.status(400).json({msg: "Lo sentimos, debes llenar todos los campos" })}
        // normalizar email
        const emailNormalizado = email.toLowerCase().trim()
        // verificar email
        const verificarEmailBDD = await Usuario.findOne({email: emailNormalizado})
        if (verificarEmailBDD) {return res.status(400).json({msg: "Lo sentimos, el email ya se encuentra registrado"})}
        // crear Usuario
        const nuevoUsuario= new Usuario({...req.body,email: emailNormalizado })
        // encriptar password
        nuevoUsuario.password = await nuevoUsuario.encryptPassword(password)
        // token
        const token = nuevoUsuario.createToken()
        // guardar
        await nuevoUsuario.save()
        // enviar email
        await sendMailToRegister(emailNormalizado, token)
        // respuesta
        return res.status(200).json({ msg: "Revisa tu correo electrónico para confirmar tu cuenta" })

    } catch (error) {console.log(error); 
        return res.status(500).json({msg: "❌ Error en el servidor"})}
}

const confirmarMail = async (req,res)=>{
    try{
        // paso 1
        const {token} = req.params
        //paso 2
        const usuarioBDD = await Usuario.findOne({token})
        if(!usuarioBDD)  return res.status(404).json({msg:"token invalido o cuenta ya confirmada"})
        // paso 3
        usuarioBDD.token = null
        usuarioBDD.confirmEmail = true
        await usuarioBDD.save()
        //paso 4 
        res.status(200).json({ msg: "cuenta confirmada ya puedes inciar sesion" })

    }catch(error){console.log(error);
        return res.status(500).json({msg: "❌ Error en el servidor"})
    }
}

const recuperarPassword= async(req,res)=> {
    try{
        //Paso 1
        const {email} = req.body
        //Paso 2
        if(Object.values(req.body).includes(""))return res.status(400).json({msg: "todos los campos son obligatorios"})

        const usuarioBDD = await Usuario.findOne({email})
        if(!usuarioBDD) return res.status(404).json({msg:"el usuario no se encuentra registrado"})

        //paso 3
        const token = usuarioBDD.createToken()
        usuarioBDD.token =token 
        await sendMailToRecoveryPassword(email,token)
        await usuarioBDD.save()

        //paso 4
        res.status(200).json({msg:"Revisa tu correo electronico para restableces tu cuenta"})

    }catch(error){
        res.status(500).json({msg: "❌ Error en el servidor"})
    }
}

const comprobarTokenPassword = async (req, res) => {
  try {

    const { token } = req.params

    const usuarioBDD =
      await Usuario.findOne({ token })

    if (!usuarioBDD) {
      return res.status(404).json({
        msg: "Lo sentimos, no se puede recuperar la contraseña"
      })
    }

    res.status(200).json({
      msg: "Token confirmado"
    })

  } catch (error) {

    console.log(error)

    res.status(500).json({
      msg: "❌ Error en el servidor"
    })
  }
}
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

    res.status(200).json({
      msg: "Contraseña actualizada correctamente"
    })

  } catch (error) {
    console.log("ERROR COMPLETO:", error)

    res.status(500).json({
      msg: "❌ Error en el servidor"
    })
  }
}

const login = async(req,res)=>{

    try {
        // Paso 1
        const {email,password} = req.body
        // Paso 2
        if (Object.values(req.body).includes("")) return res.status(404).json({msg:"Debes llenar todos los campos"})
        const usuarioBDD = await Usuario.findOne({email}).select("-status -__v -token -updatedAt -createdAt")
        if(!usuarioBDD) return res.status(404).json({msg:"El usuario no se encuentra registrado"})
        if(!usuarioBDD.confirmEmail) return res.status(403).json({msg:"Debes verificar tu cuenta antes de iniciar sesión"})
        const verificarPassword = await usuarioBDD.matchPassword(password)
        if(!verificarPassword) return res.status(401).json({msg:"El password no es correcto"})
        // Paso 3
        const {nombre,apellido,direccion,telefono,_id,rol} = usuarioBDD

        const token = crearTokenJWT(_id, rol || "usuario");
        // Paso 4
        res.status(200).json({
            token,
            nombre,
            apellido,
            direccion,
            telefono,
            _id,
            email:usuarioBDD.email
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
    }
}

const perfil = (req, res) => {
  try {
    // 💡 Tu middleware ya guardó al usuario autenticado aquí:
    const usuarioAutenticado = req.usuarioHeader;

    if (!usuarioAutenticado) {
      return res.status(404).json({ msg: "No se encontró el perfil del usuario" });
    }

    // Devolvemos la información completa de manera segura
    return res.status(200).json(usuarioAutenticado);

  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "❌ Error en el servidor al obtener el perfil" });
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