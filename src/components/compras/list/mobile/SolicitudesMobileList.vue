<script setup lang="ts">
import type { SolicitudCompraListItem, SolicitudCompraRoleCodigo } from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.types';
import SolicitudMobileCard from './SolicitudMobileCard.vue';

const props = defineProps<{
  items: SolicitudCompraListItem[];
  roleCodigo: SolicitudCompraRoleCodigo;
  loading: boolean;
  loadingMore: boolean;
}>();

const emit = defineEmits<{
  (e: 'card-click', item: SolicitudCompraListItem): void;
}>();

const onCardClick = (item: SolicitudCompraListItem): void => {
  emit('card-click', item);
};
</script>

<template>
  <section
    class="bg-[#f5f1e8]"
    :data-role-codigo="props.roleCodigo"
    :aria-busy="props.loading || props.loadingMore"
    aria-live="polite"
  >
    <div class="flex flex-col gap-3">
      <SolicitudMobileCard
        v-for="item in props.items"
        :key="item.id"
        :item="item"
        :role-codigo="props.roleCodigo"
        @click="onCardClick(item)"
      />
    </div>
  </section>
</template>
