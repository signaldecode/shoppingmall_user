/**
 * 배송 추적 API composable
 * GET /shipments/orders/{orderId}          - 배송 정보 조회
 * GET /shipments/orders/{orderId}/tracking - 배송 추적 상세
 */
export const useShipment = () => {
  const { get } = useApi()

  const shipment = ref(null)
  const tracking = ref(null)
  const pending = ref(false)
  const error = ref(null)

  /**
   * 배송 정보 조회 (간단)
   * GET /shipments/orders/{orderId}
   * @param {number|string} orderId
   */
  const fetchShipment = async (orderId) => {
    pending.value = true
    error.value = null

    try {
      const response = await get(`/shipments/orders/${orderId}`)
      shipment.value = response.data || response
      return shipment.value
    } catch (err) {
      console.error('Failed to fetch shipment:', err)
      error.value = err.data?.message || err.message || '배송 정보를 불러오는데 실패했습니다.'
      throw err
    } finally {
      pending.value = false
    }
  }

  /**
   * 배송 추적 상세 조회 (추적 이력 포함)
   * GET /shipments/orders/{orderId}/tracking
   * @param {number|string} orderId
   */
  const fetchTracking = async (orderId) => {
    pending.value = true
    error.value = null

    try {
      const response = await get(`/shipments/orders/${orderId}/tracking`)
      const data = response.data || response
      shipment.value = data
      tracking.value = data.trackingHistory || data.tracking || []
      return data
    } catch (err) {
      console.error('Failed to fetch tracking:', err)
      error.value = err.data?.message || err.message || '배송 추적 정보를 불러오는데 실패했습니다.'
      throw err
    } finally {
      pending.value = false
    }
  }

  /**
   * 배송 상태 한글 매핑
   */
  const getStatusText = (status) => {
    const statusMap = {
      READY: '배송준비',
      PICKED_UP: '집하',
      IN_TRANSIT: '배송중',
      OUT_FOR_DELIVERY: '배달출발',
      DELIVERED: '배송완료'
    }
    return statusMap[status] || status || '-'
  }

  return {
    shipment,
    tracking,
    pending,
    error,
    fetchShipment,
    fetchTracking,
    getStatusText
  }
}
