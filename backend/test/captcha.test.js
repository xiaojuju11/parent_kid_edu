const { test, after, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const Module = require('node:module')

// 用轻量假生成器替换图形依赖，让校验逻辑在没有安装 svg-captcha 时也能单测
const originalLoad = Module._load
let captchaText = 'aB3d'
Module._load = function (request, parent, isMain) {
  if (request === 'svg-captcha') {
    return { create: () => ({ text: captchaText, data: '<svg />' }) }
  }
  return originalLoad.call(this, request, parent, isMain)
}
const {
  generateCaptcha,
  verifyCaptcha,
  CAPTCHA_EXPIRE_TIME,
  MAX_VERIFY_ATTEMPTS
} = require('../src/utils/captcha.js')
Module._load = originalLoad

// 冻结时钟，才能稳定验证 5 分钟有效期（不依赖真实定时器触发）
const realNow = Date.now
const baseClock = realNow()
let clock = baseClock
Date.now = () => clock
beforeEach(() => { clock = baseClock })
after(() => { Date.now = realNow })

function issue(text = 'aB3d') {
  captchaText = text
  return generateCaptcha()
}

test('生成结果保持 id / svg 结构', () => {
  const captcha = issue()
  assert.match(captcha.id, /^captcha_/)
  assert.equal(captcha.svg, '<svg />')
})

test('校验忽略大小写与首尾空格，成功后立即作废', () => {
  const { id } = issue('aB3d')
  assert.deepEqual(verifyCaptcha(id, '  AB3D  '), { valid: true })
  assert.equal(verifyCaptcha(id, 'aB3d').valid, false)
  assert.equal(verifyCaptcha(id, 'aB3d').message, '验证码已过期')
})

test('非字符串 / 空入参返回明确失败，不抛 TypeError', () => {
  const { id } = issue()
  for (const code of [undefined, null, 123, {}, [], true, '']) {
    assert.doesNotThrow(() => verifyCaptcha(id, code))
    assert.equal(verifyCaptcha(id, code).valid, false, `code=${String(code)}`)
  }
  for (const badId of [undefined, null, 123, {}, '', '   ']) {
    assert.doesNotThrow(() => verifyCaptcha(badId, 'aB3d'))
    assert.equal(verifyCaptcha(badId, 'aB3d').valid, false)
  }
  // 非法入参不应消耗掉验证码
  assert.equal(verifyCaptcha(id, 'aB3d').valid, true)
})

test('纯空白验证码不会算作猜错，也不影响后续正确输入', () => {
  const { id } = issue()
  assert.equal(verifyCaptcha(id, '   ').message, '请输入验证码')
  assert.equal(verifyCaptcha(id, 'ab3d').valid, true)
})

test('有效期内可正常使用，到期后即使定时器未触发也拒绝', () => {
  const before = issue()
  clock += CAPTCHA_EXPIRE_TIME - 1
  assert.equal(verifyCaptcha(before.id, 'aB3d').valid, true)

  const expired = issue()
  clock += CAPTCHA_EXPIRE_TIME + 1
  assert.equal(verifyCaptcha(expired.id, 'aB3d').message, '验证码已过期')
  // 过期条目被清掉，重新校验仍是过期而不是误判为错误
  assert.equal(verifyCaptcha(expired.id, 'aB3d').message, '验证码已过期')
  clock -= CAPTCHA_EXPIRE_TIME + 1
})

test('错误次数达到上限后验证码作废', () => {
  const { id } = issue()
  for (let i = 0; i < MAX_VERIFY_ATTEMPTS - 1; i += 1) {
    assert.equal(verifyCaptcha(id, 'wrong').message, '验证码错误')
  }
  assert.equal(verifyCaptcha(id, 'wrong').message, '验证码错误次数过多，请重新获取')
  assert.equal(verifyCaptcha(id, 'aB3d').message, '验证码已过期')
})

test('不同验证码之间互不干扰', () => {
  const first = issue('aaaa')
  const second = issue('bbbb')
  assert.equal(verifyCaptcha(first.id, 'bbbb').valid, false)
  assert.equal(verifyCaptcha(first.id, 'aaaa').valid, true)
  assert.equal(verifyCaptcha(first.id, 'aaaa').valid, false)
  assert.equal(verifyCaptcha(second.id, 'BBBB').valid, true)
})

test('不存在的 / 已过期的 id 统一返回过期', () => {
  assert.equal(verifyCaptcha('captcha_missing', 'aB3d').message, '验证码已过期')
})
