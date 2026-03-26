<script setup>
const props = defineProps({
  product: {
    type: Object,
    required: true
  },
  showBadge: {
    type: Boolean,
    default: true
  },
  showRating: {
    type: Boolean,
    default: true
  }
})

const formattedPrice = computed(() => {
  return props.product.price?.toLocaleString()
})

const formattedOriginalPrice = computed(() => {
  return props.product.originalPrice?.toLocaleString()
})

const hasDiscount = computed(() => {
  return (props.product.discountRate && props.product.discountRate > 0) ||
    (props.product.originalPrice && props.product.originalPrice > props.product.price)
})

const discountRate = computed(() => {
  if (props.product.discountRate) return props.product.discountRate
  if (!props.product.originalPrice || !props.product.price) return 0
  return Math.round((1 - props.product.price / props.product.originalPrice) * 100)
})

// 별점 반올림
const starCount = computed(() => Math.round(props.product.rating || 0))
</script>

<template>
  <article class="product-card">
    <NuxtLink :to="product.href" class="product-card__link">
      <!-- 이미지 -->
      <div class="product-card__image-wrap">
        <img
          :src="product.image"
          :alt="product.imageAlt"
          class="product-card__image"
          loading="lazy"
        />
      </div>

      <!-- 컬러 도트 -->
      <div v-if="product.colors?.length" class="product-card__colors">
        <span
          v-for="color in product.colors"
          :key="color.value"
          class="product-card__color-dot"
          :style="{ backgroundColor: color.value }"
        />
      </div>

      <!-- 상품명 -->
      <h3 class="product-card__name">{{ product.name }}</h3>

      <!-- 가격 -->
      <div class="product-card__price-row">
        <span v-if="hasDiscount" class="product-card__discount">-{{ discountRate }}%</span>
        <span v-if="hasDiscount" class="product-card__original-price">
          {{ formattedOriginalPrice || formattedPrice }}{{ product.currency }}
        </span>
        <span class="product-card__price">
          {{ formattedPrice }}{{ product.currency }}
        </span>
      </div>

      <!-- 별점 -->
      <div v-if="showRating && product.rating" class="product-card__rating">
        <div class="product-card__stars">
          <span
            v-for="n in 5"
            :key="n"
            :class="['product-card__star', { 'product-card__star--filled': n <= starCount }]"
          >★</span>
        </div>
        <span class="product-card__rating-text">
          {{ product.rating.toFixed(1) }} ({{ product.reviewCount }})
        </span>
      </div>
    </NuxtLink>
  </article>
</template>
