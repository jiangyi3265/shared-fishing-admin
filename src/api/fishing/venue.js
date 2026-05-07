import request from '@/utils/request'

export function listVenue(query) {
  return request({ url: '/fishing/venue/list', method: 'get', params: query })
}
export function getVenue(venueId) {
  return request({ url: '/fishing/venue/' + venueId, method: 'get' })
}
export function addVenue(data) {
  return request({ url: '/fishing/venue', method: 'post', data })
}
export function updateVenue(data) {
  return request({ url: '/fishing/venue', method: 'put', data })
}
export function delVenue(venueIds) {
  return request({ url: '/fishing/venue/' + venueIds, method: 'delete' })
}
