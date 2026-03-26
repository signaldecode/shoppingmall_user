/**
 * 상품 리스트 API 호출 composable
 * GET /products - 상품 리스트 조회
 */
export const useProducts = (initialOptions = {}) => {
  const { get } = useApi()

  // 기본 옵션
  const defaultOptions = {
    categoryId: null,
    tag: null,
    page: 0,
    size: 40,
    sort: 'createdAt,DESC'
  }

  // 반응형 파라미터
  const params = reactive({
    ...defaultOptions,
    ...initialOptions
  })

  // 응답 데이터
  const response = ref(null)
  const pending = ref(false)
  const error = ref(null)

  // 요청 ID로 race condition 방지
  let currentRequestId = 0

  // API 호출 함수
  const fetchProducts = async () => {
    const requestId = ++currentRequestId

    const query = {}
    if (params.categoryId) query.categoryId = params.categoryId
    if (params.tag) query.tag = params.tag
    if (params.page !== undefined) query.page = params.page
    if (params.size) query.size = params.size
    if (params.sort) query.sort = params.sort

    pending.value = true
    error.value = null

    try {
      const data = await get('/products', query)
      // 최신 요청만 반영 (이전 요청 응답 무시)
      if (requestId === currentRequestId) {
        response.value = data
      }
    } catch (e) {
      if (requestId === currentRequestId) {
        error.value = e
        console.error('Failed to fetch products:', e)
      }
    } finally {
      if (requestId === currentRequestId) {
        pending.value = false
      }
    }
  }

  // params 변경 감지하여 API 호출
  watch(
    () => ({ ...params }),
    () => {
      fetchProducts()
    },
    { immediate: true, deep: true }
  )

  // 상품 데이터 변환 함수
  const transformProduct = (product) => {
    const hasDiscount = product.sellingPrice && product.sellingPrice < product.regularPrice

    return {
      id: product.id,
      href: `/products/${product.id}`,
      image: product.imageUrl,
      imageAlt: product.name,
      name: product.name,
      price: product.sellingPrice || product.regularPrice,
      originalPrice: hasDiscount ? product.regularPrice : null,
      discountRate: product.discountRate || 0,
      currency: '원',
      promotionName: product.promotionName || ''
    }
  }

  // 변환된 상품 리스트
  const products = computed(() => {
    const content = response.value?.data?.content || response.value?.content || []
    return content.map(transformProduct)
  })

  // 페이지네이션 정보
  const pagination = computed(() => {
    const data = response.value?.data || response.value || {}
    const totalElements = data.total_elements ?? data.totalElements ?? 0
    const size = data.size ?? 40
    const totalPages = Math.ceil(totalElements / size) || 0

    return {
      page: (data.page ?? 1) - 1, // API는 1-based, 내부는 0-based
      size,
      totalElements,
      totalPages
    }
  })

  // 파라미터 업데이트 함수
  const setCategory = (categoryId) => {
    params.categoryId = categoryId
    params.page = 0
  }

  const setTag = (tag) => {
    params.tag = tag
    params.page = 0
  }

  const setPage = (page) => {
    params.page = page
  }

  const setSize = (size) => {
    params.size = size
    params.page = 0
  }

  const setSort = (sort) => {
    params.sort = sort
    params.page = 0
  }

  // 정렬 값 변환 (UI용 → API용)
  const sortMapping = {
    latest: 'createdAt,DESC',
    popular: 'reviewCount,DESC',
    price_asc: 'salePrice,ASC',
    price_desc: 'salePrice,DESC'
  }

  const setSortByValue = (value) => {
    const apiSort = sortMapping[value] || 'createdAt,DESC'
    setSort(apiSort)
  }

  return {
    // 데이터
    products,
    pagination,
    pending,
    error,
    refresh: fetchProducts,
    // 파라미터
    params,
    // 업데이트 함수
    setCategory,
    setTag,
    setPage,
    setSize,
    setSort,
    setSortByValue
  }
}
