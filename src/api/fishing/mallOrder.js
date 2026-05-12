import request from '@/utils/request'

export function listMallOrder(query) {
  return request({ url: '/fishing/mallOrder/list', method: 'get', params: query })
}
export function getMallOrder(mallOrderId) {
  return request({ url: '/fishing/mallOrder/' + mallOrderId, method: 'get' })
}
export function redeemMallOrder(code) {
  return request({ url: '/fishing/mallOrder/redeem', method: 'post', data: { code } })
}
export function cancelMallOrder(mallOrderId) {
  return request({ url: '/fishing/mallOrder/cancel/' + mallOrderId, method: 'put' })
}
