const axios = require('axios')
const dotenv = require('dotenv')

dotenv.config({ path: ['.env.local', '.env'] })

async function recognition(ctx) {
  const { img } = ctx.request.body
  // 向工作流发请求
  // 根据工作流示例，直接传递 image 参数
  const params = { image: img }

  try {
    // 确保 API key 正确获取，尝试多种可能的环境变量名称
    const apiKey = process.env.COZE_IMAGE_TO_TEXT_AND_VOICE || process.env.VITE_COZE_IMAGE_TO_TEXT_AND_VOICE || ''
    
    if (!apiKey) {
      throw new Error('API key not found')
    }

    // img 是 base64 大字符串，只记长度，别把整张图打进日志
    console.log('Recognition request, image size:', img ? String(img).length : 0)

    const res = await axios({
      method: 'post',
      url: 'https://r85vf8qf77.coze.site/run',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: params,
      timeout: 60000 // 识图工作流耗时较长，给到 60 秒
    })

    // 响应里可能带 base64 语音/文本，同样只记结构不记全文
    console.log('Coze API response keys:', Object.keys(res.data || {}))
    
    ctx.body = {
      code: 1,
      data: res.data
    }

  } catch (error) {
    console.error('Coze API error:', error.message)
    if (error.response) {
      console.error('Response data:', error.response.data)
      console.error('Response status:', error.response.status)
    }
    ctx.status = 500
    ctx.body = {
      code: 0,
      message: error.message
    }
  }
}

module.exports = {
  recognition
}