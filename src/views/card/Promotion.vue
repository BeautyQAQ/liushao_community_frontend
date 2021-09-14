<template>
  <el-card class="box-card" shadow="never">
    <div slot="header">
      <span>🥂 推广</span>
    </div>
    <div>
      <p v-for="(item, index) in list" :key="index" class="block">
        <a :href="item.link" target="_blank">{{ item.title }}</a>
      </p>
    </div>
  </el-card>
</template>

<script>
import { getList } from "@/api/promote.js"

export default {
  name: "Promotion",
  data() {
    return {
      list: [],
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
};
</script>

<style scoped>
</style>