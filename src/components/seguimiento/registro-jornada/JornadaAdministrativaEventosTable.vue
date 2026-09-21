<script setup lang="ts">
import { shallowRef } from "vue";
import {
  ArrowRightLeft,
  ChevronRight,
  CirclePause,
  CirclePlay,
  CircleStop,
} from "lucide-vue-next";
import EquipmentEventsDetailDrawer from "@/components/dashboard/actividad-equipo/EquipmentEventsDetailDrawer.vue";
import EquipmentReportMobileDrawer from "@/components/dashboard/actividad-equipo/EquipmentReportMobileDrawer.vue";
import { jornadaEventosService } from "@/stores/dashboard/reporte-equipos/jornadaEventos.service";
import type { JornadaEventoDetalle } from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";
import { formatCompactPanamaDateTime } from "@/utils/formatCompactPanamaDate";
import type { JornadaAdministrativaEvento } from "./registroJornada.types";

const props = defineProps<{
  eventos: JornadaAdministrativaEvento[];
  operador: string;
}>();

const detalleSeleccionado = shallowRef<JornadaEventoDetalle | null>(null);
const cargandoDetalle = shallowRef(false);
const errorDetalle = shallowRef<string | null>(null);
let solicitudDetalleId = 0;

function etiquetaEvento(
  tipoEvento: JornadaAdministrativaEvento["tipoEvento"],
): string {
  return {
    inicio_jornada: "Inicio de jornada",
    cambiar_labor: "Cambio de labor",
    inicio_parada: "Inicio de parada",
    cambio_causa: "Cambio de causa",
    reanudar: "Reanudación",
    confirmar_cambio_implemento: "Cambio de implemento",
    finalizar_jornada: "Finalización",
  }[tipoEvento];
}

function iconoEvento(tipoEvento: JornadaAdministrativaEvento["tipoEvento"]) {
  if (tipoEvento === "inicio_jornada" || tipoEvento === "reanudar") {
    return CirclePlay;
  }
  if (tipoEvento === "finalizar_jornada") return CircleStop;
  if (tipoEvento === "inicio_parada") return CirclePause;
  return ArrowRightLeft;
}

function colorEvento(
  tipoEvento: JornadaAdministrativaEvento["tipoEvento"],
): string {
  if (tipoEvento === "inicio_jornada" || tipoEvento === "reanudar") {
    return "text-success";
  }
  if (tipoEvento === "finalizar_jornada") return "text-danger";
  if (tipoEvento === "inicio_parada") return "text-warning";
  return "text-info";
}

function resumenEvento(evento: JornadaAdministrativaEvento): string {
  return evento.anulado
    ? `Secuencia ${evento.secuencia} · Evento anulado`
    : `Secuencia ${evento.secuencia} · Evento activo`;
}

function puedeAbrirDetalle(evento: JornadaAdministrativaEvento): boolean {
  return evento.clientEventId !== null && evento.publicEventoId !== null;
}

async function seleccionarEvento(
  evento: JornadaAdministrativaEvento,
): Promise<void> {
  if (!puedeAbrirDetalle(evento) || !evento.publicEventoId) return;

  const solicitudActual = ++solicitudDetalleId;
  detalleSeleccionado.value = null;
  errorDetalle.value = null;
  cargandoDetalle.value = true;

  try {
    const detalle = await jornadaEventosService.loadDetail(
      evento.publicEventoId,
    );
    if (solicitudActual === solicitudDetalleId) {
      detalleSeleccionado.value = detalle;
    }
  } catch (capturado) {
    if (solicitudActual !== solicitudDetalleId) return;
    errorDetalle.value =
      capturado instanceof Error
        ? capturado.message
        : "No se pudo cargar el detalle del evento.";
  } finally {
    if (solicitudActual === solicitudDetalleId) {
      cargandoDetalle.value = false;
    }
  }
}

function cerrarDetalle(): void {
  ++solicitudDetalleId;
  detalleSeleccionado.value = null;
  errorDetalle.value = null;
  cargandoDetalle.value = false;
}
</script>

<template>
  <section class="min-h-0">
    <div v-if="props.eventos.length" class="space-y-2 lg:hidden">
      <button
        v-for="evento in props.eventos"
        :key="evento.id"
        type="button"
        class="w-full rounded-md border border-gray-200 bg-white p-3 text-left shadow-sm transition-colors"
        :class="
          puedeAbrirDetalle(evento)
            ? 'cursor-pointer hover:bg-main/5'
            : 'cursor-default'
        "
        :disabled="!puedeAbrirDetalle(evento)"
        @click="seleccionarEvento(evento)"
      >
        <span class="flex items-start justify-between gap-3">
          <span
            class="inline-flex min-w-0 items-center gap-2 text-xs font-semibold text-gray-800"
          >
            <component
              :is="iconoEvento(evento.tipoEvento)"
              class="size-4 shrink-0"
              :class="colorEvento(evento.tipoEvento)"
            />
            <span class="truncate">{{
              etiquetaEvento(evento.tipoEvento)
            }}</span>
          </span>
          <ChevronRight class="size-4 shrink-0 text-main" aria-hidden="true" />
        </span>
        <dl class="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[10px]">
          <div>
            <dt class="text-gray-400">Fecha</dt>
            <dd class="mt-0.5 font-medium text-gray-700">
              {{ formatCompactPanamaDateTime(evento.ocurrioEn) }}
            </dd>
          </div>
          <div>
            <dt class="text-gray-400">Operador</dt>
            <dd class="mt-0.5 truncate font-medium text-gray-700">
              {{ props.operador }}
            </dd>
          </div>
          <div class="col-span-2">
            <dt class="text-gray-400">Detalle</dt>
            <dd class="mt-0.5 text-gray-700">{{ resumenEvento(evento) }}</dd>
          </div>
          <div v-if="!puedeAbrirDetalle(evento)" class="col-span-2">
            <dd class="font-medium text-gray-400">
              Vista rápida: el evento todavía no está publicado.
            </dd>
          </div>
        </dl>
      </button>
    </div>

    <div
      v-if="props.eventos.length"
      class="hidden min-h-0 overflow-auto border-t border-gray-200 lg:block"
    >
      <table class="w-full min-w-[760px] border-collapse text-left text-xs">
        <thead
          class="sticky top-0 bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500"
        >
          <tr>
            <th class="px-3 py-2 font-semibold">Fecha / hora</th>
            <th class="px-3 py-2 font-semibold">Operador</th>
            <th class="px-3 py-2 font-semibold">Evento</th>
            <th class="px-3 py-2 font-semibold">Detalle</th>
            <th class="px-3 py-2 font-semibold">Estado</th>
            <th class="w-10 px-2 py-2">
              <span class="sr-only">Ver detalle</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="evento in props.eventos"
            :key="evento.id"
            class="border-t border-gray-100 text-gray-700"
            :class="
              puedeAbrirDetalle(evento)
                ? 'cursor-pointer hover:bg-main/5'
                : 'cursor-default'
            "
            :tabindex="puedeAbrirDetalle(evento) ? 0 : undefined"
            @click="seleccionarEvento(evento)"
            @keydown.enter="seleccionarEvento(evento)"
          >
            <td class="whitespace-nowrap px-3 py-2.5">
              {{ formatCompactPanamaDateTime(evento.ocurrioEn) }}
            </td>
            <td class="px-3 py-2.5 font-medium">{{ props.operador }}</td>
            <td class="px-3 py-2.5">
              <span class="inline-flex items-center gap-1.5 font-medium">
                <component
                  :is="iconoEvento(evento.tipoEvento)"
                  class="size-3.5"
                  :class="colorEvento(evento.tipoEvento)"
                />
                {{ etiquetaEvento(evento.tipoEvento) }}
              </span>
            </td>
            <td class="px-3 py-2.5">{{ resumenEvento(evento) }}</td>
            <td class="px-3 py-2.5">
              <span
                class="rounded-full border px-1.5 py-0.5 text-[9px] font-bold"
                :class="
                  evento.anulado
                    ? 'border-danger/25 bg-danger-bg text-danger'
                    : puedeAbrirDetalle(evento)
                      ? 'border-success/25 bg-success-bg text-success'
                      : 'border-info/20 bg-info-bg text-info'
                "
              >
                {{
                  evento.anulado
                    ? "Anulado"
                    : puedeAbrirDetalle(evento)
                      ? "Publicado"
                      : "Vista rápida"
                }}
              </span>
            </td>
            <td class="px-2 py-2.5">
              <button
                v-if="puedeAbrirDetalle(evento)"
                type="button"
                class="grid min-h-8 min-w-8 cursor-pointer place-items-center rounded hover:bg-main/10"
                aria-label="Ver detalle del evento"
                @click.stop="seleccionarEvento(evento)"
              >
                <ChevronRight class="size-4 text-main" aria-hidden="true" />
              </button>
              <span v-else class="block text-center text-[10px] text-gray-400"
                >—</span
              >
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p
      v-else
      class="border-t border-gray-200 bg-gray-50 px-3 py-5 text-center text-[10px] text-gray-500"
    >
      Esta jornada no tiene eventos administrativos registrados.
    </p>

    <Transition name="event-drawer">
      <EquipmentEventsDetailDrawer
        v-if="detalleSeleccionado || cargandoDetalle || errorDetalle"
        class="fixed bottom-0 right-0 top-0 z-50 hidden lg:flex"
        :detail="detalleSeleccionado"
        :loading="cargandoDetalle"
        :error="errorDetalle"
        @close="cerrarDetalle"
      />
    </Transition>
    <EquipmentReportMobileDrawer
      v-if="detalleSeleccionado || cargandoDetalle || errorDetalle"
      title="Detalle del evento"
      hide-header
      @close="cerrarDetalle"
    >
      <EquipmentEventsDetailDrawer
        class="h-full"
        :detail="detalleSeleccionado"
        :loading="cargandoDetalle"
        :error="errorDetalle"
        @close="cerrarDetalle"
      />
    </EquipmentReportMobileDrawer>
  </section>
</template>

<style scoped>
.event-drawer-enter-active,
.event-drawer-leave-active {
  transition:
    transform 180ms ease-out,
    opacity 180ms ease-out;
}

.event-drawer-enter-from,
.event-drawer-leave-to {
  transform: translateX(1rem);
  opacity: 0;
}
</style>
