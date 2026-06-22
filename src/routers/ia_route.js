import { Router } from "express"
import { recomendarRegalos } from "../controllers/ia_controller.js"

const router = Router()

// 🔎 POST /api/ia/recomendar
router.post("/ia/recomendar", recomendarRegalos)

export default router