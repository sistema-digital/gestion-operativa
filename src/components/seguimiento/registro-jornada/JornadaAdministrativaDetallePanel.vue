<script setup lang="ts">
import {
  ArrowLeft,
  CircleAlert,
  CircleCheck,
  CircleX,
  FilePenLine,
  LoaderCircle,
  LockKeyhole,
  Rows3,
} from "lucide-vue-next";
import {
  formatCompactDate,
  formatCompactPanamaDateTime,
} from "@/utils/formatCompactPanamaDate";
import JornadaAdministrativaEventosTable from "./JornadaAdministrativaEventosTable.vue";
import type { JornadaAdministrativaDetalle } from "./registroJornada.types";

const props = defineProps<{
  jornada: JornadaAdministrativaDetalle | null;
  cargando: boolean;
  error: string | null;
}>();

const emit = defineEmits<{ cerrar: [] }>();

function fechaOperativa(fecha: string): string {
  return formatCompactDate(new Date(`${fecha}T00:00:00`));
}

function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0))
    .join("")
    .toLocaleUpperCase("es-PA");
}

function etiquetaEstado(
  estado: JornadaAdministrativaDetalle["estadoCaptura"],
): string {
  return {
    en_edicion: "En edición",
    finalizada: "Finalizada",
    descartada: "Descartada",
  }[estado];
}

function claseEstado(
  estado: JornadaAdministrativaDetalle["estadoCaptura"],
): string {
  return {
    en_edicion: "border-warning/25 bg-warning-bg text-warning",
    finalizada: "border-success/25 bg-success-bg text-success",
    descartada: "border-danger/25 bg-danger-bg text-danger",
  }[estado];
}

function iconoEstado(estado: JornadaAdministrativaDetalle["estadoCaptura"]) {
  return {
    en_edicion: FilePenLine,
    finalizada: CircleCheck,
    descartada: CircleX,
  }[estado];
}
</script>

<template>
  <section aria-live="polite">
    <header class="mb-2 flex items-start justify-between gap-3 sm:mb-3">
      <div class="min-w-0">
        <h1
          class="mt-0.5 font-display text-[26px] leading-none text-main-dark sm:text-[30px]"
        >
          Detalle de jornada
        </h1>
      </div>
      <button
        class="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
        type="button"
        aria-label="Volver al listado de jornadas"
        @click="emit('cerrar')"
      >
        <ArrowLeft class="size-3.5" aria-hidden="true" />
        <span>Volver</span>
      </button>
    </header>

    <div
      v-if="cargando"
      class="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-xs text-gray-500 shadow-sm"
    >
      <LoaderCircle
        class="mr-2 inline size-4 animate-spin"
        aria-hidden="true"
      />
      Consultando jornada…
    </div>
    <p
      v-else-if="error"
      class="flex gap-2 rounded-xl border border-danger/25 bg-danger-bg p-3 text-xs text-danger"
      role="alert"
    >
      <CircleAlert class="size-4 shrink-0" aria-hidden="true" />{{ error }}
    </p>
    <template v-else-if="props.jornada">
      <section
        class="mb-2 grid gap-2 rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm sm:grid-cols-2 sm:p-3 lg:grid-cols-[minmax(190px,1.4fr)_repeat(5,minmax(0,0.72fr))]"
      >
        <div class="flex min-w-0 items-center gap-2.5 px-1 py-1">
          <div
            class="grid size-10 shrink-0 place-items-center rounded-lg bg-main-dark text-xs font-bold text-accent"
            aria-hidden="true"
          >
            {{ iniciales(props.jornada.operador) }}
          </div>
          <div class="min-w-0">
            <strong class="block truncate text-sm text-main-dark">{{
              props.jornada.operador
            }}</strong>
            <span class="mt-0.5 block text-[10px] text-gray-500">{{
              fechaOperativa(props.jornada.fechaOperativa)
            }}</span>
          </div>
        </div>

        <dl class="contents">
          <div class="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2">
            <dt
              class="text-[8px] font-bold uppercase tracking-[0.08em] text-gray-500"
            >
              Equipo
            </dt>
            <dd
              class="mt-0.5 truncate font-mono text-xs font-medium text-main-dark"
            >
              {{ props.jornada.equipoNumero ?? "No informado" }}
            </dd>
          </div>
          <div class="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2">
            <dt
              class="text-[8px] font-bold uppercase tracking-[0.08em] text-gray-500"
            >
              Inicio
            </dt>
            <dd
              class="mt-0.5 truncate font-mono text-xs font-medium text-main-dark"
            >
              {{ formatCompactPanamaDateTime(props.jornada.iniciadaEn) }}
            </dd>
          </div>
          <div class="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2">
            <dt
              class="text-[8px] font-bold uppercase tracking-[0.08em] text-gray-500"
            >
              Finalización
            </dt>
            <dd
              class="mt-0.5 truncate font-mono text-xs font-medium text-main-dark"
            >
              {{ formatCompactPanamaDateTime(props.jornada.finalizadaEn) }}
            </dd>
          </div>
          <div class="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2">
            <dt
              class="text-[8px] font-bold uppercase tracking-[0.08em] text-gray-500"
            >
              Estado
            </dt>
            <dd class="mt-1">
              <span
                class="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold"
                :class="claseEstado(props.jornada.estadoCaptura)"
              >
                <component
                  :is="iconoEstado(props.jornada.estadoCaptura)"
                  class="size-3"
                  aria-hidden="true"
                />
                {{ etiquetaEstado(props.jornada.estadoCaptura) }}
              </span>
            </dd>
          </div>
          <div class="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2">
            <dt
              class="text-[8px] font-bold uppercase tracking-[0.08em] text-gray-500"
            >
              Eventos
            </dt>
            <dd class="mt-0.5 font-mono text-xs font-medium text-main-dark">
              {{ props.jornada.eventosActivos }}
            </dd>
          </div>
        </dl>
      </section>

      <section
        class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <header
          class="flex items-center justify-between gap-3 border-b border-gray-200 px-3 py-2.5 sm:px-4"
        >
          <div class="flex min-w-0 items-center gap-2">
            <span
              class="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-info-bg text-info"
            >
              <Rows3 class="size-3.5" aria-hidden="true" />
            </span>
            <div class="min-w-0">
              <h2 class="text-xs font-bold text-gray-800">
                Eventos administrativos
              </h2>
            </div>
          </div>
          <span
            class="inline-flex shrink-0 items-center gap-1 rounded-full border border-info/20 bg-info-bg px-2 py-0.5 text-[10px] font-bold text-info"
          >
            <LockKeyhole class="size-3" aria-hidden="true" /> Solo lectura
          </span>
        </header>

        <JornadaAdministrativaEventosTable
          :eventos="props.jornada.eventos"
          :operador="props.jornada.operador"
        />
      </section>
    </template>
  </section>
</template>
