import request from '@/utils/request'

export function listPointsGoods(query) { return request({ url: '/fishing/points/goods/list', method: 'get', params: query }) }
export function getPointsGoods(id) { return request({ url: '/fishing/points/goods/' + id, method: 'get' }) }
export function addPointsGoods(data) { return request({ url: '/fishing/points/goods', method: 'post', data }) }
export function updatePointsGoods(data) { return request({ url: '/fishing/points/goods', method: 'put', data }) }
export function delPointsGoods(ids) { return request({ url: '/fishing/points/goods/' + ids, method: 'delete' }) }

export function listPointsExchange(query) { return request({ url: '/fishing/points/exchange/list', method: 'get', params: query }) }
export function deliverExchange(id) { return request({ url: '/fishing/points/exchange/deliver/' + id, method: 'put' }) }
