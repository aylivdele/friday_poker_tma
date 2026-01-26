function handleResponse(response: Response) {
  if (!response.ok) {
    return Promise.reject(response.json())
  }
  return response.json()
}

function getDefaultHeaders() {
  return {
    // @ts-expect-error should be injected by Telegram app
    'x-init-data': window.Telegram?.WebApp?.initData || '',
  }
}

export const api = {
  get: async <T>(url: string): Promise<T> => {
    const response = await fetch(url, { headers: getDefaultHeaders() })
    return handleResponse(response)
  },
  post: async <T>(url: string, body: any): Promise<T> => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...getDefaultHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    return handleResponse(response)
  },
}
