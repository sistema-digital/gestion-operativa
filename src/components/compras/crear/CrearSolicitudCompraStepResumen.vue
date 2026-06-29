<script setup lang="ts">
import { computed } from 'vue';
import { CalendarArrowDown, Hash } from 'lucide-vue-next';

import type {
  EquipoSeleccionado,
  ProductoSolicitudItem,
  ServicioSolicitudItem,
  SolicitudCompraTipoSolicitud,
} from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

const props = defineProps<{
  tipoSolicitud: SolicitudCompraTipoSolicitud | null;
  fechaEntrega: string | null;
  equipos: EquipoSeleccionado[];
  productos: ProductoSolicitudItem[];
  servicios: ServicioSolicitudItem[];
  observacion: string;
  solicitarUrgente: boolean;
  motivoUrgencia: string;
}>();

const fechaEntregaFormateada = computed(() => {
  if (!props.fechaEntrega) {
    return 'Sin definir';
  }

  const [year, month, day] = props.fechaEntrega.split('-').map(Number);

  if (!year || !month || !day) {
    return props.fechaEntrega;
  }

  const fecha = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(fecha).replace('.', '').toLowerCase();
});
</script>

<template>
  <section class="flex h-full flex-col rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm lg:px-4">
    <dl class=" grid gap-3 lg:grid-cols-2">
      <div class="rounded-lg bg-stone-50 px-3 py-3 lg:col-span-2">
        <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center">
          <div class="flex items-center gap-3">
            <Hash class="h-5 w-5 shrink-0 text-main-light" />
            <div class="min-w-0">
              <dt class="text-xs font-semibold uppercase tracking-wide text-stone-500">Tipo de solicitud</dt>
              <dd class="mt-1 text-base font-medium text-stone-900">{{ tipoSolicitud ?? 'Sin definir' }}</dd>
            </div>
          </div>

          <div class="hidden h-[80%] w-px self-center bg-stone-200 lg:block" aria-hidden="true" />

          <div class="flex items-center gap-3">
            <CalendarArrowDown class="h-5 w-5 shrink-0 text-main-light" />
            <div class="min-w-0">
              <dt class="text-xs font-semibold uppercase tracking-wide text-stone-500">Fecha de entrega</dt>
              <dd class="mt-1 text-base font-medium text-stone-900">{{ fechaEntregaFormateada }}</dd>
            </div>
          </div>
        </div>
      </div>
      <div class="rounded-lg bg-stone-50 px-3 py-3 lg:col-span-2">
        <dt class="text-xs font-semibold uppercase tracking-wide text-stone-500">
          {{ tipoSolicitud === 'servicio' ? 'Contextos asociados' : 'Equipos' }}
        </dt>
        <dd class="mt-2 text-base font-medium text-stone-900">
          {{
            equipos.length > 0
              ? equipos.map((item) => item.label).join(', ')
              : (tipoSolicitud === 'servicio' ? 'Sin contextos asociados' : 'Sin equipos')
          }}
        </dd>
      </div>
      <div class="rounded-lg bg-stone-50 px-3 py-3 lg:col-span-2">
        <dt class="text-xs font-semibold uppercase tracking-wide text-stone-500">
          {{ tipoSolicitud === 'servicio' ? 'Servicios' : 'Productos' }}
        </dt>
        <dd class="mt-2 text-base font-medium text-stone-900">
          {{
            tipoSolicitud === 'servicio'
              ? (
                servicios.length > 0
                  ? servicios.map((item) => `${item.cantidad} · ${item.descripcion} · ${item.unidadLabel}`).join(', ')
                  : 'Sin servicios'
              )
              : (productos.length > 0 ? productos.map((item) => item.tipo === 'existente' ? item.codProducto : item.descripcion).join(', ') : 'Sin productos')
          }}
        </dd>
      </div>
      <div class="rounded-lg bg-stone-50 px-3 py-3 lg:col-span-2">
        <dt class="text-xs font-semibold uppercase tracking-wide text-stone-500">Observación</dt>
        <dd class="mt-2 text-base font-medium text-stone-900">{{ observacion || 'Sin observación' }}</dd>
      </div>
      <div class="rounded-lg bg-stone-50 px-3 py-3">
        <dt class="text-xs font-semibold uppercase tracking-wide text-stone-500">Urgencia</dt>
        <dd class="mt-2 text-base font-medium text-stone-900">{{ solicitarUrgente ? 'Sí' : 'No' }}</dd>
      </div>
      <div class="rounded-lg bg-stone-50 px-3 py-3">
        <dt class="text-xs font-semibold uppercase tracking-wide text-stone-500">Motivo</dt>
        <dd class="mt-2 text-base font-medium text-stone-900">{{ motivoUrgencia || 'No aplica' }}</dd>
      </div>
    </dl>
  </section>
</template>
