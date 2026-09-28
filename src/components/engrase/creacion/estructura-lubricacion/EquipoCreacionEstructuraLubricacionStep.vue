<script setup lang="ts">
import { computed, nextTick, shallowRef, useTemplateRef } from "vue";
import { GitBranch, Plus } from "lucide-vue-next";
import { obtenerSubarbolActivo } from "@/stores/dbequipos/engrase/shared/estructuraLubricacion.draft";
import type { CatalogoActivo } from "@/stores/dbequipos/engrase/shared/estructuraLubricacion.types";
import type {
  NodoEstructuraArbol,
  NodoEstructuraBorrador,
} from "@/stores/dbequipos/engrase/shared/estructuraLubricacion.draft.types";
import EstructuraLubricacionDeleteDialog from "./EstructuraLubricacionDeleteDialog.vue";
import EstructuraLubricacionNodeDrawer from "./EstructuraLubricacionNodeDrawer.vue";
import EstructuraLubricacionTree from "./EstructuraLubricacionTree.vue";

type DrawerMode = "root" | "child" | "oil";
type EstructuraValidationError = { mensaje: string; fieldId?: string };
const props = defineProps<{
  nodos: NodoEstructuraBorrador[];
  sistemas: CatalogoActivo[];
  subsistemas: CatalogoActivo[];
  aceites: CatalogoActivo[];
  disabled: boolean;
  errors: EstructuraValidationError[];
}>();
const emit = defineEmits<{
  addRoot: [sistema: CatalogoActivo, aceite: CatalogoActivo | null];
  addChild: [
    parentLocalId: string,
    subsistema: CatalogoActivo,
    aceite: CatalogoActivo | null,
  ];
  updateOil: [localId: string, aceite: CatalogoActivo | null];
  remove: [localId: string];
}>();
const drawer = shallowRef<{
  mode: DrawerMode;
  node: NodoEstructuraArbol | null;
} | null>(null);
const pendingDeleteId = shallowRef<string | null>(null);
const lastOpener = shallowRef<HTMLElement | null>(null);
const opener = useTemplateRef<HTMLButtonElement>("addRoot");
const deleteScope = computed(() =>
  pendingDeleteId.value
    ? obtenerSubarbolActivo(props.nodos, pendingDeleteId.value)
    : [],
);
const globalErrors = computed(() =>
  props.errors.filter((error) => error.fieldId === undefined),
);
const drawerErrors = computed(() => {
  const localId = drawer.value?.node?.localId;
  return props.errors.filter(
    (error) => error.fieldId === undefined || error.fieldId === localId,
  );
});
const nodeErrors = computed(() =>
  props.errors.reduce<Record<string, EstructuraValidationError[]>>(
    (errorsByNode, error) => {
      if (error.fieldId) (errorsByNode[error.fieldId] ??= []).push(error);
      return errorsByNode;
    },
    {},
  ),
);
function openRoot(event: MouseEvent): void {
  lastOpener.value = event.currentTarget as HTMLElement;
  drawer.value = { mode: "root", node: null };
}
function restoreFocus(): void {
  nextTick(() => (lastOpener.value ?? opener.value)?.focus());
}
function closeDrawer(): void {
  drawer.value = null;
  restoreFocus();
}
function handleAction(
  action: "add-child" | "assign-oil" | "change-oil" | "remove-oil" | "delete",
  node: NodoEstructuraArbol,
  actionOpener: HTMLElement,
): void {
  lastOpener.value = actionOpener;
  if (action === "delete") {
    pendingDeleteId.value = node.localId;
    return;
  }
  if (action === "remove-oil") {
    emit("updateOil", node.localId, null);
    return;
  }
  drawer.value = { mode: action === "add-child" ? "child" : "oil", node };
}
function saveRoot(
  sistema: CatalogoActivo,
  aceite: CatalogoActivo | null,
): void {
  emit("addRoot", sistema, aceite);
  closeDrawer();
}
function saveChild(
  parentLocalId: string,
  subsistema: CatalogoActivo,
  aceite: CatalogoActivo | null,
): void {
  emit("addChild", parentLocalId, subsistema, aceite);
  closeDrawer();
}
function saveOil(localId: string, aceite: CatalogoActivo | null): void {
  emit("updateOil", localId, aceite);
  closeDrawer();
}
function confirmDelete(): void {
  if (pendingDeleteId.value) emit("remove", pendingDeleteId.value);
  pendingDeleteId.value = null;
  restoreFocus();
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
          Defina los sistemas del equipo y, si corresponde, el aceite de cada
          ubicación. Opcional · {{ nodos.length }} nodos
        </p>
      </div>
      <button
        ref="addRoot"
        type="button"
        :disabled="disabled"
        class="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-md bg-main px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        @click="openRoot"
      >
        <Plus class="h-4 w-4" aria-hidden="true" />Agregar sistema
      </button>
    </header>
    <div v-if="globalErrors.length" class="m-3 grid gap-1" aria-live="polite">
      <p
        v-for="error in globalErrors"
        :key="error.mensaje"
        class="rounded bg-danger-bg p-2 text-xs text-danger"
        role="alert"
      >
        {{ error.mensaje }}
      </p>
    </div>
    <div
      v-if="!nodos.length"
      class="grid place-items-center gap-2 p-8 text-center"
    >
      <GitBranch class="h-6 w-6 text-gray-400" aria-hidden="true" />
      <p class="text-sm font-semibold text-gray-700">
        Aún no hay estructura de lubricación
      </p>
      <p class="text-xs text-gray-600">
        Agregue un sistema para comenzar a organizar las ubicaciones de
        lubricación.
      </p>
      <button
        type="button"
        :disabled="disabled"
        class="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-md border border-second-deep px-3 text-xs font-semibold text-main disabled:cursor-not-allowed disabled:opacity-50"
        @click="openRoot"
      >
        <Plus class="h-4 w-4" aria-hidden="true" />Agregar sistema
      </button>
    </div>
    <EstructuraLubricacionTree
      v-else
      :nodos="nodos"
      :disabled="disabled"
      :errors-by-node="nodeErrors"
      @action="handleAction"
    />
  </section>
  <EstructuraLubricacionNodeDrawer
    v-if="drawer"
    :mode="drawer.mode"
    :node="drawer.node"
    :sistemas="sistemas"
    :subsistemas="subsistemas"
    :aceites="aceites"
    :errors="drawerErrors"
    @close="closeDrawer"
    @save-root="saveRoot"
    @save-child="saveChild"
    @save-oil="saveOil"
  />
  <EstructuraLubricacionDeleteDialog
    v-if="pendingDeleteId"
    :subarbol="deleteScope"
    @cancel="
      pendingDeleteId = null;
      restoreFocus();
    "
    @confirm="confirmDelete"
  />
</template>
