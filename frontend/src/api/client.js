import axios from 'axios'

// Use environment variable for API URL, fallback to proxy in development
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : '/api',
})

export const getPCs = async () => {
  const { data } = await api.get('/pcs')
  return data
}

export const getSessions = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.status) params.append('status', filters.status)
  if (filters.pcId) params.append('pcId', filters.pcId)
  if (filters.user) params.append('user', filters.user)
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.append('dateTo', filters.dateTo)

  const { data } = await api.get(`/sessions?${params.toString()}`)
  return data
}

export const updateSession = async (sessionId, updates) => {
  const { data } = await api.patch(`/sessions/${sessionId}`, updates)
  return data
}

export const closeSession = async (sessionId) => {
  const { data } = await api.post(`/sessions/${sessionId}/close`)
  return data
}

// Beverage API calls
export const getBeverages = async () => {
  const { data } = await api.get('/beverages')
  return data
}

export const createBeverage = async (beverage) => {
  const { data } = await api.post('/beverages', beverage)
  return data
}

export const updateBeverage = async (beverageId, updates) => {
  const { data } = await api.patch(`/beverages/${beverageId}`, updates)
  return data
}

export const deleteBeverage = async (beverageId) => {
  const { data } = await api.delete(`/beverages/${beverageId}`)
  return data
}

export default api
