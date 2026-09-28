<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { construirArbolEstructura } from "@/stores/dbequipos/engrase/shared/estructuraLubricacion.tree";
import type {
  NodoEstructuraArbol,
  NodoEstructuraBorrador,
} from "@/stores/dbequipos/engrase/shared/estructuraLubricacion.draft.types";
import EstructuraLubricacionNodeRow from "./EstructuraLubricacionNodeRow.vue";

type EstructuraValidationError = { mensaje: string; fieldId?: string };

const props = defineProps<{
  nodos: NodoEstructuraBorrador[];
  disabled: boolean;
  errorsByNode: Record<string, EstructuraValidationError[]>;
}>();
const emit = defineEmits<{
  action: [
    action: "add-child" | "assign-oil" | "change-oil" | "remove-oil" | "delete",
    node: NodoEstructuraArbol,
    opener: HTMLElement,
  ];
}>();
const expanded = shallowRef<Set<string>>(new Set());
const tree = computed(() => construirArbolEstructura(props.nodos));
const rows = computed(() => {
  const result: NodoEstructuraArbol[] = [];
  const visit = (node: NodoEstructuraArbol): void => {
    result.push(node);
    if (expanded.value.has(node.localId)) node.hijos.forEach(visit);
  };
  tree.value.forEach(visit);
  return result;
});
function toggle(localId: string): void {
  const next = new Set(expanded.value);
  next.has(localId) ? next.delete(localId) : next.add(localId);
  expanded.value = next;
}
</script>

<template>
  <ul class="p-2" aria-label="Árbol de estructura de lubricación">
    <EstructuraLubricacionNodeRow
      v-for="node in rows"
      :key="node.localId"
      :node="node"
      :expanded="expanded.has(node.localId)"
      :disabled="disabled"
      :errors="errorsByNode[node.localId] ?? []"
      @toggle="toggle"
      @action="
        (action, target, opener) => emit('action', action, target, opener)
      "
    />
  </ul>
</template>
