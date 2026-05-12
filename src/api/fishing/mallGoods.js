import request from '@/utils/request'

export function listMallGoods(query) {
  return request({ url: '/fishing/mallGoods/list', method: 'get', params: query })
}
export function getMallGoods(goodsId) {
  return request({ url: '/fishing/mallGoods/' + goodsId, method: 'get' })
}
export function addMallGoods(data) {
  return request({ url: '/fishing/mallGoods', method: 'post', data })
}
export function updateMallGoods(data) {
  return request({ url: '/fishing/mallGoods', method: 'put', data })
}
export function toggleMallGoods(goodsId, status) {
  return request({ url: '/fishing/mallGoods/status/' + goodsId, method: 'put', data: { status } })
}
export function delMallGoods(goodsIds) {
  return request({ url: '/fishing/mallGoods/' + goodsIds, method: 'delete' })
}
