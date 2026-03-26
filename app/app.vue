<script setup>
import mainData from '~/data/main.json'
import uiData from '~/data/ui.json'

const route = useRoute()
const { faviconUrl, shopName, seoInfo, headerMenu, fetchShopInfo } = useShopInfo()

// 세션 만료 모달
const authStore = useAuthStore()
const sessionExpiredModalData = uiData.sessionExpiredModal

// 모달 표시 조건: sessionExpired가 true이고, 실제로 로그인했던 적이 있는 경우만
const showSessionExpiredModal = computed({
  get: () => {
    // SSR에서는 항상 false (클라이언트에서만 표시)
    if (import.meta.server) return false
    // 로그인 기록이 없으면 모달 표시 안 함
    if (!localStorage.getItem('isLoggedIn')) return false
    return authStore.sessionExpired
  },
  set: (val) => {
    authStore.sessionExpired = val
  }
})

const handleSessionExpiredConfirm = () => {
  authStore.logout()
  navigateTo('/login')
}

// 앱 시작 시 쇼핑몰 정보 로드
onMounted(() => {
  fetchShopInfo()
})

// 헤더 메뉴 (API에서 받아오거나 기본값 사용)
const navItems = computed(() => {
  if (headerMenu.value && headerMenu.value.length > 0) {
    // API 응답: label(표시텍스트), id(URL경로), order(순서)
    return [...headerMenu.value]
      .sort((a, b) => a.order - b.order)
      .map(item => ({
        label: item.label,
        href: item.id.startsWith('/') ? item.id : `/${item.id}`
      }))
  }
  return mainData.header.nav
})

// 파비콘 및 글로벌 SEO 설정
const seoTitle = computed(() => seoInfo.value?.title || shopName.value || '')

useHead(() => ({
  title: seoTitle.value,
  titleTemplate: (titleChunk) => {
    const suffix = seoTitle.value
    if (!titleChunk || titleChunk === suffix) return suffix
    return `${titleChunk} | ${suffix}`
  },
  link: faviconUrl.value
    ? [{ rel: 'icon', type: 'image/x-icon', href: faviconUrl.value }]
    : []
}))

// 글로벌 SEO 메타 (shop-info 기반)
useSeoMeta({
  description: () => seoInfo.value?.description || '',
  keywords: () => seoInfo.value?.keywords || '',
  ogSiteName: () => shopName.value || '',
  ogType: 'website',
  ogTitle: () => seoInfo.value?.ogTitle || seoInfo.value?.title || shopName.value || '',
  ogDescription: () => seoInfo.value?.ogDescription || seoInfo.value?.description || '',
  ogImage: () => seoInfo.value?.ogImage || ''
})

// portfolio 스타일: 항상 glassmorphism, variant 없음 (스크롤 시에만 scrolled 적용)
const headerVariant = computed(() => undefined)

</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <Header
      :logo="mainData.header.logo"
      :nav="navItems"
      :nav-aria-label="mainData.header.navAriaLabel"
      :variant="headerVariant"
    />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Footer :data="mainData.footer" />
    <BaseToast />

    <!-- 세션 만료 모달 -->
    <BaseModal
      v-model="showSessionExpiredModal"
      :title="sessionExpiredModalData.title"
      size="small"
      :close-on-backdrop="false"
      :close-on-esc="false"
      :show-close="false"
    >
      <p class="session-expired-modal__message">
        {{ authStore.sessionExpiredMessage || sessionExpiredModalData.defaultMessage }}
      </p>
      <template #footer>
        <BaseButton
          variant="primary"
          size="large"
          full-width
          @click="handleSessionExpiredConfirm"
        >
          {{ sessionExpiredModalData.confirmButton }}
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
