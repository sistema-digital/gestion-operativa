<script setup lang="ts">
import type { SolicitudCompra } from '@/stores/comprasStore';
import DataTags from './data/DataTags.vue';
import DataText from './data/DataText.vue';
import DataValue from './data/DataValue.vue';
import type { SolicitudDisplayConfig } from './types';

interface Props {
  item: SolicitudCompra;
  display: SolicitudDisplayConfig;
  showTeams?: boolean;
}

withDefaults(defineProps<Props>(), {
  showTeams: true,
});
</script>

<template>
  <div class="flex-1 space-y-2 z-10">
    <DataText :text="item.observacion" />
    <DataValue label="Orden de compra" :value="display.ordenesCompraLabel(item)" />
    <DataTags v-if="showTeams" :items="item.equipos" />
  </div>
</template>
