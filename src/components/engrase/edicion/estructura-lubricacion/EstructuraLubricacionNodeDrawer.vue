<script setup lang="ts">
import { computed, nextTick, onMounted, shallowRef, useTemplateRef } from "vue";
import { Plus } from "lucide-vue-next";
import VueMultiselect from "vue-multiselect";
import type { CatalogoActivo } from "@/stores/dbequipos/engrase/shared/estructuraLubricacion.types";
import type {
  CatalogoEstructura,
  ErrorValidacionEstructura,
  NodoEstructuraArbol,
} from "@/stores/dbequipos/engrase/shared/estructuraLubricacion.draft.types";

type DrawerMode = "root" | "child" | "catalog" | "oil";
type PendingCatalogOption = {
  key: string;
  nombre: string;
  pendingCreation: true;
};
type NoOilOption = {
  id: number;
  nombre: string;
  activo: true;
  noOil: true;
};
type CatalogOption = CatalogoEstructura | PendingCatalogOption;
type OilOption = CatalogoEstructura | PendingCatalogOption | NoOilOption;
type DrawerConfirm =
  | { mode: "root"; sistema: CatalogoActivo; aceite: CatalogoEstructura | null }
  | {
      mode: "root-new-system";
      nombre: string;
      aceite: CatalogoEstructura | null;
    }
  | {
      mode: "child";
      parentLocalId: string;
      subsistema: CatalogoActivo;
      aceite: CatalogoEstructura | null;
    }
  | {
      mode: "catalog";
      localId: string;
      catalogo: CatalogoEstructura;
      aceite: CatalogoEstructura | null;
      aceiteNuevoNombre: string | null;
    }
  | {
      mode: "catalog-new";
      localId: string;
      nombre: string;
      aceite: CatalogoEstructura | null;
      aceiteNuevoNombre: string | null;
    }
  | {
      mode: "child-new-subsystem";
      parentLocalId: string;
      nombre: string;
      aceite: CatalogoEstructura | null;
    }
  | { mode: "oil"; localId: string; aceite: CatalogoEstructura | null }
  | { mode: "oil-new"; localId: string; nombre: string };
const props = defineProps<{
  mode: DrawerMode;
  node: NodoEstructuraArbol | null;
  nodos?: NodoEstructuraArbol[];
  sistemas: CatalogoActivo[];
  subsistemas: CatalogoActivo[];
  aceites: CatalogoActivo[];
  errors: ErrorValidacionEstructura[];
}>();
const emit = defineEmits<{ close: []; confirm: [DrawerConfirm] }>();
const selectedCatalog = shallowRef<CatalogOption | null>(
  props.mode === "catalog"
    ? (props.node?.sistema ?? props.node?.subsistema)
    : null,
);
const noOilOption: NoOilOption = {
  id: Number.MIN_SAFE_INTEGER,
  nombre: "Sin aceite",
  activo: true,
  noOil: true,
};
const selectedOil = shallowRef<OilOption>(
  (props.mode === "oil" || props.mode === "catalog") && props.node?.aceite
    ? props.node.aceite
    : noOilOption,
);
const tagSearch = shallowRef("");
const pendingCatalog = shallowRef<PendingCatalogOption | null>(null);
const pendingOil = shallowRef<PendingCatalogOption | null>(null);
const titleRef = useTemplateRef<HTMLElement>("title");
const title = computed(() =>
  props.mode === "root"
    ? "Agregar sistema"
    : props.mode === "child"
      ? "Agregar subsistema"
      : props.mode === "catalog"
        ? props.node?.sistema
          ? "Cambiar sistema"
          : "Cambiar subsistema"
        : props.node?.aceite
          ? "Cambiar aceite"
          : "Asignar aceite",
);
const catalogBaseOptions = computed<CatalogoActivo[]>(() =>
  props.mode === "root" ||
  (props.mode === "catalog" && props.node?.sistema !== null)
    ? props.sistemas
    : props.subsistemas,
);
const nodosLocales = computed<NodoEstructuraArbol[]>(() => {
  const aplanar = (
    nodos: readonly NodoEstructuraArbol[],
  ): NodoEstructuraArbol[] =>
    nodos.flatMap((nodo) => [nodo, ...aplanar(nodo.hijos)]);
  return aplanar(props.nodos ?? []);
});
const catalogosLocales = computed<CatalogoEstructura[]>(() =>
  nodosLocales.value.flatMap((nodo) => {
    const catalogo =
      props.mode === "root" ||
      (props.mode === "catalog" && props.node?.sistema !== null)
        ? nodo.sistema
        : nodo.subsistema;
    return catalogo?.id === null ? [catalogo] : [];
  }),
);
const aceitesLocales = computed<CatalogoEstructura[]>(() =>
  nodosLocales.value.flatMap((nodo) =>
    nodo.aceite?.id === null ? [nodo.aceite] : [],
  ),
);
const catalogOptions = computed<CatalogOption[]>(() =>
  props.mode === "root" || props.mode === "child" || props.mode === "catalog"
    ? [
        ...catalogBaseOptions.value,
        ...catalogosLocales.value,
        ...(selectedCatalog.value?.id === null ? [selectedCatalog.value] : []),
        ...(pendingCatalog.value ? [pendingCatalog.value] : []),
        ...(tagSearch.value.trim() &&
        !pendingCatalog.value &&
        !catalogBaseOptions.value.some(
          (catalogo) =>
            normalizarNombreCatalogo(catalogo.nombre) ===
            normalizarNombreCatalogo(tagSearch.value),
        )
          ? [crearOpcionCatalogo(tagSearch.value)]
          : []),
      ]
    : [],
);
const oilOptions = computed<OilOption[]>(() => [
  noOilOption,
  ...props.aceites,
  ...aceitesLocales.value,
  ...(pendingOil.value ? [pendingOil.value] : []),
  ...(tagSearch.value.trim() &&
  !pendingOil.value &&
  !props.aceites.some(
    (aceite) =>
      normalizarNombreCatalogo(aceite.nombre) ===
      normalizarNombreCatalogo(tagSearch.value),
  )
    ? [crearOpcionCatalogo(tagSearch.value)]
    : []),
]);
const errorId = "estructura-lubricacion-drawer-errors";
const description = computed(() =>
  props.node
    ? `${props.mode === "child" ? "Dentro de" : "Ubicación"}: ${props.node.ruta}`
    : "Ubicación raíz de la estructura de lubricación.",
);
onMounted(() => nextTick(() => titleRef.value?.focus()));
function close(): void {
  emit("close");
}
function isPendingCatalog(
  option: CatalogOption,
): option is PendingCatalogOption {
  return "pendingCreation" in option;
}
function isCatalogoNuevo(
  option: CatalogOption,
): option is Extract<CatalogoEstructura, { id: null }> {
  return !isPendingCatalog(option) && option.id === null;
}
function isNoOil(option: OilOption): option is NoOilOption {
  return "noOil" in option;
}
function isPendingOil(option: OilOption): option is PendingCatalogOption {
  return "pendingCreation" in option;
}
function crearOpcionCatalogo(name: string): PendingCatalogOption {
  const normalized = normalizarNombreCatalogo(name);
  return {
    key: `nuevo-catalogo-${normalized.toLocaleLowerCase("es")}`,
    nombre: normalized,
    pendingCreation: true,
  };
}
function normalizarNombreCatalogo(name: string): string {
  return name.trim().replace(/\s+/gu, " ").toLocaleUpperCase("es");
}
function selectCatalog(option: CatalogOption): void {
  if (isPendingCatalog(option)) {
    pendingCatalog.value = option;
    selectedCatalog.value = option;
    tagSearch.value = "";
  }
}
function selectOil(option: OilOption): void {
  if (isPendingOil(option)) {
    pendingOil.value = option;
    selectedOil.value = option;
    tagSearch.value = "";
  }
}
function updateTagSearch(search: string): void {
  tagSearch.value = search;
}
function selectedOilValue(): CatalogoEstructura | null {
  return isNoOil(selectedOil.value) || isPendingOil(selectedOil.value)
    ? null
    : selectedOil.value;
}
function aceiteNuevoNombre(): string | null {
  return isPendingOil(selectedOil.value) ? selectedOil.value.nombre : null;
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
  }
  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
function confirm(): void {
  if (props.mode === "root" && selectedCatalog.value) {
    if (isPendingCatalog(selectedCatalog.value))
      emit("confirm", {
        mode: "root-new-system",
        nombre: selectedCatalog.value.nombre,
        aceite: selectedOilValue(),
      });
    else if (isCatalogoNuevo(selectedCatalog.value))
      emit("confirm", {
        mode: "root-new-system",
        nombre: selectedCatalog.value.nombre,
        aceite: selectedOilValue(),
      });
    else
      emit("confirm", {
        mode: "root",
        sistema: selectedCatalog.value,
        aceite: selectedOilValue(),
      });
  }
  if (props.mode === "child" && selectedCatalog.value && props.node) {
    if (isPendingCatalog(selectedCatalog.value))
      emit("confirm", {
        mode: "child-new-subsystem",
        parentLocalId: props.node.localId,
        nombre: selectedCatalog.value.nombre,
        aceite: selectedOilValue(),
      });
    else if (isCatalogoNuevo(selectedCatalog.value))
      emit("confirm", {
        mode: "child-new-subsystem",
        parentLocalId: props.node.localId,
        nombre: selectedCatalog.value.nombre,
        aceite: selectedOilValue(),
      });
    else
      emit("confirm", {
        mode: "child",
        parentLocalId: props.node.localId,
        subsistema: selectedCatalog.value,
        aceite: selectedOilValue(),
      });
  }
  if (props.mode === "catalog" && selectedCatalog.value && props.node) {
    if (isPendingCatalog(selectedCatalog.value))
      emit("confirm", {
        mode: "catalog-new",
        localId: props.node.localId,
        nombre: selectedCatalog.value.nombre,
        aceite: selectedOilValue(),
        aceiteNuevoNombre: aceiteNuevoNombre(),
      });
    else if (isCatalogoNuevo(selectedCatalog.value))
      emit("confirm", {
        mode: "catalog-new",
        localId: props.node.localId,
        nombre: selectedCatalog.value.nombre,
        aceite: selectedOilValue(),
        aceiteNuevoNombre: aceiteNuevoNombre(),
      });
    else
      emit("confirm", {
        mode: "catalog",
        localId: props.node.localId,
        catalogo: selectedCatalog.value,
        aceite: selectedOilValue(),
        aceiteNuevoNombre: aceiteNuevoNombre(),
      });
  }
  if (props.mode === "oil" && props.node)
    if (isPendingOil(selectedOil.value))
      emit("confirm", {
        mode: "oil-new",
        localId: props.node.localId,
        nombre: selectedOil.value.nombre,
      });
    else
      emit("confirm", {
        mode: "oil",
        localId: props.node.localId,
        aceite: selectedOilValue(),
      });
}
</script>

<template>
  <Teleport to="body"
    ><div class="fixed inset-0 z-50 bg-main-dark/40" @click.self="close">
      <aside
        class="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-lg bg-white p-4 shadow-xl sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[30rem] sm:max-h-none sm:rounded-none"
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
        <p
          v-if="errors.length"
          :id="errorId"
          class="mt-3 rounded bg-danger-bg p-2 text-xs text-danger"
          role="alert"
        >
          {{ errors.map((error) => error.mensaje).join(" ") }}
        </p>
        <div class="mt-4 grid gap-3">
          <div v-if="mode !== 'oil'" class="grid gap-1">
            <span id="estructura-catalogo" class="text-xs font-semibold">{{
              mode === "root" || (mode === "catalog" && node?.sistema)
                ? "Sistema *"
                : "Subsistema *"
            }}</span
            ><VueMultiselect
              v-model="selectedCatalog"
              :options="catalogOptions"
              track-by="nombre"
              label="nombre"
              :allow-empty="true"
              :hide-selected="true"
              :close-on-select="true"
              :clear-on-select="true"
              :show-labels="false"
              aria-labelledby="estructura-catalogo"
              :aria-describedby="errors.length ? errorId : undefined"
              placeholder="Seleccione una opción"
              @search-change="updateTagSearch"
              @select="selectCatalog"
              ><template #option="{ option }">
                <div v-if="option.pendingCreation" class="create-system-option">
                  <Plus class="h-4 w-4" aria-hidden="true" />Agregar “{{
                    option.nombre
                  }}” como
                  {{
                    mode === "root" || (mode === "catalog" && node?.sistema)
                      ? "sistema"
                      : "subsistema"
                  }}
                  nuevo
                </div>
                <span v-else>{{ option.nombre }}</span> </template
              ><template #noOptions> No hay opciones disponibles. </template
              ><template #noResult>
                Sin coincidencias. Presiona Enter para crear “{{
                  normalizarNombreCatalogo(tagSearch)
                }}”.
              </template></VueMultiselect
            >
          </div>
          <div class="grid gap-1">
            <span id="estructura-aceite" class="text-xs font-semibold"
              >Aceite</span
            ><VueMultiselect
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
              @search-change="updateTagSearch"
              @select="selectOil"
              ><template #option="{ option }">
                <span :class="{ 'oil-none-option': option.noOil }">
                  {{ option.nombre }}
                </span> </template
              ><template #noOptions>No hay aceites disponibles.</template
              ><template #noResult>Sin coincidencias.</template></VueMultiselect
            >
          </div>
        </div>
        <footer class="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            class="min-h-11 cursor-pointer rounded-md border"
            @click="close"
          >
            Cancelar</button
          ><button
            type="button"
            :disabled="mode !== 'oil' && !selectedCatalog"
            class="min-h-11 cursor-pointer rounded-md bg-main text-white disabled:cursor-not-allowed disabled:opacity-50"
            @click="confirm"
          >
            {{ mode === "catalog" ? "Actualizar" : "Guardar" }}
          </button>
        </footer>
      </aside>
    </div></Teleport
  >
</template>

<style scoped>
.create-system-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-main);
}

:deep(.multiselect__option--highlight) .create-system-option {
  color: var(--color-white);
}

.oil-none-option {
  font-style: italic;
}
</style>
