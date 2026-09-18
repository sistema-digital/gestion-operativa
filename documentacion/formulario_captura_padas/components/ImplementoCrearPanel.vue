<script setup lang="ts">
/**
 * ImplementoCrearPanel.vue
 *
 * Desktop:
 * - drawer lateral derecho.
 *
 * sm/xs:
 * - bottom sheet.
 *
 * RPC:
 * - No llama Supabase directamente.
 * - Emite `crear(payload)`.
 * - RegistroJornadaPage/useJornadaAdmin ejecuta:
 *   rpc_admin_registrar_implemento(
 *     p_numero,
 *     p_tipo_implemento_id,
 *     p_nombre
 *   )
 */

import { reactive } from 'vue';
import type { ImplementoTipoOption } from '../registroJornada.types';

const open = defineModel<boolean>('open', { required: true });

defineProps<{
  filaNumero: number | null;
  tiposImplemento: ImplementoTipoOption[];
}>();

const emit = defineEmits<{
  (e: 'crear', payload: { numero: string; tipoImplementoId: string; nombre?: string | null }): void;
}>();

const form = reactive({
  numero: '',
  tipoImplementoId: '',
  nombre: '',
});

function cerrar() {
  open.value = false;
}

function submit() {
  if (!form.numero.trim() || !form.tipoImplementoId) return;
  emit('crear', {
    numero: form.numero.trim().toUpperCase(),
    tipoImplementoId: form.tipoImplementoId,
    nombre: form.nombre.trim() || null,
  });
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[1px]"
      @click.self="cerrar"
    >
      <aside
        class="fixed bottom-0 left-0 right-0 z-[90] max-h-[86dvh] overflow-hidden rounded-t-[18px] border-t border-gray-200 bg-white shadow-xl
               md:bottom-auto md:left-auto md:top-0 md:h-dvh md:max-h-none md:w-[408px] md:rounded-none md:border-l md:border-t-0"
      >
        <div class="mx-auto mt-2 h-1 w-10 rounded-full bg-gray-300 md:hidden" />

        <header class="flex min-h-14 items-center gap-2 border-b border-gray-200 px-3 py-2">
          <div class="min-w-0 flex-1">
            <strong class="block text-sm text-main-dark">Registrar implemento</strong>
            <small class="text-[10px] text-gray-500">
              {{ filaNumero ? `Se registrará y usará en la fila ${filaNumero}.` : 'Se usará en la fila seleccionada.' }}
            </small>
          </div>
          <button type="button" class="h-8 w-8 rounded-md" @click="cerrar">×</button>
        </header>

        <form class="grid gap-3 overflow-y-auto p-3" @submit.prevent="submit">
          <div class="rounded-md border border-info bg-info-bg p-2 text-[11px] text-gray-700">
            Úsalo cuando el implemento sí existe físicamente pero todavía no está en el catálogo.
          </div>

          <label>
            <span class="mb-1 block text-[9px] font-bold uppercase text-gray-600">Número *</span>
            <input v-model="form.numero" required class="h-10 w-full rounded-md border border-gray-300 px-3 font-mono text-base md:h-8 md:text-xs" placeholder="Ej. 439020" />
          </label>

          <label>
            <span class="mb-1 block text-[9px] font-bold uppercase text-gray-600">Tipo *</span>
            <select v-model="form.tipoImplementoId" required class="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-base md:h-8 md:text-xs">
              <option value="">Seleccionar tipo…</option>
              <option v-for="tipo in tiposImplemento" :key="tipo.id" :value="tipo.id">{{ tipo.nombre }}</option>
            </select>
          </label>

          <label>
            <span class="mb-1 block text-[9px] font-bold uppercase text-gray-600">Nombre / descripción</span>
            <input v-model="form.nombre" class="h-10 w-full rounded-md border border-gray-300 px-3 text-base md:h-8 md:text-xs" placeholder="Ej. Rastra pesada" />
          </label>

          <footer class="sticky bottom-0 grid grid-cols-[1fr_1.25fr] gap-2 border-t border-gray-200 bg-gray-50 pt-3">
            <button type="button" class="h-9 rounded-md border border-gray-200 bg-white text-xs font-semibold" @click="cerrar">Cancelar</button>
            <button type="submit" class="h-9 rounded-md bg-main px-3 text-xs font-semibold text-white">Registrar y usar</button>
          </footer>
        </form>
      </aside>
    </div>
  </Teleport>
</template>
