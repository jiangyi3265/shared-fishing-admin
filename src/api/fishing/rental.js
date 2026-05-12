import request from '@/utils/request'

export function listRentalGoods(query) { return request({ url: '/fishing/rental/goods/list', method: 'get', params: query }) }
export function getRentalGoods(id) { return request({ url: '/fishing/rental/goods/' + id, method: 'get' }) }
export function addRentalGoods(data) { return request({ url: '/fishing/rental/goods', method: 'post', data }) }
export function updateRentalGoods(data) { return request({ url: '/fishing/rental/goods', method: 'put', data }) }
export function delRentalGoods(ids) { return request({ url: '/fishing/rental/goods/' + ids, method: 'delete' }) }

export function listRentalOrder(query) { return request({ url: '/fishing/rental/order/list', method: 'get', params: query }) }
export function confirmReturn(id) { return request({ url: '/fishing/rental/order/return/' + id, method: 'put' }) }
export function forfeitDeposit(id, remark) { return request({ url: '/fishing/rental/order/forfeit/' + id, method: 'put', params: { remark } }) }
