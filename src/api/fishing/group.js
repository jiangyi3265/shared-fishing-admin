import request from '@/utils/request'

export function listGroup(query) { return request({ url: '/fishing/group/list', method: 'get', params: query }) }
export function getGroup(id) { return request({ url: '/fishing/group/' + id, method: 'get' }) }
export function cancelGroup(id) { return request({ url: '/fishing/group/cancel/' + id, method: 'put' }) }
