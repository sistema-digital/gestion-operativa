<script setup lang="ts">
import type { SolicitudCompra } from '@/stores/comprasStore';
import DataBadgeEstado from './data/DataBadgeEstado.vue';
import DataBadgePrioridad from './data/DataBadgePrioridad.vue';
import DataTitle from './data/DataTitle.vue';
import type { SolicitudDisplayConfig } from './types';

interface Props {
  item: SolicitudCompra;
  display: SolicitudDisplayConfig;
}

defineProps<Props>();
</script>

<template>
  <div class="flex justify-between items-start z-10">
    <DataTitle :title="item.folio_sol" />
    <div class="flex flex-col items-end gap-1">
      <DataBadgeEstado :label="display.estadoLabel(item)" />
      <DataBadgePrioridad
        v-if="display.shouldShowPriorityBadge(item)"
        :label="display.priorityLabel(item)"
        :class-name="display.priorityClass(item)"
      />
    </div>
  </div>
</template>
