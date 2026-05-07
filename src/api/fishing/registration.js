import request from '@/utils/request'

export function listRegistration(query) {
  return request({ url: '/fishing/registration/list', method: 'get', params: query })
}
export function getRegistration(regId) {
  return request({ url: '/fishing/registration/' + regId, method: 'get' })
}
