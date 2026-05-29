<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  modelValue?: string | null;
  label: string;
  options: string[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}>(), {
  placeholder: 'Seleccionar opción',
  required: false,
  disabled: false,
  error: ''
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void;
}>();

const value = computed({
  get: () => props.modelValue ?? '',
  set: (newValue: string) => emit('update:modelValue', newValue || null)
});
</script>

<template>
  <label class="block">
    <span class="mb-1.5 block text-xs font-semibold text-gray-700">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </span>

    <select
      v-model="value"
      :disabled="disabled"
      class="w-full rounded-lg border px-3 py-2 text-sm outline-none transition
             disabled:bg-gray-100 disabled:text-gray-500
             focus:border-main focus:ring-2 focus:ring-main/15"
      :class="error ? 'border-red-300 bg-red-50/40' : 'border-gray-200 bg-white'"
    >
      <option value="" disabled>
        {{ placeholder }}
      </option>

      <option
        v-for="option in options"
        :key="option"
        :value="option"
      >
        {{ option }}
      </option>
    </select>

    <span v-if="error" class="mt-1 block text-xs font-medium text-red-600">
      {{ error }}
    </span>
  </label>
</template>