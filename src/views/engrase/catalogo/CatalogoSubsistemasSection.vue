<script setup lang="ts">
import { computed, onMounted } from "vue";
import SubsistemaDrawer from "@/components/engrase/catalogo/subsistemas/SubsistemaDrawer.vue";
import SubsistemaUnsavedDialog from "@/components/engrase/catalogo/subsistemas/SubsistemaUnsavedDialog.vue";
import SubsistemaUpdateConfirmDialog from "@/components/engrase/catalogo/subsistemas/SubsistemaUpdateConfirmDialog.vue";
import SubsistemasTable from "@/components/engrase/catalogo/subsistemas/SubsistemasTable.vue";
import SubsistemasToolbar from "@/components/engrase/catalogo/subsistemas/SubsistemasToolbar.vue";
import { useCatalogoSubsistemas } from "@/composables/engrase/catalogo/useCatalogoSubsistemas";
import { mensajeCatalogoSubsistemasError } from "@/stores/dbequipos/engrase/catalogo/subsistemasCatalogo.errors";
import type { CatalogoSubsistemaItem } from "@/stores/dbequipos/engrase/catalogo/subsistemasCatalogo.types";

const catalogo = useCatalogoSubsistemas();
const listState = computed<"loading" | "error" | "empty" | "no-results" | null>(
  () =>
    catalogo.loadingInicial.value
      ? "loading"
      : catalogo.errorInicial.value
        ? "error"
        : catalogo.cargado.value && !catalogo.items.value.length
          ? "empty"
          : catalogo.sinResultados.value
            ? "no-results"
            : null,
);
const message = computed(() =>
  mensajeCatalogoSubsistemasError(catalogo.errorInicial.value),
);
onMounted(() => void catalogo.inicializar());
function openItem(item: CatalogoSubsistemaItem, trigger: HTMLElement): void {
  catalogo.abrirEditar(item, trigger);
}
</script>

<template>
  <section
    class="flex min-h-0 min-w-0 flex-1 flex-col rounded-lg border border-gray-200 bg-[#FAF9F5] shadow-sm"
  >
    <div class="min-w-0 flex-1 overflow-y-auto p-3 sm:p-4">
      <SubsistemasToolbar
        :busqueda="catalogo.busqueda.value"
        :estado="catalogo.estado.value"
        :uso="catalogo.uso.value"
        :can-clear="catalogo.hayFiltrosActivos.value"
        :can-create="catalogo.canCreateCatalogItems.value"
        @update-busqueda="catalogo.actualizarBusqueda"
        @update-estado="catalogo.actualizarEstado"
        @update-uso="catalogo.actualizarUso"
        @clear="catalogo.limpiarFiltros"
        @create="catalogo.abrirCrear"
      />
      <header class="mt-4 border-t border-gray-200 pt-3">
        <h2
          data-catalogo-subsistemas-heading
          tabindex="-1"
          class="text-sm font-bold text-main"
        >
          Subsistemas
        </h2>
        <p class="text-xs text-gray-500" aria-live="polite">
          {{ catalogo.cantidadVisible.value }} resultados
        </p>
      </header>
      <div class="mt-3">
        <div
          v-if="listState"
          class="grid min-h-52 place-items-center rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center"
        >
          <div>
            <h3 class="text-sm font-semibold text-gray-800">
              {{
                listState === "error"
                  ? "No se pudieron cargar los subsistemas"
                  : listState === "empty"
                    ? "No hay subsistemas registrados"
                    : listState === "no-results"
                      ? "No hay coincidencias"
                      : "Cargando subsistemas…"
              }}
            </h3>
            <p v-if="listState === 'error'" class="mt-1 text-xs text-danger">
              {{ message }}
            </p>
            <button
              v-if="listState === 'error'"
              type="button"
              class="mt-4 min-h-11 cursor-pointer rounded-md bg-main px-4 text-sm font-semibold text-white"
              @click="catalogo.reintentar"
            >
              Reintentar</button
            ><button
              v-else-if="
                listState === 'empty' && catalogo.canCreateCatalogItems.value
              "
              type="button"
              class="mt-4 min-h-11 cursor-pointer rounded-md bg-main px-4 text-sm font-semibold text-white"
              @click="catalogo.abrirCrear"
            >
              Nuevo subsistema</button
            ><button
              v-else-if="listState === 'no-results'"
              type="button"
              class="mt-4 min-h-11 cursor-pointer rounded-md border border-gray-300 px-4 text-sm font-semibold"
              @click="catalogo.limpiarFiltros"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
        <SubsistemasTable
          v-else
          :items="catalogo.itemsVisibles.value"
          :sort-key="catalogo.sortKey.value"
          :sort-direction="catalogo.sortDirection.value"
          @select="openItem"
          @sort="catalogo.actualizarOrden"
        />
      </div>
    </div>
    <SubsistemaDrawer
      :open="catalogo.drawerOpen.value"
      :item="catalogo.original.value"
      :draft="catalogo.draft.value"
      :errors="catalogo.fieldErrors.value"
      :saving="catalogo.guardando.value"
      :can-submit="catalogo.canSubmit.value"
      @close="catalogo.solicitarCierre"
      @update-draft="catalogo.updateDraft"
      @blur-name="catalogo.validateName"
      @submit="catalogo.submit"
    />
    <SubsistemaUnsavedDialog
      v-if="catalogo.confirmarDescarteAbierto.value"
      @cancel="catalogo.cancelarDescarte"
      @discard="catalogo.cerrarAhora"
    />
    <SubsistemaUpdateConfirmDialog
      v-if="
        catalogo.confirmacionAbierta.value &&
        catalogo.original.value &&
        catalogo.draft.value
      "
      :original="catalogo.original.value"
      :draft="catalogo.draft.value"
      :saving="catalogo.guardando.value"
      @cancel="catalogo.cancelarConfirmacion"
      @confirm="catalogo.confirmarActualizacion"
    />
    <div
      class="pointer-events-none fixed right-4 top-4 z-[90]"
      aria-live="polite"
    >
      <p
        v-if="catalogo.successMessage.value"
        class="rounded-md border border-success/25 bg-white px-4 py-3 text-sm font-semibold text-success shadow-lg"
      >
        {{ catalogo.successMessage.value }}
      </p>
    </div>
  </section>
</template>
