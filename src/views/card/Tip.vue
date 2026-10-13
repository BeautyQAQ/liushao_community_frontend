<template>
  <el-card class="box-card" shadow="never">
    <template #header><div>
      <span>🥳 每日一句</span>
    </div></template>
    <div>
      <div class="has-text-left block">
        {{ tip.content }}
      </div>
      <div class="has-text-right mt-5 block">
        ——{{ tip.author }}
      </div>
    </div>
  </el-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { getTodayTip } from '@/api/tip'

export default defineComponent({
    name: 'Tip',
    data() {
        return {
            tip: { content: '', author: '' }
        }
    },
    created() {
        this.fetchTodayTip()
    },
    methods: {
        fetchTodayTip(){
            getTodayTip().then((result) => {
                const { data } = result
                this.tip = data || { content: '欢迎分享你的经验与想法。', author: '流沙社区' }
            }).catch((err) => {

            });
        }
    }
})
</script>

<style scoped>
</style>
