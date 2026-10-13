<template>
  <div>
    <div class="box">🔔 {{ billboard.content }}</div>
    <div class="columns">
      <div class="column is-three-quarters">
        <TopicList></TopicList>
      </div>
      <div class="column">
        <card-bar></card-bar>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { getBillboard } from "@/api/billboard";
import CardBar from "@/views/card/CardBar.vue";
import PostList from "@/views/post/Index.vue";

export default defineComponent({
  name: "Home",
  components: { CardBar, TopicList: PostList },
  data() {
    return {
      billboard: {
        content: "",
      },
    };
  },
  created() {
    this.fetchBillboard();
  },
  methods: {
    async fetchBillboard() {
      getBillboard()
        .then((result) => {
          const { data } = result;
          this.billboard = data;
        })
        .catch((err) => {});
    },
  },
})
</script>
