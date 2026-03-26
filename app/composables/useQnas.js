/**
 * Q&A 목록 API composable
 * GET /api/v1/qnas - 문의 목록 조회
 */
export const useQnas = () => {
  const { get } = useApi()

  const qnas = ref([])
  const totalCount = ref(0)
  const totalPages = ref(0)
  const pending = ref(false)
  const error = ref(null)

  // 날짜 포맷 함수
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
  }

  /**
   * Q&A 목록 조회
   * @param {Object} params - 조회 파라미터
   * @param {number} params.productId - 상품 ID (선택)
   * @param {string} params.qnaType - 문의 유형 (PRODUCT, ORDER, GENERAL, SHIPPING, PAYMENT, MEMBERSHIP)
   * @param {number} params.page - 페이지 (0-based)
   * @param {number} params.size - 페이지 크기
   * @param {string} params.sort - 정렬 (예: createdAt,DESC)
   */
  const fetchQnas = async (params = {}) => {
    pending.value = true
    error.value = null

    try {
      const queryParams = new URLSearchParams()

      if (params.productId) {
        queryParams.append('productId', params.productId)
      }
      if (params.qnaType) {
        queryParams.append('qnaType', params.qnaType)
      }
      if (params.page !== undefined) {
        queryParams.append('page', params.page)
      }
      if (params.size) {
        queryParams.append('size', params.size)
      }
      if (params.sort) {
        queryParams.append('sort', params.sort)
      }

      const queryString = queryParams.toString()
      const url = queryString ? `/qnas?${queryString}` : '/qnas'

      const response = await get(url)
      const data = response.data || response

      // Q&A 데이터 변환
      qnas.value = (data.content || data.items || []).map(q => ({
        id: q.id,
        userId: q.userId,
        productId: q.productId,
        qnaType: q.qnaType,
        qnaTypeName: getQnaTypeName(q.qnaType),
        title: q.title,
        question: q.question,
        isSecret: q.isSecret,
        isAnswered: q.isAnswered,
        answer: q.answer,
        answeredAt: q.answeredAt ? formatDate(q.answeredAt) : null,
        date: formatDate(q.createdAt)
      }))

      totalCount.value = data.totalElements || data.total_elements || data.total || qnas.value.length
      totalPages.value = data.totalPages || data.total_pages || Math.ceil(totalCount.value / (params.size || 10))

      return {
        qnas: qnas.value,
        totalCount: totalCount.value,
        totalPages: totalPages.value
      }
    } catch (err) {
      console.error('Failed to fetch Q&A:', err)
      error.value = err.data?.message || err.message || 'Q&A를 불러오는데 실패했습니다.'
      throw err
    } finally {
      pending.value = false
    }
  }

  // Q&A 유형 한글명
  const getQnaTypeName = (type) => {
    const typeMap = {
      PRODUCT: '상품',
      ORDER: '주문',
      GENERAL: '일반',
      SHIPPING: '배송',
      PAYMENT: '결제',
      MEMBERSHIP: '회원'
    }
    return typeMap[type] || type || '문의'
  }

  /**
   * Q&A 작성
   * POST /qnas
   * @param {Object} payload
   * @param {number} [payload.productId] - 상품 ID (상품 문의 시)
   * @param {string} payload.qnaType - PRODUCT | ORDER | GENERAL | SHIPPING | PAYMENT | MEMBERSHIP
   * @param {string} payload.title - 제목
   * @param {string} payload.question - 문의 내용
   * @param {boolean} [payload.isSecret] - 비밀글 여부
   */
  const createQna = async (payload) => {
    const { post } = useApi()
    pending.value = true
    error.value = null

    try {
      const response = await post('/qnas', payload)
      return { success: true, data: response.data || response }
    } catch (err) {
      console.error('Failed to create Q&A:', err)
      const errorMessage = err.data?.error?.message
        || err.data?.message
        || err.message
        || 'Q&A 작성에 실패했습니다.'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      pending.value = false
    }
  }

  return {
    qnas,
    totalCount,
    totalPages,
    pending,
    error,
    fetchQnas,
    createQna,
    getQnaTypeName
  }
}
