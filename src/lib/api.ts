import { retrieveRawInitData } from '@tma.js/sdk-react'
import { ApiError } from './errors'
import { isTelegram } from './platform'

function authHeaders(): Record<string, string> {
  if (!isTelegram()) {
    return {}
  }
  try {
    const raw = retrieveRawInitData()
    return raw ? { 'x-init-data': raw } : {}
  }
  catch {
    return {}
  }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = authHeaders()
  const init: RequestInit = { method, headers }
  if (method !== 'GET') {
    headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body ?? {})
  }

  let response: Response
  try {
    response = await fetch(url, init)
  }
  catch {
    throw new ApiError(0, 'Нет соединения с сервером')
  }

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(response.status, data?.error ?? `Ошибка сервера (${response.status})`)
  }
  return data as T
}

export const api = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, body),
  put: <T>(url: string, body?: unknown) => request<T>('PUT', url, body),
  patch: <T>(url: string, body?: unknown) => request<T>('PATCH', url, body),
  delete: <T>(url: string, body?: unknown) => request<T>('DELETE', url, body),
}
