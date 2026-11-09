const { test } = require('node:test')
const assert = require('node:assert/strict')

const {
  buildProfileUpdate,
  validatePasswordChange,
  isValidAvatar
} = require('../src/utils/profile.js')

test('只保留昵称与头像，忽略无关字段', () => {
  const { fields, error } = buildProfileUpdate({ nickname: ' 小明 ', avatar: 'data:image/png;base64,AAA' })
  assert.equal(error, null)
  assert.deepEqual(fields, { nickname: '小明', avatar: 'data:image/png;base64,AAA' })
})

test('禁止通过资料接口修改 id / password_hash / phone', () => {
  for (const key of ['id', 'password_hash', 'passwordHash', 'phone']) {
    const { fields, error } = buildProfileUpdate({ [key]: 'x', nickname: '小明' })
    assert.deepEqual(fields, {}, `${key} 不应该被接受`)
    assert.match(error, /不允许修改字段/)
  }
})

test('昵称长度与类型校验', () => {
  assert.equal(buildProfileUpdate({ nickname: '' }).error, '昵称长度需在 1~20 个字符之间')
  assert.equal(buildProfileUpdate({ nickname: 'a'.repeat(21) }).error, '昵称长度需在 1~20 个字符之间')
  assert.equal(buildProfileUpdate({ nickname: 123 }).error, '昵称格式不正确')
  assert.equal(buildProfileUpdate({ nickname: 'a'.repeat(20) }).error, null)
})

test('头像只接受 data:image 与 http(s) 链接', () => {
  assert.equal(buildProfileUpdate({ avatar: 'javascript:alert(1)' }).error, '头像格式不正确')
  assert.equal(buildProfileUpdate({ avatar: 'file:///etc/passwd' }).error, '头像格式不正确')
  assert.equal(buildProfileUpdate({ avatar: 'https://cdn.example.com/a.png' }).error, null)
  assert.equal(buildProfileUpdate({ avatar: 'http://cdn.example.com/a.png' }).error, null)
  assert.equal(buildProfileUpdate({ avatar: 'data:image/jpeg;base64,AAA' }).error, null)
})

test('空请求体与非法类型被拒绝', () => {
  assert.equal(buildProfileUpdate({}).error, '没有需要更新的内容')
  assert.equal(buildProfileUpdate(null).error, '请求参数不合法')
  assert.equal(buildProfileUpdate([]).error, '请求参数不合法')
})

test('isValidAvatar 直接校验协议与长度', () => {
  assert.equal(isValidAvatar('data:image/png;base64,AAA'), true)
  assert.equal(isValidAvatar('https://a.b/c.png'), true)
  assert.equal(isValidAvatar('ftp://a.b/c.png'), false)
  assert.equal(isValidAvatar(''), false)
  assert.equal(isValidAvatar(null), false)
})

test('修改密码：旧密码必填、新密码 6~64 位且不能与旧密码相同', () => {
  assert.equal(validatePasswordChange({}), '请输入旧密码')
  assert.equal(validatePasswordChange({ oldPassword: '123456' }), '请输入新密码')
  assert.equal(validatePasswordChange({ oldPassword: '123456', newPassword: '123' }), '新密码长度需在 6~64 位之间')
  assert.equal(
    validatePasswordChange({ oldPassword: '123456', newPassword: '123456' }),
    '新密码不能与旧密码相同'
  )
  assert.equal(validatePasswordChange({ oldPassword: '123456', newPassword: '654321' }), null)
})
