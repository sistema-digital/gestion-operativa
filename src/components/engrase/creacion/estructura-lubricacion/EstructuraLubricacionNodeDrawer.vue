<script setup lang="ts">
import { computed, nextTick, onMounted, shallowRef, useTemplateRef } from "vue";
import { Plus } from "lucide-vue-next";
import VueMultiselect from "vue-multiselect";
import { crearTempId } from "@/stores/dbequipos/engrase/shared/equipoEngraseDraft.tempIds";
import type {
  CatalogoEstructura,
  CatalogoEstructuraNuevo,
  NodoEstructuraArbol,
} from "@/stores/dbequipos/engrase/shared/estructuraLubricacion.draft.types";

type DrawerMode = "root" | "child" | "oil";
type EstructuraValidationError = { mensaje: string; fieldId?: string };
type NoOilOption = {
  id: number;
  nombre: string;
  activo: true;
  noOil: true;
};
type PendingCatalogOption = { nombre: string; pendingCreation: true };
type CatalogOption = CatalogoEstructura | PendingCatalogOption;
type OilOption = CatalogoEstructura | PendingCatalogOption | NoOilOption;
const props = defineProps<{
  mode: DrawerMode;
  node: NodoEstructuraArbol | null;
  nodos?: NodoEstructuraArbol[];
  sistemas: CatalogoEstructura[];
  subsistemas: CatalogoEstructura[];
  aceites: CatalogoEstructura[];
  errors: EstructuraValidationError[];
}>();
const emit = defineEmits<{
  close: [];
  saveRoot: [sistema: CatalogoEstructura, aceite: CatalogoEstructura | null];
  saveChild: [
    parentLocalId: string,
    subsistema: CatalogoEstructura,
    aceite: CatalogoEstructura | null,
  ];
  saveOil: [localId: string, aceite: CatalogoEstructura | null];
}>();
const selectedCatalog = shallowRef<CatalogOption | null>(null);
const noOilOption: NoOilOption = {
  id: Number.MIN_SAFE_INTEGER,
  nombre: "Sin aceite",
  activo: true,
  noOil: true,
};
const selectedOil = shallowRef<OilOption>(
  props.mode === "oil" && props.node?.aceite ? props.node.aceite : noOilOption,
);
const tagSearch = shallowRef("");
const pendingCatalog = shallowRef<PendingCatalogOption | null>(null);
const pendingOil = shallowRef<PendingCatalogOption | null>(null);
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
const catalogOptions = computed<CatalogOption[]>(() =>
  props.mode === "root"
    ? [
        ...props.sistemas,
        ...(props.nodos ?? []).flatMap((nodo) =>
          nodo.sistema?.id === null ? [nodo.sistema] : [],
        ),
        ...(pendingCatalog.value ? [pendingCatalog.value] : []),
        ...(opcionNuevaCatalogo() ? [opcionNuevaCatalogo()!] : []),
      ]
    : [
        ...props.subsistemas,
        ...(props.nodos ?? []).flatMap((nodo) =>
          nodo.subsistema?.id === null ? [nodo.subsistema] : [],
        ),
        ...(pendingCatalog.value ? [pendingCatalog.value] : []),
        ...(opcionNuevaCatalogo() ? [opcionNuevaCatalogo()!] : []),
      ],
);
const oilOptions = computed<OilOption[]>(() => [
  noOilOption,
  ...props.aceites,
  ...(props.nodos ?? []).flatMap((nodo) =>
    nodo.aceite?.id === null ? [nodo.aceite] : [],
  ),
  ...(pendingOil.value ? [pendingOil.value] : []),
  ...(opcionNuevaAceite() ? [opcionNuevaAceite()!] : []),
]);
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
function isPending(
  option: CatalogOption | OilOption,
): option is PendingCatalogOption {
  return "pendingCreation" in option;
}
function normalizarNombre(nombre: string): string {
  return nombre.trim().replace(/\s+/gu, " ").toLocaleUpperCase("es");
}
function opcionNuevaCatalogo(): PendingCatalogOption | null {
  const nombre = normalizarNombre(tagSearch.value);
  const existentes =
    props.mode === "root"
      ? [
          ...props.sistemas,
          ...(props.nodos ?? []).flatMap((nodo) =>
            nodo.sistema ? [nodo.sistema] : [],
          ),
        ]
      : [
          ...props.subsistemas,
          ...(props.nodos ?? []).flatMap((nodo) =>
            nodo.subsistema ? [nodo.subsistema] : [],
          ),
        ];
  return nombre &&
    !pendingCatalog.value &&
    !existentes.some((catalogo) => normalizarNombre(catalogo.nombre) === nombre)
    ? { nombre, pendingCreation: true }
    : null;
}
function opcionNuevaAceite(): PendingCatalogOption | null {
  const nombre = normalizarNombre(tagSearch.value);
  const existentes = [
    ...props.aceites,
    ...(props.nodos ?? []).flatMap((nodo) =>
      nodo.aceite ? [nodo.aceite] : [],
    ),
  ];
  return nombre &&
    !pendingOil.value &&
    !existentes.some((aceite) => normalizarNombre(aceite.nombre) === nombre)
    ? { nombre, pendingCreation: true }
    : null;
}
function catalogoNuevo(nombre: string): CatalogoEstructuraNuevo {
  return {
    id: null,
    tempId: crearTempId("catalogo_estructura"),
    nombre,
    activo: true,
  };
}
function selectedOilValue(): CatalogoEstructura | null {
  return isNoOil(selectedOil.value) || isPending(selectedOil.value)
    ? null
    : selectedOil.value;
}
function selectCatalog(option: CatalogOption): void {
  if (isPending(option)) {
    pendingCatalog.value = option;
    selectedCatalog.value = option;
    tagSearch.value = "";
  }
}
function selectOil(option: OilOption): void {
  if (isPending(option)) {
    pendingOil.value = option;
    selectedOil.value = option;
    tagSearch.value = "";
  }
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
  const aceite = isPending(selectedOil.value)
    ? catalogoNuevo(selectedOil.value.nombre)
    : selectedOilValue();
  const catalogo =
    selectedCatalog.value && isPending(selectedCatalog.value)
      ? catalogoNuevo(selectedCatalog.value.nombre)
      : selectedCatalog.value;
  if (props.mode === "root" && catalogo && !isPending(catalogo))
    emit("saveRoot", catalogo, aceite);
  if (props.mode === "child" && catalogo && !isPending(catalogo) && props.node)
    emit("saveChild", props.node.localId, catalogo, aceite);
  if (props.mode === "oil" && props.node)
    emit("saveOil", props.node.localId, aceite);
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
        <span class="sr-only">Usar Sin aceite</span>
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
              @search-change="tagSearch = $event"
              @select="selectCatalog"
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
              @search-change="tagSearch = $event"
              @select="selectOil"
            >
              <template #option="{ option }">
                <span
                  v-if="option.pendingCreation"
                  class="inline-flex items-center gap-1 text-main"
                  ><Plus class="h-3.5 w-3.5" />Agregar “{{ option.nombre }}”
                  nuevo</span
                >
                <span v-else :class="{ 'oil-none-option': option.noOil }">{{
                  option.nombre
                }}</span>
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
            Guardar
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
