<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import SolicitudCompraForm from '@/components/compras/form/SolicitudCompraForm.vue';

const router = useRouter();
const formRef = ref<any>(null);

onBeforeRouteLeave((to, from, next) => {
  if (formRef.value) {
    formRef.value.checkNavigation(to, next);
  } else {
    next();
  }
});

const handleClose = () => {
  router.push('/compras');
};

const handleCreated = () => {
  router.push('/compras');
};
</script>

<template>
  <SolicitudCompraForm
    ref="formRef"
    mode="create"
    @close="handleClose"
    @created="handleCreated"
  />
</template>
