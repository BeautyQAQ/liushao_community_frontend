import type { RootState } from '.'
export default { token: (state: RootState) => state.user.token, user: (state: RootState) => state.user.user }
