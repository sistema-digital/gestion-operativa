import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import TrackingMapWorkspace from "./TrackingMapWorkspace.vue";
import type {
  SeguimientoMapToolState,
  SeguimientoZoneGeometry,
  TareaSeguimientoDetail,
} from "@/stores/seguimiento/tareas/tareasSeguimiento.types";

vi.mock("@/seguimiento/shared/maps/mapsProvider.loader", () => ({
  mapsProviderLoader: { load: vi.fn().mockResolvedValue(undefined) },
}));

interface MapListener {
  remove: () => void;
}

interface MapPosition {
  lat: number;
  lng: number;
}

interface PolygonOptions {
  paths: MapPosition[][];
  editable?: boolean;
}

class MockLatLng {
  constructor(
    private readonly latitude: number,
    private readonly longitude: number,
  ) {}

  lat(): number {
    return this.latitude;
  }

  lng(): number {
    return this.longitude;
  }
}

class MockPath {
  private readonly listeners = new Map<string, Array<() => void>>();

  constructor(private positions: MockLatLng[]) {}

  getArray(): MockLatLng[] {
    return this.positions;
  }

  setPositions(positions: MockLatLng[]): void {
    this.positions = positions;
  }

  addListener(event: string, callback: () => void): MapListener {
    const listeners = this.listeners.get(event) ?? [];
    listeners.push(callback);
    this.listeners.set(event, listeners);
    return { remove: () => undefined };
  }

  trigger(event: string): void {
    this.listeners.get(event)?.forEach((listener) => listener());
  }
}

class MockPaths {
  constructor(private readonly paths: MockPath[]) {}

  getArray(): MockPath[] {
    return this.paths;
  }

  forEach(callback: (path: MockPath) => void): void {
    this.paths.forEach(callback);
  }
}

class MockPolygon {
  static instances: MockPolygon[] = [];

  private readonly listeners = new Map<string, Array<() => void>>();
  private readonly paths: MockPaths;

  constructor(readonly options: PolygonOptions) {
    this.paths = new MockPaths(
      options.paths.map(
        (path) =>
          new MockPath(path.map(({ lat, lng }) => new MockLatLng(lat, lng))),
      ),
    );
    MockPolygon.instances.push(this);
  }

  getPaths(): MockPaths {
    return this.paths;
  }

  addListener(event: string, callback: () => void): MapListener {
    const listeners = this.listeners.get(event) ?? [];
    listeners.push(callback);
    this.listeners.set(event, listeners);
    return { remove: () => undefined };
  }

  trigger(event: string): void {
    this.listeners.get(event)?.forEach((listener) => listener());
  }

  setMap(): void {}
}

class MockMap {
  constructor(_element: Element, _options: object) {}

  addListener(): MapListener {
    return { remove: () => undefined };
  }

  getZoom(): number {
    return 14;
  }

  panTo(): void {}

  setCenter(): void {}

  setOptions(): void {}

  setZoom(): void {}
}

class MockPolyline {
  constructor(_options: object) {}

  setMap(): void {}
}

class MockMarker {
  constructor(_options: object) {}

  setMap(): void {}
}

class MockInfoWindow {
  close(): void {}
}

const mapTools: SeguimientoMapToolState[] = [
  { tool: "tasks", enabled: false },
  { tool: "trackers", enabled: false },
  { tool: "zones", enabled: false },
  { tool: "route", enabled: false },
];
const zoneGeometry: SeguimientoZoneGeometry = {
  type: "MultiPolygon",
  coordinates: [
    [
      [
        [-82.61, 8.4],
        [-82.6, 8.4],
        [-82.6, 8.41],
        [-82.61, 8.4],
      ],
    ],
  ],
};
const selectedTaskDetail: TareaSeguimientoDetail = {
  id: "task-1",
  version: 1,
  type: "zona",
  typeName: "Zona",
  status: "pendiente",
  areaId: "area-1",
  assignedUserId: "user-1",
  assignedUserName: "Usuario",
  locationId: null,
  scheduledDate: "2026-09-29",
  instructions: "Zona de prueba",
  priorityId: 1,
  estimatedMinutes: 30,
  trackerId: 1,
  sourceId: 1,
  trackerLabel: "Tracker 1",
  elapsedSeconds: 0,
  currentVisitSeconds: 0,
  hasOpenVisit: false,
  routePoint: null,
  routeOrder: 1,
  companionNames: [],
  controlLine: null,
  controlZones: [zoneGeometry],
  controlZoneReferences: [{ id: "zone-1", geometry: zoneGeometry }],
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
  zoneDetails: [],
  observations: [],
  route: { id: null, estado_calculo: null },
  permissions: {
    puede_editar: true,
    puede_editar_punto: false,
    puede_editar_geometria_control: true,
    puede_reordenar: false,
    geometria_bloqueada: false,
    puede_cancelar: false,
    puede_eliminar: false,
  },
  updatedAt: "2026-09-29T12:00:00Z",
};

function installGoogleMapsStub(): void {
  MockPolygon.instances = [];
  Object.defineProperty(window, "google", {
    configurable: true,
    value: {
      maps: {
        Map: MockMap,
        Marker: MockMarker,
        Polyline: MockPolyline,
        Polygon: MockPolygon,
        InfoWindow: MockInfoWindow,
        SymbolPath: { CIRCLE: "circle" },
        Size: class {
          constructor(_width: number, _height: number) {}
        },
        Point: class {
          constructor(_x: number, _y: number) {}
        },
      },
    },
  });
}

afterEach(() => {
  Object.defineProperty(window, "google", {
    configurable: true,
    value: undefined,
  });
});

describe("TrackingMapWorkspace", () => {
  it("emite la geometría final de la zona existente al soltar un vértice", async () => {
    installGoogleMapsStub();
    const wrapper = mount(TrackingMapWorkspace, {
      props: {
        tasks: [],
        trackers: [],
        selectedTaskId: "task-1",
        mapTools,
        status: "ready",
        error: null,
        focus: null,
        mapConfiguration: { latitude: 8.4, longitude: -82.61, zoom: 14 },
        geography: [],
        selectedTaskDetail,
        editingControlZoneId: "zone-1",
      },
    });
    await flushPromises();

    const polygon = MockPolygon.instances.find(
      (candidate) => candidate.options.editable,
    );
    expect(polygon).toBeDefined();
    if (!polygon) return;
    const path = polygon.getPaths().getArray()[0];
    if (!path) return;
    path.setPositions([
      new MockLatLng(8.4, -82.61),
      new MockLatLng(8.4, -82.595),
      new MockLatLng(8.41, -82.6),
      new MockLatLng(8.4, -82.61),
    ]);
    path.trigger("set_at");
    polygon.trigger("mouseup");

    expect(wrapper.emitted("update:existing-control-zone")).toEqual([
      [
        "zone-1",
        {
          type: "MultiPolygon",
          coordinates: [
            [
              [
                [-82.61, 8.4],
                [-82.595, 8.4],
                [-82.6, 8.41],
                [-82.61, 8.4],
              ],
            ],
          ],
        },
      ],
    ]);
  });
});
