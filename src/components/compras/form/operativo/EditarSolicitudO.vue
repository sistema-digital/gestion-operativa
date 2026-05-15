<script setup lang="ts">
import BaseDateField from '@/components/BaseDateField.vue'
import type { SolicitudCompraInitialData } from '@/views/compras/type'
import type { PermisosFormSolicitud } from '@/components/compras/form/permisosForm'
import {
  X,
  Search,
  Plus,
  Save,
  ShoppingCart,
  Loader2,
  ArrowLeft,
  AlertTriangle
} from 'lucide-vue-next'
import { useSolicitudCompraEditableForm } from './useEditarSolicitudO';
import { AccessLevel } from './permisosOEditarSolicitud'

const props = defineProps({
  mode: {
    type: String,
    default: 'create'
  },
  initialData: {
    type: Object as () => SolicitudCompraInitialData | null,
    default: null
  },
  permisosForm: {
    type: Object as () => PermisosFormSolicitud | null,
    default: null
  }
})

const emit = defineEmits(['close', 'submit'])

const {
  fechaEntrega,
  observacion,
  prioridadSolicitada,

  userEmail,
  userName,

  selectedEquipos,
  searchEquipo,
  showEquiposDropdown,
  filteredEquipos,

  searchProducto,
  showProductosDropdown,
  productosResult,
  isSearchingProductos,
  hasMoreProductos,

  unidadesMedida,
  detalles,
  showConfirmCancel,

  title,

  checkNavigation,
  handleBack,
  handleCancelBtn,
  confirmCancel,
  closeConfirm,
  toggleEquipo,
  isEquipoSelected,
  removeEquipo,

  loadMoreProducts,
  isProductoSelected,
  toggleProducto,

  addManualItem,
  removeDetalle,
  getCantidadAccessLevel,
  getCantidadInventarioAccessLevel,
  getCantidadGerenciaAccessLevel,
  getCantidadSistemaAccessLevel,
  getCodProductoAccessLevel,
  getDescripcionAccessLevel,
  getUnidadAccessLevel,

  submitForm
} = useSolicitudCompraEditableForm(props, emit);

defineExpose({ checkNavigation })
</script>

<template>
  <div class="h-full flex flex-col w-full bg-gray-50">
    <div class="flex-1 overflow-hidden flex flex-col bg-white">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-100 bg-white shrink-0 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-accent/20 text-main flex items-center justify-center">
            <ShoppingCart class="w-5 h-5" />
          </div>

          <div>
            <h2 class="font-display font-bold text-xl text-main-dark">
              {{ title }}
            </h2>
          </div>
        </div>

        <button
          @click="handleBack"
          class="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft class="w-4 h-4" />
          Regresar
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8 md:py-8">
        <div class="w-full space-y-8 pb-10">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Fecha Entrega -->
            <div class="space-y-1.5 flex flex-col justify-end">
              <BaseDateField
                v-model="fechaEntrega"
                label="Fecha de Entrega"
              />
            </div>

            <!-- Solicitante -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Solicitante
              </label>

              <input
                v-model="userName"
                type="text"
                class="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium focus:ring-2 focus:ring-accent outline-none"
              />
            </div>

            <!-- Email -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Email
              </label>

              <input
                v-model="userEmail"
                type="email"
                class="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium focus:ring-2 focus:ring-accent outline-none"
              />
            </div>

            <!-- Prioridad -->
            <label
              class="inline-flex w-fit items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm font-bold text-yellow-800 cursor-pointer"
            >
              <input
                v-model="prioridadSolicitada"
                type="checkbox"
                class="w-4 h-4 rounded border-yellow-300 text-yellow-600 focus:ring-yellow-500 accent-yellow-500 cursor-pointer"
              />

              <span>Solicitar Urgencia</span>
            </label>
          </div>

          <!-- Equipos -->
          <div class="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <label class="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Equipos Asociados
            </label>

            <div class="flex flex-wrap gap-2 mb-2">
              <div
                v-for="eq in selectedEquipos"
                :key="eq.cod_equipo"
                class="bg-main text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2"
              >
                <span>{{ eq.cod_equipo }}</span>

                <button
                  @click="removeEquipo(eq.cod_equipo)"
                  class="text-white hover:text-red-300 cursor-pointer"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div class="relative">
              <div
                v-if="showEquiposDropdown"
                class="fixed inset-0 z-10"
                @click="showEquiposDropdown = false"
              ></div>

              <div class="flex items-center relative z-20">
                <Search class="absolute left-3 w-4 h-4 text-gray-400" />

                <input
                  v-model="searchEquipo"
                  @focus="showEquiposDropdown = true"
                  type="text"
                  placeholder="Buscar equipo por código..."
                  class="w-full pl-9 pr-4 py-2 border border-gray-200 bg-white rounded-xl focus:ring-2 focus:ring-accent outline-none relative"
                />
              </div>

              <div
                v-if="showEquiposDropdown && filteredEquipos.length > 0"
                class="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto"
              >
                <div
                  v-for="eq in filteredEquipos"
                  :key="eq.cod_equipo"
                  @click.stop="toggleEquipo(eq)"
                  class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center gap-3"
                >
                  <div class="flex items-center h-5">
                    <input
                      type="checkbox"
                      :checked="isEquipoSelected(eq.cod_equipo)"
                      readonly
                      class="w-4 h-4 text-accent border-gray-300 rounded focus:ring-accent accent-accent cursor-pointer"
                      @click.stop="toggleEquipo(eq)"
                    />
                  </div>

                  <div class="font-bold text-sm text-gray-700">
                    {{ eq.cod_equipo }}
                  </div>
                </div>
              </div>

              <div
                v-else-if="showEquiposDropdown && searchEquipo"
                class="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-sm text-gray-500 text-center"
              >
                No se encontraron equipos
              </div>
            </div>
          </div>

          <!-- Productos -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Productos / Servicios
              </label>

              <button
                @click="addManualItem"
                type="button"
                class="text-xs font-bold text-main hover:text-accent flex items-center gap-1 bg-main/5 px-2 py-1 rounded cursor-pointer"
              >
                <Plus class="w-3.5 h-3.5" />
                Agregar Ítem Manual
              </button>
            </div>

            <div class="relative mt-2">
              <div
                v-if="showProductosDropdown"
                class="fixed inset-0 z-10"
                @click="showProductosDropdown = false"
              ></div>

              <div class="flex items-center relative z-20">
                <Search class="absolute left-3 w-4 h-4 text-gray-400" />

                <input
                  v-model="searchProducto"
                  @focus="showProductosDropdown = true"
                  type="text"
                  placeholder="Buscar producto de almacén..."
                  class="w-full pl-9 pr-4 py-2 border border-gray-200 bg-white rounded-xl focus:ring-2 focus:ring-accent outline-none relative"
                />
              </div>

              <div
                v-if="showProductosDropdown"
                class="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto flex flex-col"
              >
                <template v-if="searchProducto.trim().length < 4">
                  <div class="p-4 text-sm text-gray-500 text-center">
                    Escribe al menos 4 caracteres para buscar.
                  </div>
                </template>

                <div
                  v-else-if="isSearchingProductos && productosResult.length === 0"
                  class="p-4 flex items-center justify-center gap-2 text-sm text-gray-500"
                >
                  <Loader2 class="w-4 h-4 animate-spin text-main" />
                  Buscando...
                </div>

                <div
                  v-else-if="productosResult.length === 0"
                  class="p-4 text-sm text-gray-500 text-center"
                >
                  No se encontraron productos.
                </div>

                <template v-else>
                  <div
                    v-for="prod in productosResult"
                    :key="prod.cod_producto"
                    @click.stop="toggleProducto(prod)"
                    class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 shrink-0 flex items-start gap-3"
                  >
                    <div class="flex items-center h-5 mt-0.5">
                      <input
                        type="checkbox"
                        :checked="isProductoSelected(prod.cod_producto)"
                        readonly
                        class="w-4 h-4 text-accent border-gray-300 rounded focus:ring-accent accent-accent cursor-pointer"
                        @click.stop="toggleProducto(prod)"
                      />
                    </div>

                    <div class="flex flex-col">
                      <div class="font-bold text-sm text-gray-800">
                        {{ prod.descripcion }}
                      </div>

                      <div class="text-[10px] text-gray-400 font-mono">
                        {{ prod.cod_producto }}
                      </div>
                    </div>
                  </div>

                  <div v-if="hasMoreProductos" class="p-2 shrink-0">
                    <button
                      @click.stop="loadMoreProducts"
                      :disabled="isSearchingProductos"
                      type="button"
                      class="w-full py-2 text-xs font-bold text-main bg-main/5 hover:bg-main/10 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <Loader2
                        v-if="isSearchingProductos"
                        class="w-3.5 h-3.5 animate-spin"
                      />

                      {{ isSearchingProductos ? 'Cargando más...' : 'Cargar más' }}
                    </button>
                  </div>
                </template>
              </div>
            </div>

            <!-- Details grid -->
            <div class="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div class="overflow-x-auto">
                <div class="min-w-[1100px]">
                  <div class="details-grid border-b border-gray-200 bg-stone-50">
                    <div class="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Código
                    </div>

                    <div class="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Descripción
                    </div>

                    <div class="px-1 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                      Unidad
                    </div>

                    <div class="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                      Cantidad
                    </div>

                    <div class="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                      Inventario
                    </div>

                    <div class="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                      Gerencia
                    </div>

                    <div class="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                      Sistema Compra
                    </div>

                    <div class="px-4 py-3"></div>
                  </div>

                  <div v-if="detalles.length > 0" class="divide-y divide-gray-100">
                    <div
                      v-for="item in detalles"
                      :key="item.ui_id"
                      class="details-grid details-row min-h-[72px] items-center transition-colors hover:bg-gray-50/70"
                    >
                      <div class="px-4 py-4">
                        <div
                          v-if="getCodProductoAccessLevel(item) === AccessLevel.READ"
                          class="text-sm font-bold text-gray-800"
                        >
                          {{ item.cod_producto }}
                        </div>

                        <div
                          v-else-if="getCodProductoAccessLevel(item) === AccessLevel.NONE"
                          class="inline-flex rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-400"
                        >
                          No asignado
                        </div>
                      </div>

                      <div class="px-4 py-4">
                        <input
                          v-if="getDescripcionAccessLevel(item) === AccessLevel.EDIT"
                          v-model="item.descripcion"
                          type="text"
                          required
                          maxlength="255"
                          placeholder="Descripción..."
                          class="w-full px-3 py-1.5 border border-dashed border-gray-300 rounded focus:border-accent focus:ring-1 focus:ring-accent outline-none text-sm"
                        />

                        <div
                          v-else-if="getDescripcionAccessLevel(item) === AccessLevel.READ"
                          class="text-sm font-semibold text-gray-600"
                        >
                          {{ item.descripcion || '-' }}
                        </div>
                      </div>

                      <div class="px-1 py-4 text-center">
                        <select
                          v-if="getUnidadAccessLevel(item) === AccessLevel.EDIT"
                          v-model="item.unidad_id"
                          required
                          class="w-full px-2 py-1.5 border border-dashed border-gray-300 rounded focus:border-accent focus:ring-1 focus:ring-accent outline-none text-sm bg-white cursor-pointer"
                        >
                          <option value="">
                            Seleccionar
                          </option>

                          <option
                            v-for="u in unidadesMedida"
                            :key="u.id"
                            :value="String(u.id)"
                          >
                            {{ u.abreviatura }}
                          </option>
                        </select>

                        <div
                          v-else-if="getUnidadAccessLevel(item) === AccessLevel.READ"
                          class="text-sm font-semibold text-gray-600"
                        >
                          {{
                            unidadesMedida.find(u => String(u.id) === String(item.unidad_id))?.abreviatura ||
                            item.unidad ||
                            '-'
                          }}
                        </div>
                      </div>

                      <div class="px-4 py-4 text-center">
                        <input
                          v-if="getCantidadAccessLevel(item) === AccessLevel.EDIT"
                          v-model.number="item.cantidad"
                          type="number"
                          min="0"
                          class="w-24 px-2 py-1.5 border border-dashed border-gray-300 rounded focus:border-accent focus:ring-1 focus:ring-accent outline-none text-sm text-center"
                        />

                        <div
                          v-else-if="getCantidadAccessLevel(item) === AccessLevel.READ"
                          class="w-24 mx-auto px-2 py-1.5 text-sm font-semibold text-gray-600 text-center"
                        >
                          {{ item.cantidad ?? '-' }}
                        </div>
                      </div>

                      <div class="px-4 py-4 text-center">
                        <div
                          v-if="getCantidadInventarioAccessLevel(item) === AccessLevel.READ"
                          class="w-24 mx-auto px-2 py-1.5 text-sm font-semibold text-gray-600 text-center"
                        >
                          {{ item.cantidad_inventario ?? '-' }}
                        </div>
                      </div>

                      <div class="px-4 py-4 text-center">
                        <div
                          v-if="getCantidadGerenciaAccessLevel(item) === AccessLevel.READ"
                          class="w-24 mx-auto px-2 py-1.5 text-sm font-semibold text-gray-600 text-center"
                        >
                          {{ item.cantidad_gerencia ?? '-' }}
                        </div>
                      </div>

                      <div class="px-4 py-4 text-center">
                        <div
                          v-if="getCantidadSistemaAccessLevel(item) === AccessLevel.READ"
                          class="w-24 mx-auto px-2 py-1.5 text-sm font-semibold text-gray-600 text-center"
                        >
                          {{ item.cantidad_subida_sistema_compra ?? '-' }}
                        </div>
                      </div>

                      <div class="px-4 py-4 text-right">
                        <button
                          @click="removeDetalle(item.ui_id)"
                          type="button"
                          class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
                          title="Eliminar"
                        >
                          <X class="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div v-else class="py-8 text-center text-sm text-gray-400">
                    Agregue productos desde la búsqueda o como ítem manual.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Observación -->
          <div class="space-y-1.5 pt-4">
            <label class="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Observación
            </label>

            <textarea
              v-model="observacion"
              rows="2"
              placeholder="Justificación o detalles de la solicitud..."
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
            ></textarea>
          </div>

          <!-- Footer -->
          <div class="pt-8 border-t border-gray-100 flex justify-end gap-3 mt-8">
            <button
              @click="handleCancelBtn"
              type="button"
              class="px-6 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              @click="submitForm"
              type="button"
              class="px-6 py-2.5 rounded-xl font-bold bg-accent text-main-dark hover:brightness-110 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Save class="w-4 h-4" />

              {{ mode === 'edit' ? 'Enviar Cambios' : 'Crear Solicitud' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showConfirmCancel" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-main-dark/50 backdrop-blur-sm" @click="closeConfirm"></div>

      <div
        class="bg-white rounded-3xl shadow-xl w-full max-w-sm flex flex-col relative z-10 overflow-hidden p-6 text-center animate-in fade-in zoom-in-95 duration-200"
      >
        <div class="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle class="w-8 h-8" />
        </div>

        <h3 class="font-display font-bold text-xl text-gray-900 mb-2">
          ¿Regresar o Cancelar?
        </h3>

        <p class="text-sm text-gray-500 mb-6">
          Tienes datos sin guardar. Si regresas, perderás todo el avance de esta solicitud.
          ¿Deseas continuar?
        </p>

        <div class="flex flex-col gap-2">
          <button
            @click="confirmCancel"
            type="button"
            class="w-full py-3 rounded-xl font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
          >
            Sí, descartar y regresar
          </button>

          <button
            @click="closeConfirm"
            type="button"
            class="w-full py-3 rounded-xl font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Seguir editando
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.details-grid {
  display: grid;
  grid-template-columns:
    8rem
    minmax(16rem, 0.8fr)
    5.5rem
    5rem
    5rem
    5rem
    10rem
    4rem;
  align-items: center;
}

.details-row {
  position: relative;
}
</style>
