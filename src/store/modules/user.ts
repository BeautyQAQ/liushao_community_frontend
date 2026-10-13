import type { Module } from 'vuex'
import type { RootState } from '..'
import type { User, LoginForm } from '@/types'
import { getUserInfo, login, logout } from '@/api/auth/auth'
import { getToken, setToken, removeToken } from '@/utils/auth'
export interface UserState { token: string; user: User | null }
const user: Module<UserState, RootState> = {
  namespaced: true,
  state: () => ({ token: getToken() || '', user: null }),
  mutations: {
    SET_TOKEN_STATE(state, token: string) { state.token = token },
    SET_USER_STATE(state, user: User | null) { state.user = user }
  },
  actions: {
    async login({ commit }, form: LoginForm) {
      const { data } = await login({ username: form.name.trim(), password: form.pass, rememberMe: form.rememberMe })
      setToken(data.token)
      commit('SET_TOKEN_STATE', data.token)
    },
    async getUserInfo({ commit }) {
      const { data } = await getUserInfo()
      if (!data) throw new Error('登录状态已失效')
      commit('SET_USER_STATE', data)
      return data
    },
    reset({ commit }) { removeToken(); commit('SET_TOKEN_STATE', ''); commit('SET_USER_STATE', null) },
    async logout({ dispatch }) { try { await logout() } finally { await dispatch('reset') } }
  }
}
export default user
