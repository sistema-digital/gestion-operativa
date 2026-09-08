<script setup lang="ts">
import { Power, PowerOff } from "lucide-vue-next";
import OperatorClassificationDistributionCard from "./OperatorClassificationDistributionCard.vue";
import OperatorMainStopsCard from "./OperatorMainStopsCard.vue";
import type { OperatorDetail } from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";
const props = defineProps<{ detail: OperatorDetail }>();

const engineMetrics = [
  {
    label: "Motor encendido",
    icon: Power,
    time: () => props.detail.engineOnTime,
    percentage: () => props.detail.engineOnPercentage,
    tone: "text-main",
  },
  {
    label: "Motor apagado",
    icon: PowerOff,
    time: () => props.detail.engineOffTime,
    percentage: () => props.detail.engineOffPercentage,
    tone: "text-accent-dark",
  },
];
</script>
<template>
  <section class="grid min-h-0 gap-2">
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <article
        v-for="metric in engineMetrics"
        :key="metric.label"
        class="rounded-md border border-gray-200 bg-white px-2.5 py-2 shadow-sm"
      >
        <span
          class="inline-flex items-center gap-1 text-[10px] font-semibold"
          :class="metric.tone"
        >
          <component :is="metric.icon" class="size-3" aria-hidden="true" />{{
            metric.label
          }}
        </span>
        <strong class="mt-1 block text-sm tabular-nums text-gray-800">{{
          metric.time()
        }}</strong>
        <small class="text-[10px] text-gray-500"
          >{{ metric.percentage().toFixed(1) }}% del total</small
        >
      </article>
    </div>
    <div class="grid min-h-0 gap-2 lg:grid-cols-2">
      <OperatorClassificationDistributionCard
        :rows="detail.classificationDistribution"
      /><OperatorMainStopsCard :rows="detail.mainStops" />
    </div>
  </section>
</template>
