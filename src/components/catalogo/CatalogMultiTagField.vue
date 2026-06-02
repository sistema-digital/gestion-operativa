<script setup lang="ts">
import { computed, ref } from 'vue';
import { ChevronDown, X } from 'lucide-vue-next';

import { normalizeTagValues } from '@/stores/dbequipos/repuestos/repuestos.helpers';

const props = withDefaults(defineProps<{
  modelValue?: string[] | null;
  label: string;
  suggestions?: string[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}>(), {
  suggestions: () => [],
  placeholder: 'Escribe y separa con coma',
  required: false,
  disabled: false,
  error: ''
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void;
}>();

const isOpen = ref(false);
const draftValue = ref('');

const selectedValues = computed(() => {
  return normalizeTagValues(props.modelValue ?? []);
});

const normalizedDraft = computed(() => {
  return draftValue.value.trim().toLowerCase();
});

const cleanSuggestions = computed(() => {
  return normalizeTagValues(props.suggestions ?? []);
});

const filteredSuggestions = computed(() => {
  const availableSuggestions = cleanSuggestions.value.filter((suggestion) => {
    return !selectedValues.value.some((selected) => {
      return selected.toLowerCase() === suggestion.toLowerCase();
    });
  });

  if (!normalizedDraft.value) {
    return availableSuggestions.slice(0, 8);
  }

  return availableSuggestions.filter((suggestion) => {
    return suggestion.toLowerCase().includes(normalizedDraft.value);
  }).slice(0, 8);
});

const updateValues = (values: string[]) => {
  emit('update:modelValue', normalizeTagValues(values));
};

const addTags = (rawValue: string) => {
  const newTags = normalizeTagValues(rawValue.split(','));

  if (newTags.length === 0) return;

  updateValues([...selectedValues.value, ...newTags]);
};

const commitDraft = () => {
  if (!draftValue.value.trim()) return;

  addTags(draftValue.value);
  draftValue.value = '';
  isOpen.value = false;
};

const handleInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  draftValue.value = input.value;

  if (draftValue.value.includes(',')) {
    commitDraft();
    return;
  }

  isOpen.value = true;
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === ',' || event.key === 'Enter' || event.key === 'Tab') {
    if (!draftValue.value.trim()) return;

    event.preventDefault();
    commitDraft();
    return;
  }

  if (event.key === 'Backspace' && !draftValue.value && selectedValues.value.length > 0) {
    updateValues(selectedValues.value.slice(0, -1));
  }
};

const openSuggestions = () => {
  if (props.disabled) return;
  isOpen.value = true;
};

const closeSuggestions = () => {
  window.setTimeout(() => {
    commitDraft();
    isOpen.value = false;
  }, 120);
};

const selectSuggestion = (suggestion: string) => {
  updateValues([...selectedValues.value, suggestion]);
  draftValue.value = '';
  isOpen.value = false;
};

const removeTag = (tag: string) => {
  updateValues(selectedValues.value.filter((item) => item !== tag));
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
          :value="draftValue"
          type="text"
          :placeholder="placeholder"
          :disabled="disabled"
          autocomplete="off"
          class="w-full rounded-lg border px-3 py-2 pr-9 text-sm outline-none transition
                 placeholder:text-gray-400 disabled:bg-gray-100 disabled:text-gray-500
                 focus:border-main focus:ring-2 focus:ring-main/15"
          :class="error ? 'border-red-300 bg-red-50/40' : 'border-gray-200 bg-white'"
          @input="handleInput"
          @keydown="handleKeydown"
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
      v-if="selectedValues.length > 0"
      class="mt-2 flex flex-wrap gap-2"
    >
      <span
        v-for="tag in selectedValues"
        :key="tag"
        class="inline-flex items-center gap-1 rounded-full bg-main/10 px-3 py-1 text-xs font-medium text-main"
      >
        {{ tag }}
        <button
          type="button"
          class="rounded-full text-main/70 transition hover:text-main"
          :disabled="disabled"
          @click="removeTag(tag)"
        >
          <X class="h-3.5 w-3.5" />
        </button>
      </span>
    </div>

    <div
      v-if="isOpen && !disabled"
      class="absolute left-0 right-0 top-full z-[90] mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
    >
      <template v-if="filteredSuggestions.length > 0">
        <button
          v-for="suggestion in filteredSuggestions"
          :key="suggestion"
          type="button"
          class="flex w-full items-center px-3 py-2 text-left text-sm text-gray-700 hover:bg-main/5 hover:text-main"
          @mousedown.prevent="selectSuggestion(suggestion)"
        >
          {{ suggestion }}
        </button>
      </template>

      <div
        v-else
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
