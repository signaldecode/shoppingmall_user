<script setup>
import orderCompleteData from '~/data/order-complete.json'

// 주문 정보가 없으면 페이지 렌더링 전에 메인으로 리다이렉트
definePageMeta({
  keepalive: false,
  middleware: ['order-complete']
})

const route = useRoute()
const { paymentDeadlineDays } = useShopInfo()

// SEO
useHead({ title: orderCompleteData.seo.title })
useSeoMeta({
  title: orderCompleteData.seo.title,
  description: orderCompleteData.seo.description,
  ogTitle: orderCompleteData.seo.title,
  ogDescription: orderCompleteData.seo.description,
  ogImage: orderCompleteData.seo.ogImage
})

// sessionStorage에서 주문 완료 데이터 가져오기
const orderData = ref(null)

onMounted(() => {
  const cached = sessionStorage.getItem('orderCompleteData')
  if (cached) {
    try {
      orderData.value = JSON.parse(cached)
      sessionStorage.removeItem('orderCompleteData')
    } catch (e) {
      // 파싱 실패 시 무시
    }
  }
})

// URL에서 주문 정보 가져오기 (fallback)
const orderId = computed(() => {
  if (orderData.value?.orderId) return orderData.value.orderId
  const id = route.query.orderId
  if (!id || id === 'null' || id === 'undefined') return null
  return id
})
const orderNumber = computed(() => {
  if (orderData.value?.orderNumber) return orderData.value.orderNumber
  const num = route.query.orderNumber
  if (!num || num === 'null' || num === 'undefined') return null
  return num
})
const amount = computed(() => {
  if (orderData.value?.grandTotal) return Number(orderData.value.grandTotal)
  const amt = route.query.amount
  if (!amt || amt === 'null' || amt === 'undefined') return 0
  return Number(amt)
})

// 계좌 정보 (주문 응답의 bankTransferInfo에서 가져옴)
const bankAccount = computed(() => {
  const transferInfo = orderData.value?.bankTransferInfo || {}
  return {
    bankName: transferInfo.bankName || '',
    accountNumber: transferInfo.accountNumber || '',
    accountHolder: transferInfo.accountHolder || ''
  }
})

// 입금 기한
const depositDeadline = computed(() => {
  const deadline = orderData.value?.depositDeadline
  if (!deadline) return ''
  const date = new Date(deadline)
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
})

// 주문 상세 페이지로 이동
const authStore = useAuthStore()
const { getOrderByNumber, transformOrderDetail } = useOrder()

const goToOrderDetail = async () => {
  if (authStore.isLoggedIn) {
    const id = orderId.value || orderNumber.value
    navigateTo(`/mypage/orders/${id}${orderId.value ? '' : '?type=number'}`, { replace: true })
  } else if (orderNumber.value) {
    try {
      const data = await getOrderByNumber(orderNumber.value)
      const orderDetail = transformOrderDetail(data)
      sessionStorage.setItem('guestOrderDetail', JSON.stringify(orderDetail))
    } catch (e) {
      // 조회 실패해도 페이지 이동 (guest-order에서 리다이렉트 처리)
    }
    navigateTo(`/guest-order/${orderNumber.value}`, { replace: true })
  }
}

// 주문번호 복사
const { show: showToast } = useToast()

const copyOrderNumber = async () => {
  if (!orderNumber.value) return
  try {
    await navigator.clipboard.writeText(orderNumber.value)
    showToast(orderCompleteData.page.copySuccess)
  } catch {
    // fallback
    const textarea = document.createElement('textarea')
    textarea.value = orderNumber.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    showToast(orderCompleteData.page.copySuccess)
  }
}

// 쇼핑 계속하기
const goToCategory = () => {
  navigateTo('/category', { replace: true })
}
</script>

<template>
  <div class="page-order-complete">
    <main class="order-complete-page">
      <!-- 주문 완료 메시지 -->
      <div class="order-complete-page__header">
        <div class="order-complete-page__icon">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="32" cy="32" r="32" fill="currentColor" />
            <path d="M20 32L28 40L44 24" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <h1 class="order-complete-page__title">{{ orderCompleteData.page.message }}</h1>
        <p class="order-complete-page__description">{{ orderCompleteData.page.description }}</p>
        <button
          type="button"
          class="order-complete-page__order-number"
          @click="copyOrderNumber"
        >
          <span class="order-complete-page__order-number-label">{{ orderCompleteData.page.orderNumberLabel }}</span>
          <strong class="order-complete-page__order-number-value">{{ orderNumber || '-' }}</strong>
          <span class="order-complete-page__order-number-hint">{{ orderCompleteData.page.copyHint }}</span>
        </button>
      </div>

      <!-- 무통장 입금 안내 -->
      <section v-if="amount > 0" class="order-complete-page__bank-transfer">
        <h2 class="order-complete-page__bank-transfer-title">{{ orderCompleteData.bankTransfer.title }}</h2>
        <p class="order-complete-page__bank-transfer-desc">{{ orderCompleteData.bankTransfer.description }}</p>
        <dl class="order-complete-page__bank-transfer-info">
          <div class="order-complete-page__bank-transfer-row">
            <dt>{{ orderCompleteData.bankTransfer.amountLabel }}</dt>
            <dd class="order-complete-page__bank-transfer-amount">
              {{ amount.toLocaleString() }}{{ orderCompleteData.bankTransfer.currency }}
            </dd>
          </div>
          <div class="order-complete-page__bank-transfer-row">
            <dt>{{ orderCompleteData.bankTransfer.bankLabel }}</dt>
            <dd>{{ bankAccount.bankName }} {{ bankAccount.accountNumber }}</dd>
          </div>
          <div class="order-complete-page__bank-transfer-row">
            <dt>{{ orderCompleteData.bankTransfer.accountHolderLabel }}</dt>
            <dd>{{ bankAccount.accountHolder }}</dd>
          </div>
          <div v-if="depositDeadline" class="order-complete-page__bank-transfer-row">
            <dt>{{ orderCompleteData.bankTransfer.depositDeadlineLabel }}</dt>
            <dd class="order-complete-page__bank-transfer-deadline">{{ depositDeadline }}</dd>
          </div>
        </dl>
        <p class="order-complete-page__bank-transfer-notice">{{ orderCompleteData.bankTransfer.notice }}</p>
      </section>

      <!-- 버튼 영역 -->
      <div class="order-complete-page__buttons">
        <BaseButton
          :label="orderCompleteData.buttons.orderList"
          variant="line"
          color="black"
          size="big"
          @click="goToOrderDetail"
        />
        <BaseButton
          :label="orderCompleteData.buttons.continueShopping"
          variant="bg"
          color="green"
          size="big"
          @click="goToCategory"
        />
      </div>
    </main>
  </div>
</template>
