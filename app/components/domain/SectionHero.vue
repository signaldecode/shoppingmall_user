<script setup>
import mainData from '~/data/main.json'

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  slides: {
    type: Array,
    default: () => []
  },
  autoPlay: {
    type: Boolean,
    default: true
  },
  interval: {
    type: Number,
    default: 5000
  }
})

const arrowLabels = mainData.hero.arrowLabels

const sliderRef = ref(null)
const currentIndex = ref(0)
const isAnimating = ref(false)
const totalSlides = computed(() => props.slides.length || 1)

// Clone first and last slides for infinite effect
const extendedSlides = computed(() => {
  if (props.slides.length <= 1) return props.slides
  return [
    props.slides[props.slides.length - 1], // Clone of last
    ...props.slides,
    props.slides[0] // Clone of first
  ]
})

// Real slide index for display (1-based for indicator)
const displayIndex = computed(() => {
  if (currentIndex.value < 0) return totalSlides.value
  if (currentIndex.value >= totalSlides.value) return 1
  return currentIndex.value + 1
})

const activeSlide = computed(() => {
  return props.slides[displayIndex.value - 1] || props.data
})

let autoPlayTimer = null

const goToSlide = (index, animate = true) => {
  if (isAnimating.value) return

  if (animate) {
    isAnimating.value = true
  }
  currentIndex.value = index
}

const nextSlide = () => {
  goToSlide(currentIndex.value + 1)
}

const prevSlide = () => {
  goToSlide(currentIndex.value - 1)
}

const sliderStyle = computed(() => {
  // 슬라이드가 1개 이하면 translateX 없음
  if (props.slides.length <= 1) {
    return {}
  }
  return {
    transform: `translateX(-${(currentIndex.value + 1) * 100}%)`,
    transition: isAnimating.value ? 'transform 0.5s ease-out' : 'none'
  }
})

const handleTransitionEnd = () => {
  isAnimating.value = false

  // Jump to real position without animation
  if (currentIndex.value >= totalSlides.value) {
    currentIndex.value = 0
  } else if (currentIndex.value < 0) {
    currentIndex.value = totalSlides.value - 1
  }
}

const startAutoPlay = () => {
  stopAutoPlay()
  if (props.autoPlay && totalSlides.value > 1) {
    autoPlayTimer = setInterval(nextSlide, props.interval)
  }
}

const stopAutoPlay = () => {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer)
    autoPlayTimer = null
  }
}

// 모바일 터치 스와이프
const { swipeEvents: heroSwipeEvents } = useSwipe({
  onSwipeLeft: () => { nextSlide(); startAutoPlay() },
  onSwipeRight: () => { prevSlide(); startAutoPlay() }
})

onMounted(() => {
  startAutoPlay()
})

onUnmounted(() => {
  stopAutoPlay()
})
</script>

<template>
  <section class="section-hero">
    <div
      ref="sliderRef"
      class="section-hero__slider"
      :style="sliderStyle"
      @transitionend="handleTransitionEnd"
      @touchstart="(e) => { stopAutoPlay(); heroSwipeEvents.touchstart(e) }"
      @touchmove="heroSwipeEvents.touchmove"
      @touchend="heroSwipeEvents.touchend"
    >
      <div
        v-for="(slide, index) in extendedSlides"
        :key="'slide-' + index"
        class="section-hero__slide"
      >
        <component
          :is="(slide.linkUrl || slide.href) ? 'a' : 'div'"
          :href="slide.linkUrl || slide.href || undefined"
          :target="(slide.linkUrl || slide.href) ? (slide.linkTarget || '_self') : undefined"
          :rel="slide.linkTarget === '_blank' ? 'noopener noreferrer' : undefined"
          class="section-hero__slide-link"
        >
          <NuxtImg
            :src="slide.imageUrl || slide.image"
            :alt="slide.title || slide.imageAlt"
            class="section-hero__image"
            format="webp"
            width="1920"
            quality="75"
            :loading="index <= 1 ? 'eager' : 'lazy'"
            :fetchpriority="index <= 1 ? 'high' : 'auto'"
          />
        </component>
      </div>
    </div>
    <!-- Portfolio 스타일 오버레이: 왼쪽 정렬 + 그라디언트 -->
    <div class="section-hero__overlay">
      <p v-if="activeSlide.subtitle" class="section-hero__subtitle">{{ activeSlide.subtitle }}</p>
      <h1 v-if="activeSlide.title" class="section-hero__title">{{ activeSlide.title }}</h1>
      <p v-if="activeSlide.description" class="section-hero__description">{{ activeSlide.description }}</p>
      <NuxtLink
        v-if="activeSlide.href || activeSlide.linkUrl"
        :to="activeSlide.href || activeSlide.linkUrl"
        class="section-hero__cta"
      >
        SHOP NOW
      </NuxtLink>
    </div>

    <!-- 화살표 -->
    <div v-if="totalSlides > 1" class="section-hero__arrows">
      <button
        type="button"
        class="section-hero__arrow section-hero__arrow--left"
        :aria-label="arrowLabels.prev"
        @click="prevSlide"
      >
        ‹
      </button>
      <button
        type="button"
        class="section-hero__arrow section-hero__arrow--right"
        :aria-label="arrowLabels.next"
        @click="nextSlide"
      >
        ›
      </button>
    </div>

    <!-- 도트 인디케이터 (portfolio 스타일) -->
    <div v-if="totalSlides > 1" class="section-hero__dots">
      <span
        v-for="i in totalSlides"
        :key="i"
        class="section-hero__dot"
        :class="{ 'section-hero__dot--active': displayIndex === i }"
        @click="goToSlide(i - 1)"
      />
    </div>
  </section>
</template>
