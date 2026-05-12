import request from '@/utils/request'

export function listCatch(query) { return request({ url: '/fishing/catch/list', method: 'get', params: query }) }
export function getCatch(id) { return request({ url: '/fishing/catch/' + id, method: 'get' }) }
export function auditCatch(data) { return request({ url: '/fishing/catch/audit', method: 'put', data }) }
export function featureCatch(data) { return request({ url: '/fishing/catch/feature', method: 'put', data }) }
export function delCatch(ids) { return request({ url: '/fishing/catch/' + ids, method: 'delete' }) }
