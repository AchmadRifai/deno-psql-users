import { oak } from "../deps.ts"
import { pool, refreshToken, encrypt, dbTrans } from '../config/config.ts'

export const iam = async (ctx: oak.Context) => {
    const jwt = refreshToken(ctx)
    const cli = await pool.connect()
    try {
        const ids = await cli.queryArray('SELECT id,name,username FROM users WHERE id=$id', { id: jwt.sub })
        if (0 == ids.rowCount) throw new Error('User not found')
        const id = ids.rows[0]
        ctx.response.body = { id: id[0], name: id[1], username: id[2] }
    } finally {
        cli.release()
    }
}

export const logout = async (ctx: oak.Context) => {
    refreshToken(ctx)
    ctx.response.headers.delete('Authorization')
    ctx.response.body = { msg: 'Success' }
}

export const register = async (ctx: oak.Context) => {
    if (!ctx.request.hasBody) throw new Error("Body is required")
    const { username, password, name } = await ctx.request.body().value
    if (!username || !password || !name) throw new Error("username, name and password is required")
    await dbTrans('register', async t => {
        let ids = await t.queryArray('SELECT id FROM users WHERE username=$username', { username })
        if (0 != ids.rowCount) throw new Error('User found')
        ids = await t.queryArray('INSERT INTO users(username,sandi,name) VALUES($username,$password,$name) RETURNING id', { username, password, name })
        if (0 == ids.rowCount) throw new Error('User not saved')
        const id = ids.rows[0]
        ctx.response.headers.append('Authorization', encrypt('' + id[0], 'global'))
        ctx.response.body = { msg: 'Success' }
    })
}

export const login = async (ctx: oak.Context) => {
    if (!ctx.request.hasBody) throw new Error("Body is required")
    const { username, password } = await ctx.request.body().value
    if (!username || !password) throw new Error("username and password is required")
    const cli = await pool.connect()
    try {
        const ids = await cli.queryArray('SELECT id FROM users WHERE username=$username AND sandi=$password', { username, password })
        if (0 == ids.rowCount) throw new Error('User not found')
        const id = ids.rows[0]
        ctx.response.headers.append('Authorization', encrypt('' + id[0], 'global'))
        ctx.response.body = { msg: 'Success' }
    } finally {
        cli.release()
    }
}