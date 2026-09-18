<script setup lang="ts">
/**
 * JornadaDatosGenerales.vue
 *
 * Campos:
 * - Fecha
 * - Operador
 * - Equipo
 * - Área
 *
 * RPC:
 * - rpc_admin_listar_operadores(): lo ejecuta el padre/service para poblar operadores.
 * - Equipos: usar el catálogo/fuente actual del ERP.
 *
 * Este componente NO crea la jornada.
 */

import type {
  EquipoOption,
  JornadaDatosGeneralesModel,
  OperadorOption,
} from '../registroJornada.types';

const model = defineModel<JornadaDatosGeneralesModel>({ required: true });

defineProps<{
  operadores: OperadorOption[];
  equipos: EquipoOption[];
}>();
</script>

<template>
  <section
    class="mb-2 grid gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm
           sm:grid-cols-2 xl:grid-cols-[150px_minmax(220px,1.25fr)_minmax(160px,.85fr)_minmax(130px,.65fr)]"
  >
    <label class="min-w-0">
      <span class="mb-1 ml-0.5 block text-[9px] font-bold uppercase tracking-[.07em] text-gray-600">Fecha</span>
      <input v-model="model.fecha" type="date" class="h-8 w-full rounded-md border border-gray-300 px-2 font-mono text-xs focus:border-main focus:outline-none" />
    </label>

    <label class="min-w-0">
      <span class="mb-1 ml-0.5 block text-[9px] font-bold uppercase tracking-[.07em] text-gray-600">Operador</span>
      <select v-model="model.operadorId" class="h-8 w-full rounded-md border border-gray-300 bg-white px-2 text-xs">
        <option :value="null">Seleccionar operador…</option>
        <option v-for="op in operadores" :key="op.id" :value="op.id">{{ op.nombre }}</option>
      </select>
    </label>

    <label class="min-w-0">
      <span class="mb-1 ml-0.5 block text-[9px] font-bold uppercase tracking-[.07em] text-gray-600">Equipo</span>
      <select v-model="model.equipoNumero" class="h-8 w-full rounded-md border border-gray-300 bg-white px-2 font-mono text-xs">
        <option :value="null">Seleccionar equipo…</option>
        <option v-for="eq in equipos" :key="eq.numero" :value="eq.numero">{{ eq.etiqueta }}</option>
      </select>
    </label>

    <label class="min-w-0">
      <span class="mb-1 ml-0.5 block text-[9px] font-bold uppercase tracking-[.07em] text-gray-600">Área</span>
      <input :value="model.area || ''" readonly class="h-8 w-full rounded-md border border-gray-300 bg-gray-50 px-2 text-xs" />
    </label>
  </section>
</template>
