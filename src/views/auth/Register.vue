<template>
  <div class="columns py-6">
    <div class="column is-half is-offset-one-quarter">
      <el-card shadow="never">
        <template #header><div class="has-text-centered has-text-weight-bold">
          新用户入驻
        </div></template>
        <div>
          <el-form
            ref="formRef"
            v-loading="loading"
            :model="ruleForm"
            status-icon
            :rules="rules"
            label-width="100px"
            class="demo-ruleForm"
          >
            <el-form-item label="账号" prop="name">
              <el-input v-model="ruleForm.name" />
            </el-form-item>

            <el-form-item label="密码" prop="pass">
              <el-input
                v-model="ruleForm.pass"
                type="password"
                autocomplete="off"
              />
            </el-form-item>

            <el-form-item label="确认密码" prop="checkPass">
              <el-input
                v-model="ruleForm.checkPass"
                type="password"
                autocomplete="off"
              />
            </el-form-item>

            <el-form-item label="邮箱" prop="email">
              <el-input v-model="ruleForm.email" autocomplete="off" />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="loading" @click="submitForm('ruleForm')"
                >立即注册</el-button
              >
              <el-button @click="resetForm('ruleForm')">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { userRegister } from '@/api/auth/auth'
const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)
const ruleForm = reactive({ name: '', pass: '', checkPass: '', email: '' })
const rules: FormRules = {
  name: [{ required: true, pattern: /^[a-zA-Z0-9_]{2,32}$/, message: '账号为 2 至 32 位字母、数字或下划线', trigger: 'blur' }],
  pass: [{ required: true, min: 8, max: 72, message: '密码至少 8 个字符，最多 72 字节', trigger: 'blur' }],
  checkPass: [{ validator: (_rule, value, callback) => callback(value === ruleForm.pass && value ? undefined : new Error('两次输入密码不一致')), trigger: 'blur' }],
  email: [{ required: true, type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }]
}
async function submitForm(_formName: string) {
  if (loading.value || !await formRef.value?.validate().catch(() => false)) return
  loading.value = true
  try { await userRegister(ruleForm); ElMessage.success('账号注册成功'); await router.push('/login') }
  catch { /* The request layer displays the error. */ }
  finally { loading.value = false }
}
function resetForm(_formName: string) { formRef.value?.resetFields() }
</script>

<style scoped>
</style>
