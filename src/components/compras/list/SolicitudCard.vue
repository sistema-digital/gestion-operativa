<script setup lang="ts">
import type { SolicitudCompra } from '@/stores/comprasStore';
import SolicitudCardBody from './SolicitudCardBody.vue';
import SolicitudCardFooter from './SolicitudCardFooter.vue';
import SolicitudCardHeader from './SolicitudCardHeader.vue';
import type { SolicitudDisplayConfig } from './types';

interface Props {
  item: SolicitudCompra;
  display: SolicitudDisplayConfig;
  accent?: boolean;
  showTeams?: boolean;
}

withDefaults(defineProps<Props>(), {
  accent: false,
  showTeams: true,
});

const emit = defineEmits<{
  (e: 'item-click'): void;
}>();
</script>

<template>
  <div
    @click="emit('item-click')"
    class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-accent hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 group/card relative overflow-hidden"
  >
    <div v-if="accent" class="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-accent/10 to-transparent rounded-bl-3xl z-0 pointer-events-none"></div>
    <SolicitudCardHeader :item="item" :display="display" />
    <SolicitudCardBody :item="item" :display="display" :show-teams="showTeams" />
    <SolicitudCardFooter :item="item" :display="display" />
  </div>
</template>
