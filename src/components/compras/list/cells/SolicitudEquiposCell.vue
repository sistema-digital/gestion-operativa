<script setup lang="ts">
import { computed } from 'vue';

import type { SolicitudCompraEquipoPreview } from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.types';

const props = withDefaults(defineProps<{
  equipos: SolicitudCompraEquipoPreview;
  compact?: boolean;
}>(), {
  compact: false,
});

const visibleCodigos = computed(() => props.equipos.visibles);

const overflowCount = computed(() => props.equipos.ocultos);

const hasError = computed(() => Boolean(props.equipos.error));
</script>

<template>
  <div class="flex min-h-full flex-col justify-center">
    <div v-if="equipos.loading" class="flex items-center gap-2 text-[11px] text-stone-500">
      <span class="h-3 w-3 animate-spin rounded-full border border-stone-300 border-t-stone-600" />
      <span>Cargando equipos...</span>
    </div>

    <div v-else-if="visibleCodigos.length > 0" class="flex flex-wrap gap-1.5">
      <span
        v-for="codigo in visibleCodigos"
        :key="codigo"
        class="inline-flex rounded-full border border-stone-200 bg-stone-100 font-medium text-stone-700"
        :class="compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]'"
      >
        {{ codigo }}
      </span>

      <span
        v-if="overflowCount > 0"
        class="inline-flex rounded-full border border-stone-200 bg-white font-medium text-stone-500"
        :class="compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]'"
      >
        +{{ overflowCount }}
      </span>
    </div>

    <span
      v-else-if="hasError"
      class="text-[11px] text-amber-700"
    >
      Error equipos
    </span>
  </div>
</template>
