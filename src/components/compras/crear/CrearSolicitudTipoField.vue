<script setup lang="ts">
import { Check, LoaderCircle } from "lucide-vue-next";

import type {
  SolicitudCompraTipoSolicitud,
  SolicitudCompraTipoSolicitudOption,
} from "@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types";

const model = defineModel<SolicitudCompraTipoSolicitud | null>();

const props = defineProps<{
  options: SolicitudCompraTipoSolicitudOption[];
  loading: boolean;
  error?: string;
}>();

const selectTipoSolicitud = (value: SolicitudCompraTipoSolicitud): void => {
  model.value = value;
};
</script>

<template>
  <div class="space-y-1">
    <p class="text-xs font-semibold text-stone-800">
      Tipo de solicitud <span class="text-danger">*</span>
    </p>

    <div
      v-if="loading"
      class="flex min-h-11 items-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-xs text-stone-500 sm:min-h-9"
    >
      <LoaderCircle class="h-4 w-4 animate-spin" aria-hidden="true" />
      Cargando tipos de solicitud...
    </div>

    <div
      v-else-if="options.length"
      role="radiogroup"
      aria-label="Tipo de solicitud"
      class="grid grid-cols-2 gap-2"
    >
      <button
        v-for="option in options"
        :key="option.codigo"
        type="button"
        role="radio"
        :aria-checked="model === option.codigo"
        :class="[
          'flex min-h-11 items-center justify-between rounded-md border px-3 text-left text-sm font-semibold transition sm:min-h-9 sm:text-xs',
          model === option.codigo
            ? 'border-main bg-main text-white'
            : 'border-stone-300 bg-white text-stone-700 hover:border-main hover:bg-stone-50',
          'cursor-pointer',
        ]"
        @click="selectTipoSolicitud(option.codigo)"
      >
        <span>{{ option.nombre }}</span>
        <span
          class="grid h-4 w-4 shrink-0 place-items-center rounded-full border"
          :class="
            model === option.codigo
              ? 'border-white bg-white/15'
              : 'border-stone-300 bg-white'
          "
          aria-hidden="true"
        >
          <Check
            v-if="model === option.codigo"
            class="h-3 w-3"
            stroke-width="3"
          />
        </span>
      </button>
    </div>

    <p v-else class="text-xs text-stone-500">No hay tipos disponibles.</p>

    <p v-if="error" class="text-sm font-medium text-danger">
      {{ error }}
    </p>
  </div>
</template>
