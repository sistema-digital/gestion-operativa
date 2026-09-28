<script setup lang="ts">
import { computed, nextTick, onMounted, shallowRef, useTemplateRef } from "vue";
import VueMultiselect from "vue-multiselect";
import type { CatalogoActivo } from "@/stores/dbequipos/engrase/shared/estructuraLubricacion.types";
import type { NodoEstructuraArbol } from "@/stores/dbequipos/engrase/shared/estructuraLubricacion.draft.types";

type DrawerMode = "root" | "child" | "oil";
type EstructuraValidationError = { mensaje: string; fieldId?: string };
type NoOilOption = {
  id: number;
  nombre: string;
  activo: true;
  noOil: true;
};
type OilOption = CatalogoActivo | NoOilOption;
const props = defineProps<{
  mode: DrawerMode;
  node: NodoEstructuraArbol | null;
  sistemas: CatalogoActivo[];
  subsistemas: CatalogoActivo[];
  aceites: CatalogoActivo[];
  errors: EstructuraValidationError[];
}>();
const emit = defineEmits<{
  close: [];
  saveRoot: [sistema: CatalogoActivo, aceite: CatalogoActivo | null];
  saveChild: [
    parentLocalId: string,
    subsistema: CatalogoActivo,
    aceite: CatalogoActivo | null,
  ];
  saveOil: [localId: string, aceite: CatalogoActivo | null];
}>();
const selectedCatalog = shallowRef<CatalogoActivo | null>(null);
const noOilOption: NoOilOption = {
  id: Number.MIN_SAFE_INTEGER,
  nombre: "Sin aceite",
  activo: true,
  noOil: true,
};
const selectedOil = shallowRef<OilOption>(
  props.mode === "oil" && props.node?.aceite ? props.node.aceite : noOilOption,
);
const titleRef = useTemplateRef<HTMLElement>("title");
const errorId = "estructura-lubricacion-drawer-errors";
const title = computed(() =>
  props.mode === "root"
    ? "Agregar sistema"
    : props.mode === "child"
      ? "Agregar subsistema"
      : props.node?.aceite
        ? "Cambiar aceite"
        : "Asignar aceite",
);
const catalogOptions = computed(() =>
  props.mode === "root" ? props.sistemas : props.subsistemas,
);
const oilOptions = computed<OilOption[]>(() => [noOilOption, ...props.aceites]);
const needsCatalog = computed(() => props.mode !== "oil");
const description = computed(() =>
  props.node
    ? `${props.mode === "child" ? "Dentro de" : "Ubicación"}: ${props.node.ruta}`
    : "Ubicación raíz de la estructura de lubricación.",
);
onMounted(() => nextTick(() => titleRef.value?.focus()));
function close(): void {
  emit("close");
}
function isNoOil(option: OilOption): option is NoOilOption {
  return "noOil" in option;
}
function selectedOilValue(): CatalogoActivo | null {
  return isNoOil(selectedOil.value) ? null : selectedOil.value;
}
function onKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    close();
    return;
  }
  if (event.key !== "Tab") return;
  const focusables = Array.from(
    (event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])',
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
function save(): void {
  if (props.mode === "root" && selectedCatalog.value)
    emit("saveRoot", selectedCatalog.value, selectedOilValue());
  if (props.mode === "child" && selectedCatalog.value && props.node)
    emit(
      "saveChild",
      props.node.localId,
      selectedCatalog.value,
      selectedOilValue(),
    );
  if (props.mode === "oil" && props.node)
    emit("saveOil", props.node.localId, selectedOilValue());
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 bg-main-dark/40" @click.self="close">
      <aside
        class="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-lg bg-white p-4 shadow-xl sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[30rem] sm:rounded-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="estructura-drawer-title"
        @keydown="onKeydown"
      >
        <h3
          id="estructura-drawer-title"
          ref="title"
          tabindex="-1"
          class="text-base font-bold text-main"
        >
          {{ title }}
        </h3>
        <p class="mt-1 text-xs text-gray-600">{{ description }}</p>
        <div class="mt-4 grid gap-3">
          <p
            v-if="errors.length"
            :id="errorId"
            class="rounded bg-danger-bg p-2 text-xs text-danger"
            role="alert"
          >
            {{ errors.map((error) => error.mensaje).join(" ") }}
          </p>
          <div v-if="needsCatalog" class="grid gap-1">
            <span id="estructura-catalogo" class="text-xs font-semibold">
              {{ mode === "root" ? "Sistema *" : "Subsistema *" }}
            </span>
            <VueMultiselect
              v-model="selectedCatalog"
              :options="catalogOptions"
              track-by="id"
              label="nombre"
              :allow-empty="true"
              :hide-selected="true"
              :close-on-select="true"
              :clear-on-select="true"
              :show-labels="false"
              aria-labelledby="estructura-catalogo"
              :aria-describedby="errors.length ? errorId : undefined"
              placeholder="Seleccione una opción"
            />
          </div>
          <div class="grid gap-1">
            <span id="estructura-aceite" class="text-xs font-semibold">
              Aceite
            </span>
            <VueMultiselect
              v-model="selectedOil"
              :options="oilOptions"
              track-by="id"
              label="nombre"
              :allow-empty="false"
              :close-on-select="true"
              :clear-on-select="true"
              :show-labels="false"
              aria-labelledby="estructura-aceite"
              :aria-describedby="errors.length ? errorId : undefined"
              placeholder="Seleccione un aceite"
            >
              <template #option="{ option }">
                <span :class="{ 'oil-none-option': option.noOil }">
                  {{ option.nombre }}
                </span>
              </template>
              <template #noOptions>No hay aceites disponibles.</template>
              <template #noResult>Sin coincidencias.</template>
            </VueMultiselect>
          </div>
        </div>
        <footer class="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            class="min-h-11 cursor-pointer rounded-md border"
            @click="close"
          >
            Cancelar
          </button>
          <button
            type="button"
            :disabled="needsCatalog && !selectedCatalog"
            class="min-h-11 cursor-pointer rounded-md bg-main text-white disabled:cursor-not-allowed disabled:opacity-50"
            @click="save"
          >
            {{ mode === "oil" ? "Guardar aceite" : title }}
          </button>
        </footer>
      </aside>
    </div>
  </Teleport>
</template>

<style scoped>
.oil-none-option {
  font-style: italic;
}
</style>
