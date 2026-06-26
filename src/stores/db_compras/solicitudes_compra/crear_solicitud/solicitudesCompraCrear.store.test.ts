import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/stores/userStore', () => ({
  useUserStore: () => ({
    isLoaded: true,
    nombre: 'Juan Pérez',
    email: 'juan@cadasa.test',
    area: 'OPERATIVA',
    profile: {
      area: 'Operativa',
    },
    fetchCurrentUserProfile: vi.fn(),
  }),
}));

vi.mock('@/stores/dbequipos/equipos/equipos.store', () => ({
  useEquiposStore: () => ({
    reset: vi.fn(),
    agregarEquipo: vi.fn(),
    removerEquipo: vi.fn(),
    buscarEquipos: vi.fn(),
  }),
}));

vi.mock('./solicitudesCompraCrear.service', () => ({
  solicitudesCompraCrearService: {
    buscarProductos: vi.fn(),
    prepararUploadSession: vi.fn(),
    subirAdjuntos: vi.fn(),
    crearSolicitud: vi.fn(),
  },
}));

import { solicitudesCompraCrearService } from './solicitudesCompraCrear.service';
import { useSolicitudesCompraCrearStore } from './solicitudesCompraCrear.store';
import { OBSERVACION_MAX_LENGTH, OBSERVACION_PREFILL_PREFIX } from './solicitudesCompraCrear.types';

const mockedService = vi.mocked(solicitudesCompraCrearService);

describe('solicitudesCompraCrear.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('inicializa datos de encabezado desde userStore', async () => {
    const store = useSolicitudesCompraCrearStore();

    await store.initialize();

    expect(store.solicitanteNombre).toBe('Juan Pérez');
    expect(store.solicitanteEmail).toBe('juan@cadasa.test');
    expect(store.areaNombre).toBe('Operativa');
  });

  it('valida paso 1 y arma payload draft ignorando urgencia', () => {
    const store = useSolicitudesCompraCrearStore();

    store.setTipoSolicitud('zafra');
    store.setFechaEntrega('2026-06-30');
    store.equipos = [
      {
        id: 1,
        source: 'equipo',
        codEquipo: 'EQ-001',
        label: 'EQ-001 · Tractor John Deere 6155M',
        modelo: '6155M',
        marca: 'John Deere',
        tipo: 'Tractor',
      },
    ];
    store.setObservacion('Solicitud para mantenimiento preventivo.');
    store.setSolicitarUrgente(true);
    store.setMotivoUrgencia('Riesgo de paro');

    expect(store.validateStep(1)).toBe(true);

    const payload = store.buildPayload('draft');

    expect(payload.p_enviar).toBe(false);
    expect(payload.p_solicitar_urgente).toBe(false);
    expect(payload.p_motivo_urgencia).toBeNull();
    expect(payload.p_equipos).toEqual(['EQ-001']);
  });

  it('exige productos al enviar solicitud', async () => {
    const store = useSolicitudesCompraCrearStore();

    store.setTipoSolicitud('zafra');
    store.setFechaEntrega('2026-06-30');
    store.equipos = [
      {
        id: 1,
        source: 'equipo',
        codEquipo: 'EQ-001',
        label: 'EQ-001 · Tractor John Deere 6155M',
        modelo: '6155M',
        marca: 'John Deere',
        tipo: 'Tractor',
      },
    ];
    store.setObservacion('Solicitud para mantenimiento preventivo.');

    await expect(store.submit('send')).rejects.toThrow('La solicitud no es válida');
    expect(mockedService.crearSolicitud).not.toHaveBeenCalled();
    expect(store.validationErrors.productos).toBeTruthy();
  });

  it('arma payload de servicios cuando el tipo es servicio', () => {
    const store = useSolicitudesCompraCrearStore();

    store.setTipoSolicitud('servicio');
    store.setFechaEntrega('2026-06-30');
    store.equipos = [
      {
        id: 1,
        source: 'contexto',
        codEquipo: 'taller',
        label: 'Instalaciones de taller',
        modelo: null,
        marca: null,
        tipo: null,
      },
    ];
    store.setObservacion('Servicio requerido para torno externo.');
    store.agregarServicio({
      cantidad: 3,
      descripcion: 'Servicio de torno',
      unidadCodigo: 'un',
      unidadLabel: 'Un',
    });

    const payload = store.buildPayload('send');

    expect(payload.p_productos).toEqual([]);
    expect(payload.p_servicios).toEqual([
      {
        descripcion: 'Servicio de torno',
        cantidad: 3,
        unidad_codigo: 'un',
      },
    ]);
  });

  it('exige al menos un servicio para avanzar en el paso 2', () => {
    const store = useSolicitudesCompraCrearStore();

    store.setTipoSolicitud('servicio');
    store.setFechaEntrega('2026-06-30');
    store.equipos = [
      {
        id: 1,
        source: 'contexto',
        codEquipo: 'taller',
        label: 'Instalaciones de taller',
        modelo: null,
        marca: null,
        tipo: null,
      },
    ];
    store.currentStep = 2;

    expect(store.validateStep(2)).toBe(false);
    expect(store.validationErrors.servicios).toBe('Debe agregar al menos un servicio para continuar.');
  });

  it('actualiza servicios existentes', () => {
    const store = useSolicitudesCompraCrearStore();

    store.agregarServicio({
      cantidad: 1,
      descripcion: 'Servicio inicial',
      unidadCodigo: 'un',
      unidadLabel: 'Un',
    });

    const servicio = store.servicios[0];

    store.actualizarServicio(servicio.localId, {
      cantidad: 4,
      descripcion: 'Servicio editado',
      unidadCodigo: 'kg',
      unidadLabel: 'Kg',
    });

    expect(store.servicios).toEqual([
      expect.objectContaining({
        cantidad: 4,
        descripcion: 'Servicio editado',
        unidadCodigo: 'kg',
        unidadLabel: 'Kg',
      }),
    ]);
  });

  it('actualiza solo productos temporales existentes', () => {
    const store = useSolicitudesCompraCrearStore();

    store.agregarProductoTemporal({
      descripcion: 'Producto temporal inicial',
      unidadCodigo: 'unidad',
      unidadLabel: 'Unidad',
    });
    store.agregarProductoExistente({
      productoId: 'prod-1',
      codProducto: 'P-001',
      descripcion: 'Producto catalogado',
      unidadCodigo: 'kg',
      unidadLabel: 'Kilogramo',
    });

    const temporal = store.productos.find((item) => item.tipo === 'temporal');
    const existente = store.productos.find((item) => item.tipo === 'existente');

    expect(temporal?.tipo).toBe('temporal');
    expect(existente?.tipo).toBe('existente');

    store.actualizarProductoTemporal(temporal!.localId, {
      descripcion: 'Producto temporal editado',
      unidadCodigo: 'caja',
      unidadLabel: 'Caja',
    });
    store.actualizarProductoTemporal(existente!.localId, {
      descripcion: 'No deberia mutar',
      unidadCodigo: 'otro',
      unidadLabel: 'Otro',
    });

    expect(store.productos).toEqual([
      expect.objectContaining({
        tipo: 'temporal',
        descripcion: 'Producto temporal editado',
        unidadCodigo: 'caja',
        unidadLabel: 'Caja',
      }),
      expect.objectContaining({
        tipo: 'existente',
        codProducto: 'P-001',
        unidadCodigo: 'kg',
        unidadLabel: 'Kilogramo',
      }),
    ]);
  });

  it('autocompleta observacion con el prefijo y codigos de equipos reales', () => {
    const store = useSolicitudesCompraCrearStore();

    expect(store.observacion).toBe(OBSERVACION_PREFILL_PREFIX);

    store.agregarEquipo({
      id: 1,
      codEquipo: '422006',
      label: '422006 · Tractor',
      modelo: '6155M',
      marca: 'John Deere',
      tipo: 'Tractor',
    });
    store.agregarEquipo({
      id: 2,
      codEquipo: '422018',
      label: '422018 · Cosechadora',
      modelo: 'S670',
      marca: 'John Deere',
      tipo: 'Cosechadora',
    });

    expect(store.observacion).toBe('Para uso en: 422006, 422018');
  });

  it('no sobreescribe la observacion cuando el usuario la edito manualmente', () => {
    const store = useSolicitudesCompraCrearStore();

    store.agregarEquipo({
      id: 1,
      codEquipo: '422006',
      label: '422006 · Tractor',
      modelo: '6155M',
      marca: 'John Deere',
      tipo: 'Tractor',
    });
    store.setObservacion('Para uso en: 422006. Equipo detenido por fuga.');
    store.agregarEquipo({
      id: 2,
      codEquipo: '422018',
      label: '422018 · Cosechadora',
      modelo: 'S670',
      marca: 'John Deere',
      tipo: 'Cosechadora',
    });

    expect(store.observacion).toBe('Para uso en: 422006. Equipo detenido por fuga.');
  });

  it('mantiene solo el prefijo cuando se agregan contextos de servicio sin equipos reales', () => {
    const store = useSolicitudesCompraCrearStore();

    store.agregarContextoServicio({
      id: 1,
      codigo: 'taller',
      nombre: 'Instalaciones de taller',
    });

    expect(store.observacion).toBe(OBSERVACION_PREFILL_PREFIX);
  });

  it('trunca la observacion autogenerada al maximo permitido', () => {
    const store = useSolicitudesCompraCrearStore();

    Array.from({ length: 60 }, (_, index) => index + 1).forEach((index) => {
      store.agregarEquipo({
        id: index,
        codEquipo: `EQ-${String(index).padStart(4, '0')}`,
        label: `EQ-${String(index).padStart(4, '0')} · Equipo`,
        modelo: null,
        marca: null,
        tipo: null,
      });
    });

    expect(store.observacion.length).toBe(OBSERVACION_MAX_LENGTH);
    expect(store.observacion.startsWith(OBSERVACION_PREFILL_PREFIX)).toBe(true);
  });
});
