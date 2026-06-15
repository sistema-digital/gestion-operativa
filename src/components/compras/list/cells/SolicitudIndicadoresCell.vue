<script setup lang="ts">
import { computed } from 'vue';

import type { SolicitudListRoleVisibility } from '@/components/compras/list/solicitudListRoleConfig';
import type { SolicitudCompraIndicadores } from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.types';

interface IndicadorUi {
  key: string;
  label: string;
  className: string;
}

const props = withDefaults(defineProps<{
  indicadores: SolicitudCompraIndicadores;
  roleConfig: Pick<
    SolicitudListRoleVisibility,
    'canSeeAdjuntos' | 'canSeeDiferenciaOc' | 'canSeeBloqueado'
  >;
  compact?: boolean;
}>(), {
  compact: false,
});

const visibleIndicadores = computed<IndicadorUi[]>(() => {
  const items: IndicadorUi[] = [];

  if (props.roleConfig.canSeeAdjuntos && props.indicadores.adjuntos.visible && props.indicadores.adjuntos.cantidad > 0) {
    items.push({
      key: 'adjuntos',
      label: `Adjuntos ${props.indicadores.adjuntos.cantidad}`,
      className: 'border-stone-200 bg-white text-stone-600',
    });
  }

  if (
    props.roleConfig.canSeeDiferenciaOc &&
    props.indicadores.diferenciaOc.visible &&
    props.indicadores.diferenciaOc.cantidad > 0
  ) {
    items.push({
      key: 'diferencia-oc',
      label: `Diferencia OC ${props.indicadores.diferenciaOc.cantidad}`,
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    });
  }

  if (props.roleConfig.canSeeBloqueado && props.indicadores.bloqueado.visible) {
    items.push({
      key: 'bloqueado',
      label: 'Bloqueado',
      className: 'border-rose-200 bg-rose-50 text-rose-700',
    });
  }

  return items;
});
</script>

<template>
  <div class="flex min-h-full items-center">
    <div v-if="visibleIndicadores.length > 0" class="flex flex-wrap gap-1.5">
      <span
        v-for="indicador in visibleIndicadores"
        :key="indicador.key"
        class="inline-flex rounded-full border font-medium"
        :class="[indicador.className, compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]']"
      >
        {{ indicador.label }}
      </span>
    </div>
  </div>
</template>
