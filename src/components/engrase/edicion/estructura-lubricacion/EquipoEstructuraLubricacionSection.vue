<script setup lang="ts">
import { computed, nextTick, shallowRef } from "vue";
import {
  ChevronDown,
  ChevronRight,
  Droplet,
  GitBranch,
  MoveRight,
  Network,
  Plus,
  Trash2,
} from "lucide-vue-next";
import { construirArbolEstructura } from "@/stores/dbequipos/engrase/shared/estructuraLubricacion.tree";
import type { CatalogoActivo } from "@/stores/dbequipos/engrase/shared/estructuraLubricacion.types";
import type {
  ErrorValidacionEstructura,
  NodoEstructuraArbol,
  NodoEstructuraBorrador,
} from "@/stores/dbequipos/engrase/shared/estructuraLubricacion.draft.types";
import EstructuraLubricacionDeleteDialog from "./EstructuraLubricacionDeleteDialog.vue";
import EstructuraLubricacionNodeDrawer from "./EstructuraLubricacionNodeDrawer.vue";

const props = defineProps<{
  nodos: NodoEstructuraBorrador[];
  sistemas: CatalogoActivo[];
  subsistemas: CatalogoActivo[];
  aceites: CatalogoActivo[];
  errors: ErrorValidacionEstructura[];
  disabled: boolean;
}>();
const emit = defineEmits<{
  addRoot: [CatalogoActivo, CatalogoActivo | null];
  createRootSystem: [string, CatalogoActivo | null];
  addChild: [string, CatalogoActivo, CatalogoActivo | null];
  createChildSubsystem: [string, string, CatalogoActivo | null];
  updateOil: [string, CatalogoActivo | null];
  move: [string, string];
  remove: [string];
  restore: [string];
}>();
type DrawerMode = "root" | "child" | "oil" | "move";
const drawer = shallowRef<{
  mode: DrawerMode;
  node: NodoEstructuraArbol | null;
} | null>(null);
const expanded = shallowRef<Set<string>>(new Set());
const nodeToDelete = shallowRef<NodoEstructuraArbol | null>(null);
const lastTrigger = shallowRef<HTMLElement | null>(null);
const tree = computed(() => construirArbolEstructura(props.nodos));
const activeNodes = computed(() =>
  props.nodos.filter((node) => node.estadoLocal !== "pendiente_eliminacion"),
);
const assignedOilsCount = computed(
  () => activeNodes.value.filter((node) => node.aceiteId !== null).length,
);
const rows = computed(() => {
  const result: NodoEstructuraArbol[] = [];
  const visit = (node: NodoEstructuraArbol): void => {
    result.push(node);
    if (expanded.value.has(node.localId)) node.hijos.forEach(visit);
  };
  tree.value.forEach(visit);
  return result;
});
const deleteScope = computed(() => {
  if (!nodeToDelete.value) return [];
  const flatten = (node: NodoEstructuraArbol): NodoEstructuraArbol[] => [
    node,
    ...node.hijos.flatMap(flatten),
  ];
  return flatten(nodeToDelete.value);
});
const deletedNodes = computed(() =>
  props.nodos.filter((node) => node.estadoLocal === "pendiente_eliminacion"),
);
const errorsByNode = computed(() =>
  props.errors.reduce<Record<string, ErrorValidacionEstructura[]>>(
    (result, error) => {
      if (!error.localId) return result;
      (result[error.localId] ??= []).push(error);
      return result;
    },
    {},
  ),
);
const globalErrors = computed(() =>
  props.errors.filter((error) => !error.localId),
);
function name(node: NodoEstructuraArbol | NodoEstructuraBorrador): string {
  return node.sistema?.nombre ?? node.subsistema?.nombre ?? "Ubicación";
}
function movementOptions(node: NodoEstructuraArbol): NodoEstructuraArbol[] {
  const excluded = new Set<string>();
  const collect = (item: NodoEstructuraArbol): void => {
    excluded.add(item.localId);
    item.hijos.forEach(collect);
  };
  const flatten = (items: NodoEstructuraArbol[]): NodoEstructuraArbol[] =>
    items.flatMap((item) => [item, ...flatten(item.hijos)]);
  collect(node);
  return flatten(tree.value).filter(
    (item) =>
      item.estadoLocal !== "pendiente_eliminacion" &&
      !excluded.has(item.localId) &&
      item.id !== node.parentId &&
      item.tempId !== node.parentTempId,
  );
}
function canMove(node: NodoEstructuraArbol): boolean {
  return movementOptions(node).length > 0;
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
type DrawerConfirm =
  | { mode: "root"; sistema: CatalogoActivo; aceite: CatalogoActivo | null }
  | { mode: "root-new-system"; nombre: string; aceite: CatalogoActivo | null }
  | {
      mode: "child";
      parentLocalId: string;
      subsistema: CatalogoActivo;
      aceite: CatalogoActivo | null;
    }
  | {
      mode: "child-new-subsystem";
      parentLocalId: string;
      nombre: string;
      aceite: CatalogoActivo | null;
    }
  | { mode: "oil"; localId: string; aceite: CatalogoActivo | null }
  | { mode: "move"; localId: string; nuevoPadreLocalId: string };
function confirmDrawer(input: DrawerConfirm): void {
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
  if (input.mode === "oil") emit("updateOil", input.localId, input.aceite);
  if (input.mode === "move")
    emit("move", input.localId, input.nuevoPadreLocalId);
  closeOverlay();
}
</script>

<template>
  <section class="rounded-lg border border-second-deep bg-white shadow-sm">
    <header
      class="flex flex-wrap items-center justify-between gap-3 border-b border-second-deep p-3"
    >
      <div>
        <h2 class="text-base font-bold text-gray-900">
          Estructura de lubricación
        </h2>
        <p class="text-xs text-gray-500">
          Organice las ubicaciones del equipo y asigne aceite cuando
          corresponda. {{ activeNodes.length }} nodos ·
          {{ assignedOilsCount }} con aceite
        </p>
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
    <p
      v-for="error in globalErrors"
      :key="error.codigo"
      class="m-3 rounded-md bg-danger-bg p-2 text-xs text-danger"
      role="alert"
    >
      {{ error.mensaje }}
    </p>
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
    <ul v-else class="space-y-1 p-2" aria-label="Estructura de lubricación">
      <li
        v-for="node in rows"
        :key="node.localId"
        class="flex min-h-11 items-center gap-2 rounded-md border border-second-deep p-2"
        :style="{ marginLeft: `${Math.min(node.profundidad, 4) * 12}px` }"
        :title="node.ruta"
      >
        <button
          v-if="node.hijos.length"
          type="button"
          class="grid min-h-9 min-w-9 cursor-pointer place-items-center rounded hover:bg-second"
          :aria-label="`${expanded.has(node.localId) ? 'Contraer' : 'Expandir'} ${name(node)}`"
          @click="toggle(node.localId)"
        >
          <component
            :is="expanded.has(node.localId) ? ChevronDown : ChevronRight"
            class="h-4 w-4"
          /></button
        ><span v-else class="min-w-9" /><component
          :is="node.profundidad === 0 ? GitBranch : Network"
          class="h-4 w-4 shrink-0 text-main"
        />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold text-main">
            {{ name(node) }}
          </p>
          <p class="text-xs text-gray-600">
            {{ node.aceite ? `Aceite: ${node.aceite.nombre}` : "Sin aceite"
            }}<span
              v-if="
                node.sistema?.activo === false ||
                node.subsistema?.activo === false ||
                node.aceite?.activo === false
              "
            >
              · Inactivo — conservado en este equipo</span
            >
          </p>
          <p
            v-for="error in errorsByNode[node.localId]"
            :key="error.codigo"
            class="mt-1 text-xs text-danger"
            role="alert"
          >
            {{ error.mensaje }}
          </p>
        </div>
        <div class="flex shrink-0 gap-1">
          <button
            type="button"
            :disabled="disabled"
            class="grid min-h-9 min-w-9 cursor-pointer place-items-center rounded border border-second-deep disabled:cursor-not-allowed"
            :aria-label="`Agregar subsistema a ${name(node)}`"
            @click="open('child', node, $event)"
          >
            <Plus class="h-4 w-4" /></button
          ><button
            type="button"
            :disabled="disabled"
            class="grid min-h-9 min-w-9 cursor-pointer place-items-center rounded border border-second-deep disabled:cursor-not-allowed"
            :aria-label="`${node.aceite ? 'Cambiar' : 'Asignar'} aceite de ${name(node)}`"
            @click="open('oil', node, $event)"
          >
            <Droplet class="h-4 w-4" /></button
          ><button
            v-if="node.profundidad > 0"
            type="button"
            :disabled="disabled || !canMove(node)"
            class="grid min-h-9 min-w-9 cursor-pointer place-items-center rounded border border-second-deep disabled:cursor-not-allowed"
            :aria-label="`Mover ${name(node)}`"
            :title="
              canMove(node)
                ? 'Mover a otro padre'
                : 'No hay otro padre válido para este subsistema'
            "
            @click="open('move', node, $event)"
          >
            <MoveRight class="h-4 w-4" /></button
          ><button
            type="button"
            :disabled="disabled"
            class="grid min-h-9 min-w-9 cursor-pointer place-items-center rounded border border-danger/30 text-danger disabled:cursor-not-allowed"
            :aria-label="`Eliminar estructura ${name(node)}`"
            @click="openDeleteDialog(node, $event)"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      </li>
    </ul>
    <section
      v-if="deletedNodes.length"
      class="m-2 rounded-md border border-warning/30 bg-warning/10 p-2"
      aria-label="Cambios eliminados pendientes"
    >
      <p class="text-xs font-semibold text-gray-700">
        Eliminaciones pendientes de guardar
      </p>
      <div class="mt-2 flex flex-wrap gap-2">
        <button
          v-for="node in deletedNodes"
          :key="node.localId"
          type="button"
          :disabled="disabled"
          class="cursor-pointer rounded border border-warning/40 bg-white px-2 py-1 text-xs font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          @click="emit('restore', node.localId)"
        >
          Deshacer: {{ name(node) }}
        </button>
      </div>
    </section>
    <EstructuraLubricacionNodeDrawer
      v-if="drawer"
      :mode="drawer.mode"
      :node="drawer.node"
      :sistemas="sistemas"
      :subsistemas="subsistemas"
      :aceites="aceites"
      :movement-options="drawer.node ? movementOptions(drawer.node) : []"
      :errors="
        drawer.node ? (errorsByNode[drawer.node.localId] ?? []) : globalErrors
      "
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
