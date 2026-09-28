<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, useTemplateRef } from "vue";
import { SlidersHorizontal, X } from "lucide-vue-next";
import VueMultiselect from "vue-multiselect";
import type {
  CatalogoAceiteEstado,
  CatalogoAceiteUso,
  CatalogoSistemaRelacionado,
} from "@/stores/dbequipos/engrase/catalogo/aceitesCatalogo.types";

type Option<T extends string | number | null> = { label: string; value: T };

const props = defineProps<{
  open: boolean;
  sistemaId: number | null;
  estado: CatalogoAceiteEstado;
  uso: CatalogoAceiteUso;
  sistemas: readonly CatalogoSistemaRelacionado[];
  resultCount: number;
}>();
const emit = defineEmits<{
  close: [];
  reset: [];
  updateSistema: [number | null];
  updateEstado: [CatalogoAceiteEstado];
  updateUso: [CatalogoAceiteUso];
}>();

const systems = computed<Option<number | null>[]>(() => [
  { label: "Todos los sistemas raíz", value: null },
  ...props.sistemas.map((item) => ({ label: item.nombre, value: item.id })),
]);
const states: readonly Option<CatalogoAceiteEstado>[] = [
  { label: "Activos", value: "activos" },
  { label: "Desactivados", value: "desactivados" },
  { label: "Todos", value: "todos" },
];
const usages: readonly Option<CatalogoAceiteUso>[] = [
  { label: "Todos", value: "todos" },
  { label: "En uso", value: "en-uso" },
  { label: "Sin uso", value: "sin-uso" },
];
const selectedSystem = computed<Option<number | null> | null>({
  get: () =>
    systems.value.find((item) => item.value === props.sistemaId) ?? null,
  set: (item) => emit("updateSistema", item?.value ?? null),
});
const selectedState = computed<Option<CatalogoAceiteEstado> | null>({
  get: () => states.find((item) => item.value === props.estado) ?? null,
  set: (item) => emit("updateEstado", item?.value ?? "activos"),
});
const selectedUsage = computed<Option<CatalogoAceiteUso> | null>({
  get: () => usages.find((item) => item.value === props.uso) ?? null,
  set: (item) => emit("updateUso", item?.value ?? "todos"),
});

const sheetRef = useTemplateRef<HTMLElement>("sheet");
let previousOverflow = "";
let previousFocus: HTMLElement | null = null;

function keydown(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    event.preventDefault();
    emit("close");
    return;
  }
  if (event.key !== "Tab" || !sheetRef.value) return;
  const controls = Array.from(
    sheetRef.value.querySelectorAll<HTMLElement>(
      "button:not([disabled]), input:not([disabled]), [tabindex='0']",
    ),
  );
  const first = controls[0];
  const last = controls.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  }
  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}

onMounted(() => {
  previousFocus =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  window.addEventListener("keydown", keydown);
  requestAnimationFrame(() => sheetRef.value?.focus());
});
onBeforeUnmount(() => {
  document.body.style.overflow = previousOverflow;
  window.removeEventListener("keydown", keydown);
  previousFocus?.focus();
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[70] bg-main-dark/50 lg:hidden"
      @click.self="emit('close')"
    >
      <section
        ref="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="oils-filters-title"
        tabindex="-1"
        class="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-white outline-none"
      >
        <header
          class="sticky top-0 flex min-h-14 items-center justify-between border-b border-gray-200 bg-white px-4"
        >
          <h2
            id="oils-filters-title"
            class="flex items-center gap-2 text-base font-bold text-main"
          >
            <SlidersHorizontal class="h-4 w-4" />Filtrar aceites
          </h2>
          <button
            type="button"
            class="grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-md hover:bg-gray-100"
            aria-label="Cerrar filtros"
            @click="emit('close')"
          >
            <X class="h-4 w-4" />
          </button>
        </header>
        <div class="space-y-5 p-4">
          <label class="block text-sm font-semibold">
            Sistema raíz
            <VueMultiselect
              v-model="selectedSystem"
              class="mt-1.5"
              :options="systems"
              track-by="value"
              label="label"
              :searchable="true"
              :allow-empty="false"
              :show-labels="false"
              placeholder="Todos los sistemas raíz"
            />
          </label>
          <label class="block text-sm font-semibold">
            Estado
            <VueMultiselect
              v-model="selectedState"
              class="mt-1.5"
              :options="states"
              track-by="value"
              label="label"
              :searchable="false"
              :allow-empty="false"
              :show-labels="false"
              placeholder="Estado"
            />
          </label>
          <label class="block text-sm font-semibold">
            En uso
            <VueMultiselect
              v-model="selectedUsage"
              class="mt-1.5"
              :options="usages"
              track-by="value"
              label="label"
              :searchable="false"
              :allow-empty="false"
              :show-labels="false"
              placeholder="En uso"
            />
          </label>
        </div>
        <footer
          class="sticky bottom-0 grid grid-cols-2 gap-2 border-t border-gray-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <button
            type="button"
            class="min-h-11 cursor-pointer rounded-md border border-gray-300 text-sm font-semibold"
            @click="emit('reset')"
          >
            Restablecer
          </button>
          <button
            type="button"
            class="min-h-11 cursor-pointer rounded-md bg-main text-sm font-semibold text-white"
            @click="emit('close')"
          >
            Ver {{ new Intl.NumberFormat("es").format(resultCount) }} resultados
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>
