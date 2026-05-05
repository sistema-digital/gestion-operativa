<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { supabase, supabaseCompras, supabaseEquipos } from '@/lib/supabase';
import { useComprasStore } from '@/stores/comprasStore';
import { X, Search, Plus, Trash2, Save, ShoppingCart, Loader2 } from 'lucide-vue-next';

const emit = defineEmits(['close', 'created']);
const comprasStore = useComprasStore();

// Form Data
const fechaEntrega = ref('');
const observacion = ref('');
const selectedEquipos = ref<{ cod_equipo: string }[]>([]);
const searchEquipo = ref('');
const searchProducto = ref('');
const showEquiposDropdown = ref(false);
const showProductosDropdown = ref(false);

const allEquipos = ref<any[]>([]);

// Product search state
const productosResult = ref<any[]>([]);
const isSearchingProductos = ref(false);
const hasMoreProductos = ref(false);
const productosOffset = ref(0);
const productosCache = ref<Record<string, { data: any[], hasMore: boolean }>>({});
let searchDebounceTimeout: any = null;

const userEmail = ref('');
const isSubmitting = ref(false);
const errorMsg = ref('');

// Details table
interface DetalleManual {
  id: string;
  isManual: boolean;
  cod_producto: string | null;
  descripcion: string;
  unidad: string | null;
  cantidad: number;
}
const detalles = ref<DetalleManual[]>([]);

onMounted(async () => {
  // Get user profile email
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    userEmail.value = user.email || '';
  }

  // Set minimum date to today
  const today = new Date();
  fechaEntrega.value = today.toISOString().split('T')[0];

  // Load Equipos
  const { data: eqData } = await supabaseEquipos.from('equipos').select('cod_equipo').limit(200);
  allEquipos.value = eqData || [];
});

// Teams methods
const filteredEquipos = computed(() => {
  if (!searchEquipo.value) return allEquipos.value.slice(0, 20);
  const q = searchEquipo.value.toLowerCase();
  return allEquipos.value.filter(e => e.cod_equipo.toLowerCase().includes(q)).slice(0, 20);
});

const selectEquipo = (equipo: any) => {
  if (!selectedEquipos.value.some(e => e.cod_equipo === equipo.cod_equipo)) {
    selectedEquipos.value.push(equipo);
  }
  searchEquipo.value = '';
  showEquiposDropdown.value = false;
};

const removeEquipo = (cod: string) => {
  selectedEquipos.value = selectedEquipos.value.filter(e => e.cod_equipo !== cod);
};

// Products search logic
const performProductSearch = async (term: string, offset: number = 0, isLoadMore: boolean = false) => {
  const cleanTerm = term.trim();
  
  if (cleanTerm.length < 4) {
    productosResult.value = [];
    hasMoreProductos.value = false;
    return;
  }

  const cacheKey = `${cleanTerm}_${offset}`;
  if (!isLoadMore && productosCache.value[cacheKey]) {
    productosResult.value = productosCache.value[cacheKey].data;
    hasMoreProductos.value = productosCache.value[cacheKey].hasMore;
    return;
  }

  isSearchingProductos.value = true;

  try {
    const { data, error } = await supabaseCompras
      .from("producto")
      .select(`
        id,
        cod_producto,
        descripcion,
        unidad_medida_id,
        unidad_medida (
          id,
          abreviatura
        )
      `)
      .or(`cod_producto.ilike.%${cleanTerm}%,descripcion.ilike.%${cleanTerm}%`)
      .order("descripcion", { ascending: true })
      .range(offset, offset + 29)
      .limit(30);

    if (error) throw error;

    const items = data || [];
    const hasMore = items.length === 30;

    if (isLoadMore) {
      productosResult.value = [...productosResult.value, ...items];
    } else {
      productosResult.value = items;
    }
    
    hasMoreProductos.value = hasMore;
    
    // Cache the result
    productosCache.value[cacheKey] = {
      data: [...productosResult.value],
      hasMore
    };

  } catch (err) {
    console.error("Error searching products:", err);
  } finally {
    isSearchingProductos.value = false;
  }
};

watch(searchProducto, (newVal) => {
  if (searchDebounceTimeout) clearTimeout(searchDebounceTimeout);
  
  if (newVal.trim().length < 4) {
    productosResult.value = [];
    hasMoreProductos.value = false;
    return;
  }

  searchDebounceTimeout = setTimeout(() => {
    productosOffset.value = 0;
    performProductSearch(newVal, 0, false);
  }, 400);
});

const loadMoreProducts = () => {
  productosOffset.value += 30;
  performProductSearch(searchProducto.value, productosOffset.value, true);
};

const selectProducto = (prod: any) => {
  if (!detalles.value.some(d => d.cod_producto === prod.cod_producto)) {
    detalles.value.push({
      id: crypto.randomUUID(),
      isManual: false,
      cod_producto: prod.cod_producto,
      descripcion: prod.descripcion,
      unidad: prod.unidad_medida?.abreviatura || null,
      cantidad: 1,
    });
  }
  searchProducto.value = '';
  showProductosDropdown.value = false;
  productosResult.value = [];
};

const addManualItem = () => {
  detalles.value.push({
    id: crypto.randomUUID(),
    isManual: true,
    cod_producto: null,
    descripcion: '',
    unidad: null,
    cantidad: 1,
  });
};

const removeDetalle = (id: string) => {
  detalles.value = detalles.value.filter(d => d.id !== id);
};

const saveSolicitud = async () => {
  errorMsg.value = '';
  
  if (!fechaEntrega.value) { errorMsg.value = 'Fecha de entrega es requerida'; return; }
  if (!observacion.value) { errorMsg.value = 'Observación es requerida'; return; }
  if (selectedEquipos.value.length === 0) { errorMsg.value = 'Debe seleccionar al menos un equipo'; return; }
  if (detalles.value.length === 0) { errorMsg.value = 'Debe agregar al menos un producto'; return; }
  
  const invalidManual = detalles.value.find(d => d.isManual && (!d.descripcion || d.descripcion.trim() === ''));
  if (invalidManual) { errorMsg.value = 'Todos los ítems manuales deben tener descripción'; return; }
  
  if (detalles.value.some(d => d.cantidad <= 0)) { errorMsg.value = 'Las cantidades deben ser mayores a cero'; return; }

  isSubmitting.value = true;
  try {
    // Generate UUID logically (optional, Supabase will generate one, we'll let it and return it)
    const dt = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${dt.getFullYear()}${pad(dt.getMonth()+1)}${pad(dt.getDate())}`;
    const rnd = Math.floor(Math.random() * 9000 + 1000);
    const folioTemporal = `TMP-COMP-${dateStr}-${rnd}`;

    // 1. Insert in bdcompras.solicitud_compra
    const { data: solData, error: solError } = await supabaseCompras.from('solicitud_compra').insert({
      folio_sol: folioTemporal,
      email: userEmail.value,
      estado_id: 1,
      fecha_entrega: fechaEntrega.value,
      fecha_creacion: new Date().toISOString(),
      observacion: observacion.value
    }).select('id').single();

    if (solError) throw solError;
    const solicitudId = solData.id;

    // 2. Insert Details in bdcompras
    const detallesToInsert = detalles.value.map(d => {
      // Create temporary code for manual items at insertion time
      let finalCode = d.cod_producto;
      if (d.isManual && !finalCode) {
        const rndProd = Math.floor(Math.random() * 9000 + 1000);
        finalCode = `TMP-PROD-${rndProd}`;
      }
      return {
        solicitud_id: solicitudId,
        folio_sol: folioTemporal,
        cod_producto: finalCode,
        descripcion_manual: d.isManual ? d.descripcion : null,
        cantidad: d.cantidad,
      };
    });

    const { error: detError } = await supabaseCompras.from('detalle_solicitud').insert(detallesToInsert);
    if (detError) throw detError;

    // 3. Insert Equipos in mantenimiento
    const equiposToInsert = selectedEquipos.value.map(eq => ({
      solicitud_id: solicitudId,
      folio_sol: folioTemporal,
      cod_equipo: eq.cod_equipo
    }));

    const { error: eqError } = await supabaseEquipos.from('equipo_solicitudes').insert(equiposToInsert);
    if (eqError) throw eqError;

    // Success
    emit('created');
    emit('close');
  } catch (err: any) {
    console.error(err);
    errorMsg.value = err.message || 'Ocurrió un error al guardar la solicitud';
  } finally {
    isSubmitting.value = false;
  }
};

</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
    <div class="absolute inset-0 bg-main-dark/50 backdrop-blur-sm" @click="$emit('close')"></div>
    
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative z-10 overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-accent/20 text-main flex items-center justify-center">
            <ShoppingCart class="w-5 h-5" />
          </div>
          <div>
            <h2 class="font-display font-bold text-xl text-main-dark">Nueva Solicitud</h2>
            <p class="text-xs text-gray-500">Folio será generado temporalmente</p>
          </div>
        </div>
        <button @click="$emit('close')" class="p-2 text-gray-400 hover:text-danger hover:bg-red-50 rounded-full transition-colors">
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        
        <div v-if="errorMsg" class="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-4 border border-red-200">
          {{ errorMsg }}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Fecha Entrega -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-gray-500 uppercase tracking-wide">Fecha de Entrega <span class="text-red-500">*</span></label>
            <input 
              v-model="fechaEntrega" 
              type="date" 
              class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent outline-none transition-all cursor-pointer"
            />
          </div>

          <!-- Auto email display -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-gray-500 uppercase tracking-wide">Solicitante</label>
            <div class="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-500">
              {{ userEmail }}
            </div>
          </div>
        </div>

        <!-- Observacion -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-gray-500 uppercase tracking-wide">Observación <span class="text-red-500">*</span></label>
          <textarea 
            v-model="observacion"
            rows="2"
            placeholder="Justificación o detalles de la solicitud..."
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
          ></textarea>
        </div>

        <!-- Selector de Equipos -->
        <div class="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <label class="text-xs font-bold text-gray-500 uppercase tracking-wide">Equipos Asociados <span class="text-red-500">*</span></label>
          
          <div class="flex flex-wrap gap-2 mb-2">
            <div v-for="eq in selectedEquipos" :key="eq.cod_equipo" class="bg-main text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
              <span>{{ eq.cod_equipo }}</span>
              <button @click="removeEquipo(eq.cod_equipo)" class="text-white hover:text-red-300"><X class="w-3.5 h-3.5"/></button>
            </div>
          </div>

          <div class="relative">
            <div class="flex items-center relative">
              <Search class="absolute left-3 w-4 h-4 text-gray-400" />
              <input 
                v-model="searchEquipo"
                @focus="showEquiposDropdown = true"
                type="text" 
                placeholder="Buscar equipo por código o nombre..."
                class="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent outline-none"
              />
            </div>
            
            <div v-if="showEquiposDropdown && filteredEquipos.length > 0" class="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
              <div 
                v-for="eq in filteredEquipos" 
                :key="eq.cod_equipo"
                @click="selectEquipo(eq)"
                class="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
              >
                <div class="font-bold text-sm text-gray-700">{{ eq.cod_equipo }}</div>
              </div>
            </div>
            <div v-else-if="showEquiposDropdown && searchEquipo" class="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-sm text-gray-500 text-center">
              No se encontraron equipos
            </div>
          </div>
        </div>

        <!-- Selector de Productos y Tabla -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
             <label class="text-xs font-bold text-gray-500 uppercase tracking-wide">Productos / Servicios <span class="text-red-500">*</span></label>
             <button @click="addManualItem" class="text-xs font-bold text-main hover:text-accent flex items-center gap-1 bg-main/5 px-2 py-1 rounded">
               <Plus class="w-3.5 h-3.5" /> Agregar Ítem Manual
             </button>
          </div>

          <div class="relative mt-2">
            <div class="flex items-center relative">
              <Search class="absolute left-3 w-4 h-4 text-gray-400" />
              <input 
                v-model="searchProducto"
                @focus="showProductosDropdown = true"
                type="text" 
                placeholder="Buscar producto de almacén..."
                class="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent outline-none"
              />
            </div>
            
            <div v-if="showProductosDropdown" class="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto flex flex-col">
              <div v-if="searchProducto.trim().length < 4" class="p-4 text-sm text-gray-500 text-center">
                Escribe al menos 4 caracteres para buscar.
              </div>
              
              <div v-else-if="isSearchingProductos && productosResult.length === 0" class="p-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2 class="w-4 h-4 animate-spin text-main" /> Buscando...
              </div>

              <div v-else-if="productosResult.length === 0" class="p-4 text-sm text-gray-500 text-center">
                No se encontraron productos.
              </div>
              
              <template v-else>
                <div 
                  v-for="prod in productosResult" 
                  :key="prod.cod_producto"
                  @click="selectProducto(prod)"
                  class="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 shrink-0"
                >
                  <div class="font-bold text-sm text-gray-700">{{ prod.cod_producto }}</div>
                  <div class="text-xs text-gray-500">{{ prod.descripcion }}</div>
                </div>

                <div v-if="hasMoreProductos" class="p-2 shrink-0">
                  <button 
                    @click.stop="loadMoreProducts" 
                    :disabled="isSearchingProductos"
                    class="w-full py-2 text-xs font-bold text-main bg-main/5 hover:bg-main/10 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Loader2 v-if="isSearchingProductos" class="w-3.5 h-3.5 animate-spin" />
                    {{ isSearchingProductos ? 'Cargando más...' : 'Cargar más' }}
                  </button>
                </div>
              </template>
            </div>
          </div>

          <!-- Table -->
          <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden mt-4">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse min-w-[600px]">
                <thead class="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-32">Código</th>
                    <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Descripción</th>
                    <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-24">Unidad</th>
                    <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-24">Cantidad</th>
                    <th class="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-16"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="item in detalles" :key="item.id" class="hover:bg-gray-50/50">
                    <td class="py-3 px-4">
                      <span v-if="!item.isManual" class="text-sm font-medium text-gray-700">{{ item.cod_producto }}</span>
                      <span v-else class="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-bold uppercase">Manual</span>
                    </td>
                    <td class="py-3 px-4">
                      <input 
                        v-if="item.isManual" 
                        v-model="item.descripcion" 
                        type="text" 
                        maxlength="255"
                        placeholder="Descripción manual..."
                        class="w-full px-3 py-1.5 border border-dashed border-gray-300 rounded focus:border-accent focus:ring-1 focus:ring-accent outline-none text-sm"
                      />
                      <span v-else class="text-sm text-gray-600">{{ item.descripcion }}</span>
                    </td>
                    <td class="py-3 px-4">
                      <span class="text-sm text-gray-600 font-medium">{{ item.unidad || '-' }}</span>
                    </td>
                    <td class="py-3 px-4">
                      <input 
                        v-model.number="item.cantidad" 
                        type="number" 
                        min="1"
                        class="w-full px-3 py-1.5 border border-gray-200 rounded focus:border-accent outline-none text-sm"
                      />
                    </td>
                    <td class="py-3 px-4 text-right">
                      <button @click="removeDetalle(item.id)" class="text-gray-400 hover:text-danger p-1">
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="detalles.length === 0">
                    <td colspan="4" class="py-8 text-center text-sm text-gray-400">
                      Agregue productos desde la búsqueda o como ítem manual.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 mt-auto relative z-20">
        <button 
          @click="$emit('close')"
          type="button"
          class="px-6 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-200 transition-colors"
          :disabled="isSubmitting"
        >
          Cancelar
        </button>
        <button 
          @click="saveSolicitud"
          type="button"
          class="px-6 py-2.5 rounded-xl font-bold bg-accent text-main-dark hover:brightness-110 transition-all shadow-sm flex items-center gap-2"
          :disabled="isSubmitting"
        >
          <Save v-if="!isSubmitting" class="w-4 h-4" />
          <div v-else class="w-4 h-4 border-2 border-main-dark border-t-transparent rounded-full animate-spin"></div>
          {{ isSubmitting ? 'Guardando...' : 'Crear Solicitud' }}
        </button>
      </div>

    </div>
  </div>
</template>