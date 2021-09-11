<template>
  <div>
    <div class="box">🔔 {{ billboard.content }} </div>
  </div>
</template>

<script>
import { getBillboard } from "@/api/billboard";

export default {
  name: "Home",
  data(){
    return{
      billboard: {
        content: ''
      }
    }
  },
  created() {
    this.fetchBillboard()
  },
  methods: {
    async fetchBillboard(){
      getBillboard().then((result) => {
        const { data } = result
        this.billboard = data
      }).catch((err) => {
        
      });
    }
  }
};
</script>
