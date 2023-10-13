import { oak } from '../deps.ts'
import { login, iam, logout, register } from "../svc/auth.ts"
import { error500 } from '../config/config.ts'

const router = new oak.Router()

router.get('/iam', ctx => iam(ctx).catch(e => error500(ctx, e)))
router.get('/logout', ctx => logout(ctx).catch(e => error500(ctx, e)))
router.post('/register', ctx => register(ctx).catch(e => error500(ctx, e)))
router.post('/login', ctx => login(ctx).catch(e => error500(ctx, e)))

export default router