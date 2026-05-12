import request from '@/utils/request'

export function listMallCategory(query) {
  return request({ url: '/fishing/mallCategory/list', method: 'get', params: query })
}
export function getMallCategory(catId) {
  return request({ url: '/fishing/mallCategory/' + catId, method: 'get' })
}
export function addMallCategory(data) {
  return request({ url: '/fishing/mallCategory', method: 'post', data })
}
export function updateMallCategory(data) {
  return request({ url: '/fishing/mallCategory', method: 'put', data })
}
export function delMallCategory(catIds) {
  return request({ url: '/fishing/mallCategory/' + catIds, method: 'delete' })
}
