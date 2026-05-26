import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import usuarioRoutesDoc from "../docs/usuario.json" with { type: "json" };

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Usuarios - Regalos Mágicos ✨",
      version: "1.0.0",
      description: "Documentación oficial del módulo de usuarios"
    },
    servers: [
      {
        url: "/api",
        description: "Servidor Actual (Dinámico)"
      },
      {
        url: "http://localhost:8000/api",
        description: "Servidor Local de Desarrollo"
      }
    ],
    paths: usuarioRoutesDoc.paths
  },
  apis: [], 
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export const swaggerDocs = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};