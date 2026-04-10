<script setup>
import mainData from '~/data/main.json'

const {
  response,
  pending,
  heroBanners,
  bestProducts,
  recommendProducts,
  categories
} = useMain()

// SEO
useHead({ title: mainData.seo.title })
useSeoMeta({
  title: mainData.seo.title,
  description: mainData.seo.description || '',
  ogTitle: mainData.seo.title,
  ogImage: mainData.seo.ogImage
})

// /main 응답의 배너 (heroBanners는 /main/banners 별도 호출인데 비어있을 수 있음)
// /main 응답에 포함된 banners를 우선 사용
const heroSlides = computed(() => {
  if (heroBanners.value.length > 0) return heroBanners.value
  const mainBanners = response.value?.data?.banners?.HERO || []
  return mainBanners.map(b => ({
    id: b.id,
    title: b.title || '',
    subtitle: b.subtitle || '',
    description: b.description || '',
    image: b.imageUrl,
    imageAlt: b.title || '',
    href: b.linkUrl
  }))
})

// Scroll reveal animation
let observer

onMounted(() => {
  nextTick(() => {
    const targets = document.querySelectorAll('.reveal')
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('is-visible', entry.isIntersecting)
        })
      },
      { threshold: 0.2 }
    )
    targets.forEach((target) => observer.observe(target))
  })
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <div class="page-main">
    <!-- Hero 배너 -->
    <div class="page-main__hero-wrap">
      <SectionHero
        :data="mainData.hero"
        :slides="heroSlides"
      />
    </div>

    <main>
      <!-- 1섹션 -->
      <SectionBestItems
        v-if="recommendProducts.length > 0"
        class="reveal"
        :data="mainData.section1"
        :products="recommendProducts"
        :loading="pending"
      />

      <!-- 2섹션 -->
      <SectionBestItems
        v-if="bestProducts.length > 0"
        class="reveal"
        :data="mainData.section2"
        :products="bestProducts"
        :loading="pending"
      />

      <!-- 3섹션 -->
      <SectionBestItems
        v-if="recommendProducts.length > 0"
        class="reveal"
        :data="mainData.section3"
        :products="recommendProducts"
        :loading="pending"
      />

      <!-- 4섹션 -->
      <SectionBestItems
        v-if="bestProducts.length > 0"
        class="reveal"
        :data="mainData.section4"
        :products="bestProducts"
        :loading="pending"
      />
    </main>
  </div>
</template>
