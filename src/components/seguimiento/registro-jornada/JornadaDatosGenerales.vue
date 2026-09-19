<script setup lang="ts">
import { VueDatePicker } from "@vuepic/vue-datepicker";
import Multiselect from "vue-multiselect";
import { computed } from "vue";
import { es } from "date-fns/locale";
import type {
  EquipoOption,
  JornadaDatosGeneralesModel,
  OperadorOption,
} from "./registroJornada.types";

const model = defineModel<JornadaDatosGeneralesModel>({ required: true });

const props = defineProps<{
  operadores: OperadorOption[];
  equipos: EquipoOption[];
}>();

const fechaSeleccionada = computed<Date | null>({
  get: () => {
    if (!model.value.fecha) return null;

    const fecha = new Date(`${model.value.fecha}T00:00:00`);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  },
  set: (fecha) => {
    if (!fecha) {
      model.value.fecha = null;
      return;
    }

    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, "0");
    const day = String(fecha.getDate()).padStart(2, "0");
    model.value.fecha = `${year}-${month}-${day}`;
  },
});

const operadorSeleccionado = computed<OperadorOption | null>({
  get: () =>
    props.operadores.find(
      (operador) => operador.id === model.value.operadorId,
    ) ?? null,
  set: (operador) => {
    model.value.operadorId = operador?.id ?? null;
  },
});

const equipoSeleccionado = computed<EquipoOption | null>({
  get: () =>
    props.equipos.find(
      (equipo) => equipo.numero === model.value.equipoNumero,
    ) ?? null,
  set: (equipo) => {
    model.value.equipoNumero = equipo?.numero ?? null;
  },
});
</script>

<template>
  <section
    class="mt-5 grid gap-3 rounded-lg border border-gray-200 bg-second/40 p-3 sm:grid-cols-2 xl:grid-cols-[150px_minmax(220px,1.25fr)_minmax(160px,.85fr)_minmax(130px,.65fr)]"
    aria-labelledby="datos-generales-title"
  >
    <h2 id="datos-generales-title" class="sr-only">Datos generales</h2>

    <label class="min-w-0">
      <span
        class="mb-1 ml-0.5 block text-[10px] font-bold uppercase tracking-[0.07em] text-gray-600"
        >Fecha</span
      >
      <VueDatePicker
        v-model="fechaSeleccionada"
        :enable-time-picker="false"
        :locale="es"
        auto-apply
        format="yyyy-MM-dd"
        model-type="date"
        placeholder="Seleccionar fecha…"
        input-class-name="jornada-date-input"
        class="jornada-datepicker [&_.jornada-date-input]:h-9 [&_.jornada-date-input]:w-full [&_.jornada-date-input]:cursor-pointer [&_.jornada-date-input]:rounded-md [&_.jornada-date-input]:border-gray-300 [&_.jornada-date-input]:px-2 [&_.jornada-date-input]:font-mono [&_.jornada-date-input]:text-xs"
      />
    </label>

    <label class="min-w-0">
      <span
        class="mb-1 ml-0.5 block text-[10px] font-bold uppercase tracking-[0.07em] text-gray-600"
        >Operador</span
      >
      <Multiselect
        v-model="operadorSeleccionado"
        :options="operadores"
        :allow-empty="true"
        :show-labels="false"
        label="nombre"
        track-by="id"
        placeholder="Seleccionar operador…"
        class="jornada-multiselect [&_.multiselect]:min-h-9 [&_.multiselect__input]:mb-0 [&_.multiselect__input]:cursor-text [&_.multiselect__input]:text-xs [&_.multiselect__select]:h-9 [&_.multiselect__select]:cursor-pointer [&_.multiselect__single]:mb-0 [&_.multiselect__single]:pt-2 [&_.multiselect__single]:text-xs [&_.multiselect__tags]:min-h-9 [&_.multiselect__tags]:border-gray-300 [&_.multiselect__tags]:px-2 [&_.multiselect__tags]:py-1"
      />
    </label>

    <label class="min-w-0">
      <span
        class="mb-1 ml-0.5 block text-[10px] font-bold uppercase tracking-[0.07em] text-gray-600"
        >Equipo</span
      >
      <Multiselect
        v-model="equipoSeleccionado"
        :options="equipos"
        :allow-empty="true"
        :show-labels="false"
        label="etiqueta"
        track-by="numero"
        placeholder="Seleccionar equipo…"
        class="jornada-multiselect [&_.multiselect]:min-h-9 [&_.multiselect__input]:mb-0 [&_.multiselect__input]:cursor-text [&_.multiselect__input]:font-mono [&_.multiselect__input]:text-xs [&_.multiselect__select]:h-9 [&_.multiselect__select]:cursor-pointer [&_.multiselect__single]:mb-0 [&_.multiselect__single]:pt-2 [&_.multiselect__single]:font-mono [&_.multiselect__single]:text-xs [&_.multiselect__tags]:min-h-9 [&_.multiselect__tags]:border-gray-300 [&_.multiselect__tags]:px-2 [&_.multiselect__tags]:py-1"
      />
    </label>

    <label class="min-w-0">
      <span
        class="mb-1 ml-0.5 block text-[10px] font-bold uppercase tracking-[0.07em] text-gray-600"
        >Área</span
      >
      <input
        :value="model.area ?? ''"
        readonly
        class="h-9 w-full rounded-md border border-gray-300 bg-gray-50 px-2 text-xs text-gray-700"
      />
    </label>
  </section>
</template>
