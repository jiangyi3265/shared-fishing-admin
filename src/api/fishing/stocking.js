import request from '@/utils/request'

export function listStocking(query) {
  return request({ url: '/fishing/stocking/list', method: 'get', params: query })
}
export function getStocking(recordId) {
  return request({ url: '/fishing/stocking/' + recordId, method: 'get' })
}
export function addStocking(data) {
  return request({ url: '/fishing/stocking', method: 'post', data })
}
export function updateStocking(data) {
  return request({ url: '/fishing/stocking', method: 'put', data })
}
export function delStocking(recordIds) {
  return request({ url: '/fishing/stocking/' + recordIds, method: 'delete' })
}
