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

<script>
import { getBillboard } from "@/api/billboard";
import CardBar from "@/views/card/CardBar";
import PostList from "@/views/post/Index";

export default {
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
};
</script>
