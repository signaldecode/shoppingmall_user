/**
 * API Composable
 * 백엔드 API 호출을 위한 통합 composable
 */

// 토큰 갱신 상태 (모듈 레벨에서 공유)
let isRefreshing = false
let refreshPromise = null

export const useApi = () => {
  const config = useRuntimeConfig()

  // SSR에서 쿠키 전달을 위해 요청 헤더 가져오기 (composable 컨텍스트에서 호출)
  const cookieHeaders = import.meta.server ? useRequestHeaders(['cookie']) : {}

  // 테넌트 ID 헤더
  const tenantId = config.public.tenantId
  const tenantHeaders = tenantId ? { 'X-Tenant-Id': String(tenantId) } : {}

  /**
   * 엔드포인트 URL 생성
   * 클라이언트: /api 프록시 사용 (Safari 쿠키 문제 해결)
   * 서버(SSR): 직접 백엔드 호출
   * @param {string} endpoint - API 엔드포인트 (예: '/orders', '/products')
   */
  const buildUrl = (endpoint) => {
    if (import.meta.server) {
      // SSR: 서버에서 직접 백엔드 호출
      return `${config.apiBaseUrl}${endpoint}`
    }
    // 클라이언트: /api 프록시 사용
    return `${config.public.apiBase}${endpoint}`
  }

  /**
   * 토큰 갱신
   */
  const refreshToken = async () => {
    // 이미 갱신 중이면 기존 Promise 반환 (중복 호출 방지)
    if (isRefreshing) {
      return refreshPromise
    }

    isRefreshing = true
    refreshPromise = $fetch(buildUrl('/auth/refresh'), {
      method: 'POST',
      credentials: 'include'
    })
      .then((res) => {
        isRefreshing = false
        refreshPromise = null
        return res
      })
      .catch((err) => {
        isRefreshing = false
        refreshPromise = null
        throw err
      })

    return refreshPromise
  }

  /**
   * 세션 만료 처리
   */
  const handleSessionExpired = (message) => {
    if (import.meta.client) {
      const authStore = useAuthStore()
      authStore.setSessionExpired(message)
    }
  }

  /**
   * 기본 fetch wrapper
   * @param {string} endpoint - API 엔드포인트 (예: '/orders', '/products')
   * @param {object} options - fetch 옵션
   * @param {boolean} isRetry - 재시도 여부 (내부용)
   */
  const apiFetch = async (endpoint, options = {}, isRetry = false) => {
    const url = buildUrl(endpoint)

    // FormData일 때는 Content-Type 설정하지 않음 (브라우저가 자동 설정)
    const isFormData = options.body instanceof FormData
    const headers = isFormData
      ? { ...cookieHeaders, ...tenantHeaders, ...options.headers }
      : { 'Content-Type': 'application/json', ...cookieHeaders, ...tenantHeaders, ...options.headers }

    try {
      return await $fetch(url, {
        credentials: 'include',
        ...options,
        headers
      })
    } catch (error) {
      // 클라이언트에서만 토큰 갱신 처리
      if (import.meta.client && !isRetry) {
        const authStore = useAuthStore()
        const wasLoggedIn = authStore.isLoggedIn // 에러 발생 전 로그인 상태 확인
        const status = error?.statusCode || error?.data?.statusCode || error?.response?.status || error?.status
        const errorCode = error?.data?.data?.error?.code || error?.response?._data?.data?.error?.code

        // 401 + AUTH_016 (액세스 토큰 만료/없음) + 기존 로그인 상태 → refresh 시도
        // 비로그인 상태에서 발생한 401은 정상 (모달 표시 안 함)
        if (status === 401 && errorCode === 'AUTH_016' && wasLoggedIn) {
          try {
            await refreshToken()
            // 갱신 성공 시 원래 요청 재시도
            return await apiFetch(endpoint, options, true)
          } catch (refreshError) {
            // 갱신 실패 시 세션 만료 처리 (AUTH_002: 리프레시 토큰도 만료)
            const message = refreshError?.data?.data?.error?.message
              || refreshError?.response?._data?.data?.error?.message
              || '세션이 만료되었습니다.'
            handleSessionExpired(message)
          }
        }

        // 401 + AUTH_002 (토큰 만료) + 기존 로그인 상태 → 바로 세션 만료 처리
        if (status === 401 && errorCode === 'AUTH_002' && wasLoggedIn) {
          const message = error?.data?.data?.error?.message
            || error?.response?._data?.data?.error?.message
            || '세션이 만료되었습니다.'
          handleSessionExpired(message)
        }
      }

      throw error
    }
  }

  /**
   * GET 요청
   * @param {string} endpoint - API 엔드포인트
   * @param {object} params - 쿼리 파라미터
   */
  const get = async (endpoint, params = {}) => {
    return await apiFetch(endpoint, {
      method: 'GET',
      params
    })
  }

  /**
   * POST 요청
   * @param {string} endpoint - API 엔드포인트
   * @param {object} body - 요청 바디
   */
  const post = async (endpoint, body = {}) => {
    return await apiFetch(endpoint, {
      method: 'POST',
      body
    })
  }

  /**
   * PUT 요청
   * @param {string} endpoint - API 엔드포인트
   * @param {object} body - 요청 바디
   */
  const put = async (endpoint, body = {}) => {
    return await apiFetch(endpoint, {
      method: 'PUT',
      body
    })
  }

  /**
   * PATCH 요청
   * @param {string} endpoint - API 엔드포인트
   * @param {object} body - 요청 바디
   */
  const patch = async (endpoint, body = {}) => {
    return await apiFetch(endpoint, {
      method: 'PATCH',
      body
    })
  }

  /**
   * DELETE 요청
   * @param {string} endpoint - API 엔드포인트
   */
  const del = async (endpoint) => {
    return await apiFetch(endpoint, {
      method: 'DELETE'
    })
  }

  /**
   * useAsyncData wrapper - SSR/SSG 지원
   * @param {string} key - 고유 키
   * @param {string} endpoint - API 엔드포인트
   * @param {object} params - 쿼리 파라미터
   * @param {object} options - useAsyncData 옵션
   */
  const useApiData = (key, endpoint, params = {}, options = {}) => {
    return useAsyncData(key, () => get(endpoint, params), { lazy: true, ...options })
  }

  /**
   * useLazyAsyncData wrapper - Lazy loading
   * @param {string} key - 고유 키
   * @param {string} endpoint - API 엔드포인트
   * @param {object} params - 쿼리 파라미터
   * @param {object} options - useLazyAsyncData 옵션
   */
  const useLazyApiData = (key, endpoint, params = {}, options = {}) => {
    return useLazyAsyncData(key, () => get(endpoint, params), options)
  }

  return {
    apiFetch,
    get,
    post,
    put,
    patch,
    del,
    useApiData,
    useLazyApiData
  }
}
