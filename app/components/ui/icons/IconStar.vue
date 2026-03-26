<script setup>
import iconsData from '~/data/icons.json'

const props = defineProps({
  size: {
    type: String,
    default: 'lg',
    validator: (v) => ['sm', 'md', 'lg', 'xl', '2xl', '4xl'].includes(v)
  },
  active: {
    type: Boolean,
    default: null
  },
  color: {
    type: String,
    default: null,
    validator: (v) => v === null || ['filled', 'default'].includes(v)
  },
  decorative: {
    type: Boolean,
    default: false
  }
})

// color prop이 있으면 color 기반, 없으면 active 기반
const isActive = computed(() => {
  if (props.color !== null) {
    return props.color === 'filled'
  }
  return props.active !== false
})

const label = computed(() =>
  isActive.value ? iconsData.star.label.active : iconsData.star.label.disabled
)

const fillColor = computed(() => isActive.value ? 'var(--icon-color-primary, #6B5A47)' : 'var(--icon-color-disabled, #e5e5ec)')
</script>

<template>
  <BaseIcon :size="size" :label="label" :decorative="decorative">
    <svg viewBox="4 4 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11.9998 17.2483L8.05647 19.6238C7.88227 19.7347 7.70015 19.7822 7.51011 19.7663C7.32007 19.7505 7.15378 19.6871 7.01125 19.5763C6.86872 19.4654 6.75786 19.327 6.67868 19.1611C6.59949 18.9951 6.58366 18.8088 6.63117 18.6023L7.67639 14.1126L4.18439 11.0957C4.02602 10.9532 3.9272 10.7907 3.88792 10.6083C3.84865 10.4258 3.86037 10.2478 3.92308 10.0742C3.98579 9.90066 4.08081 9.75813 4.20814 9.64664C4.33547 9.53515 4.50967 9.46389 4.73075 9.43285L9.33925 9.02901L11.1209 4.80059C11.2001 4.61055 11.323 4.46802 11.4896 4.373C11.6562 4.27798 11.8263 4.23047 11.9998 4.23047C12.1734 4.23047 12.3435 4.27798 12.5101 4.373C12.6767 4.46802 12.7996 4.61055 12.8788 4.80059L14.6604 9.02901L19.2689 9.43285C19.4906 9.46452 19.6648 9.53578 19.7915 9.64664C19.9182 9.7575 20.0132 9.90003 20.0766 10.0742C20.1399 10.2484 20.152 10.4268 20.1127 10.6092C20.0734 10.7916 19.9743 10.9538 19.8153 11.0957L16.3233 14.1126L17.3685 18.6023C17.416 18.8082 17.4002 18.9944 17.321 19.1611C17.2418 19.3277 17.1309 19.4661 16.9884 19.5763C16.8459 19.6865 16.6796 19.7499 16.4896 19.7663C16.2995 19.7828 16.1174 19.7353 15.9432 19.6238L11.9998 17.2483Z"
        :fill="fillColor"
      />
    </svg>
  </BaseIcon>
</template>
