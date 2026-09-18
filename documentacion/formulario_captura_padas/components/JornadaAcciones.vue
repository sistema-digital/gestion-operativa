<script setup lang="ts">
/**
 * JornadaAcciones.vue
 *
 * Solo presenta y emite acciones.
 *
 * RPC: ninguno directo.
 *
 * Al emitir `finalizar`, RegistroJornadaPage -> useJornadaAdmin ejecutará:
 * - rpc_admin_iniciar_jornada
 * - rpc_admin_cambiar_labor
 * - rpc_admin_registrar_parada
 * - rpc_admin_cambiar_tipo_parada
 * - rpc_admin_reanudar_trabajo
 * - rpc_admin_confirmar_cambio_implemento
 * - rpc_admin_finalizar_jornada
 */

defineProps<{
  valido: boolean;
  mensajeValidacion: string;
  guardando: boolean;
}>();

const emit = defineEmits<{
  (e: 'guardar'): void;
  (e: 'finalizar'): void;
}>();
</script>

<template>
  <footer class="sticky bottom-0 z-20 flex flex-col gap-2 border border-t-0 border-gray-200 bg-gray-50 p-2 md:static md:flex-row md:items-center md:justify-between">
    <div
      class="text-center text-[11px] font-semibold md:text-left"
      :class="valido ? 'text-success' : 'text-warning'"
    >
      {{ mensajeValidacion }}
    </div>

    <div class="grid grid-cols-[1fr_1.2fr] gap-2 md:flex">
      <button type="button" class="h-9 rounded-md border border-gray-200 bg-white px-3 text-xs font-semibold shadow-sm" :disabled="guardando" @click="emit('guardar')">
        Guardar borrador
      </button>
      <button type="button" class="h-9 rounded-md bg-main px-3 text-xs font-semibold text-white" :disabled="!valido || guardando" @click="emit('finalizar')">
        Finalizar y registrar
      </button>
    </div>
  </footer>
</template>
