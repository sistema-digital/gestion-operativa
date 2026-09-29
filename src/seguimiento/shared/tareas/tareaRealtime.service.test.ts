import { describe, expect, it } from "vitest";
import {
  parseTareaDudaZonaRealtimeEvent,
  parseTareaObservacionRealtimeEvent,
  parseTareaPermanenciaRealtimeEvent,
} from "./tareaRealtime.service";

describe("eventos Realtime de tareas", () => {
  it("acepta el evento de permanencia de tarea documentado", () => {
    expect(
      parseTareaPermanenciaRealtimeEvent({
        tipo: "permanencia_iniciada",
        alcance: "tarea",
        tarea_id: "task-1",
        area_id: "area-1",
        tipo_tarea: "finca",
        segundos_totales: 120,
        segundos_permanencia_actual: 120,
        visita_abierta: true,
      }),
    ).toMatchObject({ alcance: "tarea", tarea_id: "task-1" });
  });

  it("rechaza una zona sin tarea para no actualizar el detalle equivocado", () => {
    expect(
      parseTareaPermanenciaRealtimeEvent({
        tipo: "zona_visita_iniciada",
        alcance: "zona",
        zona_id: "zone-1",
        tipo_tarea: "finca",
      }),
    ).toBeNull();
  });

  it("acepta observaciones únicamente cuando tienen área y tarea", () => {
    expect(
      parseTareaObservacionRealtimeEvent({
        tipo: "observacion_creada",
        observacion_id: "observation-1",
        tarea_id: "task-1",
        area_id: "area-1",
      }),
    ).toMatchObject({ tarea_id: "task-1" });
  });

  it("acepta una detección automática de duda cercana mientras está abierta", () => {
    expect(
      parseTareaDudaZonaRealtimeEvent({
        tipo: "duda_zona_cercana_detectada",
        tarea_id: "task-zona-1",
        duda_tarea_id: "task-duda-1",
        zona_id: "zone-duda-1",
        distancia_metros: 47.5,
        automatica: true,
        se_asociara_al_cerrar: true,
        requiere_revision: false,
        ocurrido_en: "2026-09-29T16:00:00Z",
      }),
    ).toMatchObject({
      tipo: "duda_zona_cercana_detectada",
      tarea_id: "task-zona-1",
    });
  });

  it("acepta la asociación automática con sus zonas de control resultantes", () => {
    expect(
      parseTareaDudaZonaRealtimeEvent({
        tipo: "duda_zona_asociada_automaticamente",
        tarea_id: "task-zona-1",
        duda_tarea_id: "task-duda-1",
        zona_id: "zone-duda-1",
        distancia_metros: 47.5,
        metodo: "automatico",
        requiere_revision: false,
        zonas_control_ids: ["zone-original-1", "zone-duda-1"],
        ocurrido_en: "2026-09-29T16:45:00Z",
      }),
    ).toMatchObject({
      tipo: "duda_zona_asociada_automaticamente",
      zonas_control_ids: ["zone-original-1", "zone-duda-1"],
    });
  });

  it("acepta una sugerencia cerrada que permite descartar", () => {
    expect(
      parseTareaDudaZonaRealtimeEvent({
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
      }),
    ).toMatchObject({
      tipo: "duda_zona_sugerida",
      puede_descartar: true,
      acciones: ["agregar", "descartar"],
    });
    expect(
      parseTareaDudaZonaRealtimeEvent({
        tipo: "duda_zona_sugerida",
        tarea_id: "task-zona-1",
        duda_tarea_id: "task-duda-1",
        zona_id: "zone-duda-1",
        distancia_metros: 185.2,
        automatica: false,
        requiere_revision: true,
        finalizada: true,
        puede_descartar: true,
        acciones: ["eliminar"],
        ocurrido_en: "2026-09-29T16:45:00Z",
      }),
    ).toBeNull();
  });

  it("acepta el aviso específico de una duda descartada", () => {
    expect(
      parseTareaDudaZonaRealtimeEvent({
        tipo: "duda_descartada",
        duda_tarea_id: "task-duda-1",
      }),
    ).toMatchObject({
      tipo: "duda_descartada",
      duda_tarea_id: "task-duda-1",
    });
  });

  it("acepta una duda ambigua sólo si existen múltiples candidatas", () => {
    expect(
      parseTareaDudaZonaRealtimeEvent({
        tipo: "duda_zona_ambigua",
        duda_tarea_id: "task-duda-1",
        zona_id: "zone-duda-1",
        candidatos: 2,
        requiere_revision: true,
        finalizada: true,
        ocurrido_en: "2026-09-29T16:45:00Z",
      }),
    ).toMatchObject({ tipo: "duda_zona_ambigua", candidatos: 2 });
  });
});
