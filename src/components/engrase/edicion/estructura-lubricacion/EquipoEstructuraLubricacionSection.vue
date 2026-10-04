<script setup lang="ts">
import { computed, nextTick, shallowRef } from "vue";
import {
  ChevronDown,
  ChevronRight,
  Droplet,
  GitBranch,
  Network,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-vue-next";
import { construirArbolEstructura } from "@/stores/dbequipos/engrase/shared/estructuraLubricacion.tree";
import type { CatalogoActivo } from "@/stores/dbequipos/engrase/shared/estructuraLubricacion.types";
import type {
  CatalogoEstructura,
  ErrorValidacionEstructura,
  NodoEstructuraArbol,
  NodoEstructuraBorrador,
} from "@/stores/dbequipos/engrase/shared/estructuraLubricacion.draft.types";
import EstructuraLubricacionDeleteDialog from "./EstructuraLubricacionDeleteDialog.vue";
import EstructuraLubricacionNodeDrawer from "./EstructuraLubricacionNodeDrawer.vue";

const props = withDefaults(
  defineProps<{
    nodos: NodoEstructuraBorrador[];
    sistemas: CatalogoActivo[];
    subsistemas: CatalogoActivo[];
    aceites: CatalogoActivo[];
    errors: ErrorValidacionEstructura[];
    disabled: boolean;
    canRestoreDeletedNodes?: boolean;
  }>(),
  { canRestoreDeletedNodes: true },
);
const emit = defineEmits<{
  addRoot: [CatalogoEstructura, CatalogoEstructura | null];
  createRootSystem: [string, CatalogoEstructura | null];
  addChild: [string, CatalogoEstructura, CatalogoEstructura | null];
  createChildSubsystem: [string, string, CatalogoEstructura | null];
  updateNode: [
    string,
    CatalogoEstructura,
    CatalogoEstructura | null,
    string | null,
  ];
  createNode: [string, string, CatalogoEstructura | null, string | null];
  remove: [string];
  restore: [string];
}>();
type DrawerMode = "root" | "child" | "catalog" | "oil";
const drawer = shallowRef<{
  mode: DrawerMode;
  node: NodoEstructuraArbol | null;
} | null>(null);
const expanded = shallowRef<Set<string>>(new Set());
const nodeToDelete = shallowRef<NodoEstructuraArbol | null>(null);
const lastTrigger = shallowRef<HTMLElement | null>(null);
const tree = computed(() =>
  construirArbolEstructura(props.nodos, props.canRestoreDeletedNodes),
);
const activeNodes = computed(() =>
  props.nodos.filter((node) => node.estadoLocal !== "pendiente_eliminacion"),
);
const assignedOilsCount = computed(
  () => activeNodes.value.filter((node) => node.aceite !== null).length,
);
const systemsCount = computed(
  () =>
    activeNodes.value.filter(
      (node) => node.parentId === null && node.parentTempId === null,
    ).length,
);
const deleteScope = computed(() => {
  if (!nodeToDelete.value) return [];
  const flatten = (node: NodoEstructuraArbol): NodoEstructuraArbol[] => [
    node,
    ...node.hijos.flatMap(flatten),
  ];
  return flatten(nodeToDelete.value);
});
const drawerErrors = computed(() => {
  const localId = drawer.value?.node?.localId;
  return props.errors.filter((error) =>
    localId ? error.localId === localId : !error.localId,
  );
});
function name(node: NodoEstructuraArbol | NodoEstructuraBorrador): string {
  return node.sistema?.nombre ?? node.subsistema?.nombre ?? "Ubicación";
}
function open(
  mode: DrawerMode,
  node: NodoEstructuraArbol | null,
  event: Event,
): void {
  lastTrigger.value =
    event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
  drawer.value = { mode, node };
}
function closeOverlay(): void {
  drawer.value = null;
  nodeToDelete.value = null;
  nextTick(() => lastTrigger.value?.focus());
}
function openDeleteDialog(node: NodoEstructuraArbol, event: Event): void {
  nodeToDelete.value = node;
  lastTrigger.value =
    event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
}
function toggle(localId: string): void {
  const next = new Set(expanded.value);
  next.has(localId) ? next.delete(localId) : next.add(localId);
  expanded.value = next;
}
function toggleIfExpandable(node: NodoEstructuraArbol): void {
  if (node.hijos.length) toggle(node.localId);
}
function visibleDescendants(root: NodoEstructuraArbol): NodoEstructuraArbol[] {
  const result: NodoEstructuraArbol[] = [];
  const visit = (node: NodoEstructuraArbol): void => {
    result.push(node);
    if (expanded.value.has(node.localId)) node.hijos.forEach(visit);
  };
  if (expanded.value.has(root.localId)) root.hijos.forEach(visit);
  return result;
}
function errorsForNode(localId: string): ErrorValidacionEstructura[] {
  return props.errors.filter((error) => error.localId === localId);
}
type DrawerConfirm =
  | {
      mode: "root";
      sistema: CatalogoEstructura;
      aceite: CatalogoEstructura | null;
    }
  | {
      mode: "root-new-system";
      nombre: string;
      aceite: CatalogoEstructura | null;
    }
  | {
      mode: "child";
      parentLocalId: string;
      subsistema: CatalogoEstructura;
      aceite: CatalogoEstructura | null;
    }
  | {
      mode: "child-new-subsystem";
      parentLocalId: string;
      nombre: string;
      aceite: CatalogoEstructura | null;
    }
  | { mode: "oil"; localId: string; aceite: CatalogoEstructura | null }
  | { mode: "oil-new"; localId: string; nombre: string }
  | {
      mode: "catalog";
      localId: string;
      catalogo: CatalogoEstructura;
      aceite: CatalogoEstructura | null;
      aceiteNuevoNombre: string | null;
    }
  | {
      mode: "catalog-new";
      localId: string;
      nombre: string;
      aceite: CatalogoEstructura | null;
      aceiteNuevoNombre: string | null;
    };
function tieneErroresDelDrawer(input: DrawerConfirm): boolean {
  const fieldId =
    "localId" in input
      ? input.localId
      : "parentLocalId" in input
        ? input.parentLocalId
        : null;
  return props.errors.some(
    (error) => !error.localId || error.localId === fieldId,
  );
}
async function confirmDrawer(input: DrawerConfirm): Promise<void> {
  if (input.mode === "root") emit("addRoot", input.sistema, input.aceite);
  if (input.mode === "root-new-system")
    emit("createRootSystem", input.nombre, input.aceite);
  if (input.mode === "child")
    emit("addChild", input.parentLocalId, input.subsistema, input.aceite);
  if (input.mode === "child-new-subsystem")
    emit(
      "createChildSubsystem",
      input.parentLocalId,
      input.nombre,
      input.aceite,
    );
  if (input.mode === "catalog")
    emit(
      "updateNode",
      input.localId,
      input.catalogo,
      input.aceite,
      input.aceiteNuevoNombre,
    );
  if (input.mode === "catalog-new")
    emit(
      "createNode",
      input.localId,
      input.nombre,
      input.aceite,
      input.aceiteNuevoNombre,
    );
  await nextTick();
  if (!tieneErroresDelDrawer(input)) closeOverlay();
}
</script>

<template>
  <section class="rounded-lg border border-second-deep bg-white shadow-sm">
    <header
      class="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4"
    >
      <div class="flex min-w-0 items-start gap-2.5">
        <div
          class="grid min-h-10 min-w-10 place-items-center rounded-md bg-second text-main"
        >
          <Droplet class="h-5 w-5" aria-hidden="true" />
        </div>
        <div class="min-w-0">
          <h2 class="text-base font-bold text-gray-900">
            Estructura de lubricación
          </h2>

          <span class="sr-only">
            {{ activeNodes.length }} nodos · {{ assignedOilsCount }} con aceite
          </span>
          <div
            class="mt-2 flex flex-wrap gap-1.5 text-xs font-medium text-gray-700"
          >
            <span
              class="inline-flex items-center gap-1 rounded-md bg-second px-2 py-1"
            >
              <GitBranch class="h-3.5 w-3.5 text-main" aria-hidden="true" />
              {{ systemsCount }} sistemas
            </span>
          </div>
        </div>
      </div>
      <button
        type="button"
        :disabled="disabled"
        class="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-md bg-main px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        @click="open('root', null, $event)"
      >
        <Plus class="h-4 w-4" />Agregar sistema
      </button>
    </header>
    <div
      v-if="!activeNodes.length"
      class="grid place-items-center gap-2 p-8 text-center"
    >
      <Network class="h-6 w-6 text-gray-400" />
      <p class="text-sm font-semibold text-gray-700">
        Este equipo aún no tiene estructura de lubricación
      </p>
      <p class="text-xs text-gray-600">
        Agregue un sistema para registrar sus ubicaciones y aceites.
      </p>
      <button
        type="button"
        :disabled="disabled"
        class="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-md border border-second-deep px-3 text-xs font-semibold text-main disabled:cursor-not-allowed disabled:opacity-50"
        @click="open('root', null, $event)"
      >
        <Plus class="h-4 w-4" />Agregar sistema
      </button>
    </div>
    <ul
      v-else
      class="space-y-2 border-t border-second-deep p-2 sm:p-3"
      aria-label="Estructura de lubricación"
    >
      <li
        v-for="system in tree"
        :key="system.localId"
        class="overflow-hidden rounded-lg border border-second-deep bg-white"
        :class="{
          'border-gray-300 bg-gray-100 grayscale opacity-60':
            system.estadoLocal === 'pendiente_eliminacion',
        }"
      >
        <div
          class="flex min-h-14 cursor-pointer items-center gap-2 bg-second px-2 py-2 sm:px-3"
          @click="toggle(system.localId)"
        >
          <button
            v-if="system.estadoLocal !== 'pendiente_eliminacion'"
            type="button"
            class="grid min-h-9 min-w-9 cursor-pointer place-items-center rounded hover:bg-white"
            :aria-label="`${expanded.has(system.localId) ? 'Contraer' : 'Expandir'} ${name(system)}`"
            @click.stop="toggle(system.localId)"
          >
            <component
              :is="expanded.has(system.localId) ? ChevronDown : ChevronRight"
              class="h-4 w-4"
            />
          </button>
          <GitBranch class="h-5 w-5 shrink-0 text-main" aria-hidden="true" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-bold text-main">
              {{ name(system) }}
            </p>
            <p class="text-xs text-gray-600">
              {{
                system.aceite ? `Aceite: ${system.aceite.nombre}` : "Sin aceite"
              }}
            </p>
            <p
              v-if="system.estadoLocal === 'pendiente_eliminacion'"
              class="mt-0.5 text-xs font-semibold text-gray-500"
            >
              Pendiente de eliminación
            </p>
          </div>
          <span
            class="hidden rounded-md border border-main/15 bg-white/60 px-2 py-1 text-xs font-medium text-main sm:inline-flex"
          >
            {{ system.hijos.length }}
            {{ system.hijos.length === 1 ? "subsistema" : "subsistemas" }}
          </span>
          <button
            v-if="system.estadoLocal !== 'pendiente_eliminacion'"
            type="button"
            :disabled="disabled"
            class="grid min-h-9 min-w-9 cursor-pointer place-items-center rounded border border-second-deep bg-white disabled:cursor-not-allowed disabled:opacity-50"
            :aria-label="`Editar sistema ${name(system)}`"
            @click.stop="open('catalog', system, $event)"
          >
            <Pencil class="h-4 w-4" />
          </button>
          <button
            v-if="system.estadoLocal !== 'pendiente_eliminacion'"
            type="button"
            :disabled="disabled"
            class="grid min-h-9 min-w-9 cursor-pointer place-items-center rounded border border-danger/30 bg-white text-danger disabled:cursor-not-allowed disabled:opacity-50"
            :aria-label="`Eliminar sistema ${name(system)}`"
            @click.stop="openDeleteDialog(system, $event)"
          >
            <Trash2 class="h-4 w-4" />
          </button>
          <button
            v-else-if="canRestoreDeletedNodes"
            type="button"
            :disabled="disabled"
            class="grid min-h-9 min-w-9 cursor-pointer place-items-center rounded border border-gray-300 bg-white text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
            :aria-label="`Deshacer eliminación de ${name(system)}`"
            title="Deshacer eliminación"
            @click.stop="emit('restore', system.localId)"
          >
            <RotateCcw class="h-4 w-4" />
          </button>
        </div>
        <div
          v-if="expanded.has(system.localId)"
          class="relative space-y-1.5 p-2 pl-5 sm:pl-8"
        >
          <span
            class="absolute bottom-4 left-4 top-0 border-l border-dashed border-main/30"
            aria-hidden="true"
          />
          <div
            v-for="node in visibleDescendants(system)"
            :key="node.localId"
            class="relative flex min-h-12 cursor-pointer items-center gap-2 rounded-md border border-second-deep bg-white p-2 shadow-sm"
            :class="{
              'border-gray-300 bg-gray-100 grayscale opacity-60':
                node.estadoLocal === 'pendiente_eliminacion',
            }"
            :style="{
              marginLeft: `${Math.max(node.profundidad - 1, 0) * 12}px`,
            }"
            @click="toggleIfExpandable(node)"
          >
            <span
              class="absolute -left-4 top-1/2 w-4 border-t border-dashed border-main/30"
              aria-hidden="true"
            />
            <button
              v-if="node.hijos.length"
              type="button"
              class="grid min-h-8 min-w-8 cursor-pointer place-items-center rounded hover:bg-second"
              :aria-label="`${expanded.has(node.localId) ? 'Contraer' : 'Expandir'} ${name(node)}`"
              @click.stop="toggle(node.localId)"
            >
              <component
                :is="expanded.has(node.localId) ? ChevronDown : ChevronRight"
                class="h-4 w-4"
              />
            </button>
            <span v-else class="min-w-8" />
            <Network class="h-4 w-4 shrink-0 text-main" aria-hidden="true" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-main">
                {{ name(node) }}
              </p>
              <p class="text-xs text-gray-600">
                {{
                  node.aceite ? `Aceite: ${node.aceite.nombre}` : "Sin aceite"
                }}
              </p>
              <p
                v-if="node.estadoLocal === 'pendiente_eliminacion'"
                class="mt-0.5 text-xs font-semibold text-gray-500"
              >
                Pendiente de eliminación
              </p>
              <p
                v-for="error in errorsForNode(node.localId)"
                :key="`${error.codigo}-${error.mensaje}`"
                class="mt-0.5 text-xs font-medium text-danger"
              >
                {{ error.mensaje }}
              </p>
            </div>
            <div class="flex shrink-0 gap-1">
              <button
                v-if="node.estadoLocal !== 'pendiente_eliminacion'"
                type="button"
                :disabled="disabled"
                class="grid min-h-8 min-w-8 cursor-pointer place-items-center rounded border border-second-deep disabled:cursor-not-allowed disabled:opacity-50"
                :aria-label="`Editar subsistema ${name(node)}`"
                @click.stop="open('catalog', node, $event)"
              >
                <Pencil class="h-3.5 w-3.5" />
              </button>
              <button
                v-if="node.estadoLocal !== 'pendiente_eliminacion'"
                type="button"
                :disabled="disabled"
                class="grid min-h-8 min-w-8 cursor-pointer place-items-center rounded border border-second-deep disabled:cursor-not-allowed disabled:opacity-50"
                :aria-label="`Agregar subsistema a ${name(node)}`"
                @click.stop="open('child', node, $event)"
              >
                <Plus class="h-3.5 w-3.5" />
              </button>
              <button
                v-if="node.estadoLocal !== 'pendiente_eliminacion'"
                type="button"
                :disabled="disabled"
                class="grid min-h-8 min-w-8 cursor-pointer place-items-center rounded border border-danger/30 text-danger disabled:cursor-not-allowed disabled:opacity-50"
                :aria-label="`Eliminar estructura ${name(node)}`"
                @click.stop="openDeleteDialog(node, $event)"
              >
                <Trash2 class="h-3.5 w-3.5" />
              </button>
              <button
                v-else-if="canRestoreDeletedNodes"
                type="button"
                :disabled="disabled"
                class="grid min-h-8 min-w-8 cursor-pointer place-items-center rounded border border-gray-300 text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                :aria-label="`Deshacer eliminación de ${name(node)}`"
                title="Deshacer eliminación"
                @click.stop="emit('restore', node.localId)"
              >
                <RotateCcw class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <button
            v-if="system.estadoLocal !== 'pendiente_eliminacion'"
            type="button"
            :disabled="disabled"
            class="relative z-10 flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-md bg-second px-3 text-left text-xs font-semibold text-main hover:bg-second-deep/25 disabled:cursor-not-allowed disabled:opacity-50"
            :aria-label="`Agregar subsistema a ${name(system)}`"
            @click="open('child', system, $event)"
          >
            <Plus class="h-4 w-4" aria-hidden="true" />Agregar subsistema
          </button>
        </div>
      </li>
    </ul>
    <EstructuraLubricacionNodeDrawer
      v-if="drawer"
      :mode="drawer.mode"
      :node="drawer.node"
      :nodos="tree"
      :sistemas="sistemas"
      :subsistemas="subsistemas"
      :aceites="aceites"
      :errors="drawerErrors"
      @close="closeOverlay"
      @confirm="confirmDrawer"
    />
    <EstructuraLubricacionDeleteDialog
      v-if="nodeToDelete"
      :subarbol="deleteScope"
      @cancel="closeOverlay"
      @confirm="
        emit('remove', nodeToDelete.localId);
        closeOverlay();
      "
    />
  </section>
</template>
