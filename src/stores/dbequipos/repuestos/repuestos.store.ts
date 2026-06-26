import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { repuestosService } from './repuestos.service';
import type {
  CatalogItem,
  CatalogTableName,
  RepuestoCaptura,
  RepuestoImageFileMap,
  RepuestoImageSlot,
  RepuestoImagenesFirmadas
} from './repuestos.types';
import { buildOriginalImagesValue, parseRepuestoImagenes } from './repuestos.images';

export const useRepuestosStore = defineStore('dbequipos_repuestos', () => {
  const sistemas = ref<CatalogItem[]>([]);
  const categorias = ref<CatalogItem[]>([]);
  const criticidades = ref<CatalogItem[]>([]);
  const estados = ref<CatalogItem[]>([]);
  const unidades = ref<CatalogItem[]>([]);
  const proveedores = ref<CatalogItem[]>([]);
  const tiposCodigoProveedor = ref<CatalogItem[]>([]);

  const repuestosCaptura = ref<RepuestoCaptura[]>([]);

  const isLoading = ref(false);
  const isLoaded = ref(false);
  const error = ref<string | null>(null);

  const opcionesSistemas = computed(() => sistemas.value.map((i) => i.name));
  const opcionesCategorias = computed(() => categorias.value.map((i) => i.name));
  const opcionesCriticidades = computed(() => criticidades.value.map((i) => i.name));
  const opcionesEstados = computed(() => estados.value.map((i) => i.name));
  const opcionesUnidades = computed(() => unidades.value.map((i) => i.name));
  const opcionesProveedores = computed(() => proveedores.value.map((i) => i.name));
  const opcionesTiposCodigo = computed(() => tiposCodigoProveedor.value.map((i) => i.name));

  const normalizeText = (text: string | null | undefined): string => {
    if (!text) return '';
    return text.trim().toLowerCase().replace(/\s+/g, ' ');
  };

  const getTargetArrayRef = (tableName: CatalogTableName) => {
    switch (tableName) {
      case 'repuesto_sistema': return sistemas;
      case 'repuesto_categoria': return categorias;
      case 'repuesto_criticidad': return criticidades;
      case 'repuesto_estado': return estados;
      case 'repuesto_unidad': return unidades;
      case 'repuesto_proveedor': return proveedores;
      case 'repuesto_tipo_codigo_proveedor': return tiposCodigoProveedor;
    }
  };

  const upsertLocalRepuesto = (repuesto: RepuestoCaptura) => {
    const index = repuestosCaptura.value.findIndex((item) => item.id === repuesto.id);

    if (index === -1) {
      repuestosCaptura.value.unshift(repuesto);
      return;
    }

    repuestosCaptura.value[index] = repuesto;
  };

  const cargarRepuestosCaptura = async (force = false) => {
    if (repuestosCaptura.value.length > 0 && !force) return;

    isLoading.value = true;
    error.value = null;

    try {
      repuestosCaptura.value = await repuestosService.fetchRepuestosCaptura();
    } catch (err: any) {
      error.value = err.message || 'Error al cargar los repuestos.';
      console.error('Error cargando repuestos:', err);
    } finally {
      isLoading.value = false;
    }
  };

  const guardarRepuestoCaptura = async (
    repuestoForm: Omit<RepuestoCaptura, 'id' | 'created_at' | 'updated_at'>
  ) => {
    isLoading.value = true;
    error.value = null;

    try {
      const newRepuesto = await repuestosService.insertRepuestoCaptura(repuestoForm);
      upsertLocalRepuesto(newRepuesto);
      return newRepuesto;
    } catch (err: any) {
      error.value = err.message || 'Error al guardar el repuesto.';
      console.error('Error guardando repuesto:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const guardarRepuestoCapturaConImagenes = async (
    repuestoForm: Omit<RepuestoCaptura, 'id' | 'created_at' | 'updated_at'>,
    imageFiles: RepuestoImageFileMap
  ) => {
    isLoading.value = true;
    error.value = null;
    let createdRepuesto: RepuestoCaptura | null = null;

    try {
      createdRepuesto = await repuestosService.insertRepuestoCaptura({
        ...repuestoForm,
        imagen_1: null,
        imagen_2: null
      });

      upsertLocalRepuesto(createdRepuesto);

      const imagePayload = await repuestosService.uploadRepuestoImages({
        repuestoId: createdRepuesto.id ?? '',
        files: imageFiles
      });

      const updatedRepuesto = await repuestosService.updateRepuestoCaptura(
        createdRepuesto.id ?? '',
        imagePayload
      );

      upsertLocalRepuesto(updatedRepuesto);
      return updatedRepuesto;
    } catch (err: any) {
      const createdId = createdRepuesto?.id;

      if (createdId) {
        try {
          await repuestosService.deleteRepuestoCaptura(createdId);
          repuestosCaptura.value = repuestosCaptura.value.filter((item) => item.id !== createdId);
        } catch (rollbackError) {
          console.error('Error revirtiendo repuesto tras fallo de imágenes:', rollbackError);
        }
      }

      error.value = err.message || 'Error al guardar el repuesto con imágenes.';
      console.error('Error guardando repuesto con imágenes:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const actualizarRepuestoCaptura = async (id: string, repuestoForm: Partial<RepuestoCaptura>) => {
    isLoading.value = true;
    error.value = null;

    try {
      const updatedRepuesto = await repuestosService.updateRepuestoCaptura(id, repuestoForm);
      upsertLocalRepuesto(updatedRepuesto);
      return updatedRepuesto;
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar el repuesto.';
      console.error('Error actualizando repuesto:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const actualizarRepuestoCapturaConImagenes = async (
    id: string,
    repuestoForm: Partial<RepuestoCaptura>,
    imageFiles: RepuestoImageFileMap,
    currentRepuesto: Pick<RepuestoCaptura, 'imagen_1' | 'imagen_2'> | null,
    removedSlots: RepuestoImageSlot[] = []
  ) => {
    isLoading.value = true;
    error.value = null;
    const parsedCurrentImages = parseRepuestoImagenes(currentRepuesto);
    const removalOnlyPayload = {
      imagen_1: removedSlots.includes('frente') ? null : parsedCurrentImages.miniaturaPath,
      imagen_2: buildOriginalImagesValue({
        frente: removedSlots.includes('frente') ? null : parsedCurrentImages.frentePath,
        lado: removedSlots.includes('lado') ? null : parsedCurrentImages.ladoPath,
        puesta: removedSlots.includes('puesta') ? null : parsedCurrentImages.puestaPath,
        extra: removedSlots.includes('extra') ? null : parsedCurrentImages.extraPath
      })
    };
    let deletedSomething = false;

    try {
      for (const slot of removedSlots) {
        switch (slot) {
          case 'frente':
            await repuestosService.deleteRepuestoStorageObject(parsedCurrentImages.frentePath);
            await repuestosService.deleteRepuestoStorageObject(parsedCurrentImages.miniaturaPath);
            deletedSomething = true;
            break;
          case 'lado':
            await repuestosService.deleteRepuestoStorageObject(parsedCurrentImages.ladoPath);
            deletedSomething = true;
            break;
          case 'puesta':
            await repuestosService.deleteRepuestoStorageObject(parsedCurrentImages.puestaPath);
            deletedSomething = true;
            break;
          case 'extra':
            await repuestosService.deleteRepuestoStorageObject(parsedCurrentImages.extraPath);
            deletedSomething = true;
            break;
        }
      }

      const imagePayload = await repuestosService.uploadRepuestoImages({
        repuestoId: id,
        files: imageFiles,
        existingImagen1: currentRepuesto?.imagen_1 ?? null,
        existingImagen2: currentRepuesto?.imagen_2 ?? null,
        removedSlots
      });

      const updatedRepuesto = await repuestosService.updateRepuestoCaptura(id, {
        ...repuestoForm,
        ...imagePayload
      });

      upsertLocalRepuesto(updatedRepuesto);
      return updatedRepuesto;
    } catch (err: any) {
      if (deletedSomething) {
        try {
          const syncedRepuesto = await repuestosService.updateRepuestoCaptura(id, removalOnlyPayload);
          upsertLocalRepuesto(syncedRepuesto);
        } catch (syncError) {
          console.error('Error sincronizando columnas tras borrar imágenes en storage:', syncError);
        }
      }

      error.value = err.message || 'Error al actualizar el repuesto con imágenes.';
      console.error('Error actualizando repuesto con imágenes:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const eliminarRepuestoCaptura = async (id: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      await repuestosService.deleteRepuestoCaptura(id);
      repuestosCaptura.value = repuestosCaptura.value.filter((r) => r.id !== id);
    } catch (err: any) {
      error.value = err.message || 'Error al eliminar el repuesto.';
      console.error('Error eliminando repuesto:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const cargarCatalogos = async (force = false) => {
    if (isLoaded.value && !force) return;

    isLoading.value = true;
    error.value = null;

    try {
      const [
        resSistemas, resCategorias, resCriticidades, resEstados, resUnidades, resProveedores, resTiposCodigo
      ] = await Promise.all([
        repuestosService.fetchActiveCatalog('repuesto_sistema'),
        repuestosService.fetchActiveCatalog('repuesto_categoria'),
        repuestosService.fetchActiveCatalog('repuesto_criticidad'),
        repuestosService.fetchActiveCatalog('repuesto_estado'),
        repuestosService.fetchActiveCatalog('repuesto_unidad'),
        repuestosService.fetchActiveCatalog('repuesto_proveedor'),
        repuestosService.fetchActiveCatalog('repuesto_tipo_codigo_proveedor')
      ]);

      sistemas.value = resSistemas;
      categorias.value = resCategorias;
      criticidades.value = resCriticidades;
      estados.value = resEstados;
      unidades.value = resUnidades;
      proveedores.value = resProveedores;
      tiposCodigoProveedor.value = resTiposCodigo;

      isLoaded.value = true;
    } catch (err: any) {
      error.value = err.message || 'Error al cargar los catálogos auxiliares.';
      console.error('Error cargando catálogos auxiliares:', err);
    } finally {
      isLoading.value = false;
    }
  };

  const asegurarValorCatalogo = async (tableName: CatalogTableName, name: string): Promise<string> => {
    if (!name || name.trim() === '') return '';

    const normalizedInput = normalizeText(name);
    const targetArray = getTargetArrayRef(tableName);

    const itemExistente = targetArray.value.find((item) => normalizeText(item.name) === normalizedInput);
    if (itemExistente) return itemExistente.name;

    try {
      const newItem = await repuestosService.insertCatalogItem(tableName, name);
      targetArray.value.push(newItem);
      targetArray.value.sort((a, b) => a.name.localeCompare(b.name));
      return newItem.name;
    } catch (err) {
      console.error(`Error asegurando valor en ${tableName}:`, err);
      return name.trim();
    }
  };

  const resolverImagenesFirmadas = async (
    repuesto: Pick<RepuestoCaptura, 'imagen_1' | 'imagen_2'> | null | undefined
  ): Promise<{ images: RepuestoImagenesFirmadas; errors: string[] }> => {
    return await repuestosService.resolveSignedImagesWithErrors(repuesto);
  };

  const resetStore = () => {
    sistemas.value = [];
    categorias.value = [];
    criticidades.value = [];
    estados.value = [];
    unidades.value = [];
    proveedores.value = [];
    tiposCodigoProveedor.value = [];
    repuestosCaptura.value = [];
    isLoaded.value = false;
    isLoading.value = false;
    error.value = null;
  };

  return {
    sistemas,
    categorias,
    criticidades,
    estados,
    unidades,
    proveedores,
    tiposCodigoProveedor,
    repuestosCaptura,
    isLoading,
    isLoaded,
    error,
    opcionesSistemas,
    opcionesCategorias,
    opcionesCriticidades,
    opcionesEstados,
    opcionesUnidades,
    opcionesProveedores,
    opcionesTiposCodigo,
    cargarRepuestosCaptura,
    guardarRepuestoCaptura,
    guardarRepuestoCapturaConImagenes,
    actualizarRepuestoCaptura,
    actualizarRepuestoCapturaConImagenes,
    eliminarRepuestoCaptura,
    cargarCatalogos,
    asegurarValorCatalogo,
    resolverImagenesFirmadas,
    resetStore
  };
});
