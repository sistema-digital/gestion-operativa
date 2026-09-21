<script setup lang="ts">
import { Copy } from "lucide-vue-next";
import { computed, shallowRef } from "vue";
import Multiselect from "vue-multiselect";
import type { ImplementoOption } from "./registroJornada.types";

interface OpcionNuevoImplemento {
  id: "__nuevo__";
  etiqueta: string;
  numero: string;
}

type OpcionImplemento = ImplementoOption | OpcionNuevoImplemento;

const model = defineModel<string | null>({ required: true });

const props = defineProps<{
  implementos: ImplementoOption[];
  implementoAnteriorId: string | null;
}>();

const emit = defineEmits<{
  crear: [numero: string];
}>();

const busqueda = shallowRef("");

function esOpcionNuevoImplemento(
  opcion: OpcionImplemento,
): opcion is OpcionNuevoImplemento {
  return "etiqueta" in opcion;
}

const opciones = computed<OpcionImplemento[]>(() => {
  const termino = busqueda.value.trim().toLocaleLowerCase("es");
  const implementosCoincidentes = props.implementos.filter((implemento) =>
    etiquetaImplemento(implemento).toLocaleLowerCase("es").includes(termino),
  );
  const numeroValido = /^\d{1,6}$/.test(termino);
  const existeImplementoConNumero = props.implementos.some(
    (implemento) => implemento.numero === termino,
  );

  if (numeroValido && !existeImplementoConNumero) {
    return [
      ...implementosCoincidentes,
      { id: "__nuevo__", etiqueta: `Agregar ${termino}`, numero: termino },
    ];
  }

  return implementosCoincidentes;
});

const seleccionado = computed<OpcionImplemento | null>({
  get: () =>
    props.implementos.find((implemento) => implemento.id === model.value) ??
    null,
  set: (opcion) => {
    if (!opcion) {
      model.value = null;
      return;
    }

    if (esOpcionNuevoImplemento(opcion)) {
      emit("crear", opcion.numero);
      return;
    }

    model.value = opcion.id;
  },
});

function etiquetaImplemento(opcion: OpcionImplemento): string {
  if (esOpcionNuevoImplemento(opcion)) return opcion.etiqueta;
  return `${opcion.numero} · ${opcion.nombre ?? "Sin descripción"}`;
}

function copiarImplementoAnterior(): void {
  if (!props.implementoAnteriorId) return;
  model.value = props.implementoAnteriorId;
}

function actualizarBusqueda(termino: string): void {
  busqueda.value = termino;
}
</script>

<template>
  <div class="relative min-w-0">
    <Multiselect
      v-model="seleccionado"
      :options="opciones"
      :internal-search="false"
      :allow-empty="true"
      :show-labels="false"
      :custom-label="etiquetaImplemento"
      :max-height="220"
      track-by="id"
      placeholder="Sin implemento"
      @search-change="actualizarBusqueda"
      class="implemento-select relative z-20 min-w-0 jornada-multiselect [&_.multiselect]:min-h-8 [&_.multiselect__content-wrapper]:z-[60] [&_.multiselect__input]:mb-0 [&_.multiselect__input]:cursor-text [&_.multiselect__input]:text-xs [&_.multiselect__option]:px-2 [&_.multiselect__option]:py-2 [&_.multiselect__option]:text-xs [&_.multiselect__select]:h-8 [&_.multiselect__select]:cursor-pointer [&_.multiselect__single]:mb-0 [&_.multiselect__single]:block [&_.multiselect__single]:min-w-0 [&_.multiselect__single]:truncate [&_.multiselect__single]:pt-2 [&_.multiselect__single]:font-mono [&_.multiselect__single]:text-xs [&_.multiselect__tags]:min-h-8 [&_.multiselect__tags]:overflow-hidden [&_.multiselect__tags]:border-gray-300 [&_.multiselect__tags]:px-2 [&_.multiselect__tags]:py-0"
      :class="implementoAnteriorId ? '[&_.multiselect__tags]:pr-12' : ''"
    />
    <button
      v-if="implementoAnteriorId"
      type="button"
      class="absolute right-7 top-1 z-30 grid size-6 cursor-pointer place-items-center rounded text-main transition-colors hover:bg-main/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-main"
      aria-label="Copiar implemento de la fila anterior"
      title="Copiar implemento de la fila anterior"
      @click.stop="copiarImplementoAnterior"
    >
      <Copy class="size-3.5" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.implemento-select :deep(.multiselect__tags) {
  min-width: 0;
  overflow: hidden;
}

.implemento-select :deep(.multiselect__single) {
  display: block;
  max-width: calc(100% - 28px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
