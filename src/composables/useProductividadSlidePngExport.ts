import { nextTick, readonly, shallowRef, toValue } from 'vue';
import { toBlob, toPng } from 'html-to-image';
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

const getCaptureTarget = (root: HTMLElement | null) => (
  root?.firstElementChild instanceof HTMLElement
    ? root.firstElementChild
    : root
);

export const useProductividadSlidePngExport = ({
  currentSlideIndex,
  slideElement,
  slides,
  weekLabel,
}: UseProductividadSlidePngExportOptions) => {
  const isExporting = shallowRef(false);
  const isCopying = shallowRef(false);
  const exportError = shallowRef<string | null>(null);

  const copyActiveSlideToClipboard = async () => {
    const currentRoot = getCaptureTarget(slideElement.value);

    if (!currentRoot) {
      exportError.value = 'No se pudo preparar el slide para copiar.';
      return;
    }

    if (
      typeof navigator === 'undefined'
      || !navigator.clipboard
      || typeof ClipboardItem === 'undefined'
    ) {
      exportError.value = 'Este navegador no soporta copiar imagenes al portapapeles.';
      return;
    }

    isCopying.value = true;
    exportError.value = null;

    try {
      await waitForRender();

      const blob = await toBlob(currentRoot, {
        backgroundColor: '#ffffff',
        cacheBust: true,
        pixelRatio: 3,
        canvasWidth: currentRoot.scrollWidth * 3,
        canvasHeight: currentRoot.scrollHeight * 3,
      });

      if (!blob) {
        throw new Error('No se pudo convertir el slide a imagen.');
      }

      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);
    } catch (error) {
      exportError.value = error instanceof Error
        ? error.message
        : 'No se pudo copiar el slide al portapapeles.';
    } finally {
      isCopying.value = false;
    }
  };

  const exportSlidesAsPng = async () => {
    const slideItems = toValue(slides);
    const slideRoot = getCaptureTarget(slideElement.value);

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

        const currentRoot = getCaptureTarget(slideElement.value);
        if (!currentRoot) {
          throw new Error('No se pudo preparar el slide para exportar.');
        }

        const dataUrl = await toPng(currentRoot, {
          backgroundColor: '#ffffff',
          cacheBust: true,
          pixelRatio: 3,
          canvasWidth: currentRoot.scrollWidth * 3,
          canvasHeight: currentRoot.scrollHeight * 3,
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
    copyActiveSlideToClipboard,
    exportError: readonly(exportError),
    exportSlidesAsPng,
    isCopying: readonly(isCopying),
    isExporting: readonly(isExporting),
  };
};
