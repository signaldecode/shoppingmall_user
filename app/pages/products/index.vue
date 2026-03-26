<script setup>
import mockData from '~/data/mock-products.json'

useHead({ title: 'All Items' })
useSeoMeta({
  title: 'All Items',
  description: '모든 상품을 한눈에 확인하세요.'
})

// 목데이터 기반 (portfolio 방식)
const allProducts = mockData.products

const sortValue = ref('latest')

const sortedProducts = computed(() => {
  const list = [...allProducts]
  switch (sortValue.value) {
    case 'price_asc':
      return list.sort((a, b) => a.price - b.price)
    case 'price_desc':
      return list.sort((a, b) => b.price - a.price)
    case 'popular':
      return list.sort((a, b) => b.reviewCount - a.reviewCount)
    default:
      return list
  }
})
</script>

<template>
  <div class="page-products">
    <main class="products-page">
      <div class="products-page__header">
        <h1 class="products-page__title">All Items</h1>
        <p class="products-page__subtitle">모든 상품을 한눈에 확인하세요.</p>
      </div>

      <div class="products-page__toolbar">
        <span class="products-page__count">
          총 <strong>{{ sortedProducts.length }}개</strong> 상품
        </span>
        <BaseSelect
          v-model="sortValue"
          :options="[
            { label: '최신순', value: 'latest' },
            { label: '인기순', value: 'popular' },
            { label: '낮은 가격순', value: 'price_asc' },
            { label: '높은 가격순', value: 'price_desc' }
          ]"
          size="small"
        />
      </div>

      <div class="products-page__grid">
        <ProductCard
          v-for="product in sortedProducts"
          :key="product.id"
          :product="product"
        />
      </div>
    </main>
  </div>
</template>
