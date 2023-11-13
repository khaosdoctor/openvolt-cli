const defaultHeaders = {
  'Content-Type': 'application/json',
}

export function fetchClientFactory(baseUrl: string, globalOptions: RequestInit = {}) {
  const throwError = async (endpoint: string, res: Response) => {
    throw new Error(`Error in request: ${endpoint}: [${res.status}] ${JSON.stringify(await res.json(), null, 2)}`)
  }
  return {
    get: async <T>(endpoint: string): Promise<T> => {
      const res = await fetch(`${baseUrl}${endpoint}`, { ...globalOptions, method: 'GET' })
      if (!res.ok) return throwError(endpoint, res)
      return res.json()
    },
    post: async <T>(endpoint: string, body: unknown): Promise<T> => {
      const res = await fetch(`${baseUrl}${endpoint}`, {
        headers: { ...defaultHeaders, ...globalOptions.headers },
        method: 'POST',
        body: JSON.stringify(body),
        ...globalOptions,
      })
      if (!res.ok) return throwError(endpoint, res)
      return res.json()
    },
    put: async <T>(endpoint: string, body: unknown): Promise<T> => {
      const res = await fetch(`${baseUrl}${endpoint}`, {
        headers: { ...defaultHeaders, ...globalOptions.headers },
        method: 'PUT',
        body: JSON.stringify(body),
        ...globalOptions,
      })
      if (!res.ok) return throwError(endpoint, res)
      return res.json()
    },
    delete: async <T>(endpoint: string): Promise<T> => {
      const res = await fetch(`${baseUrl}${endpoint}`, { ...globalOptions, method: 'DELETE' })
      if (!res.ok) return throwError(endpoint, res)
      return res.json()
    },
    patch: async <T>(endpoint: string, body: unknown): Promise<T> => {
      const res = await fetch(`${baseUrl}${endpoint}`, {
        headers: { ...defaultHeaders, ...globalOptions.headers },
        method: 'PATCH',
        body: JSON.stringify(body),
        ...globalOptions,
      })
      if (!res.ok) return throwError(endpoint, res)
      return res.json()
    },
  }
}
