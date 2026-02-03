import { retrieveRawInitData } from '@tma.js/sdk-react'

function handleResponse(response: Response) {
  if (!response.ok) {
    return Promise.reject(response.json())
  }
  return response.json()
}

function getDefaultHeaders() {
  return {
    'x-init-data': retrieveRawInitData() ?? '',
  }
}

export const api = {
  get: async <T>(url: string): Promise<T> => {
    const response = await fetch(url, { headers: getDefaultHeaders() })
    return handleResponse(response)
  },
  delete: async <T>(url: string): Promise<T> => {
    const response = await fetch(url, { headers: getDefaultHeaders(), method: 'DELETE' })
    return handleResponse(response)
  },
  post: async <T>(url: string, body?: any): Promise<T> => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...getDefaultHeaders(),
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    return handleResponse(response)
  },
  put: async <T>(url: string, body?: any): Promise<T> => {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        ...getDefaultHeaders(),
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    return handleResponse(response)
  },
}
