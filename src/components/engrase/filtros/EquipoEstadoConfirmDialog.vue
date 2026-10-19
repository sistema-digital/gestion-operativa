<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  useTemplateRef,
} from "vue";
import { AlertTriangle, LoaderCircle, X } from "lucide-vue-next";
import type { FiltrosEngraseEstadoEquipo } from "@/stores/dbequipos/engrase/filtrosEngrase.types";

const props = defineProps<{
  codigoEquipo: string;
  estadoDestino: FiltrosEngraseEstadoEquipo;
  saving: boolean;
}>();
const emit = defineEmits<{ cancel: []; confirm: [] }>();
const dialogRef = useTemplateRef<HTMLElement>("dialog");
const esDescarte = computed(() => props.estadoDestino === "descartado");
const titulo = computed(() =>
  esDescarte.value ? "Confirmar descarte" : "Confirmar activación",
);
const descripcion = computed(() =>
  esDescarte.value
    ? "El equipo seguirá registrado, pero dejará de mostrarse entre los equipos activos."
    : "El equipo volverá a estar disponible entre los equipos activos.",
);
const etiquetaConfirmar = computed(() =>
  esDescarte.value ? "Confirmar descarte" : "Confirmar activación",
);
let previousFocus: HTMLElement | null = null;

function cancelar(): void {
  if (!props.saving) emit("cancel");
}

function keydown(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    event.preventDefault();
    cancelar();
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

onMounted(async () => {
  previousFocus =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  window.addEventListener("keydown", keydown);
  await nextTick();
  dialogRef.value?.querySelector<HTMLButtonElement>("[data-cancel]")?.focus();
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", keydown);
  previousFocus?.focus();
});
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[80] grid place-items-center bg-main-dark/55 p-3 sm:p-4"
      @click.self="cancelar"
    >
      <section
        ref="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="equipo-estado-confirm-title"
        aria-describedby="equipo-estado-confirm-description"
        :aria-busy="saving"
        class="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <header
          class="flex items-start justify-between gap-3 border-b border-gray-200 p-3 sm:p-4"
        >
          <div class="flex min-w-0 items-start gap-2.5">
            <span
              class="grid h-9 w-9 shrink-0 place-items-center rounded-full"
              :class="
                esDescarte ? 'bg-danger-bg text-danger' : 'bg-main/10 text-main'
              "
            >
              <AlertTriangle class="h-4 w-4" aria-hidden="true" />
            </span>
            <div class="min-w-0">
              <h2
                id="equipo-estado-confirm-title"
                class="text-sm font-bold text-main"
              >
                {{ titulo }}
              </h2>
              <p class="mt-0.5 font-mono text-xs text-gray-500">
                Equipo {{ codigoEquipo }}
              </p>
            </div>
          </div>
          <button
            type="button"
            :disabled="saving"
            class="grid min-h-9 min-w-9 place-items-center rounded-md"
            :class="
              saving
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer hover:bg-gray-100'
            "
            aria-label="Cerrar confirmación"
            @click="cancelar"
          >
            <X class="h-4 w-4" aria-hidden="true" />
          </button>
        </header>
        <div class="space-y-3 p-3 text-xs text-gray-600 sm:p-4">
          <p id="equipo-estado-confirm-description" class="leading-5">
            {{ descripcion }}
          </p>
          <p
            class="rounded-md border px-3 py-2 leading-5"
            :class="
              esDescarte
                ? 'border-danger/25 bg-danger-bg text-danger'
                : 'border-main/25 bg-main/5 text-main'
            "
          >
            {{
              esDescarte
                ? "Podrás activarlo nuevamente cuando sea necesario."
                : "Sus filtros y datos asociados no se modificarán."
            }}
          </p>
        </div>
        <footer
          class="grid gap-2 border-t border-gray-200 p-3 sm:grid-cols-2 sm:p-4"
        >
          <button
            data-cancel
            type="button"
            :disabled="saving"
            class="min-h-10 rounded-md border border-gray-300 px-3 text-xs font-semibold text-gray-700"
            :class="
              saving
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer hover:bg-gray-50'
            "
            @click="cancelar"
          >
            Cancelar
          </button>
          <button
            type="button"
            :disabled="saving"
            class="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-bold text-white"
            :class="[
              esDescarte
                ? 'bg-danger hover:bg-danger/90'
                : 'bg-main hover:bg-main-light',
              saving ? 'cursor-wait opacity-70' : 'cursor-pointer',
            ]"
            @click="emit('confirm')"
          >
            <LoaderCircle
              v-if="saving"
              class="h-3.5 w-3.5 animate-spin"
              aria-hidden="true"
            />
            {{ saving ? "Actualizando…" : etiquetaConfirmar }}
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>
