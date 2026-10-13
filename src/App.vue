<template>
  <div>
    <div class="mb-5">
      <Header></Header>
    </div>
    <div class="container context">
      <router-view :key="$route.fullPath"></router-view>
    </div>
    <div>
      <Footer></Footer>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Header from "@/components/Layout/Header.vue";
import Footer from "@/components/Layout/Footer.vue";

export default defineComponent({
  name: "APP",
  components: { Header, Footer },
})
</script>

<style scoped>
.container {
  min-height: 500px;
}
</style>
