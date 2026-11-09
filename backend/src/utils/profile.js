// 用户资料更新的纯函数校验层
// 目的：把「允许改哪些字段 / 每个字段长什么样」从 controller 里抽出来，
// 既方便单测，也能避免直接信任前端传来的 body（此前 updateUser 会把
// id、password_hash 一起放进 UPDATE 语句，属于越权修改）。

const PROFILE_FIELDS = ['nickname', 'avatar']

// 明确禁止通过资料更新接口修改的字段（id 可被改成别人的行，password_hash 可绕过 bcrypt）
const FORBIDDEN_FIELDS = ['id', 'password_hash', 'passwordHash', 'phone', 'create_time']

const MAX_NICKNAME_LENGTH = 20
const MIN_NICKNAME_LENGTH = 1
const MIN_PASSWORD_LENGTH = 6
const MAX_PASSWORD_LENGTH = 64
const MAX_AVATAR_LENGTH = 12 * 1024 * 1024 // 12MB 字符串上限，前端另有 1MB 提示

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * 校验头像：只接受 data:image/... 的 base64 或 http(s) 链接。
 * 其它协议（javascript:、file: 等）一律拒绝，避免把危险 URL 写进数据库再渲染。
 */
function isValidAvatar(value) {
  if (typeof value !== 'string') return false
  if (value.length === 0 || value.length > MAX_AVATAR_LENGTH) return false
  return (
    value.startsWith('data:image/') ||
    value.startsWith('https://') ||
    value.startsWith('http://')
  )
}

/**
 * 把请求体转换成只包含允许字段的更新对象。
 * @param {unknown} body 请求体
 * @returns {{ fields: Object, error: string|null }}
 */
function buildProfileUpdate(body) {
  if (!isPlainObject(body)) {
    return { fields: {}, error: '请求参数不合法' }
  }

  const forbidden = FORBIDDEN_FIELDS.filter((key) => Object.hasOwn(body, key))
  if (forbidden.length > 0) {
    return { fields: {}, error: `不允许修改字段：${forbidden.join('、')}` }
  }

  const fields = {}

  if (Object.hasOwn(body, 'nickname')) {
    if (typeof body.nickname !== 'string') {
      return { fields: {}, error: '昵称格式不正确' }
    }
    const nickname = body.nickname.trim()
    if (nickname.length < MIN_NICKNAME_LENGTH || nickname.length > MAX_NICKNAME_LENGTH) {
      return {
        fields: {},
        error: `昵称长度需在 ${MIN_NICKNAME_LENGTH}~${MAX_NICKNAME_LENGTH} 个字符之间`
      }
    }
    fields.nickname = nickname
  }

  if (Object.hasOwn(body, 'avatar')) {
    if (!isValidAvatar(body.avatar)) {
      return { fields: {}, error: '头像格式不正确' }
    }
    fields.avatar = body.avatar
  }

  const keys = Object.keys(fields)
  if (keys.length === 0) {
    return { fields: {}, error: '没有需要更新的内容' }
  }
  if (keys.some((key) => !PROFILE_FIELDS.includes(key))) {
    return { fields: {}, error: '参数错误' }
  }

  return { fields, error: null }
}

/**
 * 校验修改密码的入参。
 * @returns {string|null} 错误信息，null 表示通过
 */
function validatePasswordChange({ oldPassword, newPassword } = {}) {
  if (typeof oldPassword !== 'string' || oldPassword.length === 0) {
    return '请输入旧密码'
  }
  if (typeof newPassword !== 'string' || newPassword.length === 0) {
    return '请输入新密码'
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > MAX_PASSWORD_LENGTH) {
    return `新密码长度需在 ${MIN_PASSWORD_LENGTH}~${MAX_PASSWORD_LENGTH} 位之间`
  }
  if (newPassword === oldPassword) {
    return '新密码不能与旧密码相同'
  }
  return null
}

module.exports = {
  PROFILE_FIELDS,
  FORBIDDEN_FIELDS,
  MAX_NICKNAME_LENGTH,
  MAX_AVATAR_LENGTH,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  buildProfileUpdate,
  validatePasswordChange,
  isValidAvatar
}
