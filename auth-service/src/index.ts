import 'dotenv/config'
import express from 'express'

import { buildHealthRoutes } from './infrastructure/http/routes/healthRoutes'

const app = express()
const PORT = process.env.PORT ?? 4001

app.use(express.json())
app.use(buildHealthRoutes())

app.listen(PORT, () => {
  console.log(`auth-service running on port ${PORT}`)
})
