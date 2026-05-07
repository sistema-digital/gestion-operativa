<script setup lang="ts">
import type { SolicitudCompra } from '@/stores/comprasStore';
import DataBadgeEstado from './data/DataBadgeEstado.vue';
import DataBadgePrioridad from './data/DataBadgePrioridad.vue';
import DataDatePair from './data/DataDatePair.vue';
import DataTags from './data/DataTags.vue';
import DataText from './data/DataText.vue';
import DataTitle from './data/DataTitle.vue';
import DataValue from './data/DataValue.vue';
import type { SolicitudColumn, SolicitudDisplayConfig } from './types';

interface Props {
  item: SolicitudCompra;
  column: SolicitudColumn;
  display: SolicitudDisplayConfig;
}

defineProps<Props>();
</script>

<template>
  <div :class="column.cellClass">
    <DataTitle
      v-if="column.type === 'solicitud'"
      :title="item.folio_sol"
      :subtitle="item.nombreSolicitante || item.email"
    />

    <DataValue
      v-else-if="column.type === 'ordenCompra'"
      :value="display.ordenesCompraLabel(item)"
    />

    <div v-else-if="column.type === 'estado'" class="flex flex-col items-start gap-1">
      <DataBadgeEstado :label="display.estadoLabel(item)" />
      <DataBadgePrioridad
        v-if="display.shouldShowPriorityBadge(item)"
        :label="display.priorityLabel(item)"
        :class-name="display.priorityClass(item)"
      />
    </div>

    <DataDatePair
      v-else-if="column.type === 'fechas'"
      :created-at="display.formatDateTime(item.fecha_creacion)"
      :delivery-at="display.formatDate(item.fecha_entrega)"
    />

    <DataText v-else-if="column.type === 'observacion'" :text="item.observacion" />

    <DataTags v-else-if="column.type === 'equipos'" :items="item.equipos" />
  </div>
</template>
