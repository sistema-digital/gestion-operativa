import { computed, nextTick, onBeforeUnmount, ref, shallowRef } from "vue";
import { storeToRefs } from "pinia";
import { useCatalogoEngrasePermissions } from "./useCatalogoEngrasePermissions";
import { useSubsistemasCatalogoStore } from "@/stores/dbequipos/engrase/catalogo/subsistemasCatalogo.store";
import {
  SUBSISTEMA_NOMBRE_MAX,
  type CatalogoSubsistemaEditorMode,
  type CatalogoSubsistemaFieldErrors,
  type CatalogoSubsistemaGuardarInput,
  type CatalogoSubsistemaItem,
} from "@/stores/dbequipos/engrase/catalogo/subsistemasCatalogo.types";

const emptyDraft = (): CatalogoSubsistemaGuardarInput => ({
  id: null,
  nombre: "",
  activo: true,
});

export function useCatalogoSubsistemas() {
  const store = useSubsistemasCatalogoStore();
  const state = storeToRefs(store);
  const { canCreateCatalogItems, canEditCatalogItems } =
    useCatalogoEngrasePermissions();
  const modo = shallowRef<CatalogoSubsistemaEditorMode>("cerrado");
  const draft = ref<CatalogoSubsistemaGuardarInput | null>(null);
  const fieldErrors = ref<CatalogoSubsistemaFieldErrors>({});
  const successMessage = shallowRef<string | null>(null);
  const confirmacionAbierta = shallowRef(false);
  const confirmarDescarteAbierto = shallowRef(false);
  const triggerElement = shallowRef<HTMLElement | null>(null);
  let successTimer: ReturnType<typeof setTimeout> | null = null;

  const original = computed(() =>
    draft.value?.id === null
      ? null
      : (state.items.value.find((item) => item.id === draft.value?.id) ?? null),
  );
  const drawerOpen = computed(() => modo.value !== "cerrado");
  const canSave = computed(() =>
    modo.value === "crear"
      ? canCreateCatalogItems.value
      : modo.value === "editar" && canEditCatalogItems.value,
  );
  const hasChanges = computed(() => {
    if (!draft.value) return false;
    if (modo.value === "crear")
      return Boolean(draft.value.nombre.trim()) || !draft.value.activo;
    return Boolean(
      original.value &&
      (draft.value.nombre.trim() !== original.value.nombre ||
        draft.value.activo !== original.value.activo),
    );
  });
  const canSubmit = computed(
    () =>
      canSave.value &&
      hasChanges.value &&
      !state.guardando.value &&
      !fieldErrors.value.nombre,
  );

  function rememberTrigger(element?: HTMLElement | null): void {
    triggerElement.value =
      element ??
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null);
  }
  function abrirCrear(): void {
    if (!canCreateCatalogItems.value) return;
    rememberTrigger();
    store.limpiarErrorGuardado();
    modo.value = "crear";
    draft.value = emptyDraft();
    fieldErrors.value = {};
  }
  function abrirEditar(
    item: CatalogoSubsistemaItem,
    trigger?: HTMLElement | null,
  ): void {
    if (!canEditCatalogItems.value) return;
    rememberTrigger(trigger);
    store.limpiarErrorGuardado();
    modo.value = "editar";
    draft.value = { id: item.id, nombre: item.nombre, activo: item.activo };
    fieldErrors.value = {};
  }
  async function restoreFocus(): Promise<void> {
    await nextTick();
    if (triggerElement.value?.isConnected) triggerElement.value.focus();
    else
      document
        .querySelector<HTMLElement>("[data-catalogo-subsistemas-heading]")
        ?.focus();
    triggerElement.value = null;
  }
  function cerrarAhora(): void {
    modo.value = "cerrado";
    draft.value = null;
    fieldErrors.value = {};
    confirmacionAbierta.value = false;
    confirmarDescarteAbierto.value = false;
    void restoreFocus();
  }
  function solicitarCierre(): void {
    if (state.guardando.value) return;
    if (hasChanges.value) {
      confirmarDescarteAbierto.value = true;
      return;
    }
    cerrarAhora();
  }
  function cancelarDescarte(): void {
    confirmarDescarteAbierto.value = false;
  }
  function cancelarConfirmacion(): void {
    if (!state.guardando.value) confirmacionAbierta.value = false;
  }
  function updateDraft(value: CatalogoSubsistemaGuardarInput): void {
    if (!canSave.value) return;
    draft.value = value;
    store.limpiarErrorGuardado();
    if (fieldErrors.value.nombre && value.nombre.trim()) fieldErrors.value = {};
  }
  function validateName(): boolean {
    const name = draft.value?.nombre.trim() ?? "";
    if (!name) {
      fieldErrors.value = { nombre: "Ingresa un nombre para mostrar." };
      return false;
    }
    if (name.length > SUBSISTEMA_NOMBRE_MAX) {
      fieldErrors.value = {
        nombre: "El nombre no puede superar 100 caracteres.",
      };
      return false;
    }
    fieldErrors.value = {};
    return true;
  }
  function applySaveError(): void {
    if (state.errorGuardado.value?.codigo === "SUBSISTEMA_NOMBRE_REQUERIDO")
      fieldErrors.value = { nombre: "Ingresa un nombre para mostrar." };
    if (state.errorGuardado.value?.codigo === "SUBSISTEMA_NOMBRE_DUPLICADO")
      fieldErrors.value = { nombre: "Ya existe un subsistema con ese nombre." };
  }
  function showSuccess(message: string): void {
    successMessage.value = message;
    if (successTimer) clearTimeout(successTimer);
    successTimer = setTimeout(() => {
      successMessage.value = null;
      successTimer = null;
    }, 4000);
  }
  async function guardarDirectamente(): Promise<void> {
    if (!draft.value || !canSubmit.value || !validateName()) return;
    const isNew = draft.value.id === null;
    try {
      await store.guardar({
        ...draft.value,
        nombre: draft.value.nombre.trim(),
      });
      showSuccess(
        isNew
          ? "El subsistema se creó correctamente."
          : "El subsistema se actualizó correctamente.",
      );
      cerrarAhora();
    } catch {
      confirmacionAbierta.value = false;
      applySaveError();
    }
  }
  async function submit(): Promise<void> {
    if (!draft.value || !canSubmit.value || !validateName()) return;
    if (modo.value === "crear") {
      await guardarDirectamente();
      return;
    }
    confirmacionAbierta.value = true;
  }
  async function confirmarActualizacion(): Promise<void> {
    if (!canEditCatalogItems.value) return;
    await guardarDirectamente();
  }

  onBeforeUnmount(() => {
    if (successTimer) clearTimeout(successTimer);
  });

  return {
    ...state,
    modo,
    draft,
    original,
    drawerOpen,
    fieldErrors,
    successMessage,
    hasChanges,
    canSave,
    canSubmit,
    canCreateCatalogItems,
    canEditCatalogItems,
    confirmacionAbierta,
    confirmarDescarteAbierto,
    abrirCrear,
    abrirEditar,
    solicitarCierre,
    cerrarAhora,
    cancelarDescarte,
    cancelarConfirmacion,
    updateDraft,
    validateName,
    submit,
    confirmarActualizacion,
    inicializar: store.inicializar,
    reintentar: store.reintentar,
    actualizarBusqueda: store.actualizarBusqueda,
    actualizarEstado: store.actualizarEstado,
    actualizarUso: store.actualizarUso,
    actualizarOrden: store.actualizarOrden,
    limpiarFiltros: store.limpiarFiltros,
  };
}
