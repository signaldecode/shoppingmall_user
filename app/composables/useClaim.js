/**
 * 클레임(반품/교환) API composable
 * POST   /claims                     - 클레임 신청
 * POST   /claims/estimate-refund     - 환불 예상 금액 조회
 * GET    /claims/{claimId}           - 클레임 상세 조회
 * DELETE /claims/{claimId}           - 클레임 취소
 * GET    /claims/orders/{orderNumber} - 주문별 클레임 목록
 * POST   /claims/guest               - 비회원 클레임 신청
 * POST   /claims/guest/estimate-refund - 비회원 환불 예상
 * POST   /claims/guest/lookup         - 비회원 클레임 조회
 * POST   /claims/guest/{claimId}      - 비회원 클레임 상세
 * POST   /claims/guest/{claimId}/cancel - 비회원 클레임 취소
 */
export const useClaim = () => {
  const { get, post, del } = useApi()

  const pending = ref(false)
  const error = ref(null)

  /**
   * 환불 예상 금액 조회
   * POST /claims/estimate-refund
   * @param {Object} payload
   * @param {number} payload.orderId - 주문 ID
   * @param {string} payload.claimType - RETURN | EXCHANGE
   * @param {Array} payload.items - [{ orderItemId, quantity }]
   */
  const estimateRefund = async (payload) => {
    pending.value = true
    error.value = null

    try {
      const response = await post('/claims/estimate-refund', payload)
      return { success: true, data: response.data || response }
    } catch (err) {
      const errorMessage = extractErrorMessage(err, '환불 예상 금액 조회에 실패했습니다.')
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      pending.value = false
    }
  }

  /**
   * 클레임 신청 (반품/교환)
   * POST /claims
   * @param {Object} payload
   * @param {number} payload.orderId - 주문 ID
   * @param {string} payload.claimType - RETURN | EXCHANGE
   * @param {string} payload.reasonType - DEFECT | WRONG_ITEM | CHANGED_MIND | SIZE_COLOR_ERROR
   * @param {string} payload.reason - 상세 사유
   * @param {Array} payload.items - [{ orderItemId, quantity, exchangeVariantId }]
   * @param {number} payload.estimatedRefundAmount - 예상 환불 금액
   * @param {string} [payload.refundMethod] - CARD_REFUND | BANK_TRANSFER | CREDIT
   * @param {string} [payload.bankName] - 은행명
   * @param {string} [payload.bankAccount] - 계좌번호
   * @param {string} [payload.bankHolder] - 예금주
   */
  const createClaim = async (payload) => {
    pending.value = true
    error.value = null

    try {
      const response = await post('/claims', payload)

      if (response.success) {
        return { success: true, data: response.data }
      }

      throw new Error(response.message || '클레임 신청에 실패했습니다.')
    } catch (err) {
      const errorMessage = extractErrorMessage(err, '클레임 신청 중 오류가 발생했습니다.')
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      pending.value = false
    }
  }

  /**
   * 클레임 상세 조회
   * GET /claims/{claimId}
   * @param {number} claimId
   */
  const getClaim = async (claimId) => {
    pending.value = true
    error.value = null

    try {
      const response = await get(`/claims/${claimId}`)
      return response.data || response
    } catch (err) {
      error.value = extractErrorMessage(err, '클레임 조회에 실패했습니다.')
      throw err
    } finally {
      pending.value = false
    }
  }

  /**
   * 클레임 취소
   * DELETE /claims/{claimId}
   * @param {number} claimId
   */
  const cancelClaim = async (claimId) => {
    pending.value = true
    error.value = null

    try {
      const response = await del(`/claims/${claimId}`)
      return { success: true, data: response.data || response }
    } catch (err) {
      const errorMessage = extractErrorMessage(err, '클레임 취소에 실패했습니다.')
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      pending.value = false
    }
  }

  /**
   * 주문별 클레임 목록 조회
   * GET /claims/orders/{orderNumber}
   * @param {string} orderNumber
   */
  const getClaimsByOrder = async (orderNumber) => {
    pending.value = true
    error.value = null

    try {
      const response = await get(`/claims/orders/${orderNumber}`)
      return response.data || response || []
    } catch (err) {
      error.value = extractErrorMessage(err, '클레임 목록 조회에 실패했습니다.')
      throw err
    } finally {
      pending.value = false
    }
  }

  // ─── 비회원 클레임 ───

  /**
   * 비회원 환불 예상 금액 조회
   * POST /claims/guest/estimate-refund
   */
  const guestEstimateRefund = async (payload) => {
    pending.value = true
    error.value = null

    try {
      const response = await post('/claims/guest/estimate-refund', payload)
      return { success: true, data: response.data || response }
    } catch (err) {
      const errorMessage = extractErrorMessage(err, '환불 예상 금액 조회에 실패했습니다.')
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      pending.value = false
    }
  }

  /**
   * 비회원 클레임 신청
   * POST /claims/guest
   */
  const createGuestClaim = async (payload) => {
    pending.value = true
    error.value = null

    try {
      const response = await post('/claims/guest', payload)
      return { success: true, data: response.data || response }
    } catch (err) {
      const errorMessage = extractErrorMessage(err, '클레임 신청에 실패했습니다.')
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      pending.value = false
    }
  }

  /**
   * 비회원 클레임 목록 조회
   * POST /claims/guest/lookup
   * @param {string} orderNumber
   * @param {string} password
   */
  const guestClaimLookup = async (orderNumber, password) => {
    pending.value = true
    error.value = null

    try {
      const response = await post('/claims/guest/lookup', { orderNumber, password })
      return response.data || response || []
    } catch (err) {
      error.value = extractErrorMessage(err, '클레임 조회에 실패했습니다.')
      throw err
    } finally {
      pending.value = false
    }
  }

  /**
   * 비회원 클레임 상세 조회
   * POST /claims/guest/{claimId}
   * @param {number} claimId
   * @param {string} orderNumber
   * @param {string} password
   */
  const getGuestClaim = async (claimId, orderNumber, password) => {
    pending.value = true
    error.value = null

    try {
      const response = await post(`/claims/guest/${claimId}`, { orderNumber, password })
      return response.data || response
    } catch (err) {
      error.value = extractErrorMessage(err, '클레임 조회에 실패했습니다.')
      throw err
    } finally {
      pending.value = false
    }
  }

  /**
   * 비회원 클레임 취소
   * POST /claims/guest/{claimId}/cancel
   * @param {number} claimId
   * @param {string} orderNumber
   * @param {string} password
   */
  const cancelGuestClaim = async (claimId, orderNumber, password) => {
    pending.value = true
    error.value = null

    try {
      const response = await post(`/claims/guest/${claimId}/cancel`, { orderNumber, password })
      return { success: true, data: response.data || response }
    } catch (err) {
      const errorMessage = extractErrorMessage(err, '클레임 취소에 실패했습니다.')
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      pending.value = false
    }
  }

  // ─── 유틸 ───

  const extractErrorMessage = (err, fallback) => {
    const responseData = err.response?._data || err.data
    return responseData?.error?.message
      || responseData?.data?.error?.message
      || responseData?.message
      || err.message
      || fallback
  }

  return {
    pending,
    error,
    // 회원
    estimateRefund,
    createClaim,
    getClaim,
    cancelClaim,
    getClaimsByOrder,
    // 비회원
    guestEstimateRefund,
    createGuestClaim,
    guestClaimLookup,
    getGuestClaim,
    cancelGuestClaim
  }
}
