import 'dotenv/config'
import { env } from './config/env'
import { composeApp, composeWriteGuards } from './main/composition'
import { buildApp } from './infrastructure/http/app'

const app = buildApp(composeApp(), composeWriteGuards())
app.listen(env.PORT, () => console.log(`catalog-service running on port ${env.PORT}`))
