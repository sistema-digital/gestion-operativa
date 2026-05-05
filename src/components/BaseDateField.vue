<script setup lang="ts">
import { ref, computed } from 'vue';
import { formatDateDisplay } from '@/utils/dateUtils';
import { Calendar } from 'lucide-vue-next';

interface Props {
  modelValue: string;
  label?: string;
  placeholder?: string;
  id?: string;
  error?: string | boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  placeholder: 'Seleccionar fecha',
  id: () => `date-${Math.random().toString(36).substr(2, 9)}`,
  error: false
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const inputRef = ref<HTMLInputElement | null>(null);

const displayValue = computed(() => {
  return props.modelValue ? formatDateDisplay(props.modelValue) : '';
});

const onDateChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};

const openPicker = () => {
  if (inputRef.value) {
    (inputRef.value as any).showPicker?.();
  }
};
</script>

<template>
  <div class="flex flex-col gap-1.5 w-full relative">
    <label v-if="label" :for="id" class="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">{{ label }}</label>
    <div class="relative w-full" @click="openPicker">
      <input 
        ref="inputRef"
        type="date" 
        :id="id"
        :value="modelValue"
        @input="onDateChange"
        class="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
      />
      <div 
        class="flex items-center justify-between w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-colors pointer-events-none"
        :class="{ 'border-red-500': error }"
      >
        <span :class="displayValue ? 'text-gray-900 font-medium' : 'text-gray-400'">
          {{ displayValue || placeholder }}
        </span>
        <Calendar class="w-4 h-4 text-gray-400" />
      </div>
    </div>
    <span v-if="typeof error === 'string' && error" class="text-xs text-red-500 pl-1">{{ error }}</span>
  </div>
</template>
