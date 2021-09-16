import request from '@/utils/request'

export function userRegister(userDTO) {
    return request({
      url: '/ums/user/register',
      method: 'post',
      data: userDTO
    })
}

export function login(data) {
  return request({
    url: '/ums/user/login',
    method: 'post',
    data
  })
}