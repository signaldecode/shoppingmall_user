<script setup>
import orderData from '~/data/order.json'
import { validate } from '~/utils/validators'

const router = useRouter()
const authStore = useAuthStore()
const { warning } = useToast()
const { getOrderItems, clearOrderItems, createOrder } = useOrder()
const { fetchAddresses, defaultAddress } = useAddress()
const { removeFromCart } = useCart()
const { freeShippingAmount, baseShippingFee } = useShopInfo()

// SEO
useHead({ title: orderData.seo.title })
useSeoMeta({
  title: orderData.seo.title,
  description: orderData.seo.description,
  ogTitle: orderData.seo.title,
  ogDescription: orderData.seo.description,
  ogImage: orderData.seo.ogImage
})

// 회원 여부
const isMember = computed(() => authStore.isLoggedIn)

// 주문 상품 (바로구매 or 장바구니에서 가져옴)
const orderItems = ref([])

onMounted(async () => {
  // 주문 상품 로드
  const items = getOrderItems()
  if (items.length > 0) {
    orderItems.value = items
  }

  // 회원인 경우 배송지 목록 가져오기
  if (isMember.value) {
    // 배송지 목록 조회 (user 정보는 SSR에서 이미 가져옴)
    await fetchAddresses()

    // 주문자 정보 채우기 (SSR에서 가져온 user 정보 사용)
    if (authStore.user) {
      orderer.name = authStore.user.name || ''
      orderer.phone = authStore.user.phone || ''
      orderer.email = authStore.user.email || ''
    }

    // 기본 배송지로 배송 정보 채우기
    if (defaultAddress.value) {
      shipping.recipient = defaultAddress.value.recipient || ''
      shipping.phone = defaultAddress.value.phone || ''
      shipping.zipcode = defaultAddress.value.zipcode || ''
      shipping.address = defaultAddress.value.address || ''
      shipping.addressDetail = defaultAddress.value.addressDetail || ''
    } else if (authStore.user) {
      // 기본 배송지가 없으면 회원 정보로 수령인/연락처만 채우기
      shipping.recipient = authStore.user.name || ''
      shipping.phone = authStore.user.phone || ''
    }
  }
})

// 주문 상품 목록 (UI용 변환)
const orderProducts = computed(() => {
  if (orderItems.value.length > 0) {
    return orderItems.value.map(item => ({
      id: item.productId,
      name: item.productName,
      image: item.productImage,
      option: item.optionName,
      quantity: item.quantity,
      price: item.price,
      totalPrice: item.totalPrice
    }))
  }
  // 폴백: 더미 데이터
  return orderData.dummy.products
})

// Form State
const orderer = reactive({
  name: '',
  phone: '',
  email: ''
})

const shipping = reactive({
  sameAsOrderer: false,
  recipient: '',
  phone: '',
  zipcode: '',
  address: '',
  addressDetail: '',
  memo: '',
  customMemo: ''
})

const guestPassword = reactive({
  password: '',
  passwordConfirm: ''
})

const depositor = reactive({
  name: ''
})

const coupon = reactive({
  point: ''
})

// 쿠폰 선택 모달
const isCouponModalOpen = ref(false)
const selectedCoupon = ref(null)
const couponDiscount = ref(0)

const agreements = reactive({
  all: false,
  terms: false,
  privacy: false
})

// 주문자 정보와 동일 처리
watch(() => shipping.sameAsOrderer, (val) => {
  if (val) {
    shipping.recipient = orderer.name
    shipping.phone = orderer.phone
  }
})

// 결제 금액 계산
const summary = computed(() => {
  // 상품 총액 계산
  const productTotal = orderItems.value.length > 0
    ? orderItems.value.reduce((sum, item) => sum + item.totalPrice, 0)
    : orderData.dummy.summary.productTotal

  // 배송비 계산 (무료배송 기준 충족 시 무료)
  const freeThreshold = freeShippingAmount.value || 50000
  const baseFee = baseShippingFee.value || 3000
  const shippingFee = productTotal >= freeThreshold ? 0 : baseFee

  const base = {
    productTotal,
    shippingFee,
    discount: 0,
    couponDiscount: couponDiscount.value,
    pointUsed: 0,
    total: 0
  }

  // 포인트 사용
  const pointUsed = parseInt(coupon.point) || 0
  base.pointUsed = Math.min(pointUsed, orderData.dummy.availablePoint)

  // 총 결제 금액
  base.total = base.productTotal + base.shippingFee - base.discount - base.couponDiscount - base.pointUsed

  return base
})

// 필수 약관 동의 여부 (회원은 약관 동의 불필요)
const isAgreementValid = computed(() => {
  if (isMember.value) return true
  return agreements.terms && agreements.privacy
})

// 배송지 선택 모달
const isAddressModalOpen = ref(false)

// 배송지 선택 (저장된 배송지 목록에서 선택)
const selectAddress = () => {
  isAddressModalOpen.value = true
}

// 배송지 선택 완료 처리
const handleAddressSelect = (address) => {
  shipping.recipient = address.recipient
  shipping.phone = address.phone
  shipping.zipcode = address.zipcode
  shipping.address = address.address
  shipping.addressDetail = address.addressDetail || ''
}

// 쿠폰 모달 열기
const openCouponModal = () => {
  isCouponModalOpen.value = true
}

// 쿠폰 선택 완료 처리
const handleCouponSelect = ({ coupon, discountAmount }) => {
  selectedCoupon.value = coupon
  couponDiscount.value = discountAmount
}

// 결제하기
const handleSubmit = async () => {
  // 주문 상품 확인
  if (orderItems.value.length === 0) {
    warning('주문할 상품이 없습니다.')
    return
  }

  if (!isAgreementValid.value) {
    warning(orderData.sections.agreements.requiredAlert || '필수 약관에 동의해주세요.')
    return
  }

  // 비회원인 경우 주문자 연락처도 검사
  if (!isMember.value && !validate('phone', orderer.phone.replace(/-/g, ''))) {
    warning(orderData.validation?.ordererPhone || '주문자 연락처 형식이 올바르지 않습니다.')
    return
  }

  // 수령인 이름 검사
  if (!shipping.recipient?.trim()) {
    warning(orderData.validation?.recipient || '수령인 이름을 입력해주세요.')
    return
  }

  // 배송지 연락처 입력 여부 검사
  if (!shipping.phone?.trim()) {
    warning(orderData.validation?.phone || '배송지 연락처를 입력해주세요.')
    return
  }

  // 배송지 연락처 형식 검사
  if (!validate('phone', shipping.phone.replace(/-/g, ''))) {
    warning(orderData.validation?.shippingPhone || '배송지 연락처 형식이 올바르지 않습니다.')
    return
  }

  // 배송지 주소 검사
  if (!shipping.zipcode?.trim() || !shipping.address?.trim()) {
    warning(orderData.validation?.address || '배송지 주소를 입력해주세요.')
    return
  }

  // 입금자명 검사
  if (!depositor.name?.trim()) {
    warning(orderData.validation?.depositor || '입금자명을 입력해주세요.')
    return
  }

  // 주문 생성 요청 데이터
  const orderPayload = {
    items: orderItems.value.map(item => {
      const orderItem = { productId: item.productId, quantity: item.quantity }
      if (item.variantId) orderItem.variantId = item.variantId
      return orderItem
    }),
    shippingAddress: {
      recipientName: shipping.recipient,
      recipientPhone: shipping.phone,
      postalCode: shipping.zipcode,
      address1: shipping.address,
      address2: shipping.addressDetail
    },
    depositorName: depositor.name,
    expectedAmount: summary.value.total,
    customerNote: shipping.memo === 'custom' ? shipping.customMemo : shipping.memo,
    orderChannel: 'WEB'
  }

  // 선택된 쿠폰이 있는 경우
  if (selectedCoupon.value?.id) {
    orderPayload.userCouponId = selectedCoupon.value.id
  }

  // 비회원인 경우 guest 정보 추가
  if (!isMember.value) {
    orderPayload.guestEmail = orderer.email
    orderPayload.guestPhone = orderer.phone
    orderPayload.guestPassword = guestPassword.password
  }

  const result = await createOrder(orderPayload)

  if (!result.success) {
    warning(result.error)
    return
  }

  // 장바구니에서 주문한 경우 해당 아이템 제거
  const cartItemIds = orderItems.value.map(item => item.cartItemId).filter(Boolean)
  for (const cartItemId of cartItemIds) {
    await removeFromCart(cartItemId)
  }

  clearOrderItems()

  const orderCompleteData = {
    orderId: result.data?.orderId || result.orderId,
    orderNumber: result.data?.orderNumber || result.orderNumber,
    grandTotal: result.data?.grandTotal || summary.value.total,
    shippingAddress: result.data?.shippingAddress || null,
    bankTransferInfo: result.data?.bankTransferInfo || null,
    depositDeadline: result.data?.depositDeadline || null
  }
  sessionStorage.setItem('orderCompleteData', JSON.stringify(orderCompleteData))

  router.push({
    path: '/order-complete',
    query: {
      orderNumber: result.data?.orderNumber || result.orderNumber,
      amount: result.data?.grandTotal || summary.value.total
    }
  })
}
</script>

<template>
  <div class="page-order">
    <main class="order-page">
      <form class="order-page__content" @submit.prevent="handleSubmit">
        <div class="order-page__main">
          <!-- 1. 구매 상품 -->
          <section class="order-section">
            <header class="order-section__header">
              <h2 class="order-section__title">{{ orderData.sections.products.title }}</h2>
            </header>
            <div class="order-products">
              <OrderProductCard
                v-for="product in orderProducts"
                :key="product.id"
                :product="product"
                :labels="orderData.sections.products.labels"
              />
            </div>
          </section>

          <!-- 2. 주문자 정보 (비회원만 표시) -->
          <OrderOrdererSection
            v-if="!isMember"
            :model-value="orderer"
            :labels="orderData.sections.orderer"
            @update:model-value="val => Object.assign(orderer, val)"
          />

          <!-- 3. 배송지 정보 -->
          <OrderShippingSection
            :model-value="shipping"
            :labels="orderData.sections.shipping"
            :show-same-as-orderer="!isMember"
            :show-select-address="isMember"
            @update:model-value="val => Object.assign(shipping, val)"
            @select-address="selectAddress"
          />

          <!-- 4. 입금자 정보 -->
          <section class="order-section">
            <header class="order-section__header">
              <h2 class="order-section__title">{{ orderData.sections.depositor.title }}</h2>
            </header>
            <div class="order-section__content">
              <BaseInput
                v-model="depositor.name"
                :label="orderData.sections.depositor.fields.name.label"
                :placeholder="orderData.sections.depositor.fields.name.placeholder"
                required
              />
            </div>
          </section>

          <!-- 5. 비회원 주문조회 비밀번호 (비회원만) -->
          <OrderGuestPasswordSection
            v-if="!isMember"
            :model-value="guestPassword"
            :labels="orderData.sections.guestPassword"
            @update:model-value="val => Object.assign(guestPassword, val)"
          />

          <!-- 7. 할인 / 쿠폰 -->
          <!-- <OrderCouponSection
            v-model="coupon"
            :labels="orderData.sections.coupon"
            :selected-coupon="selectedCoupon"
            :coupon-discount="couponDiscount"
            :available-point="orderData.dummy.availablePoint"
            @open-coupon-modal="openCouponModal"
          /> -->

        </div>

        <!-- 결제 금액 사이드바 -->
        <OrderSummaryAside
          v-model:agreements="agreements"
          :summary="summary"
          :labels="orderData.summary"
          :agreement-labels="orderData.sections.agreements"
          :submit-label="isMember ? orderData.submit.member : orderData.submit.guest"
          :disabled="!isAgreementValid"
          :hide-agreements="isMember"
          @submit="handleSubmit"
        />
      </form>
    </main>

    <!-- 배송지 선택 모달 (회원만) -->
    <AddressSelectModal
      v-if="isMember"
      v-model="isAddressModalOpen"
      mode="select"
      @select="handleAddressSelect"
    />

    <!-- 쿠폰 선택 모달 -->
    <CouponSelectModal
      v-model="isCouponModalOpen"
      :subtotal="summary.productTotal"
      :selected-coupon-id="selectedCoupon?.id"
      @select="handleCouponSelect"
    />

    <FloatingPaymentBar
      v-model:agreements="agreements"
      :summary="summary"
      :labels="orderData.summary"
      :agreement-labels="orderData.sections.agreements"
      :submit-label="isMember ? orderData.submit.member : orderData.submit.guest"
      :disabled="!isAgreementValid"
      :hide-agreements="isMember"
      @submit="handleSubmit"
    />
  </div>
</template>
