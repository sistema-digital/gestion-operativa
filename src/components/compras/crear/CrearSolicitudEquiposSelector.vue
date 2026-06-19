<script setup lang="ts">
import { LoaderCircle, Search } from 'lucide-vue-next';
import { ref, watch } from 'vue';

import CrearSolicitudEquipoChip from './CrearSolicitudEquipoChip.vue';
import type { EquipoOption } from '@/stores/dbequipos/equipos/equipos.types';
import type { EquipoSeleccionado } from '@/stores/db_compras/solicitudes_compra/solicitudesCompraCrear.types';

const props = defineProps<{
  selectedItems: EquipoSeleccionado[];
  searchResults: EquipoOption[];
  isSearching: boolean;
  searchError: string | null;
  fieldError?: string;
}>();

const emit = defineEmits<{
  (e: 'search', value: string): void;
  (e: 'add', item: EquipoOption): void;
  (e: 'remove', codEquipo: string): void;
}>();

const query = ref('');
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(query, (value) => {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    emit('search', value);
  }, 250);
});
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
    <label class="block text-xs font-semibold text-stone-800">
      Equipos <span class="text-danger">*</span>
    </label>

    <div class="grid min-h-0 flex-1 gap-4 md:grid-cols-2">
      <div class="flex min-h-0 flex-col gap-3">
        <div
          class="rounded-lg border bg-white px-3 py-2"
          :class="fieldError ? 'border-danger bg-danger-bg/30' : 'border-stone-300'"
        >
          <div class="flex items-center gap-3">
            <Search class="h-5 w-5 text-stone-400" />
            <input
              v-model="query"
              type="text"
              placeholder="Buscar por código, descripción, modelo o marca"
              class="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
            >
            <LoaderCircle
              v-if="isSearching"
              class="h-4 w-4 animate-spin text-main"
            />
          </div>
        </div>

        <div
          id="result_serach_equipo"
          v-if="searchResults.length > 0"
          class="min-h-0 flex-1 overflow-y-auto rounded-lg border border-stone-200 bg-stone-50"
        >
          <button
            v-for="item in searchResults"
            :key="item.codEquipo"
            type="button"
            class="flex w-full items-center justify-between border-b border-stone-200 px-3 py-2 text-left text-xs transition last:border-b-0 hover:bg-white "
            @click="emit('add', item)"
          >
            <span class="text-stone-800">{{ item.label }}</span>
            <span class="font-semibold text-main">Agregar</span>
          </button>
        </div>
      </div>

      <div class="min-h-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-50 px-3 py-3">
        <div
          v-if="selectedItems.length > 0"
          class="grid max-h-full grid-cols-3 gap-3 overflow-y-auto"
        >
          <CrearSolicitudEquipoChip
            v-for="item in selectedItems"
            :key="item.codEquipo"
            :label="item.label"
            @remove="emit('remove', item.codEquipo)"
          />
        </div>

        <div
          v-else
          class="rounded-lg border border-dashed border-stone-300 bg-white px-3 py-2 text-xs text-stone-500 md:text-sm"
        >
          Aún no has seleccionado equipos.
        </div>
      </div>
    </div>

    <p
      v-if="searchError"
      class="text-sm font-medium text-danger"
    >
      {{ searchError }}
    </p>

    <p
      v-if="fieldError"
      class="text-sm font-medium text-danger"
    >
      {{ fieldError }}
    </p>
  </div>
</template>
