import request from '@/utils/request'

export function listSpot(query) { return request({ url: '/fishing/spot/list', method: 'get', params: query }) }
export function getSpot(id) { return request({ url: '/fishing/spot/' + id, method: 'get' }) }
export function addSpot(data) { return request({ url: '/fishing/spot', method: 'post', data }) }
export function updateSpot(data) { return request({ url: '/fishing/spot', method: 'put', data }) }
export function delSpot(ids) { return request({ url: '/fishing/spot/' + ids, method: 'delete' }) }

export function listReservation(query) { return request({ url: '/fishing/reservation/list', method: 'get', params: query }) }
export function confirmReservation(id) { return request({ url: '/fishing/reservation/confirm/' + id, method: 'put' }) }
export function cancelReservation(id, reason) { return request({ url: '/fishing/reservation/cancel/' + id, method: 'put', params: { reason } }) }
