import request from '@/utils/request'

export function summary() {
  return request({ url: '/fishing/dashboard/summary', method: 'get' })
}
export function orderTrend(days = 7) {
  return request({ url: '/fishing/dashboard/order-trend', method: 'get', params: { days } })
}
export function revenueTrend(days = 7) {
  return request({ url: '/fishing/dashboard/revenue-trend', method: 'get', params: { days } })
}
