<template>
  <div class="login">
    <el-form ref="loginRef" :model="loginForm" :rules="loginRules" class="login-form">
      <h3 class="title">{{ title }}</h3>
      <el-form-item prop="username">
        <el-input
          v-model="loginForm.username"
          type="text"
          size="large"
          auto-complete="off"
          placeholder="账号"
        >
          <template #prefix><svg-icon icon-class="user" class="el-input__icon input-icon" /></template>
        </el-input>
      </el-form-item>
      <el-form-item prop="password">
        <el-input
          v-model="loginForm.password"
          type="password"
          size="large"
          auto-complete="off"
          placeholder="密码"
          @keyup.enter="handleLogin"
        >
          <template #prefix><svg-icon icon-class="password" class="el-input__icon input-icon" /></template>
        </el-input>
      </el-form-item>
      <el-form-item prop="code" v-if="captchaEnabled">
        <el-input
          v-model="loginForm.code"
          size="large"
          auto-complete="off"
          placeholder="验证码"
          style="width: 63%"
          @keyup.enter="handleLogin"
        >
          <template #prefix><svg-icon icon-class="validCode" class="el-input__icon input-icon" /></template>
        </el-input>
        <div class="login-code">
          <img v-if="codeUrl" :src="codeUrl" @click="getCode" class="login-code-img"/>
        </div>
      </el-form-item>
      <el-checkbox v-model="loginForm.rememberMe" style="margin:0px 0px 25px 0px;">记住账号</el-checkbox>
      <el-form-item style="width:100%;">
        <el-button
          :loading="loading"
          size="large"
          type="primary"
          style="width:100%;"
          @click.prevent="handleLogin"
        >
          <span v-if="!loading">登 录</span>
          <span v-else>登 录 中...</span>
        </el-button>
        <div style="float: right;" v-if="register">
          <router-link class="link-type" :to="'/register'">立即注册</router-link>
        </div>
      </el-form-item>
    </el-form>
    <!--  底部  -->
    <div class="el-login-footer">
      <span>{{ footerContent }}</span>
    </div>
  </div>
</template>

<script setup>
import { getCodeImg } from "@/api/login"
import Cookies from "js-cookie"
import useUserStore from '@/store/modules/user'
import defaultSettings from '@/settings'

const title = import.meta.env.VITE_APP_TITLE
const footerContent = defaultSettings.footerContent
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const { proxy } = getCurrentInstance()

const loginForm = ref({
  username: "",
  password: "",
  rememberMe: false,
  code: "",
  uuid: ""
})

const loginRules = {
  username: [{ required: true, trigger: "blur", message: "请输入您的账号" }],
  password: [{ required: true, trigger: "blur", message: "请输入您的密码" }],
  code: [{ required: true, trigger: "change", message: "请输入验证码" }]
}

const codeUrl = ref("")
const loading = ref(false)
// 验证码开关
const captchaEnabled = ref(true)
// 注册开关
const register = ref(false)
const redirect = ref(undefined)

watch(route, (newRoute) => {
    redirect.value = newRoute.query && newRoute.query.redirect
}, { immediate: true })

function handleLogin() {
  proxy.$refs.loginRef.validate(valid => {
    if (valid) {
      loading.value = true
      // 只记住账号，不在浏览器保存密码
      if (loginForm.value.rememberMe) {
        Cookies.set("username", loginForm.value.username, { expires: 30 })
        Cookies.set("rememberMe", loginForm.value.rememberMe, { expires: 30 })
      } else {
        // 否则移除
        Cookies.remove("username")
        Cookies.remove("rememberMe")
      }
      // 调用action的登录方法
      userStore.login(loginForm.value).then(() => {
        const query = route.query
        const otherQueryParams = Object.keys(query).reduce((acc, cur) => {
          if (cur !== "redirect") {
            acc[cur] = query[cur]
          }
          return acc
        }, {})
        router.push({ path: redirect.value || "/", query: otherQueryParams })
      }).catch(() => {
        loading.value = false
        // 重新获取验证码
        if (captchaEnabled.value) {
          getCode()
        }
      })
    }
  })
}

function getCode() {
  getCodeImg().then(res => {
    captchaEnabled.value = res.captchaEnabled === undefined ? true : res.captchaEnabled
    if (captchaEnabled.value && res.img) {
      codeUrl.value = "data:image/gif;base64," + res.img
      loginForm.value.uuid = res.uuid
    } else {
      codeUrl.value = ""
      loginForm.value.uuid = ""
    }
  }).catch(() => {
    codeUrl.value = ""
    loginForm.value.uuid = ""
  })
}

function getCookie() {
  const username = Cookies.get("username")
  const rememberMe = Cookies.get("rememberMe")
  loginForm.value = {
    username: username === undefined ? loginForm.value.username : username,
    password: "",
    rememberMe: rememberMe === undefined ? false : rememberMe === "true"
  }
}

getCode()
getCookie()
</script>

<style lang='scss' scoped>
.login {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  min-height: 100%;
  height: 100%;
  padding: 48px 9vw;
  background-color: oklch(22% 0.04 198);
  background-image:
    linear-gradient(90deg, oklch(18% 0.045 198 / .88) 0%, oklch(18% 0.045 198 / .62) 46%, oklch(26% 0.035 190 / .28) 100%),
    url("../assets/images/login-background.jpg");
  background-position: center;
  background-size: cover;
  overflow: hidden;
  position: relative;
}

.login::before {
  content: "共享钓场管理后台";
  position: absolute;
  left: 9vw;
  top: 50%;
  max-width: 520px;
  color: oklch(96% 0.018 160);
  font-size: 44px;
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: 0;
  transform: translateY(-86px);
}

.login::after {
  content: "订单、会员、钓位与营收在同一个工作台里清清楚楚。";
  position: absolute;
  left: 9vw;
  top: 50%;
  max-width: 460px;
  color: oklch(84% 0.03 166 / .82);
  font-size: 16px;
  line-height: 1.8;
  transform: translateY(8px);
}

.title {
  margin: 0 auto 26px;
  text-align: center;
  color: var(--app-text);
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0;
}

.login-form {
  width: 420px;
  max-width: calc(100vw - 36px);
  padding: 30px 30px 18px;
  z-index: 1;
  background: var(--app-surface);
  border: 1px solid oklch(92% 0.015 166 / .88);
  border-radius: 12px;
  box-shadow: 0 24px 64px oklch(12% 0.035 198 / .28);

  .el-input {
    height: 44px;

    input {
      height: 44px;
    }
  }

  .input-icon {
    height: 42px;
    width: 14px;
    margin-left: 2px;
    color: var(--app-text-muted);
  }

  :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  :deep(.el-button) {
    height: 44px;
    border-radius: var(--app-radius);
    font-size: 15px;
  }
}

.login-tip {
  font-size: 13px;
  text-align: center;
  color: var(--app-text-muted);
}

.login-code {
  width: 33%;
  height: 44px;
  float: right;

  img {
    cursor: pointer;
    vertical-align: middle;
  }
}

.el-login-footer {
  min-height: 40px;
  line-height: 1.6;
  position: fixed;
  bottom: 18px;
  left: 0;
  width: 100%;
  padding: 0 18px;
  text-align: center;
  color: oklch(89% 0.018 160 / .72);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  font-size: 12px;
  letter-spacing: 0;
}

.login-code-img {
  width: 100%;
  height: 44px;
  padding-left: 10px;
  object-fit: cover;
  border-radius: var(--app-radius-sm);
}

@media (max-width: 920px) {
  .login {
    justify-content: flex-start;
    padding: 28px 18px 64px;
  }

  .login::before,
  .login::after {
    display: none;
  }

  .login-form {
    width: 100%;
    max-width: 360px;
    padding: 26px 20px 14px;
  }
}
</style>
