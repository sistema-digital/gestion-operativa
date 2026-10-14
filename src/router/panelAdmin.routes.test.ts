import { describe, expect, it } from "vitest";
import router from "./index";
import {
  PANEL_ADMIN_FEATURES,
  PANEL_ADMIN_MAINTENANCE_PLAN_ROUTE_FEATURES,
  PANEL_ADMIN_WORK_HOURS_ROUTE_FEATURES,
} from "@/constants/panelAdminPermissions";

describe("rutas del panel administrativo", () => {
  it("resuelve Horas de trabajo con la jerarquía completa de permisos", () => {
    const resolved = router.resolve(
      "/panel-admin/plan-mantenimiento/horas-trabajo",
    );

    expect(resolved.name).toBe("PanelAdminWorkHours");
    expect(resolved.meta.requiredFeatures).toEqual(
      PANEL_ADMIN_WORK_HOURS_ROUTE_FEATURES,
    );
    expect(resolved.matched[1]?.meta.requiredFeature).toBe(
      PANEL_ADMIN_FEATURES.module,
    );
    expect(resolved.matched[2]?.meta.requiredFeatures).toEqual(
      PANEL_ADMIN_MAINTENANCE_PLAN_ROUTE_FEATURES,
    );
  });

  it("mantiene el Panel Admin como módulo padre y Plan de mantenimiento como subruta", () => {
    const panelAdminRoute = router
      .getRoutes()
      .find((route) => route.name === "PanelAdmin");
    const maintenancePlanRoute = router
      .getRoutes()
      .find((route) => route.name === "PanelAdminMaintenancePlan");

    expect(panelAdminRoute?.path).toBe("/panel-admin");
    expect(panelAdminRoute?.meta.requiredFeature).toBe(
      PANEL_ADMIN_FEATURES.module,
    );
    expect(maintenancePlanRoute?.path).toBe("/panel-admin/plan-mantenimiento");
    expect(maintenancePlanRoute?.meta.requiredFeatures).toEqual(
      PANEL_ADMIN_MAINTENANCE_PLAN_ROUTE_FEATURES,
    );
  });
});
