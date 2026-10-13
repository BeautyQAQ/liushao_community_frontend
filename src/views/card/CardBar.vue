<template>
  <section>
    <!--是否登录-->
    <login-welcome />

    <!--今日赠言-->
    <tip-card />

    <!--资源推介-->
    <PromotionCard />
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import TipCard from '@/views/card/Tip.vue'
import PromotionCard from '@/views/card/Promotion.vue'
import LoginWelcome from '@/views/card/LoginWelcome.vue'

export default defineComponent({
    name: 'CardBar',
    components: { LoginWelcome, PromotionCard, TipCard },
    data() {
        return {

        }
    }
})
</script>

<style scoped>
</style>
