<script setup>
import cartData from '~/data/cart.json'

useHead({ title: cartData.seo.title })
useSeoMeta({
  title: cartData.seo.title,
  description: cartData.seo.description
})

const { warning, success } = useToast()
const cart = useCart()
const { freeShippingAmount, baseShippingFee } = useShopInfo()
const authStore = useAuthStore()

// 비회원 주문 모달
const showGuestModal = ref(false)

// 장바구니 조회
onMounted(async () => {
  try {
    await cart.fetchCart()
  } catch (e) {
    console.warn('Failed to fetch cart:', e)
  }
})

// 장바구니 아이템 UI 모델로 변환
const cartProducts = computed(() => {
  return (cart.items.value || []).map((it) => {
    const quantity = Number(it.quantity ?? it.qty ?? 1)
    const price = Number(it.price ?? it.unitPrice ?? 0)
    return {
      id: it.id ?? it.cartItemId ?? it.productId ?? String(Math.random()),
      productId: it.productId,
      variantId: it.variantId,
      name: it.name ?? it.productName ?? '-',
      variantName: it.variantName ?? it.optionName ?? it.option ?? '',
      image: it.image ?? it.imageUrl ?? '/images/빈이미지.png',
      imageAlt: it.imageAlt ?? it.name ?? '상품 이미지',
      quantity,
      price,
      totalPrice: price * quantity,
      soldOut: Boolean(it.soldOut)
    }
  })
})

// 품절 상품 제외한 목록
const availableProducts = computed(() => {
  return cartProducts.value.filter(p => !p.soldOut)
})

// 선택 상태 관리
const selectedIds = ref(new Set())

// 전체 선택 여부 (품절 상품 제외)
const isAllSelected = computed(() => {
  if (availableProducts.value.length === 0) return false
  return availableProducts.value.every(p => selectedIds.value.has(p.id))
})

// 선택된 상품 목록
const selectedProducts = computed(() => {
  return cartProducts.value.filter(p => selectedIds.value.has(p.id))
})

// 전체선택/해제 토글 (품절 상품 제외)
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value.clear()
  } else {
    availableProducts.value.forEach(p => selectedIds.value.add(p.id))
  }
  // trigger reactivity
  selectedIds.value = new Set(selectedIds.value)
}

// 개별 선택
const handleSelect = (id, checked) => {
  if (checked) {
    selectedIds.value.add(id)
  } else {
    selectedIds.value.delete(id)
  }
  selectedIds.value = new Set(selectedIds.value)
}

// 수량 변경
const handleQuantityChange = async (id, quantity) => {
  try {
    await cart.updateQuantity(id, quantity)
  } catch (e) {
    const message = e?.data?.error?.message || e?.data?.message || e?.message || cartData.messages.quantityError
    warning(message)
  }
}

// 개별 삭제
const handleDelete = async (id) => {
  try {
    await cart.removeFromCart(id)
    selectedIds.value.delete(id)
    selectedIds.value = new Set(selectedIds.value)
    success(cartData.messages.deleteSuccess)
  } catch (e) {
    const message = e?.data?.error?.message || e?.data?.message || e?.message || cartData.messages.deleteError
    warning(message)
  }
}

// 선택 삭제
const handleDeleteSelected = async () => {
  if (selectedIds.value.size === 0) return
  try {
    const ids = Array.from(selectedIds.value)
    await cart.removeFromCart(ids)
    selectedIds.value.clear()
    selectedIds.value = new Set(selectedIds.value)
    success(cartData.messages.deleteSuccess)
  } catch (e) {
    const message = e?.data?.error?.message || e?.data?.message || e?.message || cartData.messages.deleteError
    warning(message)
  }
}

// 전체 삭제
const handleDeleteAll = async () => {
  if (cartProducts.value.length === 0) return
  try {
    await cart.clearCart()
    selectedIds.value.clear()
    selectedIds.value = new Set(selectedIds.value)
    success(cartData.messages.deleteSuccess)
  } catch (e) {
    const message = e?.data?.error?.message || e?.data?.message || e?.message || cartData.messages.clearError
    warning(message)
  }
}

// 결제 정보 (선택된 상품 기준, 품절 상품 제외)
const summary = computed(() => {
  // 선택된 상품이 있으면 선택된 상품 중 품절 제외, 없으면 전체 상품 중 품절 제외
  const items = selectedProducts.value.length > 0
    ? selectedProducts.value.filter(p => !p.soldOut)
    : availableProducts.value
  const productTotal = items.reduce((sum, p) => sum + (p.totalPrice || 0), 0)

  // 배송비 계산 (상품이 없으면 0, 무료배송 기준 충족 시 0)
  const freeThreshold = freeShippingAmount.value || 50000
  const baseFee = baseShippingFee.value || 3000
  const shippingFee = productTotal === 0 ? 0 : (productTotal >= freeThreshold ? 0 : baseFee)

  const discount = 0
  const couponDiscount = 0
  const pointUsed = 0
  return {
    productTotal,
    shippingFee,
    discount,
    couponDiscount,
    pointUsed,
    total: productTotal + shippingFee - discount - couponDiscount - pointUsed
  }
})

// 주문 아이템 준비
const prepareOrderItems = () => {
  // 선택된 상품이 있으면 선택된 상품만, 없으면 품절 제외한 전체 상품
  const items = selectedProducts.value.length > 0 ? selectedProducts.value : availableProducts.value
  if (items.length === 0) return null

  // 품절 상품이 포함되어 있으면 경고
  const hasSoldOut = items.some(p => p.soldOut)
  if (hasSoldOut) {
    warning(cartData.messages.soldOutAlert)
    return null
  }

  return items.map((p) => ({
    cartItemId: p.id, // 장바구니 아이템 ID (주문 완료 후 삭제용)
    productId: p.productId || p.id,
    variantId: p.variantId || null,
    quantity: p.quantity,
    productName: p.name,
    productImage: p.image,
    optionName: p.variantName,
    price: p.price,
    totalPrice: p.totalPrice
  }))
}

// 주문하기
const handleOrder = () => {
  const orderItems = prepareOrderItems()
  if (!orderItems) return

  // 로그인 상태 확인
  if (!authStore.isLoggedIn) {
    showGuestModal.value = true
    return
  }

  // 로그인된 경우 바로 주문 페이지로
  if (import.meta.client) {
    sessionStorage.setItem('orderItems', JSON.stringify(orderItems))
  }
  navigateTo('/order')
}

// 로그인 후 주문하기
const handleLogin = () => {
  const orderItems = prepareOrderItems()
  if (!orderItems) return

  if (import.meta.client) {
    sessionStorage.setItem('orderItems', JSON.stringify(orderItems))
  }
  showGuestModal.value = false
  navigateTo('/login?redirect=/order')
}

// 비회원 주문하기
const handleGuestOrder = () => {
  const orderItems = prepareOrderItems()
  if (!orderItems) return

  if (import.meta.client) {
    sessionStorage.setItem('orderItems', JSON.stringify(orderItems))
  }
  showGuestModal.value = false
  navigateTo('/order?guest=true')
}

// 주문 버튼 라벨
const submitLabel = computed(() => {
  if (selectedProducts.value.length > 0) {
    return `${cartData.submit.label} (${selectedProducts.value.length})`
  }
  return cartData.submit.labelAll
})
</script>

<template>
  <div class="page-cart">
    <main class="cart-page">
      <div class="cart-page__content">
        <div class="cart-page__main">
          <section class="cart-section">
            <header class="cart-section__header">
              <h1 class="cart-section__title">{{ cartData.page.title }}</h1>
            </header>

            <!-- Toolbar: 전체선택 / 선택삭제 -->
            <div v-if="cartProducts.length > 0" class="cart-toolbar">
              <div class="cart-toolbar__left">
                <BaseCheckbox
                  :model-value="isAllSelected"
                  variant="circle"
                  size="big"
                  :label="isAllSelected ? cartData.toolbar.deselectAll : cartData.toolbar.selectAll"
                  @update:model-value="toggleSelectAll"
                />
              </div>
              <div class="cart-toolbar__right">
                <button
                  type="button"
                  class="cart-toolbar__delete-btn"
                  :disabled="selectedIds.size === 0"
                  @click="handleDeleteSelected"
                >
                  {{ cartData.toolbar.deleteSelected }}
                </button>
                <button
                  type="button"
                  class="cart-toolbar__delete-btn"
                  @click="handleDeleteAll"
                >
                  {{ cartData.toolbar.deleteAll }}
                </button>
              </div>
            </div>

            <!-- Cart Products -->
            <div class="cart-products">
              <CartProductCard
                v-for="product in cartProducts"
                :key="product.id"
                :item="product"
                :selected="selectedIds.has(product.id)"
                :sold-out="product.soldOut"
                :labels="cartData.product"
                @update:selected="handleSelect"
                @update:quantity="handleQuantityChange"
                @delete="handleDelete"
              />

              <p v-if="!cart.pending.value && cartProducts.length === 0" class="cart-empty">
                {{ cartData.empty.message }}
              </p>
            </div>
          </section>
        </div>

        <OrderSummaryAside
          :summary="summary"
          :labels="cartData.summary"
          :submit-label="submitLabel"
          :disabled="cartProducts.length === 0"
          hide-agreements
          @submit="handleOrder"
        />
      </div>

    </main>

    <FloatingPaymentBar
      :summary="summary"
      :labels="cartData.summary"
      :submit-label="submitLabel"
      :disabled="cartProducts.length === 0"
      hide-agreements
      @submit="handleOrder"
    />

    <!-- 비회원 주문 모달 -->
    <GuestOrderModal
      v-model="showGuestModal"
      @login="handleLogin"
      @guest="handleGuestOrder"
    />
  </div>
</template>
