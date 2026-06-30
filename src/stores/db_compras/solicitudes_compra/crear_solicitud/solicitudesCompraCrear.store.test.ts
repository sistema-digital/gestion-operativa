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
const createFile = (
  name: string,
  type: string,
  sizeInBytes = 1024,
  lastModified = 1719705600000
) => new File([new Uint8Array(sizeInBytes)], name, {
  type,
  lastModified,
});

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
        descripcion: 'SERVICIO DE TORNO',
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

  it('exige motivo de urgencia para avanzar en el paso 3 cuando aplica', () => {
    const store = useSolicitudesCompraCrearStore();

    store.currentStep = 3;
    store.setObservacion('Solicitud con contexto suficiente.');
    store.setSolicitarUrgente(true);
    store.setMotivoUrgencia('   ');

    expect(store.validateStep(3)).toBe(false);
    expect(store.validationErrors.motivoUrgencia).toBe('Debe indicar el motivo de urgencia para continuar.');
  });

  it('agrega adjuntos validos y reporta invalidos o duplicados', () => {
    const store = useSolicitudesCompraCrearStore();
    const validImage = createFile('foto.jpg', 'image/jpeg');
    const duplicateImage = createFile('foto.jpg', 'image/jpeg');
    const invalidZip = createFile('archivo.zip', 'application/zip');

    store.agregarAdjuntos([
      { file: validImage, displayName: 'factura_carro.jpg' },
      { file: duplicateImage, displayName: 'factura_carro_2.jpg' },
      { file: invalidZip, displayName: 'archivo.zip' },
    ]);

    expect(store.adjuntosLocales).toHaveLength(1);
    expect(store.adjuntosLocales[0]?.file.name).toBe('foto.jpg');
    expect(store.adjuntosLocales[0]?.displayName).toBe('factura_carro.jpg');
    expect(store.adjuntosErroresRecientes).toHaveLength(2);
    expect(store.adjuntosErroresRecientes[0]?.message).toBe('Archivo repetido');
    expect(store.adjuntosErroresRecientes[1]?.message).toBe('Archivo no valido');
    expect(store.validationErrors.adjuntos).toBe('Archivo repetido');
  });

  it('limita la carga local a 5 adjuntos', () => {
    const store = useSolicitudesCompraCrearStore();
    const items = Array.from({ length: 6 }, (_, index) => ({
      file: createFile(`archivo-${index + 1}.pdf`, 'application/pdf', 1024, 1719705600000 + index),
      displayName: `archivo_${index + 1}.pdf`,
    }));

    store.agregarAdjuntos(items);

    expect(store.adjuntosLocales).toHaveLength(5);
    expect(store.adjuntosErroresRecientes.at(-1)?.message).toBe('Maximo 5 archivos');
    expect(store.validationErrors.adjuntos).toBe('Maximo 5 archivos');
  });

  it('no sube adjuntos al guardar borrador', async () => {
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
    store.agregarProductoTemporal({
      descripcion: 'Aceite hidraulico',
      unidadCodigo: 'gal',
      unidadLabel: 'Gal',
    });
    store.setObservacion('Solicitud para mantenimiento preventivo.');
    store.agregarAdjuntos([{ file: createFile('manual.pdf', 'application/pdf'), displayName: 'manual.pdf' }]);

    mockedService.crearSolicitud.mockResolvedValue({
      solicitud_id: 'sol-1',
      folio_sol: null,
      tipo_codigo: 'zafra',
      estado_codigo: 'borrador',
      prioridad_codigo: 'normal',
      ciclo_estado: 1,
      productos_total: 1,
      servicios_total: 0,
      equipos_total: 1,
      adjuntos_total: 0,
      peticion_urgente_creada: false,
      urgente_ignorado_por_borrador: true,
    });

    await store.submit('draft');

    expect(mockedService.prepararUploadSession).not.toHaveBeenCalled();
    expect(mockedService.subirAdjuntos).not.toHaveBeenCalled();
    expect(mockedService.crearSolicitud).toHaveBeenCalledWith(expect.objectContaining({
      p_adjuntos: [],
      p_requerir_adjuntos_storage: false,
    }));
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
        descripcion: 'SERVICIO EDITADO',
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
        descripcion: 'PRODUCTO TEMPORAL EDITADO',
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
