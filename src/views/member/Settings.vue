<template>
  <el-card class="settings" shadow="never">
    <template #header><h1 class="title is-4">个人设置</h1></template>
    <div class="avatar-editor">
      <el-avatar :size="72" :src="mediaUrl(store.state.user.user?.avatar)">{{ profile.alias.slice(0, 1) }}</el-avatar>
      <ImageUploader label="更换头像" :disabled="savingAvatar" @uploaded="updateAvatar" />
      <span v-if="savingAvatar" role="status">正在保存头像…</span>
    </div>
    <el-form ref="profileRef" :model="profile" :rules="profileRules" label-position="top">
      <el-form-item label="昵称" prop="alias"><el-input v-model="profile.alias" maxlength="64" /></el-form-item>
      <el-form-item label="简介" prop="bio"><el-input v-model="profile.bio" type="textarea" :rows="3" maxlength="255" /></el-form-item>
      <el-button type="primary" :loading="saving" @click="save">保存资料</el-button>
    </el-form>
    <el-divider /><h2 class="title is-5">邮箱验证</h2>
    <p class="mb-3">{{ store.state.user.user?.email }} <el-tag :type="store.state.user.user?.active ? 'success' : 'warning'">{{ store.state.user.user?.active ? '已验证' : '未验证' }}</el-tag></p>
    <div v-if="!store.state.user.user?.active">
      <p class="has-text-grey mb-3">验证码发送到注册邮箱，10 分钟内有效。</p>
      <el-button :loading="sendingCode" :disabled="cooldown > 0" @click="sendCode">{{ cooldown ? `${cooldown} 秒后可重发` : '发送验证邮件' }}</el-button>
      <el-form class="mt-3" @submit.prevent="confirmEmail">
        <el-form-item label="邮箱验证码"><el-input v-model="emailCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="6 位数字" /></el-form-item>
        <el-button type="primary" native-type="submit" :loading="verifying" :disabled="!/^\d{6}$/.test(emailCode)">验证邮箱</el-button>
      </el-form>
    </div>
    <el-divider /><h2 class="title is-5">修改密码</h2>
    <el-form ref="passwordRef" :model="password" :rules="passwordRules" label-position="top">
      <el-form-item label="当前密码" prop="currentPass"><el-input v-model="password.currentPass" type="password" autocomplete="current-password" /></el-form-item>
      <el-form-item label="新密码" prop="password"><el-input v-model="password.password" type="password" show-password autocomplete="new-password" /></el-form-item>
      <el-form-item label="确认新密码" prop="checkPass"><el-input v-model="password.checkPass" type="password" autocomplete="new-password" /></el-form-item>
      <el-button :loading="changing" @click="change">更新密码</el-button>
    </el-form>
  </el-card>
</template>
<script setup lang="ts">
import { onBeforeUnmount, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { saveProfile, changePassword, saveAvatar, sendEmailCode, verifyEmail } from '@/api/auth/auth'
import ImageUploader from '@/components/ImageUploader.vue'
import { mediaUrl } from '@/utils/media'
import store from '@/store'
const router = useRouter(), profileRef = ref<FormInstance>(), passwordRef = ref<FormInstance>()
const saving = ref(false), changing = ref(false)
const savingAvatar = ref(false), sendingCode = ref(false), verifying = ref(false), emailCode = ref(''), cooldown = ref(0)
let timer: ReturnType<typeof setInterval> | undefined
const profile = reactive({ alias: store.state.user.user?.alias || '', bio: store.state.user.user?.bio || '' })
const password = reactive({ currentPass: '', password: '', checkPass: '' })
const profileRules: FormRules = { alias: [{ required: true, whitespace: true, message: '请输入昵称', trigger: 'blur' }] }
const passwordRules: FormRules = {
  currentPass: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  password: [{ required: true, min: 8, max: 72, message: '密码至少 8 个字符，最多 72 字节', trigger: 'blur' }],
  checkPass: [{ validator: (_r, value, cb) => cb(value && value === password.password ? undefined : new Error('两次输入的密码不一致')), trigger: 'blur' }]
}
async function updateAvatar(url: string) {
  savingAvatar.value = true
  try { const { data } = await saveAvatar(url); store.commit('user/SET_USER_STATE', data); ElMessage.success('头像已更新') }
  catch { /* Displayed by request layer. */ } finally { savingAvatar.value = false }
}
async function sendCode() {
  if (sendingCode.value || cooldown.value) return
  sendingCode.value = true
  try {
    await sendEmailCode(); ElMessage.success('验证邮件已请求发送，请检查收件箱'); cooldown.value = 60
    timer = setInterval(() => { if (--cooldown.value <= 0) clearInterval(timer) }, 1000)
  } catch { /* Displayed by request layer. */ } finally { sendingCode.value = false }
}
async function confirmEmail() {
  if (verifying.value || !/^\d{6}$/.test(emailCode.value)) return
  verifying.value = true
  try { await verifyEmail(emailCode.value); await store.dispatch('user/getUserInfo'); emailCode.value = ''; ElMessage.success('邮箱已验证') }
  catch { /* Preserve the code for retry. */ } finally { verifying.value = false }
}
onBeforeUnmount(() => clearInterval(timer))
async function save() {
  if (saving.value || !await profileRef.value?.validate().catch(() => false)) return
  saving.value = true
  try { const { data } = await saveProfile(profile); store.commit('user/SET_USER_STATE', data); ElMessage.success('资料已更新') }
  catch { /* Displayed by request layer. */ } finally { saving.value = false }
}
async function change() {
  if (changing.value || !await passwordRef.value?.validate().catch(() => false)) return
  changing.value = true
  try { await changePassword(password); await store.dispatch('user/reset'); ElMessage.success('密码已更新，请重新登录'); await router.replace('/login') }
  catch { /* Displayed by request layer. */ } finally { changing.value = false }
}
</script>
<style scoped>.settings { max-width: 720px; margin: auto; }.avatar-editor { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }</style>
