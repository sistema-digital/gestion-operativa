<script setup lang="ts">
import { computed } from 'vue';

import type { SolicitudCompraPrioridadUi } from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.types';

const props = withDefaults(defineProps<{
  prioridad: SolicitudCompraPrioridadUi;
  compact?: boolean;
}>(), {
  compact: false,
});

const label = computed(() => props.prioridad.nombre || props.prioridad.codigo || 'Sin prioridad');

const badgeClass = computed(() => {
  switch (props.prioridad.codigo) {
    case 'urgente':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    case 'alta':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'normal':
      return 'border-stone-200 bg-stone-100 text-stone-700';
    case 'baja':
      return 'border-slate-200 bg-slate-50 text-slate-600';
    default:
      return 'border-neutral-200 bg-neutral-100 text-neutral-700';
  }
});
</script>

<template>
  <span
    class="inline-flex items-center rounded-full border font-semibold capitalize"
    :class="[badgeClass, compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]']"
  >
    {{ label }}
  </span>
</template>
