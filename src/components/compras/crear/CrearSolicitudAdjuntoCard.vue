<script setup lang="ts">
import { Eye, FileText, Trash2 } from 'lucide-vue-next';
import { computed, onBeforeUnmount, watch } from 'vue';
import { shallowRef } from 'vue';

import { formatAdjuntoSize, getAdjuntoExtension } from './crearSolicitudAdjuntos.utils';
import type { CrearSolicitudAdjuntoLocalItem } from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

const props = defineProps<{
  item: CrearSolicitudAdjuntoLocalItem;
}>();

const emit = defineEmits<{
  (e: 'view', value: CrearSolicitudAdjuntoLocalItem): void;
  (e: 'remove', value: string): void;
}>();

const previewUrl = shallowRef<string | null>(null);

const secondaryLabel = computed(() => {
  const extension = getAdjuntoExtension(props.item.file.name).toUpperCase();
  return `${extension} · ${formatAdjuntoSize(props.item.file.size)}`;
});

const syncPreviewUrl = (): void => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
  }

  if (props.item.kind === 'image') {
    previewUrl.value = URL.createObjectURL(props.item.file);
  }
};

watch(() => props.item.file, syncPreviewUrl, { immediate: true });

onBeforeUnmount(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
});
</script>

<template>
  <article class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
    <button
      type="button"
      class="flex w-full items-stretch text-left"
      @click="emit('view', item)"
    >
      <div class="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden bg-stone-100">
        <img
          v-if="previewUrl"
          :src="previewUrl"
          :alt="item.file.name"
          class="h-full w-full object-cover"
        >
        <FileText
          v-else
          class="h-8 w-8 text-stone-500"
        />
      </div>

      <div class="min-w-0 flex-1 px-4 py-3">
        <p class="truncate text-sm font-semibold text-stone-900">
          {{ item.file.name }}
        </p>
        <p class="mt-1 text-xs font-medium uppercase tracking-wide text-stone-500">
          {{ secondaryLabel }}
        </p>
      </div>
    </button>

    <div class="flex items-center justify-end gap-2 border-t border-stone-200 px-3 py-2">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-main transition hover:bg-main/10"
        @click="emit('view', item)"
      >
        <Eye class="h-4 w-4" />
        Ver
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-danger transition hover:bg-danger-bg"
        @click="emit('remove', item.localId)"
      >
        <Trash2 class="h-4 w-4" />
        Eliminar
      </button>
    </div>
  </article>
</template>
