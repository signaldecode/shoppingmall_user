/**
 * 프로모션 API composable
 * GET /promotions      - 활성 프로모션 목록
 * GET /promotions/{id} - 프로모션 상세
 */
export const usePromotion = () => {
  const { get } = useApi()

  const promotions = ref([])
  const promotion = ref(null)
  const pending = ref(false)
  const error = ref(null)

  /**
   * 활성 프로모션 목록 조회
   * GET /promotions
   */
  const fetchPromotions = async () => {
    pending.value = true
    error.value = null

    try {
      const response = await get('/promotions')
      promotions.value = response.data || response || []
      return promotions.value
    } catch (err) {
      console.error('Failed to fetch promotions:', err)
      error.value = err.data?.message || err.message
      throw err
    } finally {
      pending.value = false
    }
  }

  /**
   * 프로모션 상세 조회
   * GET /promotions/{id}
   * @param {number} id
   */
  const fetchPromotion = async (id) => {
    pending.value = true
    error.value = null

    try {
      const response = await get(`/promotions/${id}`)
      promotion.value = response.data || response
      return promotion.value
    } catch (err) {
      console.error('Failed to fetch promotion:', err)
      error.value = err.data?.message || err.message
      throw err
    } finally {
      pending.value = false
    }
  }

  return {
    promotions,
    promotion,
    pending,
    error,
    fetchPromotions,
    fetchPromotion
  }
}
