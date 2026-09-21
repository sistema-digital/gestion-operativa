import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mapearFilasDeJornadaAdministrativa,
  resolverCodigo,
  useJornadaAdmin,
} from "./useJornadaAdmin";
import { registroJornadaService } from "../services/registroJornada.service";
import type {
  CatalogosJornada,
  JornadaAdministrativaFila,
  JornadaFilaModel,
  JornadaState,
} from "../registroJornada.types";

vi.mock("../services/registroJornada.service", () => ({
  registroJornadaService: {
    registrarImplemento: vi.fn(),
    registrarEventosLote: vi.fn(),
  },
}));

const catalogos: CatalogosJornada = {
  labores: [
    { id: "labor-1", orden: 10, nombre: "Siembra", activo: true },
    { id: "labor-2", orden: 20, nombre: "Labor inactiva", activo: false },
    { id: "labor-3", orden: null, nombre: "Labor sin código", activo: true },
  ],
  tiposParada: [
    { id: "parada-1", orden: 10, nombre: "Pausa", activo: true },
    { id: "parada-2", orden: 30, nombre: "Abastecimiento", activo: true },
    { id: "parada-3", orden: 40, nombre: "Parada inactiva", activo: false },
  ],
  implementos: [],
  implementoTipos: [],
};

describe("resolverCodigo", () => {
  it("prioriza la labor activa cuando coincide con una parada", () => {
    expect(resolverCodigo(10, catalogos)).toEqual({
      tipoActividad: "labor",
      actividadId: "labor-1",
      actividadNombre: "Siembra",
    });
  });

  it("resuelve una parada activa cuando no existe labor activa", () => {
    expect(resolverCodigo(30, catalogos)).toEqual({
      tipoActividad: "parada",
      actividadId: "parada-2",
      actividadNombre: "Abastecimiento",
    });
  });

  it("limpia la actividad cuando el código está vacío", () => {
    expect(resolverCodigo(null, catalogos)).toEqual({
      tipoActividad: null,
      actividadId: null,
      actividadNombre: "",
    });
  });

  it("no resuelve coincidencias inactivas ni códigos desconocidos", () => {
    expect(resolverCodigo(20, catalogos)).toEqual({
      tipoActividad: null,
      actividadId: null,
      actividadNombre: "Código no reconocido",
    });
    expect(resolverCodigo(40, catalogos)).toEqual({
      tipoActividad: null,
      actividadId: null,
      actividadNombre: "Código no reconocido",
    });
    expect(resolverCodigo(3, catalogos)).toEqual({
      tipoActividad: null,
      actividadId: null,
      actividadNombre: "Código no reconocido",
    });
  });

  it("queda disponible desde el composable", () => {
    expect(useJornadaAdmin().resolverCodigo).toBe(resolverCodigo);
  });
});

describe("mapearFilasDeJornadaAdministrativa", () => {
  it("usa las filas listas para edición sin reconstruir eventos", () => {
    const filas: JornadaAdministrativaFila[] = [
      {
        numero: 1,
        inicio: "2026-09-03T11:00:00+00:00",
        fin: "2026-09-03T11:25:00+00:00",
        inicioLocal: "06:00",
        finLocal: "06:25",
        tipo: "parada",
        equipoNumero: "484090",
        labor: null,
        parada: {
          id: "parada-1",
          codigo: "100",
          nombre: "Máquina parada",
          requiereImplemento: false,
        },
        implemento: {
          id: "implemento-1",
          numero: "433001",
          nombre: "Hoja niveladora",
        },
        observacion: null,
        duracion: "00:25",
      },
      {
        numero: 2,
        inicio: "2026-09-03T11:25:00+00:00",
        fin: null,
        inicioLocal: "06:25",
        finLocal: null,
        tipo: "labor",
        equipoNumero: "484090",
        labor: {
          id: "labor-1",
          codigo: "029",
          nombre: "Construcción de canales",
        },
        parada: null,
        implemento: null,
        observacion: null,
        duracion: null,
      },
    ];

    expect(mapearFilasDeJornadaAdministrativa(filas)).toEqual([
      expect.objectContaining({
        inicio: "06:00",
        fin: "06:25",
        codigo: 100,
        tipoActividad: "parada",
        actividadId: "parada-1",
        implementoId: "implemento-1",
      }),
      expect.objectContaining({
        inicio: "06:25",
        fin: "",
        codigo: 29,
        tipoActividad: "labor",
        actividadId: "labor-1",
        implementoId: null,
      }),
    ]);
  });
});

const jornadaId = "6834e784-3695-48b7-954b-52a910047c63";
const operadorId = "ffe1197d-5235-4fc2-be33-93b4b8c109d2";

function fila(
  inicio: string,
  fin: string,
  tipoActividad: JornadaFilaModel["tipoActividad"],
  actividadId: string | null,
  implementoId: string | null = null,
): JornadaFilaModel {
  return {
    idLocal: `${inicio}-${fin}`,
    inicio,
    fin,
    codigo: 1,
    tipoActividad,
    actividadId,
    actividadNombre: "Actividad",
    implementoId,
  };
}

function crearJornada(filas: JornadaFilaModel[]): JornadaState {
  return {
    fecha: "2026-09-05",
    operadorId,
    equipoNumero: "484090",
    area: "Campo",
    observaciones: "Registro desde papel",
    filas,
  };
}

const respuestaLoteExitosa = {
  ok: true,
  rollback: false,
  jornada_id: jornadaId,
  procesados: 1,
};

describe("finalizarDesdeFilas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(registroJornadaService.registrarEventosLote).mockResolvedValue(
      respuestaLoteExitosa,
    );
  });

  it("inicia, traduce las transiciones y finaliza en orden", async () => {
    const jornada = crearJornada([
      fila("06:00", "07:00", "labor", "labor-1"),
      fila("07:00", "08:00", "labor", "labor-2"),
      fila("08:00", "09:00", "parada", "parada-1"),
      fila("09:00", "10:00", "parada", "parada-2"),
      fila("10:00", "11:00", "labor", "labor-3"),
    ]);

    await useJornadaAdmin().finalizarDesdeFilas(jornada);

    const lote = vi.mocked(registroJornadaService.registrarEventosLote).mock
      .calls[0]?.[0];
    expect(lote?.p_jornada_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(lote?.p_eventos.map((evento) => evento.tipo_evento)).toEqual([
      "inicio_jornada",
      "cambiar_labor",
      "inicio_parada",
      "cambio_causa",
      "reanudar",
      "finalizar_jornada",
    ]);
    expect(lote?.p_finalizar).toBe(true);
  });

  it("guarda el borrador sin finalizar y conserva el id para el cierre", async () => {
    const { guardarBorradorDesdeFilas, finalizarDesdeFilas } =
      useJornadaAdmin();
    const jornada = crearJornada([fila("06:00", "07:00", "labor", "labor-1")]);

    await guardarBorradorDesdeFilas(jornada);
    await finalizarDesdeFilas(jornada);

    const llamadas = vi.mocked(registroJornadaService.registrarEventosLote).mock
      .calls;
    expect(llamadas[0]?.[0].p_finalizar).toBe(false);
    expect(llamadas[0]?.[0].p_eventos.at(-1)?.tipo_evento).not.toBe(
      "finalizar_jornada",
    );
    expect(llamadas[1]?.[0].p_finalizar).toBe(true);
    expect(llamadas[1]?.[0].p_jornada_id).toBe(llamadas[0]?.[0].p_jornada_id);
  });

  it("inicia sin labor y registra la primera parada", async () => {
    await useJornadaAdmin().finalizarDesdeFilas(
      crearJornada([fila("06:00", "07:00", "parada", "parada-1")]),
    );

    const lote = vi.mocked(registroJornadaService.registrarEventosLote).mock
      .calls[0]?.[0];
    expect(lote?.p_eventos.map((evento) => evento.tipo_evento)).toEqual([
      "inicio_jornada",
      "inicio_parada",
      "finalizar_jornada",
    ]);
  });

  it("confirma el cambio de implemento y reanuda la labor", async () => {
    await useJornadaAdmin().finalizarDesdeFilas(
      crearJornada([
        fila("06:00", "07:00", "labor", "labor-1", "implemento-1"),
        fila("07:00", "08:00", "labor", "labor-1", "implemento-2"),
      ]),
    );

    const lote = vi.mocked(registroJornadaService.registrarEventosLote).mock
      .calls[0]?.[0];
    expect(lote?.p_eventos.map((evento) => evento.tipo_evento)).toEqual([
      "inicio_jornada",
      "confirmar_cambio_implemento",
      "reanudar",
      "finalizar_jornada",
    ]);
  });

  it("impide cambiar el implemento mientras la fila anterior está en parada", async () => {
    await expect(
      useJornadaAdmin().finalizarDesdeFilas(
        crearJornada([
          fila("06:00", "07:00", "labor", "labor-1", "implemento-1"),
          fila("07:00", "08:00", "parada", "parada-1", "implemento-1"),
          fila("08:00", "09:00", "labor", "labor-1", "implemento-2"),
        ]),
      ),
    ).rejects.toThrow(
      "No puedes cambiar el implemento en la fila 3 mientras la jornada está en parada.",
    );

    expect(registroJornadaService.registrarEventosLote).not.toHaveBeenCalled();
  });

  it("expone el error y libera el estado de guardado cuando falla un RPC", async () => {
    vi.mocked(registroJornadaService.registrarEventosLote).mockResolvedValue({
      ok: false,
      rollback: true,
      jornada_id: jornadaId,
      procesados: 0,
      error: {
        codigo: "P0001",
        mensaje: "LABOR_INVALIDA_O_INACTIVA",
        detalle: null,
        pista: null,
      },
      evento_fallido: {
        secuencia: 2,
        tipo_evento: "finalizar_jornada",
        client_event_id: "d370d8ee-6d73-4bfb-a12d-4d70fa9b8ebf",
        ocurrio_en: "2026-09-05T07:00:00-05:00",
      },
    });
    const { error, finalizarDesdeFilas, guardando } = useJornadaAdmin();

    await expect(
      finalizarDesdeFilas(
        crearJornada([fila("06:00", "07:00", "labor", "labor-1")]),
      ),
    ).rejects.toThrow("LABOR_INVALIDA_O_INACTIVA Evento 2: finalizar_jornada.");

    expect(error.value).toBe(
      "LABOR_INVALIDA_O_INACTIVA Evento 2: finalizar_jornada.",
    );
    expect(guardando.value).toBe(false);
  });

  it("reutiliza el id de jornada al reintentar un lote revertido", async () => {
    vi.mocked(registroJornadaService.registrarEventosLote)
      .mockResolvedValueOnce({
        ok: false,
        rollback: true,
        jornada_id: jornadaId,
        procesados: 0,
        error: {
          codigo: "P0001",
          mensaje: "LABOR_INVALIDA_O_INACTIVA",
          detalle: null,
          pista: null,
        },
      })
      .mockResolvedValueOnce(respuestaLoteExitosa);
    const { finalizarDesdeFilas } = useJornadaAdmin();
    const jornada = crearJornada([fila("06:00", "07:00", "labor", "labor-1")]);

    await expect(finalizarDesdeFilas(jornada)).rejects.toThrow(
      "LABOR_INVALIDA_O_INACTIVA",
    );
    await finalizarDesdeFilas(jornada);

    const llamadas = vi.mocked(registroJornadaService.registrarEventosLote).mock
      .calls;
    expect(llamadas[0]?.[0].p_jornada_id).toBe(llamadas[1]?.[0].p_jornada_id);
  });
});

describe("validarContinuidad", () => {
  it("rechaza filas incompletas, horarios inválidos y discontinuidades", () => {
    const { validarContinuidad } = useJornadaAdmin();

    expect(validarContinuidad([])).toEqual({
      ok: false,
      mensaje: "Agrega al menos un registro.",
    });
    expect(validarContinuidad([fila("06:00", "", "labor", "labor-1")])).toEqual(
      { ok: false, mensaje: "Completa la fila 1." },
    );
    expect(
      validarContinuidad([fila("07:00", "06:00", "labor", "labor-1")]),
    ).toEqual({
      ok: false,
      mensaje: "La hora fin de la fila 1 debe ser posterior al inicio.",
    });
    expect(
      validarContinuidad([
        fila("06:00", "07:00", "labor", "labor-1"),
        fila("08:00", "09:00", "labor", "labor-2"),
      ]),
    ).toEqual({
      ok: false,
      mensaje: "Existe un espacio o solapamiento entre las filas 1 y 2.",
    });
  });
});
