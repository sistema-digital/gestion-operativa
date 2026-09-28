<script setup lang="ts">
import { nextTick, onMounted, useTemplateRef } from "vue";
import type { NodoEstructuraBorrador } from "@/stores/dbequipos/engrase/shared/estructuraLubricacion.draft.types";

const props = defineProps<{ subarbol: NodoEstructuraBorrador[] }>();
const emit = defineEmits<{ cancel: []; confirm: [] }>();
const cancelRef = useTemplateRef<HTMLButtonElement>("cancel");
const nodeName = (node: NodoEstructuraBorrador): string =>
  node.sistema?.nombre ?? node.subsistema?.nombre ?? "esta estructura";
const ruta = props.subarbol.map(nodeName).join(" > ");
const oilCount = props.subarbol.filter((node) => node.aceiteId !== null).length;
onMounted(() => nextTick(() => cancelRef.value?.focus()));
function onKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    emit("cancel");
    return;
  }
  if (event.key !== "Tab") return;
  const focusables = Array.from(
    (event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>(
      'button:not(:disabled), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => element.offsetParent !== null);
  const first = focusables[0];
  const last = focusables.at(-1);
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
</script>

<template>
  <Teleport to="body">
    <div
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
        <p v-if="ruta" class="mt-2 break-words text-xs font-medium text-main">
          {{ ruta }}
        </p>
        <div class="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            ref="cancel"
            type="button"
            class="min-h-11 cursor-pointer rounded-md border"
            @click="emit('cancel')"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="min-h-11 cursor-pointer rounded-md bg-danger text-white"
            @click="emit('confirm')"
          >
            Eliminar estructura
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>
