<script setup lang="ts">
import type { SolicitudCompra } from '@/stores/comprasStore';
import SolicitudCard from './SolicitudCard.vue';
import { resolveSolicitudRowKey, type SolicitudDisplayConfig, type SolicitudRowKey } from './types';

interface Props {
  items: SolicitudCompra[];
  display: SolicitudDisplayConfig;
  loading?: boolean;
  emptyMessage?: string;
  rowKey?: SolicitudRowKey;
  accentCards?: boolean;
  showTeams?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyMessage: 'No se encontraron solicitudes.',
  rowKey: 'id',
  accentCards: false,
  showTeams: true,
});

const emit = defineEmits<{
  (e: 'item-click', item: SolicitudCompra): void;
}>();
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div v-if="loading" class="col-span-full py-12 text-center text-sm font-semibold text-gray-400">
      Cargando solicitudes...
    </div>

    <template v-else>
      <SolicitudCard
        v-for="item in items"
        :key="resolveSolicitudRowKey(item, rowKey)"
        :item="item"
        :display="display"
        :accent="accentCards"
        :show-teams="showTeams"
        @item-click="emit('item-click', item)"
      />

      <div v-if="items.length === 0" class="col-span-full py-12 text-center text-gray-400 flex flex-col items-center">
        <slot name="empty">
          <p>{{ emptyMessage }}</p>
        </slot>
      </div>
    </template>
  </div>
</template>
