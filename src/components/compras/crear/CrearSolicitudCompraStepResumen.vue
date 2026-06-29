<script setup lang="ts">
import { computed } from 'vue';
import { BadgeInfo, CalendarArrowDown, Hash, Megaphone, MessageSquareText, PackageCheck, Tractor } from 'lucide-vue-next';

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
  <section class="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm lg:px-4">
    <div class="min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
      <dl class="grid gap-3 lg:grid-cols-2">
      <div class="rounded-lg bg-stone-50 px-3 py-3 lg:col-span-2">
        <div
          class="grid gap-4"
          :class="
            solicitarUrgente
              ? 'lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,auto)] lg:items-center'
              : 'lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center'
          "
        >
          <div class="flex items-center gap-3">
            <Hash class="h-5 w-5 shrink-0 text-main-light" />
            <div class="min-w-0">
              <dt class="text-xs font-semibold uppercase tracking-wide text-stone-500">Tipo de solicitud</dt>
              <dd class="mt-1 text-base font-medium text-stone-900">{{ tipoSolicitud ?? 'Sin definir' }}</dd>
            </div>
          </div>

          <div class="hidden lg:block" aria-hidden="true">
            <div class="flex h-8 items-center">
              <div class="h-[80%] w-px bg-stone-200" />
            </div>
          </div>

          <div class="flex items-center gap-3">
            <CalendarArrowDown class="h-5 w-5 shrink-0 text-main-light" />
            <div class="min-w-0">
              <dt class="text-xs font-semibold uppercase tracking-wide text-stone-500">Fecha de entrega</dt>
              <dd class="mt-1 text-base font-medium text-stone-900">{{ fechaEntregaFormateada }}</dd>
            </div>
          </div>

          <div v-if="solicitarUrgente" class="hidden lg:block" aria-hidden="true">
            <div class="flex h-8 items-center">
              <div class="h-[80%] w-px bg-stone-200" />
            </div>
          </div>

          <div
            v-if="solicitarUrgente"
            class="flex items-center gap-3"
          >
            <Megaphone class="h-5 w-5 shrink-0 text-danger" />
            <span class="text-sm font-semibold uppercase tracking-wide text-danger">Urgente</span>
          </div>
        </div>
      </div>
      <div class="overflow-hidden rounded-lg bg-stone-50 lg:col-span-2">
        <div class="flex items-center gap-3 bg-[#e7e4da] px-3 py-2">
          <Tractor class="h-5 w-5 shrink-0 text-main-light" />
          <div class="flex h-8 items-center" aria-hidden="true">
            <div class="h-[80%] w-px bg-stone-300" />
          </div>
          <dt class="text-xs font-semibold uppercase tracking-wide text-stone-600">Equipos Selecionados</dt>
        </div>
        <dd class="flex flex-wrap gap-2 px-3 py-3">
          <template v-if="equipos.length > 0">
            <span
              v-for="item in equipos"
              :key="item.id"
              class="rounded-full bg-main/10 px-3 py-1 text-sm font-medium text-main"
            >
              {{ item.label }}
            </span>
          </template>
          <span v-else class="text-base font-medium text-stone-900">
            {{ tipoSolicitud === 'servicio' ? 'Sin contextos asociados' : 'Sin equipos' }}
          </span>
        </dd>
      </div>
      <div v-if="tipoSolicitud === 'servicio'" class="overflow-hidden rounded-lg bg-stone-50 lg:col-span-2">
        <div class="flex items-center gap-3 bg-[#e7e4da] px-3 py-2">
          <PackageCheck class="h-5 w-5 shrink-0 text-main-light" />
          <div class="flex h-8 items-center" aria-hidden="true">
            <div class="h-[80%] w-px bg-stone-300" />
          </div>
          <dt class="text-xs font-semibold uppercase tracking-wide text-stone-600">Servicios Selecionados</dt>
        </div>
        <dd class="px-3 py-3">
          <div v-if="servicios.length > 0" class="divide-y divide-stone-200">
            <div class="hidden gap-3 pb-3 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)]">
              <p class="text-xs font-semibold uppercase tracking-wide text-stone-500">Cantidad</p>
              <p class="text-xs font-semibold uppercase tracking-wide text-stone-500">Unidad</p>
              <p class="text-xs font-semibold uppercase tracking-wide text-stone-500">Descripcion</p>
            </div>
            <div
              v-for="item in servicios"
              :key="item.localId"
              class="grid gap-3 py-3 first:pt-0 last:pb-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)] lg:items-start"
            >
              <div class="min-w-0">
                <p class="mt-1 text-sm font-medium text-stone-900">{{ item.cantidad }}</p>
              </div>
              <div class="min-w-0">
                <p class="mt-1 text-sm font-medium text-stone-900">{{ item.unidadLabel }}</p>
              </div>
              <div class="min-w-0">
                <p class="mt-1 whitespace-normal break-words text-sm font-medium text-stone-900">{{ item.descripcion }}</p>
              </div>
            </div>
          </div>
          <span v-else class="text-base font-medium text-stone-900">Sin servicios</span>
        </dd>
      </div>
      <div v-else class="overflow-hidden rounded-lg bg-stone-50 lg:col-span-2">
        <div class="flex items-center gap-3 bg-[#e7e4da] px-3 py-2">
          <PackageCheck class="h-5 w-5 shrink-0 text-main-light" />
          <div class="flex h-8 items-center" aria-hidden="true">
            <div class="h-[80%] w-px bg-stone-300" />
          </div>
          <dt class="text-xs font-semibold uppercase tracking-wide text-stone-600">Productos Selecionados</dt>
        </div>
        <dd class="px-3 py-3">
          <div v-if="productos.length > 0" class="divide-y divide-stone-200">
            <div class="hidden gap-3 pb-3 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)]">
              <div class="flex items-center gap-2">
                <p class="text-xs font-semibold uppercase tracking-wide text-stone-500">Cod Almacen</p>
              </div>
              <p class="text-xs font-semibold uppercase tracking-wide text-stone-500">Unidad</p>
              <p class="text-xs font-semibold uppercase tracking-wide text-stone-500">Descripcion</p>
            </div>
            <div
              v-for="item in productos"
              :key="item.localId"
              class="grid gap-3 py-3 first:pt-0 last:pb-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)] lg:items-start"
            >
              <div class="min-w-0">
                <p class="mt-1 text-sm font-medium text-stone-900">
                  {{ item.tipo === 'existente' ? item.codProducto : 'Temporal' }}
                </p>
              </div>
              <div class="min-w-0">
                <p class="mt-1 text-sm font-medium text-stone-900">{{ item.unidadLabel }}</p>
              </div>
              <div class="min-w-0">
                <p class="mt-1 whitespace-normal break-words text-sm font-medium text-stone-900">{{ item.descripcion }}</p>
              </div>
            </div>
          </div>
          <span v-else class="text-base font-medium text-stone-900">Sin productos</span>
        </dd>
      </div>
      <div class="overflow-hidden rounded-lg bg-stone-50 lg:col-span-2">
        <div class="flex items-center gap-3 bg-[#e7e4da] px-3 py-2">
          <BadgeInfo class="h-5 w-5 shrink-0 text-main-light" />
          <div class="flex h-8 items-center" aria-hidden="true">
            <div class="h-[80%] w-px bg-stone-300" />
          </div>
          <dt class="text-xs font-semibold uppercase tracking-wide text-stone-600">Informacion Adicional</dt>
        </div>
        <dd class="px-3 py-3">
          <div class="divide-y divide-stone-200">
            <div class="grid gap-3 py-3 first:pt-0 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
              <div class="flex min-w-0 items-center gap-3">
                <MessageSquareText class="mt-0.5 h-4 w-4 shrink-0 text-main-light" />
                <p class="text-xs font-semibold uppercase tracking-wide text-stone-500">Observacion</p>
              </div>
              <p class="whitespace-normal break-words text-sm font-medium text-stone-900">
                {{ observacion || 'Sin observación' }}
              </p>
            </div>
            <div class="grid gap-3 py-3 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
              <div class="flex min-w-0 items-center gap-3">
                <Megaphone class="mt-0.5 h-4 w-4 shrink-0 text-main-light" />
                <p class="text-xs font-semibold uppercase tracking-wide text-stone-500">Urgencia</p>
              </div>
              <p class="whitespace-normal break-words text-sm font-medium text-stone-900">
                {{ solicitarUrgente ? 'Sí' : 'No' }}
              </p>
            </div>
            <div
              v-if="solicitarUrgente"
              class="grid gap-3 py-3 last:pb-0 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start"
            >
              <div class="flex min-w-0 items-center gap-3">
                <Megaphone class="mt-0.5 h-4 w-4 shrink-0 text-main-light" />
                <p class="text-xs font-semibold uppercase tracking-wide text-stone-500">Motivo</p>
              </div>
              <p class="whitespace-normal break-words text-sm font-medium text-stone-900">
                {{ motivoUrgencia || 'Sin motivo' }}
              </p>
            </div>
          </div>
        </dd>
      </div>
      </dl>
    </div>
  </section>
</template>
