import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import TaskCard from "./TaskCard.vue";
import TaskDetailPanel from "./TaskDetailPanel.vue";
import TaskListPanel from "./TaskListPanel.vue";
import TaskControlZoneEditor from "./TaskDetailSections/TaskControlZoneEditor.vue";
import TaskDudaZoneSuggestion from "./TaskDetailSections/TaskDudaZoneSuggestion.vue";
import TaskZoneDetailCard from "./TaskDetailSections/TaskZoneDetailCard.vue";
import type { TareaDudaZonaRealtimeEvent } from "@/seguimiento/shared/tareas/tareaRealtime.service";
import type {
  TareaSeguimientoDetail,
  TareaSeguimientoListItem,
  TareaRastreoZonaDetalleDto,
} from "@/stores/seguimiento/tareas/tareasSeguimiento.types";

const task = (
  overrides: Partial<TareaSeguimientoListItem> = {},
): TareaSeguimientoListItem => ({
  id: "task-1",
  type: "finca",
  typeName: "Finca",
  status: "pendiente",
  areaId: "area-1",
  assignedUserId: null,
  assignedUserName: null,
  locationId: null,
  scheduledDate: "2026-08-29",
  instructions: "Revisar lote norte",
  priorityId: null,
  estimatedMinutes: 30,
  trackerId: null,
  sourceId: null,
  trackerLabel: null,
  elapsedSeconds: 0,
  currentVisitSeconds: 0,
  hasOpenVisit: false,
  routePoint: null,
  routeOrder: null,
  ...overrides,
});

const controlZoneDetail = (id: string): TareaRastreoZonaDetalleDto => ({
  id,
  rol: "control",
  tipo_zona: "control",
  origen: "tarea_supervisor",
  tiempo: {
    cantidad_visitas: 0,
    segundos_visitas_cerradas: 0,
    segundos_visita_abierta: 0,
    segundos_totales: 0,
    visita_abierta: false,
    visita_actual_id: null,
    llegada_actual_en: null,
    primera_llegada_en: null,
    ultima_salida_en: null,
    ultima_actualizacion_tracker_en: null,
    segundos_sin_datos: 0,
  },
  visitas: [],
});

const taskDetail = (
  overrides: Partial<TareaSeguimientoDetail> = {},
): TareaSeguimientoDetail => ({
  ...task(),
  version: 1,
  companionNames: [],
  controlLine: null,
  controlZones: [
    {
      type: "MultiPolygon",
      coordinates: [[[[-82.59, 8.39]]]],
    },
  ],
  controlZoneReferences: [
    {
      id: "zone-1",
      geometry: {
        type: "MultiPolygon",
        coordinates: [[[[-82.59, 8.39]]]],
      },
    },
  ],
  visualLocation: null,
  permanenceZones: [],
  administrativeStatusLabel: "Pendiente",
  operationalStatusLabel: "Sin iniciar",
  priorityLabel: "Normal",
  time: {
    cantidad_visitas: 0,
    segundos_totales: 0,
    segundos_visita_abierta: 0,
    segundos_sin_datos: 0,
    visita_abierta: false,
    llegada_actual_en: null,
    primera_llegada_en: null,
    ultima_salida_en: null,
  },
  visits: [],
  zoneDetails: [controlZoneDetail("zone-1")],
  observations: [],
  route: { id: null, estado_calculo: null },
  permissions: {
    puede_editar: true,
    puede_editar_punto: true,
    puede_editar_geometria_control: true,
    puede_reordenar: true,
    geometria_bloqueada: false,
    puede_cancelar: true,
    puede_eliminar: true,
  },
  updatedAt: "2026-09-29T12:00:00Z",
  ...overrides,
});

describe("paneles de seguimiento de tareas", () => {
  it("emite la decisión de reutilizar una zona sugerida sin duplicar geometría", async () => {
    const suggestion: Extract<
      TareaDudaZonaRealtimeEvent,
      { tipo: "duda_zona_sugerida" }
    > = {
      tipo: "duda_zona_sugerida",
      tarea_id: "task-zona-1",
      duda_tarea_id: "task-duda-1",
      zona_id: "zone-duda-1",
      distancia_metros: 185.2,
      automatica: false,
      requiere_revision: true,
      finalizada: true,
      puede_descartar: true,
      acciones: ["agregar", "descartar"],
      ocurrido_en: "2026-09-29T16:45:00Z",
    };
    const wrapper = mount(TaskDudaZoneSuggestion, {
      props: { suggestion, submitting: false },
    });

    expect(wrapper.text()).toContain("185 m");
    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("accept")).toEqual([[suggestion]]);
    await wrapper.findAll("button")[1]?.trigger("click");
    expect(wrapper.emitted("discard")).toEqual([[suggestion]]);
  });

  it("diferencia una duda y comunica la selección de la card", async () => {
    const wrapper = mount(TaskCard, {
      props: {
        task: task({
          type: "duda",
          typeName: "Duda automática",
          status: "duda_detectada",
        }),
        selected: false,
      },
    });
    expect(wrapper.text()).toContain("Duda automática");
    expect(wrapper.text()).toContain("Detectada automáticamente");
    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("select")).toEqual([["task-1"]]);
  });

  it("muestra el nombre del tipo entregado por el RPC", () => {
    const wrapper = mount(TaskCard, {
      props: {
        task: task({ type: "zona", typeName: "Zona de mantenimiento" }),
        selected: false,
      },
    });

    expect(wrapper.text()).toContain("Zona de mantenimiento");
  });

  it("muestra el nombre del trabajador asignado", () => {
    const wrapper = mount(TaskCard, {
      props: {
        task: task({
          assignedUserId: "user-1",
          assignedUserName: "Pedro Hurtado",
        }),
        selected: false,
      },
    });

    expect(wrapper.text()).toContain("Pedro Hurtado");
  });

  it("muestra hh:mm y agrega segundos solo mientras la permanencia cuenta", () => {
    const countingCard = mount(TaskCard, {
      props: {
        task: task({ status: "activa", currentVisitSeconds: 59 }),
        selected: false,
        livePermanence: { seconds: 59, startedAt: 0 },
        liveNow: 0,
      },
    });
    expect(countingCard.text()).toContain("00:00:59");
    expect(countingCard.text()).toContain("Contando");

    const elapsedCard = mount(TaskCard, {
      props: {
        task: task({ elapsedSeconds: 3_660 }),
        selected: false,
      },
    });
    expect(elapsedCard.text()).toContain("01:01");
  });

  it("distingue vacío estructural de resultados filtrados y permite limpiar", async () => {
    const wrapper = mount(TaskListPanel, {
      props: {
        tasks: [],
        selectedTaskId: null,
        loading: false,
        error: null,
        search: "",
        hasActiveFilters: true,
      },
    });
    expect(wrapper.text()).toContain("No hay coincidencias");
    expect(wrapper.text()).toContain("Restablecer filtros");
    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("clearFilters")).toHaveLength(1);
    await wrapper.setProps({ hasActiveFilters: false });
    expect(wrapper.text()).toContain("No hay tareas para este contexto");
  });

  it("ofrece recuperación independiente cuando falla el detalle", async () => {
    const wrapper = mount(TaskDetailPanel, {
      props: {
        task: null,
        loading: false,
        error: "No se pudo cargar el detalle.",
      },
    });
    expect(wrapper.text()).toContain("No se pudo cargar el detalle.");
    await wrapper.findAll("button").at(-1)!.trigger("click");
    expect(wrapper.emitted("retry")).toHaveLength(1);
  });

  it("expone el editor de zona sólo con permiso de editar geometría", async () => {
    const wrapper = mount(TaskDetailPanel, {
      props: {
        task: taskDetail(),
        loading: false,
        error: null,
      },
    });

    await wrapper
      .get("button[aria-label='Reemplazar zona de control 1']")
      .trigger("click");
    expect(wrapper.emitted("beginControlZoneEdit")).toEqual([["zone-1"]]);

    await wrapper.setProps({ editingControlZoneId: "zone-1" });
    expect(wrapper.text()).toContain("Reemplazar zona");
    await wrapper
      .get("button[aria-label='Cancelar edición de zona']")
      .trigger("click");
    expect(wrapper.emitted("cancelControlZoneEdit")).toHaveLength(1);

    await wrapper.setProps({
      task: taskDetail({
        permissions: {
          ...taskDetail().permissions,
          puede_editar_geometria_control: false,
        },
      }),
    });
    expect(
      wrapper
        .find("button[aria-label='Reemplazar zona de control 1']")
        .exists(),
    ).toBe(false);
  });

  it("permite editar una geometría sin visitas y bloquea la que tiene historial", async () => {
    const editableZone = {
      ...controlZoneDetail("zone-1"),
      tiempo: {
        ...controlZoneDetail("zone-1").tiempo,
        cantidad_visitas: 0,
      },
      visitas: [],
    };
    const editableWrapper = mount(TaskZoneDetailCard, {
      props: {
        index: 0,
        zone: editableZone,
        editable: true,
        submitting: false,
      },
    });

    await editableWrapper
      .get("button[aria-label='Editar geometría de la zona de control 1']")
      .trigger("click");
    expect(editableWrapper.emitted("editGeometry")).toEqual([["zone-1"]]);

    const historicalWrapper = mount(TaskZoneDetailCard, {
      props: {
        index: 0,
        zone: {
          ...controlZoneDetail("zone-1"),
          tiempo: {
            ...controlZoneDetail("zone-1").tiempo,
            cantidad_visitas: 1,
          },
        },
        editable: true,
        submitting: false,
      },
    });
    const editButton = historicalWrapper.get(
      "button[aria-label='Editar geometría de la zona de control 1']",
    );
    expect(editButton.attributes("disabled")).toBeDefined();
    await editButton.trigger("click");
    expect(historicalWrapper.emitted("editGeometry")).toBeUndefined();
  });

  it("confirma un retiro mediante una operación explícita", async () => {
    const wrapper = mount(TaskControlZoneEditor, {
      props: {
        mode: "remove",
        zone: taskDetail().controlZoneReferences[0]!,
        zoneDetail: controlZoneDetail("zone-1"),
        replacementZones: taskDetail().controlZoneReferences,
        controlZoneCount: 2,
        submitting: false,
      },
    });

    expect(wrapper.text()).toContain("evidencia histórica");
    await wrapper
      .get("button[aria-label='Confirmar retiro de zona']")
      .trigger("click");
    expect(wrapper.emitted("submit")).toEqual([
      [[{ accion: "quitar", id: "zone-1" }]],
    ]);
  });

  it("muestra el resumen y despliega el detalle de una zona asociada", async () => {
    const wrapper = mount(TaskZoneDetailCard, {
      props: {
        index: 0,
        zone: {
          id: "zone-1",
          rol: "control",
          tipo_zona: "control",
          origen: "tarea_supervisor",
          tiempo: {
            cantidad_visitas: 1,
            segundos_visitas_cerradas: 600,
            segundos_visita_abierta: 300,
            segundos_totales: 900,
            visita_abierta: true,
            visita_actual_id: "visit-2",
            llegada_actual_en: "2026-08-29T12:20:00Z",
            primera_llegada_en: "2026-08-29T12:00:00Z",
            ultima_salida_en: "2026-08-29T12:10:00Z",
            ultima_actualizacion_tracker_en: "2026-08-29T12:25:00Z",
            segundos_sin_datos: 0,
          },
          visitas: [
            {
              id: "visit-1",
              entrada_en: "2026-08-29T12:00:00Z",
              salida_en: "2026-08-29T12:10:00Z",
            },
          ],
        },
      },
    });

    expect(wrapper.text()).toContain("Zona asociada 1");
    expect(wrapper.text()).toContain("00:15");
    await wrapper.get("details").trigger("toggle");
    expect(wrapper.text()).toContain("Historial de la zona");
    expect(wrapper.text()).toContain("Visita 1");
  });
});
