<script setup>
import paymentData from '~/data/payment.json'

const route = useRoute()
const router = useRouter()
const { confirmPayment } = usePayments()
const { clearOrderItems } = useOrder()
const { removeFromCart } = useCart()

useHead({ title: paymentData.success.seo.title })
useSeoMeta({
  title: paymentData.success.seo.title,
  description: paymentData.success.seo.description
})

const status = ref('loading')
const errorMessage = ref('')

onMounted(async () => {
  const { paymentKey, orderId, amount } = route.query

  if (!paymentKey || !orderId || !amount) {
    status.value = 'error'
    errorMessage.value = '결제 정보가 올바르지 않습니다.'
    return
  }

  try {
    await confirmPayment({
      paymentKey: String(paymentKey),
      orderId: String(orderId),
      amount: Number(amount)
    })

    const paymentOrder = JSON.parse(sessionStorage.getItem('paymentOrder') || '{}')

    if (paymentOrder.cartItemIds?.length > 0) {
      try {
        await removeFromCart(paymentOrder.cartItemIds)
      } catch (e) {
        console.warn('Failed to remove cart items:', e)
      }
    }

    clearOrderItems()
    sessionStorage.removeItem('paymentOrder')

    const queryParams = new URLSearchParams()
    if (paymentOrder.orderNumber) queryParams.append('orderNumber', paymentOrder.orderNumber)
    if (paymentOrder.grandTotal) queryParams.append('amount', paymentOrder.grandTotal)
    router.replace(`/order-complete?${queryParams.toString()}`)
  } catch (err) {
    status.value = 'error'
    errorMessage.value = err.data?.message || err.message || '결제 승인에 실패했습니다.'
  }
})

const goHome = () => navigateTo('/', { replace: true })
const retry = () => navigateTo('/order', { replace: true })
</script>

<template>
  <div class="page-payment-result">
    <main class="payment-result">
      <div v-if="status === 'loading'" class="payment-result__loading">
        <BaseSpinner size="large" />
        <h1 class="payment-result__title">{{ paymentData.success.message }}</h1>
        <p class="payment-result__description">{{ paymentData.success.description }}</p>
      </div>

      <div v-else-if="status === 'error'" class="payment-result__error">
        <h1 class="payment-result__title">{{ paymentData.success.errorTitle }}</h1>
        <p class="payment-result__description">{{ errorMessage }}</p>
        <div class="payment-result__buttons">
          <BaseButton
            :label="paymentData.success.retryButton"
            variant="line"
            color="black"
            size="big"
            @click="retry"
          />
          <BaseButton
            :label="paymentData.success.homeButton"
            variant="bg"
            color="green"
            size="big"
            @click="goHome"
          />
        </div>
      </div>
    </main>
  </div>
</template>
