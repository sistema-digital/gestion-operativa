<script setup lang="ts">
import { computed, nextTick, useTemplateRef, watch } from "vue";
import { Trash2 } from "lucide-vue-next";
import { VueDatePicker } from "@vuepic/vue-datepicker";
import Multiselect from "vue-multiselect";
import ImplementoSelect from "./ImplementoSelect.vue";
import { resolverCodigo } from "./composables/useJornadaAdmin";
import type {
  CatalogosJornada,
  JornadaFilaModel,
} from "./registroJornada.types";

const model = defineModel<JornadaFilaModel>({ required: true });
const horaInicioContenedor = useTemplateRef<HTMLLabelElement>(
  "horaInicioContenedor",
);
const horaFinContenedor = useTemplateRef<HTMLDivElement>("horaFinContenedor");
const actividadContenedor = useTemplateRef<HTMLDivElement>(
  "actividadContenedor",
);
const implementoContenedor = useTemplateRef<HTMLDivElement>(
  "implementoContenedor",
);

interface HoraPickerValue {
  hours: number;
  minutes: number;
}

const props = defineProps<{
  numero: number;
  catalogos: CatalogosJornada;
  implementoAnteriorId: string | null;
  finAnterior: string | null;
  inicioSiguiente: string | null;
  mostrarErrores: boolean;
}>();

const emit = defineEmits<{
  eliminar: [];
  crearImplemento: [numero: string];
}>();

const opcionesActividad = computed(() => [
  ...props.catalogos.labores
    .filter((labor) => labor.activo && labor.orden !== null)
    .map((labor) => ({
      id: labor.id,
      codigo: labor.orden,
      etiqueta: `${labor.orden} L — ${labor.nombre}`,
      nombre: labor.nombre,
      tipoActividad: "labor" as const,
    })),
  ...props.catalogos.tiposParada
    .filter((parada) => parada.activo && parada.orden !== null)
    .map((parada) => ({
      id: parada.id,
      codigo: parada.orden,
      etiqueta: `${parada.orden} P — ${parada.nombre}`,
      nombre: parada.nombre,
      tipoActividad: "parada" as const,
    })),
]);

const actividadSeleccionada = computed<
  (typeof opcionesActividad.value)[number] | null
>({
  get: () =>
    opcionesActividad.value.find(
      (opcion) =>
        opcion.tipoActividad === model.value.tipoActividad &&
        opcion.id === model.value.actividadId,
    ) ?? null,
  set: (actividad) => {
    if (!actividad) {
      model.value.codigo = null;
      model.value.tipoActividad = null;
      model.value.actividadId = null;
      model.value.actividadNombre = "";
      return;
    }

    model.value.codigo = actividad.codigo;
    model.value.tipoActividad = actividad.tipoActividad;
    model.value.actividadId = actividad.id;
    model.value.actividadNombre = actividad.nombre;
  },
});

const horaInicio = computed<HoraPickerValue | null>({
  get: () => {
    if (!model.value.inicio) return null;
    const [hours, minutes] = model.value.inicio.split(":").map(Number);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
    return { hours, minutes };
  },
  set: (hora) => {
    if (!hora) {
      model.value.inicio = "";
      return;
    }
    model.value.inicio = `${String(hora.hours).padStart(2, "0")}:${String(
      hora.minutes,
    ).padStart(2, "0")}`;
  },
});

const horaFin = computed<HoraPickerValue | null>({
  get: () => {
    if (!model.value.fin) return null;
    const [hours, minutes] = model.value.fin.split(":").map(Number);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
    return { hours, minutes };
  },
  set: (hora) => {
    if (!hora) {
      model.value.fin = "";
      return;
    }
    model.value.fin = `${String(hora.hours).padStart(2, "0")}:${String(
      hora.minutes,
    ).padStart(2, "0")}`;
  },
});

function mantenerHoraSinConfirmar(): Date | null {
  return null;
}

function parsearHoraAlConfirmar(valor: string): string | null {
  const digitos = valor.replace(/\D/g, "");
  if (digitos.length < 1 || digitos.length > 4) return null;

  const horas = Number(digitos.length <= 2 ? digitos : digitos.slice(0, -2));
  const minutos = Number(digitos.length <= 2 ? 0 : digitos.slice(-2));
  if (horas > 23 || minutos > 59) return null;

  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
}

function moverAFin(evento: KeyboardEvent): void {
  evento.preventDefault();
  const valor =
    evento.target instanceof HTMLInputElement ? evento.target.value : "";
  const hora = parsearHoraAlConfirmar(valor);
  if (!hora) return;
  model.value.inicio = hora;

  void nextTick(enfocarFin);
}

function confirmarHoraInicio(evento: KeyboardEvent): void {
  const valor =
    evento.target instanceof HTMLInputElement ? evento.target.value : "";
  const hora = parsearHoraAlConfirmar(valor);
  if (!hora) {
    evento.preventDefault();
    return;
  }
  model.value.inicio = hora;
}

function confirmarHoraFin(evento: KeyboardEvent): void {
  const valor =
    evento.target instanceof HTMLInputElement ? evento.target.value : "";
  const hora = parsearHoraAlConfirmar(valor);
  if (!hora) {
    evento.preventDefault();
    return;
  }
  model.value.fin = hora;
  evento.preventDefault();
  void nextTick(enfocarActividad);
}

function enfocarEntrada(contenedor: HTMLElement | null): void {
  contenedor?.querySelector<HTMLInputElement>("input")?.focus();
}

function enfocarInicio(): void {
  enfocarEntrada(horaInicioContenedor.value);
}

function enfocarFin(): void {
  enfocarEntrada(horaFinContenedor.value);
}

function enfocarActividad(): void {
  enfocarEntrada(actividadContenedor.value);
}

function enfocarImplemento(): void {
  enfocarEntrada(implementoContenedor.value);
}

function moverAImplemento(evento: KeyboardEvent): void {
  evento.preventDefault();
  void nextTick(enfocarImplemento);
}

function aplicarCodigoResuelto(): void {
  const resultado = resolverCodigo(model.value.codigo, props.catalogos);
  model.value.tipoActividad = resultado.tipoActividad;
  model.value.actividadId = resultado.actividadId;
  model.value.actividadNombre = resultado.actividadNombre;
}

watch(() => model.value.codigo, aplicarCodigoResuelto, { immediate: true });
watch(
  () => model.value.inicio,
  (inicio) => {
    if (model.value.fin && inicio && model.value.fin < inicio) {
      model.value.fin = "";
    }
  },
);
watch(
  () => props.finAnterior,
  (finAnterior) => {
    model.value.inicio = finAnterior ?? "";
  },
);

const finEsInvalido = computed(() =>
  Boolean(
    model.value.inicio &&
    model.value.fin &&
    model.value.fin <= model.value.inicio,
  ),
);

const filaTieneError = computed(
  () =>
    !model.value.inicio ||
    !model.value.fin ||
    model.value.codigo === null ||
    model.value.actividadId === null ||
    finEsInvalido.value ||
    (props.finAnterior !== null && props.finAnterior !== model.value.inicio) ||
    (props.inicioSiguiente !== null &&
      model.value.fin !== props.inicioSiguiente),
);

const mostrarErrorDeFila = computed(
  () => props.mostrarErrores && filaTieneError.value,
);

const duracion = computed(() => {
  if (!model.value.inicio || !model.value.fin) return "--:--";

  const [horaInicio, minutoInicio] = model.value.inicio.split(":").map(Number);
  const [horaFin, minutoFin] = model.value.fin.split(":").map(Number);
  const minutos = horaFin * 60 + minutoFin - (horaInicio * 60 + minutoInicio);

  if (!Number.isFinite(minutos) || minutos < 0) return "--:--";
  return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(
    minutos % 60,
  ).padStart(2, "0")}`;
});

function tieneInicio(): boolean {
  return Boolean(model.value.inicio);
}

defineExpose({ enfocarInicio, enfocarFin, tieneInicio });
</script>

<template>
  <div
    class="grid grid-cols-[28px_1fr_1fr] gap-1.5 rounded-lg p-2 shadow-sm md:min-h-[58px] md:grid-cols-[46px_140px_140px_minmax(280px,1fr)_280px_100px_48px] md:items-center md:gap-x-2 md:rounded-none md:p-0 md:shadow-none"
    :class="
      mostrarErrorDeFila
        ? 'border border-danger/50 bg-danger/10'
        : 'border border-gray-200 bg-white md:border-x-0 md:border-t-0'
    "
  >
    <div
      class="row-span-4 flex items-center justify-center md:row-span-1 md:h-[58px]"
    >
      <span
        class="grid size-6 place-items-center rounded-full bg-gray-100 font-mono text-[10px] text-gray-600"
        >{{ numero }}</span
      >
    </div>

    <label ref="horaInicioContenedor">
      <span
        class="mb-0.5 block text-[8px] font-bold uppercase text-gray-500 md:hidden"
        >Hora inicio</span
      >
      <VueDatePicker
        v-model="horaInicio"
        :enable-seconds="false"
        :is-24="true"
        :text-input="{
          format: mantenerHoraSinConfirmar,
          openMenu: false,
          enterSubmit: true,
          tabSubmit: true,
          selectOnFocus: true,
        }"
        auto-apply
        class="jornada-hora"
        input-class-name="jornada-hora-input"
        @keydown.enter="confirmarHoraInicio"
        @keydown.tab="moverAFin"
        placeholder="HH:mm"
        time-picker
      />
    </label>

    <label>
      <span
        class="mb-0.5 block text-[8px] font-bold uppercase text-gray-500 md:hidden"
        >Hora fin</span
      >
      <div ref="horaFinContenedor">
        <VueDatePicker
          v-model="horaFin"
          :enable-seconds="false"
          :is-24="true"
          :text-input="{
            format: mantenerHoraSinConfirmar,
            openMenu: false,
            enterSubmit: true,
            tabSubmit: true,
            selectOnFocus: true,
          }"
          :aria-describedby="
            finEsInvalido ? `fila-${numero}-hora-fin-error` : undefined
          "
          :aria-invalid="finEsInvalido"
          auto-apply
          class="jornada-hora"
          :class="finEsInvalido ? 'jornada-hora--invalida' : ''"
          input-class-name="jornada-hora-input"
          @keydown.enter="confirmarHoraFin"
          @keydown.tab="confirmarHoraFin"
          placeholder="HH:mm"
          time-picker
        />
      </div>
      <span
        v-if="finEsInvalido"
        :id="`fila-${numero}-hora-fin-error`"
        class="mt-1 block text-[10px] font-semibold text-danger"
        role="alert"
      >
        La hora fin debe ser posterior al inicio.
      </span>
    </label>

    <div
      ref="actividadContenedor"
      class="col-span-2 min-w-0 md:col-span-1"
      @keydown.tab="moverAImplemento"
    >
      <span
        class="mb-0.5 block text-[8px] font-bold uppercase text-gray-500 md:hidden"
        >Labor / causa</span
      >
      <Multiselect
        v-model="actividadSeleccionada"
        :options="opcionesActividad"
        label="etiqueta"
        track-by="id"
        :allow-empty="true"
        :show-labels="false"
        placeholder="Buscar código o descripción…"
        :class="
          model.tipoActividad === 'parada'
            ? 'actividad-select actividad-select--parada'
            : 'actividad-select actividad-select--labor'
        "
        class="jornada-multiselect [&_.multiselect]:min-h-10 [&_.multiselect__input]:mb-0 [&_.multiselect__input]:cursor-text [&_.multiselect__input]:text-xs [&_.multiselect__option]:px-2 [&_.multiselect__option]:py-2 [&_.multiselect__option]:text-xs [&_.multiselect__select]:h-10 [&_.multiselect__select]:cursor-pointer [&_.multiselect__single]:mb-0 [&_.multiselect__single]:pt-2.5 [&_.multiselect__single]:text-xs [&_.multiselect__tags]:min-h-10 [&_.multiselect__tags]:border-gray-200 [&_.multiselect__tags]:px-2 [&_.multiselect__tags]:py-0 md:[&_.multiselect]:min-h-[58px] md:[&_.multiselect__input]:text-xs md:[&_.multiselect__select]:h-[58px] md:[&_.multiselect__single]:pt-5 md:[&_.multiselect__tags]:min-h-[58px] md:[&_.multiselect__tags]:border-0"
      />
    </div>

    <div ref="implementoContenedor" class="col-span-2 min-w-0 md:col-span-1">
      <span
        class="mb-0.5 block text-[8px] font-bold uppercase text-gray-500 md:hidden"
        >Implemento</span
      >
      <ImplementoSelect
        v-model="model.implementoId"
        :implementos="catalogos.implementos"
        :implemento-anterior-id="implementoAnteriorId"
        @crear="emit('crearImplemento', $event)"
      />
    </div>

    <div class="md:px-2">
      <span
        class="mb-0.5 block text-[8px] font-bold uppercase text-gray-500 md:hidden"
        >Duración</span
      >
      <div
        class="flex h-10 items-center rounded-md border border-gray-200 bg-gray-50 px-2 font-mono text-xs md:justify-center md:border-0 md:bg-transparent"
      >
        {{ duracion }}
      </div>
    </div>

    <div class="flex justify-end md:justify-center">
      <button
        type="button"
        class="grid size-8 cursor-pointer place-items-center rounded-md text-danger hover:bg-danger-bg"
        aria-label="Eliminar fila"
        @click="emit('eliminar')"
      >
        <Trash2 class="size-4" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.actividad-select :deep(.multiselect__tags) {
  min-width: 0;
  overflow: hidden;
}

.jornada-hora :deep(.jornada-hora-input) {
  height: 2.5rem;
  width: 100%;
  border: 1px solid var(--color-gray-200);
  border-radius: 0.375rem;
  background: var(--color-gray-50);
  padding-inline: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
}

@media (min-width: 768px) {
  .jornada-hora :deep(.jornada-hora-input) {
    border-color: transparent;
    background: transparent;
  }
}

.jornada-hora--invalida :deep(.jornada-hora-input) {
  border-color: var(--color-danger);
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.actividad-select :deep(.multiselect__single) {
  display: block;
  max-width: calc(100% - 28px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actividad-select--labor :deep(.multiselect__single) {
  color: var(--color-main);
}

.actividad-select--parada :deep(.multiselect__single) {
  color: var(--color-danger);
}
</style>
