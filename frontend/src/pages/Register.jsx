import React, { useEffect, useState } from 'react'
import '../styles/register.less'
import axios from '../http'
import { Toast } from 'antd-mobile'


export default function Register({ changeActiveTab }) {
  const [nickname, setNickname] = useState('')
  const [phone, setPhone] = useState('')
  const [captchaCode, setCaptchaCode] = useState('')
  const [password, setPassword] = useState('')
  const [captchaId, setCaptchaId] = useState('')
  const [captchaSvg, setCaptchaSvg] = useState('')
  const [loading, setLoading] = useState(false)

  // 拉取验证码：点击验证码图片刷新、注册失败后自动换一张，共用这里
  const refreshCaptcha = () => {
    axios.get('/api/auth/captcha').then((res) => {
      setCaptchaId(res.data.captchaId)
      setCaptchaSvg(res.data.captchaSvg)
    }).catch(() => {
      // 拉取失败：响应拦截器已提示，可再次点击验证码图片重试
    })
  }

  useEffect(() => {
    // setState 放进 .then 异步回调里，卸载后不再写入，避免告警与竞态
    let cancelled = false
    axios.get('/api/auth/captcha').then((res) => {
      if (!cancelled) {
        setCaptchaId(res.data.captchaId)
        setCaptchaSvg(res.data.captchaSvg)
      }
    }).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async(e) => { 
    e.preventDefault()
    if (!nickname || !phone || !captchaCode || !password) {
      Toast.show({
        content: '请输入完整信息',
        icon: 'fail'
      })
      return
    }

    // 校验格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    const majorChineseEmailRegex = /^[a-zA-Z0-9._%+-]+@(?:qq\.com|163\.com|126\.com|sina\.(?:com|cn)|sohu\.com|yeah\.net|gmail\.com|hotmail\.com|outlook\.com|foxmail\.com|aliyun\.com)$/i;
    if (!phoneRegex.test(phone) && !majorChineseEmailRegex.test(phone)) { // 手机号码非法
      Toast.show({
        icon: 'fail',
        content: '请输入正确的账号'
      })
      return
    }

    // loading：请求期间禁用提交按钮，防止重复提交
    setLoading(true)

    try {
      // 发请求
      const res = await axios.post('/api/auth/register', {
        nickname,
        phone,
        captchaCode,
        password,
        captchaId
      })
      Toast.show({
        content: res.data.message,
        icon: 'success'
      })

      changeActiveTab('login', {phone, password})
    } catch {
      // 失败原因已由响应拦截器统一提示；后端对同一验证码有错误次数上限，
      // 失败后换一张新验证码并清空输入，避免拿着已失效的验证码反复提交
      refreshCaptcha()
      setCaptchaCode('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <form className='register-form' onSubmit={handleSubmit}>
        <div className="register-form__group">
          <i className='iconfont icon-zhanghao'></i>
          <input
            type="text"
            placeholder='请输入昵称'
            className='register-form__input'
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value)
            }}
          />
        </div>
        <div className="register-form__group">
          <i className='iconfont icon-shoujihaoma-mian'></i>
          <input
            type="text"
            placeholder='请输入手机号或邮箱'
            className='register-form__input'
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value)
            }}
          />
        </div>
        <div className="register-form__group register-form__group--captcha">
          <i className='iconfont icon-anquan'></i>
          <input
            type="text"
            placeholder='请输入验证码'
            className='register-form__input register-form__input--captcha'
            value={captchaCode}
            onChange={(e) => {
              setCaptchaCode(e.target.value)
            }}
            maxLength={4}
          />
          <div 
            className="register-form__captcha-img" 
            title='点击刷新验证码'
            dangerouslySetInnerHTML={{__html: captchaSvg}}
            onClick={refreshCaptcha}
          ></div>
        </div>
        <div className="register-form__group">
          <i className='iconfont icon-mima'></i>
          <input
            type="password"
            placeholder='请设置密码'
            className='register-form__input'
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
            }}
          />
        </div>

        <button type='submit' disabled={loading} className='register-form__submit'>
          {loading ? '注册中...' : '注册'}
        </button>

      </form>
    </div>
  )
}