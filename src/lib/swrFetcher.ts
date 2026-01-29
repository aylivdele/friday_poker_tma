import { api } from '@/lib/api'

export function swrGetFetcher<T>(url: string): Promise<T> {
  return api.get<T>(url)
}
