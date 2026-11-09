// JWT 相关的统一配置
// 之前 login 与 verifyToken 各自写死 '666'，既重复又无法通过环境变量替换。
// 现在集中到一处：优先读 process.env.JWT_SECRET，未配置时回退到开发默认值。
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || '666'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

function verifyTokenString(token) {
  return jwt.verify(token, JWT_SECRET)
}

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  signToken,
  verifyTokenString
}
