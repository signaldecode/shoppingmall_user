<script setup>
defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg', 'xl'].includes(v)
  }
})

const sizeMap = {
  sm: 32,
  md: 40,
  lg: 51,
  xl: 64
}
</script>

<template>
  <svg
    :width="sizeMap[size]"
    :height="sizeMap[size]"
    viewBox="0 0 51 51"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="icon-review"
    aria-hidden="true"
  >
    <path d="M32.71 0C36.0237 0 38.71 2.68629 38.71 6V26.0479C38.7099 29.3615 36.0236 32.0479 32.71 32.0479H16.4307L7.92969 38.5762C7.39044 38.9899 6.61133 38.6056 6.61133 37.9258V32.0479H6C2.68632 32.0479 3.9298e-05 29.3615 0 26.0479V6C0 2.68629 2.68629 5.28947e-08 6 0H32.71Z" fill="currentColor"/>
    <circle cx="10" cy="16" r="3" fill="white"/>
    <circle cx="20" cy="16" r="3" fill="white"/>
    <circle cx="30" cy="16" r="3" fill="white"/>
    <path d="M45 18.8516C48.3135 18.8517 50.9998 21.5381 51 24.8516V39.4414C51 42.5806 48.5888 45.1553 45.5176 45.418V50.3184C45.5176 50.8825 44.8703 51.202 44.4229 50.8584L37.6689 45.6709C37.5798 45.6024 37.508 45.5244 37.4502 45.4414H24.8818C21.5681 45.4414 18.8818 42.7551 18.8818 39.4414V34.876H35.5439C38.8574 34.8759 41.5437 32.1894 41.5439 28.876V18.8516H45Z" fill="#DADADA"/>
  </svg>
</template>
