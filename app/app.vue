<script setup>
import mainData from '~/data/main.json'
import uiData from '~/data/ui.json'

const route = useRoute()
const { faviconUrl, shopName, seoInfo, headerMenu, fetchShopInfo } = useShopInfo()
const { applyTheme, theme } = useTheme()

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

// 테마 복원 인라인 스크립트 (CSS 렌더링 전에 실행되어 깜빡임 방지)
useHead({
  script: [
    {
      innerHTML: `(function(){try{var t=localStorage.getItem('app-theme');if(t){var c={'green':{50:'#EBF9E6',100:'#D5F0CB',200:'#BAE6AA',300:'#9DDB87',400:'#87D36C',500:'#71CB52',600:'#62BB4A',700:'#4EA63F',800:'#0C6F23',900:'#114A1E'},'brown':{50:'#F7F2EC',100:'#F4EFEA',200:'#E7DFD6',300:'#D6CDC3',400:'#B4A79A',500:'#9A9087',600:'#8A8177',700:'#6F675E',800:'#6B5A47',900:'#5A4633'},'blue':{50:'#E8EAF6',100:'#C5CAE9',200:'#9FA8DA',300:'#7986CB',400:'#5C6BC0',500:'#3F51B5',600:'#3949AB',700:'#303F9F',800:'#283593',900:'#1A237E'},'gray':{50:'#FAFAFA',100:'#F5F5F5',200:'#EEEEEE',300:'#E0E0E0',400:'#BDBDBD',500:'#9E9E9E',600:'#757575',700:'#616161',800:'#424242',900:'#212121'}}[t.toLowerCase()];if(c){var r=document.documentElement;Object.keys(c).forEach(function(k){r.style.setProperty('--theme-primary-'+k,c[k])});r.style.setProperty('--theme-primary',c['800']);r.style.setProperty('--theme-primary-light',c['100']);r.style.setProperty('--theme-primary-dark',c['900'])}}}catch(e){}})()`,
      tagPosition: 'head',
      tagPriority: 'critical'
    }
  ]
})

// 앱 시작 시 쇼핑몰 정보 로드
onMounted(() => {
  fetchShopInfo()
})

// 테마 변경 감지 및 적용
watch(theme, (newTheme) => {
  if (import.meta.client && newTheme) {
    applyTheme(newTheme)
  }
}, { immediate: true })

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

// 메인 페이지는 투명 헤더, 나머지는 dark 헤더
const headerVariant = computed(() => {
  return route.path === '/' ? undefined : 'dark'
})

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
