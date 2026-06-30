<script setup lang="ts">
import {
  ArrowDown,
  ClipboardList,
  FilePlus2,
  X,
} from 'lucide-vue-next';
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  useTemplateRef,
} from 'vue';

import type { SolicitudCompraBorradorListadoItem } from '@/stores/db_compras/solicitudes_compra/borradores/solicitudesCompraBorradores.types';

import SolicitudesCompraDraftsEntryCard from './SolicitudesCompraDraftsEntryCard.vue';

const props = defineProps<{
  drafts: SolicitudCompraBorradorListadoItem[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'new'): void;
  (e: 'continue', draft: SolicitudCompraBorradorListadoItem): void;
}>();

const modalRef = useTemplateRef<HTMLElement>('modal');
const listRef = useTemplateRef<HTMLElement>('list');
const closeButtonRef = useTemplateRef<HTMLButtonElement>('closeButton');
const sortedDrafts = computed(() => props.drafts);

const getFocusableElements = (): HTMLElement[] => {
  if (!modalRef.value) {
    return [];
  }

  return Array.from(
    modalRef.value.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true');
};

const scrollToDrafts = (): void => {
  listRef.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
};

const handleKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape') {
    event.preventDefault();
    emit('close');
    return;
  }

  if (event.key !== 'Tab') {
    return;
  }

  const focusable = getFocusableElements();

  if (focusable.length === 0) {
    event.preventDefault();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement as HTMLElement | null;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
    return;
  }

  if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
};

onMounted(async () => {
  document.body.style.overflow = 'hidden';
  window.addEventListener('keydown', handleKeydown, true);
  await nextTick();
  closeButtonRef.value?.focus();
});

onBeforeUnmount(() => {
  document.body.style.overflow = '';
  window.removeEventListener('keydown', handleKeydown, true);
});
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[95] bg-[#d8d1c2]/70 backdrop-blur-[3px]">
      <div class="flex min-h-full items-center justify-center p-3 lg:p-6">
        <section
          ref="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drafts-entry-title"
          aria-describedby="drafts-entry-description"
          class="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-stone-200 bg-[#fcfbf8] text-xs shadow-[0_28px_90px_rgba(28,25,23,0.24)]"
        >
          <header class="border-b border-stone-200 px-5 pb-4 pt-5 lg:px-7 lg:pb-5 lg:pt-6">
            <div class="flex items-start justify-between gap-4">
              <div class="space-y-2">
                <h2 id="drafts-entry-title" class="text-2xl font-semibold text-stone-900">
                  Crear solicitud
                </h2>
                <p id="drafts-entry-description" class="max-w-2xl text-xs leading-5 text-stone-600">
                  Tienes borradores guardados. Elige como deseas continuar.
                </p>
              </div>

              <button
                ref="closeButton"
                type="button"
                class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 transition hover:border-stone-300 hover:text-stone-700"
                aria-label="Cerrar modal de borradores"
                @click="emit('close')"
              >
                <X class="h-4 w-4" />
              </button>
            </div>

            <div class="mt-5 grid gap-3 lg:grid-cols-2">
              <button
                type="button"
                class="group flex min-h-28 items-center justify-between rounded-[1.4rem] border border-[#e0c980] bg-[#fff3cb] px-4 py-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition hover:bg-[#ffefbd] lg:px-5"
                @click="emit('new')"
              >
                <div class="flex items-center gap-3">
                  <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#6b5314] shadow-sm">
                    <FilePlus2 class="h-5 w-5" />
                  </span>
                  <span class="space-y-1">
                    <span class="block text-sm font-semibold text-stone-900">Nueva solicitud</span>
                    <span class="block text-xs leading-5 text-stone-600">Crea una solicitud desde cero.</span>
                  </span>
                </div>
                <span class="text-sm font-semibold text-[#6b5314] transition group-hover:translate-x-0.5">Abrir</span>
              </button>

              <button
                type="button"
                class="group flex min-h-28 items-center justify-between rounded-[1.4rem] border border-stone-200 bg-white px-4 py-4 text-left shadow-sm transition hover:border-main/30 hover:bg-[#f6faf8] lg:px-5"
                @click="scrollToDrafts"
              >
                <div class="flex items-center gap-3">
                  <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#edf3f1] text-main">
                    <ClipboardList class="h-5 w-5" />
                  </span>
                  <span class="space-y-1">
                    <span class="block text-sm font-semibold text-stone-900">Ver borradores</span>
                    <span class="block text-xs leading-5 text-stone-600">Revisa y continua solicitudes guardadas.</span>
                  </span>
                </div>
                <ArrowDown class="h-4 w-4 text-main transition group-hover:translate-y-0.5" />
              </button>
            </div>
          </header>

          <div class="flex-1 overflow-y-auto px-5 py-4 lg:px-7 lg:py-5">
            <section ref="list" class="space-y-4">
              <div class="space-y-1">
                <h3 class="text-sm font-semibold text-stone-900">Borradores recientes</h3>
                <p class="text-xs leading-5 text-stone-500">
                  Continua desde el paso guardado o empieza una solicitud nueva.
                </p>
              </div>

              <div class="space-y-3">
                <SolicitudesCompraDraftsEntryCard
                  v-for="(draft, index) in sortedDrafts"
                  :key="draft.id"
                  :draft="draft"
                  :is-most-recent="index === 0"
                  @continue="emit('continue', $event)"
                />
              </div>
            </section>
          </div>

          <footer class="border-t border-stone-200 px-5 py-4 lg:px-7">
            <button
              type="button"
              class="inline-flex min-h-11 items-center gap-2 rounded-full border border-main/20 px-4 text-xs font-semibold text-main transition hover:bg-main/5"
              @click="emit('new')"
            >
              <FilePlus2 class="h-4 w-4" />
              Empezar nueva de todos modos
            </button>
          </footer>
        </section>
      </div>
    </div>
  </Teleport>
</template>
