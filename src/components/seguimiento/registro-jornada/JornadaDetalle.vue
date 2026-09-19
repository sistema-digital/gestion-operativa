<script setup lang="ts">
import { CircleHelp, ListRestart, Plus, Rows3 } from "lucide-vue-next";
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
  limpiar: [];
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
    class="mt-3 overflow-hidden rounded-2xl border border-[#d8d2c8] bg-white shadow-sm"
    aria-labelledby="detalle-jornada-title"
  >
    <header
      class="flex min-h-[62px] flex-wrap items-center justify-between gap-3 border-b border-[#ddd8d0] px-3.5 py-2.5"
    >
      <div class="flex items-center gap-3">
        <div
          class="grid size-10 place-items-center rounded-xl bg-[#f2f0eb] text-main"
        >
          <Rows3 class="size-5" aria-hidden="true" />
        </div>
        <div>
          <h2
            id="detalle-jornada-title"
            class="text-sm font-bold text-main-dark"
          >
            Detalle de la jornada
          </h2>
          <p class="text-[11px] text-gray-500">
            Las horas deben quedar continuas y sin solapamientos.
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <p
          class="hidden items-center gap-1.5 rounded-full bg-[#e7f4ff] px-3 py-1.5 text-[11px] font-semibold text-[#1870ad] lg:flex"
        >
          <CircleHelp class="size-4" aria-hidden="true" />
          El código completa automáticamente la labor o causa
        </p>
        <button
          type="button"
          class="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#d8d2c8] bg-white px-3 text-xs font-semibold text-main-dark shadow-sm transition-colors hover:bg-[#faf9f6]"
          @click="emit('limpiar')"
        >
          <ListRestart class="size-4" aria-hidden="true" /> Limpiar
        </button>
      </div>
    </header>

    <div class="overflow-x-auto md:p-0">
      <div
        class="hidden min-w-[1100px] grid-cols-[46px_112px_112px_100px_minmax(280px,1fr)_180px_100px_48px] border-b border-[#ddd8d0] bg-[#faf9f7] md:grid"
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

      <div class="grid gap-2 p-2 md:block md:min-w-[1100px] md:p-0">
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
      class="flex justify-center border-t border-dashed border-[#ddd8d0] bg-[#faf9f7] p-2.5"
    >
      <button
        type="button"
        class="flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-[#d8d2c8] bg-white px-4 text-xs font-semibold shadow-sm hover:bg-[#faf9f6]"
        @click="agregarFila"
      >
        <Plus class="size-3.5" aria-hidden="true" /> Agregar registro
      </button>
    </div>

    <slot name="footer" />
  </section>
</template>
