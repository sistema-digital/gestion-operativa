<script setup lang="ts">
import { VueDatePicker } from "@vuepic/vue-datepicker";
import Multiselect from "vue-multiselect";
import { computed, shallowRef } from "vue";
import { Plus } from "lucide-vue-next";
import { es } from "date-fns/locale";
import { formatSeguimientoDate } from "@/seguimiento/shared/seguimientoDate";
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
const emit = defineEmits<{
  crearOperador: [nombre: string, apellido: string];
}>();
const busquedaOperador = shallowRef("");
const fechaMaxima = new Date();

const fechaSeleccionada = computed<Date | null>({
  get: () => {
    if (!model.value.fecha) return null;

    const fecha = new Date(`${model.value.fecha}T00:00:00`);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  },
  set: (fecha) => {
    if (!fecha) {
      model.value = { ...model.value, fecha: null };
      return;
    }

    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, "0");
    const day = String(fecha.getDate()).padStart(2, "0");
    model.value = { ...model.value, fecha: `${year}-${month}-${day}` };
  },
});

function formatearFecha(fecha: Date): string {
  return formatSeguimientoDate(fecha);
}

const operadorSeleccionado = computed<OperadorOption | null>({
  get: () =>
    props.operadores.find(
      (operador) => operador.id === model.value.operadorId,
    ) ?? null,
  set: (operador) => {
    model.value = { ...model.value, operadorId: operador?.id ?? null };
  },
});

const datosNuevoOperador = computed(() => {
  const palabras = busquedaOperador.value.trim().split(/\s+/).filter(Boolean);
  if (
    palabras.length === 0 ||
    palabras.length > 3 ||
    !palabras.every((palabra) => /^\p{L}+$/u.test(palabra))
  ) {
    return null;
  }
  return { nombre: palabras[0] ?? "", apellido: palabras.slice(1).join(" ") };
});

function abrirCrearOperador(): void {
  const datos = datosNuevoOperador.value;
  emit("crearOperador", datos?.nombre ?? "", datos?.apellido ?? "");
}

const equipoSeleccionado = computed<EquipoOption | null>({
  get: () =>
    props.equipos.find(
      (equipo) => equipo.numero === model.value.equipoNumero,
    ) ?? null,
  set: (equipo) => {
    model.value = { ...model.value, equipoNumero: equipo?.numero ?? null };
  },
});
</script>

<template>
  <section
    class="grid gap-3 rounded-2xl border border-[#d8d2c8] bg-white px-3 py-3 shadow-sm sm:grid-cols-2 sm:px-3.5 xl:grid-cols-[223px_minmax(324px,1.305fr)_minmax(280px,1fr)]"
    aria-labelledby="datos-generales-title"
  >
    <h2 id="datos-generales-title" class="sr-only">Datos generales</h2>

    <div class="min-w-0">
      <span
        class="mb-1 ml-0.5 block text-[10px] font-bold uppercase tracking-[0.07em] text-gray-600"
        >Fecha</span
      >
      <VueDatePicker
        v-model="fechaSeleccionada"
        :enable-time-picker="false"
        :locale="es"
        :max-date="fechaMaxima"
        auto-apply
        :formats="{ input: formatearFecha }"
        placeholder="Seleccionar fecha…"
        input-class-name="jornada-date-input"
        class="jornada-datepicker [&_.jornada-date-input]:h-11 [&_.jornada-date-input]:w-full [&_.jornada-date-input]:cursor-pointer [&_.jornada-date-input]:rounded-lg [&_.jornada-date-input]:border-[#bdb5aa] [&_.jornada-date-input]:px-3 [&_.jornada-date-input]:font-mono [&_.jornada-date-input]:text-xs"
      />
    </div>

    <div class="min-w-0">
      <span
        class="mb-1 ml-0.5 block text-[10px] font-bold uppercase tracking-[0.07em] text-gray-600"
        >Operador</span
      >
      <Multiselect
        v-model="operadorSeleccionado"
        :options="operadores"
        :allow-empty="true"
        :close-on-select="true"
        :show-no-results="false"
        :show-labels="false"
        label="nombre"
        track-by="id"
        placeholder="Seleccionar operador…"
        @search-change="busquedaOperador = $event"
        class="jornada-multiselect [&_.multiselect]:min-h-11 [&_.multiselect__input]:mb-0 [&_.multiselect__input]:cursor-text [&_.multiselect__input]:text-xs [&_.multiselect__select]:h-11 [&_.multiselect__select]:cursor-pointer [&_.multiselect__single]:mb-0 [&_.multiselect__single]:pt-3 [&_.multiselect__single]:text-xs [&_.multiselect__tags]:min-h-11 [&_.multiselect__tags]:rounded-lg [&_.multiselect__tags]:border-[#bdb5aa] [&_.multiselect__tags]:px-3 [&_.multiselect__tags]:py-1"
        ><template #beforeList
          ><button
            v-if="!busquedaOperador"
            type="button"
            class="flex w-full cursor-pointer items-center gap-2 border-b border-gray-100 px-3 py-2 text-left text-xs font-semibold text-main hover:bg-gray-50"
            @mousedown="abrirCrearOperador"
          >
            <Plus class="size-3.5" />Agregar nuevo
          </button></template
        ><template #afterList
          ><button
            v-if="datosNuevoOperador"
            type="button"
            class="flex w-full cursor-pointer items-center gap-2 border-t border-gray-100 px-3 py-2 text-left text-xs font-semibold text-main hover:bg-gray-50"
            @mousedown="abrirCrearOperador"
          >
            <Plus class="size-3.5" />Agregar {{ busquedaOperador.trim() }}
          </button></template
        ></Multiselect
      >
    </div>

    <div class="min-w-0">
      <span
        class="mb-1 ml-0.5 block text-[10px] font-bold uppercase tracking-[0.07em] text-gray-600"
        >Equipo</span
      >
      <Multiselect
        v-model="equipoSeleccionado"
        :options="equipos"
        :allow-empty="true"
        :close-on-select="true"
        :show-labels="false"
        label="etiqueta"
        track-by="numero"
        placeholder="Seleccionar equipo…"
        class="jornada-multiselect [&_.multiselect]:min-h-11 [&_.multiselect__input]:mb-0 [&_.multiselect__input]:cursor-text [&_.multiselect__input]:font-mono [&_.multiselect__input]:text-xs [&_.multiselect__select]:h-11 [&_.multiselect__select]:cursor-pointer [&_.multiselect__single]:mb-0 [&_.multiselect__single]:pt-3 [&_.multiselect__single]:font-mono [&_.multiselect__single]:text-xs [&_.multiselect__tags]:min-h-11 [&_.multiselect__tags]:rounded-lg [&_.multiselect__tags]:border-[#bdb5aa] [&_.multiselect__tags]:px-3 [&_.multiselect__tags]:py-1"
      />
    </div>
  </section>
</template>
