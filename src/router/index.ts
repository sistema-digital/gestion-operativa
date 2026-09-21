import {
  createRouter,
  createWebHashHistory,
  type RouteLocationNormalized,
} from "vue-router";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";
import { useNavigationLoaderStore } from "@/stores/navigationLoader.store";
import { useSessionValidationStore } from "@/stores/sessionValidation.store";
import {
  SEGUIMIENTO_ADMINISTRATIVE_JORNADAS_ROUTE_FEATURES,
  SEGUIMIENTO_FEATURES,
  SEGUIMIENTO_TASK_ROUTE_FEATURES,
} from "@/seguimiento/shared/seguimiento.permissions";

const EmptyRouteComponent = { template: "<div></div>" };

type ModuleHomeRoute = {
  path: string;
  requiredFeatures?: readonly string[];
  requiredAnyFeatures?: readonly string[];
};

const moduleHomeRoutes: readonly ModuleHomeRoute[] = [
  { path: "/dashboard", requiredFeatures: ["module_dashboard"] },
  {
    path: "/calificaciones",
    requiredAnyFeatures: [
      "module_calificaciones",
      "ver_dashboard_calificaciones",
    ],
  },
  { path: "/reparaciones", requiredFeatures: ["module_reparaciones"] },
  { path: "/mantenimiento", requiredFeatures: ["module_mantenimiento"] },
  { path: "/compras", requiredFeatures: ["module_compras"] },
  { path: "/catalogo", requiredFeatures: ["module_catalog"] },
  {
    path: "/seguimiento/tareas",
    requiredFeatures: SEGUIMIENTO_TASK_ROUTE_FEATURES,
  },
  {
    path: "/seguimiento/reportes",
    requiredFeatures: [
      SEGUIMIENTO_FEATURES.module,
      SEGUIMIENTO_FEATURES.viewReports,
    ],
  },
  {
    path: "/seguimiento/registro-jornadas",
    requiredFeatures: SEGUIMIENTO_ADMINISTRATIVE_JORNADAS_ROUTE_FEATURES,
  },
  {
    path: "/engrase/filtros",
    requiredFeatures: ["module_engrase", "ver_filtros_engrase"],
  },
  { path: "/panel-admin", requiredFeatures: ["panel_admin"] },
];

const getRequiredFeatures = (to: RouteLocationNormalized): string[] => {
  const features = to.matched.flatMap((record) => {
    const requiredFeature = record.meta.requiredFeature;
    const requiredFeatures = record.meta.requiredFeatures;

    return [
      ...(typeof requiredFeature === "string" ? [requiredFeature] : []),
      ...(Array.isArray(requiredFeatures)
        ? requiredFeatures.filter(
            (feature): feature is string => typeof feature === "string",
          )
        : []),
    ];
  });

  return [...new Set(features)];
};

const getRequiredAnyFeatures = (to: RouteLocationNormalized): string[] => {
  const features = to.matched.flatMap((record) => {
    const requiredAnyFeatures = record.meta.requiredAnyFeatures;

    return Array.isArray(requiredAnyFeatures)
      ? requiredAnyFeatures.filter(
          (feature): feature is string => typeof feature === "string",
        )
      : [];
  });

  return [...new Set(features)];
};

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/login",
      name: "Login",
      component: () => import("@/views/LoginView.vue"),
    },
    {
      path: "/",
      name: "DefaultLayout",
      component: () => import("@/layouts/DefaultLayout.vue"),
      children: [
        {
          path: "",
          name: "HomeRedirect",
          component: EmptyRouteComponent,
        },
        {
          path: "dashboard",
          name: "Dashboard",
          component: () => import("@/views/DashboardView.vue"),
          meta: { requiredFeature: "module_dashboard" },
        },
        {
          path: "calificaciones",
          name: "SupervisorRatings",
          component: () => import("@/views/SupervisorRatingsView.vue"),
          meta: {
            requiredAnyFeatures: [
              "module_calificaciones",
              "ver_dashboard_calificaciones",
            ],
          },
        },
        {
          path: "reparaciones",
          name: "RepairHistory",
          component: () => import("@/views/RepairHistoryView.vue"),
          meta: { requiredFeature: "module_reparaciones" },
        },
        {
          path: "mantenimiento",
          name: "MaintenancePlan",
          component: () => import("@/views/MaintenancePlanView.vue"),
          meta: { requiredFeature: "module_mantenimiento" },
        },
        {
          path: "compras",
          name: "Compras",
          component: () => import("@/views/compras/SolicitudesCompraView.vue"),
          meta: { requiredFeature: "module_compras" },
          children: [
            {
              path: "nueva",
              name: "SolicitudCompraCrear",
              component: () =>
                import("@/views/compras/SolicitudCompraCrearView.vue"),
              meta: {
                requiredFeature: "crear_solicitud_compra",
                layout: "fullscreen",
              },
            },
          ],
        },
        {
          path: "seguimiento/tareas",
          name: "SeguimientoTareas",
          component: () =>
            import("@/views/seguimiento/SeguimientoTareasView.vue"),
          meta: { requiredFeatures: SEGUIMIENTO_TASK_ROUTE_FEATURES },
        },
        {
          path: "seguimiento/reportes",
          name: "SeguimientoReportes",
          component: () =>
            import("@/views/seguimiento/SeguimientoReportesView.vue"),
          meta: {
            requiredFeatures: [
              SEGUIMIENTO_FEATURES.module,
              SEGUIMIENTO_FEATURES.viewReports,
            ],
          },
          children: [
            {
              path: "actividad-equipo",
              name: "SeguimientoReportesActividadEquipo",
              component: () =>
                import("@/views/seguimiento/ActividadEquipoView.vue"),
              meta: { requiredFeature: "ver_dashboard_actividad_equipo" },
            },
            {
              path: "resumen-actividad-equipos",
              name: "SeguimientoReportesResumenActividadEquipos",
              component: () =>
                import("@/views/seguimiento/ResumenActividadEquiposView.vue"),
              meta: {
                requiredFeature: SEGUIMIENTO_FEATURES.viewActivityTeamsSummary,
              },
            },
          ],
        },
        {
          path: "seguimiento/registro-jornadas/nueva",
          name: "RegistroJornadaAdministrativaCrear",
          component: () =>
            import("@/views/seguimiento/RegistroJornadaAdministrativaCrearView.vue"),
          meta: {
            requiredFeatures:
              SEGUIMIENTO_ADMINISTRATIVE_JORNADAS_ROUTE_FEATURES,
            layout: "fullscreen",
          },
        },
        {
          path: "seguimiento/registro-jornadas/:jornadaId/editar",
          name: "RegistroJornadaAdministrativaEditar",
          component: () =>
            import("@/views/seguimiento/RegistroJornadaAdministrativaCrearView.vue"),
          props: true,
          meta: {
            requiredFeatures:
              SEGUIMIENTO_ADMINISTRATIVE_JORNADAS_ROUTE_FEATURES,
            layout: "fullscreen",
          },
        },
        {
          path: "seguimiento/registro-jornadas",
          name: "RegistroJornadaAdministrativa",
          component: () =>
            import("@/views/seguimiento/RegistroJornadaAdministrativaView.vue"),
          meta: {
            requiredFeatures:
              SEGUIMIENTO_ADMINISTRATIVE_JORNADAS_ROUTE_FEATURES,
          },
        },
        {
          path: "catalogo",
          name: "Catalogo",
          component: () => import("@/views/CatalogoView.vue"),
          meta: { requiredFeature: "module_catalog" },
        },
        {
          path: "engrase/catalogo",
          name: "CatalogoEngrase",
          component: () =>
            import("@/views/engrase/catalogo/CatalogoEngraseView.vue"),
          redirect: { name: "CatalogoEngraseTiposFiltro" },
          meta: {
            requiredFeatures: ["module_engrase", "ver_catalogo_engrase"],
          },
          children: [
            {
              path: "tipos-filtro",
              name: "CatalogoEngraseTiposFiltro",
              component: EmptyRouteComponent,
            },
            {
              path: "filtros",
              name: "CatalogoEngraseFiltros",
              component: EmptyRouteComponent,
            },
            {
              path: "aceites",
              name: "CatalogoEngraseAceites",
              component: EmptyRouteComponent,
            },
            {
              path: "sistemas",
              name: "CatalogoEngraseSistemas",
              component: EmptyRouteComponent,
            },
          ],
        },
        {
          path: "engrase/filtros/catalogo",
          name: "CatalogoEngraseLegacy",
          redirect: { name: "CatalogoEngraseTiposFiltro" },
          children: [
            {
              path: "tipos-filtro",
              redirect: { name: "CatalogoEngraseTiposFiltro" },
            },
            {
              path: "filtros",
              redirect: { name: "CatalogoEngraseFiltros" },
            },
            {
              path: "aceites",
              redirect: { name: "CatalogoEngraseAceites" },
            },
            {
              path: "sistemas",
              redirect: { name: "CatalogoEngraseSistemas" },
            },
          ],
        },
        {
          path: "engrase/filtros/equipos/crear",
          name: "EquipoEngraseCrear",
          component: () => import("@/views/engrase/EquipoEngraseCrearView.vue"),
          meta: {
            requiredFeatures: [
              "module_engrase",
              "ver_filtros_engrase",
              "editar_filtros_engrase",
            ],
            layout: "fullscreen",
          },
        },
        {
          path: "engrase/filtros/equipos/:codigo/editar",
          name: "EquipoEngraseEditar",
          component: () =>
            import("@/views/engrase/EquipoEngraseEditarView.vue"),
          meta: {
            requiredFeatures: [
              "module_engrase",
              "ver_filtros_engrase",
              "editar_filtros_engrase",
            ],
            layout: "fullscreen",
          },
        },
        {
          path: "engrase/filtros",
          name: "FiltrosEngrase",
          component: () => import("@/views/engrase/FiltrosEngraseView.vue"),
          meta: { requiredFeatures: ["module_engrase", "ver_filtros_engrase"] },
        },
        {
          path: "panel-admin",
          name: "PanelAdmin",
          component: () => import("@/views/PanelAdminView.vue"),
          meta: { requiredFeature: "panel_admin" },
        },
        {
          path: "perfil",
          name: "Profile",
          component: () => import("@/views/ProfileView.vue"),
          meta: { requiredFeature: "ver_datos_perfil" },
        },
      ],
    },
  ],
});

// Navigation guard for Supabase auth and feature-based module access.
router.beforeEach(async (to, from) => {
  const navigationLoaderStore = useNavigationLoaderStore();
  const sessionValidationStore = useSessionValidationStore();
  const isModuleNavigation =
    to.name !== "Login" && to.fullPath !== from.fullPath;

  if (isModuleNavigation) {
    navigationLoaderStore.start();
  }

  if (to.name === "Login") {
    sessionValidationStore.reset();
    return true;
  }

  sessionValidationStore.setPendingProtectedPath(to.fullPath);
  const sessionStatus = await sessionValidationStore.validateSession();

  if (sessionStatus === "sin_sesion") {
    sessionValidationStore.clearPendingProtectedPath();
    return { name: "Login" };
  }

  if (sessionStatus !== "autorizado") {
    return false;
  }

  const featureAccessStore = useFeatureAccessStore();

  const firstAllowedModule = moduleHomeRoutes.find((route) => {
    const hasRequiredFeatures = (route.requiredFeatures ?? []).every(
      (feature) => featureAccessStore.tieneFuncionalidad(feature),
    );
    const requiredAnyFeatures = route.requiredAnyFeatures ?? [];
    const hasAnyRequiredFeature =
      requiredAnyFeatures.length === 0 ||
      requiredAnyFeatures.some((feature) =>
        featureAccessStore.tieneFuncionalidad(feature),
      );

    return hasRequiredFeatures && hasAnyRequiredFeature;
  });

  if (to.name === "HomeRedirect") {
    return firstAllowedModule?.path ?? { name: "Profile" };
  }

  const requiredFeatures = getRequiredFeatures(to);
  const requiredAnyFeatures = getRequiredAnyFeatures(to);
  const hasAccess =
    requiredFeatures.every((feature) =>
      featureAccessStore.tieneFuncionalidad(feature),
    ) &&
    (requiredAnyFeatures.length === 0 ||
      requiredAnyFeatures.some((feature) =>
        featureAccessStore.tieneFuncionalidad(feature),
      ));

  if (!hasAccess) {
    return firstAllowedModule?.path ?? { name: "Profile" };
  }

  return true;
});

router.afterEach(() => {
  useNavigationLoaderStore().finish();
});

router.onError(() => {
  useNavigationLoaderStore().reportLoadError();
});

export default router;
