<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, useTemplateRef } from "vue";
import { Info, X } from "lucide-vue-next";
import type {
  CatalogoSubsistemaGuardarInput,
  CatalogoSubsistemaItem,
} from "@/stores/dbequipos/engrase/catalogo/subsistemasCatalogo.types";

const props = defineProps<{
  original: CatalogoSubsistemaItem;
  draft: CatalogoSubsistemaGuardarInput;
  saving: boolean;
}>();
const emit = defineEmits<{ cancel: []; confirm: [] }>();
const dialogRef = useTemplateRef<HTMLElement>("dialog");
const changes = computed(() => [
  ...(props.original.nombre !== props.draft.nombre.trim()
    ? [
        {
          label: "Nombre",
          before: props.original.nombre,
          after: props.draft.nombre.trim(),
        },
      ]
    : []),
  ...(props.original.activo !== props.draft.activo
    ? [
        {
          label: "Estado",
          before: props.original.activo ? "Activo" : "Desactivado",
          after: props.draft.activo ? "Activo" : "Desactivado",
        },
      ]
    : []),
]);
let previousFocus: HTMLElement | null = null;
function keydown(event: KeyboardEvent): void {
  if (event.key === "Escape" && !props.saving) {
    event.preventDefault();
    emit("cancel");
    return;
  }
  if (event.key !== "Tab" || !dialogRef.value) return;
  const controls = Array.from(
    dialogRef.value.querySelectorAll<HTMLButtonElement>(
      "button:not([disabled])",
    ),
  );
  const first = controls[0];
  const last = controls.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}
onMounted(() => {
  previousFocus =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  window.addEventListener("keydown", keydown);
  requestAnimationFrame(() =>
    dialogRef.value?.querySelector<HTMLButtonElement>("[data-cancel]")?.focus(),
  );
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", keydown);
  previousFocus?.focus();
});
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[80] grid place-items-center bg-main-dark/55 p-4"
      @click.self="!saving && emit('cancel')"
    >
      <section
        ref="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="subsistema-confirm-title"
        :aria-busy="saving"
        class="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl"
      >
        <header
          class="flex items-center justify-between border-b border-gray-200 p-4"
        >
          <h2
            id="subsistema-confirm-title"
            class="text-base font-bold text-main"
          >
            Confirmar actualización
          </h2>
          <button
            type="button"
            :disabled="saving"
            class="grid min-h-11 min-w-11 place-items-center rounded-md"
            :class="
              saving
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer hover:bg-gray-100'
            "
            aria-label="Cerrar confirmación"
            @click="emit('cancel')"
          >
            <X class="h-4 w-4" />
          </button>
        </header>
        <div class="space-y-4 p-4">
          <div
            class="flex gap-3 rounded-md border border-main/25 bg-main/5 p-3 text-sm text-main"
          >
            <Info class="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Esta actualización se reflejará en
              <strong
                >{{ original.impacto.totalEquipos }}
                {{
                  original.impacto.totalEquipos === 1 ? "equipo" : "equipos"
                }}</strong
              >.
            </p>
          </div>
          <dl class="overflow-hidden rounded-md border border-gray-200 text-xs">
            <template v-for="change in changes" :key="change.label"
              ><div
                class="grid grid-cols-[80px_1fr_1fr] gap-2 border-b border-gray-100 p-3 last:border-0"
              >
                <dt class="font-semibold text-gray-700">{{ change.label }}</dt>
                <dd class="text-gray-500">{{ change.before }}</dd>
                <dd class="font-semibold text-main">{{ change.after }}</dd>
              </div></template
            >
          </dl>
          <p
            class="rounded-md border border-main/25 bg-main/5 p-3 text-xs leading-5 text-main"
          >
            Solo se actualizarán los datos del catálogo. Las asociaciones
            existentes no se modificarán.
          </p>
        </div>
        <footer class="grid gap-2 border-t border-gray-200 p-4 sm:grid-cols-2">
          <button
            data-cancel
            type="button"
            :disabled="saving"
            class="min-h-11 rounded-md border border-gray-300 text-sm font-semibold"
            :class="saving ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'"
            @click="emit('cancel')"
          >
            Cancelar
          </button>
          <button
            type="button"
            :disabled="saving"
            class="inline-flex min-h-11 items-center justify-center rounded-md bg-main px-3 text-sm font-semibold text-white"
            :class="
              saving
                ? 'cursor-wait opacity-70'
                : 'cursor-pointer hover:bg-main-light'
            "
            @click="emit('confirm')"
          >
            {{ saving ? "Guardando…" : "Confirmar y guardar" }}
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>
