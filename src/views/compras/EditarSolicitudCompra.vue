<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import SolicitudCompraForm from '@/components/compras/form/SolicitudCompraForm.vue';
import { supabaseCompras, supabaseEquipos } from '@/lib/supabase';
import { useComprasStore } from '@/stores/comprasStore';

const route = useRoute();
const router = useRouter();
const store = useComprasStore();

const formRef = ref<any>(null);

const id = route.params.id as string;
const initialData = ref<any>(null);
const isLoading = ref(true);

onBeforeRouteLeave((to, from, next) => {
  if (formRef.value) {
    formRef.value.checkNavigation(to, next);
  } else {
    next();
  }
});

const handleClose = () => {
  router.push(`/compras/${id}`);
};

const handleUpdated = () => {
  router.push(`/compras/${id}`);
};

onMounted(async () => {
  try {
    const { data: solData, error: solError } = await supabaseCompras
      .rpc('get_solicitud_compra_con_detalles', {
        p_solicitud_id: id
      });

    if (solError) throw solError;

    // Equipos se mantiene igual
    const { data: eqData, error: eqError } = await supabaseEquipos
      .from('equipo_solicitudes')
      .select('cod_equipo')
      .eq('solicitud_id', id);

    if (eqError) throw eqError;

    const cachedSol = store.solicitudes.find(s => s.id === id);

    initialData.value = {
      ...solData,
      nombreSolicitante: cachedSol?.nombreSolicitante || solData?.email,
      detalles: solData?.detalles || [],
      equipos: eqData || []
    };

  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
  }
});

</script>

<template>
  <div v-if="isLoading" class="flex-1 flex items-center justify-center h-full text-center">
    <div class="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
  </div>
  <SolicitudCompraForm v-else-if="initialData" ref="formRef" mode="edit" :initial-data="initialData" @close="handleClose"
    @updated="handleUpdated" />
</template>
