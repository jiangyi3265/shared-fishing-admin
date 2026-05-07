import request from '@/utils/request'

export function listFishUser(query) {
  return request({ url: '/fishing/user/list', method: 'get', params: query })
}
export function getFishUser(userId) {
  return request({ url: '/fishing/user/' + userId, method: 'get' })
}
