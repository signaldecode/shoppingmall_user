/**
 * API Proxy
 * Safari HTTP localhost 환경에서 Secure; SameSite=None 쿠키 문제 해결
 * 모든 /api/** 요청을 백엔드로 프록시하고 Set-Cookie 헤더 수정
 */

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiBaseUrl = config.apiBaseUrl

  if (!apiBaseUrl) {
    throw createError({
      statusCode: 500,
      message: 'API_BASE_URL 환경변수가 설정되지 않았습니다.'
    })
  }

  // catch-all param 처리
  const pathParam = event.context.params?._ || ''
  const path = Array.isArray(pathParam) ? pathParam.join('/') : pathParam
  const targetUrl = `${apiBaseUrl}/${path}`

  // 원본 요청 정보
  const method = getMethod(event)
  const query = getQuery(event)
  const headers = getHeaders(event)

  // Content-Type 확인
  const contentType = headers['content-type'] || ''
  const isMultipart = contentType.includes('multipart/form-data')

  // body 가져오기 (GET, HEAD 제외)
  let body = null
  if (!['GET', 'HEAD'].includes(method)) {
    if (isMultipart) {
      // multipart/form-data는 raw body로 전달 (파일 데이터 보존)
      body = await readRawBody(event, false)
    } else {
      body = await readBody(event)
    }
  }

  // 요청 헤더 구성 (multipart는 원본 Content-Type 유지 - boundary 포함)
  const requestHeaders = {}
  if (contentType) {
    requestHeaders['Content-Type'] = contentType
  }
  if (headers.cookie) {
    requestHeaders.cookie = headers.cookie
  }
  if (headers.authorization) {
    requestHeaders.authorization = headers.authorization
  }
  if (headers['x-session-id']) {
    requestHeaders['x-session-id'] = headers['x-session-id']
  }
  // 테넌트 ID (멀티테넌트 지원) - 런타임 설정에서 항상 추가
  const tenantId = headers['x-tenant-id'] || config.public?.tenantId
  if (tenantId) {
    requestHeaders['x-tenant-id'] = String(tenantId)
  }

  try {
    const response = await $fetch.raw(targetUrl, {
      method,
      query,
      body,
      headers: requestHeaders,
      credentials: 'include'
    })

    // Set-Cookie 헤더 수정 (Safari 쿠키 문제 해결)
    const setCookieHeaders = response.headers.getSetCookie?.() || []

    for (const cookie of setCookieHeaders) {
      const modifiedCookie = cookie
        .replace(/;\s*Secure/gi, '')
        .replace(/SameSite=None/gi, 'SameSite=Lax')
        .replace(/Path=\/api[^;]*/gi, 'Path=/')  // /api/v1, /api/auth 등 모두 처리
        .replace(/Domain=[^;]+;?/gi, '')  // 도메인 제거 (현재 도메인 사용)

      appendResponseHeader(event, 'Set-Cookie', modifiedCookie)
    }

    return response._data
  } catch (error) {
    const statusCode = error.response?.status || 500
    const errorData = error.data || { message: error.message }

    // 에러 응답의 Set-Cookie도 처리
    const setCookieHeaders = error.response?.headers?.getSetCookie?.() || []
    for (const cookie of setCookieHeaders) {
      const modifiedCookie = cookie
        .replace(/;\s*Secure/gi, '')
        .replace(/SameSite=None/gi, 'SameSite=Lax')
        .replace(/Path=\/api[^;]*/gi, 'Path=/')  // /api/v1, /api/auth 등 모두 처리
        .replace(/Domain=[^;]+;?/gi, '')

      appendResponseHeader(event, 'Set-Cookie', modifiedCookie)
    }

    throw createError({
      statusCode,
      data: errorData
    })
  }
})
