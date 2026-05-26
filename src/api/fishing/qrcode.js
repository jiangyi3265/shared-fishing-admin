import request from '@/utils/request'

export function listQrcode(query) {
  return request({ url: '/fishing/qrcode/list', method: 'get', params: query })
}
export function getQrcode(qrId) {
  return request({ url: '/fishing/qrcode/' + qrId, method: 'get' })
}
export function addQrcode(data) {
  return request({ url: '/fishing/qrcode', method: 'post', data })
}
export function updateQrcode(data) {
  return request({ url: '/fishing/qrcode', method: 'put', data })
}
export function delQrcode(qrId) {
  return request({ url: '/fishing/qrcode/' + qrId, method: 'delete' })
}
export function getWxaCode(qrId, params) {
  return request({ url: '/fishing/qrcode/wxacode/' + qrId, method: 'get', params, responseType: 'blob' })
}
