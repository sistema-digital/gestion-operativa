<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useHorasPerdidasTable } from './useHorasPerdidasTable';

const props = withDefaults(defineProps<{
  weeklyAreaShortNames: Record<string, string>;
  initialDate?: string;
}>(), {
  initialDate: '2026-04-06',
});

const selectedDate = ref(props.initialDate);

const formattedBaseDate = computed(() => {
  if (!selectedDate.value) return '';

  const parsedDate = new Date(`${selectedDate.value}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return selectedDate.value;
  }

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate);
});

const {
  cargarResumen,
  tableRows,
  hasRows,
  isLoading,
  error,
} = useHorasPerdidasTable({
  areaShortNames: props.weeklyAreaShortNames,
});

watch(
  selectedDate,
  async (date) => {
    await cargarResumen(date);
  },
  { immediate: true }
);
</script>

<template>
  <section class="w-full">
    <div class="mb-3 flex justify-end">
      <label class="flex items-center gap-2.5 text-[9px] font-bold uppercase tracking-[0.22em] text-[#8f8a80]">
        <span>Fecha base</span>
        <input
          v-model="selectedDate"
          type="date"
          class="rounded-[14px] border border-[#ddd5c7] bg-[#f7f2e8] px-3 py-[7px] text-[11px] font-semibold text-[#4d4a43] shadow-sm outline-none transition-colors focus:border-[#0f5750] focus:bg-white"
        >
      </label>
    </div>

    <div class="relative overflow-hidden rounded-[27px] border border-[#e6dfd2] bg-white from-[#fcfaf6] to-[#f7f2e8] p-5 shadow-[0_10px_30px_rgba(104,88,59,0.08)]">
      <div class="pb-1">
        <h2 class="text-[14px] font-extrabold uppercase tracking-[0.12em] text-[#8b857b]">
          HORAS PERDIDAS POR AREA Y MOTIVO
        </h2>
        <p class="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#9d968b]">
          Acumulado {{ formattedBaseDate ? `(${formattedBaseDate})` : '' }}
        </p>
        
      </div>

      <div class="overflow-x-auto rounded-[22px] border border-[#e3dccf] bg-[#fdfbf7] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        <table class="w-full min-w-[720px] table-fixed text-left">
          <thead class="bg-[#f2eee7] text-[#969083]">
            <tr>
              <th class="w-[22%] px-[18px] py-[14px] text-[9px] font-extrabold uppercase tracking-[0.2em]">Area</th>
              <th class="w-[24%] px-[18px] py-[14px] text-[9px] font-extrabold uppercase tracking-[0.2em]">Motivo</th>
              <th class="w-[18%] px-[18px] py-[14px] text-[9px] font-extrabold uppercase tracking-[0.2em] text-right">Horas Perdidas</th>
              <th class="w-[18%] px-[18px] py-[14px] text-[9px] font-extrabold uppercase tracking-[0.2em] text-right">Cantidad Personal</th>
              <th class="w-[18%] px-[18px] py-[14px] text-[9px] font-extrabold uppercase tracking-[0.2em] text-right">% del Area</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-[#efe8db]">
            <tr
              v-for="row in tableRows"
              :key="row.id"
              class="transition-colors bg-white hover:bg-[#f6f1e7]"
            >
              <td
                v-if="row.mostrarArea"
                :rowspan="row.rowspan"
                class="px-[18px] py-[14px] align-top text-[14px] font-bold text-[#403d37]"
              >
                {{ row.areaCorta }}
              </td>
              <td class="px-[18px] py-[14px] text-[13px] font-semibold text-[#5f5a52]">{{ row.motivo }}</td>
              <td class="px-[18px] py-[14px] text-[13px] font-bold text-right text-[#d45742]">{{ row.horasPerdidas }}</td>
              <td class="px-[18px] py-[14px] text-[13px] font-bold text-right text-[#3a3e46]">{{ row.cantidadPersonal }}</td>
              <td class="px-[18px] py-[14px] text-[13px] font-bold text-right text-[#0f5750]">{{ row.porcentajeArea }}%</td>
            </tr>

            <tr v-if="!isLoading && !hasRows">
              <td colspan="5" class="px-[18px] py-10 text-center text-[13px] font-semibold text-[#9d968b]">
                No hay horas perdidas registradas en el periodo seleccionado.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="isLoading && hasRows"
        class="absolute inset-x-5 bottom-5 top-[94px] flex items-center justify-center rounded-[22px] bg-[#fcfaf6]/80 backdrop-blur-[1px]"
      >
        <div class="flex items-center gap-3 rounded-full border border-[#ddd5c7] bg-white px-4 py-[7px] text-[11px] font-bold uppercase tracking-[0.16em] text-[#8f8a80] shadow-sm">
          <span class="h-2.5 w-2.5 animate-pulse rounded-full bg-[#0f5750]"></span>
          Actualizando tabla
        </div>
      </div>

      <div
        v-else-if="isLoading"
        class="flex min-h-[162px] items-center justify-center text-[13px] font-semibold text-[#9d968b]"
      >
        Cargando horas perdidas...
      </div>

      <p v-if="error" class="mt-4 text-sm font-semibold text-danger">
        {{ error }}
      </p>
    </div>
  </section>
</template>
