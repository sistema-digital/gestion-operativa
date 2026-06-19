<script setup lang="ts">
import { Building2, CalendarDays, ShoppingCart, UserRound } from 'lucide-vue-next';
import { computed } from 'vue';

const props = defineProps<{
  solicitanteNombre: string;
  areaNombre: string;
  fechaCreacionLocal: Date;
}>();

const formattedDate = computed(() => {
  if (!props.fechaCreacionLocal) return ''

  const date = new Date(props.fechaCreacionLocal)

  const fecha = new Intl.DateTimeFormat('es-PA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Panama',
  })
    .format(date)
    .replace('.', '')
    .toLowerCase()

  const hora = new Intl.DateTimeFormat('es-PA', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: 'America/Panama',
})
  .format(date)
  .replace(/\./g, '')
  .toLowerCase()

  return `${fecha} ${hora}`
})
</script>

<template>
  <header class="rounded-lg border border-stone-200 bg-white px-3 py-3 shadow-md lg:px-4">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center">
      

      <div class="min-w-0 flex-1">
        <h2 class="font-display  text-lg text-center leading-none text-main lg:text-md">
          Nueva solicitud de compra
        </h2>

        <div class="mt-2 grid grid-cols-1 gap-2 text-xs text-stone-700 lg:grid-cols-3 lg:text-sm">
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
