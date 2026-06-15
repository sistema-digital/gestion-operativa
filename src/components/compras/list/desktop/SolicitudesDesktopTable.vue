<script setup lang="ts">
import { computed } from 'vue';

import { getSolicitudDesktopColumnsByRole } from '@/components/compras/list/solicitudListRoleConfig';
import type {
  SolicitudCompraColumnKey,
  SolicitudCompraListItem,
  SolicitudCompraRoleCodigo,
} from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.types';

const props = defineProps<{
  items: SolicitudCompraListItem[];
  roleCodigo: SolicitudCompraRoleCodigo;
  loading: boolean;
  loadingMore: boolean;
}>();

const emit = defineEmits<{
  (e: 'row-click', item: SolicitudCompraListItem): void;
}>();

const columnLabels: Record<SolicitudCompraColumnKey, string> = {
  folio: 'Folio',
  observacion: 'Observación',
  estado: 'Estado',
  prioridad: 'Prioridad',
  equipos: 'Equipos',
  area: 'Área',
  solicitante: 'Solicitante',
  fechaEntrega: 'Fecha Entrega',
  indicadores: 'Indicadores',
  bloqueado: 'Bloqueado',
};

const columns = computed(() => getSolicitudDesktopColumnsByRole(props.roleCodigo));

const tableGridClass = computed(() => {
  const widthMap: Record<SolicitudCompraColumnKey, string> = {
    folio: 'minmax(10rem,1fr)',
    observacion: 'minmax(20rem,2.3fr)',
    estado: 'minmax(8rem,0.9fr)',
    prioridad: 'minmax(7rem,0.8fr)',
    equipos: 'minmax(10rem,1fr)',
    area: 'minmax(9rem,0.95fr)',
    solicitante: 'minmax(9rem,0.95fr)',
    fechaEntrega: 'minmax(9rem,0.9fr)',
    indicadores: 'minmax(10rem,1fr)',
    bloqueado: 'minmax(7rem,0.8fr)',
  };

  return {
    gridTemplateColumns: columns.value.map((column) => widthMap[column]).join(' '),
  };
});

const getColumnCellClass = (column: SolicitudCompraColumnKey): string => {
  if (column === 'observacion') {
    return 'min-w-0';
  }

  return 'min-w-0';
};

const getPrioridadClass = (codigo: string): string => {
  switch (codigo) {
    case 'urgente':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    case 'alta':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'baja':
      return 'border-slate-200 bg-slate-50 text-slate-600';
    default:
      return 'border-stone-200 bg-stone-100 text-stone-700';
  }
};

const getEstadoClass = (codigo: string): string => {
  switch (codigo) {
    case 'aprobado_gerencia':
    case 'orden_compra':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'rechazado':
    case 'descartado_por_supervisor':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    case 'en_revision_almacen':
    case 'en_revision_supervisor':
    case 'en_revision_gerencia':
      return 'border-sky-200 bg-sky-50 text-sky-700';
    default:
      return 'border-stone-200 bg-stone-100 text-stone-700';
  }
};

const getFechaOrigenLabel = (origen: SolicitudCompraListItem['fechaEntrega']['origen']): string => {
  switch (origen) {
    case 'proveedor':
      return 'Proveedor';
    case 'sistema':
      return 'Sistema';
    case 'solicitud':
      return 'Solicitud';
    default:
      return 'Sin fecha';
  }
};

const getIndicadores = (item: SolicitudCompraListItem): string[] => {
  const indicadores: string[] = [];

  if (item.indicadores.bloqueado.visible) {
    indicadores.push('Bloqueada');
  }

  if (item.indicadores.adjuntos.visible) {
    indicadores.push(`Adj. ${item.indicadores.adjuntos.cantidad}`);
  }

  if (item.indicadores.diferenciaOc.visible) {
    indicadores.push(`Dif. OC ${item.indicadores.diferenciaOc.cantidad}`);
  }

  return indicadores;
};

const getVisibleEquipos = (item: SolicitudCompraListItem): string[] => item.equipos.visibles.slice(0, 3);

const getEquiposOverflow = (item: SolicitudCompraListItem): number =>
  Math.max(item.equipos.codigos.length - getVisibleEquipos(item).length, 0);

const onRowClick = (item: SolicitudCompraListItem): void => {
  emit('row-click', item);
};
</script>

<template>
  <section class="overflow-hidden rounded-2xl border border-stone-300 bg-white shadow-sm">
    <div
      class="grid gap-3 border-b border-stone-200 bg-stone-100 px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500"
      :style="tableGridClass"
    >
      <div
        v-for="column in columns"
        :key="`header-${column}`"
        class="min-w-0"
      >
        {{ columnLabels[column] }}
      </div>
    </div>

    <div v-if="loading && items.length === 0" class="px-4 py-10 text-center text-sm text-stone-500">
      Cargando solicitudes...
    </div>

    <div v-else-if="items.length === 0" class="px-4 py-10 text-center text-sm text-stone-500">
      No hay solicitudes para mostrar.
    </div>

    <div v-else>
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="grid min-h-[78px] w-full gap-3 border-b border-stone-100 px-3 py-3 text-left transition hover:bg-stone-50 last:border-b-0"
        :style="tableGridClass"
        @click="onRowClick(item)"
      >
        <div
          v-for="column in columns"
          :key="`${item.id}-${column}`"
          :class="getColumnCellClass(column)"
        >
          <template v-if="column === 'folio'">
            <div class="flex min-h-full flex-col justify-center">
              <span class="text-[13px] font-semibold text-stone-900">
                {{ item.folio.folioSolLabel || 'Sin folio' }}
              </span>
              <span
                v-if="item.folio.folioOcPrincipal"
                class="mt-1 text-[11px] text-stone-500"
              >
                OC {{ item.folio.folioOcPrincipal }}
              </span>
            </div>
          </template>

          <template v-else-if="column === 'observacion'">
            <div class="flex min-h-full flex-col justify-center">
              <p class="line-clamp-3 text-[13px] leading-5 text-stone-800">
                {{ item.observacion || 'Sin observación registrada.' }}
              </p>
            </div>
          </template>

          <template v-else-if="column === 'estado'">
            <div class="flex min-h-full items-center">
              <span
                class="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                :class="getEstadoClass(item.estado.codigo)"
              >
                {{ item.estado.badgeLabel }}
              </span>
            </div>
          </template>

          <template v-else-if="column === 'prioridad'">
            <div class="flex min-h-full items-center">
              <span
                class="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                :class="getPrioridadClass(item.prioridad.codigo)"
              >
                {{ item.prioridad.nombre }}
              </span>
            </div>
          </template>

          <template v-else-if="column === 'equipos'">
            <div class="flex min-h-full flex-col justify-center">
              <div v-if="item.equipos.loading" class="text-[11px] text-stone-500">
                Cargando equipos...
              </div>
              <div v-else class="flex flex-wrap gap-1.5">
                <span
                  v-for="codigo in getVisibleEquipos(item)"
                  :key="codigo"
                  class="inline-flex rounded-full border border-stone-200 bg-stone-100 px-2 py-1 text-[11px] font-medium text-stone-700"
                >
                  {{ codigo }}
                </span>
                <span
                  v-if="getEquiposOverflow(item) > 0"
                  class="inline-flex rounded-full border border-stone-200 bg-white px-2 py-1 text-[11px] font-medium text-stone-500"
                >
                  +{{ getEquiposOverflow(item) }}
                </span>
              </div>
            </div>
          </template>

          <template v-else-if="column === 'area'">
            <div class="flex min-h-full flex-col justify-center">
              <span class="text-[12px] font-medium text-stone-800">
                {{ item.area.nombre || 'Sin área' }}
              </span>
              <span
                v-if="item.area.codigo"
                class="mt-1 text-[11px] uppercase tracking-[0.08em] text-stone-500"
              >
                {{ item.area.codigo }}
              </span>
            </div>
          </template>

          <template v-else-if="column === 'solicitante'">
            <div class="flex min-h-full items-center">
              <span class="text-[12px] text-stone-800">
                {{ item.solicitante.nombre || 'Sin solicitante' }}
              </span>
            </div>
          </template>

          <template v-else-if="column === 'fechaEntrega'">
            <div class="flex min-h-full flex-col justify-center">
              <span class="text-[12px] font-medium text-stone-800">
                {{ item.fechaEntrega.fecha || 'Sin fecha' }}
              </span>
              <span class="mt-1 text-[11px] text-stone-500">
                {{ getFechaOrigenLabel(item.fechaEntrega.origen) }}
              </span>
            </div>
          </template>

          <template v-else-if="column === 'indicadores'">
            <div class="flex min-h-full items-center">
              <div
                v-if="getIndicadores(item).length > 0"
                class="flex flex-wrap gap-1.5"
              >
                <span
                  v-for="indicador in getIndicadores(item)"
                  :key="indicador"
                  class="inline-flex rounded-full border border-stone-200 bg-white px-2 py-1 text-[11px] font-medium text-stone-600"
                >
                  {{ indicador }}
                </span>
              </div>
              <span v-else class="text-[11px] text-stone-400">
                Sin indicadores
              </span>
            </div>
          </template>

          <template v-else-if="column === 'bloqueado'">
            <div class="flex min-h-full items-center">
              <span
                class="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                :class="item.indicadores.bloqueado.visible
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-stone-200 bg-stone-100 text-stone-500'"
              >
                {{ item.indicadores.bloqueado.visible ? 'Bloqueada' : 'Libre' }}
              </span>
            </div>
          </template>
        </div>
      </button>

      <div
        v-if="loadingMore"
        class="border-t border-stone-100 px-4 py-3 text-center text-[12px] text-stone-500"
      >
        Cargando más solicitudes...
      </div>
    </div>
  </section>
</template>
