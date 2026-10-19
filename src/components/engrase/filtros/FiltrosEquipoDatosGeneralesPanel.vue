<script setup lang="ts">
import { LoaderCircle } from "lucide-vue-next";
import type { EquipoDetalleFull } from "@/stores/dbequipos/engrase/filtrosEngrase.types";

defineProps<{
  detalle: EquipoDetalleFull | null;
  loading: boolean;
  error: string | null;
}>();

function mostrarValor(value: string | number | null): string {
  if (value === null) return "No registrado";
  if (typeof value === "string" && !value.trim()) return "--";
  return String(value);
}
</script>

<template>
  <section
    id="panel-datos-generales-equipo"
    class="pt-3"
    role="tabpanel"
    aria-labelledby="tab-datos-generales-equipo"
    :aria-busy="loading"
  >
    <div
      v-if="loading"
      class="flex min-h-32 items-center justify-center gap-2 p-4 text-xs text-gray-500"
      role="status"
    >
      <LoaderCircle class="h-4 w-4 animate-spin text-main" aria-hidden="true" />
      Cargando datos generales…
    </div>
    <p
      v-else-if="error"
      class="rounded-md border border-danger/30 bg-danger-bg p-3 text-xs text-danger"
      role="alert"
    >
      {{ error }}
    </p>
    <p
      v-else-if="!detalle"
      class="rounded-md bg-gray-50 p-3 text-xs text-gray-500"
    >
      Seleccione una tarjeta de equipo para consultar sus datos generales.
    </p>
    <div v-else class="space-y-4">
      <dl class="grid gap-x-4 gap-y-3 text-xs sm:grid-cols-2">
        <div>
          <dt class="text-gray-500">Número de equipo</dt>
          <dd class="mt-0.5 font-mono font-semibold text-main">
            {{ detalle.numero_equipo }}
          </dd>
        </div>
        <div>
          <dt class="text-gray-500">Tipo</dt>
          <dd class="mt-0.5 font-semibold text-gray-700">{{ detalle.tipo }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">Marca</dt>
          <dd class="mt-0.5 font-semibold text-gray-700">
            {{ mostrarValor(detalle.marca) }}
          </dd>
        </div>
        <div>
          <dt class="text-gray-500">Modelo</dt>
          <dd class="mt-0.5 font-semibold text-gray-700">
            {{ mostrarValor(detalle.modelo) }}
          </dd>
        </div>
        <div>
          <dt class="text-gray-500">Tenencia</dt>
          <dd class="mt-0.5 font-semibold text-gray-700">
            {{ mostrarValor(detalle.tenencia) }}
          </dd>
        </div>
        <div>
          <dt class="text-gray-500">Combustible</dt>
          <dd class="mt-0.5 font-semibold text-gray-700">
            {{ mostrarValor(detalle.combustible) }}
          </dd>
        </div>
        <div>
          <dt class="text-gray-500">Fecha de llegada</dt>
          <dd class="mt-0.5 font-semibold text-gray-700">
            {{ mostrarValor(detalle.fecha_llegada) }}
          </dd>
        </div>
        <div>
          <dt class="text-gray-500">Potencia</dt>
          <dd class="mt-0.5 font-semibold text-gray-700">
            {{
              detalle.potencia_cv === null
                ? "No registrado"
                : `${detalle.potencia_cv} CV`
            }}
          </dd>
        </div>
        <div>
          <dt class="text-gray-500">Consumo base</dt>
          <dd class="mt-0.5 font-semibold text-gray-700">
            {{
              detalle.consumo_base_gal_h === null
                ? "No registrado"
                : `${detalle.consumo_base_gal_h} gal/h`
            }}
          </dd>
        </div>
      </dl>
      <div>
        <p class="text-xs text-gray-500">Etapas</p>
        <div class="mt-1.5 flex flex-wrap gap-1.5">
          <span
            v-for="etapa in detalle.etapas"
            :key="etapa"
            class="rounded-full bg-main/10 px-2 py-1 text-xs font-semibold text-main"
          >
            {{ etapa }}
          </span>
          <span v-if="!detalle.etapas.length" class="text-xs text-gray-500">
            Sin etapas registradas
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
