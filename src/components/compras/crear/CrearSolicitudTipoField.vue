<script setup lang="ts">
import type { SolicitudCompraTipoSolicitud } from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

const model = defineModel<SolicitudCompraTipoSolicitud | null>();

defineProps<{
  error?: string;
}>();

const options: Array<{ value: SolicitudCompraTipoSolicitud; label: string }> = [
  { value: 'zafra', label: 'Zafra' },
  { value: 'cultivo', label: 'Cultivo' },
  { value: 'otros', label: 'Otros' },
  { value: 'servicio', label: 'Servicio' },
];
</script>

<template>
  <div class="space-y-1">
    <label class="block text-xs font-semibold text-stone-800">
      Tipo de solicitud <span class="text-danger">*</span>
    </label>

    <div
      class="rounded-lg border bg-white px-2 py-1 transition"
      :class="error ? 'border-danger bg-danger-bg/30' : 'border-stone-300 focus-within:border-main'"
    >
      <select
        :value="model ?? ''"
        class=" w-full cursor-pointer bg-transparent text-sm text-stone-900 outline-none"
        @change="model = (($event.target as HTMLSelectElement).value || null) as SolicitudCompraTipoSolicitud | null"
      >
        <option value="">
          Selecciona un tipo de solicitud
        </option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </div>

    
    <p
      v-if="error"
      class="text-sm font-medium text-danger"
    >
      {{ error }}
    </p>
  </div>
</template>
