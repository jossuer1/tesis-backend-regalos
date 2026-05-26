import swaggerJSDoc from "swagger-jsdoc"
import swaggerUi from "swagger-ui-express"

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Regalos Mágicos API",
      version: "1.0.0",
      description: "Documentación del backend"
    },
    servers: [
      {
        url: process.env.URL_BACKEND || "http://localhost:8000"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    }
  },
  apis: ["./src/routers/*.js"]
}

const swaggerSpec = swaggerJSDoc(options)

export const swaggerDocs = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))
}