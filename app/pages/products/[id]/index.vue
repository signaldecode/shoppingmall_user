<script setup>
import detailData from '~/data/product-detail.json'
import uiData from '~/data/ui.json'

const route = useRoute()
const router = useRouter()

const productId = computed(() => route.params.id)

// 인증 상태
const authStore = useAuthStore()

// 장바구니 & 토스트 & 위시리스트
const { addToCart } = useCart()
const { fetchWishlist, addToWishlist, removeFromWishlist, isInWishlist, getWishlistItem } = useWishlist()
const { success, error: showError } = useToast()

// 위시리스트 상태
const isWishlisted = computed(() => {
  if (!product.value?.id) return false
  return isInWishlist(product.value.id)
})

// 위시리스트 조회
onMounted(() => {
  fetchWishlist().catch(() => {})
})

// 상품 상세 API 호출
const {
  product,
  reviews,
  qnas: qna,
  pending,
  error,
  refresh: refreshProductDetail
} = useProductDetail(productId)

// SEO (computed 기반)
const seoTitle = computed(() =>
  product.value ? product.value.name : detailData.seo.title
)
const seoDescription = computed(() => product.value?.subtitle || '')
const seoImage = computed(() => product.value?.image || '')

useHead({ title: seoTitle })
useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  ogImage: seoImage
})

// Active Tab
const activeTab = ref('detail')

// Scroll spy for tabs
onMounted(() => {
  const sections = ['detail', 'info', 'reviews', 'qna']
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id.replace('section-', '')
          activeTab.value = sectionId
        }
      })
    },
    { rootMargin: '-150px 0px -50% 0px' }
  )

  sections.forEach((id) => {
    const element = document.getElementById(`section-${id}`)
    if (element) {
      observer.observe(element)
    }
  })

  onUnmounted(() => {
    observer.disconnect()
  })
})

// Event handlers
// 주문 composable
const { buyNow } = useOrder()

// ProductDetailHero ref
const productHeroRef = ref(null)

const handleAddToCart = async (data) => {
  try {
    await addToCart({
      productId: data.product.id,
      variantId: data.variant?.id,
      quantity: data.quantity
    })
    success(uiData.toast.addedToCart, {
      link: { text: uiData.toast.goToCart, href: '/cart' }
    })
    // 선택 옵션 초기화
    productHeroRef.value?.resetSelection()
  } catch (e) {
    const message = e?.data?.error?.message || e?.data?.message || uiData.toast.error
    showError(message)
  }
}

// 현재 주문 데이터 임시 저장 (모달에서 사용)
const pendingOrderData = ref(null)

const handleBuyNow = (data) => {
  // 로그인 상태 확인
  if (!authStore.isLoggedIn) {
    // 주문 데이터 임시 저장
    pendingOrderData.value = data
    showGuestModal.value = true
    return
  }

  // 로그인된 경우 바로 구매
  buyNow(data.product, data.variant, data.quantity, buildOptionName(data))
}

// 선택된 옵션 텍스트 생성 (variant에 name 없으므로 선택 옵션값으로 조합)
const buildOptionName = (data) => {
  const options = data.product.options || []
  const selected = data.selectedOptions || {}
  return options.map(opt => selected[opt.id]?.label).filter(Boolean).join(' / ')
}

// 로그인 후 주문하기
const handleLoginAndBuy = () => {
  if (!pendingOrderData.value) return

  const data = pendingOrderData.value
  const orderItem = {
    productId: data.product.id,
    variantId: data.variant?.id || null,
    quantity: data.quantity || 1,
    productName: data.product.name,
    productImage: data.product.image,
    optionName: buildOptionName(data),
    price: data.product.price,
    totalPrice: data.product.price * (data.quantity || 1)
  }

  if (import.meta.client) {
    sessionStorage.setItem('orderItems', JSON.stringify([orderItem]))
  }

  showGuestModal.value = false
  router.push('/login?redirect=/order')
}

// 비회원 주문하기
const handleGuestBuy = () => {
  if (!pendingOrderData.value) return

  const data = pendingOrderData.value
  const orderItem = {
    productId: data.product.id,
    variantId: data.variant?.id || null,
    quantity: data.quantity || 1,
    productName: data.product.name,
    productImage: data.product.image,
    optionName: buildOptionName(data),
    price: data.product.price,
    totalPrice: data.product.price * (data.quantity || 1)
  }

  if (import.meta.client) {
    sessionStorage.setItem('orderItems', JSON.stringify([orderItem]))
  }

  showGuestModal.value = false
  router.push('/order?guest=true')
}

const handleToggleWishlist = async (isWishlisted) => {
  // 로그인 확인
  if (!authStore.isLoggedIn) {
    showLoginRequiredModal.value = true
    return
  }

  try {
    if (isWishlisted) {
      await addToWishlist(product.value.id)
      success(uiData.toast.addedToWishlist, {
        link: { text: uiData.toast.goToWishlist, href: '/mypage/wishlist' }
      })
    } else {
      const wishlistItem = getWishlistItem(product.value.id)
      if (wishlistItem) {
        await removeFromWishlist(wishlistItem.id)
      }
      success(uiData.toast.removedFromWishlist)
    }
  } catch (e) {
    const message = e?.data?.error?.message || e?.data?.message || uiData.toast.error
    showError(message)
  }
}

// 비회원 주문 모달
const showGuestModal = ref(false)

// 로그인 필요 모달 (위시리스트용)
const showLoginRequiredModal = ref(false)

// 리뷰/Q&A 작성 모달
const isReviewModalOpen = ref(false)
const isQnaModalOpen = ref(false)

const handleWriteReview = () => {
  if (!authStore.isLoggedIn) {
    router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }
  isReviewModalOpen.value = true
}

const handleWriteQna = () => {
  if (!authStore.isLoggedIn) {
    router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }
  isQnaModalOpen.value = true
}

const handleReviewSubmitted = async () => {
  // 리뷰 목록 새로고침
  await refreshProductDetail()
}

const handleQnaSubmitted = async () => {
  // Q&A 목록 새로고침
  await refreshProductDetail()
}
</script>

<template>
  <div class="page-product-detail">
    <main class="page-product-detail__main">
      <template v-if="product">
        <!-- Hero Section -->
        <ProductDetailHero
          ref="productHeroRef"
          :product="product"
          :labels="detailData.hero"
          :wishlisted="isWishlisted"
          @add-to-cart="handleAddToCart"
          @buy-now="handleBuyNow"
          @toggle-wishlist="handleToggleWishlist"
        />

        <!-- Sticky Tabs -->
        <ProductDetailTabs
          v-model="activeTab"
          :tabs="detailData.tabs"
          :aria-label="detailData.tabsAriaLabel"
        />

        <!-- Detail Content -->
        <ProductDetailContent
          :images="product.detailImages"
          :html-content="product.detailContent"
          :labels="detailData.content"
        />

        <!-- Product Info (상품정보고시) -->
        <ProductDetailInfo
          :specs="product.specs?.length ? product.specs : detailData.info.specs"
          :labels="detailData.info"
        />

        <!-- Reviews -->
        <ProductDetailReviews
          :reviews="reviews"
          :labels="detailData.reviews"
          @write="handleWriteReview"
        />

        <!-- Q&A -->
        <ProductDetailQna
          :qna="qna"
          :labels="detailData.qna"
          @write="handleWriteQna"
        />

        <!-- Guide (구매안내) -->
        <ProductDetailGuide
          :data="detailData.guide"
        />
      </template>

      <!-- 로딩 상태 -->
      <div v-else-if="pending" class="page-product-detail__loading">
        <BaseSpinner size="large" />
      </div>

      <!-- 에러 상태 -->
      <div v-else-if="error" class="page-product-detail__error">
        상품을 불러올 수 없습니다.
      </div>
    </main>

    <!-- 리뷰 작성 모달 -->
    <ReviewWriteModal
      v-model="isReviewModalOpen"
      :product="product"
      @submitted="handleReviewSubmitted"
    />

    <!-- Q&A 작성 모달 -->
    <QnaWriteModal
      v-model="isQnaModalOpen"
      :product="product"
      @submitted="handleQnaSubmitted"
    />

    <!-- 비회원 주문 모달 -->
    <GuestOrderModal
      v-model="showGuestModal"
      @login="handleLoginAndBuy"
      @guest="handleGuestBuy"
    />

    <!-- 로그인 필요 모달 (위시리스트) -->
    <LoginRequiredModal v-model="showLoginRequiredModal" feature="위시리스트" />
  </div>
</template>
