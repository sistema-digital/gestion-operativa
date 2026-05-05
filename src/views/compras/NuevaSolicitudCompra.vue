<script setup lang="ts">
import { useRouter } from 'vue-router';
import SolicitudCompraForm from '@/components/compras/form/SolicitudCompraForm.vue';

const router = useRouter();

const handleClose = () => {
  router.push('/compras');
};

const handleCreated = () => {
  router.push('/compras');
};
</script>

<template>
  <SolicitudCompraForm
    mode="create"
    @close="handleClose"
    @created="handleCreated"
  />
</template>
