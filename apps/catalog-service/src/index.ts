import 'dotenv/config'
import { env } from './config/env'
import { composeApp } from './main/composition'
import { buildApp } from './infrastructure/http/app'

const app = buildApp(composeApp())
app.listen(env.PORT, () => console.log(`catalog-service running on port ${env.PORT}`))
