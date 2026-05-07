import request from '@/utils/request'

export function listRule(query) {
  return request({ url: '/fishing/rule/list', method: 'get', params: query })
}
export function getRule(ruleId) {
  return request({ url: '/fishing/rule/' + ruleId, method: 'get' })
}
export function addRule(data) {
  return request({ url: '/fishing/rule', method: 'post', data })
}
export function updateRule(data) {
  return request({ url: '/fishing/rule', method: 'put', data })
}
export function delRule(ruleIds) {
  return request({ url: '/fishing/rule/' + ruleIds, method: 'delete' })
}
