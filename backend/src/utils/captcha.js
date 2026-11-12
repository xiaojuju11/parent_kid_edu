const svgCaptcha = require('svg-captcha')

// 存储验证码，用于后续的检验
const captchaStore = new Map()   // Redis 缓存才是最好的方案

// 验证码的有效期 5 分钟
const CAPTCHA_EXPIRE_TIME = 5 * 60 * 1000

// 同一个验证码最多允许猜 5 次，避免 4 位字符在有效期内被暴力枚举
const MAX_VERIFY_ATTEMPTS = 5

// 定时器可能延迟触发（甚至随进程退出丢失），生成新验证码时顺手清理过期条目
function sweepExpired(now) {
  for (const [id, stored] of captchaStore) {
    if (now >= stored.expireAt) {
      captchaStore.delete(id)
    }
  }
}

function generateCaptcha() {
  sweepExpired(Date.now())

  const captcha = svgCaptcha.create({
    size: 4,
    ignoreChars: '0o1il',
    noise: 2,
    color: true,
    background: '#f0f0f0'
  })

  // 生成唯一 ID
  const captchaId = `captcha_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  // 存储
  const expireAt = Date.now() + CAPTCHA_EXPIRE_TIME
  captchaStore.set(captchaId, {
    text: captcha.text.toLowerCase(),
    expireAt,
    attempts: 0
  })

  // 过期清理：unref 后定时器不会拖住进程退出，真正的过期判定在 verifyCaptcha 里做
  const timer = setTimeout(() => {
    const stored = captchaStore.get(captchaId)
    if (stored && Date.now() >= stored.expireAt) {
      captchaStore.delete(captchaId)
    }
  }, CAPTCHA_EXPIRE_TIME)
  if (typeof timer.unref === 'function') {
    timer.unref()
  }

  return {
    id: captchaId,
    svg: captcha.data
  }
}

function verifyCaptcha(captchaId, captchaCode) {
  // JSON 请求体里可能是数字/对象/数组，直接调字符串方法会抛 TypeError 变成 500
  if (typeof captchaId !== 'string' || captchaId.length === 0 ||
      typeof captchaCode !== 'string') {
    return { valid: false, message: '请输入验证码' }
  }

  const stored = captchaStore.get(captchaId)
  if (!stored) {
    return {valid: false, message: '验证码已过期'}
  }

  // 不依赖定时器是否按时触发：以 expireAt 为准，超时立即作废
  if (Date.now() >= stored.expireAt) {
    captchaStore.delete(captchaId)
    return {valid: false, message: '验证码已过期'}
  }

  const code = captchaCode.trim().toLowerCase()
  if (code.length === 0) {
    return { valid: false, message: '请输入验证码' }
  }

  if (code !== stored.text) {
    stored.attempts += 1
    if (stored.attempts >= MAX_VERIFY_ATTEMPTS) {
      captchaStore.delete(captchaId)
      return {valid: false, message: '验证码错误次数过多，请重新获取'}
    }
    return {valid: false, message: '验证码错误'}
  }

  captchaStore.delete(captchaId)
  return {valid: true}

}

module.exports = {
  generateCaptcha,
  verifyCaptcha,
  CAPTCHA_EXPIRE_TIME,
  MAX_VERIFY_ATTEMPTS
}