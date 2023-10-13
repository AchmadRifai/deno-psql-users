import { jwt, Mutex, oak, Pool, Transaction } from '../deps.ts'

export const pool = new Pool({
    hostname: 'localhost',
    database: 'users',
    port: 5432,
    password: 'akucintakamu',
    user: 'postgres'
}, 10, true)

export const dbTrans = async (transName: string, exec = async (_: Transaction) => { }) => {
    const mu = new Mutex()
    await mu.acquire()
    const cli = await pool.connect()
    const trans = cli.createTransaction(transName)
    try {
        await trans.begin()
        await exec(trans)
        await trans.commit()
    } catch (e) {
        await trans.rollback()
        throw e
    } finally {
        cli.release()
        mu.release()
    }
}

export const error500 = (ctx: oak.Context, e: Error) => {
    log(ctx.request.url.toString(), e)
    ctx.response.status = oak.Status.InternalServerError
    ctx.response.body = { msg: e.message }
}

export const refreshToken = (ctx: oak.Context) => {
    let token = ctx.request.headers.get('Authorization')
    if (!token || !token.startsWith('Bearer ')) throw new Error('Token not found')
    token = token.replace('Bearer ', '')
    const result = decrypt(token)
    ctx.response.headers.append('Authorization', encrypt(result.sub, result.access))
    return result
}

export const log = (funcName: string, data: any) => console.log('[', new Date().toString(), funcName, ']', data)

const secret = Deno.env.get('SECRET') || 'everythinkwhatyouwant'

export const encrypt = (subject: string, access: string) => jwt.sign({ access }, secret, { subject, algorithm: 'HS512', expiresIn: Date.now() + (1000 * 8 * 60) })

export const decrypt = (token: string) => jwt.verify(token, secret)

