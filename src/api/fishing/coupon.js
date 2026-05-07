import request from '@/utils/request'

export function listCoupon(query) {
  return request({ url: '/fishing/coupon/list', method: 'get', params: query })
}
export function getCoupon(templateId) {
  return request({ url: '/fishing/coupon/' + templateId, method: 'get' })
}
export function addCoupon(data) {
  return request({ url: '/fishing/coupon', method: 'post', data })
}
export function updateCoupon(data) {
  return request({ url: '/fishing/coupon', method: 'put', data })
}
export function delCoupon(templateIds) {
  return request({ url: '/fishing/coupon/' + templateIds, method: 'delete' })
}
export function listUserCoupon(query) {
  return request({ url: '/fishing/coupon/user/list', method: 'get', params: query })
}
