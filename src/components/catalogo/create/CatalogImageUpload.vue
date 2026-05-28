<script setup lang="ts">
import { computed, ref } from 'vue';
import { Image as ImageIcon, Upload, X } from 'lucide-vue-next';

const props = withDefaults(defineProps<{
  modelValue?: string | null;
  label: string;
  accept?: string;
  maxSizeMb?: number;
  error?: string;
}>(), {
  accept: 'image/jpeg,image/png',
  maxSizeMb: 2,
  error: ''
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void;
  (e: 'error', value: string): void;
}>();

const inputRef = ref<HTMLInputElement | null>(null);

const preview = computed(() => props.modelValue || '');

const inputId = computed(() =>
  `upload-${props.label.toLowerCase().replace(/\s+/g, '-')}`
);

const openPicker = () => {
  inputRef.value?.click();
};

const clearImage = () => {
  emit('update:modelValue', null);

  if (inputRef.value) {
    inputRef.value.value = '';
  }
};

const handleChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  const maxBytes = props.maxSizeMb * 1024 * 1024;

  if (file.size > maxBytes) {
    emit('error', `La imagen no debe superar ${props.maxSizeMb} MB.`);
    input.value = '';
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    emit('update:modelValue', String(reader.result));
  };

  reader.readAsDataURL(file);
};
</script>

<template>
  <div>
    <span class="mb-1.5 block text-xs font-semibold text-gray-700">
      {{ label }}
    </span>

    <div
      class="relative flex min-h-[96px] cursor-pointer items-center justify-center overflow-hidden
             rounded-xl border border-dashed bg-white transition hover:bg-gray-50"
      :class="error ? 'border-red-300' : 'border-gray-300'"
      @click="openPicker"
    >
      <input
        :id="inputId"
        ref="inputRef"
        type="file"
        :accept="accept"
        class="hidden"
        @change="handleChange"
      />

      <template v-if="preview">
        <img
          :src="preview"
          alt="Imagen del repuesto"
          class="h-full max-h-[140px] w-full object-cover"
        />

        <button
          type="button"
          class="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-gray-600
                 shadow-sm hover:bg-white hover:text-red-600"
          @click.stop="clearImage"
        >
          <X class="h-4 w-4" />
        </button>
      </template>

      <template v-else>
        <div class="flex flex-col items-center justify-center px-4 py-5 text-center">
          <div class="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-main/10 text-main">
            <Upload class="h-4 w-4" />
          </div>

          <p class="text-sm font-semibold text-gray-700">
            Subir imagen
          </p>

          <p class="mt-1 text-xs text-gray-400">
            JPG, PNG · Máx. {{ maxSizeMb }}MB
          </p>

          <ImageIcon class="mt-2 h-4 w-4 text-gray-300" />
        </div>
      </template>
    </div>

    <span v-if="error" class="mt-1 block text-xs font-medium text-red-600">
      {{ error }}
    </span>
  </div>
</template>