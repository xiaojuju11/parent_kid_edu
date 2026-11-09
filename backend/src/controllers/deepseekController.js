const OpenAI = require('openai')
const dotenv = require('dotenv')

dotenv.config({
  path: ['.env.local', '.env']
})

// 惰性初始化：API key 未配置时不能在模块加载阶段把整个服务拖崩，
// 否则本地开发没配 key 服务直接起不来，只能等到真正调用时再报清晰的错
let openai = null
function getClient() {
  if (!openai) {
    const apiKey = process.env.VITE_DEEPSEEK_API_KEY
    if (!apiKey) {
      throw new Error('未配置 DeepSeek API key（VITE_DEEPSEEK_API_KEY）')
    }
    openai = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey,
      timeout: 60000, // 大模型回复较慢，60 秒超时，避免请求长时间挂起
      maxRetries: 1,  // 网络抖动时自动重试一次
    });
  }
  return openai
}

// 多轮对话的安全边界：最多携带的历史条数 / 单条内容长度，
// 防止恶意超长请求把 token 用量打爆
const MAX_HISTORY_MESSAGES = 20
const MAX_CONTENT_LENGTH = 2000

const SYSTEM_PROMPT = '你是一个专业的教育助手，回答要简洁、适合家长和儿童阅读'

/**
 * 把前端传入的对话历史整理成 OpenAI messages 数组。
 * 兼容两种入参：
 *  - messages: [{ role: 'user'|'assistant'|'system', content: '...' }, ...] 多轮上下文
 *  - message:  '...' 单条消息（旧版前端 / 简单调用）
 */
function buildChatMessages(body) {
  const { message, messages } = body || {}

  let history = []
  if (Array.isArray(messages) && messages.length > 0) {
    for (const item of messages.slice(-MAX_HISTORY_MESSAGES)) {
      const role = item && item.role
      const content = typeof item?.content === 'string' ? item.content.trim() : ''
      if (!content) continue
      if (!['user', 'assistant', 'system'].includes(role)) continue
      history.push({ role, content: content.slice(0, MAX_CONTENT_LENGTH) })
    }
  } else if (typeof message === 'string' && message.trim()) {
    history.push({ role: 'user', content: message.trim().slice(0, MAX_CONTENT_LENGTH) })
  }

  return history
}

async function deepseekChat(ctx) {
  const history = buildChatMessages(ctx.request.body)
  if (history.length === 0) {
    ctx.status = 400
    ctx.body = { message: '消息不能为空', code: 0 }
    return
  }

  try {
    const completion = await getClient().chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history,
      ],
      model: 'deepseek-chat',
    });
    ctx.body = {
      code: 1,
      message: completion.choices[0].message.content
    }
  } catch (error) {
    console.error('DeepSeek chat error:', error.message)
    ctx.status = 500
    ctx.body = {
      message: '请求失败',
      code: 0,
      error: error.message
    }
  }
}

module.exports = {
  deepseekChat,
  buildChatMessages
}
