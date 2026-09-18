<script setup lang="ts">
/**
 * JornadaResumen.vue
 *
 * Responsabilidad:
 * - observaciones;
 * - hora inicial;
 * - hora final;
 * - total de tiempo.
 *
 * RPC: ninguno.
 */

import { computed } from 'vue';
import type { JornadaFilaModel } from '../registroJornada.types';

const observaciones = defineModel<string>('observaciones', { required: true });

const props = defineProps<{
  filas: JornadaFilaModel[];
}>();

function minutos(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

const inicio = computed(() => props.filas[0]?.inicio || '--:--');
const fin = computed(() => props.filas.at(-1)?.fin || '--:--');

const total = computed(() => {
  const totalMin = props.filas.reduce((acc, fila) => {
    if (!fila.inicio || !fila.fin) return acc;
    return acc + Math.max(0, minutos(fila.fin) - minutos(fila.inicio));
  }, 0);
  return `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
});
</script>

<template>
  <section class="mt-0 grid gap-2 border-x border-b border-gray-200 bg-white p-3 md:grid-cols-[1fr_auto]">
    <label>
      <span class="mb-1 block text-[9px] font-bold uppercase tracking-[.07em] text-gray-600">Observaciones generales</span>
      <textarea v-model="observaciones" class="min-h-14 w-full resize-y rounded-md border border-gray-300 p-2 text-xs" placeholder="Opcional. Ej.: Jornada transcrita desde informe físico…" />
    </label>

    <div class="grid grid-cols-3 gap-2 md:grid-cols-[repeat(3,112px)]">
      <div class="rounded-md border border-gray-200 bg-gray-50 p-2">
        <small class="block text-[9px] uppercase text-gray-500">Inicio</small>
        <strong class="font-mono text-sm text-main-dark">{{ inicio }}</strong>
      </div>
      <div class="rounded-md border border-gray-200 bg-gray-50 p-2">
        <small class="block text-[9px] uppercase text-gray-500">Fin</small>
        <strong class="font-mono text-sm text-main-dark">{{ fin }}</strong>
      </div>
      <div class="rounded-md border border-gray-200 bg-gray-50 p-2">
        <small class="block text-[9px] uppercase text-gray-500">Total</small>
        <strong class="font-mono text-sm text-main-dark">{{ total }}</strong>
      </div>
    </div>
  </section>
</template>
