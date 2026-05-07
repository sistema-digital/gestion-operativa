<script setup lang="ts">
import type { SolicitudCompra } from '@/stores/comprasStore';
import SolicitudTableHeader from './SolicitudTableHeader.vue';
import SolicitudTableRow from './SolicitudTableRow.vue';
import {
  defaultSolicitudColumns,
  defaultTableGridClass,
  resolveSolicitudRowKey,
  type SolicitudColumn,
  type SolicitudDisplayConfig,
  type SolicitudRowKey,
} from './types';

interface Props {
  items: SolicitudCompra[];
  columns?: SolicitudColumn[];
  display: SolicitudDisplayConfig;
  loading?: boolean;
  emptyMessage?: string;
  rowKey?: SolicitudRowKey;
  gridClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  columns: () => defaultSolicitudColumns,
  loading: false,
  emptyMessage: 'No se encontraron solicitudes.',
  rowKey: 'id',
  gridClass: defaultTableGridClass,
});

const emit = defineEmits<{
  (e: 'row-click', item: SolicitudCompra): void;
}>();
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <SolicitudTableHeader :columns="columns" :grid-class="gridClass" />

    <div v-if="loading" class="py-12 text-center text-sm font-semibold text-gray-400">
      Cargando solicitudes...
    </div>

    <template v-else>
      <SolicitudTableRow
        v-for="item in items"
        :key="resolveSolicitudRowKey(item, rowKey)"
        :item="item"
        :columns="columns"
        :display="display"
        :grid-class="gridClass"
        @row-click="emit('row-click', item)"
      />

      <div v-if="items.length === 0" class="py-12 text-center text-gray-400 flex flex-col items-center">
        <slot name="empty">
          <p>{{ emptyMessage }}</p>
        </slot>
      </div>
    </template>
  </div>
</template>
