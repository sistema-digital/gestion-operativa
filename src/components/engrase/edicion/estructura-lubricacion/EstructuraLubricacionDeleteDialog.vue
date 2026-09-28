<script setup lang="ts">
import { computed, nextTick, onMounted, useTemplateRef } from "vue";
import type { NodoEstructuraArbol } from "@/stores/dbequipos/engrase/shared/estructuraLubricacion.draft.types";

const props = defineProps<{ subarbol: NodoEstructuraArbol[] }>();
const emit = defineEmits<{ cancel: []; confirm: [] }>();
const cancelRef = useTemplateRef<HTMLButtonElement>("cancel");
const nodeName = (node: NodoEstructuraArbol): string =>
  node.sistema?.nombre ?? node.subsistema?.nombre ?? "estructura";
const oilCount = computed(
  () => props.subarbol.filter((node) => node.aceiteId !== null).length,
);
const descendantRoutes = computed(() =>
  props.subarbol.slice(1).map((node) => node.ruta),
);
onMounted(() => nextTick(() => cancelRef.value?.focus()));
function onKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    emit("cancel");
    return;
  }
  if (event.key !== "Tab") return;
  const buttons = Array.from(
    (event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>(
      "button:not(:disabled)",
    ),
  );
  const first = buttons[0];
  const last = buttons.at(-1);
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  }
  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
</script>

<template>
  <Teleport to="body"
    ><div
      class="fixed inset-0 z-[60] grid place-items-center bg-main-dark/50 p-4"
      @click.self="emit('cancel')"
    >
      <section
        class="w-full max-w-md rounded-lg bg-white p-4"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="estructura-delete-title"
        @keydown="onKeydown"
      >
        <h3 id="estructura-delete-title" class="text-base font-bold">
          ¿Eliminar {{ subarbol[0] ? nodeName(subarbol[0]) : "estructura" }}?
        </h3>
        <p class="mt-2 text-xs text-gray-600">
          Se eliminarán {{ subarbol.length }} nodos de la estructura y
          {{ oilCount }} asignaciones de aceite.
        </p>
        <ul
          v-if="descendantRoutes.length"
          class="mt-2 list-disc break-words pl-4 text-xs text-gray-600"
        >
          <li v-for="route in descendantRoutes" :key="route">{{ route }}</li>
        </ul>
        <div class="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            ref="cancel"
            type="button"
            class="min-h-11 cursor-pointer rounded-md border"
            @click="emit('cancel')"
          >
            Cancelar</button
          ><button
            type="button"
            class="min-h-11 cursor-pointer rounded-md bg-danger text-white"
            @click="emit('confirm')"
          >
            Eliminar estructura
          </button>
        </div>
      </section>
    </div></Teleport
  >
</template>
