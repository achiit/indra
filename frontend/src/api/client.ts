import axios from 'axios'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000,
  withCredentials: true,
})

client.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('indra-auth-storage')
    if (raw) {
      const state = JSON.parse(raw).state
      if (state && state.token) {
        config.headers.Authorization = `Bearer ${state.token}`
      }
    }
  } catch (e) {
    // skip
  }
  return config
})

export default client
export { USE_MOCK }
