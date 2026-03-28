import client from './client'
import type { User } from '@/types/indra'

interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export const loginApi = async (email: string, password: string): Promise<AuthResponse> => {
  const res = await client.post('/api/auth/login', { email, password })
  return res.data
}

export const signupApi = async (name: string, email: string, password: string): Promise<AuthResponse> => {
  const res = await client.post('/api/auth/signup', { name, email, password })
  return res.data
}

export const fetchMeApi = async (): Promise<User> => {
  const res = await client.get('/api/auth/me')
  return res.data
}
