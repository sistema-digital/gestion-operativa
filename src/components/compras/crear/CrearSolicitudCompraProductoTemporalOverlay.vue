<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { shallowRef } from 'vue';

import type { ProductoTemporalDraft } from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

import CrearSolicitudCompraProductoTemporalForm from './CrearSolicitudCompraProductoTemporalForm.vue';

const props = defineProps<{
  mode: 'create' | 'edit';
  initialDraft: ProductoTemporalDraft;
}>();

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'submit', value: ProductoTemporalDraft): void;
}>();

const viewportWidth = shallowRef(typeof window === 'undefined' ? 1280 : window.innerWidth);
const isDesktop = computed(() => viewportWidth.value >= 1024);

const syncViewportWidth = (): void => {
  viewportWidth.value = window.innerWidth;
};

const blockEscapeClose = (event: KeyboardEvent): void => {
  if (event.key !== 'Escape') {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
};

onMounted(() => {
  document.body.style.overflow = 'hidden';
  window.addEventListener('resize', syncViewportWidth);
  window.addEventListener('keydown', blockEscapeClose, true);
});

onBeforeUnmount(() => {
  document.body.style.overflow = '';
  window.removeEventListener('resize', syncViewportWidth);
  window.removeEventListener('keydown', blockEscapeClose, true);
});
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[90] bg-[#EEECE4]/45 backdrop-blur-[3px]">
      <div
        class="flex h-full w-full"
        :class="isDesktop ? 'justify-end p-4' : 'items-end'"
      >
        <div
          class="flex w-full flex-col border border-stone-200 bg-white shadow-2xl"
          :class="isDesktop
            ? 'h-full max-w-[34rem] overflow-hidden rounded-[2rem]'
            : 'max-h-[92vh] overflow-visible rounded-t-[2rem] border-b-0'"
        >
          <CrearSolicitudCompraProductoTemporalForm
            :mode="props.mode"
            :initial-draft="props.initialDraft"
            @cancel="emit('cancel')"
            @submit="emit('submit', $event)"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>
