<script setup lang="ts">
import {
  ArrowRight,
  CalendarDays,
  CircleAlert,
  Package,
  Users,
  Wrench,
} from 'lucide-vue-next';
import { computed } from 'vue';

import type { SolicitudCompraBorradorListadoItem } from '@/stores/db_compras/solicitudes_compra/borradores/solicitudesCompraBorradores.types';
import { formatDateDisplay, formatPanamaDateTime } from '@/utils/dateUtils';

const props = defineProps<{
  draft: SolicitudCompraBorradorListadoItem;
  isMostRecent?: boolean;
}>();

const emit = defineEmits<{
  (e: 'continue', draft: SolicitudCompraBorradorListadoItem): void;
}>();

const formattedEntrega = computed(() => formatDateDisplay(props.draft.fechaEntrega));
const formattedCreatedAt = computed(() => formatPanamaDateTime(props.draft.createdAt));
const formattedUpdatedAt = computed(() => formatPanamaDateTime(props.draft.updatedAt));

const equiposSummary = computed(() => {
  const codes = props.draft.equipos
    .map((item) => item.codEquipo.trim())
    .filter(Boolean);

  if (codes.length === 0) {
    return 'Sin contexto definido';
  }

  if (codes.length <= 2) {
    return codes.join(', ');
  }

  return `${codes.slice(0, 2).join(', ')} +${codes.length - 2}`;
});

const tipoSolicitudLabel = computed(() => {
  switch (props.draft.tipoSolicitud) {
    case 'zafra':
      return 'Compra de zafra';
    case 'cultivo':
      return 'Compra de cultivo';
    case 'otros':
      return 'Compra general';
    case 'servicio':
      return 'Compra de servicios';
    default:
      return 'Compras';
  }
});

const progressSteps = computed(() => [2, 3, 4]);
</script>

<template>
  <article
    class="rounded-[1.35rem] border border-stone-200 bg-white p-4 text-xs shadow-[0_12px_40px_rgba(28,25,23,0.06)] transition hover:border-[#d1b15a] hover:shadow-[0_18px_48px_rgba(168,128,28,0.12)]"
    :class="isMostRecent ? 'border-[#d7b15c] bg-[#fffaf0]' : ''"
  >
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex min-w-0 gap-3">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#edf3f1] text-main">
          <CalendarDays class="h-5 w-5" />
        </div>

        <div class="min-w-0 space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="text-sm font-semibold text-stone-900">
              Para uso en: {{ equiposSummary }}
            </h3>
            <span
              v-if="isMostRecent"
              class="rounded-full bg-[#f2dfad] px-2.5 py-1 text-[11px] font-semibold text-[#76540f]"
            >
              Mas reciente
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-stone-600">
            <span class="inline-flex items-center gap-1.5">
              <CalendarDays class="h-3.5 w-3.5" />
              Entrega: {{ formattedEntrega }}
            </span>
            <span class="rounded-full bg-[#edf3f1] px-2.5 py-1 text-[11px] font-medium text-main">
              {{ tipoSolicitudLabel }}
            </span>
            <span>Creado: {{ formattedCreatedAt }}</span>
            <span>Actualizado: {{ formattedUpdatedAt }}</span>
          </div>

          <div class="space-y-2">
            <div class="flex items-center gap-2 text-xs font-medium text-stone-700">
              <span class="rounded-full border border-main/20 bg-white px-2 py-0.5 text-[11px] text-main">
                {{ draft.currentStep }}
              </span>
              <span>Paso {{ draft.currentStep }} de 4</span>
            </div>

            <div class="flex items-center gap-1.5">
              <div
                v-for="step in progressSteps"
                :key="step"
                class="h-1.5 w-10 rounded-full"
                :class="step <= draft.currentStep ? 'bg-main' : 'bg-stone-200'"
              />
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-[11px] text-stone-600">
            <span class="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1">
              <Users class="h-3.5 w-3.5" />
              {{ draft.equipos.length }}
            </span>
            <span class="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1">
              <Package class="h-3.5 w-3.5" />
              {{ draft.productos.length }}
            </span>
            <span class="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1">
              <Wrench class="h-3.5 w-3.5" />
              {{ draft.servicios.length }}
            </span>
          </div>
        </div>
      </div>

      <div class="flex flex-col items-start gap-3 lg:items-end">
        <div class="inline-flex items-start gap-2 rounded-2xl bg-stone-100 px-3 py-2 text-[11px] leading-4 text-stone-500">
          <CircleAlert class="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Los archivos adjuntos no se restauran al continuar un borrador.</span>
        </div>

        <button
          type="button"
          class="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#d1b15a] bg-[#d8b24c] px-4 text-sm font-semibold text-[#17302b] transition hover:bg-[#e0bf69]"
          @click="emit('continue', draft)"
        >
          Continuar
          <ArrowRight class="h-4 w-4" />
        </button>
      </div>
    </div>
  </article>
</template>
