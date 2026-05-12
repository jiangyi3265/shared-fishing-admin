import request from '@/utils/request'

export function listCompetition(query) { return request({ url: '/fishing/competition/list', method: 'get', params: query }) }
export function getCompetition(id) { return request({ url: '/fishing/competition/' + id, method: 'get' }) }
export function addCompetition(data) { return request({ url: '/fishing/competition', method: 'post', data }) }
export function updateCompetition(data) { return request({ url: '/fishing/competition', method: 'put', data }) }
export function changeCompStatus(id, status) { return request({ url: '/fishing/competition/status/' + id + '/' + status, method: 'put' }) }
export function weighEntry(data) { return request({ url: '/fishing/competition/weigh', method: 'put', data }) }
export function settleCompetition(id) { return request({ url: '/fishing/competition/settle/' + id, method: 'post' }) }
