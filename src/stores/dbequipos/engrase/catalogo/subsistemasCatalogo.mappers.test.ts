import { describe, expect, it } from "vitest";
import {
  mapCatalogoSubsistemaGuardarResponse,
  mapCatalogoSubsistemasListarResponse,
} from "./subsistemasCatalogo.mappers";

const item = {
  id: 5,
  nombre: " DIRECCIÓN ",
  activo: true,
  creado_en: "2026-08-01T10:00:00Z",
  actualizado_en: null,
  sistemas: [{ id: 1, nombre: " HIDRÁULICO ", cantidad_equipos: 4 }],
  aceites: [{ id: 2, nombre: " AW100 ", cantidad_equipos: 4 }],
  impacto: {
    total_equipos: 4,
    total_asignaciones: 4,
    tipos_equipo: [{ id: 1, nombre: " TRACTOR ", cantidad_equipos: 4 }],
  },
};

describe("mapper del catálogo de subsistemas", () => {
  it("mapea las métricas de raíces y aceites", () => {
    const result = mapCatalogoSubsistemasListarResponse({
      ok: true,
      items: [item],
      resumen: { total: 1, activos: 1, desactivados: 0 },
    });
    expect(result.items[0]).toMatchObject({
      nombre: "DIRECCIÓN",
      sistemas: [{ nombre: "HIDRÁULICO", cantidadEquipos: 4 }],
      aceites: [{ nombre: "AW100" }],
    });
  });

  it("rechaza respuestas incompletas y reutiliza el mapper al guardar", () => {
    expect(() =>
      mapCatalogoSubsistemasListarResponse({
        ok: true,
        items: [{ ...item, sistemas: undefined }],
        resumen: { total: 1, activos: 1, desactivados: 0 },
      }),
    ).toThrow(/inválida/i);
    expect(
      mapCatalogoSubsistemaGuardarResponse({
        ok: true,
        operacion: "actualizado",
        codigo: "SUBSISTEMA_ACTUALIZADO",
        mensaje: " Listo ",
        afecta_equipos: 4,
        item,
      }),
    ).toMatchObject({ mensaje: "Listo", item: { id: 5 } });
  });
});
