/**
 * 상품 검색 Composable
 * GET /api/v1/main/products/search
 */
export const useSearch = () => {
  const { get } = useApi()

  const products = ref([])
  const totalCount = ref(0)
  const pending = ref(false)
  const error = ref(null)

  /**
   * 상품 검색
   * @param {object} params - 검색 파라미터
   * @param {string} params.keyword - 검색 키워드
   * @param {number} params.limit - 조회 개수 (기본 10)
   */
  const searchProducts = async (params = {}) => {
    pending.value = true
    error.value = null

    try {
      const query = {
        keyword: params.keyword || undefined,
        limit: params.limit || 30
      }

      const res = await get('/main/products/search', query)
      const list = res?.data || []

      products.value = list.map(transformProduct)
      totalCount.value = list.length
    } catch (e) {
      error.value = e
      products.value = []
      totalCount.value = 0
    } finally {
      pending.value = false
    }
  }

  /**
   * API 응답 → ProductCard용 데이터 변환
   */
  const transformProduct = (product) => ({
    id: product.id,
    href: `/products/${product.id}`,
    image: product.imageUrl,
    imageAlt: product.name,
    name: product.name,
    price: product.sellingPrice || product.regularPrice,
    originalPrice: product.sellingPrice && product.sellingPrice < product.regularPrice ? product.regularPrice : null,
    discountRate: product.discountRate || 0,
    currency: '원',
    promotionName: product.promotionName || ''
  })

  return {
    products,
    totalCount,
    pending,
    error,
    searchProducts
  }
}
