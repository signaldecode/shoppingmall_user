<script setup>
const route = useRoute()
const code = computed(() => route.params.code)

// 프로모션 상세 조회 (추후 API 연동)
const { get } = useApi()
const promotion = ref(null)
const pending = ref(true)
const error = ref(null)

const fetchPromotion = async () => {
  pending.value = true
  try {
    const response = await get(`/main/promotions/${code.value}`)
    promotion.value = response.data || response
  } catch (err) {
    console.error('Failed to fetch promotion:', err)
    error.value = err
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  fetchPromotion()
})

// SEO
import promoData from '~/data/promotions.json'

useHead({ title: computed(() => promotion.value?.name || promoData.seo.fallbackTitle) })
useSeoMeta({
  title: computed(() => promotion.value?.name || promoData.seo.fallbackTitle),
  description: computed(() => promotion.value?.description || '')
})
</script>

<template>
  <div class="page-promotion">
    <main class="promotion-page">
      <div class="promotion-page__inner">
        <!-- 로딩 -->
        <div v-if="pending" class="promotion-page__loading">
          <BaseSpinner />
        </div>

        <!-- 에러 -->
        <div v-else-if="error" class="promotion-page__error">
          <p>{{ promoData.error.message }}</p>
          <BaseButton :label="promoData.error.homeButton" href="/" variant="primary" />
        </div>

        <!-- 프로모션 상세 -->
        <template v-else-if="promotion">
          <div class="promotion-page__header">
            <h1 class="promotion-page__title">{{ promotion.name }}</h1>
            <p class="promotion-page__description">{{ promotion.description }}</p>
          </div>

          <div class="promotion-page__image">
            <img
              v-if="promotion.imageUrl"
              :src="promotion.imageUrl"
              :alt="promotion.name"
            />
          </div>

          <div class="promotion-page__info">
            <dl class="promotion-page__details">
              <div v-if="promotion.discountType" class="promotion-page__detail-item">
                <dt>할인</dt>
                <dd>
                  {{ promotion.discountType === 'PERCENTAGE' ? `${promotion.discountValue}%` : `${promotion.discountValue?.toLocaleString()}원` }}
                </dd>
              </div>
              <div v-if="promotion.minPurchaseAmount" class="promotion-page__detail-item">
                <dt>최소 구매금액</dt>
                <dd>{{ promotion.minPurchaseAmount?.toLocaleString() }}원</dd>
              </div>
              <div v-if="promotion.maxDiscountAmount" class="promotion-page__detail-item">
                <dt>최대 할인금액</dt>
                <dd>{{ promotion.maxDiscountAmount?.toLocaleString() }}원</dd>
              </div>
              <div v-if="promotion.startedAt || promotion.endedAt" class="promotion-page__detail-item">
                <dt>기간</dt>
                <dd>{{ promotion.startedAt?.split('T')[0] }} ~ {{ promotion.endedAt?.split('T')[0] }}</dd>
              </div>
            </dl>
          </div>
        </template>
      </div>
    </main>
  </div>
</template>
