<script setup lang="ts">
import { computed } from "vue";
import { GitBranch, Network, SquarePen } from "lucide-vue-next";
import type { EquipoAceiteDetalle } from "@/stores/dbequipos/engrase/filtrosEngrase.types";

type GrupoAceitesSubsistema = {
  nombre: string;
  aceites: EquipoAceiteDetalle[];
};
type GrupoAceitesSistema = {
  nombre: string;
  aceites: EquipoAceiteDetalle[];
  subsistemas: GrupoAceitesSubsistema[];
};

const props = defineProps<{
  aceites: EquipoAceiteDetalle[];
  canEdit: boolean;
}>();
const emit = defineEmits<{ edit: [] }>();

const aceitesPorSistema = computed<GrupoAceitesSistema[]>(() => {
  const sistemas = new Map<
    string,
    {
      nombre: string;
      aceites: EquipoAceiteDetalle[];
      subsistemas: Map<string, GrupoAceitesSubsistema>;
    }
  >();

  props.aceites.forEach((aceite) => {
    const sistema = sistemas.get(aceite.sistema) ?? {
      nombre: aceite.sistema,
      aceites: [],
      subsistemas: new Map<string, GrupoAceitesSubsistema>(),
    };

    if (aceite.subsistema === null) {
      sistema.aceites.push(aceite);
    } else {
      const subsistema = sistema.subsistemas.get(aceite.subsistema) ?? {
        nombre: aceite.subsistema,
        aceites: [],
      };

      subsistema.aceites.push(aceite);
      sistema.subsistemas.set(aceite.subsistema, subsistema);
    }

    sistemas.set(aceite.sistema, sistema);
  });

  return [...sistemas.values()].map((sistema) => ({
    nombre: sistema.nombre,
    aceites: sistema.aceites,
    subsistemas: [...sistema.subsistemas.values()],
  }));
});

function textoAceites(aceites: readonly EquipoAceiteDetalle[]): string {
  if (!aceites.length) return "Sin aceite";

  const etiqueta = aceites.length === 1 ? "Aceite" : "Aceites";
  return `${etiqueta}: ${aceites.map((aceite) => aceite.aceite).join(", ")}`;
}
</script>

<template>
  <section class="pt-3">
    <div class="mb-3 flex items-center justify-between gap-2">
      <p class="text-xs text-gray-500">
        Aceites asignados: <b class="text-main">{{ aceites.length }}</b>
      </p>
      <button
        v-if="canEdit"
        type="button"
        class="cursor-pointer rounded-md border border-gray-200 p-1 text-main transition hover:border-main/40 hover:bg-main/10"
        aria-label="Editar estructura de lubricación"
        title="Editar estructura de lubricación"
        @click="emit('edit')"
      >
        <SquarePen class="h-4 w-4" />
      </button>
    </div>
    <p v-if="!aceites.length" class="p-4 text-center text-xs text-gray-500">
      Sin aceites asignados en la estructura de lubricación.
    </p>
    <ul v-else class="space-y-2" aria-label="Estructura de lubricación">
      <li
        v-for="sistema in aceitesPorSistema"
        :key="sistema.nombre"
        class="overflow-hidden rounded-lg border border-second-deep bg-white"
      >
        <div
          class="flex min-h-14 items-center gap-2 bg-second px-2 py-2 sm:px-3"
        >
          <GitBranch class="h-5 w-5 shrink-0 text-main" aria-hidden="true" />
          <div class="min-w-0">
            <p class="truncate text-sm font-bold text-main">
              {{ sistema.nombre }}
            </p>
            <p class="text-xs text-gray-600">
              {{ textoAceites(sistema.aceites) }}
            </p>
          </div>
        </div>
        <div
          v-if="sistema.subsistemas.length"
          class="relative space-y-1.5 p-2 pl-5 sm:pl-8"
        >
          <span
            class="absolute bottom-4 left-4 top-0 border-l border-dashed border-main/30"
            aria-hidden="true"
          />
          <article
            v-for="subsistema in sistema.subsistemas"
            :key="subsistema.nombre"
            class="relative flex min-h-12 items-center gap-2 rounded-md border border-second-deep bg-white p-2 shadow-sm"
          >
            <span
              class="absolute -left-4 top-1/2 w-4 border-t border-dashed border-main/30"
              aria-hidden="true"
            />
            <Network class="h-4 w-4 shrink-0 text-main" aria-hidden="true" />
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-main">
                {{ subsistema.nombre }}
              </p>
              <p class="text-xs text-gray-600">
                {{ textoAceites(subsistema.aceites) }}
              </p>
            </div>
          </article>
        </div>
      </li>
    </ul>
  </section>
</template>
