<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import SolicitudCompraForm from '@/components/compras/form/SolicitudCompraForm.vue';
import MessageModal from '@/components/MessageModal.vue';
import { useComprasStore } from '@/stores/comprasStore';
import { useUserStore } from '@/stores/userStore';
import { useEquipoSolicitudesStore } from '@/stores/dbequipos/equiposolicitudes/equipoSolicitudes.store';
import {
  getPermisosFormSolicitud,
  type PermisosFormSolicitud
} from '@/components/compras/form/permisosForm';
import type { SolicitudCompraInitialData } from './type';
import EditarSolicitudO from '@/components/compras/form/operativo/EditarSolicitudO.vue';

const route = useRoute();
const router = useRouter();
const store = useComprasStore();
const userStore = useUserStore();
const equipoSolicitudesStore = useEquipoSolicitudesStore();

const formRef = ref<any>(null);

const id = route.params.id as string;
const initialData = ref<SolicitudCompraInitialData | null>(null);
const permisosForm = ref<PermisosFormSolicitud | null>(null);
const isLoading = ref(true);
const showEditingMessage = ref(false);
const isReadOnly = ref(false);
const hasEditingLock = ref(false);

const userEmail = ref('');
const userArea = ref('');
const isSaved = ref(false);
const AREAS_OPERATIVAS = [
  'COSECHA MECANIZADA',
  'COSECHA AGRICOLA',
  'MECANICA DE TRANSPORTE',
  'ENGRASE',
  'EQUIPO PESADO',
  'SERVICIOS GENERALES',
  'OPERATIVA'
];

const isOperativaArea = computed(() => {
  const area = permisosForm.value?.area?.trim().toUpperCase()

  return area ? AREAS_OPERATIVAS.includes(area) : false
});
onBeforeRouteLeave((to, from, next) => {
  const customNext = async (arg?: boolean | string | object) => {
    if (arg === false || arg instanceof Error) {
      next(arg as any);
      return;
    }

    if (!isSaved.value && userEmail.value && hasEditingLock.value) {
      try {
        await store.cancelarEdicionSolicitud(id, userEmail.value);
      } catch(e) {
        console.error('No se pudo cancelar la edición:', e);
      }
    }
    if (arg === undefined) {
      next();
    } else {
      next(arg as any);
    }
  };

  if (formRef.value) {
    formRef.value.checkNavigation(to, customNext);
  } else {
    customNext();
  }
});

const handleClose = () => {
  router.push(`/compras/${id}`);
};

const handleUpdated = () => {
  isSaved.value = true;
  router.push(`/compras/${id}`);
};

const closeEditingMessage = () => {
  showEditingMessage.value = false;
  router.push(`/compras/${id}`);
};

onMounted(async () => {
  try {
    await userStore.fetchCurrentUserProfile();
    userEmail.value = userStore.getEmail();
    userArea.value = userStore.getArea();

    // Call tomar_solicitud_para_edicion
    let estadoEdicionId = 12; // Operativa by default
    if (userArea.value === 'ALMACEN') {
      estadoEdicionId = 10;
    } else if (userArea.value === 'ALL') {
      estadoEdicionId = 15;
    }

    if (userEmail.value) {
      const takeResult = await store.tomarSolicitudParaEdicion(id, estadoEdicionId, userEmail.value);
      // If it fails because it's already in revision state by somebody else, maybe block form?
      if (takeResult && !takeResult.success && takeResult.estado_actual_id !== estadoEdicionId) {
        isReadOnly.value = true;
        showEditingMessage.value = true;
      } else if (takeResult?.success) {
        hasEditingLock.value = true;
      }
    }

    const solData = await store.obtenerSolicitudCompraConDetalles(id);

    const eqData = await equipoSolicitudesStore.obtenerEquiposSolicitud(id);

    const cachedSol = store.solicitudes.find(s => s.id === id);

    initialData.value = {
      ...solData,
      nombreSolicitante: cachedSol?.nombreSolicitante || solData?.email,
      detalles: solData?.detalles || [],
      equipos: eqData || []
    };

    permisosForm.value = getPermisosFormSolicitud({
      mode: 'edit',
      initialData: initialData.value,
      userArea: userArea.value
    });

  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
  }
});

</script>

<template>
  <div class="flex h-full min-h-0 flex-1">
    <div v-if="isLoading" class="flex-1 flex items-center justify-center h-full text-center">
      <div class="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
    <EditarSolicitudO
      v-else-if="initialData && isOperativaArea"
      ref="formRef"
      mode="edit"
      :initial-data="initialData"
      :permisos-form="permisosForm"
      :readonly="isReadOnly"
      @close="handleClose"
      @updated="handleUpdated"
    />
    <SolicitudCompraForm
      v-else-if="initialData"
      ref="formRef"
      mode="edit"
      :initial-data="initialData"
      :permisos-form="permisosForm"
      :readonly="isReadOnly"
      @close="handleClose"
      @updated="handleUpdated"
    />
    <MessageModal
      v-if="showEditingMessage"
      message="La solicitud está siendo editada por otro usuario y solo puede ver los datos."
      :ok="closeEditingMessage"
    />
  </div>
</template>
