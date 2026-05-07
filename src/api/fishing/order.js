import request from '@/utils/request'

export function listOrder(query) {
  return request({ url: '/fishing/order/list', method: 'get', params: query })
}
export function getOrder(orderId) {
  return request({ url: '/fishing/order/' + orderId, method: 'get' })
}
export function finishOrder(orderId) {
  return request({ url: '/fishing/order/finish/' + orderId, method: 'put' })
}
export function cancelOrder(orderId, reason) {
  return request({ url: '/fishing/order/cancel/' + orderId, method: 'put', data: { reason } })
}
