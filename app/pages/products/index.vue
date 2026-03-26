<script setup>
import productsPageData from '~/data/products.json'
import mockData from '~/data/mock-products.json'

useHead({ title: productsPageData.seo.title })
useSeoMeta({
  title: productsPageData.seo.title,
  description: productsPageData.seo.description
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
        <h1 class="products-page__title">{{ productsPageData.page.title }}</h1>
        <p class="products-page__subtitle">{{ productsPageData.page.subtitle }}</p>
      </div>

      <div class="products-page__toolbar">
        <span class="products-page__count">
          {{ productsPageData.count.prefix }}<strong>{{ sortedProducts.length }}{{ productsPageData.count.suffix }}</strong>{{ productsPageData.count.label }}
        </span>
        <BaseSelect
          v-model="sortValue"
          :options="productsPageData.sort.options"
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
