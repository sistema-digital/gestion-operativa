<script setup lang="ts">
/**
 * ImplementoSelect.vue
 *
 * Selector reutilizable.
 *
 * Opciones:
 * - null -> Sin implemento
 * - UUID -> implemento existente
 * - "__nuevo__" -> opción temporal de UI
 *
 * Cuando se selecciona "__nuevo__", emite `crear`.
 *
 * RPC: ninguno.
 * El catálogo debe llegar por props.
 */

import type { ImplementoOption } from '../registroJornada.types';

const model = defineModel<string | null>({ required: true });

defineProps<{
  implementos: ImplementoOption[];
}>();

const emit = defineEmits<{
  (e: 'crear'): void;
}>();

function onChange(event: Event) {
  const select = event.target as HTMLSelectElement;
  if (select.value === '__nuevo__') {
    select.value = model.value || '';
    emit('crear');
    return;
  }
  model.value = select.value || null;
}
</script>

<template>
  <select
    :value="model || ''"
    class="h-8 w-full rounded-md border border-gray-200 bg-gray-50 px-2 font-mono text-xs md:border-transparent md:bg-transparent"
    @change="onChange"
  >
    <option value="">Sin implemento</option>
    <option
      v-for="impl in implementos"
      :key="impl.id"
      :value="impl.id"
    >
      {{ impl.numero }} · {{ impl.nombre || 'Sin descripción' }}
    </option>
    <option value="__nuevo__">＋ Registrar nuevo implemento…</option>
  </select>
</template>
