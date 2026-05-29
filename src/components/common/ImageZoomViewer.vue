<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Minus, Plus, RotateCcw, X } from 'lucide-vue-next'

const props = defineProps<{
  imageUrl: string
}>()

const emit = defineEmits<{
  close: []
}>()

const MIN_SCALE = 1
const MAX_SCALE = 5
const SCALE_STEP = 0.2

const scale = ref(1)
const posX = ref(0)
const posY = ref(0)
const isDragging = ref(false)
const lastPointerX = ref(0)
const lastPointerY = ref(0)

const imageStyle = computed(() => ({
  transform: `translate(${posX.value}px, ${posY.value}px) scale(${scale.value})`,
  transition: isDragging.value ? 'none' : 'transform 150ms ease-out',
  cursor: scale.value > 1 ? (isDragging.value ? 'grabbing' : 'grab') : 'zoom-in',
}))

const clampScale = (value: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))

const resetZoom = () => {
  scale.value = MIN_SCALE
  posX.value = 0
  posY.value = 0
}

const setScale = (nextScale: number) => {
  scale.value = clampScale(nextScale)

  if (scale.value <= MIN_SCALE) {
    posX.value = 0
    posY.value = 0
    isDragging.value = false
  }
}

const zoomIn = () => {
  setScale(scale.value + SCALE_STEP)
}

const zoomOut = () => {
  setScale(scale.value - SCALE_STEP)
}

const closeViewer = () => {
  emit('close')
}

const handleWheel = (event: WheelEvent) => {
  const direction = event.deltaY < 0 ? SCALE_STEP : -SCALE_STEP
  setScale(scale.value + direction)
}

const startDrag = (event: PointerEvent) => {
  if (scale.value <= MIN_SCALE) {
    return
  }

  isDragging.value = true
  lastPointerX.value = event.clientX
  lastPointerY.value = event.clientY
}

const onDrag = (event: PointerEvent) => {
  if (!isDragging.value || scale.value <= MIN_SCALE) {
    return
  }

  posX.value += event.clientX - lastPointerX.value
  posY.value += event.clientY - lastPointerY.value
  lastPointerX.value = event.clientX
  lastPointerY.value = event.clientY
}

const stopDrag = () => {
  isDragging.value = false
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeViewer()
  }
}

watch(
  () => props.imageUrl,
  () => {
    resetZoom()
  },
  { immediate: true },
)

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('pointermove', onDrag)
  window.addEventListener('pointerup', stopDrag)
  document.body.style.overflow = 'hidden'
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('pointermove', onDrag)
  window.removeEventListener('pointerup', stopDrag)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[120] flex flex-col bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label="Visor de imagen"
      @click.self="closeViewer"
    >
      <div class="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <div class="text-sm font-semibold text-white">Vista completa</div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Alejar"
            @click="zoomOut"
          >
            <Minus class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Acercar"
            @click="zoomIn"
          >
            <Plus class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Restablecer zoom"
            @click="resetZoom"
          >
            <RotateCcw class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Cerrar visor"
            @click="closeViewer"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        class="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 py-4 sm:px-6 sm:py-6"
        @wheel.prevent="handleWheel"
      >
        <img
          :src="imageUrl"
          alt="Evidencia fotográfica ampliada"
          class="max-h-full max-w-full select-none object-contain will-change-transform"
          :class="scale > 1 ? 'touch-none' : ''"
          :style="imageStyle"
          referrerpolicy="no-referrer"
          draggable="false"
          @pointerdown.prevent="startDrag"
        />
      </div>
    </div>
  </Teleport>
</template>
