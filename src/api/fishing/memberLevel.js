import request from '@/utils/request'

export function listMemberLevel(query) { return request({ url: '/fishing/memberLevel/list', method: 'get', params: query }) }
export function getMemberLevel(id) { return request({ url: '/fishing/memberLevel/' + id, method: 'get' }) }
export function addMemberLevel(data) { return request({ url: '/fishing/memberLevel', method: 'post', data }) }
export function updateMemberLevel(data) { return request({ url: '/fishing/memberLevel', method: 'put', data }) }
export function delMemberLevel(ids) { return request({ url: '/fishing/memberLevel/' + ids, method: 'delete' }) }
