<template>
  <el-card class="settings" shadow="never">
    <template #header><h1 class="title is-4">个人设置</h1></template>
    <el-form ref="profileRef" :model="profile" :rules="profileRules" label-position="top">
      <el-form-item label="昵称" prop="alias"><el-input v-model="profile.alias" maxlength="64" /></el-form-item>
      <el-form-item label="简介" prop="bio"><el-input v-model="profile.bio" type="textarea" :rows="3" maxlength="255" /></el-form-item>
      <el-button type="primary" :loading="saving" @click="save">保存资料</el-button>
    </el-form>
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
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { saveProfile, changePassword } from '@/api/auth/auth'
import store from '@/store'
const router = useRouter(), profileRef = ref<FormInstance>(), passwordRef = ref<FormInstance>()
const saving = ref(false), changing = ref(false)
const profile = reactive({ alias: store.state.user.user?.alias || '', bio: store.state.user.user?.bio || '' })
const password = reactive({ currentPass: '', password: '', checkPass: '' })
const profileRules: FormRules = { alias: [{ required: true, whitespace: true, message: '请输入昵称', trigger: 'blur' }] }
const passwordRules: FormRules = {
  currentPass: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  password: [{ required: true, min: 8, max: 72, message: '密码至少 8 个字符，最多 72 字节', trigger: 'blur' }],
  checkPass: [{ validator: (_r, value, cb) => cb(value && value === password.password ? undefined : new Error('两次输入的密码不一致')), trigger: 'blur' }]
}
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
<style scoped>.settings { max-width: 720px; margin: auto; }</style>
