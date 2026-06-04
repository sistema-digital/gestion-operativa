<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useHorasPerdidasTable } from './useHorasPerdidasTable';
import type {
  HorasPerdidasAreaMotivoTableRow,
  HorasPerdidasAreaResumenTableRow,
} from '@/stores/db_mantenimiento/horas_perdidas_area_motivo/horasPerdidasAreaMotivo.types';

const props = withDefaults(defineProps<{
  weeklyAreaShortNames: Record<string, string>;
  hoursPerOrderByArea: Record<string, number>;
  currentOrderTotalsByArea: Record<string, number>;
  currentOrderTotalsGeneral: number;
  initialDate?: string;
}>(), {
  initialDate: '2026-04-06',
});

const selectedDate = ref(props.initialDate);
const useCurrentWeek = ref(false);

const getLatestMonday = () => {
  const today = new Date();
  const day = today.getDay();
  const differenceToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(today);

  monday.setDate(today.getDate() - differenceToMonday);

  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const date = String(monday.getDate()).padStart(2, '0');

  return `${year}-${month}-${date}`;
};

const latestMondayDate = computed(() => getLatestMonday());
const effectiveDate = computed(() => (
  useCurrentWeek.value ? latestMondayDate.value : selectedDate.value
));

const formattedBaseDate = computed(() => {
  if (!effectiveDate.value) return '';

  const parsedDate = new Date(`${effectiveDate.value}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return effectiveDate.value;
  }

  const formattedDate = new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate);

  return useCurrentWeek.value
    ? `Semana actual (${formattedDate})`
    : formattedDate;
});

const {
  cargarResumen,
  motivoTableRows,
  areaTableRows,
  hasRows,
  isLoading,
  error,
} = useHorasPerdidasTable({
  areaShortNames: props.weeklyAreaShortNames,
  hoursPerOrderByArea: props.hoursPerOrderByArea,
  currentOrderTotalsByArea: props.currentOrderTotalsByArea,
  currentOrderTotalsGeneral: props.currentOrderTotalsGeneral,
});

watch(
  effectiveDate,
  async (date) => {
    await cargarResumen(date);
  },
  { immediate: true }
);

const getLostProgressMain = (value: string) => value.split('|')[0] || '-';
const getLostProgressTime = (value: string) => value.split('|')[1] || '';
const getMotivoRowDividerClass = (rows: HorasPerdidasAreaMotivoTableRow[], index: number) => (
  index === 0
    || rows[index].esFilaTotal
    || rows[index].mostrarArea
    ? 'border-t-2 border-t-[#d8cfbf]'
    : 'border-t border-t-[#efe8db]'
);
const getAreaRowDividerClass = (row: HorasPerdidasAreaResumenTableRow, index: number) => (
  index === 0 || row.esFilaTotal
    ? 'border-t-2 border-t-[#d8cfbf]'
    : 'border-t border-t-[#efe8db]'
);
</script>

<template>
  <section class="w-full">
    <div class="mb-3 flex justify-end">
      <div class="flex flex-wrap items-center gap-2.5">
        <label class="inline-flex items-center gap-2 rounded-full border border-[#ddd5c7] bg-[#f7f2e8] px-3 py-[7px] text-[9px] font-bold uppercase tracking-[0.22em] text-[#8f8a80]">
          <span>Esta semana</span>
          <button
            type="button"
            :aria-pressed="useCurrentWeek"
            class="relative inline-flex h-4 w-7 rounded-full transition-colors"
            :class="useCurrentWeek ? 'bg-[#0f5750]' : 'bg-[#d5ccbc]'"
            @click="useCurrentWeek = !useCurrentWeek"
          >
            <span
              class="absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform"
              :class="useCurrentWeek ? 'translate-x-3.5' : 'translate-x-0.5'"
            />
          </button>
        </label>

        <label
          v-if="!useCurrentWeek"
          class="flex items-center gap-2.5 text-[9px] font-bold uppercase tracking-[0.22em] text-[#8f8a80]"
        >
          <span>Fecha base</span>
          <input
            v-model="selectedDate"
            type="date"
            class="rounded-[14px] border border-[#ddd5c7] bg-[#f7f2e8] px-3 py-[7px] text-[11px] font-semibold text-[#4d4a43] shadow-sm outline-none transition-colors focus:border-[#0f5750] focus:bg-white"
          >
        </label>
      </div>
    </div>

    <div class="relative overflow-hidden rounded-[27px] border border-[#e6dfd2] bg-white from-[#fcfaf6] to-[#f7f2e8] p-5 shadow-[0_10px_30px_rgba(104,88,59,0.08)]">
      <div class="pb-1 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
        <h2 class="text-[14px] font-extrabold uppercase tracking-[0.12em] text-[#8b857b]">
          AVANCE PERDIDO POR FALTA DE PERSONAL
        </h2>

        <p class="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9d968b]">
          Acumulado {{ formattedBaseDate ? `(${formattedBaseDate})` : '' }}
        </p>
      </div>

      <div class="grid gap-5 xl:grid-cols-2">
        <div class="flex min-w-0 flex-col gap-3">
          <div class="flex items-center justify-between gap-3 px-1">
            <h3 class="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#8b857b]">
              Por motivo
            </h3>
          </div>

          <div class="overflow-x-auto rounded-[22px] border border-[#e3dccf] bg-[#fdfbf7] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <table class=" min-w-[420px] table-fixed text-left">
              <thead class="bg-[#f2eee7] text-[#969083]">
                <tr>
                  <th class="w-[22%] px-[12px] py-[8px] text-[9px] font-extrabold uppercase tracking-[0.2em]">Area</th>
                  <th class="w-[28%] px-[12px] py-[8px] text-[9px] font-extrabold uppercase tracking-[0.2em]">Motivo</th>
                  <th class="w-[20%] px-[12px] py-[8px] text-[9px] font-extrabold uppercase tracking-[0.2em] text-right">% Perdida Avance</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="(row, index) in motivoTableRows"
                  :key="row.id"
                  :class="row.esFilaTotal
                    ? 'bg-[#f2eee7]'
                    : 'bg-white transition-colors hover:bg-[#f6f1e7]'"
                >
                  <td
                    v-if="row.mostrarArea"
                    :rowspan="row.rowspan"
                    :class="[
                      getMotivoRowDividerClass(motivoTableRows, index),
                      row.esFilaTotal
                        ? 'px-[12px] py-[8px] align-top text-[14px] font-extrabold uppercase tracking-[0.08em] text-[#403d37]'
                        : 'px-[12px] py-[8px] align-top text-[14px] font-bold text-[#403d37]',
                    ]"
                  >
                    {{ row.areaCorta }}
                  </td>
                  <td :class="[
                    getMotivoRowDividerClass(motivoTableRows, index),
                    row.esFilaTotal
                      ? 'px-[12px] py-[8px] text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#4b463f]'
                      : 'px-[12px] py-[8px] text-[13px] font-semibold text-[#5f5a52]',
                  ]"
                  >
                    {{ row.motivoLabel }}
                  </td>
                  <td :class="[
                    getMotivoRowDividerClass(motivoTableRows, index),
                    row.esFilaTotal
                      ? 'px-[12px] py-[8px] text-[13px] font-extrabold text-right text-[#c84c37]'
                      : 'px-[12px] py-[8px] text-[13px] font-bold text-right text-[#d45742]',
                  ]"
                  >
                    <span>{{ getLostProgressMain(row.porcentajePerdidaAvanceLabel) }}</span>
                    <span
                      v-if="getLostProgressTime(row.porcentajePerdidaAvanceLabel)"
                      class="ml-1 opacity-60"
                    >
                      {{ getLostProgressTime(row.porcentajePerdidaAvanceLabel) }}
                    </span>
                  </td>
                  
                </tr>

                <tr v-if="!isLoading && motivoTableRows.length === 0">
                  <td colspan="5" class="px-[12px] py-10 text-center text-[13px] font-semibold text-[#9d968b]">
                    No hay horas perdidas registradas en el periodo seleccionado.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex min-w-0 flex-col gap-3">
          <div class="flex items-center justify-between gap-3 px-1">
            <h3 class="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#8b857b]">
              Por area
            </h3>
          </div>

          <div class="overflow-x-auto rounded-[22px] border border-[#e3dccf] bg-[#fdfbf7] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <table class="min-w-[420px] table-fixed text-left">
              <thead class="bg-[#f2eee7] text-[#969083]">
                <tr>
                  <th class="w-[28%] px-[12px] py-[8px] text-[9px] font-extrabold uppercase tracking-[0.2em]">Area</th>
                  <th class="w-[27%] px-[12px] py-[8px] text-[9px] font-extrabold uppercase tracking-[0.2em] text-right">% Perdida Avance</th>
                  <th class="w-[22%] px-[12px] py-[8px] text-[9px] font-extrabold uppercase tracking-[0.2em] text-right">Personal Faltante</th>
                  <th class="w-[23%] px-[12px] py-[8px] text-[9px] font-extrabold uppercase tracking-[0.2em] text-right">Personal Activo</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="(row, index) in areaTableRows"
                  :key="row.id"
                  :class="row.esFilaTotal
                    ? 'bg-[#f2eee7]'
                    : 'bg-white transition-colors hover:bg-[#f6f1e7]'"
                >
                  <td :class="[
                    getAreaRowDividerClass(row, index),
                    row.esFilaTotal
                      ? 'px-[12px] py-[8px] text-[14px] font-extrabold uppercase tracking-[0.08em] text-[#403d37]'
                      : 'px-[12px] py-[8px] text-[14px] font-bold text-[#403d37]',
                  ]"
                  >
                    {{ row.areaCorta }}
                  </td>
                  <td :class="[
                    getAreaRowDividerClass(row, index),
                    row.esFilaTotal
                      ? 'px-[12px] py-[8px] text-[13px] font-extrabold text-right text-[#c84c37]'
                      : 'px-[12px] py-[8px] text-[13px] font-bold text-right text-[#d45742]',
                  ]"
                  >
                    <span>{{ getLostProgressMain(row.porcentajePerdidaAvanceLabel) }}</span>
                    <span
                      v-if="getLostProgressTime(row.porcentajePerdidaAvanceLabel)"
                      class="ml-1 opacity-60"
                    >
                      {{ getLostProgressTime(row.porcentajePerdidaAvanceLabel) }}
                    </span>
                  </td>
                  <td :class="[
                    getAreaRowDividerClass(row, index),
                    row.esFilaTotal
                      ? 'px-[12px] py-[8px] text-[13px] font-extrabold text-right text-[#c84c37]'
                      : 'px-[12px] py-[8px] text-[13px] font-bold text-right text-[#d45742]',
                  ]"
                  >
                    {{ row.personalFaltanteLabel }}
                  </td>
                  <td :class="[
                    getAreaRowDividerClass(row, index),
                    row.esFilaTotal
                      ? 'px-[12px] py-[8px] text-[13px] font-extrabold text-right text-[#3455E3]'
                      : 'px-[12px] py-[8px] text-[13px] font-bold text-right text-[#3455E3]',
                  ]"
                  >
                    {{ row.personalActivoLabel }}
                  </td>
                </tr>

                <tr v-if="!isLoading && areaTableRows.length === 0">
                  <td colspan="4" class="px-[12px] py-10 text-center text-[13px] font-semibold text-[#9d968b]">
                    No hay horas perdidas registradas en el periodo seleccionado.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div
        v-if="isLoading && hasRows"
        class="absolute inset-x-5 bottom-5 top-[94px] flex items-center justify-center rounded-[22px] bg-[#fcfaf6]/80 backdrop-blur-[1px]"
      >
        <div class="flex items-center gap-3 rounded-full border border-[#ddd5c7] bg-white px-4 py-[7px] text-[11px] font-bold uppercase tracking-[0.16em] text-[#8f8a80] shadow-sm">
          <span class="h-2.5 w-2.5 animate-pulse rounded-full bg-[#0f5750]"></span>
          Actualizando tablas
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
