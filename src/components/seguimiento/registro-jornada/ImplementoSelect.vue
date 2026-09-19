<script setup lang="ts">
import { computed } from "vue";
import Multiselect from "vue-multiselect";
import type { ImplementoOption } from "./registroJornada.types";

interface OpcionNuevoImplemento {
  id: "__nuevo__";
  etiqueta: string;
}

type OpcionImplemento = ImplementoOption | OpcionNuevoImplemento;

const model = defineModel<string | null>({ required: true });

const props = defineProps<{
  implementos: ImplementoOption[];
}>();

const emit = defineEmits<{
  crear: [];
}>();

const opciones = computed<OpcionImplemento[]>(() => [
  ...props.implementos,
  { id: "__nuevo__", etiqueta: "Registrar nuevo implemento…" },
]);

const seleccionado = computed<OpcionImplemento | null>({
  get: () =>
    props.implementos.find((implemento) => implemento.id === model.value) ??
    null,
  set: (opcion) => {
    if (!opcion) {
      model.value = null;
      return;
    }

    if (opcion.id === "__nuevo__") {
      emit("crear");
      return;
    }

    model.value = opcion.id;
  },
});

function etiquetaImplemento(opcion: OpcionImplemento): string {
  if (opcion.id === "__nuevo__") return opcion.etiqueta;
  return `${opcion.numero} · ${opcion.nombre ?? "Sin descripción"}`;
}
</script>

<template>
  <Multiselect
    v-model="seleccionado"
    :options="opciones"
    :allow-empty="true"
    :show-labels="false"
    :custom-label="etiquetaImplemento"
    track-by="id"
    placeholder="Sin implemento"
    class="jornada-multiselect [&_.multiselect]:min-h-8 [&_.multiselect__input]:mb-0 [&_.multiselect__input]:cursor-text [&_.multiselect__input]:text-xs [&_.multiselect__select]:h-8 [&_.multiselect__select]:cursor-pointer [&_.multiselect__single]:mb-0 [&_.multiselect__single]:pt-2 [&_.multiselect__single]:font-mono [&_.multiselect__single]:text-xs [&_.multiselect__tags]:min-h-8 [&_.multiselect__tags]:border-gray-300 [&_.multiselect__tags]:px-2 [&_.multiselect__tags]:py-0"
  />
</template>
