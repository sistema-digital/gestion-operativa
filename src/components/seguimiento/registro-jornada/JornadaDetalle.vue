<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { CircleHelp, ListRestart, Plus, Rows3 } from "lucide-vue-next";
import JornadaFila from "./JornadaFila.vue";
import type {
  CatalogosJornada,
  JornadaFilaModel,
} from "./registroJornada.types";

const filas = defineModel<JornadaFilaModel[]>("filas", { required: true });

const props = defineProps<{
  catalogos: CatalogosJornada;
  mostrarErrores: boolean;
}>();

const emit = defineEmits<{
  crearImplemento: [index: number, numero: string];
  limpiar: [];
}>();

const filasAValidar = shallowRef<Set<string>>(new Set());

const puedeAgregarFila = computed(() => {
  const ultimaFila = filas.value.at(-1);
  if (!ultimaFila) return true;

  return Boolean(
    ultimaFila.inicio &&
    ultimaFila.fin &&
    ultimaFila.fin > ultimaFila.inicio &&
    ultimaFila.tipoActividad &&
    ultimaFila.actividadId,
  );
});

function agregarFila(): void {
  filasAValidar.value = new Set([
    ...filasAValidar.value,
    ...filas.value.map((fila) => fila.idLocal),
  ]);
  const ultimaFila = filas.value.at(-1);
  filas.value.push({
    idLocal: crypto.randomUUID(),
    inicio: ultimaFila?.fin || "06:00",
    fin: "",
    codigo: null,
    tipoActividad: null,
    actividadId: null,
    actividadNombre: "",
    implementoId: null,
  });
}

function eliminarFila(index: number): void {
  filas.value.splice(index, 1);
}
</script>

<template>
  <section
    class="mt-3 overflow-visible rounded-2xl border border-[#d8d2c8] bg-white shadow-sm"
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
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#d8d2c8] bg-white px-3 text-xs font-semibold text-main-dark shadow-sm transition-colors hover:bg-[#faf9f6]"
          @click="emit('limpiar')"
        >
          <ListRestart class="size-4" aria-hidden="true" /> Limpiar
        </button>
      </div>
    </header>

    <div class="overflow-x-auto md:overflow-visible md:p-0">
      <div
        class="hidden min-w-[1156px] grid-cols-[46px_140px_140px_minmax(280px,1fr)_280px_100px_48px] border-b border-[#ddd8d0] bg-[#faf9f7] md:grid md:gap-x-2"
      >
        <span class="px-2 py-2 text-[9px] font-bold uppercase text-gray-600"
          >#</span
        ><span class="px-2 py-2 text-[9px] font-bold uppercase text-gray-600"
          >Hora inicio</span
        ><span class="px-2 py-2 text-[9px] font-bold uppercase text-gray-600"
          >Hora fin</span
        ><span class="px-2 py-2 text-[9px] font-bold uppercase text-gray-600"
          >Labor / causa</span
        ><span class="px-2 py-2 text-[9px] font-bold uppercase text-gray-600"
          >Implemento</span
        ><span class="px-2 py-2 text-[9px] font-bold uppercase text-gray-600"
          >Duración</span
        ><span />
      </div>

      <div class="grid gap-2 p-2 md:block md:min-w-[1156px] md:p-0">
        <JornadaFila
          v-for="(fila, index) in filas"
          :key="fila.idLocal"
          v-model="filas[index]"
          :numero="index + 1"
          :catalogos="catalogos"
          :fin-anterior="index > 0 ? filas[index - 1]?.fin || null : null"
          :inicio-siguiente="
            index < filas.length - 1 ? filas[index + 1]?.inicio || null : null
          "
          :implemento-anterior-id="
            index > 0 ? (filas[index - 1]?.implementoId ?? null) : null
          "
          :mostrar-errores="
            props.mostrarErrores || filasAValidar.has(fila.idLocal)
          "
          @eliminar="eliminarFila(index)"
          @crear-implemento="emit('crearImplemento', index, $event)"
        />
      </div>
    </div>

    <div
      class="flex justify-center border-t border-dashed border-[#ddd8d0] bg-[#faf9f7] p-2.5"
    >
      <button
        type="button"
        :disabled="!puedeAgregarFila"
        :title="
          puedeAgregarFila
            ? undefined
            : 'Completa Inicio, Fin y una labor o parada antes de agregar otra fila.'
        "
        class="flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-[#d8d2c8] bg-white px-4 text-xs font-semibold shadow-sm hover:bg-[#faf9f6] disabled:cursor-not-allowed disabled:opacity-60"
        @click="agregarFila"
      >
        <Plus class="size-3.5" aria-hidden="true" /> Agregar registro
      </button>
    </div>

    <slot name="footer" />
  </section>
</template>
