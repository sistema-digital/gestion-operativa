import { beforeEach, describe, expect, it, vi } from "vitest";

const rpcMock = vi.hoisted(() => vi.fn());
const schemaMock = vi.hoisted(() => vi.fn(() => ({ rpc: rpcMock })));
const publicRpcMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase", () => ({
  supabaseEquipos: { schema: schemaMock, rpc: publicRpcMock },
}));

import { filtrosEngraseService } from "./filtrosEngrase.service";

describe("servicio de filtros de engrase", () => {
  beforeEach(() => vi.clearAllMocks());

  it("obtiene los aceites asociados mediante la RPC del equipo", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          sistema: "Motor",
          subsistema: null,
          ruta: "Motor",
          aceite: "15W-40",
        },
      ],
      error: null,
    });

    await expect(
      filtrosEngraseService.obtenerAceitesDeEquipo(123),
    ).resolves.toEqual([
      { sistema: "Motor", subsistema: null, ruta: "Motor", aceite: "15W-40" },
    ]);
    expect(rpcMock).toHaveBeenCalledWith("rpc_obtener_aceites_equipo", {
      p_equipo_id: 123,
    });
  });

  it("envía código y estado a la RPC de cambio de estado", async () => {
    rpcMock.mockResolvedValue({
      data: { ok: true, codigo: "422017", estado: "descartado" },
      error: null,
    });

    await expect(
      filtrosEngraseService.cambiarEstadoEquipo("422017", "descartado"),
    ).resolves.toBe("descartado");
    expect(rpcMock).toHaveBeenCalledWith("rpc_cambiar_estado_equipo", {
      p_codigo_equipo: "422017",
      p_estado: "descartado",
    });
  });

  it("obtiene y valida los datos generales desde la RPC pública", async () => {
    publicRpcMock.mockResolvedValue({
      data: {
        numero_equipo: "422005",
        tipo: "COMBINADA",
        marca: "CASE",
        modelo: "A7000",
        tenencia: null,
        combustible: null,
        fecha_llegada: null,
        potencia_cv: null,
        consumo_base_gal_h: null,
        etapas: ["ZAFRA"],
      },
      error: null,
    });

    await expect(
      filtrosEngraseService.obtenerDatosGeneralesEquipo("422005"),
    ).resolves.toMatchObject({
      numero_equipo: "422005",
      etapas: ["ZAFRA"],
      tenencia: null,
      potencia_cv: null,
    });
    expect(publicRpcMock).toHaveBeenCalledWith("rpc_equipo_detalle_full", {
      p_numero_equipo: "422005",
    });
  });
});
