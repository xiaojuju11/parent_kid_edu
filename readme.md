# 客户端
- 移动端：

1. 适配不同屏幕尺寸
- 不同屏幕尺寸页面元素的排版
- 不同屏幕尺寸元素的大小 （rem）
- 封装 rem.js 用来动态的修改页面跟字体大小

2. 样式初始化
- https://meyerweb.com/eric/tools/css/reset/    (reset.css)

3. npm i react-router-dom 安装路由，开发登录注册页面
   css : npm i less --save-dev    (less.css) 还有sass和stylus

- ajax 错误统一处理：
npm install axios  安装axios 代替fetch

二次封装 axios

- 浏览器的储存
1. localStorage: 本地存储 （内存大小大约 5-8M， 永久有效）
2. sessionStorage: 会话存储 （内存大小大约 5-8M， 关闭页面就自动消失）
3. cookies：（内存大小大约 4K， 会自动携带在请求头， 后端控制它的有效时间）
4. IndexDB：客户端的数据库存储 （无穷大， 永久有效）
 
# 服务端
- 定义登录接口:
1. npm i koa-router 安装路由，用来分门别类的定义后端接口地址

2. 路由层 : 定义接口 
   控制层 ：当前端请求该接口，响应的逻辑 
   模板层：响应逻辑中跟数据库打交道的代码

3. npm i koa-bodyparser 辅助 koa 解析 post 请求体中的参数

4. npm install --save mysql2 安装 mysql （用法看文档）

5. npm i bcrypt 通过bcrypt.js 对密码进行加密解密

6. token 令牌 -- 前端只有登录成功，后端会生成一个 token，并返回给前端，前端将 token 保存起来，并在未来的其他的接口请求时，将这个 token 携带上给后端，后端校验 token 合法后才返回正确的数据 npm i jsonwebtoken

- 定义验证码接口：
1. npm i svg-captcha

# 跨域
https://42.245.43.1： 8000/home
协议     域名           端口  路径

协议：http
域名：42.245.43.1
端口：8000
路径：/home


- 同源策略：阻止的是后端的响应
协议、域名、端口 都相同的两个端，才可以进行网络通信
世界上不可能存在着两个相同的源
两个不同的电脑域名不同

- 解决跨域：
  1. cors(设置响应头来告知浏览器允许哪些源访问我)
  2. node 代理
