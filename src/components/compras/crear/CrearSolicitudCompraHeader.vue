<script setup lang="ts">
import { Building2, CalendarDays, ShoppingCart, UserRound } from 'lucide-vue-next';
import { computed } from 'vue';

const props = defineProps<{
  solicitanteNombre: string;
  areaNombre: string;
  fechaCreacionLocal: Date;
}>();

const formattedDate = computed(() =>
  new Intl.DateTimeFormat('es-PA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Panama',
  }).format(props.fechaCreacionLocal)
);
</script>

<template>
  <header class="rounded-lg border border-stone-200 bg-white px-3 py-3 shadow-md md:px-4">
    <div class="flex flex-col gap-4 md:flex-row md:items-center">
      <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-main text-white shadow-sm shadow-main/20">
        <ShoppingCart class="h-6 w-6" />
      </div>

      <div class="min-w-0 flex-1">
        <h2 class="font-display text-base leading-none text-main md:text-md">
          Nueva solicitud de compra
        </h2>

        <div class="mt-2 grid grid-cols-1 gap-2 text-xs text-stone-700 md:grid-cols-3 md:text-sm">
          <span class="inline-flex items-center gap-2 min-w-0">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-main/8 text-main">
              <UserRound class="h-4 w-4" />
            </span>
            <span class="truncate"><strong>Solicitante:</strong> {{ solicitanteNombre || 'Sin nombre' }}</span>
          </span>

          <span class="inline-flex items-center gap-2 min-w-0">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-main/8 text-main">
              <Building2 class="h-4 w-4" />
            </span>
            <span class="truncate"><strong>Área:</strong> {{ areaNombre || 'Sin área' }}</span>
          </span>

          <span class="inline-flex items-center gap-2 min-w-0">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-main/8 text-main">
              <CalendarDays class="h-4 w-4" />
            </span>
            <span class="truncate"><strong>Fecha de creación:</strong> {{ formattedDate }}</span>
          </span>
        </div>
      </div>
    </div>
  </header>
</template>
