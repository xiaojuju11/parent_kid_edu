import '../styles/aiChat.less'
import { useState, useRef, useEffect } from 'react'
import { DotLoading } from 'antd-mobile'
import axios from '../http'
import { useNavigate } from 'react-router-dom'

class HandleMessages{
  constructor(){
    this.messages = []
    this.nextId = 1
  }
  createMessage = (id, role, content, timestamp) => {
    return { id, role, content, timestamp }
  }
  addMessage = (role, content) => {
    // 用自增 id，避免同一毫秒内连发两条消息 key 冲突
    const message = this.createMessage(this.nextId++, role, content, new Date().toLocaleString())
    this.messages.push(message)
    return message
  }
  getMessages = () => this.messages
  // 组装发给后端的多轮上下文（不含欢迎语）：
  // 前端叫 'ai'，OpenAI 协议里叫 'assistant'，这里做一次角色名转换
  getChatHistory = () => {
    return this.messages.map(({ role, content }) => ({
      role: role === 'ai' ? 'assistant' : role,
      content
    }))
  }
}

export default function AiChat() {
  const [flag, setFlag] = useState(0)
  const msg = useRef({})
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    msg.current = new HandleMessages()
    // msg.current.initMessages() 
    setFlag(f => f + 1)
  }, [])

  const handleSendMessage = async() => {
    const content = textareaRef.current.value.trim()
    // 发送中或输入为空时直接忽略，防止重复提交
    if (!content || isLoading) return

    // 显示用户的输入
    msg.current.addMessage('user', content)
    setFlag(flag + 1)
    textareaRef.current.value = ''

    // 发请求
    setIsLoading(true)
    try {
      // AI 回复常超过全局默认的 5 秒超时，这里单独放宽到 60 秒；
      // 携带完整聊天历史，让 AI 记住上下文，而不是每次都当新对话处理
      const res = await axios.post('/api/deepseek/chat', {
        messages: msg.current.getChatHistory()
      }, { timeout: 60000 })
      msg.current.addMessage('ai', res.data.message)
    } catch {
      // 请求拦截器已经弹了 Toast，这里再把对话流补一条提示，
      // 避免失败后界面静默无反馈、loading 永远不消失
      msg.current.addMessage('ai', '抱歉，这条消息没能收到回复，请稍后重试')
    } finally {
      setIsLoading(false)
    }
    setFlag(f => f + 1)
  }

  return (
    <div className='ai-dialogue-root'>
      <header className='ai-dialogue-header'>
        <div className="ai-dialogue-header__back" onClick={() => navigate(-1)}>
          <i className="iconfont icon-fanhui"></i>
        </div>
        <h1>智能对话</h1>
        <div className="ai-dialogue-header__more">
          <i className="iconfont icon-more"></i>
        </div>
      </header>

      <div className='ai-dialogue-main'>
        <div className="ai-dialogue-messages">
          {/* 欢迎 */}
          {
            msg.current.getMessages?.().length === 0 && (
              <div className="ai-dialogue-welcome">
                <i className="iconfont icon-robot-2-fill ai-dialogue-avatar"></i>
                <p>你好，我是智能对话助手，有什么我可以帮助你的吗？</p>
              </div>
            )
          }

          {/* 消息列表 */}
          {
            msg.current.getMessages?.().map(message => (
              <div className={`ai-dialogue-message ${message.role === 'user' ? 'user-message' : 'ai-message'}`} key={message.id}>
                <div className="ai-dialogue-message__content">
                  <div className="ai-dialogue-message__text">{message.content}</div>
                  <div className="ai-dialogue-message__time">{message.timestamp}</div>
                </div>
              </div>
            ))
          }

          {/* ai回复加载中 */}
          {
            isLoading && (
              <div className="ai-dialogue-message ai-message">
                <div className="ai-dialogue-message__content">
                  <span style={{ fontSize: 20 }}>
                    <DotLoading />
                  </span>
                </div>
              </div>
            )
          }

        </div>
      </div>

      <footer className='ai-dialogue-footer'>
        <div className="ai-dialogue-input-container">
          <textarea 
            className='ai-dialogue-input' 
            placeholder='请输入消息...'
            rows={1}
            ref={textareaRef}
          ></textarea>

          <div className="ai-dialogue-actions">
            <button className={`ai-dialogue-voice-btn ${isRecording ? 'recording' : ''}`} onClick={() => setIsRecording(!isRecording)}>
              <i className={`iconfont ${isRecording ? 'icon-jieshu' : 'icon-maikefeng'}`}></i>
            </button>

            <button className="ai-dialogue-send-btn" onClick={handleSendMessage}>
              <i className="iconfont icon-fasong"></i>
            </button>
            
          </div>

        </div>
        {
          isRecording && (
            <div className="ai-dialogue-recording-indicator">
              <p>正在录音...</p>
            </div>
          )
        }
      </footer>
    </div>
  )
}