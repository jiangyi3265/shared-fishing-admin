import request from '@/utils/request'

export function listRecharge(query) {
  return request({ url: '/fishing/rechargeOrder/list', method: 'get', params: query })
}
export function getUserBalance(userId) {
  return request({ url: '/fishing/rechargeOrder/balance/' + userId, method: 'get' })
}
export function adjustBalance(data) {
  return request({ url: '/fishing/rechargeOrder/adjust', method: 'post', data })
}
