<script setup lang="ts">
import type {
  EquipoSeleccionado,
  ProductoSolicitudItem,
  ServicioSolicitudItem,
  SolicitudCompraTipoSolicitud,
} from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

defineProps<{
  tipoSolicitud: SolicitudCompraTipoSolicitud | null;
  fechaEntrega: string | null;
  equipos: EquipoSeleccionado[];
  productos: ProductoSolicitudItem[];
  servicios: ServicioSolicitudItem[];
  observacion: string;
  solicitarUrgente: boolean;
  motivoUrgencia: string;
}>();
</script>

<template>
  <section class="flex h-full flex-col rounded-lg border border-stone-200 bg-white px-3 py-4 shadow-sm lg:px-4">
    <h3 class="text-base font-bold text-main">
      Paso 4 · Resumen
    </h3>
    <p class="mt-1 text-sm text-stone-500">
      Revisa los datos antes de guardar borrador o enviar.
    </p>

    <dl class="mt-4 grid gap-3 lg:grid-cols-2">
      <div class="rounded-lg bg-stone-50 px-3 py-3">
        <dt class="text-xs font-semibold uppercase tracking-wide text-stone-500">Tipo</dt>
        <dd class="mt-2 text-base font-medium text-stone-900">{{ tipoSolicitud ?? 'Sin definir' }}</dd>
      </div>
      <div class="rounded-lg bg-stone-50 px-3 py-3">
        <dt class="text-xs font-semibold uppercase tracking-wide text-stone-500">Fecha de entrega</dt>
        <dd class="mt-2 text-base font-medium text-stone-900">{{ fechaEntrega ?? 'Sin definir' }}</dd>
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
