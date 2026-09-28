<script setup lang="ts">
import { computed, nextTick, onMounted, shallowRef, useTemplateRef } from "vue";
import { Plus } from "lucide-vue-next";
import VueMultiselect from "vue-multiselect";
import type { CatalogoActivo } from "@/stores/dbequipos/engrase/shared/estructuraLubricacion.types";
import type {
  ErrorValidacionEstructura,
  NodoEstructuraArbol,
} from "@/stores/dbequipos/engrase/shared/estructuraLubricacion.draft.types";

type DrawerMode = "root" | "child" | "oil" | "move";
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
type CatalogOption = CatalogoActivo | PendingCatalogOption;
type OilOption = CatalogoActivo | NoOilOption;
type DrawerConfirm =
  | { mode: "root"; sistema: CatalogoActivo; aceite: CatalogoActivo | null }
  | { mode: "root-new-system"; nombre: string; aceite: CatalogoActivo | null }
  | {
      mode: "child";
      parentLocalId: string;
      subsistema: CatalogoActivo;
      aceite: CatalogoActivo | null;
    }
  | {
      mode: "child-new-subsystem";
      parentLocalId: string;
      nombre: string;
      aceite: CatalogoActivo | null;
    }
  | { mode: "oil"; localId: string; aceite: CatalogoActivo | null }
  | { mode: "move"; localId: string; nuevoPadreLocalId: string };
const props = defineProps<{
  mode: DrawerMode;
  node: NodoEstructuraArbol | null;
  sistemas: CatalogoActivo[];
  subsistemas: CatalogoActivo[];
  aceites: CatalogoActivo[];
  movementOptions: NodoEstructuraArbol[];
  errors: ErrorValidacionEstructura[];
}>();
const emit = defineEmits<{ close: []; confirm: [DrawerConfirm] }>();
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
const selectedParent = shallowRef<NodoEstructuraArbol | null>(null);
const tagSearch = shallowRef("");
const pendingCatalog = shallowRef<PendingCatalogOption | null>(null);
const titleRef = useTemplateRef<HTMLElement>("title");
const title = computed(() =>
  props.mode === "root"
    ? "Agregar sistema"
    : props.mode === "child"
      ? "Agregar subsistema"
      : props.mode === "move"
        ? "Mover subsistema"
        : props.node?.aceite
          ? "Cambiar aceite"
          : "Asignar aceite",
);
const catalogBaseOptions = computed<CatalogoActivo[]>(() =>
  props.mode === "root" ? props.sistemas : props.subsistemas,
);
const catalogOptions = computed<CatalogOption[]>(() =>
  props.mode === "root" || props.mode === "child"
    ? [
        ...catalogBaseOptions.value,
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
const oilOptions = computed<OilOption[]>(() => [noOilOption, ...props.aceites]);
const errorId = "estructura-lubricacion-drawer-errors";
const description = computed(() =>
  props.node
    ? `${props.mode === "child" ? "Dentro de" : props.mode === "move" ? "Mover" : "Ubicación"}: ${props.node.ruta}`
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
function isNoOil(option: OilOption): option is NoOilOption {
  return "noOil" in option;
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
function updateTagSearch(search: string): void {
  tagSearch.value = search;
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
    else
      emit("confirm", {
        mode: "root",
        sistema: selectedCatalog.value,
        aceite: selectedOilValue(),
      });
  }
  if (props.mode === "child" && selectedCatalog.value && props.node)
    if (isPendingCatalog(selectedCatalog.value))
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
  if (props.mode === "oil" && props.node)
    emit("confirm", {
      mode: "oil",
      localId: props.node.localId,
      aceite: selectedOilValue(),
    });
  if (props.mode === "move" && props.node && selectedParent.value)
    emit("confirm", {
      mode: "move",
      localId: props.node.localId,
      nuevoPadreLocalId: selectedParent.value.localId,
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
          <div v-if="mode === 'move'" class="grid gap-1">
            <span id="estructura-nuevo-padre" class="text-xs font-semibold"
              >Nuevo padre *</span
            ><VueMultiselect
              v-model="selectedParent"
              :options="movementOptions"
              track-by="localId"
              label="ruta"
              :allow-empty="false"
              :close-on-select="true"
              :clear-on-select="true"
              :show-labels="false"
              aria-labelledby="estructura-nuevo-padre"
              placeholder="Seleccione el nuevo padre"
              ><template #noOptions>No hay ubicaciones disponibles.</template
              ><template #noResult>Sin coincidencias.</template></VueMultiselect
            >
          </div>
          <div v-else-if="mode !== 'oil'" class="grid gap-1">
            <span id="estructura-catalogo" class="text-xs font-semibold">{{
              mode === "root" ? "Sistema *" : "Subsistema *"
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
                  }}” como {{ mode === "root" ? "sistema" : "subsistema" }}
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
          <div v-if="mode !== 'move'" class="grid gap-1">
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
            :disabled="
              (mode !== 'oil' && mode !== 'move' && !selectedCatalog) ||
              (mode === 'move' && !selectedParent)
            "
            class="min-h-11 cursor-pointer rounded-md bg-main text-white disabled:cursor-not-allowed disabled:opacity-50"
            @click="confirm"
          >
            {{
              mode === "oil"
                ? "Guardar aceite"
                : mode === "move"
                  ? "Mover"
                  : title
            }}
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
