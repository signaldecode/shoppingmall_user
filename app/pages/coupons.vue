<script setup>
import couponData from '~/data/coupon-download.json'

// SEO
useHead({ title: couponData.seo.title })
useSeoMeta({
  title: couponData.seo.title,
  description: couponData.seo.description
})

const authStore = useAuthStore()
const { success, warning } = useToast()

const {
  transformedCoupons,
  pending,
  fetchCoupons,
  downloadCoupon,
  downloadAllCoupons,
  isDownloaded
} = useDownloadableCoupons()

// 로그인 필요 모달
const showLoginModal = ref(false)

// 등급별 쿠폰팩 더미 데이터 (추후 API 연동)
const gradePacks = ref([
  {
    id: 1,
    gradeName: 'SILVER',
    condition: '10만원 이상 구매',
    coupons: [
      { name: '5% 할인 쿠폰', description: '전 상품' },
      { name: '3,000원 할인 쿠폰', description: '3만원 이상 구매 시' }
    ],
    isDownloaded: false
  },
  {
    id: 2,
    gradeName: 'GOLD',
    condition: '30만원 이상 구매',
    coupons: [
      { name: '10% 할인 쿠폰', description: '전 상품' },
      { name: '5,000원 할인 쿠폰', description: '5만원 이상 구매 시' },
      { name: '무료배송 쿠폰', description: '전 상품' }
    ],
    isDownloaded: false
  },
  {
    id: 3,
    gradeName: 'VIP',
    condition: '월 50만원 이상 구매',
    coupons: [
      { name: '15% 할인 쿠폰', description: '전 상품' },
      { name: '10,000원 할인 쿠폰', description: '10만원 이상 구매 시' },
      { name: '무료배송 쿠폰', description: '전 상품' },
      { name: '생일 20% 할인 쿠폰', description: '생일 당월' }
    ],
    isDownloaded: true
  },
  {
    id: 4,
    gradeName: 'VVIP',
    condition: '100만원 이상 구매',
    coupons: [
      { name: '20% 할인 쿠폰', description: '전 상품' },
      { name: '20,000원 할인 쿠폰', description: '15만원 이상 구매 시' },
      { name: '무료배송 쿠폰', description: '전 상품' },
      { name: '생일 30% 할인 쿠폰', description: '생일 당월' },
      { name: '프리미엄 케어 쿠폰', description: '전용 상담' }
    ],
    isDownloaded: false
  }
])

// 쿠폰팩 다운로드
const downloadGradePack = (pack) => {
  // 로그인 체크
  if (!authStore.isLoggedIn) {
    showLoginModal.value = true
    return
  }

  if (pack.isDownloaded) {
    warning(couponData.messages.alreadyDownloaded)
    return
  }

  // TODO: API 연동
  // await post(`/coupons/grade-packs/${pack.id}/download`)
  pack.isDownloaded = true
  success(couponData.messages.downloadSuccess)
  fetchCoupons() // 쿠폰 목록 새로고침
}

// 쿠폰 목록 조회
onMounted(() => {
  fetchCoupons()
})

// 다운로드 가능한 쿠폰 개수
const availableCount = computed(() => {
  return transformedCoupons.value.filter(c => !isDownloaded(c.id)).length
})

// 다운로드 중 상태
const downloading = ref(false)

// 쿠폰 다운로드
const handleDownload = async (coupon) => {
  // 로그인 체크
  if (!authStore.isLoggedIn) {
    showLoginModal.value = true
    return
  }

  // 이미 다운로드한 쿠폰
  if (isDownloaded(coupon.id)) {
    warning(couponData.messages.alreadyDownloaded)
    return
  }

  downloading.value = true
  const result = await downloadCoupon(coupon.id)
  downloading.value = false

  if (result.success) {
    if (result.alreadyDownloaded) {
      warning(couponData.messages.alreadyDownloaded)
    } else {
      success(couponData.messages.downloadSuccess)
    }
  } else {
    warning(result.error || couponData.messages.downloadError)
  }
}

// 전체 쿠폰 다운로드
const handleDownloadAll = async () => {
  // 로그인 체크
  if (!authStore.isLoggedIn) {
    showLoginModal.value = true
    return
  }

  // 다운로드 가능한 쿠폰이 없는 경우
  if (availableCount.value === 0) {
    warning(couponData.messages.alreadyDownloaded)
    return
  }

  downloading.value = true
  const results = await downloadAllCoupons()
  downloading.value = false

  if (results.success > 0) {
    success(`${results.success}${couponData.messages.downloadAllSuccess}`)
  }
  if (results.failed > 0) {
    warning(`${results.failed}${couponData.messages.downloadAllFailed}`)
  }
}
</script>

<template>
  <div class="page-coupons">
    <main class="coupon-download-page">
      <div class="coupon-download-page__inner">
        <header class="coupon-download-page__header">
          <h1 class="coupon-download-page__title">{{ couponData.page.title }}</h1>
          <p class="coupon-download-page__subtitle">{{ couponData.page.subtitle }}</p>
        </header>

        <!-- 전체 다운받기 버튼 -->
        <div v-if="!pending && transformedCoupons.length > 0" class="coupon-download-page__actions">
          <BaseButton
            :label="couponData.page.downloadAllButton"
            variant="bg"
            color="primary"
            size="small"
            :disabled="availableCount === 0"
            :loading="downloading"
            @click="handleDownloadAll"
          />
        </div>

        <!-- 로딩 -->
        <div v-if="pending" class="coupon-download-page__loading">
          <BaseSpinner />
        </div>

        <!-- 쿠폰 목록 -->
        <template v-else>
          <div v-if="transformedCoupons.length > 0" class="coupon-download-page__grid">
            <div
              v-for="coupon in transformedCoupons"
              :key="coupon.id"
              class="coupon-download-card"
              :class="{ 'coupon-download-card--downloaded': isDownloaded(coupon.id) }"
            >
              <div class="coupon-download-card__left">
                <span class="coupon-download-card__discount">{{ coupon.discountText }}</span>
                <span v-if="coupon.dDay !== null" class="coupon-download-card__dday">
                  {{ couponData.coupon.dDay }}{{ coupon.dDay }}
                </span>
              </div>

              <div class="coupon-download-card__content">
                <h3 class="coupon-download-card__name">{{ coupon.name }}</h3>
                <p v-if="coupon.description" class="coupon-download-card__desc">{{ coupon.description }}</p>

                <div class="coupon-download-card__info">
                  <span v-if="coupon.minOrderAmount > 0" class="coupon-download-card__condition">
                    {{ coupon.minOrderAmount.toLocaleString() }}원 {{ couponData.coupon.minOrder }}
                  </span>
                  <span v-if="coupon.maxDiscountText" class="coupon-download-card__max">
                    {{ coupon.maxDiscountText }}
                  </span>
                  <span class="coupon-download-card__target">{{ coupon.targetCategoryName }}</span>
                </div>

                <p class="coupon-download-card__valid">
                  <template v-if="coupon.isFromDownload">
                    {{ couponData.coupon.validFromDownload }} {{ coupon.validityDays }}{{ couponData.coupon.validDaysSuffix }}
                  </template>
                  <template v-else>
                    {{ coupon.validUntilDate }} {{ couponData.coupon.validUntil }}
                  </template>
                </p>
              </div>

              <div class="coupon-download-card__action">
                <BaseButton
                  v-if="isDownloaded(coupon.id)"
                  :label="couponData.coupon.downloadedButton"
                  variant="bg"
                  color="light"
                  size="small"
                  disabled
                />
                <BaseButton
                  v-else
                  :label="couponData.coupon.downloadButton"
                  variant="bg"
                  color="green"
                  size="small"
                  :loading="downloading"
                  @click="handleDownload(coupon)"
                />
              </div>
            </div>
          </div>

          <!-- 빈 상태 -->
          <BaseEmpty
            v-else
            :message="couponData.empty.title"
          />
        </template>

        <!-- 등급별 쿠폰팩 todo: 추후 구현 -->
        <!-- <section class="coupon-download-page__grade-packs">
          <h2 class="coupon-download-page__grade-title">{{ couponData.gradePacks.title }}</h2>
          <div class="coupon-download-page__grade-grid">
            <article
              v-for="pack in gradePacks"
              :key="pack.id"
              class="grade-pack-card"
              :class="{ 'grade-pack-card--downloaded': pack.isDownloaded }"
            >
              <div class="grade-pack-card__header">
                <h3 class="grade-pack-card__grade">{{ pack.gradeName }}</h3>
              </div>
              <div class="grade-pack-card__body">
                <div class="grade-pack-card__condition">
                  <span class="grade-pack-card__label">{{ couponData.gradePacks.condition }}</span>
                  <span class="grade-pack-card__value">{{ pack.condition }}</span>
                </div>
                <div class="grade-pack-card__benefits">
                  <span class="grade-pack-card__label">{{ couponData.gradePacks.benefits }}</span>
                  <ul class="grade-pack-card__coupon-list">
                    <li v-for="(coupon, idx) in pack.coupons" :key="idx" class="grade-pack-card__coupon-item">
                      <span class="grade-pack-card__coupon-name">{{ coupon.name }}</span>
                      <span class="grade-pack-card__coupon-desc">{{ coupon.description }}</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div class="grade-pack-card__footer">
                <BaseButton
                  :label="pack.isDownloaded ? couponData.gradePacks.downloadedButton : couponData.gradePacks.downloadButton"
                  :variant="pack.isDownloaded ? 'line' : 'bg'"
                  :color="pack.isDownloaded ? 'black' : 'green'"
                  size="small"
                  :disabled="pack.isDownloaded"
                  @click="downloadGradePack(pack)"
                />
              </div>
            </article>
          </div>
        </section> -->
      </div>
    </main>

    <!-- 로그인 필요 모달 -->
    <LoginRequiredModal
      v-model="showLoginModal"
      feature="쿠폰 다운로드"
      redirect-path="/coupons"
    />
  </div>
</template>
