export type MaintenanceTabDefinition = {
  id: string;
  label: string;
  mobileLabel?: string;
  requiredFeature: string;
};

export const maintenanceTabDefinitions: readonly MaintenanceTabDefinition[] = [
  {
    id: "ordenes",
    label: "Ordenes De Mantenimiento",
    mobileLabel: "Orden Man.",
    requiredFeature: "module_mantenimiento",
  },
  {
    id: "servicios_generales",
    label: "Servicios Generales",
    mobileLabel: "S. Generales",
    requiredFeature: "mantenimiento.ver_servicios_generales",
  },
  {
    id: "horas_asignadas",
    label: "Horas Asignadas",
    mobileLabel: "Hrs. Asignadas",
    requiredFeature: "mantenimiento.ver_horas_asignadas",
  },
  {
    id: "definiciones_etapas",
    label: "Definiciones de Etapas",
    requiredFeature: "mantenimiento.ver_definiciones_etapas",
  },
  {
    id: "metricas",
    label: "Métricas",
    requiredFeature: "mantenimiento.ver_metricas",
  },
  {
    id: "actualizaciones",
    label: "Actualizaciones",
    requiredFeature: "mantenimiento.ver_actualizaciones",
  },
  {
    id: "indicadores",
    label: "Indicadores",
    requiredFeature: "ver_dashboard_mantenimiento",
  },
  {
    id: "productividad",
    label: "Productividad",
    requiredFeature: "ver_dashboard_productividad",
  },
  {
    id: "horas_trabajo",
    label: "Horas Trabajo",
    requiredFeature: "ver_dashboard_horas_trabajo",
  },
  {
    id: "servicios_generales_analitica",
    label: "Analítica SG",
    mobileLabel: "Analítica SG",
    requiredFeature: "ver_dashboard_servicios_generales",
  },
];

type FilterMaintenanceTabsOptions = {
  isFeatureAccessLoaded: boolean;
  hasFeatureAccess: (feature: string) => boolean;
};

export const filterMaintenanceTabs = ({
  isFeatureAccessLoaded,
  hasFeatureAccess,
}: FilterMaintenanceTabsOptions): MaintenanceTabDefinition[] =>
  isFeatureAccessLoaded
    ? maintenanceTabDefinitions.filter((tab) =>
        hasFeatureAccess(tab.requiredFeature),
      )
    : [];
