import axios from 'axios'
import { Toast } from 'antd-mobile'//轻提示组件，请求出错时自动弹出错误消息

axios.defaults.timeout = 5000  // 请求超时时间：5 秒  超过 5 秒没响应就自动断开
axios.defaults.baseURL = 'http://120.26.186.48:3000'  // 基础接口地址  以后写接口地址不用每次都写一长串，直接写 /api/user 就行
axios.defaults.headers.post['Content-Type'] = 'application/json'// POST 请求默认发送 JSON 格式数据  所有 POST 自动告诉后端：我发的是 JSON


// 请求拦截
// 登录成功后，把 token 存在 localStorage
// 每次发请求都会自动带上 token
// 后端就能识别你是谁、是否登录
axios.interceptors.request.use(request => {
  const token = localStorage.getItem('token')// 从本地缓存拿 token（登录后后端返回的令牌）
  if (token) {
    request.headers.Authorization = token // 如果有 token，就自动加到请求头里
  }
  return request // 放行请求
})

// 响应拦截
axios.interceptors.response.use(
  (response) => {  // 逻辑性错误
    if (response.data.code !== 1) { // 判断后端自定义的 code 是否为 1
      Toast.show({
        icon: 'fail',    // 不是 1 就弹出错误提示
        content: response.data.message
      })
      return Promise.reject(response)    // 抛出错误，让业务代码 catch 捕获
    }
    return response  // 正常返回数据
  },
  (error) => { // 程序性错误：网络异常、超时或 HTTP 非 2xx
    // axios 的状态码在 error.response.status 上，error.status 并不存在；
    // 断网 / 超时时 error.response 整个为空，必须兜底，否则拦截器自身会抛异常
    const status = error.response && error.response.status
    const data = error.response && error.response.data
    const content = (data && data.message)
      || ((error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') ? '请求超时，请稍后重试' : '网络异常，请稍后重试')

    Toast.show({
      icon: 'fail',
      content
    })

    if (status === 416) { // 没有权限
      // 重定向去登录页面
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
    }

    return Promise.reject(error)  // 始终继续抛出，业务代码才能 catch 到
  }
)

export default axios
