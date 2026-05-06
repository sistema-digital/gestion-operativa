<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase, supabaseCompras, supabaseEquipos } from '@/lib/supabase';
import { ArrowLeft, Edit2, Save, ShoppingCart, Calendar, Clock, User, Layers, Tag, Check, X } from 'lucide-vue-next';
import { useComprasStore } from '@/stores/comprasStore';

const route = useRoute();
const router = useRouter();
const store = useComprasStore();

const id = route.params.id as string;
const isLoading = ref(true); // Para cuando se recarga la página y no hay datos master
const isDetallesLoading = ref(true); // Para cargar los detalles de la tabla
const errorMsg = ref('');

const solicitud = ref<any>(null);
const detalles = ref<any[]>([]);
const equipos = ref<any[]>([]);

const userArea = ref('');

// Folio Replacement
const isEditingFolio = ref(false);
const newFolioReal = ref('');

// Roles
const isAlmacen = computed(() => userArea.value === 'ALMACEN' || userArea.value === 'ALL');
const isGerencia = computed(() => userArea.value === 'GERENCIA' || userArea.value === 'ALL');

const loadData = async () => {
  errorMsg.value = '';
  try {
    // 1. Solicitud (Master Data)
    let cachedSol = store.solicitudes.find(s => s.id === id);
    
    if (cachedSol) {
      // Re-use from store
      solicitud.value = { 
        ...cachedSol,
        _is_temp: cachedSol.folio_sol?.startsWith('TMP-COMP-') || cachedSol.folio_sol === 'Num Req No asignado'
      };
      equipos.value = cachedSol.equipos || [];
    } else {
      // Not in store (e.g. reload), fetch manually
      const { data: solData, error: solError } = await supabaseCompras
        .from('solicitud_compra')
        .select('*')
        .eq('id', id)
        .single();
      if (solError) throw solError;
      
      // Resolve Solicitante name
      let nombreSol = solData.email || 'Nombre no asignado';
      solData.nombreSolicitante = nombreSol;
      
      // Transform Folio if Temp
      solData._is_temp = solData.folio_sol?.startsWith('TMP-COMP-');
      if (solData._is_temp) {
         solData.folio_sol = 'Num Req No asignado';
      }
      
      solicitud.value = solData;

      // Equipos
      const { data: eqData, error: eqError } = await supabaseEquipos
        .from('equipo_solicitudes')
        .select('cod_equipo')
        .eq('solicitud_id', id);
      if (!eqError && eqData) {
        equipos.value = eqData;
      }
    }

    if (!store.estados.length) {
      await store.fetchEstados();
    }
    
    isLoading.value = false; // Render Master Data directly now.

    // 2. Detalles (Always fetch from DB when opening detail to get latest inventory/status)
    isDetallesLoading.value = true;
    const { data: detData, error: detError } = await supabaseCompras
      .from('detalle_solicitud')
      .select('*, producto(descripcion, unidad_medida(abreviatura))')
      .eq('solicitud_id', id);
    if (detError) throw detError;
    
    // Copy into local ref for editing
    detalles.value = (detData || []).map(d => ({
       ...d,
       _original_inventario: d.cantidad_inventario,
       _original_gerencia: d.cantidad_gerencia
    }));

  } catch (e: any) {
    console.error(e);
    errorMsg.value = 'Error al cargar los datos: ' + e.message;
  } finally {
    isLoading.value = false;
    isDetallesLoading.value = false;
  }
};

onMounted(async () => {
  // Get User Profile Area
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data } = await supabase.from('PROFILE').select('area').eq('email', user.email).maybeSingle();
    if (data) {
      userArea.value = (data.area || '').toUpperCase();
    }
  }

  await loadData();
});

import { formatDateDisplay } from '@/utils/dateUtils';

const formatDate = (ds: string | null) => {
  return formatDateDisplay(ds);
};

const getDesc = (item: any) => {
  const desc = item.producto?.descripcion || 'Producto sin descripción';
  const unit = item.producto?.unidad_medida?.abreviatura || '';
  return unit ? `${unit} - ${desc}` : desc;
};

const saveQuantities = async () => {
    isSubmittingQuantities.value = true;
    errorMsg.value = '';
    try {
        for(const item of detalles.value) {
            let updates: any = {};
            let hasUpdate = false;
            
            // Check quantities
            if (isAlmacen.value && item.cantidad_inventario !== item._original_inventario) {
                updates.cantidad_inventario = item.cantidad_inventario;
                hasUpdate = true;
            }
            if (isGerencia.value && item.cantidad_gerencia !== item._original_gerencia) {
                updates.cantidad_gerencia = item.cantidad_gerencia;
                hasUpdate = true;
            }

            // Check new code
            if (isAlmacen.value && item.new_cod_producto && item.new_cod_producto.trim() !== '') {
                updates.cod_producto = item.new_cod_producto.trim();
                hasUpdate = true;
            }

            if (hasUpdate) {
                const { error } = await supabaseCompras
                    .from('detalle_solicitud')
                    .update(updates)
                    .eq('id', item.id);
                if (error) throw error;
                item._original_inventario = item.cantidad_inventario;
                item._original_gerencia = item.cantidad_gerencia;
                if (updates.cod_producto) {
                    item.cod_producto = updates.cod_producto;
                    item.new_cod_producto = '';
                }
            }
        }
        alert('Cantidades guardadas exitosamente.');
    } catch(e: any) {
        console.error(e);
        errorMsg.value = 'Error guardando cantidades: ' + e.message;
    } finally {
        isSubmittingQuantities.value = false;
    }
};

const isSubmittingQuantities = ref(false);

const replaceFolio = async () => {
    if (!newFolioReal.value || !newFolioReal.value.trim()) return;
    
    try {
        // Validate unique
        const { data: existing } = await supabaseCompras
           .from('solicitud_compra')
           .select('id')
           .eq('folio_sol', newFolioReal.value)
           .maybeSingle();
           
        if (existing) {
            alert('El folio ya existe. Utilice otro.');
            return;
        }

        const realFolio = newFolioReal.value.trim();

        // 1. bdcompras: solicitud_compra
        await supabaseCompras.from('solicitud_compra').update({ folio_sol: realFolio }).eq('id', id);
        
        // 2. bdcompras: detalle_solicitud
        await supabaseCompras.from('detalle_solicitud').update({ folio_sol: realFolio }).eq('solicitud_id', id);

        // 3. mantenimiento: equipo_solicitudes
        await supabaseEquipos.from('equipo_solicitudes').update({ folio_sol: realFolio }).eq('solicitud_id', id);

        solicitud.value.folio_sol = realFolio;
        solicitud.value._is_temp = false;
        isEditingFolio.value = false;
        
        // Refresh store
        await store.fetchSolicitudes();

    } catch(e: any) {
        console.error(e);
        alert('Error reemplazando folio: ' + e.message);
    }
};

</script>

<template>
  <div class="h-full flex flex-col overflow-y-auto pb-32 md:pb-8">
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <div class="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
    <div v-else-if="errorMsg" class="p-8 text-center text-red-600 font-medium">
      {{ errorMsg }}
      <button @click="router.push('/compras')" class="block mx-auto mt-4 px-4 py-2 border rounded-xl hover:bg-gray-50 text-gray-700 cursor-pointer">Volver</button>
    </div>
    <div v-else class="max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6">
      
      <!-- Top Action Bar -->
      <div class="flex items-center justify-between mb-2">
        <button @click="router.push('/compras')" class="flex items-center gap-2 text-gray-500 hover:text-main font-medium transition-colors cursor-pointer">
          <ArrowLeft class="w-5 h-5" /> Regresar
        </button>
      </div>

      <!-- Header Card -->
      <div class="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-accent/20 flex-shrink-0 to-transparent rounded-bl-[100px] pointer-events-none"></div>
        
        <div class="flex-1 space-y-6 z-10 w-full">
          <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <span class="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg uppercase tracking-wider mb-3">
                <Tag class="w-3.5 h-3.5" />
                {{ store.getEstadoName(solicitud.estado_id) }}
              </span>
              
              <div class="flex items-center gap-3">
                 <h1 class="text-3xl md:text-4xl font-display font-bold text-main-dark">
                   {{ solicitud.folio_sol }}
                 </h1>
                 
                 <button v-if="isAlmacen && !isEditingFolio && solicitud._is_temp" @click="isEditingFolio = true" class="text-gray-400 hover:text-main p-1">
                    <Edit2 class="w-4 h-4" />
                 </button>
              </div>

              <div v-if="isEditingFolio" class="flex flex-col sm:flex-row items-center gap-2 mt-3">
                  <input v-model="newFolioReal" type="text" placeholder="Asignar folio real (e.g., SC-2026-0001)" class="w-full sm:w-64 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-accent focus:border-accent">
                  <div class="flex gap-1 shrink-0">
                      <button @click="replaceFolio" class="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><Check class="w-4 h-4"/></button>
                      <button @click="isEditingFolio = false; newFolioReal = ''" class="p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"><X class="w-4 h-4"/></button>
                  </div>
              </div>
            </div>
            
            <button 
              v-if="solicitud.estado_id === 1 || solicitud.estado_id === 2" 
              @click="router.push(`/compras/${id}/editar`)" 
              class="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 text-gray-700 font-bold transition-all shadow-sm shrink-0 cursor-pointer"
            >
              <Edit2 class="w-4 h-4" /> Editar
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-6 border-t border-gray-50">
            <div class="flex items-start gap-3">
              <User class="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Solicitante</p>
                <p class="text-sm font-medium text-gray-900 mt-0.5 uppercase">{{ solicitud.nombreSolicitante || solicitud.email }}</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Calendar class="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Creación</p>
                <p class="text-sm font-medium text-gray-900 mt-0.5">{{ formatDate(solicitud.fecha_creacion) }}</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Clock class="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Entrega Solicitada</p>
                <p class="text-sm font-medium text-gray-900 mt-0.5">{{ formatDate(solicitud.fecha_entrega) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="flex flex-col gap-6">

        <!-- Fila 1: Tabla Detalles -->
        <div class="w-full relative">
          <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
            <div class="p-6 border-b border-gray-50 flex items-center justify-between">
              <h3 class="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <ShoppingCart class="w-4 h-4 text-main"/> Ítems Solicitados
              </h3>
              
              <button 
                  v-if="(isAlmacen || isGerencia) && solicitud.estado_id !== 1" 
                  @click="saveQuantities"
                  :disabled="isSubmittingQuantities"
                  class="flex items-center gap-2 px-4 py-2 bg-main text-white text-xs font-bold rounded-lg hover:bg-main-dark transition-colors disabled:opacity-50"
              >
                  <Save class="w-3.5 h-3.5" /> {{ isSubmittingQuantities ? 'Guardando...' : 'Guardar Cantidades' }}
              </button>
            </div>
            
            <div class="overflow-x-auto relative min-h-[150px]">
              <div v-if="isDetallesLoading" class="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center">
                 <div class="w-6 h-6 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
              <table class="w-full text-left border-collapse min-w-[700px]">
                <thead class="bg-gray-50/50">
                  <tr>
                    <th class="py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-[15%]">Código</th>
                    <th class="py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Descripción</th>
                    <th v-if="solicitud.estado_id !== 1" class="py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center w-24">Unidad</th>
                    <th v-if="solicitud.estado_id !== 1" class="py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center w-24">Cant. Solicitada</th>
                    <th v-if="solicitud.estado_id !== 1" class="py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center w-24">Cant. Inventario</th>
                    <th v-if="solicitud.estado_id !== 1" class="py-4 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center w-24">Cant. Gerencia</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr v-for="item in detalles" :key="item.id" class="hover:bg-gray-50/30 transition-colors">
                    <td class="py-4 px-6">
                      <div v-if="isAlmacen && item.cod_producto && item.cod_producto.startsWith('TMP-PROD')">
                         <input v-model="item.new_cod_producto" :placeholder="item.cod_producto" class="w-full px-2 py-1 border border-gray-300 yellow-50 rounded text-xs font-bold text-gray-800 outline-none focus:ring-1 focus:ring-accent">
                      </div>
                      <span v-else-if="item.cod_producto" class="text-sm font-bold text-gray-800">
                        <template v-if="item.cod_producto.startsWith('MNL-')">
                          <span class="text-gray-500 font-medium italic text-xs">No Asignado</span>
                        </template>
                        <template v-else>
                          {{ item.cod_producto }}
                          <span v-if="item.cod_producto.startsWith('TMP-PROD')" class="ml-1 text-[9px] bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded font-bold uppercase tracking-wide">Temp</span>
                        </template>
                      </span>
                      <span v-else class="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-bold uppercase tracking-wide">Manual</span>
                    </td>
                    <td class="py-4 px-6">
                      <span class="text-sm text-gray-600 truncate block">{{ getDesc(item) }}</span>
                    </td>
                    <td v-if="solicitud.estado_id !== 1" class="py-4 px-6 text-center">
                      <span class="text-sm text-gray-600 font-medium">{{ item.producto?.unidad_medida?.abreviatura || '-' }}</span>
                    </td>
                    <td v-if="solicitud.estado_id !== 1" class="py-4 px-6 text-center">
                      <span class="text-sm font-bold text-main">{{ item.cantidad }}</span>
                    </td>
                    <!-- Inventario -->
                    <td v-if="solicitud.estado_id !== 1" class="py-4 px-6 text-center">
                      <div v-if="isAlmacen">
                          <input v-model.number="item.cantidad_inventario" type="number" min="0" class="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm font-medium focus:ring-1 focus:ring-accent outline-none">
                      </div>
                      <span v-else class="text-sm font-medium text-gray-600">{{ item.cantidad_inventario !== null ? item.cantidad_inventario : '-' }}</span>
                    </td>
                    <!-- Gerencia -->
                    <td v-if="solicitud.estado_id !== 1" class="py-4 px-6 text-center">
                      <div v-if="isGerencia">
                          <input v-model.number="item.cantidad_gerencia" type="number" min="0" class="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm font-medium focus:ring-1 focus:ring-accent outline-none">
                      </div>
                      <span v-else class="text-sm font-medium text-gray-600">{{ item.cantidad_gerencia !== null ? item.cantidad_gerencia : '-' }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Fila 2: Observación & Equipos (en una sola fila ambos) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 class="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
               <Layers class="w-4 h-4 text-main"/> Equipos
            </h3>
            <div class="flex flex-wrap gap-2">
              <span v-for="eq in equipos" :key="eq.cod_equipo" class="px-3 py-1.5 bg-blue-50 text-blue-700 font-medium text-xs rounded-xl border border-blue-100">
                {{ eq.cod_equipo }}
              </span>
              <span v-if="equipos.length === 0" class="text-sm text-gray-400">Sin equipos asociados</span>
            </div>
          </div>

          <div class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 class="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 flex items-center gap-2">
               Observación
            </h3>
            <p class="text-sm text-gray-600 leading-relaxed">{{ solicitud.observacion }}</p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
