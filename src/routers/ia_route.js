import { Router } from "express"
import { recomendarRegalos } from "../controllers/ia_controller.js"

const router = Router()

// 🔎 POST /api/ia/recomendar
router.post("/recomendar", recomendarRegalos)

export default router