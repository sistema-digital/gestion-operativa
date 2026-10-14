export const PANEL_ADMIN_FEATURES = {
  module: "panel_admin",
  viewMaintenancePlan: "panel_admin.ver_plan_mantenimiento",
  viewWorkHours: "panel_admin.ver_horas_trabajo",
  editWorkHours: "panel_admin.editar_horas_trabajo",
  deleteWorkHours: "panel_admin.eliminar_horas_trabajo",
} as const;

export const PANEL_ADMIN_MAINTENANCE_PLAN_ROUTE_FEATURES = [
  PANEL_ADMIN_FEATURES.module,
  PANEL_ADMIN_FEATURES.viewMaintenancePlan,
] as const;

export const PANEL_ADMIN_WORK_HOURS_ROUTE_FEATURES = [
  ...PANEL_ADMIN_MAINTENANCE_PLAN_ROUTE_FEATURES,
  PANEL_ADMIN_FEATURES.viewWorkHours,
] as const;

export type PanelAdminFeature =
  (typeof PANEL_ADMIN_FEATURES)[keyof typeof PANEL_ADMIN_FEATURES];
