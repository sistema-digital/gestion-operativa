import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolverCodigo, useJornadaAdmin } from "./useJornadaAdmin";
import { registroJornadaService } from "../services/registroJornada.service";
import type {
  CatalogosJornada,
  JornadaFilaModel,
  JornadaState,
} from "../registroJornada.types";

vi.mock("../services/registroJornada.service", () => ({
  registroJornadaService: {
    registrarImplemento: vi.fn(),
    iniciarJornada: vi.fn(),
    cambiarLabor: vi.fn(),
    registrarParada: vi.fn(),
    cambiarTipoParada: vi.fn(),
    reanudarTrabajo: vi.fn(),
    cambiarImplemento: vi.fn(),
    finalizarJornada: vi.fn(),
  },
}));

const catalogos: CatalogosJornada = {
  labores: [
    { id: "labor-1", orden: 10, nombre: "Siembra", activo: true },
    { id: "labor-2", orden: 20, nombre: "Labor inactiva", activo: false },
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
  });

  it("queda disponible desde el composable", () => {
    expect(useJornadaAdmin().resolverCodigo).toBe(resolverCodigo);
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

const respuestaExitosa = {
  data: {
    ok: true,
    jornada_id: jornadaId,
    estado: "trabajando" as const,
  },
  error: null,
};

describe("finalizarDesdeFilas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(registroJornadaService.iniciarJornada).mockResolvedValue(
      respuestaExitosa,
    );
    vi.mocked(registroJornadaService.cambiarLabor).mockResolvedValue(
      respuestaExitosa,
    );
    vi.mocked(registroJornadaService.registrarParada).mockResolvedValue(
      respuestaExitosa,
    );
    vi.mocked(registroJornadaService.cambiarTipoParada).mockResolvedValue(
      respuestaExitosa,
    );
    vi.mocked(registroJornadaService.reanudarTrabajo).mockResolvedValue(
      respuestaExitosa,
    );
    vi.mocked(registroJornadaService.cambiarImplemento).mockResolvedValue(
      respuestaExitosa,
    );
    vi.mocked(registroJornadaService.finalizarJornada).mockResolvedValue(
      respuestaExitosa,
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

    expect(registroJornadaService.iniciarJornada).toHaveBeenCalledWith({
      p_operador_id: operadorId,
      p_fecha_operativa: "2026-09-05",
      p_equipo_numero: "484090",
      p_labor_id: "labor-1",
      p_ocurrio_en: "2026-09-05T06:00:00-05:00",
      p_implemento_id: null,
      p_latitud: null,
      p_longitud: null,
    });
    expect(registroJornadaService.cambiarLabor).toHaveBeenCalledTimes(1);
    expect(registroJornadaService.registrarParada).toHaveBeenCalledTimes(1);
    expect(registroJornadaService.cambiarTipoParada).toHaveBeenCalledTimes(1);
    expect(registroJornadaService.reanudarTrabajo).toHaveBeenCalledWith({
      p_jornada_id: jornadaId,
      p_ocurrio_en: "2026-09-05T10:00:00-05:00",
      p_labor_id: "labor-3",
      p_latitud: null,
      p_longitud: null,
    });
    expect(registroJornadaService.finalizarJornada).toHaveBeenCalledWith({
      p_jornada_id: jornadaId,
      p_ocurrio_en: "2026-09-05T11:00:00-05:00",
      p_latitud: null,
      p_longitud: null,
    });
  });

  it("inicia sin labor y registra la primera parada", async () => {
    await useJornadaAdmin().finalizarDesdeFilas(
      crearJornada([fila("06:00", "07:00", "parada", "parada-1")]),
    );

    expect(registroJornadaService.iniciarJornada).toHaveBeenCalledWith(
      expect.objectContaining({ p_labor_id: null }),
    );
    expect(registroJornadaService.registrarParada).toHaveBeenCalledWith({
      p_jornada_id: jornadaId,
      p_tipo_parada_id: "parada-1",
      p_ocurrio_en: "2026-09-05T06:00:00-05:00",
      p_observacion: "Registro desde papel",
      p_latitud: null,
      p_longitud: null,
    });
  });

  it("confirma el cambio de implemento y reanuda la labor", async () => {
    await useJornadaAdmin().finalizarDesdeFilas(
      crearJornada([
        fila("06:00", "07:00", "labor", "labor-1", "implemento-1"),
        fila("07:00", "08:00", "labor", "labor-1", "implemento-2"),
      ]),
    );

    expect(registroJornadaService.cambiarImplemento).toHaveBeenCalledWith({
      p_jornada_id: jornadaId,
      p_ocurrio_en: "2026-09-05T07:00:00-05:00",
      p_nuevo_implemento_id: "implemento-2",
      p_labor_id: "labor-1",
      p_latitud: null,
      p_longitud: null,
    });
    expect(registroJornadaService.reanudarTrabajo).toHaveBeenCalledTimes(1);
  });

  it("expone el error y libera el estado de guardado cuando falla un RPC", async () => {
    vi.mocked(registroJornadaService.finalizarJornada).mockResolvedValue({
      data: null,
      error: new Error("No fue posible finalizar la jornada."),
    });
    const { error, finalizarDesdeFilas, guardando } = useJornadaAdmin();

    await expect(
      finalizarDesdeFilas(
        crearJornada([fila("06:00", "07:00", "labor", "labor-1")]),
      ),
    ).rejects.toThrow("No fue posible finalizar la jornada.");

    expect(error.value).toBe("No fue posible finalizar la jornada.");
    expect(guardando.value).toBe(false);
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
