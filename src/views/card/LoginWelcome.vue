<template>
  <el-card class="box-card" shadow="never">
    <template #header><div>
      <span>💐 发帖</span>
    </div></template>
    <div v-if="token != null && token !== ''" class="has-text-centered">
      <b-button
        type="is-danger"
        tag="router-link"
        :to="{ path: '/post/create' }"
        outlined
        >✍ 发表想法</b-button
      >
    </div>

    <div v-else class="has-text-centered">
      <b-button
        type="is-primary"
        tag="router-link"
        :to="{ path: '/register' }"
        outlined
        >马上入驻</b-button
      >
      <b-button
        type="is-danger"
        tag="router-link"
        :to="{ path: '/login' }"
        outlined
        class="ml-2"
        >社区登入</b-button
      >
    </div>
  </el-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapGetters } from "vuex";

export default defineComponent({
  name: "LoginWelcome",
  data() {
    return {};
  },
  computed: {
    ...mapGetters(["token"]),
  },
})
</script>

<style scoped></style>
