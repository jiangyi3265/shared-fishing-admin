import request from '@/utils/request'

export function listPlan(query) {
  return request({ url: '/fishing/rechargePlan/list', method: 'get', params: query })
}
export function getPlan(planId) {
  return request({ url: '/fishing/rechargePlan/' + planId, method: 'get' })
}
export function addPlan(data)    { return request({ url: '/fishing/rechargePlan', method: 'post', data }) }
export function updatePlan(data) { return request({ url: '/fishing/rechargePlan', method: 'put', data }) }
export function delPlan(ids)     { return request({ url: '/fishing/rechargePlan/' + ids, method: 'delete' }) }
