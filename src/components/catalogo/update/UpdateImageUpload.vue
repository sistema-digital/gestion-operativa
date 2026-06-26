<script setup lang="ts">
import CatalogImageUpload from '@/components/catalogo/create/CatalogImageUpload.vue';

withDefaults(defineProps<{
  modelValue?: File | null;
  previewUrl?: string | null;
  label: string;
  accept?: string;
  capture?: 'user' | 'environment' | '' | null;
  maxSizeMb?: number;
  error?: string;
  required?: boolean;
}>(), {
  accept: 'image/jpeg,image/png,image/webp',
  capture: 'environment',
  maxSizeMb: 5,
  error: '',
  required: false
});

defineEmits<{
  (e: 'update:modelValue', value: File | null): void;
  (e: 'error', value: string): void;
}>();
</script>

<template>
  <CatalogImageUpload
    v-bind="$props"
    @update:model-value="$emit('update:modelValue', $event)"
    @error="$emit('error', $event)"
  />
</template>
