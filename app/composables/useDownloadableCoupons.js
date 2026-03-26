/**
 * 다운로드 가능한 쿠폰 목록 Composable
 * GET /coupons - 다운로드 가능한 쿠폰 목록 조회
 * POST /coupons/{id}/download - 쿠폰 다운로드
 */
export const useDownloadableCoupons = () => {
  const { get, post } = useApi()

  const coupons = ref([])
  const pending = ref(false)
  const error = ref(null)

  // 다운로드한 쿠폰 ID 목록 (로컬 상태)
  const downloadedIds = ref(new Set())

  // 적용 가능한 쿠폰 (주문 페이지용)
  const applicableCoupons = ref([])
  const applicablePending = ref(false)

  /**
   * 다운로드 가능한 쿠폰 목록 조회
   */
  const fetchCoupons = async () => {
    pending.value = true
    error.value = null

    try {
      const response = await get('/coupons')
      coupons.value = response.data || response || []
      return coupons.value
    } catch (e) {
      error.value = e.data?.message || '쿠폰 목록을 불러오는데 실패했습니다.'
      coupons.value = []
      return []
    } finally {
      pending.value = false
    }
  }

  /**
   * 쿠폰 다운로드
   * POST /coupons/{couponId}/download
   */
  const downloadCoupon = async (couponId) => {
    try {
      const response = await post(`/coupons/${couponId}/download`)
      downloadedIds.value.add(couponId)
      return { success: true, message: response.message || response.data }
    } catch (e) {
      const errorCode = e.data?.error?.code || e.data?.code
      const errorMessage = e.data?.error?.message || e.data?.message || '쿠폰 다운로드에 실패했습니다.'

      // 이미 다운로드한 경우도 성공으로 처리
      if (errorCode === 'ALREADY_DOWNLOADED' || errorCode === 'COUPON_ALREADY_ISSUED') {
        downloadedIds.value.add(couponId)
        return { success: true, alreadyDownloaded: true }
      }
      return { success: false, error: errorMessage }
    }
  }

  /**
   * 전체 쿠폰 다운로드
   */
  const downloadAllCoupons = async () => {
    const availableCoupons = coupons.value.filter(
      coupon => !downloadedIds.value.has(coupon.id)
    )

    let successCount = 0
    let failedCount = 0

    for (const coupon of availableCoupons) {
      const result = await downloadCoupon(coupon.id)
      if (result.success) {
        successCount++
      } else {
        failedCount++
      }
    }

    return { success: successCount, failed: failedCount }
  }

  /**
   * 쿠폰 다운로드 여부 확인
   */
  const isDownloaded = (couponId) => {
    return downloadedIds.value.has(couponId)
  }

  // 현재 주문 금액 (할인 계산용)
  const currentSubtotal = ref(0)

  /**
   * 적용 가능한 쿠폰 목록 조회 (주문 페이지용)
   * GET /coupons/applicable?subtotal={amount}
   */
  const fetchApplicableCoupons = async (subtotal, hasPromotion = false) => {
    applicablePending.value = true
    currentSubtotal.value = subtotal

    try {
      const response = await get('/coupons/applicable', { orderSubtotal: subtotal, hasPromotion })
      applicableCoupons.value = (response.data || response || []).map(c => transformApplicableCoupon(c, subtotal))
      return applicableCoupons.value
    } catch (e) {
      applicableCoupons.value = []
      return []
    } finally {
      applicablePending.value = false
    }
  }

  /**
   * 적용 가능한 쿠폰 데이터 변환
   */
  const transformApplicableCoupon = (coupon, subtotal) => {
    const isPercentage = coupon.discountType === 'RATE'
    const discountText = isPercentage
      ? `${coupon.discountValue}%`
      : `${coupon.discountValue?.toLocaleString()}원`

    // 할인 금액 직접 계산
    let expectedDiscountAmount = 0
    if (subtotal > 0) {
      if (isPercentage) {
        expectedDiscountAmount = Math.floor(subtotal * (coupon.discountValue / 100))
        if (coupon.maxDiscount) {
          expectedDiscountAmount = Math.min(expectedDiscountAmount, coupon.maxDiscount)
        }
      } else {
        expectedDiscountAmount = coupon.discountValue || 0
      }
    }

    return {
      id: coupon.userCouponId,
      couponId: coupon.couponId,
      name: coupon.name,
      discountText,
      discountType: isPercentage ? 'PERCENTAGE' : 'FIXED',
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount || 0,
      maxDiscountAmount: coupon.maxDiscount || null,
      validTo: formatDate(coupon.expiredAt),
      expectedDiscountAmount,
      applicable: coupon.applicable ?? true
    }
  }

  /**
   * 쿠폰 할인 금액 계산
   */
  const calculateDiscount = (coupon, subtotal) => {
    if (!coupon) return 0

    if (coupon.discountType === 'PERCENTAGE') {
      const discount = Math.floor(subtotal * (coupon.discountValue / 100))
      return coupon.maxDiscountAmount
        ? Math.min(discount, coupon.maxDiscountAmount)
        : discount
    }
    return coupon.discountValue || 0
  }

  /**
   * 날짜 포맷 (YYYY.MM.DD)
   */
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
  }

  /**
   * D-Day 계산
   */
  const calcDDay = (endDateStr) => {
    if (!endDateStr) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endDate = new Date(endDateStr)
    endDate.setHours(0, 0, 0, 0)
    const diffTime = endDate - today
    const dDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return dDay >= 0 ? dDay : null
  }

  /**
   * 쿠폰 데이터 변환 (UI용)
   */
  const transformCoupon = (coupon) => {
    // 할인 텍스트 (RATE: %, AMOUNT: 원)
    const isPercentage = coupon.discountType === 'RATE'
    const discountText = isPercentage
      ? `${coupon.discountValue}%`
      : `${coupon.discountValue?.toLocaleString()}원`

    // 유효기간 타입
    const isFromDownload = coupon.validityType === 'DAYS_FROM_DOWNLOAD'
    // 고정 기간인 경우 날짜 포맷, 다운로드 후 기간인 경우 null (페이지에서 라벨 조합)
    const validUntilDate = isFromDownload ? null : formatDate(coupon.validTo)

    // D-Day 계산 (DAYS_FROM_DOWNLOAD는 D-Day 표시 안함)
    const dDay = isFromDownload ? null : calcDDay(coupon.validTo)

    // 적용 대상
    const targetCategoryName = coupon.couponType === 'PRODUCT_DISCOUNT'
      ? '전체 상품'
      : coupon.targetCategoryName || '전체 상품'

    return {
      id: coupon.id,
      name: coupon.name,
      description: coupon.description || '',
      notice: coupon.notice || '',
      discountText,
      discountType: isPercentage ? 'PERCENTAGE' : 'FIXED',
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount || 0,
      maxDiscountAmount: coupon.maxDiscountAmount,
      maxDiscountText: coupon.maxDiscountAmount
        ? `최대 ${coupon.maxDiscountAmount.toLocaleString()}원`
        : null,
      validFrom: formatDate(coupon.validFrom),
      validUntilDate,
      validityDays: coupon.validityDays,
      validityType: coupon.validityType,
      isFromDownload,
      dDay,
      remainingQuantity: coupon.remainingQuantity,
      targetCategoryName,
      isDownloaded: downloadedIds.value.has(coupon.id)
    }
  }

  /**
   * 변환된 쿠폰 목록
   */
  const transformedCoupons = computed(() => {
    return coupons.value.map(transformCoupon)
  })

  return {
    coupons,
    transformedCoupons,
    pending,
    error,
    fetchCoupons,
    downloadCoupon,
    downloadAllCoupons,
    isDownloaded,
    // 주문 페이지용
    applicableCoupons,
    applicablePending,
    fetchApplicableCoupons,
    calculateDiscount
  }
}
