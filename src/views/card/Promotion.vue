<template>
  <el-card class="box-card" shadow="never">
    <template #header><div>
      <span>🥂 推广</span>
    </div></template>
    <div>
      <p v-for="(item, index) in list" :key="index" class="block">
        <a :href="item.link" target="_blank">{{ item.title }}</a>
      </p>
    </div>
  </el-card>
</template>

<script lang="ts">
import type { Promotion } from '@/types'
import { defineComponent } from 'vue'
import { getList } from "@/api/promote"

export default defineComponent({
  name: "Promotion",
  data() {
    return {
      list: [] as Promotion[],
    };
  },
  created() {
    this.fetchList()
  },
  methods: {
    fetchList() {
      getList()
        .then((result) => {
          const { data } = result
          this.list = data
        })
        .catch((err) => {});
    },
  },
})
</script>

<style scoped>
</style>
