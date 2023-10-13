import { oak } from './deps.ts'
import { log } from './config/config.ts'
import router from "./routers/auth.ts"

const app = new oak.Application()

app.addEventListener('listen', () => log('listen', 'Listening on 2101'))

app.use(router.routes())
app.use(router.allowedMethods())

app.use(ctx => {
    ctx.response.status = oak.Status.NotFound
    ctx.response.body = { msg: 'Not found' }
})

await app.listen({ port: 2101 })