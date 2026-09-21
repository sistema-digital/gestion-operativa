<script setup lang="ts">
import { Eye, LoaderCircle, Pencil } from "lucide-vue-next";
import { formatCompactPanamaDateTime } from "@/utils/formatCompactPanamaDate";
import type { JornadaAdministrativaListaItem } from "./registroJornada.types";

defineProps<{
  jornadas: JornadaAdministrativaListaItem[];
  cargando: boolean;
}>();

const emit = defineEmits<{
  ver: [jornadaId: string];
  editar: [jornadaId: string];
}>();

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
  <div class="overflow-x-auto p-2 sm:p-0">
    <table
      class="w-full min-w-[680px] border-collapse text-left sm:text-xs"
      aria-label="Jornadas administrativas"
    >
      <thead
        class="border-y border-gray-200 bg-gray-50 text-[10px] uppercase tracking-[0.08em] text-gray-600"
      >
        <tr>
          <th class="px-3 py-2 font-bold">Fecha</th>
          <th class="px-3 py-2 font-bold">Operador</th>
          <th class="px-3 py-2 font-bold">Inicio</th>
          <th class="px-3 py-2 font-bold">Fin</th>
          <th class="px-3 py-2 font-bold">Eventos</th>
          <th class="px-3 py-2 font-bold">Estado</th>
          <th class="px-3 py-2"><span class="sr-only">Acciones</span></th>
        </tr>
      </thead>
      <tbody v-if="cargando">
        <tr>
          <td class="px-3 py-8 text-center text-xs text-gray-500" colspan="7">
            <LoaderCircle
              class="mr-2 inline size-4 animate-spin"
              aria-hidden="true"
            />Cargando jornadas…
          </td>
        </tr>
      </tbody>
      <tbody v-else-if="jornadas.length === 0">
        <tr>
          <td class="px-3 py-8 text-center text-xs text-gray-500" colspan="7">
            No hay jornadas para los filtros seleccionados.
          </td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr
          v-for="jornada in jornadas"
          :key="jornada.jornadaId"
          class="border-b border-gray-100 transition hover:bg-[#fdfcf9]"
        >
          <td
            class="px-3 py-2.5 font-mono text-xs font-medium text-main-dark"
            data-label="Fecha"
          >
            {{ fechaOperativa(jornada.fechaOperativa) }}
          </td>
          <td
            class="px-3 py-2.5 text-xs font-semibold text-gray-800"
            data-label="Operador"
          >
            {{ jornada.operador }}
          </td>
          <td
            class="px-3 py-2.5 font-mono text-[11px] text-gray-600"
            data-label="Inicio"
          >
            {{ formatCompactPanamaDateTime(jornada.iniciadaEn) }}
          </td>
          <td
            class="px-3 py-2.5 font-mono text-[11px] text-gray-600"
            data-label="Fin"
          >
            {{ formatCompactPanamaDateTime(jornada.finalizadaEn) }}
          </td>
          <td
            class="px-3 py-2.5 font-mono text-xs text-gray-700"
            data-label="Eventos"
          >
            {{ jornada.eventosActivos }}
          </td>
          <td class="px-3 py-2.5" data-label="Estado">
            <span
              class="inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold"
              :class="claseEstado(jornada.estadoCaptura)"
              >{{ etiquetaEstado(jornada.estadoCaptura) }}</span
            >
          </td>
          <td class="px-3 py-2.5" data-label="Acciones">
            <button
              v-if="jornada.estadoCaptura === 'en_edicion'"
              class="mr-1 inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-warning/30 bg-warning-bg px-2.5 text-[11px] font-semibold text-warning shadow-sm transition hover:bg-warning-bg/70"
              type="button"
              @click="emit('editar', jornada.jornadaId)"
            >
              <Pencil class="size-3.5" aria-hidden="true" /> Editar
            </button>
            <button
              class="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 text-[11px] font-semibold text-main shadow-sm transition hover:bg-gray-50"
              type="button"
              @click="emit('ver', jornada.jornadaId)"
            >
              <Eye class="size-3.5" aria-hidden="true" /> Ver
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
