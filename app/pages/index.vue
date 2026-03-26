<script setup>
import mainData from '~/data/main.json'
import mockData from '~/data/mock-products.json'

// SEO
useHead({ title: mainData.seo.title })
useSeoMeta({
  title: mainData.seo.title,
  description: mainData.seo.description || '',
  ogTitle: mainData.seo.title,
  ogImage: mainData.seo.ogImage
})

// 목데이터 기반 (portfolio 방식)
const allProducts = mockData.products

// New Arrival: id 1~5 (isNew 상품)
const newArrivalProducts = allProducts.filter(p => p.isNew)

// Best Item: id 6~10 (isBest 상품)
const bestProducts = allProducts.filter(p => p.isBest)

// Special Offer: 할인율 있는 상품 (discountRate > 0)
const specialOfferProducts = allProducts
  .filter(p => p.discountRate > 0)
  .map(p => ({
    ...p,
    originalPrice: p.price,
    price: Math.round(p.price * (1 - p.discountRate / 100))
  }))

// Hero 배너 (목데이터)
const heroSlides = mockData.banners

// Event 배너 (목데이터)
const eventBanner = mockData.eventBanner

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
    <!-- Hero 배너 (목데이터) -->
    <div class="page-main__hero-wrap">
      <SectionHero
        :data="mainData.hero"
        :slides="heroSlides"
      />
    </div>

    <main>
      <!-- New Arrival 섹션 -->
      <SectionBestItems
        class="reveal"
        :data="mainData.newArrival"
        :products="newArrivalProducts"
      />

      <!-- Best Item 섹션 -->
      <SectionBestItems
        class="reveal"
        :data="mainData.bestItems"
        :products="bestProducts"
      />

      <!-- Special Offer 섹션 -->
      <SectionBestItems
        class="reveal"
        :data="mainData.specialOffer"
        :products="specialOfferProducts"
      />

      <!-- Event 배너 (목데이터) -->
      <section class="event-banner reveal">
        <NuxtLink :to="eventBanner.href" class="event-banner__frame">
          <img
            :src="eventBanner.image"
            :alt="eventBanner.imageAlt"
            class="event-banner__image"
          />
        </NuxtLink>
      </section>
    </main>
  </div>
</template>
