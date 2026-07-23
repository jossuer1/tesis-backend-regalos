import { crearTokenJWT } from "../middlewares/JWT.js";
import {
  sendMailToRecoveryPassword,
  sendMailToRegister,
  sendMailToNuevoUsuarioAdmin,
} from "../helpers/sendMail.js";
import Usuario from "../models/Usuario.js";
import { OAuth2Client } from "google-auth-library";

// Cliente para verificar los ID Tokens que Google emite en el frontend
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// REGISTRO DE USUARIO
const registro = async (req, res) => {
  try {
    let { nombre, apellido, telefono, email, password } = req.body;

    if (Object.values(req.body).includes("")) {
      return res
        .status(400)
        .json({ msg: "Lo sentimos, debes llenar todos los campos" });
    }

    nombre = nombre?.trim();
    apellido = apellido?.trim();
    email = email?.toLowerCase().trim();

    const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
    if (!nombre || !regexNombre.test(nombre)) {
      return res
        .status(400)
        .json({ msg: "El nombre solo puede contener letras" });
    }

    if (apellido && !regexNombre.test(apellido)) {
      return res
        .status(400)
        .json({ msg: "El apellido solo puede contener letras" });
    }

    const regexTelefono = /^\d{7,15}$/;
    if (!regexTelefono.test(telefono)) {
      return res.status(400).json({
        msg: "El teléfono solo debe contener números (entre 7 y 15 dígitos)",
      });
    }

    const regexEmail = /\S+@\S+\.\S+/;
    if (!regexEmail.test(email)) {
      return res.status(400).json({ msg: "Correo electrónico inválido" });
    }

    const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!regexPassword.test(password)) {
      return res.status(400).json({
        msg: "La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número",
      });
    }

    const verificarEmailBDD = await Usuario.findOne({ email });
    if (verificarEmailBDD) {
      return res
        .status(400)
        .json({ msg: "Lo sentimos, el email ya se encuentra registrado" });
    }

    const nuevoUsuario = new Usuario({
      ...req.body,
      nombre,
      apellido,
      email,
    });

    nuevoUsuario.password = await nuevoUsuario.encryptPassword(password);
    const token = nuevoUsuario.createToken();
    await nuevoUsuario.save();

    await sendMailToRegister(email, token);

    return res
      .status(200)
      .json({ msg: "Revisa tu correo electrónico para confirmar tu cuenta" });
  } catch (error) {
    console.error("ERROR EN REGISTRO:", error);
    return res.status(500).json({ msg: "❌ Error en el servidor" });
  }
};

// CONFIRMAR EMAIL
const confirmarMail = async (req, res) => {
  try {
    const { token } = req.params;
    const usuarioBDD = await Usuario.findOne({ token });
    if (!usuarioBDD) {
      return res
        .status(404)
        .json({ msg: "Token inválido o cuenta ya confirmada" });
    }

    usuarioBDD.token = null;
    usuarioBDD.confirmEmail = true;
    await usuarioBDD.save();

    return res
      .status(200)
      .json({ msg: "Cuenta confirmada, ya puedes iniciar sesión" });
  } catch (error) {
    console.error("ERROR EN CONFIRMAR MAIL:", error);
    return res.status(500).json({ msg: "❌ Error en el servidor" });
  }
};

// RECUPERAR CONTRASEÑA
const recuperarPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (Object.values(req.body).includes("")) {
      return res.status(400).json({ msg: "Todos los campos son obligatorios" });
    }

    const emailNormalizado = email?.toLowerCase().trim();
    const usuarioBDD = await Usuario.findOne({ email: emailNormalizado });
    if (!usuarioBDD) {
      return res
        .status(404)
        .json({ msg: "El usuario no se encuentra registrado" });
    }

    const token = usuarioBDD.createToken();
    usuarioBDD.token = token;

    await sendMailToRecoveryPassword(emailNormalizado, token);
    await usuarioBDD.save();

    return res
      .status(200)
      .json({ msg: "Revisa tu correo electrónico para restablecer tu cuenta" });
  } catch (error) {
    console.error("ERROR EN RECUPERAR PASSWORD:", error);
    return res.status(500).json({ msg: "❌ Error en el servidor" });
  }
};

// COMPROBAR TOKEN DE CONTRASEÑA
const comprobarTokenPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const usuarioBDD = await Usuario.findOne({ token });
    if (!usuarioBDD) {
      return res
        .status(404)
        .json({ msg: "Lo sentimos, no se puede recuperar la contraseña" });
    }
    return res.status(200).json({ msg: "Token confirmado" });
  } catch (error) {
    console.error("ERROR EN COMPROBAR TOKEN:", error);
    return res.status(500).json({ msg: "❌ Error en el servidor" });
  }
};

// CREAR NUEVO PASSWORD
const crearNuevoPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmpassword } = req.body;

    const usuarioBDD = await Usuario.findOne({ token });
    if (!usuarioBDD) {
      return res.status(404).json({ msg: "No se puede validar la cuenta" });
    }

    if (password !== confirmpassword) {
      return res.status(400).json({ msg: "Las contraseñas no coinciden" });
    }

    usuarioBDD.token = null;
    usuarioBDD.password = await usuarioBDD.encryptPassword(password);
    await usuarioBDD.save();

    return res
      .status(200)
      .json({ msg: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("ERROR EN CREAR NUEVO PASSWORD:", error);
    return res.status(500).json({ msg: "❌ Error en el servidor" });
  }
};

// INICIO DE SESIÓN (LOGIN)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (Object.values(req.body).includes("")) {
      return res.status(400).json({ msg: "Debes llenar todos los campos" });
    }

    const emailNormalizado = email?.toLowerCase().trim();

    const usuarioBDD = await Usuario.findOne({
      email: emailNormalizado,
    }).select("-__v -token -updatedAt -createdAt");
    if (!usuarioBDD) {
      return res
        .status(404)
        .json({ msg: "El usuario no se encuentra registrado" });
    }

    if (!usuarioBDD.confirmEmail) {
      return res
        .status(403)
        .json({ msg: "Debes verificar tu cuenta antes de iniciar sesión" });
    }

    if (!usuarioBDD.status) {
      return res.status(403).json({
        msg: "Tu cuenta ha sido desactivada. Contacta al administrador",
      });
    }

    const verificarPassword = await usuarioBDD.matchPassword(password);
    if (!verificarPassword) {
      return res.status(401).json({ msg: "El password no es correcto" });
    }

    const { nombre, apellido, direccion, telefono, _id, rol } = usuarioBDD;

    const token = crearTokenJWT(_id, rol);

    return res.status(200).json({
      token,
      nombre,
      apellido,
      direccion,
      telefono,
      _id,
      email: usuarioBDD.email,
      rol, // Enviarlo al frontend ayuda a saber si renderizar vista Cliente o Admin
    });
  } catch (error) {
    console.error("ERROR EN LOGIN:", error);
    return res
      .status(500)
      .json({ msg: `❌ Error en el servidor - ${error.message}` });
  }
};

// PERFIL DEL USUARIO AUTENTICADO - 🛠️ Ajustado para usar req.usuario
const perfil = (req, res) => {
  try {
    // 🛠️ MODIFICACIÓN: Cambiado de 'req.usuarioHeader' a 'req.usuario' para acoplarse al middleware
    const usuarioAutenticado = req.usuario;

    if (!usuarioAutenticado) {
      return res
        .status(404)
        .json({ msg: "No se encontró el perfil del usuario" });
    }

    return res.status(200).json(usuarioAutenticado);
  } catch (error) {
    console.error("ERROR EN PERFIL:", error);
    return res
      .status(500)
      .json({ msg: "❌ Error en el servidor al obtener el perfil" });
  }
};

// 👑 CREAR USUARIO DESDE EL PANEL (Registrar Clientes o Empleados con envío de credenciales)
const crearUsuarioDesdeAdmin = async (req, res) => {
  try {
    const { nombre, apellido, email, direccion, telefono, rol } = req.body;

    // 1. Validación de campos obligatorios (agregado telefono: el modelo lo exige para authProvider "local")
    if (!nombre || !email || !rol || !telefono) {
      return res.status(400).json({
        msg: "Por favor, llena los campos esenciales (Nombre, Email, Teléfono y Rol)",
      });
    }

    const regexTelefono = /^\d{7,15}$/;
    if (!regexTelefono.test(telefono.trim())) {
      return res.status(400).json({
        msg: "El teléfono solo debe contener números (entre 7 y 15 dígitos)",
      });
    }

    // 2. Control estricto de roles válidos
    const rolesValidos = ["Cliente", "Admin", "Vendedor"];
    if (!rolesValidos.includes(rol)) {
      return res
        .status(400)
        .json({ msg: "El rol seleccionado no es válido en el sistema" });
    }

    // 3. Verificar duplicados por correo
    const existeUsuario = await Usuario.findOne({
      email: email.trim().toLowerCase(),
    });
    if (existeUsuario) {
      return res
        .status(400)
        .json({ msg: "El email ya se encuentra registrado" });
    }

    // 4. Generar contraseña temporal
    const semillaPassword = Math.random()
      .toString(36)
      .toUpperCase()
      .slice(2, 5);
    const passwordPlano = "MAGIC" + semillaPassword;

    // 5. Crear instancia con los nombres de campo CORRECTOS del schema
    const nuevoUsuario = new Usuario({
      nombre: nombre.trim(),
      apellido: apellido?.trim(),
      email: email.trim().toLowerCase(),
      direccion: direccion?.trim(),
      telefono: telefono.trim(),
      rol, // 🛠️ antes: "role" (no existía en el schema)
      confirmEmail: true, // 🛠️ antes: "confirmado" (no existía en el schema)
      token: null,
    });

    nuevoUsuario.password = await nuevoUsuario.encryptPassword(passwordPlano);
    await nuevoUsuario.save();

    await sendMailToNuevoUsuarioAdmin(nuevoUsuario.email, passwordPlano, rol);

    return res.status(201).json({
      msg: `Registro exitoso del ${rol} y credenciales enviadas a su correo.`,
    });
  } catch (error) {
    console.error("ERROR CREAR USUARIO ADMIN:", error);
    return res
      .status(500)
      .json({ msg: `❌ Error en el servidor - ${error.message}` });
  }
};

// INICIO/REGISTRO DE SESIÓN CON GOOGLE
const loginGoogle = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res
        .status(400)
        .json({ msg: "Falta el token de Google (credential)" });
    }

    // 1. Verificar el token directamente con los servidores de Google.
    //    Esto confirma que el token es auténtico y no fue falsificado.
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (error) {
      console.error("ERROR VERIFICANDO TOKEN DE GOOGLE:", error);
      return res
        .status(401)
        .json({ msg: "Token de Google inválido o expirado" });
    }

    const {
      sub: googleId,
      email,
      given_name,
      family_name,
      email_verified,
    } = payload;

    if (!email_verified) {
      return res
        .status(401)
        .json({ msg: "El correo de Google no está verificado" });
    }

    const emailNormalizado = email.toLowerCase().trim();

    // 2. Buscar si ya existe un usuario con ese googleId o con ese email
    let usuarioBDD = await Usuario.findOne({
      $or: [{ googleId }, { email: emailNormalizado }],
    });

    if (usuarioBDD) {
      // Si existía por email pero se registró antes de forma local, lo vinculamos con Google
      if (!usuarioBDD.googleId) {
        usuarioBDD.googleId = googleId;
        usuarioBDD.authProvider =
          usuarioBDD.authProvider === "local"
            ? usuarioBDD.authProvider
            : "google";
        usuarioBDD.confirmEmail = true;
        await usuarioBDD.save();
      }
    } else {
      // 3. No existe: lo creamos automáticamente con los datos de Google
      usuarioBDD = new Usuario({
        nombre: given_name || "Usuario",
        apellido: family_name || null,
        email: emailNormalizado,
        googleId,
        authProvider: "google",
        confirmEmail: true, // Google ya verificó el correo por nosotros
      });
      await usuarioBDD.save();
    }

    const { nombre, apellido, direccion, telefono, _id, rol } = usuarioBDD;
    const token = crearTokenJWT(_id, rol);

    return res.status(200).json({
      token,
      nombre,
      apellido,
      direccion,
      telefono,
      _id,
      email: usuarioBDD.email,
      rol,
    });
  } catch (error) {
    console.error("ERROR EN LOGIN GOOGLE:", error);
    return res
      .status(500)
      .json({ msg: `❌ Error en el servidor - ${error.message}` });
  }
};

const actualizarPerfil = async (req, res) => {
  try {
    const id = req.usuario._id;
    const { nombre, apellido, telefono, direccion, email } = req.body;

    // 1. Buscar al usuario en la base de datos
    const usuarioBDD = await Usuario.findById(id);
    if (!usuarioBDD) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // 2. Validar campos obligatorios mínimos
    if (!nombre || !email) {
      return res
        .status(400)
        .json({ msg: "El nombre y el correo electrónico son obligatorios" });
    }

    // 3. Validar formato de Nombre y Apellido (Letras únicamente)
    const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
    if (!regexNombre.test(nombre.trim())) {
      return res
        .status(400)
        .json({ msg: "El nombre solo puede contener letras" });
    }
    if (apellido && !regexNombre.test(apellido.trim())) {
      return res
        .status(400)
        .json({ msg: "El apellido solo puede contener letras" });
    }

    // 4. Validar formato del Teléfono (Solo números, de 7 a 15 dígitos)
    if (telefono) {
      const regexTelefono = /^\d{7,15}$/;
      if (!regexTelefono.test(telefono.trim())) {
        return res.status(400).json({
          msg: "El teléfono solo debe contener números (entre 7 y 15 dígitos)",
        });
      }
    }

    // 5. Validar formato del Email
    const emailNormalizado = email.toLowerCase().trim();
    const regexEmail = /\S+@\S+\.\S+/;
    if (!regexEmail.test(emailNormalizado)) {
      return res.status(400).json({ msg: "Correo electrónico inválido" });
    }

    // 6. Verificar si el nuevo email ya está en uso por OTRO usuario
    if (usuarioBDD.email !== emailNormalizado) {
      const existeEmail = await Usuario.findOne({ email: emailNormalizado });
      if (existeEmail) {
        return res.status(400).json({
          msg: "El correo electrónico ya está registrado por otro usuario",
        });
      }
      usuarioBDD.email = emailNormalizado;
    }

    // 7. Asignar los nuevos valores
    usuarioBDD.nombre = nombre.trim();
    usuarioBDD.apellido = apellido ? apellido.trim() : null;
    usuarioBDD.telefono = telefono ? telefono.trim() : null;
    usuarioBDD.direccion = direccion ? direccion.trim() : null;

    // 8. Guardar cambios
    await usuarioBDD.save();

    return res.status(200).json({
      msg: "Perfil actualizado correctamente",
      usuario: {
        _id: usuarioBDD._id,
        nombre: usuarioBDD.nombre,
        apellido: usuarioBDD.apellido,
        email: usuarioBDD.email,
        telefono: usuarioBDD.telefono,
        direccion: usuarioBDD.direccion,
        rol: usuarioBDD.rol,
      },
    });
  } catch (error) {
    console.error("ERROR EN ACTUALIZAR PERFIL:", error);
    return res
      .status(500)
      .json({ msg: `❌ Error en el servidor - ${error.message}` });
  }
};

export {
  registro,
  confirmarMail,
  recuperarPassword,
  comprobarTokenPassword,
  crearNuevoPassword,
  login,
  loginGoogle,
  perfil,
  actualizarPerfil,
  crearUsuarioDesdeAdmin,
};
