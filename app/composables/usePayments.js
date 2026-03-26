/**
 * 결제 API composable (토스페이먼츠 연동)
 *
 * POST /payments/confirm              - 결제 승인
 * POST /payments/{paymentKey}/cancel  - 결제 취소/환불
 * POST /payments/key-in               - 키인결제 (테스트용)
 * GET  /payments/{paymentKey}         - 결제 조회 (paymentKey)
 * GET  /payments/orders/{orderNumber} - 결제 조회 (주문번호)
 */
export const usePayments = () => {
  const { get, post } = useApi()
  const config = useRuntimeConfig()

  const pending = ref(false)
  const error = ref(null)

  /**
   * 토스페이먼츠 SDK 로드
   * @returns {Promise<object>} TossPayments 인스턴스
   */
  const loadTossPayments = async () => {
    if (import.meta.server) return null

    if (window.TossPayments) {
      return window.TossPayments(config.public.tossClientKey)
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://js.tosspayments.com/v2/standard'
      script.onload = () => {
        if (window.TossPayments) {
          resolve(window.TossPayments(config.public.tossClientKey))
        } else {
          reject(new Error('TossPayments SDK 로드 실패'))
        }
      }
      script.onerror = () => reject(new Error('TossPayments SDK 스크립트 로드 실패'))
      document.head.appendChild(script)
    })
  }

  /**
   * 결제 요청 (토스페이먼츠 결제창 호출)
   * @param {object} params
   * @param {number} params.amount - 결제금액
   * @param {string} params.orderId - 주문 ID (고유값)
   * @param {string} params.orderName - 주문명
   * @param {string} [params.customerName] - 구매자 이름
   * @param {string} [params.customerEmail] - 구매자 이메일
   * @param {string} [params.customerKey] - 구매자 키 (회원: 고유ID, 비회원: 랜덤)
   * @param {string} params.successUrl - 성공 리다이렉트 URL
   * @param {string} params.failUrl - 실패 리다이렉트 URL
   */
  const requestPayment = async (params) => {
    error.value = null

    try {
      const tossPayments = await loadTossPayments()
      if (!tossPayments) throw new Error('결제 모듈을 불러올 수 없습니다.')

      const customerKey = params.customerKey
        || `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      const payment = tossPayments.payment({ customerKey })

      const requestParams = {
        method: 'CARD',
        amount: {
          currency: 'KRW',
          value: Number(params.amount)
        },
        orderId: String(params.orderId),
        orderName: String(params.orderName),
        successUrl: params.successUrl,
        failUrl: params.failUrl,
        windowTarget: 'iframe'
      }
      if (params.customerName) requestParams.customerName = String(params.customerName)
      if (params.customerEmail) requestParams.customerEmail = String(params.customerEmail)

      await payment.requestPayment(requestParams)
    } catch (err) {
      if (err.code === 'USER_CANCEL') {
        error.value = null
        return { cancelled: true }
      }
      error.value = err.message || '결제 요청 중 오류가 발생했습니다.'
      throw err
    }
  }

  /**
   * 결제 승인
   * POST /payments/confirm
   * @param {string} paymentKey - 토스에서 발급한 결제 키
   * @param {string} orderId - 주문 ID
   * @param {number} amount - 결제 금액
   */
  const confirmPayment = async ({ paymentKey, orderId, amount }) => {
    pending.value = true
    error.value = null

    try {
      const response = await post('/payments/confirm', {
        paymentKey,
        orderId,
        amount
      })
      return response.data || response
    } catch (err) {
      error.value = err.data?.message || err.message || '결제 승인에 실패했습니다.'
      throw err
    } finally {
      pending.value = false
    }
  }

  /**
   * 결제 취소/환불
   * POST /payments/{paymentKey}/cancel
   * @param {string} paymentKey - 결제 키
   * @param {string} cancelReason - 취소 사유
   * @param {number} [cancelAmount] - 부분 취소 금액 (미입력 시 전액 취소)
   */
  const cancelPayment = async (paymentKey, { cancelReason, cancelAmount } = {}) => {
    pending.value = true
    error.value = null

    try {
      const body = { cancelReason }
      if (cancelAmount != null) body.cancelAmount = cancelAmount

      const response = await post(`/payments/${paymentKey}/cancel`, body)
      return response.data || response
    } catch (err) {
      error.value = err.data?.message || err.message || '결제 취소에 실패했습니다.'
      throw err
    } finally {
      pending.value = false
    }
  }

  /**
   * 결제 조회 (paymentKey)
   * GET /payments/{paymentKey}
   * @param {string} paymentKey
   */
  const getPayment = async (paymentKey) => {
    pending.value = true
    error.value = null

    try {
      const response = await get(`/payments/${paymentKey}`)
      return response.data || response
    } catch (err) {
      error.value = err.data?.message || err.message || '결제 조회에 실패했습니다.'
      throw err
    } finally {
      pending.value = false
    }
  }

  /**
   * 결제 조회 (주문번호)
   * GET /payments/orders/{orderNumber}
   * @param {string} orderNumber
   */
  const getPaymentByOrder = async (orderNumber) => {
    pending.value = true
    error.value = null

    try {
      const response = await get(`/payments/orders/${orderNumber}`)
      return response.data || response
    } catch (err) {
      error.value = err.data?.message || err.message || '결제 조회에 실패했습니다.'
      throw err
    } finally {
      pending.value = false
    }
  }

  /**
   * 키인결제 (테스트용)
   * POST /payments/key-in
   * @param {object} body
   * @param {string} body.orderId - 주문 ID
   * @param {number} body.amount - 결제 금액
   * @param {string} body.cardNumber - 카드번호
   * @param {string} body.cardExpirationYear - 카드 만료 연도 (YY)
   * @param {string} body.cardExpirationMonth - 카드 만료 월 (MM)
   * @param {number} [body.installmentPlanMonths] - 할부 개월 (0=일시불)
   * @param {string} body.orderName - 주문명
   */
  const keyInPayment = async (body) => {
    pending.value = true
    error.value = null

    try {
      const response = await post('/payments/key-in', {
        orderId: body.orderId,
        amount: body.amount,
        cardNumber: body.cardNumber,
        cardExpirationYear: body.cardExpirationYear,
        cardExpirationMonth: body.cardExpirationMonth,
        installmentPlanMonths: body.installmentPlanMonths || 0,
        orderName: body.orderName
      })
      return response.data || response
    } catch (err) {
      error.value = err.data?.message || err.message || '키인결제에 실패했습니다.'
      throw err
    } finally {
      pending.value = false
    }
  }

  return {
    pending,
    error,
    loadTossPayments,
    requestPayment,
    confirmPayment,
    cancelPayment,
    getPayment,
    getPaymentByOrder,
    keyInPayment
  }
}
