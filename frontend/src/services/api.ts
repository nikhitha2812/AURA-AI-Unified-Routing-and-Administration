export const API_BASE_URL = '/api';

export class ApiClient {
  private static getToken(): string | null {
    return localStorage.getItem('aura_access_token');
  }

  static async request(endpoint: string, options: RequestInit = {}, isRetry = false): Promise<any> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && !isRetry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      const refreshToken = localStorage.getItem('aura_refresh_token');
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            localStorage.setItem('aura_access_token', data.accessToken);
            localStorage.setItem('aura_refresh_token', data.refreshToken);
            // Retry original request with new token
            return this.request(endpoint, options, true);
          }
        } catch (e) {
          // Ignore
        }
      }

      // If refresh failed or unavailable, clear storage
      localStorage.removeItem('aura_access_token');
      localStorage.removeItem('aura_refresh_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! Status: ${response.status}`);
    }

    return data;
  }

  static async uploadFile(endpoint: string, file: File, extraFields: Record<string, string> = {}) {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(extraFields).forEach(([key, val]) => formData.append(key, val));

    return this.request(endpoint, {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * Stream SSE helper for AI Chat Gateway
   */
  static async streamChat(
    payload: { prompt: string; conversationId?: string; mode?: string; modelId?: string },
    onMetadata: (meta: any) => void,
    onDelta: (delta: string) => void,
    onDone: (data: any) => void,
    onError: (errStr: string) => void
  ) {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...payload, stream: true }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      onError(errJson.error || `HTTP ${response.status} Request Failed`);
      return;
    }

    if (!response.body) {
      onError('Response stream unavailable.');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunkStr = decoder.decode(value, { stream: true });
      const lines = chunkStr.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(line.substring(6));
            if (parsed.type === 'metadata') {
              onMetadata(parsed);
            } else if (parsed.type === 'content') {
              onDelta(parsed.delta);
            } else if (parsed.type === 'done') {
              onDone(parsed);
            } else if (parsed.type === 'error') {
              onError(parsed.error);
            }
          } catch (e) {
            // parse line error ignore
          }
        }
      }
    }
  }
}
