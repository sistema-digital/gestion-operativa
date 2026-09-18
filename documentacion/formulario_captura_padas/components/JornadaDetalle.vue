<script setup lang="ts">
/**
 * JornadaDetalle.vue
 *
 * Contenedor de todas las filas.
 *
 * Responsabilidad:
 * - v-for de JornadaFila.
 * - agregar y eliminar registros.
 * - propagar qué fila solicita crear un implemento.
 *
 * RPC: ninguno.
 */

import JornadaFila from './JornadaFila.vue';
import type { CatalogosJornada, JornadaFilaModel } from '../registroJornada.types';

const filas = defineModel<JornadaFilaModel[]>('filas', { required: true });

defineProps<{
  catalogos: CatalogosJornada;
}>();

const emit = defineEmits<{
  (e: 'crear-implemento', index: number): void;
}>();

function agregarFila() {
  const ultima = filas.value.at(-1);
  filas.value.push({
    idLocal: crypto.randomUUID(),
    inicio: ultima?.fin || '06:00',
    fin: '',
    codigo: null,
    tipoActividad: null,
    actividadId: null,
    actividadNombre: '',
    implementoId: ultima?.implementoId ?? null,
  });
}

function eliminarFila(index: number) {
  filas.value.splice(index, 1);
}
</script>

<template>
  <section class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
    <header class="flex min-h-12 items-center justify-between border-b border-gray-200 px-3 py-2">
      <div>
        <strong class="block text-[13px] text-main-dark">Detalle de la jornada</strong>
        <small class="text-[10px] text-gray-500">Las horas deben quedar continuas y sin solapamientos.</small>
      </div>
    </header>

    <div class="overflow-x-auto md:p-0">
      <div class="hidden min-w-[900px] grid-cols-[38px_90px_90px_82px_1fr_145px_82px_48px] border-b border-gray-200 bg-gray-50 md:grid">
        <span class="px-2 py-2 text-[9px] font-bold uppercase text-gray-600">#</span>
        <span class="px-2 py-2 text-[9px] font-bold uppercase text-gray-600">Hora inicio</span>
        <span class="px-2 py-2 text-[9px] font-bold uppercase text-gray-600">Hora fin</span>
        <span class="px-2 py-2 text-[9px] font-bold uppercase text-gray-600">Código</span>
        <span class="px-2 py-2 text-[9px] font-bold uppercase text-gray-600">Labor / causa</span>
        <span class="px-2 py-2 text-[9px] font-bold uppercase text-gray-600">Implemento</span>
        <span class="px-2 py-2 text-[9px] font-bold uppercase text-gray-600">Duración</span>
        <span />
      </div>

      <div class="grid gap-2 p-2 md:block md:min-w-[900px] md:p-0">
        <JornadaFila
          v-for="(fila, index) in filas"
          :key="fila.idLocal"
          v-model="filas[index]"
          :numero="index + 1"
          :catalogos="catalogos"
          @eliminar="eliminarFila(index)"
          @crear-implemento="emit('crear-implemento', index)"
        />
      </div>
    </div>

    <div class="flex justify-center border-t border-dashed border-gray-200 bg-gray-50 p-2">
      <button type="button" class="h-8 rounded-md border border-gray-200 bg-white px-3 text-xs font-semibold shadow-sm" @click="agregarFila">
        + Agregar registro
      </button>
    </div>
  </section>
</template>
