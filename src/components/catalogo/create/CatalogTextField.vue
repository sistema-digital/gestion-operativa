<script setup lang="ts">
import { computed } from 'vue';

type FieldValue = string | number | null | undefined;

const props = withDefaults(defineProps<{
  modelValue?: FieldValue;
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  textarea?: boolean;
  rows?: number;
  min?: string | number;
  step?: string | number;
}>(), {
  placeholder: '',
  type: 'text',
  required: false,
  disabled: false,
  error: '',
  textarea: false,
  rows: 3
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: FieldValue): void;
}>();

const value = computed({
  get: () => props.modelValue ?? '',
  set: (newValue) => emit('update:modelValue', newValue)
});
</script>

<template>
  <label class="block">
    <span class="mb-1.5 block text-xs font-semibold text-gray-700">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </span>

    <textarea
      v-if="textarea"
      v-model="value"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none transition
             placeholder:text-gray-400 disabled:bg-gray-100 disabled:text-gray-500
             focus:border-main focus:ring-2 focus:ring-main/15"
      :class="error ? 'border-red-300 bg-red-50/40' : 'border-gray-200 bg-white'"
    />

    <input
      v-else
      v-model="value"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :min="min"
      :step="step"
      class="w-full rounded-lg border px-3 py-2 text-sm outline-none transition
             placeholder:text-gray-400 disabled:bg-gray-100 disabled:text-gray-500
             focus:border-main focus:ring-2 focus:ring-main/15"
      :class="error ? 'border-red-300 bg-red-50/40' : 'border-gray-200 bg-white'"
    />

    <span
      v-if="error"
      class="mt-1 block text-xs font-medium text-red-600"
    >
      {{ error }}
    </span>
  </label>
</template>