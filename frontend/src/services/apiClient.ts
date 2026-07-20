import { auth } from '../firebase/config'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const user = auth.currentUser
  if (!user) {
    throw new Error('User not authenticated')
  }

  const token = await user.getIdToken()
  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)
  
  if (!headers.has('X-Correlation-ID')) {
    headers.set('X-Correlation-ID', crypto.randomUUID())
  }

  return fetchApi(endpoint, {
    ...options,
    headers,
  })
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Request failed with status ${response.status}`)
  }

  return response.json()
}


