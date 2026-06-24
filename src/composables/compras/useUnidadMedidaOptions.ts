import { computed, onMounted, ref } from 'vue';
import { shallowRef } from 'vue';

import { unidadMedidaService } from '@/stores/db_compras/unidad/unidadMedida.service';
import type { UnidadMedidaOption } from '@/stores/db_compras/unidad/unidadMedida.types';

const normalizeSearchTerm = (value: string): string => value
  .trim()
  .replace(/\s+/g, ' ')
  .toLocaleLowerCase();

export const useUnidadMedidaOptions = () => {
  const allOptions = ref<UnidadMedidaOption[]>([]);
  const loading = shallowRef(false);
  const error = shallowRef<string | null>(null);
  const query = shallowRef('');
  const selectedCodigo = shallowRef<string | null>(null);
  const hasLoaded = shallowRef(false);

  const selectedOption = computed<UnidadMedidaOption | null>(() => {
    if (!selectedCodigo.value) {
      return null;
    }

    return allOptions.value.find((option) => option.codigo === selectedCodigo.value) ?? null;
  });

  const filteredOptions = computed<UnidadMedidaOption[]>(() => {
    const normalizedQuery = normalizeSearchTerm(query.value);

    if (!normalizedQuery) {
      return allOptions.value;
    }

    return allOptions.value.filter((option) => {
      const searchCandidates = [
        option.descripcion,
        option.codigo,
        option.abreviatura,
        String(option.id),
      ];

      return searchCandidates.some((candidate) =>
        normalizeSearchTerm(candidate).includes(normalizedQuery)
      );
    });
  });

  const loadOptions = async (): Promise<void> => {
    if (loading.value || hasLoaded.value) {
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      allOptions.value = await unidadMedidaService.obtenerOpcionesActivas();
      hasLoaded.value = true;

      if (selectedCodigo.value) {
        const nextSelectedOption = allOptions.value.find(
          (option) => option.codigo === selectedCodigo.value
        );

        if (nextSelectedOption) {
          query.value = nextSelectedOption.descripcion;
        }
      }
    } catch (loadError) {
      error.value = loadError instanceof Error
        ? loadError.message
        : 'No se pudieron obtener las unidades de medida';
    } finally {
      loading.value = false;
    }
  };

  const setQuery = (value: string): void => {
    query.value = value;
  };

  const selectOption = (option: UnidadMedidaOption): void => {
    selectedCodigo.value = option.codigo;
    query.value = option.descripcion;
    error.value = null;
  };

  const clearSelection = (): void => {
    selectedCodigo.value = null;
  };

  const syncSelection = (codigo: string | null, fallbackLabel = ''): void => {
    selectedCodigo.value = codigo;

    if (!codigo) {
      query.value = fallbackLabel;
      return;
    }

    const matchedOption = allOptions.value.find((option) => option.codigo === codigo);
    query.value = matchedOption?.descripcion ?? fallbackLabel;
  };

  onMounted(() => {
    void loadOptions();
  });

  return {
    allOptions,
    filteredOptions,
    selectedOption,
    loading,
    error,
    query,
    loadOptions,
    setQuery,
    selectOption,
    clearSelection,
    syncSelection,
  };
};
