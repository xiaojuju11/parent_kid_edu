const test = require('node:test')
const assert = require('node:assert')
const { buildChatMessages } = require('../src/controllers/deepseekController.js')

test('单条 message（旧版入参）转为 user 消息', () => {
  const result = buildChatMessages({ message: '  你好  ' })
  assert.deepStrictEqual(result, [{ role: 'user', content: '你好' }])
})

test('messages 数组：保留合法角色，过滤空内容与非法角色', () => {
  const result = buildChatMessages({
    messages: [
      { role: 'user', content: '第一问' },
      { role: 'ai', content: '非法角色，应被过滤' },
      { role: 'assistant', content: '第一答' },
      { role: 'user', content: '   ' },
      { role: 'user', content: '第二问' }
    ]
  })
  assert.deepStrictEqual(result, [
    { role: 'user', content: '第一问' },
    { role: 'assistant', content: '第一答' },
    { role: 'user', content: '第二问' }
  ])
})

test('超过 20 条历史时只保留最后 20 条', () => {
  const messages = Array.from({ length: 30 }, (_, i) => ({ role: 'user', content: `msg-${i}` }))
  const result = buildChatMessages({ messages })
  assert.strictEqual(result.length, 20)
  assert.strictEqual(result[0].content, 'msg-10')
  assert.strictEqual(result[19].content, 'msg-29')
})

test('单条消息超过 2000 字符时截断', () => {
  const result = buildChatMessages({ message: 'a'.repeat(3000) })
  assert.strictEqual(result[0].content.length, 2000)
})

test('message 为空白且无 messages 时返回空数组', () => {
  assert.deepStrictEqual(buildChatMessages({ message: '   ' }), [])
  assert.deepStrictEqual(buildChatMessages({}), [])
  assert.deepStrictEqual(buildChatMessages(undefined), [])
})
