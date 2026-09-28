<script setup lang="ts">
import { computed, shallowRef } from "vue";
import {
  ChevronDown,
  ChevronRight,
  Droplet,
  Ellipsis,
  FolderTree,
  GitBranch,
  Plus,
  Trash2,
} from "lucide-vue-next";
import type { NodoEstructuraArbol } from "@/stores/dbequipos/engrase/shared/estructuraLubricacion.draft.types";

type EstructuraValidationError = { mensaje: string; fieldId?: string };

const props = defineProps<{
  node: NodoEstructuraArbol;
  expanded: boolean;
  disabled: boolean;
  errors: EstructuraValidationError[];
}>();
const emit = defineEmits<{
  toggle: [localId: string];
  action: [
    action: "add-child" | "assign-oil" | "change-oil" | "remove-oil" | "delete",
    node: NodoEstructuraArbol,
    opener: HTMLElement,
  ];
}>();

const menuOpen = shallowRef(false);
const label = computed(
  () =>
    props.node.sistema?.nombre ?? props.node.subsistema?.nombre ?? "Ubicación",
);
const hasInactiveCatalog = computed(() =>
  [props.node.sistema, props.node.subsistema, props.node.aceite].some(
    (catalogo) => catalogo !== null && !catalogo.activo,
  ),
);
const indent = computed(() => Math.min(props.node.profundidad, 5) * 12);

function choose(
  action: "add-child" | "assign-oil" | "change-oil" | "remove-oil" | "delete",
  event: MouseEvent,
): void {
  menuOpen.value = false;
  emit("action", action, props.node, event.currentTarget as HTMLElement);
}
function closeMenu(): void {
  menuOpen.value = false;
}
function onMenuKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") closeMenu();
}
</script>

<template>
  <li
    class="mb-1 flex min-h-11 items-center gap-2 rounded-md border border-second-deep bg-white p-2"
    :style="{ marginLeft: `${indent}px` }"
    :title="node.ruta"
  >
    <button
      v-if="node.hijos.length"
      type="button"
      class="grid h-8 w-8 cursor-pointer place-items-center rounded hover:bg-second"
      :aria-label="`${expanded ? 'Contraer' : 'Expandir'} ${label}`"
      @click="emit('toggle', node.localId)"
    >
      <component :is="expanded ? ChevronDown : ChevronRight" class="h-4 w-4" />
    </button>
    <span v-else class="w-8" aria-hidden="true" />
    <FolderTree
      v-if="node.sistemaId !== null"
      class="h-4 w-4 shrink-0 text-main"
      aria-hidden="true"
    />
    <GitBranch
      v-else
      class="h-4 w-4 shrink-0 text-gray-600"
      aria-hidden="true"
    />
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-semibold text-main">{{ label }}</p>
      <p class="text-xs text-gray-600">
        {{ node.aceite ? `Aceite: ${node.aceite.nombre}` : "Sin aceite" }}
        <span v-if="hasInactiveCatalog" class="ml-1 text-warning"
          >· Catálogo inactivo</span
        >
      </p>
      <p
        v-for="error in errors"
        :key="error.mensaje"
        class="mt-1 text-xs text-danger"
        role="alert"
      >
        {{ error.mensaje }}
      </p>
    </div>
    <div class="relative">
      <button
        type="button"
        :disabled="disabled"
        class="grid min-h-9 min-w-9 cursor-pointer place-items-center rounded border border-second-deep disabled:cursor-not-allowed disabled:opacity-50"
        :aria-expanded="menuOpen"
        :aria-label="`Acciones para ${label}`"
        @click="menuOpen = !menuOpen"
      >
        <Ellipsis class="h-4 w-4" aria-hidden="true" />
      </button>
      <div
        v-if="menuOpen"
        class="fixed inset-x-3 bottom-3 z-20 grid rounded-lg border border-second-deep bg-white p-2 shadow-xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:mt-1 sm:min-w-52 sm:rounded-md sm:p-1"
        role="group"
        :aria-label="`Acciones de ${label}`"
        @keydown="onMenuKeydown"
      >
        <button
          type="button"
          class="flex min-h-9 cursor-pointer items-center gap-2 rounded px-2 text-left text-xs hover:bg-second"
          @click="choose('add-child', $event)"
        >
          <Plus class="h-4 w-4" aria-hidden="true" />Agregar subsistema
        </button>
        <button
          v-if="node.aceite === null"
          type="button"
          class="flex min-h-9 cursor-pointer items-center gap-2 rounded px-2 text-left text-xs hover:bg-second"
          @click="choose('assign-oil', $event)"
        >
          <Droplet class="h-4 w-4" aria-hidden="true" />Asignar aceite
        </button>
        <template v-else>
          <button
            type="button"
            class="flex min-h-9 cursor-pointer items-center gap-2 rounded px-2 text-left text-xs hover:bg-second"
            @click="choose('change-oil', $event)"
          >
            <Droplet class="h-4 w-4" aria-hidden="true" />Cambiar aceite
          </button>
          <button
            type="button"
            class="flex min-h-9 cursor-pointer items-center gap-2 rounded px-2 text-left text-xs hover:bg-second"
            @click="choose('remove-oil', $event)"
          >
            <Droplet class="h-4 w-4" aria-hidden="true" />Quitar aceite
          </button>
        </template>
        <button
          type="button"
          class="flex min-h-9 cursor-pointer items-center gap-2 rounded px-2 text-left text-xs text-danger hover:bg-danger-bg"
          @click="choose('delete', $event)"
        >
          <Trash2 class="h-4 w-4" aria-hidden="true" />Eliminar estructura
        </button>
      </div>
    </div>
  </li>
</template>
