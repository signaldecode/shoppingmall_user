<script setup>
import uiData from '~/data/ui.json'

const props = defineProps({
  product: {
    type: Object,
    required: true
  },
  labels: {
    type: Object,
    required: true
  },
  wishlisted: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['addToCart', 'buyNow', 'toggleWishlist'])

const { shippingPolicy, baseShippingFee, freeShippingAmount } = useShopInfo()
const { warning, info } = useToast()

const shippingText = computed(() => {
  const fee = baseShippingFee.value
  const free = freeShippingAmount.value
  if (!fee) return props.labels?.shippingValue || ''
  const feeStr = fee.toLocaleString()
  const freeStr = free ? ` (${free.toLocaleString()}원 이상 무료배송)` : ''
  return `${feeStr}원${freeStr}`
})

const deliveryText = computed(() => {
  return shippingPolicy.value?.estimatedDays || ''
})
const route = useRoute()

const currentImageIndex = ref(0)
const selectedOptions = ref({}) // 옵션 그룹별 선택값 { groupId: optionValue }
const quantity = ref(1)
const isWishlisted = ref(props.wishlisted)

// props.wishlisted 변경 시 동기화
watch(() => props.wishlisted, (val) => {
  isWishlisted.value = val
})

const images = computed(() => props.product.images || [props.product.image])

const currentImage = computed(() => images.value[currentImageIndex.value])

const formattedPrice = computed(() => props.product.price?.toLocaleString())
const formattedOriginalPrice = computed(() => props.product.originalPrice?.toLocaleString())

// 선택된 옵션 조합에 해당하는 variant 찾기
const selectedVariant = computed(() => {
  const options = props.product.options || []
  const variants = props.product.variants || []

  // 모든 필수 옵션이 선택되었는지 확인
  const requiredOptions = options.filter(opt => opt.isRequired)
  const allRequiredSelected = requiredOptions.every(opt => selectedOptions.value[opt.id])

  if (!allRequiredSelected || variants.length === 0) return null

  // 선택된 옵션 value id 배열
  const selectedValueIds = Object.values(selectedOptions.value)
    .map(opt => opt?.id)
    .filter(Boolean)

  // 일치하는 variant 찾기
  return variants.find(v => {
    const variantOptionIds = v.optionValueIds || []
    return selectedValueIds.length === variantOptionIds.length &&
      selectedValueIds.every(id => variantOptionIds.includes(id))
  })
})

// 선택된 옵션 요약 텍스트
const selectedOptionText = computed(() => {
  const options = props.product.options || []
  const texts = options
    .map(opt => selectedOptions.value[opt.id]?.label)
    .filter(Boolean)
  return texts.join(' / ')
})

// 선택 완료 여부
const isOptionSelected = computed(() => {
  const options = props.product.options || []
  if (options.length === 0) return true
  const requiredOptions = options.filter(opt => opt.isRequired)
  return requiredOptions.every(opt => selectedOptions.value[opt.id])
})

// 선택된 옵션의 단가 (variant 가격 사용)
const selectedOptionPrice = computed(() => {
  return selectedVariant.value?.price || props.product.price
})

const totalPrice = computed(() => {
  return (selectedOptionPrice.value * quantity.value).toLocaleString()
})

const hasDiscount = computed(() => {
  return props.product.originalPrice && props.product.originalPrice > props.product.price
})

// 무한 루프 슬라이드
const prevImage = () => {
  if (currentImageIndex.value === 0) {
    currentImageIndex.value = images.value.length - 1
  } else {
    currentImageIndex.value--
  }
}

const nextImage = () => {
  if (currentImageIndex.value === images.value.length - 1) {
    currentImageIndex.value = 0
  } else {
    currentImageIndex.value++
  }
}

const goToImage = (index) => {
  currentImageIndex.value = index
}

// 터치 스와이프
const { swipeEvents: gallerySwipeEvents } = useSwipe({
  onSwipeLeft: () => nextImage(),
  onSwipeRight: () => prevImage()
})

const toggleWishlist = () => {
  isWishlisted.value = !isWishlisted.value
  emit('toggleWishlist', isWishlisted.value)
}

const copyUrl = async () => {
  try {
    const url = window.location.href
    await navigator.clipboard.writeText(url)
    info(uiData.toast.copied)
  } catch (err) {
    warning(uiData.toast.error)
  }
}

const addToCart = () => {
  // 옵션 선택 확인
  if (!isOptionSelected.value) {
    warning(uiData.toast.selectOptionFirst)
    return
  }

  emit('addToCart', {
    product: props.product,
    selectedOptions: selectedOptions.value,
    variant: selectedVariant.value,
    quantity: quantity.value
  })
}

const buyNow = () => {
  // 옵션 선택 확인
  if (!isOptionSelected.value) {
    warning(uiData.toast.selectOptionFirst)
    return
  }

  emit('buyNow', {
    product: props.product,
    selectedOptions: selectedOptions.value,
    variant: selectedVariant.value,
    quantity: quantity.value
  })
}

// 선택 옵션 초기화
const resetSelection = () => {
  selectedOptions.value = {}
  quantity.value = 1
}

defineExpose({
  resetSelection
})
</script>

<template>
  <section class="product-detail-hero">
    <!-- Gallery -->
    <div class="product-detail-hero__gallery">
      <div
        class="product-detail-hero__main-image"
        v-on="gallerySwipeEvents"
      >
        <img
          :src="currentImage"
          :alt="product.imageAlt"
          class="product-detail-hero__image"
        />
        <IconSlideButton
          direction="prev"
          variant="minimal"
          class="product-detail-hero__nav product-detail-hero__nav--prev"
          :aria-label="labels.prevLabel"
          @click="prevImage"
        />
        <IconSlideButton
          direction="next"
          variant="minimal"
          class="product-detail-hero__nav product-detail-hero__nav--next"
          :aria-label="labels.nextLabel"
          @click="nextImage"
        />
      </div>
      <!-- Dots Indicator -->
      <div class="product-detail-hero__dots">
        <button
          v-for="(_, index) in images"
          :key="index"
          class="product-detail-hero__dot"
          :class="{ 'product-detail-hero__dot--active': currentImageIndex === index }"
          :aria-label="`이미지 ${index + 1}`"
          @click="goToImage(index)"
        />
      </div>
    </div>

    <!-- Info -->
    <div class="product-detail-hero__info">
      <div class="product-detail-hero__header">
        <div class="product-detail-hero__title-wrap">
          <h1 class="product-detail-hero__name">{{ product.name || '' }}</h1>
          <p class="product-detail-hero__subtitle">{{ product.summary || ''}}</p>
        </div>
        <button
          class="product-detail-hero__share"
          :aria-label="labels.shareLabel"
          @click="copyUrl"
        >
          <IconShare />
        </button>
      </div>

      <div class="product-detail-hero__price-wrap">
        <BaseBadge
          v-if="hasDiscount"
          :label="`${product.discount}%`"
          variant="discount"
          size="md"
        />
        <span class="product-detail-hero__price">{{ formattedPrice }}{{ product.currency }}</span>
        <span v-if="hasDiscount" class="product-detail-hero__original-price">{{ formattedOriginalPrice }}{{ product.currency }}</span>
      </div>

      <!-- 프로모션 정보 -->
      <div v-if="product.promotion" class="product-detail-hero__promotion">
        <span class="product-detail-hero__promotion-name">{{ product.promotion.name }}</span>
        <span v-if="product.promotion.endDate" class="product-detail-hero__promotion-date">
          {{ product.promotion.endDate }} {{ labels.promotionEndSuffix || '까지' }}
        </span>
      </div>

      <BaseRating
        v-if="product.reviewCount > 0"
        :rating="product.rating"
        :review-count="product.reviewCount"
        variant="simple"
        size="md"
        show-divider
        class="product-detail-hero__rating"
      />

      <!-- Options Table -->
      <div class="product-detail-hero__options-table">
        <div class="product-detail-hero__option-row">
          <span class="product-detail-hero__option-label">{{ labels.shippingLabel }}</span>
          <span class="product-detail-hero__option-value">{{ shippingText }}</span>
        </div>
        <div v-if="deliveryText" class="product-detail-hero__option-row">
          <span class="product-detail-hero__option-label">{{ labels.deliveryLabel }}</span>
          <span class="product-detail-hero__option-value">{{ deliveryText }}</span>
        </div>
      </div>

      <!-- Option Select (옵션 그룹별) -->
      <div v-if="product.options?.length" class="product-detail-hero__options-wrap">
        <div
          v-for="optionGroup in product.options"
          :key="optionGroup.id"
          class="product-detail-hero__option-group"
        >
          <span class="product-detail-hero__option-group-label">
            {{ optionGroup.name }}
            <span v-if="optionGroup.isRequired" class="product-detail-hero__option-required">*</span>
          </span>
          <BaseSelect
            :model-value="selectedOptions[optionGroup.id]"
            @update:model-value="val => selectedOptions[optionGroup.id] = val"
            :options="optionGroup.values.map(opt => ({
              label: `${opt.label}`,
              value: opt
            }))"
            :placeholder="`${optionGroup.name} ${labels.optionSelectSuffix || '선택'}`"
            variant="box"
          />
        </div>
      </div>

      <!-- Selected Option Box -->
      <div v-if="isOptionSelected" class="product-detail-hero__selected-box">
        <div class="product-detail-hero__selected-info">
          <span class="product-detail-hero__selected-name">{{ selectedOptionText || product.name }}</span>
          <span class="product-detail-hero__selected-price">
            {{ selectedOptionPrice?.toLocaleString() }}{{ product.currency }}
          </span>
        </div>
        <div class="product-detail-hero__selected-actions">
          <BaseQuantitySelector
            v-model="quantity"
            :min="1"
            :max="99"
          />
        </div>
      </div>

      <!-- Total -->
      <div class="product-detail-hero__total">
        <span class="product-detail-hero__total-label">{{ labels.totalLabel }}</span>
        <span class="product-detail-hero__total-price">{{ totalPrice }}{{ product.currency }}</span>
      </div>

      <!-- Actions -->
      <div class="product-detail-hero__actions">
        <BaseButton
          variant="outline"
          class="product-detail-hero__wishlist"
          :aria-label="labels.wishlistLabel"
          @click="toggleWishlist"
        >
          <IconHeart :filled="isWishlisted" />
        </BaseButton>
        <BaseButton
          variant="outline"
          class="product-detail-hero__cart"
          @click="addToCart"
        >
          {{ labels.cartLabel }}
        </BaseButton>
        <BaseButton
          variant="primary"
          class="product-detail-hero__buy"
          @click="buyNow"
        >
          {{ labels.buyLabel }}
        </BaseButton>
      </div>
    </div>
  </section>
</template>
