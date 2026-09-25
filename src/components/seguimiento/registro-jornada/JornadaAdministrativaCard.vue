<script setup lang="ts">
import { Clock3, Eye, Pencil, Trash2, UserRound } from "lucide-vue-next";
import { computed } from "vue";
import { formatCompactPanamaTime } from "@/utils/formatCompactPanamaDate";
import type { JornadaAdministrativaListaItem } from "./registroJornada.types";

const props = defineProps<{
  jornada: JornadaAdministrativaListaItem;
}>();

const emit = defineEmits<{
  ver: [jornadaId: string];
  editar: [jornadaId: string];
  eliminar: [jornada: JornadaAdministrativaListaItem];
}>();

const puedeEditar = computed(
  () =>
    props.jornada.estadoCaptura === "en_edicion" ||
    props.jornada.estadoCaptura === "finalizada",
);

const columnasAcciones = computed(() => {
  const cantidadAcciones =
    1 +
    Number(puedeEditar.value) +
    Number(Boolean(props.jornada.publicadoJornadaId));

  return cantidadAcciones === 3 ? "grid-cols-3" : "grid-cols-2";
});

function fechaOperativa(fecha: string): string {
  const [year, month, day] = fecha.split("-");
  const mesesAbreviados = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ] as const;
  const mes = mesesAbreviados[Number(month) - 1];

  return mes ? `${day} ${mes} ${year}` : fecha;
}

function etiquetaEstado(
  estado: JornadaAdministrativaListaItem["estadoCaptura"],
): string {
  return {
    en_edicion: "En edición",
    finalizada: "Finalizada",
    descartada: "Descartada",
  }[estado];
}

function claseEstado(
  estado: JornadaAdministrativaListaItem["estadoCaptura"],
): string {
  return {
    en_edicion: "border-warning/25 bg-warning-bg text-warning",
    finalizada: "border-success/25 bg-success-bg text-success",
    descartada: "border-danger/25 bg-danger-bg text-danger",
  }[estado];
}
</script>

<template>
  <article
    class="overflow-hidden rounded-xl border border-[#e3ded5] bg-white shadow-sm"
  >
    <header
      class="flex items-start justify-between gap-3 bg-[#fcfbf9] px-3 py-2.5"
    >
      <div class="min-w-0">
        <p class="font-mono text-xs font-bold text-main-dark">
          {{ fechaOperativa(jornada.fechaOperativa) }}
        </p>
        <p class="mt-0.5 font-mono text-[11px] text-gray-600">
          Equipo {{ jornada.equipoNumero }}
        </p>
      </div>
      <span
        class="inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold"
        :class="claseEstado(jornada.estadoCaptura)"
      >
        {{ etiquetaEstado(jornada.estadoCaptura) }}
      </span>
    </header>

    <div class="grid grid-cols-2 gap-x-3 gap-y-2 px-3 py-2.5 text-xs">
      <div class="col-span-2 flex min-w-0 items-center gap-1.5 text-gray-700">
        <UserRound class="size-3.5 shrink-0 text-gray-400" aria-hidden="true" />
        <span class="truncate font-semibold">{{ jornada.operador }}</span>
      </div>
      <div class="flex items-center gap-1.5 text-gray-600">
        <Clock3 class="size-3.5 shrink-0 text-gray-400" aria-hidden="true" />
        <span>Inicio</span>
        <strong class="ml-auto font-mono text-main-dark">{{
          formatCompactPanamaTime(jornada.iniciadaEn)
        }}</strong>
      </div>
      <div class="flex items-center gap-1.5 text-gray-600">
        <Clock3 class="size-3.5 shrink-0 text-gray-400" aria-hidden="true" />
        <span>Fin</span>
        <strong class="ml-auto font-mono text-main-dark">{{
          formatCompactPanamaTime(jornada.finalizadaEn)
        }}</strong>
      </div>
    </div>

    <footer
      class="grid gap-1.5 border-t border-[#ebe7df] bg-[#fcfbf9] p-2"
      :class="columnasAcciones"
    >
      <button
        v-if="jornada.publicadoJornadaId"
        type="button"
        class="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-danger/25 bg-danger-bg px-2 text-[11px] font-semibold text-danger transition-colors hover:bg-danger-bg/70"
        @click="emit('eliminar', jornada)"
      >
        <Trash2 class="size-3.5" aria-hidden="true" /> Eliminar
      </button>
      <button
        v-if="puedeEditar"
        type="button"
        class="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-warning/30 bg-warning-bg px-2 text-[11px] font-semibold text-warning transition-colors hover:bg-warning-bg/70"
        @click="emit('editar', jornada.jornadaId)"
      >
        <Pencil class="size-3.5" aria-hidden="true" /> Editar
      </button>
      <button
        type="button"
        class="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-2 text-[11px] font-semibold text-main transition-colors hover:bg-gray-50"
        @click="emit('ver', jornada.jornadaId)"
      >
        <Eye class="size-3.5" aria-hidden="true" /> Ver
      </button>
    </footer>
  </article>
</template>
