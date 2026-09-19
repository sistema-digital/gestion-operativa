<script setup lang="ts">
import { computed, watch } from "vue";
import { Trash2 } from "lucide-vue-next";
import ImplementoSelect from "./ImplementoSelect.vue";
import type {
  CatalogosJornada,
  JornadaFilaModel,
} from "./registroJornada.types";

const model = defineModel<JornadaFilaModel>({ required: true });

const props = defineProps<{
  numero: number;
  catalogos: CatalogosJornada;
}>();

const emit = defineEmits<{
  eliminar: [];
  crearImplemento: [];
}>();

function actualizarCodigo(evento: Event): void {
  const valor = (evento.target as HTMLInputElement).value.trim();
  model.value.codigo = valor === "" ? null : Number(valor);
}

function resolverCodigo(): void {
  const codigo = model.value.codigo;
  if (codigo === null) {
    model.value.tipoActividad = null;
    model.value.actividadId = null;
    model.value.actividadNombre = "";
    return;
  }

  const labor = props.catalogos.labores.find(
    (item) => item.orden === codigo && item.activo,
  );
  if (labor) {
    model.value.tipoActividad = "labor";
    model.value.actividadId = labor.id;
    model.value.actividadNombre = labor.nombre;
    return;
  }

  const parada = props.catalogos.tiposParada.find(
    (item) => item.orden === codigo && item.activo,
  );
  if (parada) {
    model.value.tipoActividad = "parada";
    model.value.actividadId = parada.id;
    model.value.actividadNombre = parada.nombre;
    return;
  }

  model.value.tipoActividad = null;
  model.value.actividadId = null;
  model.value.actividadNombre = "Código no reconocido";
}

watch(() => model.value.codigo, resolverCodigo, { immediate: true });

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
</script>

<template>
  <div
    class="grid grid-cols-[28px_1fr_1fr] gap-1.5 rounded-md border border-gray-200 bg-white p-2 shadow-sm md:grid-cols-[38px_90px_90px_82px_1fr_145px_82px_48px] md:items-center md:gap-0 md:rounded-none md:border-x-0 md:border-t-0 md:p-0 md:shadow-none"
  >
    <div
      class="row-span-4 flex items-center justify-center md:row-span-1 md:h-11"
    >
      <span
        class="grid size-6 place-items-center rounded-full bg-gray-100 font-mono text-[10px] text-gray-600"
        >{{ numero }}</span
      >
    </div>

    <label>
      <span
        class="mb-0.5 block text-[8px] font-bold uppercase text-gray-500 md:hidden"
        >Hora inicio</span
      >
      <input
        v-model="model.inicio"
        type="time"
        class="h-8 w-full rounded-md border border-gray-200 bg-gray-50 px-2 font-mono text-xs md:border-transparent md:bg-transparent"
      />
    </label>

    <label>
      <span
        class="mb-0.5 block text-[8px] font-bold uppercase text-gray-500 md:hidden"
        >Hora fin</span
      >
      <input
        v-model="model.fin"
        type="time"
        class="h-8 w-full rounded-md border border-gray-200 bg-gray-50 px-2 font-mono text-xs md:border-transparent md:bg-transparent"
      />
    </label>

    <label class="col-span-2 md:col-span-1">
      <span
        class="mb-0.5 block text-[8px] font-bold uppercase text-gray-500 md:hidden"
        >Código</span
      >
      <input
        :value="model.codigo ?? ''"
        inputmode="numeric"
        @input="actualizarCodigo"
        class="h-8 w-full rounded-md border border-gray-200 bg-gray-50 px-2 font-mono text-xs md:border-transparent md:bg-transparent"
        placeholder="000"
      />
    </label>

    <label class="col-span-2 md:col-span-1">
      <span
        class="mb-0.5 block text-[8px] font-bold uppercase text-gray-500 md:hidden"
        >Labor / causa</span
      >
      <input
        :value="model.actividadNombre"
        readonly
        class="h-8 w-full rounded-md border border-gray-200 bg-gray-50 px-2 text-xs md:border-transparent"
        :class="model.tipoActividad === 'parada' ? 'bg-warning-bg' : ''"
      />
    </label>

    <div class="col-span-2 md:col-span-1">
      <span
        class="mb-0.5 block text-[8px] font-bold uppercase text-gray-500 md:hidden"
        >Implemento</span
      >
      <ImplementoSelect
        v-model="model.implementoId"
        :implementos="catalogos.implementos"
        @crear="emit('crearImplemento')"
      />
    </div>

    <div class="md:px-2">
      <span
        class="mb-0.5 block text-[8px] font-bold uppercase text-gray-500 md:hidden"
        >Duración</span
      >
      <div
        class="flex h-8 items-center rounded-md border border-gray-200 bg-gray-50 px-2 font-mono text-xs md:justify-center md:border-0 md:bg-transparent"
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
