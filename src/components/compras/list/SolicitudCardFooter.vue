<script setup lang="ts">
import type { SolicitudCompra } from '@/stores/comprasStore';
import { Calendar, Clock } from 'lucide-vue-next';
import type { SolicitudDisplayConfig } from './types';

interface Props {
  item: SolicitudCompra;
  display: SolicitudDisplayConfig;
}

defineProps<Props>();
</script>

<template>
  <div class="mt-auto pt-3 border-t border-gray-50 flex flex-col gap-2 z-10">
    <div class="flex items-center justify-between">
      <div class="text-[10px] text-gray-400 truncate font-medium">
        Req:
        <span class="uppercase font-bold text-gray-600">{{ item.nombreSolicitante || item.email }}</span>
      </div>
    </div>
    <div class="flex items-center justify-between text-xs text-gray-500">
      <div class="flex items-center gap-1.5">
        <Calendar class="w-3 h-3 text-main opacity-70" />
        <span>{{ display.formatDateTime(item.fecha_creacion) }}</span>
      </div>
      <div class="flex items-center gap-1.5" title="Fecha Entrega">
        <Clock class="w-3 h-3 text-secondary opacity-70" />
        <span class="font-medium text-gray-700">{{ display.formatDate(item.fecha_entrega) }}</span>
      </div>
    </div>
  </div>
</template>
