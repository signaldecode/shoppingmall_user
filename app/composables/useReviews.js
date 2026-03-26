/**
 * 리뷰 목록 API 호출 composable
 * GET /reviews - 전체 리뷰 목록 조회
 */
export const useReviews = () => {
  const { get } = useApi()

  const reviews = ref([])
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
   * 리뷰 목록 조회
   * @param {Object} params - 조회 파라미터
   * @param {number} params.categoryId - 카테고리 ID (선택)
   * @param {string} params.sort - 정렬 (LATEST, RATING, HELPFUL)
   * @param {number} params.page - 페이지 (0-based)
   * @param {number} params.size - 페이지 크기
   */
  const fetchReviews = async (params = {}) => {
    pending.value = true
    error.value = null

    try {
      const queryParams = new URLSearchParams()

      if (params.categoryId) {
        queryParams.append('categoryId', params.categoryId)
      }
      if (params.sort) {
        queryParams.append('sort', params.sort)
      }
      if (params.page !== undefined) {
        queryParams.append('page', params.page)
      }
      if (params.size) {
        queryParams.append('size', params.size)
      }

      const queryString = queryParams.toString()
      const url = queryString ? `/reviews?${queryString}` : '/reviews'

      const response = await get(url)
      const data = response.data || response

      // 리뷰 데이터 변환
      reviews.value = (data.content || data.items || []).map(r => ({
        id: r.id,
        rating: r.rating,
        scoreText: r.rating ? `${r.rating}.0` : '0.0',
        title: r.title,
        content: r.content,
        images: r.images || [],
        username: r.userName || '익명',
        date: formatDate(r.createdAt),
        isPhoto: r.images && r.images.length > 0,
        isBest: r.isBest,
        isVerifiedPurchase: r.isVerifiedPurchase,
        helpfulCount: r.helpfulCount || 0,
        adminReply: r.adminReply,
        adminRepliedAt: r.adminRepliedAt ? formatDate(r.adminRepliedAt) : null,
        // 상품 정보 (ReviewGridCard 포맷) - flat 구조에서 변환
        product: r.productId ? {
          id: r.productId,
          name: r.productName,
          thumb: r.productThumbnailUrl || '',
          rating: r.productAverageRating || 0,
          reviewCountText: r.productReviewCount ? `${r.productReviewCount}건` : ''
        } : null,
        // 카테고리 정보
        categoryId: r.categoryId,
        categoryName: r.categoryName
      }))

      totalCount.value = data.totalElements || data.total_elements || data.total || reviews.value.length
      totalPages.value = data.totalPages || data.total_pages || Math.ceil(totalCount.value / (params.size || 10))

      return {
        reviews: reviews.value,
        totalCount: totalCount.value,
        totalPages: totalPages.value
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err)
      error.value = err.data?.message || err.message || '리뷰를 불러오는데 실패했습니다.'
      throw err
    } finally {
      pending.value = false
    }
  }

  /**
   * 리뷰 작성
   * POST /products/{productId}/reviews (multipart/form-data)
   * @param {number} productId - 상품 ID
   * @param {Object} reviewData - { rating, title, content }
   * @param {Array} imageFiles - 이미지 파일 배열
   */
  const createReview = async (productId, reviewData, imageFiles = []) => {
    const { apiFetch } = useApi()
    pending.value = true
    error.value = null

    try {
      const formData = new FormData()

      const reviewPayload = {
        rating: reviewData.rating,
        title: reviewData.title || null,
        content: reviewData.content
      }
      formData.append('review', new Blob([JSON.stringify(reviewPayload)], { type: 'application/json' }))

      imageFiles.forEach((file) => {
        const f = file instanceof File ? file : file.file
        if (f) formData.append('images', f)
      })

      const response = await apiFetch(`/products/${productId}/reviews`, {
        method: 'POST',
        body: formData
      })

      return { success: true, data: response.data || response }
    } catch (err) {
      console.error('Failed to create review:', err)
      const errorMessage = err.data?.error?.message
        || err.data?.message
        || err.message
        || '리뷰 작성에 실패했습니다.'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      pending.value = false
    }
  }

  return {
    reviews,
    totalCount,
    totalPages,
    pending,
    error,
    fetchReviews,
    createReview
  }
}
