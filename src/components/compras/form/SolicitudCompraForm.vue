<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { supabaseCompras, supabaseEquipos } from '@/lib/supabase';
import BaseDateField from '@/components/BaseDateField.vue';
import { useComprasStore } from '@/stores/comprasStore';
import { useUserStore } from '@/stores/userStore';
import type { ActualizarSolicitudAlmacen } from '@/components/compras/list/types';
import {
  X,
  Search,
  Plus,
  Ban,
  Undo2,
  Save,
  ShoppingCart,
  Loader2,
  ArrowLeft,
  AlertTriangle
} from 'lucide-vue-next';
import { getPermisosFormSolicitud, type PermisosFormSolicitud } from './permisosForm';

const props = defineProps({
  mode: {
    type: String,
    default: 'create' // 'create' | 'edit'
  },
  initialData: {
    type: Object,
    default: null
  },
  permisosForm: {
    type: Object as () => PermisosFormSolicitud | null,
    default: null
  },
  readonly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'created', 'updated']);
const comprasStore = useComprasStore();
const userStore = useUserStore();

// Form Data
const fechaEntrega = ref('');
const observacion = ref('');
const isUrgent = ref(false);
const selectedEquipos = ref<{ cod_equipo: string }[]>([]);
const searchEquipo = ref('');
const searchProducto = ref('');
const showEquiposDropdown = ref(false);
const showProductosDropdown = ref(false);
const showConfirmCancel = ref(false);
const isClosing = ref(false);


const permisosFormSolicitud = computed(() =>
  props.permisosForm ??
  getPermisosFormSolicitud({
    mode: props.mode,
    initialData: props.initialData,
    userArea: userStore.getArea()
  })
);

const showCantidad = computed(() => permisosFormSolicitud.value.showCantidad);
const canEditCantidadInventario = computed(
  () => !props.readonly && permisosFormSolicitud.value.canEditCantidadInventario
);
const canEditFechaEntrega = computed(
  () => !props.readonly && permisosFormSolicitud.value.canEditFechaEntrega
);
const canEditEquipos = computed(
  () => !props.readonly && permisosFormSolicitud.value.canEditEquipos
);
const canEditObservacion = computed(
  () => !props.readonly && permisosFormSolicitud.value.canEditObservacion
);
const canManageProductos = computed(
  () => !props.readonly && permisosFormSolicitud.value.canManageProductos
);
const isAlmacen = computed(() => permisosFormSolicitud.value.area === 'almacen');
const showPriorityUrgentBadge = computed(
  () => Number(props.initialData?.prioridad_id) === 3
);
const isReadOnly = computed(() => props.readonly);

const showUrgencyCheck = computed(() => {
  if (props.mode === 'create') return true;
  return [1, 2].includes(Number(props.initialData?.estado_id));
});

const getInitialUrgency = () => {
  const data = props.initialData || {};
  return Boolean(data.isUrgent ?? data.is_urgent ?? data.isurgent);
};

const fieldErrors = ref({
  fechaEntrega: '',
  equipos: '',
  productos: '',
  observacion: '',
  general: ''
});

const hasUnsavedChanges = computed(() => {
  if (isReadOnly.value) return false;

  if (props.mode === 'edit' && props.initialData) {
    const origFecha = props.initialData.fecha_entrega || '';
    const origObs = props.initialData.observacion || '';
    const origEquipos = props.initialData.equipos?.length || 0;
    const origDetalles = props.initialData.detalles?.length || 0;
    
    // Very simple check for edit, can be more complex if needed
    return (
      fechaEntrega.value !== origFecha ||
      observacion.value !== origObs ||
      isUrgent.value !== getInitialUrgency() ||
      selectedEquipos.value.length !== origEquipos ||
      detalles.value.length !== origDetalles
    );
  }
  return (
    fechaEntrega.value !== '' ||
    observacion.value !== '' ||
    isUrgent.value ||
    selectedEquipos.value.length > 0 ||
    detalles.value.length > 0
  );
});

const router = useRouter();
const route = useRoute();

let isNavigationAllowed = false;
let pendingRouteTarget: any = null;

const checkNavigation = (to: any, next: any) => {
  if (isNavigationAllowed) {
    next();
    return;
  }
  
  if (hasUnsavedChanges.value) {
    showConfirmCancel.value = true;
    pendingRouteTarget = to;
    next(false);
  } else {
    next();
  }
};

defineExpose({ checkNavigation });

const confirmCancel = () => {
  showConfirmCancel.value = false;
  isNavigationAllowed = true;
  if (pendingRouteTarget) {
    router.push(pendingRouteTarget);
  } else {
    closeForm();
  }
};

const closeForm = () => {
  isNavigationAllowed = true;
  emit('close');
};

const handleBack = () => {
  if (hasUnsavedChanges.value) {
    showConfirmCancel.value = true;
    pendingRouteTarget = route.params.id ? `/compras/${route.params.id}` : '/compras';
  } else {
    closeForm();
  }
};

const handleCancelBtn = () => {
  if (hasUnsavedChanges.value) {
    showConfirmCancel.value = true;
    pendingRouteTarget = '/compras'; // Cancelar should close the panel completely
  } else {
    isNavigationAllowed = true;
    router.push('/compras');
  }
};

const closeConfirm = () => {
  showConfirmCancel.value = false;
};

const allEquipos = ref<any[]>([]);

// Product search state
const productosResult = ref<any[]>([]);
const isSearchingProductos = ref(false);
const hasMoreProductos = ref(false);
const productosOffset = ref(0);
const productosCache = ref<Record<string, { data: any[]; hasMore: boolean }>>({});
let searchDebounceTimeout: any = null;

const userEmail = ref('');
const userName = ref('');
const isSubmitting = ref(false);
const errorMsg = ref('');

const unidadesMedida = ref<{ id: string | number; abreviatura: string }[]>([]);

// Details table
interface DetalleManual {
  ui_id: string;
  db_id: string | null;
  isManual: boolean;
  cod_producto: string|null;
  descripcion: string;
  unidad_id: string;
  unidad: string|null;
  cantidad: number|null;
  cantidad_inventario: number|null;
  estatus_detalle: number|null;
  descartado: boolean;
}

const detalles = ref<DetalleManual[]>([]);

onMounted(async () => {
  if (props.mode === 'edit' && props.initialData && props.initialData.email) {
    userEmail.value = props.initialData.email;
    userName.value = props.initialData.nombreSolicitante || props.initialData.email.split('@')[0];
  } else {
    await userStore.fetchCurrentUserProfile();
    userEmail.value = userStore.getEmail();
    userName.value = userStore.getNombre() || userEmail.value.split('@')[0];
  }

  // Load Unidades de Medida
  const { data: unidadData, error: unidadError } = await supabaseCompras
    .from('unidad_medida')
    .select('id, abreviatura')
    .order('abreviatura');

  if (unidadError) {
    console.error('Error cargando unidades de medida:', unidadError);
  }

  if (unidadData) {
    unidadesMedida.value = unidadData;
  }

  // Load Equipos
  const { data: eqData, error: eqError } = await supabaseEquipos
    .from('equipos')
    .select('cod_equipo')
    .limit(200);

  if (eqError) {
    console.error('Error cargando equipos:', eqError);
  }

  allEquipos.value = eqData || [];

  // Modo edición
  if (props.mode === 'edit' && props.initialData) {
    fechaEntrega.value = props.initialData.fecha_entrega || '';
    observacion.value = props.initialData.observacion || '';
    isUrgent.value = getInitialUrgency();
    selectedEquipos.value = props.initialData.equipos
      ? [...props.initialData.equipos]
      : [];

    if (props.initialData.detalles) {
      detalles.value = props.initialData.detalles.map((d: any) => {
        const codProducto = d.cod_producto ? String(d.cod_producto) : null;

        const isManual =
          !codProducto ||
          codProducto.trim().toUpperCase().startsWith('MNL-');

        const unidadIdRaw = d.producto?.unidad_medida?.id ?? null;

        const unidadAbreviatura =
          d.unidad_medida?.abreviatura ??
          d.producto?.unidad_medida?.abreviatura ??
          d.unidad ??
          d.unidad_abreviatura ??
          null;

        let unidadIdFinal = '';

        if (unidadIdRaw !== null && unidadIdRaw !== undefined) {
          unidadIdFinal = String(unidadIdRaw);
        } else if (unidadAbreviatura) {
          const unidadEncontrada = unidadesMedida.value.find(
            u =>
              String(u.abreviatura).trim().toUpperCase() ===
              String(unidadAbreviatura).trim().toUpperCase()
          );

          unidadIdFinal = unidadEncontrada ? String(unidadEncontrada.id) : '';
        }

        return {
          ui_id: d.id ? String(d.id) : crypto.randomUUID(),
          db_id: d.id ? String(d.id) : null,
          isManual,
          cod_producto: codProducto,
          descripcion: d.producto?.descripcion || d.descripcion || '',
          unidad_id: unidadIdFinal,
          unidad: unidadAbreviatura,
          cantidad: d.cantidad,
          cantidad_inventario: d.cantidad_inventario ?? null,
          estatus_detalle: d.estatus_detalle ?? d.estatus_datalle ?? null,
          descartado: false
        };
      });
    }
  } else {
    fechaEntrega.value = '';
  }
});

// Teams methods
const filteredEquipos = computed(() => {
  if (!searchEquipo.value) return allEquipos.value.slice(0, 20);

  const q = searchEquipo.value.toLowerCase();

  return allEquipos.value
    .filter(e => e.cod_equipo.toLowerCase().includes(q))
    .slice(0, 20);
});

const toggleEquipo = (equipo: any) => {
  if (!canEditEquipos.value) return;

  const index = selectedEquipos.value.findIndex(
    e => e.cod_equipo === equipo.cod_equipo
  );

  if (index > -1) {
    selectedEquipos.value.splice(index, 1);
  } else {
    selectedEquipos.value.push(equipo);
  }
};

const isEquipoSelected = (cod: string) => {
  return selectedEquipos.value.some(e => e.cod_equipo === cod);
};

const removeEquipo = (cod: string) => {
  if (!canEditEquipos.value) return;

  selectedEquipos.value = selectedEquipos.value.filter(
    e => e.cod_equipo !== cod
  );
};

// Products search logic
const performProductSearch = async (
  term: string,
  offset: number = 0,
  isLoadMore: boolean = false
) => {
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
      .from('producto')
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
      .order('descripcion', { ascending: true })
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

    productosCache.value[cacheKey] = {
      data: [...productosResult.value],
      hasMore
    };
  } catch (err) {
    console.error('Error searching products:', err);
  } finally {
    isSearchingProductos.value = false;
  }
};

watch(searchProducto, newVal => {
  if (!canManageProductos.value) return;

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
  if (!canManageProductos.value) return;

  productosOffset.value += 30;
  performProductSearch(searchProducto.value, productosOffset.value, true);
};

const isProductoSelected = (cod: string) => {
  return detalles.value.some(d => d.cod_producto === cod && !d.isManual);
};

const toggleProducto = (prod: any) => {
  if (!canManageProductos.value) return;

  const index = detalles.value.findIndex(
    d => d.cod_producto === prod.cod_producto && !d.isManual
  );

  if (index > -1) {
    detalles.value.splice(index, 1);
  } else {
    detalles.value.push({
      ui_id: crypto.randomUUID(),
      db_id: null,
      isManual: false,
      cod_producto: prod.cod_producto,
      descripcion: prod.descripcion,
      unidad_id: prod.unidad_medida_id
        ? String(prod.unidad_medida_id)
        : prod.unidad_medida?.id
          ? String(prod.unidad_medida.id)
          : '',
      unidad: prod.unidad_medida?.abreviatura || null,
      cantidad: null,
      cantidad_inventario: null,
      estatus_detalle: null,
      descartado: false
    });
  }
};

const addManualItem = () => {
  if (!canManageProductos.value) return;

  detalles.value.push({
    ui_id: crypto.randomUUID(),
    db_id: null,
    isManual: true,
    cod_producto: null,
    descripcion: '',
    unidad_id: '',
    unidad: null,
    cantidad: null,
    cantidad_inventario: null,
    estatus_detalle: null,
    descartado: false
  });
};

const discardDetalle = (uiId: string) => {
  if (isReadOnly.value) return;

  const detalle = detalles.value.find(d => d.ui_id === uiId);
  if (detalle) {
    detalle.descartado = true;
  }
};

const undoDiscardDetalle = (uiId: string) => {
  if (isReadOnly.value) return;

  const detalle = detalles.value.find(d => d.ui_id === uiId);
  if (detalle) {
    detalle.descartado = false;
  }
};

const buildActualizarSolicitudAlmacenPayload = (solicitudId: string): ActualizarSolicitudAlmacen => ({
  solicitud_id: solicitudId,
  estado_actual: Number(props.initialData?.estado_id),
  creadoPor: userStore.getEmail(),
  detallesActualizar: detalles.value
    .filter(d => Boolean(d.db_id))
    .map(d => ({
      id_db: String(d.db_id),
      cantidad_inventario: Number(d.cantidad_inventario ?? 0),
      estatus_detalle: d.descartado ? 2 : Number(d.estatus_detalle ?? 1),
      status_producto: !d.descartado,
      cod_producto: d.cod_producto || ''
    }))
});

const saveSolicitud = async () => {
  if (isReadOnly.value) return;

  fieldErrors.value = {
    fechaEntrega: '',
    equipos: '',
    productos: '',
    observacion: '',
    general: ''
  };

  let hasError = false;

  if (!fechaEntrega.value) {
    fieldErrors.value.fechaEntrega = 'Fecha de entrega es requerida';
    hasError = true;
  }

  if (canEditObservacion.value && !observacion.value) {
    fieldErrors.value.observacion = 'Observación es requerida';
    hasError = true;
  }

  if (canEditEquipos.value && selectedEquipos.value.length === 0) {
    fieldErrors.value.equipos = 'Debe seleccionar al menos un equipo';
    hasError = true;
  }

  if (detalles.value.length === 0) {
    fieldErrors.value.productos =
      'Debe agregar al menos un producto o ítem manual con descripción';
    hasError = true;
  }

  const invalidManual = detalles.value.find(
    d => d.isManual && (!d.descripcion || d.descripcion.trim() === '')
  );

  if (invalidManual) {
    fieldErrors.value.productos =
      'Todos los ítems manuales deben tener descripción';
    hasError = true;
  }

  const invalidUnit = detalles.value.find(
    d => d.isManual && (!d.unidad_id || d.unidad_id === '')
  );

  if (invalidUnit) {
    fieldErrors.value.productos =
      'Todos los ítems manuales deben tener una unidad seleccionada';
    hasError = true;
  }

  if (hasError) return;

  isSubmitting.value = true;

  try {
    if (props.mode === 'create') {
      const dt = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const dateStr = `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}`;
      const rnd = Math.floor(Math.random() * 9000 + 1000);
      const folioTemporal = `TMP-COMP-${dateStr}-${rnd}`;

      const solicitudPayload = {
        folio: folioTemporal,
        email: userEmail.value,
        observacion: observacion.value,
        estado_id: 1,
        fecha_entrega: fechaEntrega.value,
        isUrgent: isUrgent.value
      };

      const detallesPayload = detalles.value.map(d => {
        if (d.isManual) {
          return {
            isManual: true,
            descripcion: d.descripcion,
            unidad_id: Number(d.unidad_id)
          };
        }

        return {
          isManual: false,
          cod_producto: d.cod_producto
        };
      });

      const { data: solData, error: solError } = await supabaseCompras.rpc(
        'registrar_solicitud_compra',
        {
          p_solicitud: solicitudPayload,
          p_detalles: detallesPayload
        }
      );

      if (solError) throw solError;

      if (!solData || !solData.success) {
        throw new Error('No se pudo crear la solicitud de compra');
      }

      const { error: eqError } = await supabaseEquipos.rpc(
        'registrar_equipos_solicitud',
        {
          p_solicitud_id: solData.solicitud_id,
          p_folio_sol: solData.folio,
          p_cod_equipos: selectedEquipos.value.map(eq => eq.cod_equipo)
        }
      );

      if (eqError) {
        throw new Error(
          `La solicitud fue creada, pero ocurrió un error al vincular los equipos. Puede reintentarlo luego. Error: ${eqError.message}`
        );
      }

      try {
        await userStore.fetchCurrentUserProfile();
        await comprasStore.fetchSolicitudes(userStore.getArea(), userStore.getEmailsFilter());
      } catch (e) {
        // ignore
      }

      isNavigationAllowed = true;
      emit('created');
      closeForm();
    } else {
      // UPDATE MODE
      const solId = props.initialData.id;

      if (isAlmacen.value) {
        await comprasStore.actualizarSolicitudAlmacenConDetalles(
          buildActualizarSolicitudAlmacenPayload(solId)
        );

        isNavigationAllowed = true;
        emit('updated');
        closeForm();
        return;
      }

      const detallesPayload = detalles.value.map(d => {
        const isManual =
          d.isManual ||
          !d.cod_producto ||
          String(d.cod_producto).trim().toUpperCase().startsWith('MNL-');

        return {
          db_id: d.db_id || null,
          isManual,
          cod_producto: d.cod_producto || null,
          descripcion: d.descripcion,
          unidad_id: isManual ? d.unidad_id : null,
          cantidad: d.cantidad || null,
          cantidad_inventario: d.cantidad_inventario ?? null
        };
      });

      const solicitudUpdatePayload: Record<string, any> = {
        observacion: observacion.value,
        fecha_entrega: fechaEntrega.value
      };

      if (showUrgencyCheck.value) {
        solicitudUpdatePayload.isUrgent = isUrgent.value;
      }

      const { data: updateData, error: updateError } = await supabaseCompras.rpc(
        'actualizar_solicitud_compra_con_detalles',
        {
          p_solicitud_id: solId,
          p_solicitud: solicitudUpdatePayload,
          p_detalles: detallesPayload
        }
      );

      if (updateError) throw updateError;

      if (!updateData?.success) {
        throw new Error('No se pudo actualizar la solicitud');
      }

      if (canEditEquipos.value) {
        const { data: equiposData, error: equiposError } = await supabaseEquipos.rpc(
          'sincronizar_equipos_solicitud',
          {
            p_solicitud_id: solId,
            p_folio_sol: updateData.folio_sol,
            p_cod_equipos: selectedEquipos.value.map(eq => eq.cod_equipo)
          }
        );

        if (equiposError) throw equiposError;

        if (!equiposData?.success) {
          throw new Error('No se pudieron sincronizar los equipos');
        }
      }


      try {
        await userStore.fetchCurrentUserProfile();
        await comprasStore.fetchSolicitudes(userStore.getArea(), userStore.getEmailsFilter());
      } catch (e) {
        // ignore
      }

      isNavigationAllowed = true;
      emit('updated');
      closeForm();
    }
  } catch (err: any) {
    console.error(err);
    fieldErrors.value.general =
      err.message || 'Ocurrió un error al guardar la solicitud';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="h-full flex flex-col w-full bg-gray-50">
    <!-- Main Full Page Container -->
    <div class="flex-1 overflow-hidden flex flex-col bg-white">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-100 bg-white shrink-0 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-accent/20 text-main flex items-center justify-center">
            <ShoppingCart class="w-5 h-5" />
          </div>

          <div>
            <h2 class="font-display font-bold text-xl text-main-dark">
              {{ isReadOnly ? 'Ver Solicitud' : mode === 'edit' ? 'Editar Solicitud' : 'Nueva Solicitud' }}
            </h2>
          </div>
        </div>

        <button @click="handleBack"
          class="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 rounded-xl transition-colors cursor-pointer">
          <ArrowLeft class="w-4 h-4" />
          Regresar
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8 md:py-8">
        <div class="w-full space-y-8 pb-10">
          <div v-if="fieldErrors.general"
            class="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-4 border border-red-200">
            {{ fieldErrors.general }}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Fecha Entrega -->
            <div class="space-y-1.5 flex flex-col justify-end">
              <BaseDateField v-model="fechaEntrega" label="Fecha de Entrega *" :error="fieldErrors.fechaEntrega"
                :disabled="!canEditFechaEntrega" />
            </div>

            <!-- Auto email display -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Solicitante
              </label>

              <div class="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium">
                {{ userName }}
              </div>
            </div>
          </div>

          <label
            v-if="showUrgencyCheck"
            class="inline-flex w-fit items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm font-bold text-yellow-800 cursor-pointer"
          >
            <input
              v-model="isUrgent"
              type="checkbox"
              :disabled="isReadOnly"
              class="w-4 h-4 rounded border-yellow-300 text-yellow-600 focus:ring-yellow-500 accent-yellow-500 cursor-pointer"
            />
            <span>Solicitar Urgencia</span>
          </label>

          <!-- Selector de Equipos -->
          <div v-if="!isAlmacen" class="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <label class="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Equipos Asociados <span class="text-red-500">*</span>
            </label>

            <div class="flex flex-wrap gap-2 mb-2">
              <div v-for="eq in selectedEquipos" :key="eq.cod_equipo"
                class="bg-main text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
                <span>{{ eq.cod_equipo }}</span>

                <button v-if="canEditEquipos" @click="removeEquipo(eq.cod_equipo)" class="text-white hover:text-red-300">
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div v-if="canEditEquipos" class="relative">
              <div v-if="showEquiposDropdown && canEditEquipos" class="fixed inset-0 z-10" @click="showEquiposDropdown = false"></div>

              <div class="flex items-center relative z-20">
                <Search class="absolute left-3 w-4 h-4 text-gray-400" />

                <input v-model="searchEquipo" @focus="showEquiposDropdown = canEditEquipos" type="text"
                  :disabled="!canEditEquipos"
                  placeholder="Buscar equipo por código o nombre..."
                  class="w-full pl-9 pr-4 py-2 border border-gray-200 bg-white rounded-xl focus:ring-2 focus:ring-accent outline-none relative disabled:bg-gray-50 disabled:cursor-not-allowed" />
              </div>

              <div v-if="showEquiposDropdown && canEditEquipos && filteredEquipos.length > 0"
                class="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                <div v-for="eq in filteredEquipos" :key="eq.cod_equipo" @click.stop="toggleEquipo(eq)"
                  class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center gap-3">
                  <div class="flex items-center h-5">
                    <input type="checkbox" :checked="isEquipoSelected(eq.cod_equipo)" readonly
                      class="w-4 h-4 text-accent border-gray-300 rounded focus:ring-accent accent-accent cursor-pointer"
                      @click.stop="toggleEquipo(eq)" />
                  </div>

                  <div class="font-bold text-sm text-gray-700">
                    {{ eq.cod_equipo }}
                  </div>
                </div>
              </div>

              <div v-else-if="showEquiposDropdown && canEditEquipos && searchEquipo"
                class="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-sm text-gray-500 text-center">
                No se encontraron equipos
              </div>
            </div>

            <p v-if="fieldErrors.equipos" class="text-xs text-red-500 mt-2">
              {{ fieldErrors.equipos }}
            </p>
          </div>

          <div
            v-if="showPriorityUrgentBadge"
            class="inline-flex w-fit items-center gap-2 rounded-xl border border-red-300/70 bg-red-500/15 px-4 py-2 text-sm font-black uppercase tracking-wide text-red-700 shadow-sm backdrop-blur-md"
          >
            <AlertTriangle class="h-4 w-4" />
            URGENTE
          </div>

          <!-- Selector de Productos y Tabla -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Productos / Servicios <span class="text-red-500">*</span>
              </label>

              <button v-if="canManageProductos" @click="addManualItem"
                class="text-xs font-bold text-main hover:text-accent flex items-center gap-1 bg-main/5 px-2 py-1 rounded cursor-pointer">
                <Plus class="w-3.5 h-3.5" />
                Agregar Ítem Manual
              </button>
            </div>

            <div v-if="canManageProductos" class="relative mt-2">
              <div v-if="showProductosDropdown" class="fixed inset-0 z-10" @click="showProductosDropdown = false"></div>

              <div class="flex items-center relative z-20">
                <Search class="absolute left-3 w-4 h-4 text-gray-400" />

                <input v-model="searchProducto" @focus="showProductosDropdown = canManageProductos" type="text"
                  :disabled="!canManageProductos"
                  placeholder="Buscar producto de almacén..."
                  class="w-full pl-9 pr-4 py-2 border border-gray-200 bg-white rounded-xl focus:ring-2 focus:ring-accent outline-none relative disabled:bg-gray-50 disabled:cursor-not-allowed" />
              </div>

              <div v-if="showProductosDropdown"
                class="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto flex flex-col">
                <template v-if="searchProducto.trim().length < 4">
                  <template v-if="searchProducto.trim() === '' && detalles.filter(d => !d.isManual).length > 0">
                    <div
                      class="px-4 py-2 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 sticky top-0 z-10">
                      Elementos Seleccionados
                    </div>

                    <div v-for="prod in detalles.filter(d => !d.isManual)" :key="prod.ui_id" @click.stop="toggleProducto({
                      cod_producto: prod.cod_producto,
                      descripcion: prod.descripcion,
                      unidad_medida: {
                        id: prod.unidad_id,
                        abreviatura: prod.unidad
                      }
                    })"
                      class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 shrink-0 flex items-start gap-3 bg-accent/5">
                      <div class="flex items-center h-5 mt-0.5">
                        <input type="checkbox" checked readonly
                          class="w-4 h-4 text-accent border-gray-300 rounded focus:ring-accent accent-accent cursor-pointer"
                          @click.stop="toggleProducto({
                            cod_producto: prod.cod_producto,
                            descripcion: prod.descripcion,
                            unidad_medida: {
                              id: prod.unidad_id,
                              abreviatura: prod.unidad
                            }
                          })" />
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
                  </template>

                  <div class="p-4 text-sm text-gray-500 text-center">
                    Escribe al menos 4 caracteres para buscar.
                  </div>
                </template>

                <div v-else-if="isSearchingProductos && productosResult.length === 0"
                  class="p-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Loader2 class="w-4 h-4 animate-spin text-main" />
                  Buscando...
                </div>

                <div v-else-if="productosResult.length === 0" class="p-4 text-sm text-gray-500 text-center">
                  No se encontraron productos.
                </div>

                <template v-else>
                  <div v-for="prod in productosResult" :key="prod.cod_producto" @click.stop="toggleProducto(prod)"
                    class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 shrink-0 flex items-start gap-3">
                    <div class="flex items-center h-5 mt-0.5">
                      <input type="checkbox" :checked="isProductoSelected(prod.cod_producto)" readonly
                        class="w-4 h-4 text-accent border-gray-300 rounded focus:ring-accent accent-accent cursor-pointer"
                        @click.stop="toggleProducto(prod)" />
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
                    <button @click.stop="loadMoreProducts" :disabled="isSearchingProductos"
                      class="w-full py-2 text-xs font-bold text-main bg-main/5 hover:bg-main/10 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                      <Loader2 v-if="isSearchingProductos" class="w-3.5 h-3.5 animate-spin" />

                      {{ isSearchingProductos ? 'Cargando más...' : 'Cargar más' }}
                    </button>
                  </div>
                </template>
              </div>
            </div>

            <!-- Details grid -->
            <div class="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div class="overflow-x-auto">
                <div class="min-w-[680px]">
                  <div
                    class="details-grid border-b border-gray-200 bg-stone-50"
                    :class="{ 'details-grid--inventory': showCantidad }"
                  >
                    <div class="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Código
                    </div>

                    <div class="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Descripción
                    </div>

                    <div class="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                      Unidad
                    </div>

                    <div
                      v-if="showCantidad"
                      class="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center"
                    >
                      Inventario
                    </div>

                    <div class="px-4 py-3"></div>
                  </div>

                  <div v-if="detalles.length > 0" class="divide-y divide-gray-100">
                    <div
                      v-for="item in detalles"
                      :key="item.ui_id"
                      class="details-grid details-row min-h-[72px] items-center transition-colors hover:bg-gray-50/70"
                      :class="{
                        'details-grid--inventory': showCantidad,
                        'discarded-row bg-gray-500 text-gray-400': item.descartado
                      }"
                    >
                      <div class="px-4 py-4">
                        <span v-if="!item.isManual" class="text-sm font-bold text-gray-800">
                          {{ item.cod_producto }}
                        </span>

                        <span v-else class="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded">
                          No asignado
                        </span>
                      </div>

                      <div class="px-4 py-4">
                        <input
                          v-if="item.isManual"
                          v-model="item.descripcion"
                          type="text"
                          maxlength="255"
                          placeholder="Descripción manual..."
                          :readonly="!canManageProductos"
                          class="w-full px-3 py-1.5 border border-dashed border-gray-300 rounded focus:border-accent focus:ring-1 focus:ring-accent outline-none text-sm"
                        />

                        <span v-else class="block text-sm leading-6 text-gray-600">
                          {{ item.descripcion }}
                        </span>
                      </div>

                      <div class="px-4 py-4 text-center">
                        <select
                          v-if="item.isManual"
                          v-model="item.unidad_id"
                          :disabled="!canManageProductos"
                          class="w-full px-2 py-1.5 border border-dashed border-gray-300 rounded focus:border-accent focus:ring-1 focus:ring-accent outline-none text-sm bg-white cursor-pointer"
                        >
                          <option value="" disabled>
                            Seleccionar
                          </option>

                          <option v-for="u in unidadesMedida" :key="u.id" :value="String(u.id)">
                            {{ u.abreviatura }}
                          </option>
                        </select>

                        <span v-else class="text-sm text-gray-600 font-semibold">
                          {{ item.unidad || '-' }}
                        </span>
                      </div>

                      <div v-if="showCantidad" class="px-4 py-4 text-center">
                        <input
                          v-if="canEditCantidadInventario"
                          v-model.number="item.cantidad_inventario"
                          type="number"
                          min="0"
                          class="w-20 px-2 py-1.5 border border-dashed border-gray-300 rounded focus:border-accent focus:ring-1 focus:ring-accent outline-none text-sm text-center"
                        />

                        <span v-else class="text-sm font-semibold text-gray-600">
                          {{ item.cantidad_inventario !== null && item.cantidad_inventario !== undefined ? item.cantidad_inventario : '-' }}
                        </span>
                      </div>

                      <div v-if="!isReadOnly" class="relative z-20 px-4 py-4 text-right">
                        <button
                          v-if="!item.descartado"
                          @click="discardDetalle(item.ui_id)"
                          class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                          title="Descartar"
                        >
                          <Ban class="w-4 h-4" />
                        </button>

                        <button
                          v-else
                          @click="undoDiscardDetalle(item.ui_id)"
                          class="relative z-10 inline-flex h-[37px] w-[37px] items-center justify-center rounded-lg bg-white text-main shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-gray-100 hover:text-main-dark"
                          title="Deshacer descarte"
                        >
                          <Undo2 class="h-[18px] w-[18px]" :stroke-width="3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div v-else class="py-8 text-center text-sm text-gray-400">
                    {{ canManageProductos ? 'Agregue productos desde la búsqueda o como ítem manual.' : 'No hay productos en la solicitud.' }}
                  </div>
                </div>
              </div>
            </div>

            <p v-if="fieldErrors.productos" class="text-xs text-red-500 mt-2">
              {{ fieldErrors.productos }}
            </p>
          </div>

          <!-- Observacion -->
          <div v-if="!isAlmacen" class="space-y-1.5 pt-4">
            <label class="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Observación <span class="text-red-500">*</span>
            </label>

            <textarea v-model="observacion" rows="2" placeholder="Justificación o detalles de la solicitud..."
              :readonly="!canEditObservacion"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent outline-none transition-all resize-none read-only:bg-gray-50"
              :class="{ 'border-red-500': fieldErrors.observacion }"></textarea>

            <p v-if="fieldErrors.observacion" class="text-xs text-red-500 mt-1">
              {{ fieldErrors.observacion }}
            </p>
          </div>

          <!-- Footer -->
	          <div v-if="!isReadOnly" class="pt-8 border-t border-gray-100 flex justify-end gap-3 mt-8">
            <button @click="handleCancelBtn" type="button"
              class="px-6 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              :disabled="isSubmitting">
              Cancelar
            </button>

            <button @click="saveSolicitud" type="button"
              class="px-6 py-2.5 rounded-xl font-bold bg-accent text-main-dark hover:brightness-110 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              :disabled="isSubmitting">
              <Save v-if="!isSubmitting" class="w-4 h-4" />

              <div v-else class="w-4 h-4 border-2 border-main-dark border-t-transparent rounded-full animate-spin">
              </div>

              {{
                isSubmitting
                  ? 'Guardando...'
                  : mode === 'edit'
                    ? 'Actualizar Solicitud'
                    : 'Crear Solicitud'
              }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showConfirmCancel" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-main-dark/50 backdrop-blur-sm" @click="closeConfirm"></div>

      <div
        class="bg-white rounded-3xl shadow-xl w-full max-w-sm flex flex-col relative z-10 overflow-hidden p-6 text-center animate-in fade-in zoom-in-95 duration-200">
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
          <button @click="confirmCancel"
            class="w-full py-3 rounded-xl font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer">
            Sí, descartar y regresar
          </button>

          <button @click="closeConfirm"
            class="w-full py-3 rounded-xl font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
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
  grid-template-columns: 8rem minmax(16rem, 1fr) 7rem 4rem;
  align-items: center;
}

.details-grid--inventory {
  grid-template-columns: 8rem minmax(16rem, 1fr) 7rem 8rem 4rem;
}

.details-row {
  position: relative;
}

.discarded-row::before {
  content: 'Descartado';
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  color: #6b7280;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.discarded-row::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 1;
  width: 78px;
  height: 20px;
  transform: translate(-50%, -50%);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
  pointer-events: none;
}

.discarded-row .px-4 {
  position: relative;
}

.discarded-row .px-4::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  border-top: 2px solid #9ca3af;
  pointer-events: none;
  z-index: 1;
}
</style>
