import { describe, expect, it } from "vitest";
import router from "./index";
import { SEGUIMIENTO_ADMINISTRATIVE_JORNADAS_ROUTE_FEATURES } from "@/seguimiento/shared/seguimiento.permissions";

describe("ruta de registro administrativo de jornadas", () => {
  it("resuelve la ruta canónica con sus permisos obligatorios", () => {
    const resolved = router.resolve("/seguimiento/registro-jornadas");
    const route = router
      .getRoutes()
      .find((item) => item.name === "RegistroJornadaAdministrativa");

    expect(resolved.name).toBe("RegistroJornadaAdministrativa");
    expect(route?.meta.requiredFeatures).toEqual(
      SEGUIMIENTO_ADMINISTRATIVE_JORNADAS_ROUTE_FEATURES,
    );
  });

  it("resuelve el formulario desde la acción de nueva jornada", () => {
    const resolved = router.resolve("/seguimiento/registro-jornadas/nueva");

    expect(resolved.name).toBe("RegistroJornadaAdministrativaCrear");
    expect(resolved.meta.requiredFeatures).toEqual(
      SEGUIMIENTO_ADMINISTRATIVE_JORNADAS_ROUTE_FEATURES,
    );
  });

  it("resuelve la edición de un borrador con sus permisos obligatorios", () => {
    const resolved = router.resolve(
      "/seguimiento/registro-jornadas/ea624d31-5fc4-429a-bb41-048a21cf14e8/editar",
    );

    expect(resolved.name).toBe("RegistroJornadaAdministrativaEditar");
    expect(resolved.params.jornadaId).toBe(
      "ea624d31-5fc4-429a-bb41-048a21cf14e8",
    );
    expect(resolved.meta.requiredFeatures).toEqual(
      SEGUIMIENTO_ADMINISTRATIVE_JORNADAS_ROUTE_FEATURES,
    );
  });

  it("conserva los filtros del listado en la ruta de edición", () => {
    const resolved = router.resolve({
      name: "RegistroJornadaAdministrativaEditar",
      params: { jornadaId: "ea624d31-5fc4-429a-bb41-048a21cf14e8" },
      query: {
        desde: "2026-09-14",
        hasta: "2026-09-21",
        estado: "en_edicion",
        busqueda: "Operador test",
      },
    });

    expect(resolved.query).toEqual({
      desde: "2026-09-14",
      hasta: "2026-09-21",
      estado: "en_edicion",
      busqueda: "Operador test",
    });
  });
});
