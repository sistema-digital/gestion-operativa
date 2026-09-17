export type MaintenanceTabDefinition = {
  id: string;
  label: string;
  mobileLabel?: string;
  adminOnly?: boolean;
  requiredFeature?: string;
};

export const maintenanceTabDefinitions: readonly MaintenanceTabDefinition[] = [
  {
    id: "ordenes",
    label: "Ordenes De Mantenimiento",
    mobileLabel: "Orden Man.",
  },
  {
    id: "servicios_generales",
    label: "Servicios Generales",
    mobileLabel: "S. Generales",
  },
  {
    id: "horas_asignadas",
    label: "Horas Asignadas",
    mobileLabel: "Hrs. Asignadas",
  },
  {
    id: "definiciones_etapas",
    label: "Definiciones de Etapas",
  },
  {
    id: "metricas",
    label: "Métricas",
    adminOnly: true,
  },
  {
    id: "actualizaciones",
    label: "Actualizaciones",
    adminOnly: true,
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
  area: string;
  isFeatureAccessLoaded: boolean;
  hasFeatureAccess: (feature: string) => boolean;
};

export const filterMaintenanceTabs = ({
  area,
  isFeatureAccessLoaded,
  hasFeatureAccess,
}: FilterMaintenanceTabsOptions): MaintenanceTabDefinition[] =>
  maintenanceTabDefinitions.filter((tab) => {
    if (area === "SERVICIOS GENERALES" && tab.id === "ordenes") {
      return false;
    }

    if (area !== "ALL" && tab.adminOnly) {
      return false;
    }

    return (
      !tab.requiredFeature ||
      (isFeatureAccessLoaded && hasFeatureAccess(tab.requiredFeature))
    );
  });
