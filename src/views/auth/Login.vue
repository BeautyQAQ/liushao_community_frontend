<template>
  <div class="columns py-6">
    <div class="column is-half is-offset-one-quarter">
      <el-card shadow="never">
        <template #header><div class="has-text-centered has-text-weight-bold">用户登录</div></template>
        <div>
          <el-form
            v-loading="loading"
            :model="ruleForm"
            status-icon
            :rules="rules"
            ref="formRef"
            label-position="top"
            class="demo-ruleForm"
            @submit.prevent="submitForm('ruleForm')"
          >
            <el-form-item label="账号" prop="name">
              <el-input v-model="ruleForm.name" autocomplete="username"></el-input>
            </el-form-item>

            <el-form-item label="密码" prop="pass">
              <el-input type="password" v-model="ruleForm.pass" autocomplete="current-password" show-password></el-input>
            </el-form-item>

            <el-form-item label="记住" prop="delivery">
              <el-switch v-model="ruleForm.rememberMe"></el-switch>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" native-type="submit" :loading="loading">登录</el-button>
              <el-button @click="resetForm('ruleForm')">重置</el-button>
              <router-link class="ml-4" to="/password/forgot">忘记密码？</router-link>
            </el-form-item>
          </el-form>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import store from '@/store'
const router = useRouter(), route = useRoute(), formRef = ref<FormInstance>(), loading = ref(false)
const ruleForm = reactive({ name: '', pass: '', rememberMe: true })
const rules: FormRules = {
 name: [{ required: true, max: 32, message: '请输入账号', trigger: 'blur' }],
 pass: [{ required: true, max: 72, message: '请输入密码', trigger: 'blur' }]
}
async function submitForm(_name: string) {
 if (loading.value || !await formRef.value?.validate().catch(() => false)) return
 loading.value = true
 try {
  await store.dispatch('user/login', ruleForm)
  await store.dispatch('user/getUserInfo')
  ElMessage.success('登录成功')
  const target = String(route.query.redirect || '/')
  await router.replace(target.startsWith('/') && !target.startsWith('//') && !target.startsWith('/login') ? target : '/')
 } catch { /* Displayed by request layer. */ } finally { loading.value = false }
}
function resetForm(_name: string) { formRef.value?.resetFields() }
</script>
