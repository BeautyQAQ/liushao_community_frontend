<template>
  <header class="header has-background-white has-text-black">
    <b-navbar class="container is-white" :fixed-top="true">
      <template #brand>
        <b-navbar-item tag="div">
          <router-link to="/" class="has-text-weight-bold">流沙社区</router-link>
        </b-navbar-item>

        <b-navbar-item
          class="is-hidden-desktop"
          tag="router-link"
          :to="{ path: '/' }"
        >
          主页
        </b-navbar-item>
      </template>
      <template #start>
        <b-navbar-item tag="router-link" :to="{ path: '/' }">
          🌐 主页
        </b-navbar-item>
      </template>

      <template #end>
        <b-navbar-item tag="div">
          <b-field position="is-centered">
            <b-input
              v-model="searchKey"
              class="s_input"
              width="80%"
              placeholder="搜索标题、正文、标签或作者"
              rounded
              clearable
              @keyup.enter="search()"
            />

            <p class="control">
              <b-button class="is-info" @click="search()">检索 </b-button>
            </p>
          </b-field>
        </b-navbar-item>

        <b-navbar-item tag="div">
          <b-switch v-model="darkMode" passive-type="is-warning" type="is-dark">
            {{ darkMode ? "夜" : "日" }}
          </b-switch>
        </b-navbar-item>

        <b-navbar-item v-if="token == null || token === ''" tag="div">
          <div class="buttons">
            <b-button
              class="is-light"
              tag="router-link"
              :to="{ path: '/register' }"
            >
              注册
            </b-button>
            <b-button
              class="is-light"
              tag="router-link"
              :to="{ path: '/login' }"
            >
              登录
            </b-button>
          </div>
        </b-navbar-item>

        <b-navbar-dropdown v-else :label="user?.alias || '用户'">
          <b-navbar-item
            tag="router-link"
            :to="{ path: `/member/${user?.username}/home` }"
          >
            🧘 个人中心
          </b-navbar-item>
          <hr class="dropdown-divider" />
          <b-navbar-item
            tag="router-link"
            :to="{ path: `/member/${user?.username}/setting` }"
          >
            ⚙ 设置中心
          </b-navbar-item>
          <hr class="dropdown-divider" />
          <b-navbar-item tag="a" @click="logout"> 👋 退出登录 </b-navbar-item>
        </b-navbar-dropdown>
      </template>
    </b-navbar>
  </header>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import {
  disable as disableDarkMode,
  enable as enableDarkMode,
} from "darkreader";
import { getDarkMode, setDarkMode } from "@/utils/auth";
import logoUrl from '@/assets/logo.png'
import doubaoImg from '@/assets/image/doubao.png'
import { mapGetters } from "vuex";
export default defineComponent({
  name: "Header",
  data() {
    return {
      logoUrl,
      doubaoImg,
      searchKey: "",
      darkMode: false,
    };
  },
  computed: {
    ...mapGetters(["token", "user"]),
  },
  watch: {
    // 监听Theme模式
    darkMode(val) {
      if (val) {
        enableDarkMode({});
      } else {
        disableDarkMode();
      }
      setDarkMode(this.darkMode);
    },
  },
  created() {
    // 获取cookie中的夜间还是白天模式
    this.darkMode = getDarkMode();
    if (this.darkMode) {
      enableDarkMode({});
    } else {
      disableDarkMode();
    }
  },
  methods: {
    async logout() {
      try { await this.$store.dispatch('user/logout'); this.$message.info('退出登录成功') }
      catch { /* Displayed by request layer. */ }
      finally { await this.$router.push('/') }
    },
    search() {
      if (this.searchKey.trim() === null || this.searchKey.trim() === "") {
        this.$message.info({
          showClose: true,
          message: "请输入关键字搜索！",
          type: "warning",
        });
        return;
      }
      this.$router.push({ path: "/search", query: { key: this.searchKey.trim().slice(0, 100) } });
    },
  },
})
</script>

<style scoped>
input {
  width: 80%;
  height: 86%;
}
</style>
