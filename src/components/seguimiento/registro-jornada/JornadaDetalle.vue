<script setup lang="ts">
import { Plus } from "lucide-vue-next";
import JornadaFila from "./JornadaFila.vue";
import type {
  CatalogosJornada,
  JornadaFilaModel,
} from "./registroJornada.types";

const filas = defineModel<JornadaFilaModel[]>("filas", { required: true });

defineProps<{
  catalogos: CatalogosJornada;
}>();

const emit = defineEmits<{
  crearImplemento: [index: number];
}>();

function agregarFila(): void {
  const ultimaFila = filas.value.at(-1);
  filas.value.push({
    idLocal: crypto.randomUUID(),
    inicio: ultimaFila?.fin || "06:00",
    fin: "",
    codigo: null,
    tipoActividad: null,
    actividadId: null,
    actividadNombre: "",
    implementoId: ultimaFila?.implementoId ?? null,
  });
}

function eliminarFila(index: number): void {
  filas.value.splice(index, 1);
}
</script>

<template>
  <section
    class="mt-5 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
    aria-labelledby="detalle-jornada-title"
  >
    <header
      class="flex min-h-12 items-center justify-between border-b border-gray-200 px-3 py-2"
    >
      <div>
        <h2 id="detalle-jornada-title" class="text-xs font-bold text-main-dark">
          Detalle de la jornada
        </h2>
        <p class="text-[10px] text-gray-500">
          Las horas deben quedar continuas y sin solapamientos.
        </p>
      </div>
    </header>

    <div class="overflow-x-auto md:p-0">
      <div
        class="hidden min-w-[900px] grid-cols-[38px_90px_90px_82px_1fr_145px_82px_48px] border-b border-gray-200 bg-gray-50 md:grid"
      >
        <span class="px-2 py-2 text-[9px] font-bold uppercase text-gray-600"
          >#</span
        ><span class="px-2 py-2 text-[9px] font-bold uppercase text-gray-600"
          >Hora inicio</span
        ><span class="px-2 py-2 text-[9px] font-bold uppercase text-gray-600"
          >Hora fin</span
        ><span class="px-2 py-2 text-[9px] font-bold uppercase text-gray-600"
          >Código</span
        ><span class="px-2 py-2 text-[9px] font-bold uppercase text-gray-600"
          >Labor / causa</span
        ><span class="px-2 py-2 text-[9px] font-bold uppercase text-gray-600"
          >Implemento</span
        ><span class="px-2 py-2 text-[9px] font-bold uppercase text-gray-600"
          >Duración</span
        ><span />
      </div>

      <div class="grid gap-2 p-2 md:block md:min-w-[900px] md:p-0">
        <JornadaFila
          v-for="(fila, index) in filas"
          :key="fila.idLocal"
          v-model="filas[index]"
          :numero="index + 1"
          :catalogos="catalogos"
          @eliminar="eliminarFila(index)"
          @crear-implemento="emit('crearImplemento', index)"
        />
      </div>
    </div>

    <div
      class="flex justify-center border-t border-dashed border-gray-200 bg-gray-50 p-2"
    >
      <button
        type="button"
        class="flex h-8 cursor-pointer items-center gap-1 rounded-md border border-gray-200 bg-white px-3 text-xs font-semibold shadow-sm hover:bg-gray-50"
        @click="agregarFila"
      >
        <Plus class="size-3.5" aria-hidden="true" /> Agregar registro
      </button>
    </div>
  </section>
</template>
