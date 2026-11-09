const { verifyTokenString } = require('../config/auth.js')


function verifyToken() {
    return async(ctx, next) => {
        const token = ctx.request.header.authorization
        if (!token) {
            ctx.status = 416
            ctx.body = {
                message: '请重新登录',
                code: 0
            }
            return
        }

        //解析token
        try {
            const decoded = verifyTokenString(token)
            if (!decoded || !decoded.id) {
                // token 结构不合法（缺少 id）时不能放行，也不能什么都不返回
                ctx.status = 416
                ctx.body = {
                    message: 'token失效',
                    code: 0
                }
                return
            }
            ctx.userId = decoded.id
            await next()
        } catch (error) {
            ctx.status = 416
            ctx.body = {
                message: 'token失效',
                code: 0
            }
        }
    }
}

module.exports = {
    verifyToken
}
