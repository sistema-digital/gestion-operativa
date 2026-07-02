import { computed, ref, shallowRef, toValue, watchEffect } from 'vue';
import type { MaybeRefOrGetter } from 'vue';

import { useUserStore } from '@/stores/userStore';
import { catalogoContextoDestinoService } from '@/stores/db_compras/catalogo_contexto_destino/catalogoContextoDestino.service';
import type { CatalogoContextoDestinoOption } from '@/stores/db_compras/catalogo_contexto_destino/catalogoContextoDestino.types';
import type { SolicitudCompraTipoSolicitud } from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

const AUTHORIZED_ROLES = new Set(['admin', 'gerencia', 'secretaria']);

const normalizeAccessValue = (value: string | null | undefined): string => value?.trim().toLowerCase() ?? '';

export const useCatalogoContextoDestinoOptions = (
  tipoSolicitud: MaybeRefOrGetter<SolicitudCompraTipoSolicitud | null>
) => {
  const userStore = useUserStore();
  const options = ref<CatalogoContextoDestinoOption[]>([]);
  const loading = shallowRef(false);
  const error = shallowRef<string | null>(null);
  const hasLoaded = shallowRef(false);

  const isAuthorizedForRestricted = computed(() => AUTHORIZED_ROLES.has(normalizeAccessValue(userStore.role)));
  const isServicio = computed(() => toValue(tipoSolicitud) === 'servicio');

  const visibleOptions = computed(() => options.value.filter((item) => {
    if (!item.activo) {
      return false;
    }

    if (!item.restringidoAServicios) {
      return true;
    }

    return isServicio.value && isAuthorizedForRestricted.value;
  }));

  const loadOptions = async (): Promise<void> => {
    if (loading.value || hasLoaded.value) {
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      options.value = await catalogoContextoDestinoService.obtenerOpciones();
      hasLoaded.value = true;
    } catch (loadError) {
      error.value = loadError instanceof Error
        ? loadError.message
        : 'No se pudieron obtener los destinos';
    } finally {
      loading.value = false;
    }
  };

  watchEffect(() => {
    if (!toValue(tipoSolicitud)) {
      return;
    }

    void loadOptions();
  });

  return {
    options: visibleOptions,
    loading,
    error,
    isAuthorizedForRestricted,
    loadOptions,
  };
};
