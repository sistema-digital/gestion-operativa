<script setup lang="ts">
import { computed, nextTick } from "vue";
import { VueDatePicker } from "@vuepic/vue-datepicker";
import Multiselect from "vue-multiselect";
import { es } from "date-fns/locale";
import { RotateCcw, Search } from "lucide-vue-next";
import { formatSeguimientoDate } from "@/seguimiento/shared/seguimientoDate";
import type {
  JornadaAdministrativaFiltros,
  JornadaEstadoCaptura,
} from "./registroJornada.types";

interface EstadoOption {
  id: JornadaEstadoCaptura | null;
  nombre: string;
}

const filtros = defineModel<JornadaAdministrativaFiltros>({ required: true });
const busqueda = defineModel<string>("busqueda", { required: true });

const emit = defineEmits<{
  rangoActualizado: [];
  limpiar: [];
}>();

const estados: EstadoOption[] = [
  { id: null, nombre: "Todos los estados" },
  { id: "finalizada", nombre: "Finalizada" },
  { id: "en_edicion", nombre: "En edición" },
  { id: "descartada", nombre: "Descartada" },
];

function fechaDesdeValor(valor: string | null): Date | null {
  if (!valor) return null;

  const fecha = new Date(`${valor}T00:00:00`);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function fechaAPayload(valor: Date | null): string | null {
  if (!valor) return null;

  const year = valor.getFullYear();
  const month = String(valor.getMonth() + 1).padStart(2, "0");
  const day = String(valor.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatearRangoFechas(fechas: Date[]): string {
  return fechas.map((fecha) => formatSeguimientoDate(fecha)).join(" — ");
}

const rangoFechas = computed<Date[] | null>({
  get: () => {
    const desde = fechaDesdeValor(filtros.value.desde);
    const hasta = fechaDesdeValor(filtros.value.hasta);

    if (!desde) return null;
    return hasta ? [desde, hasta] : [desde];
  },
  set: (rango) => {
    filtros.value = {
      ...filtros.value,
      desde: fechaAPayload(rango?.[0] ?? null),
      hasta: fechaAPayload(rango?.[1] ?? null),
    };
  },
});

async function solicitarCargaPorRango(rango: Date[] | null): Promise<void> {
  const fechaFinal = rango?.[1];
  if (!fechaFinal) return;

  await nextTick();
  emit("rangoActualizado");
}

const estadoSeleccionado = computed<EstadoOption>({
  get: () =>
    estados.find((estado) => estado.id === filtros.value.estado) ?? estados[0],
  set: (estado) => {
    filtros.value = { ...filtros.value, estado: estado?.id ?? null };
  },
});
</script>

<template>
  <section
    class="grid gap-2 rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm sm:grid-cols-2 lg:grid-cols-[minmax(180px,1.25fr)_minmax(225px,1fr)_170px_auto] lg:items-end"
  >
    <label class="min-w-0">
      <span
        class="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-gray-600"
        >Buscar</span
      >
      <span class="relative block">
        <Search
          class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <input
          v-model.trim="busqueda"
          class="h-9 w-full rounded-lg border border-gray-300 bg-white py-2 pl-8 pr-2.5 text-xs outline-none transition focus:border-main focus:ring-2 focus:ring-main/15"
          placeholder="Operador…"
          type="search"
        />
      </span>
    </label>

    <label class="min-w-0">
      <span
        class="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-gray-600"
        >Rango de fechas</span
      >
      <VueDatePicker
        v-model="rangoFechas"
        :enable-time-picker="false"
        :formats="{ input: formatearRangoFechas }"
        :locale="es"
        :partial-range="true"
        :config="{ closeOnAutoApply: false }"
        auto-apply
        class="jornadas-datepicker"
        input-class-name="jornadas-datepicker-input"
        placeholder="Seleccionar rango"
        range
        @update:model-value="solicitarCargaPorRango"
      />
    </label>

    <label class="min-w-0">
      <span
        class="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-gray-600"
        >Estado</span
      >
      <Multiselect
        v-model="estadoSeleccionado"
        :allow-empty="false"
        :options="estados"
        :show-labels="false"
        label="nombre"
        track-by="nombre"
        class="jornadas-multiselect"
        placeholder="Todos los estados"
      />
    </label>

    <button
      class="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
      type="button"
      @click="emit('limpiar')"
    >
      <RotateCcw class="size-3.5" aria-hidden="true" /> Limpiar
    </button>
  </section>
</template>

<style scoped>
.jornadas-datepicker :deep(.jornadas-datepicker-input) {
  height: 2.25rem;
  width: 100%;
  border-color: var(--color-gray-300);
  border-radius: 0.5rem;
  padding-inline: 0.625rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
}

.jornadas-multiselect :deep(.multiselect),
.jornadas-multiselect :deep(.multiselect__tags) {
  min-height: 2.25rem;
}

.jornadas-multiselect :deep(.multiselect__tags) {
  border-color: var(--color-gray-300);
  border-radius: 0.5rem;
  padding: 0.375rem 2.25rem 0.25rem 0.625rem;
}

.jornadas-multiselect :deep(.multiselect__single) {
  margin-bottom: 0;
  padding-top: 0.0625rem;
  font-size: 0.75rem;
}

.jornadas-multiselect :deep(.multiselect__select) {
  height: 2.25rem;
  cursor: pointer;
}
</style>
