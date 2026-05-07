import request from '@/utils/request'

export function listAd(query) {
  return request({ url: '/fishing/ad/list', method: 'get', params: query })
}
export function getAd(adId) {
  return request({ url: '/fishing/ad/' + adId, method: 'get' })
}
export function addAd(data) {
  return request({ url: '/fishing/ad', method: 'post', data })
}
export function updateAd(data) {
  return request({ url: '/fishing/ad', method: 'put', data })
}
export function delAd(adIds) {
  return request({ url: '/fishing/ad/' + adIds, method: 'delete' })
}
