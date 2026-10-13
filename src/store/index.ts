import { createStore } from 'vuex'
import user, { type UserState } from './modules/user'
import getters from './getters'
export interface RootState { user: UserState }
export default createStore<RootState>({ modules: { user }, getters })
