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
});
