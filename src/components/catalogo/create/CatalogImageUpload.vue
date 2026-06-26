<script setup lang="ts">
import { computed, ref } from 'vue';
import { Camera, FolderOpen, Image as ImageIcon, RefreshCw, Upload, X } from 'lucide-vue-next';

const props = withDefaults(defineProps<{
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

const emit = defineEmits<{
  (e: 'update:modelValue', value: File | null): void;
  (e: 'error', value: string): void;
}>();

const cameraInputRef = ref<HTMLInputElement | null>(null);
const galleryInputRef = ref<HTMLInputElement | null>(null);

const preview = computed(() => props.previewUrl || '');
const helperText = computed(() => `JPG, PNG o WEBP · Máx. ${props.maxSizeMb}MB`);
const supportsCameraCapture = computed(() => typeof navigator !== 'undefined' && 'mediaDevices' in navigator);

const openCameraPicker = () => {
  (supportsCameraCapture.value ? cameraInputRef.value : galleryInputRef.value)?.click();
};

const openGalleryPicker = () => {
  galleryInputRef.value?.click();
};

const clearImage = () => {
  emit('error', '');
  emit('update:modelValue', null);

  if (cameraInputRef.value) cameraInputRef.value.value = '';
  if (galleryInputRef.value) galleryInputRef.value.value = '';
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

  if (!file.type.startsWith('image/')) {
    emit('error', 'Selecciona un archivo de imagen válido.');
    input.value = '';
    return;
  }

  emit('error', '');
  emit('update:modelValue', file);
};
</script>

<template>
  <div>
    <div class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
      <span>{{ label }}</span>
      <span
        v-if="required"
        class="text-red-500"
      >
        *
      </span>
    </div>

    <div
      class="relative flex h-[220px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed bg-white transition hover:bg-gray-50"
      :class="error ? 'border-red-300' : 'border-gray-300'"
    >
      <input
        ref="cameraInputRef"
        type="file"
        :accept="accept"
        :capture="capture || undefined"
        class="hidden"
        @change="handleChange"
      />

      <input
        ref="galleryInputRef"
        type="file"
        :accept="accept"
        class="hidden"
        @change="handleChange"
      />

      <template v-if="preview">
        <img
          :src="preview"
          :alt="label"
          class="h-full max-h-[220px] w-full object-contain"
        />

        <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-3 py-2 text-xs font-medium text-white">
          {{ modelValue?.name || 'Imagen cargada' }}
        </div>

        <div class="absolute right-2 top-2 flex gap-2">
          <button
            type="button"
            class="rounded-full bg-white/90 p-1.5 text-gray-600 shadow-sm transition hover:bg-white hover:text-main"
            @click.stop="openGalleryPicker"
          >
            <RefreshCw class="h-4 w-4" />
          </button>

          <button
            type="button"
            class="rounded-full bg-white/90 p-1.5 text-gray-600 shadow-sm transition hover:bg-white hover:text-red-600"
            @click.stop="clearImage"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
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
            {{ helperText }}
          </p>

          <div class="mt-3 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-full bg-main px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-main-light"
              @click.stop="openCameraPicker"
            >
              <Camera class="h-3.5 w-3.5" />
              {{ supportsCameraCapture ? 'Tomar foto' : 'Abrir cámara/archivos' }}
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-[11px] font-medium text-gray-600 transition hover:bg-gray-200"
              @click.stop="openGalleryPicker"
            >
              <FolderOpen class="h-3.5 w-3.5" />
              Elegir archivo
            </button>
          </div>

          <ImageIcon class="mt-2 h-4 w-4 text-gray-300" />
        </div>
      </template>
    </div>

    <span
      v-if="error"
      class="mt-1 block text-xs font-medium text-red-600"
    >
      {{ error }}
    </span>
  </div>
</template>
