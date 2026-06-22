import { Schema, model } from "mongoose"

const pedidoSchema = new Schema(
  {
    usuario: { 
      type: Schema.Types.ObjectId, 
      ref: "Usuario", 
      required: true 
    },
    productos: [
      {
        producto: { 
          type: Schema.Types.ObjectId, 
          ref: "Producto", 
          required: true 
        },
        cantidad: { 
          type: Number, 
          required: true, 
          min: [1, "La cantidad mínima es 1"] 
        },
        precioAlComprar: { 
          type: Number, 
          required: true 
        }
      }
    ],
    montoTotal: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    estado: { 
      type: String, 
      enum: ["Pendiente", "Pagado", "Enviado", "Entregado", "Cancelado"], 
      default: "Pendiente" 
    },
    direccionEnvio: { 
      type: String, 
      required: true,
      maxlength: 150 
    }
  },
  { 
    timestamps: true 
  }
)

export default model("Pedido", pedidoSchema)