import { nextTick, readonly, shallowRef, toValue } from 'vue';
import { toPng } from 'html-to-image';
import type { MaybeRefOrGetter, Ref } from 'vue';
import type { ProductividadSemanalArea } from '@/stores/horasTrabajo.types';

type UseProductividadSlidePngExportOptions = {
  currentSlideIndex: Ref<number>;
  slideElement: Ref<HTMLElement | null>;
  slides: MaybeRefOrGetter<ProductividadSemanalArea[]>;
  weekLabel: MaybeRefOrGetter<string>;
};

const waitForRender = async () => {
  await nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
};

const sanitizeFileName = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9-_]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase();

const downloadDataUrl = (dataUrl: string, fileName: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  link.click();
};

export const useProductividadSlidePngExport = ({
  currentSlideIndex,
  slideElement,
  slides,
  weekLabel,
}: UseProductividadSlidePngExportOptions) => {
  const isExporting = shallowRef(false);
  const exportError = shallowRef<string | null>(null);

  const exportSlidesAsPng = async () => {
    const slideItems = toValue(slides);
    const slideRoot = slideElement.value;

    if (!slideItems.length || !slideRoot) {
      exportError.value = 'No hay slides disponibles para exportar.';
      return;
    }

    isExporting.value = true;
    exportError.value = null;

    const initialIndex = currentSlideIndex.value;

    try {
      for (let index = 0; index < slideItems.length; index += 1) {
        currentSlideIndex.value = index;
        await waitForRender();

        const currentRoot = slideElement.value;
        if (!currentRoot) {
          throw new Error('No se pudo preparar el slide para exportar.');
        }

        const dataUrl = await toPng(currentRoot, {
          backgroundColor: '#ffffff',
          cacheBust: true,
          pixelRatio: 2,
        });

        const areaSlug = sanitizeFileName(slideItems[index].area || `area-${index + 1}`);
        const weekSlug = sanitizeFileName(String(toValue(weekLabel) || 'semana'));
        downloadDataUrl(dataUrl, `productividad-semanal-${weekSlug}-${areaSlug}.png`);
      }
    } catch (error) {
      exportError.value = error instanceof Error
        ? error.message
        : 'No se pudieron exportar los slides en PNG.';
    } finally {
      currentSlideIndex.value = initialIndex;
      await waitForRender();
      isExporting.value = false;
    }
  };

  return {
    exportError: readonly(exportError),
    exportSlidesAsPng,
    isExporting: readonly(isExporting),
  };
};
