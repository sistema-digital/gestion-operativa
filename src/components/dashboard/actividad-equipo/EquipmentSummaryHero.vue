<script setup lang="ts">
import { computed } from "vue";
import { Power, PowerOff } from "lucide-vue-next";
import { formatOperationalNumber } from "@/utils/formatOperationalNumber";
import type {
  EquipmentContext,
  EquipmentMasterDetail,
  EquipmentSummary,
} from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";

const props = defineProps<{
  detail: EquipmentMasterDetail | null;
  context: EquipmentContext | null;
  summary: EquipmentSummary;
}>();

const clampPercentage = (value: number): number =>
  Math.min(100, Math.max(0, value));

const percentageFormatter = new Intl.NumberFormat("es", {
  maximumFractionDigits: 1,
});
const engineMetrics = computed(() => [
  {
    label: "Motor encendido",
    time: props.summary.engineOnTime,
    percentage: clampPercentage(props.summary.engineOnPercentage),
    icon: Power,
    tone: "text-main-dark",
    bar: "bg-main",
  },
  {
    label: "Motor apagado",
    time: props.summary.engineOffTime,
    percentage: clampPercentage(props.summary.engineOffPercentage),
    icon: PowerOff,
    tone: "text-accent-dark",
    bar: "bg-accent-dark",
  },
]);
</script>

<template>
  <article
    id="equipment-summary-main-card"
    class="overflow-hidden border border-gray-200 bg-white shadow-sm"
  >
    <div
      class="grid min-w-0 items-stretch lg:grid-cols-[minmax(200px,1fr)_minmax(330px,1.65fr)_minmax(150px,.7fr)]"
    >
      <section
        id="equipment-summary-identity"
        class="grid min-w-0 grid-cols-[76px_minmax(0,1fr)] items-center gap-3 px-1 py-1"
      >
        <div
          id="equipment-summary-image"
          class="grid h-[58px] w-[76px] place-items-center overflow-hidden rounded-md border border-gray-200 bg-gray-50"
        >
          <img
            v-if="detail?.imageUrl"
            :src="detail.imageUrl"
            :alt="`Equipo ${formatOperationalNumber(detail.code)}`"
            class="h-full w-full object-contain"
          />
          <span v-else class="text-[10px] text-gray-500">IMAGEN</span>
        </div>
        <div class="min-w-0">
          <p class="text-base font-extrabold text-main">
            {{ formatOperationalNumber(detail?.code ?? summary.code) }}
          </p>
          <p class="mt-0.5 truncate text-xs text-gray-600">
            {{ detail?.type ?? "—" }}
          </p>
          <div class="mt-1.5 flex flex-wrap gap-1">
            <span
              class="rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] text-success"
              >{{ context?.journeys ?? "—" }} jornadas</span
            >
            <span
              class="rounded-full border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-600"
              >{{
                detail ? (detail.active ? "Activo" : "Inactivo") : "—"
              }}</span
            >
          </div>
        </div>
      </section>
      <section
        id="summary-engine-usage-card"
        class="min-w-0 border-y border-gray-200 lg:border-l lg:border-y-0"
        aria-label="Uso del motor"
      >
        <div class="grid grid-cols-2 divide-x divide-gray-200">
          <section
            v-for="metric in engineMetrics"
            :key="metric.label"
            class="flex min-h-[76px] min-w-0 flex-col justify-center px-3 py-2"
          >
            <div class="flex items-baseline justify-between gap-2">
              <span
                class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide"
                :class="metric.tone"
              >
                <component
                  :is="metric.icon"
                  class="size-3"
                  aria-hidden="true"
                />{{ metric.label }}
              </span>
              <strong
                class="text-right text-xl font-extrabold tabular-nums sm:text-2xl"
                :class="metric.tone"
                >{{ percentageFormatter.format(metric.percentage) }}%</strong
              >
            </div>
            <p class="mt-1 text-[11px] text-gray-600">
              <span class="font-bold tabular-nums text-gray-900">{{
                metric.time
              }}</span>
              del tiempo registrado
            </p>
          </section>
        </div>
        <div class="flex h-2 overflow-hidden bg-gray-100">
          <div
            v-for="metric in engineMetrics"
            :key="`${metric.label}-bar`"
            class="transition-[width] duration-300"
            :class="metric.bar"
            :style="{ width: `${metric.percentage}%` }"
          />
        </div>
      </section>
      <section
        id="summary-total-time-card"
        class="flex min-h-[80px] min-w-0 flex-col items-center justify-center border-gray-200 bg-gray-50 px-4 py-3 text-center lg:border-l"
      >
        <span
          class="text-[10px] font-medium uppercase tracking-wide text-main-dark/70"
          >Horas registradas</span
        >
        <strong
          class="mt-1 text-3xl font-extrabold tabular-nums text-main-dark"
          >{{ summary.totalTime }}</strong
        >
        <small class="mt-1 text-[10px] text-main-dark/70"
          >Total acumulado</small
        >
      </section>
    </div>
  </article>
</template>
