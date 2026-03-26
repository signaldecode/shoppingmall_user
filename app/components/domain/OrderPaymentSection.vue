<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  labels: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const showBankOptions = computed(() => props.modelValue.method === 'bank')

const updateField = (field, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  })
}
</script>

<template>
  <section class="order-section">
    <header class="order-section__header">
      <h2 class="order-section__title">{{ labels.title }}</h2>
    </header>
    <div class="order-payment">
      <BaseRadioGroup
        :model-value="modelValue.method"
        :options="labels.methods"
        name="payment-method"
        variant="default"
        :aria-label="labels.title"
        @update:model-value="updateField('method', $event)"
      />

      <div v-if="showBankOptions" class="order-payment__bank-options">
        <BaseInput
          :model-value="modelValue.depositor"
          :label="labels.bank.depositor.label"
          :placeholder="labels.bank.depositor.placeholder"
          required
          @update:model-value="updateField('depositor', $event)"
        />
      </div>
    </div>
  </section>
</template>
