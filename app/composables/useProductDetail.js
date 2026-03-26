/**
 * 상품 상세 API 호출 composable
 * GET /products/{id} - 상품 상세 조회
 */
export const useProductDetail = (productId) => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBase

  // API 호출
  const url = computed(() => `${baseUrl}/products/${productId.value}`)

  // 테넌트 ID 헤더
  const tenantId = config.public.tenantId
  const headers = tenantId ? { 'X-Tenant-Id': String(tenantId) } : {}

  const { data: response, pending, error, refresh } = useFetch(url, {
    key: `product-detail-${productId.value}`,
    lazy: true,
    headers
  })

  // 날짜 포맷 함수
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
  }

  // 상품 기본 정보 변환
  const product = computed(() => {
    const p = response.value?.data
    if (!p) return null

    // 대표 이미지 (isThumbnail이 true인 것 또는 첫번째)
    const primaryImage = p.images?.find(img => img.isThumbnail) || p.images?.[0]

    // 이미지 URL 배열 (Hero 컴포넌트용)
    const imageUrls = p.images?.map(img => img.url) || []

    // 가격 정보
    const sellingPrice = p.price?.sellingPrice ?? p.price?.regularPrice ?? 0
    const regularPrice = p.price?.regularPrice ?? 0
    const hasDiscount = sellingPrice < regularPrice

    // 프로모션 종료일 포맷
    const promotionEndDate = p.price?.promotion?.endedAt
      ? formatDate(p.price.promotion.endedAt)
      : null

    return {
      id: p.id,
      name: p.name,
      subtitle: '',
      description: p.description,
      brand: p.brand?.name || '',
      category: p.category?.name || '',
      // 가격 정보
      price: sellingPrice,
      originalPrice: hasDiscount ? regularPrice : null,
      discount: p.price?.discountRate || 0,
      currency: '원',
      // 프로모션 정보
      promotion: p.price?.promotion ? {
        id: p.price.promotion.id,
        name: p.price.promotion.name,
        endDate: promotionEndDate
      } : null,
      // 통계
      rating: p.reviewStats?.ratingAvg || 0,
      reviewCount: p.reviewStats?.totalCount || 0,
      // 이미지
      image: primaryImage?.url || '',
      imageAlt: p.name,
      images: imageUrls,
      detailContent: p.description || '',
      status: p.status,
      // 옵션 그룹 (name별로 values 배열)
      options: p.optionGroups?.map(group => ({
        id: group.id,
        name: group.name,
        values: group.optionValues?.map(opt => ({
          id: opt.id,
          value: opt.value,
          label: opt.value
        })) || []
      })) || [],
      // 변형(SKU) 정보 - 옵션 조합별 재고
      variants: p.variants?.map(v => ({
        id: v.id,
        sku: v.skuCode,
        stock: v.stock,
        isActive: v.isActive,
        optionValueIds: v.optionValueIds || []
      })) || []
    }
  })

  // 옵션 그룹 변환
  const optionGroups = computed(() => {
    const p = response.value?.data
    if (!p?.optionGroups) return []

    return p.optionGroups.map(group => ({
      id: group.id,
      name: group.name,
      options: group.optionValues?.map(opt => ({
        id: opt.id,
        value: opt.value,
        label: opt.value
      })) || []
    }))
  })

  // 변형(SKU) 정보
  const variants = computed(() => {
    const p = response.value?.data
    if (!p?.variants) return []

    return p.variants.map(v => ({
      id: v.id,
      sku: v.skuCode,
      stock: v.stock,
      isActive: v.isActive,
      optionValueIds: v.optionValueIds || []
    }))
  })

  // 리뷰 변환
  const reviews = computed(() => {
    const p = response.value?.data
    if (!p?.reviews) return { items: [], total: 0, summary: null }

    const items = p.reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      content: r.content,
      images: r.images || [],
      username: '익명',
      date: formatDate(r.createdAt),
      isPhoto: r.images && r.images.length > 0,
      isBest: r.isBest,
      isVerifiedPurchase: r.isVerifiedPurchase,
      helpfulCount: r.helpfulCount || 0,
      adminReply: r.adminReply,
      adminRepliedAt: r.adminRepliedAt
    }))

    // 리뷰 통계
    const stats = p.reviewStats || {}
    const total = stats.totalCount || items.length
    const avgRating = stats.ratingAvg || 0

    // 평점 분포 (5점부터 1점 순서)
    const distribution = [
      stats.rating5Count || 0,
      stats.rating4Count || 0,
      stats.rating3Count || 0,
      stats.rating2Count || 0,
      stats.rating1Count || 0
    ]

    return {
      items,
      total,
      summary: {
        average: avgRating,
        total,
        distribution
      }
    }
  })

  // Q&A 타입 매핑
  const qnaTypeMap = {
    PRODUCT: '상품',
    ORDER: '주문',
    GENERAL: '일반',
    SHIPPING: '배송',
    PAYMENT: '결제',
    MEMBERSHIP: '회원'
  }

  // Q&A 변환
  const qnas = computed(() => {
    const p = response.value?.data
    if (!p?.qnas) return { items: [], total: 0 }

    const items = p.qnas.map(q => ({
      id: q.id,
      category: qnaTypeMap[q.qnaType] || q.qnaType || '문의',
      title: q.title,
      content: q.question,
      isSecret: q.isSecret,
      isAnswered: q.isAnswered,
      answer: q.answer,
      answerDate: formatDate(q.answeredAt),
      date: formatDate(q.createdAt)
    }))

    return {
      items,
      total: p.qnaTotalCount || items.length
    }
  })

  return {
    // 원본 응답
    response,
    pending,
    error,
    refresh,
    // 변환된 데이터
    product,
    optionGroups,
    variants,
    reviews,
    qnas
  }
}
