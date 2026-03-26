/**
 * 주문 API composable
 * POST /orders - 주문 생성
 * GET /orders/:id - 주문 상세 조회
 */
export const useOrder = () => {
  const { get, post } = useApi()
  const router = useRouter()
  const authStore = useAuthStore()

  // 주문 상태
  const pending = ref(false)
  const error = ref(null)

  /**
   * 주문 생성
   * @param {Object} payload - API 스펙에 맞게 준비된 주문 데이터
   */
  const createOrder = async (payload) => {
    pending.value = true
    error.value = null

    try {
      const response = await post('/orders', payload)

      if (response.success) {
        return {
          success: true,
          data: response.data,
          orderId: response.data?.orderId || response.data?.id,
          orderNumber: response.data?.orderNumber
        }
      }

      throw new Error(response.message || '주문 생성에 실패했습니다.')
    } catch (err) {
      // API 에러 메시지 추출 (다양한 응답 구조 대응)
      let errorMessage = '주문 처리 중 오류가 발생했습니다.'

      // $fetch 에러 응답 데이터 추출
      const responseData = err.response?._data || err.data

      if (responseData?.error?.message) {
        errorMessage = responseData.error.message
      } else if (responseData?.data?.error?.message) {
        errorMessage = responseData.data.error.message
      } else if (typeof responseData === 'string') {
        errorMessage = responseData
      } else if (responseData?.message) {
        errorMessage = responseData.message
      } else if (err.message) {
        errorMessage = err.message
      }

      error.value = errorMessage
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      pending.value = false
    }
  }

  /**
   * 바로 구매 (상품 상세에서 사용)
   * @param {Object} product - 상품 정보
   * @param {Object} variant - 선택된 옵션(variant)
   * @param {Number} quantity - 수량
   */
  const buyNow = (product, variant, quantity = 1, optionName = '') => {
    // 주문 페이지로 이동하면서 상품 정보 전달
    const orderItem = {
      productId: product.id,
      variantId: variant?.id || null,
      quantity: quantity || 1,
      // UI 표시용 추가 정보
      productName: product.name,
      productImage: product.image,
      optionName: optionName || '',
      price: product.price,
      totalPrice: product.price * (quantity || 1)
    }

    // sessionStorage에 임시 저장 (주문 페이지에서 사용)
    if (import.meta.client) {
      sessionStorage.setItem('orderItems', JSON.stringify([orderItem]))
    }

    // 주문 페이지로 이동
    router.push('/order')
  }

  /**
   * sessionStorage에서 주문 상품 가져오기
   */
  const getOrderItems = () => {
    if (import.meta.client) {
      const items = sessionStorage.getItem('orderItems')
      return items ? JSON.parse(items) : []
    }
    return []
  }

  /**
   * sessionStorage 주문 상품 삭제
   */
  const clearOrderItems = () => {
    if (import.meta.client) {
      sessionStorage.removeItem('orderItems')
    }
  }

  /**
   * 주문/클레임 목록 조회
   * GET /api/v1/orders
   * @param {Object} params - 조회 파라미터
   * @param {boolean} [params.claims] - true면 클레임(취소/반품/교환) 목록 조회
   * @param {number} [params.page] - 페이지 번호 (0-based)
   * @param {number} [params.size] - 페이지 크기
   * @param {string|string[]} [params.sort] - 정렬 기준 (예: 'createdAt,DESC')
   */
  const getOrders = async (params = {}) => {
    pending.value = true
    error.value = null

    try {
      const queryParams = new URLSearchParams()
      if (params.claims) queryParams.append('claims', 'true')
      if (params.page !== undefined) queryParams.append('page', params.page)
      if (params.size !== undefined) queryParams.append('size', params.size)
      if (params.sort) queryParams.append('sort', params.sort)

      const queryString = queryParams.toString()
      const endpoint = queryString ? `/orders?${queryString}` : '/orders'

      const response = await get(endpoint)
      return response.data || response
    } catch (err) {
      console.error('Failed to fetch orders:', err)
      error.value = err.data?.message || err.message || '주문 목록을 불러오는데 실패했습니다.'
      throw err
    } finally {
      pending.value = false
    }
  }

  /**
   * 주문 목록 데이터 변환 (API → UI)
   * MyPageOrderRow 컴포넌트 형식으로 변환
   */
  const transformOrderList = (order) => {
    const formatDate = (dateStr) => {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    const formatShortDate = (dateStr) => {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      const yy = String(date.getFullYear()).slice(2)
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const dd = String(date.getDate()).padStart(2, '0')
      return `${yy}/${mm}/${dd}`
    }

    // status variant 결정
    const getStatusVariant = (status) => {
      if (status === 'DELIVERED' || status === 'COMPLETED') return 'success'
      if (status === 'CANCELLED' || status === 'REFUNDED') return 'error'
      if (status === 'RETURN_IN_PROGRESS' || status === 'EXCHANGE_IN_PROGRESS' || status === 'CANCEL_REQUESTED') return 'warning'
      return 'default'
    }

    return {
      orderNo: order.orderNumber,
      orderedAt: formatDate(order.createdAt),
      id: order.id || order.orderId || null,
      orderNumber: order.orderNumber,
      // MyPageOrderRow용 order 객체
      product: {
        id: order.id,
        name: order.firstItemName + (order.itemCount > 1 ? ` 외 ${order.itemCount - 1}건` : ''),
        price: `${(order.grandTotal || 0).toLocaleString()}원`,
        qty: `${order.itemCount}개`,
        date: formatShortDate(order.createdAt),
        status: {
          text: order.statusDescription || order.status,
          variant: getStatusVariant(order.status)
        },
        image: order.firstItemThumbnailUrl || ''
      }
    }
  }

  /**
   * 클레임 목록 조회 (getOrders의 래퍼)
   * GET /api/v1/orders?claims=true
   * @param {Object} params - 조회 파라미터
   * @param {number} [params.page] - 페이지 번호 (0-based)
   * @param {number} [params.size] - 페이지 크기
   * @param {string} [params.sort] - 정렬 기준 (예: createdAt,DESC)
   */
  const getClaims = async (params = {}) => {
    return getOrders({ ...params, claims: true })
  }

  /**
   * 클레임 목록 데이터 변환 (API → UI)
   * MyPageOrderRow 컴포넌트 형식으로 변환
   */
  const transformClaimList = (claim) => {
    const formatDate = (dateStr) => {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    const formatShortDate = (dateStr) => {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      const yy = String(date.getFullYear()).slice(2)
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const dd = String(date.getDate()).padStart(2, '0')
      return `${yy}/${mm}/${dd}`
    }

    // 클레임 status variant 결정
    const getClaimStatusVariant = (status) => {
      if (status === 'COMPLETED' || status === 'APPROVED') return 'success'
      if (status === 'REJECTED') return 'error'
      return 'default'
    }

    const productName = claim.representativeProductName || claim.firstItemName || ''
    return {
      claimNo: claim.claimNumber,
      orderNo: claim.orderNumber,
      createdAt: formatDate(claim.createdAt),
      id: claim.orderId || claim.id || null,
      orderNumber: claim.orderNumber,
      claimType: claim.claimType,
      claimTypeText: claim.claimTypeDescription || claim.claimType || '-',
      reasonText: claim.reasonTypeDescription || claim.reasonType || '-',
      requestedAt: formatDate(claim.requestedAt),
      // MyPageOrderRow용 order 객체
      product: {
        id: claim.id,
        name: productName + (claim.itemCount > 1 ? ` 외 ${claim.itemCount - 1}건` : ''),
        price: `${(claim.refundAmount || 0).toLocaleString()}원`,
        qty: `${claim.itemCount}개`,
        date: formatShortDate(claim.requestedAt || claim.createdAt),
        status: {
          text: claim.statusDescription || claim.status,
          variant: getClaimStatusVariant(claim.status)
        },
        image: claim.representativeProductThumbnailUrl || claim.firstItemThumbnailUrl || ''
      }
    }
  }

  /**
   * 주문 상세 조회
   * @param {number|string} orderId - 주문 ID
   */
  const getOrder = async (orderId) => {
    pending.value = true
    error.value = null

    try {
      const response = await get(`/orders/${orderId}`)
      return response.data || response
    } catch (err) {
      console.error('Failed to fetch order:', err)
      error.value = err.data?.message || err.message || '주문 정보를 불러오는데 실패했습니다.'
      throw err
    } finally {
      pending.value = false
    }
  }

  /**
   * 주문번호로 주문 상세 조회
   * GET /api/v1/orders/number/{orderNumber}
   * @param {string} orderNumber - 주문번호
   */
  const getOrderByNumber = async (orderNumber) => {
    pending.value = true
    error.value = null

    try {
      const response = await get(`/orders/number/${orderNumber}`)
      return response.data || response
    } catch (err) {
      console.error('Failed to fetch order by number:', err)
      error.value = err.data?.message || err.message || '주문 정보를 불러오는데 실패했습니다.'
      throw err
    } finally {
      pending.value = false
    }
  }

  /**
   * 주문 상세 데이터 변환 (API → UI)
   * MyPageOrderDetail 컴포넌트 형식으로 변환
   */
  const transformOrderDetail = (order) => {
    // 날짜 포맷팅
    const formatDate = (dateStr) => {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    // 결제수단 매핑
    const paymentMethodMap = {
      CARD: '신용카드',
      BANK: '무통장입금',
      BANK_TRANSFER: '계좌이체',
      TRANSFER: '계좌이체',
      VIRTUAL_ACCOUNT: '가상계좌',
      MOBILE_PHONE: '휴대폰',
      KAKAOPAY: '카카오페이',
      NAVERPAY: '네이버페이',
      PENDING: '결제대기'
    }

    // 주문/아이템 상태 variant 매핑
    const statusVariantMap = {
      PENDING: 'default',
      PAID: 'default',
      PREPARING: 'default',
      SHIPPING: 'default',
      SHIPPED: 'default',
      DELIVERED: 'success',
      COMPLETED: 'success',
      CANCELLED: 'error',
      REFUNDED: 'error',
      RETURN_IN_PROGRESS: 'warning',
      EXCHANGE_IN_PROGRESS: 'warning',
      CANCEL_REQUESTED: 'warning'
    }

    // 결제 정보 (payment 객체가 있으면 사용)
    const pay = order.payment || {}

    return {
      id: order.id || order.orderId || null,
      orderNo: order.orderNumber,
      orderedAt: formatDate(order.createdAt),
      orderer: order.shippingAddress?.recipientName || order.guestEmail || '-',
      orderStatus: order.orderStatus,
      statusText: order.orderStatusDescription || order.orderStatus || '-',
      statusVariant: statusVariantMap[order.orderStatus] || 'default',
      paymentStatus: order.paymentStatus,
      paymentStatusText: order.paymentStatusDescription || order.paymentStatus || '-',
      depositorName: order.depositorName || '-',
      payment: {
        paymentNumber: pay.paymentNumber || order.paymentNumber || '-',
        totalOrder: `${(order.subtotal || 0).toLocaleString()}원`,
        totalDiscount: `${(order.discountTotal || 0).toLocaleString()}원`,
        shippingFee: `${(order.shippingTotal || 0).toLocaleString()}원`,
        totalPaid: `${(order.grandTotal || 0).toLocaleString()}원`,
        method: paymentMethodMap[pay.method] || pay.method || paymentMethodMap[order.paymentStatus] || '-',
        cardNumber: pay.cardNumber || '',
        cardCompany: pay.cardCompany || '',
        installment: pay.installment || 0,
        receiptUrl: pay.receiptUrl || '',
        pgProvider: pay.pgProvider || '',
        paymentStatusDescription: pay.paymentStatusDescription || order.paymentStatusDescription || '-',
        paidAt: formatDate(pay.paidAt || order.paidAt),
        cancelledAt: formatDate(pay.cancelledAt),
        bankName: pay.bankName || '',
        accountNumber: pay.accountNumber || '',
        accountHolder: pay.accountHolder || '',
        depositDeadline: formatDate(pay.depositDeadline)
      },
      products: (order.items || []).map(item => {
        const unitPrice = item.unitPrice ?? item.price ?? 0
        const total = item.total ?? item.subtotal ?? 0
        const itemStatus = item.orderItemStatus || order.orderStatus
        const itemStatusText = item.orderItemStatusDescription || order.orderStatusDescription || '-'
        return {
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          name: item.productName,
          variantName: item.variantName || '',
          sku: item.sku || '',
          unitPrice: `${Number(unitPrice).toLocaleString()}원`,
          quantity: item.quantity,
          total: `${Number(total).toLocaleString()}원`,
          status: { text: itemStatusText, variant: statusVariantMap[itemStatus] || 'default' },
          image: item.thumbnailUrl || '',
          rejectedClaimInfo: item.rejectedClaimInfo || null
        }
      }),
      shipping: {
        receiver: order.shippingAddress?.recipientName || '-',
        zipcode: order.shippingAddress?.postalCode || '-',
        address: `${order.shippingAddress?.address1 || ''} ${order.shippingAddress?.address2 || ''}`.trim() || '-',
        phone: order.shippingAddress?.recipientPhone || '-',
        memo: order.customerNote || '-'
      },
      shipment: order.shipment ? {
        trackingNumber: order.shipment.trackingNumber || '-',
        carrierName: order.shipment.carrierName || '-',
        carrierCode: order.shipment.carrierCode || '',
        status: order.shipment.statusDescription || order.shipment.status || '-',
        trackingUrl: order.shipment.trackingUrl || '',
        shippedAt: formatDate(order.shipment.shippedAt || order.shippedAt),
        deliveredAt: formatDate(order.shipment.deliveredAt || order.deliveredAt)
      } : null,
      shippedAt: formatDate(order.shippedAt),
      deliveredAt: formatDate(order.deliveredAt),
      cancelledAt: formatDate(order.cancelledAt)
    }
  }

  /**
   * 비회원 주문 조회
   * POST /api/v1/orders/guest/lookup
   * @param {string} orderNumber - 주문번호
   * @param {string} password - 비밀번호
   */
  const guestOrderLookup = async (orderNumber, password) => {
    pending.value = true
    error.value = null

    try {
      const response = await post('/orders/guest/lookup', { orderNumber, password })
      return response.data || response
    } catch (err) {
      console.error('Failed to lookup guest order:', err)
      error.value = err.data?.message || err.message || '주문 조회에 실패했습니다.'
      throw err
    } finally {
      pending.value = false
    }
  }

  /**
   * 주문 취소
   * POST /api/v1/orders/{orderNumber}/cancel
   * @param {string} orderNumber - 주문번호
   */
  const cancelOrder = async (orderNumber) => {
    pending.value = true
    error.value = null

    try {
      const response = await post(`/orders/${orderNumber}/cancel`)
      return response.data || response
    } catch (err) {
      console.error('Failed to cancel order:', err)
      error.value = err.data?.message || err.message || '주문 취소에 실패했습니다.'
      throw err
    } finally {
      pending.value = false
    }
  }

  /**
   * 비회원 주문 취소
   * POST /api/v1/orders/guest/cancel
   * @param {string} orderNumber - 주문번호
   * @param {string} password - 비밀번호
   */
  const cancelGuestOrder = async (orderNumber, password) => {
    pending.value = true
    error.value = null

    try {
      const response = await post('/orders/guest/cancel', { orderNumber, password })
      return response.data || response
    } catch (err) {
      console.error('Failed to cancel guest order:', err)
      error.value = err.data?.message || err.message || '주문 취소에 실패했습니다.'
      throw err
    } finally {
      pending.value = false
    }
  }

  /**
   * 배송 확인 (구매 확정)
   * PATCH /api/v1/orders/{orderId}/confirm
   * @param {number|string} orderId - 주문 ID
   */
  const confirmDelivery = async (orderId) => {
    pending.value = true
    error.value = null

    try {
      const { patch } = useApi()
      const response = await patch(`/orders/${orderId}/confirm`)
      return response.data || response
    } catch (err) {
      console.error('Failed to confirm delivery:', err)
      error.value = err.data?.message || err.message || '구매 확정에 실패했습니다.'
      throw err
    } finally {
      pending.value = false
    }
  }

  return {
    // 상태
    pending,
    error,
    // 메서드
    createOrder,
    getOrders,
    getClaims,
    getOrder,
    getOrderByNumber,
    guestOrderLookup,
    cancelOrder,
    cancelGuestOrder,
    confirmDelivery,
    transformOrderList,
    transformClaimList,
    transformOrderDetail,
    buyNow,
    getOrderItems,
    clearOrderItems
  }
}
