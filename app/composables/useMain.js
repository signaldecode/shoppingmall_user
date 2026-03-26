/**
 * 메인 페이지 API 호출 및 데이터 변환 composable
 * GET /main - 메인 페이지 데이터 조회
 * GET /main/banners - 배너 조회
 */
export const useMain = () => {
  const { useApiData } = useApi()
  const { data: response, pending, error, refresh } = useApiData('main-page', '/main')
  const { data: bannerResponse, pending: bannerPending, refresh: refreshBanners } = useApiData(
    'main-banners',
    '/main/banners',
    {},
    { server: false }
  )

  // 배너 로딩 상태 (SSR에서도 스켈레톤 표시를 위해)
  const bannerLoaded = computed(() => {
    return bannerResponse.value !== null && bannerResponse.value !== undefined
  })

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

  // 배너 데이터 변환 함수 (Hero slides)
  const transformBanner = (banner) => ({
    id: banner.id,
    title: banner.title || banner.name || '',
    subtitle: banner.subtitle || '',
    description: banner.description || '',
    image: banner.imageUrl,
    imageUrl: banner.imageUrl,
    mobileImage: banner.mobileImageUrl,
    mobileImageUrl: banner.mobileImageUrl,
    imageAlt: banner.title || banner.name || '',
    href: banner.linkUrl,
    linkTarget: banner.linkTarget
  })

  // 카테고리 데이터 변환 함수
  const transformCategory = (category) => ({
    id: category.id,
    label: category.name,
    href: `/category?tab=${category.id}`,
    image: `/images/categories/category-${category.sortOrder}.png`,
    imageAlt: `${category.name} 카테고리`
  })

  // 변환된 데이터 computed
  // 배너 타입별 데이터 (HERO, SLIDE, HALF, FULL)
  const heroBanners = computed(() => {
    return bannerResponse.value?.data?.HERO?.map(transformBanner) || []
  })

  const slideBanners = computed(() => {
    return bannerResponse.value?.data?.SLIDE?.map(transformBanner) || []
  })

  const halfBanners = computed(() => {
    return bannerResponse.value?.data?.HALF?.map(transformBanner) || []
  })

  const fullBanners = computed(() => {
    return bannerResponse.value?.data?.FULL?.map(transformBanner) || []
  })

  const categories = computed(() => {
    return response.value?.data?.categories?.map(transformCategory) || []
  })

  const bestProducts = computed(() => {
    return response.value?.data?.bestProducts?.map(transformProduct) || []
  })

  const recommendProducts = computed(() => {
    return response.value?.data?.recommendProducts?.map(transformProduct) || []
  })

  return {
    // 원본 응답
    response,
    pending,
    bannerPending,
    bannerLoaded,
    error,
    refresh,
    refreshBanners,
    // 변환된 데이터
    heroBanners,
    slideBanners,
    halfBanners,
    fullBanners,
    categories,
    bestProducts,
    recommendProducts
  }
}
