import { api } from '@/lib/client'

export function swrGetFetcher<T>(url: string): Promise<T> {
  return api.get<T>(url)
}
