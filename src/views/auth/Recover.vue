<template>
  <el-card class="account-panel" shadow="never">
    <template #header><h1 class="title is-4">找回密码</h1></template>
    <p class="has-text-grey mb-4">输入注册邮箱获取验证码，在 10 分钟内设置新密码。</p>
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="reset">
      <el-form-item label="注册邮箱" prop="email"><el-input v-model="form.email" type="email" autocomplete="email" maxlength="254" /></el-form-item>
      <el-button :loading="sending" :disabled="cooldown > 0" @click="send">{{ cooldown > 0 ? `${cooldown} 秒后可重发` : '发送验证码' }}</el-button>
      <el-alert v-if="sent" class="my-4" type="success" :closable="false" title="如果该邮箱对应可用账号，验证码将发送到邮箱，请检查收件箱。" />
      <el-form-item class="mt-4" label="邮箱验证码" prop="code"><el-input v-model="form.code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" /></el-form-item>
      <el-form-item label="新密码" prop="password"><el-input v-model="form.password" type="password" show-password autocomplete="new-password" /></el-form-item>
      <el-form-item label="确认新密码" prop="checkPass"><el-input v-model="form.checkPass" type="password" show-password autocomplete="new-password" /></el-form-item>
      <el-button type="primary" native-type="submit" :loading="saving">重置密码</el-button>
      <router-link class="ml-4" to="/login">返回登录</router-link>
    </el-form>
  </el-card>
</template>
<script setup lang="ts">
import { onBeforeUnmount, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { forgotPassword, resetPassword } from '@/api/auth/auth'
import store from '@/store'
const router = useRouter(), formRef = ref<FormInstance>()
const form = reactive({ email: '', code: '', password: '', checkPass: '' })
const sending = ref(false), saving = ref(false), sent = ref(false), cooldown = ref(0)
let timer: ReturnType<typeof setInterval> | undefined
const rules: FormRules = {
  email: [{ required: true, type: 'email', message: '请输入注册邮箱', trigger: 'blur' }],
  code: [{ required: true, pattern: /^\d{6}$/, message: '请输入 6 位验证码', trigger: 'blur' }],
  password: [{ validator: (_r, value: string, cb) => cb(value.length >= 8 && new TextEncoder().encode(value).length <= 72 ? undefined : new Error('密码至少 8 个字符，最多 72 字节')), trigger: 'blur' }],
  checkPass: [{ validator: (_r, value, cb) => cb(value && value === form.password ? undefined : new Error('两次输入的密码不一致')), trigger: 'blur' }]
}
async function send() {
  if (sending.value || cooldown.value || !await formRef.value?.validateField('email').catch(() => false)) return
  sending.value = true
  try {
    await forgotPassword(form.email.trim()); sent.value = true; cooldown.value = 60
    timer = setInterval(() => { if (--cooldown.value <= 0) clearInterval(timer) }, 1000)
  } catch { /* Keep the form for retry. */ } finally { sending.value = false }
}
async function reset() {
  if (saving.value || !await formRef.value?.validate().catch(() => false)) return
  saving.value = true
  try {
    await resetPassword({ ...form, email: form.email.trim() }); await store.dispatch('user/reset')
    ElMessage.success('密码已重置，请使用新密码登录'); await router.replace('/login')
  } catch { /* Keep the form for retry. */ } finally { saving.value = false }
}
onBeforeUnmount(() => clearInterval(timer))
</script>
<style scoped>.account-panel { max-width: 520px; margin: 24px auto; }</style>
