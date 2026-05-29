<script setup lang="ts">
import { computed, ref } from 'vue';
import { ChevronDown, Plus } from 'lucide-vue-next';

const props = withDefaults(defineProps<{
  modelValue?: string | null;
  label: string;
  suggestions: string[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}>(), {
  placeholder: 'Escribe o selecciona una opción',
  required: false,
  disabled: false,
  error: ''
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const isOpen = ref(false);

const value = computed({
  get: () => props.modelValue ?? '',
  set: (newValue: string) => {
    emit('update:modelValue', newValue);
    isOpen.value = true;
  }
});

const normalizedValue = computed(() => {
  return value.value.trim().toLowerCase();
});

const filteredSuggestions = computed(() => {
  const cleanSuggestions = props.suggestions
    .filter(Boolean)
    .map((item) => item.trim())
    .filter((item, index, array) => {
      return item && array.findIndex((x) => x.toLowerCase() === item.toLowerCase()) === index;
    });

  if (!normalizedValue.value) {
    return cleanSuggestions.slice(0, 8);
  }

  return cleanSuggestions
    .filter((item) => item.toLowerCase().includes(normalizedValue.value))
    .slice(0, 8);
});

const hasExactMatch = computed(() => {
  if (!normalizedValue.value) return true;

  return props.suggestions.some((item) => {
    return item.trim().toLowerCase() === normalizedValue.value;
  });
});

const openSuggestions = () => {
  if (props.disabled) return;
  isOpen.value = true;
};

const closeSuggestions = () => {
  window.setTimeout(() => {
    isOpen.value = false;
  }, 120);
};

const selectSuggestion = (suggestion: string) => {
  emit('update:modelValue', suggestion);
  isOpen.value = false;
};
</script>

<template>
  <div class="relative">
    <label class="block">
      <span class="mb-1.5 block text-xs font-semibold text-gray-700">
        {{ label }}
        <span v-if="required" class="text-red-500">*</span>
      </span>

      <div class="relative">
        <input
          v-model="value"
          type="text"
          :placeholder="placeholder"
          :disabled="disabled"
          autocomplete="off"
          class="w-full rounded-lg border px-3 py-2 pr-9 text-sm outline-none transition
                 placeholder:text-gray-400 disabled:bg-gray-100 disabled:text-gray-500
                 focus:border-main focus:ring-2 focus:ring-main/15"
          :class="error ? 'border-red-300 bg-red-50/40' : 'border-gray-200 bg-white'"
          @focus="openSuggestions"
          @blur="closeSuggestions"
        />

        <button
          type="button"
          class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-main"
          :disabled="disabled"
          @mousedown.prevent="openSuggestions"
        >
          <ChevronDown class="h-4 w-4" />
        </button>
      </div>
    </label>

    <div
      v-if="isOpen && !disabled"
      class="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
    >
      <template v-if="filteredSuggestions.length > 0">
        <button
          v-for="suggestion in filteredSuggestions"
          :key="suggestion"
          type="button"
          class="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-gray-700
                 hover:bg-main/5 hover:text-main"
          @mousedown.prevent="selectSuggestion(suggestion)"
        >
          <span>{{ suggestion }}</span>

          <span
            v-if="suggestion.toLowerCase() === normalizedValue"
            class="text-[11px] font-semibold text-main"
          >
            Actual
          </span>
        </button>
      </template>

      <div
        v-if="value.trim() && !hasExactMatch"
        class="border-t border-gray-100 px-3 py-2"
      >
        <div class="flex items-center gap-2 text-xs text-gray-500">
          <Plus class="h-3.5 w-3.5 text-main" />
          <span>
            Se guardará como nuevo valor:
            <strong class="text-gray-700">{{ value.trim() }}</strong>
          </span>
        </div>
      </div>

      <div
        v-if="filteredSuggestions.length === 0 && !value.trim()"
        class="px-3 py-2 text-sm text-gray-400"
      >
        No hay sugerencias disponibles.
      </div>
    </div>

    <span
      v-if="error"
      class="mt-1 block text-xs font-medium text-red-600"
    >
      {{ error }}
    </span>
  </div>
</template>