import request from '@/utils/request'

export function listRefund(query) {
  return request({ url: '/fishing/refund/list', method: 'get', params: query })
}
export function getRefund(refundId) {
  return request({ url: '/fishing/refund/' + refundId, method: 'get' })
}
export function approveRefund(refundId, data) {
  return request({ url: '/fishing/refund/approve/' + refundId, method: 'put', data })
}
export function rejectRefund(refundId, data) {
  return request({ url: '/fishing/refund/reject/' + refundId, method: 'put', data })
}
export function delRefund(refundIds) {
  return request({ url: '/fishing/refund/' + refundIds, method: 'delete' })
}
