# RPCs del módulo de Calificaciones

## Objetivo

Este documento describe las RPC creadas en la base de datos de **Calificaciones** para reemplazar consultas y escrituras directas sobre las tablas:

- `empleados`
- `criterios_evaluacion`
- `niveles_calificacion`
- `inspecciones`
- `inspecciones_detalle`

Las operaciones que ya eran RPC, como `rpc_puntuacion_supervisores_ot` y `rpc_omsg_incumplimientos_detalle`, **no se reemplazan**.

Las nuevas RPC están pensadas para que el frontend use este flujo:

```text
Vue / Pinia
    ↓
ratingsStore.service.ts
    ↓
supabaseRatings.rpc(...)
    ↓
RPC PostgreSQL
    ↓
tablas
```

En particular, las RPC de escritura devuelven los registros resultantes para poder actualizar Pinia sin ejecutar nuevamente una carga completa del módulo.

---

# 1. `rpc_calificaciones_snapshot`

## Propósito

Carga en una sola llamada los datos principales del módulo de calificaciones.

Reemplaza las consultas directas separadas a:

```text
empleados
criterios_evaluacion
niveles_calificacion
inspecciones
inspecciones_detalle
```

También elimina la necesidad de consultar `inspecciones_detalle` por bloques de IDs después de cargar las inspecciones.

---

## Firma SQL

```sql
public.rpc_calificaciones_snapshot(
  p_fecha_desde date default null,
  p_fecha_hasta date default null,
  p_id_supervisor bigint default null,
  p_email_empleado text default null
)
returns jsonb
```

---

## Payload de parámetros

| Parámetro | Tipo PostgreSQL | Tipo TypeScript recomendado | Requerido | Descripción |
|---|---|---|---|---|
| `p_fecha_desde` | `date` | `string \| null` | No | Fecha mínima de las inspecciones. Formato `YYYY-MM-DD`. |
| `p_fecha_hasta` | `date` | `string \| null` | No | Fecha máxima de las inspecciones. Formato `YYYY-MM-DD`. |
| `p_id_supervisor` | `bigint` | `number \| null` | No | Limita las inspecciones a un supervisor específico. |
| `p_email_empleado` | `text` | `string \| null` | No | Permite resolver al empleado activo por correo y limitar las inspecciones a ese supervisor. |

Todos los parámetros aceptan `null`.

---

## Ejemplo de llamada

```ts
const { data, error } = await supabaseRatings.rpc(
  "rpc_calificaciones_snapshot",
  {
    p_fecha_desde: "2026-09-01",
    p_fecha_hasta: "2026-10-01",
    p_id_supervisor: null,
    p_email_empleado: null,
  },
);
```

Para cargar únicamente la información de un supervisor:

```ts
const { data, error } = await supabaseRatings.rpc(
  "rpc_calificaciones_snapshot",
  {
    p_fecha_desde: "2026-09-01",
    p_fecha_hasta: "2026-10-01",
    p_id_supervisor: 12,
    p_email_empleado: null,
  },
);
```

---

## Retorno

Tipo PostgreSQL:

```text
jsonb
```

Estructura:

```ts
interface CalificacionesSnapshot {
  empleados: Empleado[];
  criterios: Criterio[];
  niveles: NivelCalificacion[];
  inspecciones: Inspeccion[];
  detalles: InspeccionDetalle[];
}
```

### `Empleado`

```ts
interface Empleado {
  id_empleado: number;
  nombre_completo: string;
  rol: string;
  email: string;
  activo: boolean;
}
```

### `Criterio`

```ts
interface Criterio {
  id_criterio: number;
  descripcion_tarea: string;
}
```

### `NivelCalificacion`

```ts
interface NivelCalificacion {
  puntuacion: number;
  etiqueta: string;
}
```

### `Inspeccion`

```ts
interface Inspeccion {
  id_inspeccion: number;
  fecha: string;
  hora: string;
  foto_url: string | null;
  observacion: string | null;
  id_supervisor: number;
  id_inspector: number;
}
```

### `InspeccionDetalle`

```ts
interface InspeccionDetalle {
  id_inspeccion: number;
  id_criterio: number;
  puntuacion: number;
  created_at: string | null;
}
```

Ejemplo de respuesta:

```json
{
  "empleados": [],
  "criterios": [],
  "niveles": [],
  "inspecciones": [],
  "detalles": []
}
```

---

## Qué reemplaza en el frontend

Antes:

```ts
supabaseRatings.from("empleados").select(...)
supabaseRatings.from("criterios_evaluacion").select(...)
supabaseRatings.from("niveles_calificacion").select(...)
supabaseRatings.from("inspecciones").select(...)
supabaseRatings.from("inspecciones_detalle").select(...)
```

Ahora:

```ts
supabaseRatings.rpc("rpc_calificaciones_snapshot", ...)
```

---

## Cómo debe usarse

Debe ser la carga principal de `ratingsStore`.

Ejemplo conceptual:

```ts
const { data, error } = await supabaseRatings.rpc(
  "rpc_calificaciones_snapshot",
  payload,
);

if (error) {
  throw error;
}

store.empleados = data.empleados;
store.inspecciones = data.inspecciones;
store.detalles = data.detalles;
```

Los catálogos `criterios` y `niveles` también pueden almacenarse en Pinia para que el formulario y el dashboard usen una sola fuente.

---

# 2. `rpc_guardar_calificacion_reunion`

## Propósito

Crear o actualizar una calificación de reunión.

El mismo RPC cubre ambos casos:

```text
p_id_inspeccion = null
        ↓
crear inspección
        ↓
crear detalle de reunión
```

o:

```text
p_id_inspeccion != null
        ↓
actualizar inspección
        ↓
insertar o actualizar detalle de reunión
```

Esto permite registrar una reunión para un supervisor que todavía no tiene una inspección diaria, por ejemplo Sonia Pazos.

---

## Firma SQL

```sql
public.rpc_guardar_calificacion_reunion(
  p_fecha date,
  p_hora time without time zone,
  p_id_supervisor bigint,
  p_id_inspector bigint,
  p_id_criterio bigint,
  p_puntuacion integer,
  p_observacion text,
  p_id_inspeccion bigint default null
)
returns jsonb
```

---

## Payload de parámetros

| Parámetro | Tipo PostgreSQL | Tipo TypeScript recomendado | Requerido | Descripción |
|---|---|---|---|---|
| `p_fecha` | `date` | `string` | Sí | Fecha de la reunión. `YYYY-MM-DD`. |
| `p_hora` | `time without time zone` | `string` | Sí | Hora de la reunión. Por ejemplo `08:30:00`. |
| `p_id_supervisor` | `bigint` | `number` | Sí | Supervisor calificado. |
| `p_id_inspector` | `bigint` | `number` | Sí | Evaluador/inspector que registra la calificación. |
| `p_id_criterio` | `bigint` | `number` | Sí | ID del criterio de reunión. Actualmente el frontend usa el criterio de reunión correspondiente. |
| `p_puntuacion` | `integer` | `number` | Sí | Puntuación válida según `niveles_calificacion`. |
| `p_observacion` | `text` | `string` | Sí | Observación completa que se guardará en la inspección. |
| `p_id_inspeccion` | `bigint` | `number \| null` | No | Si existe, actualiza esa inspección. Si es `null`, crea una nueva. |

---

## Crear una reunión nueva

```ts
const { data, error } = await supabaseRatings.rpc(
  "rpc_guardar_calificacion_reunion",
  {
    p_fecha: "2026-10-01",
    p_hora: "09:00:00",
    p_id_supervisor: 12,
    p_id_inspector: 5,
    p_id_criterio: 5,
    p_puntuacion: 5,
    p_observacion: observacion,
    p_id_inspeccion: null,
  },
);
```

Al recibir `p_id_inspeccion: null`, PostgreSQL crea primero la cabecera en `inspecciones`.

---

## Actualizar una reunión existente

```ts
const { data, error } = await supabaseRatings.rpc(
  "rpc_guardar_calificacion_reunion",
  {
    p_fecha: "2026-10-01",
    p_hora: "09:00:00",
    p_id_supervisor: 12,
    p_id_inspector: 5,
    p_id_criterio: 5,
    p_puntuacion: 3,
    p_observacion: observacion,
    p_id_inspeccion: 1790000000000,
  },
);
```

---

## Retorno

```ts
interface GuardarReunionResponse {
  inspection: Inspeccion;
  details: InspeccionDetalle[];
}
```

Ejemplo:

```json
{
  "inspection": {
    "id_inspeccion": 1790000000000,
    "fecha": "2026-10-01",
    "hora": "09:00:00",
    "foto_url": null,
    "observacion": "[[GO_REUNION]]...[[/GO_REUNION]]",
    "id_supervisor": 12,
    "id_inspector": 5
  },
  "details": [
    {
      "id_inspeccion": 1790000000000,
      "id_criterio": 5,
      "puntuacion": 5,
      "created_at": "2026-10-01T14:00:00+00:00"
    }
  ]
}
```

---

## Qué reemplaza

Reemplaza este flujo:

```text
UPDATE inspecciones
        ↓
SELECT inspecciones_detalle para comprobar si existe criterio
        ↓
UPDATE detalle
o
INSERT detalle
```

También elimina el requisito anterior del servicio que obligaba a tener una inspección base antes de registrar una reunión.

---

## Cómo debe usarse en Pinia

Después del RPC:

```ts
applyInspection(data.inspection);
replaceInspectionDetails(
  data.inspection.id_inspeccion,
  data.details,
);
```

No es necesario ejecutar:

```ts
loadData({ forceStore: true });
```

---

# 3. `rpc_guardar_calificacion_diaria`

## Propósito

Crear o actualizar una calificación diaria completa en una sola transacción.

Gestiona:

```text
inspección principal
+
detalles de criterios
+
apoyos de Servicios Generales
```

---

## Firma SQL

```sql
public.rpc_guardar_calificacion_diaria(
  p_fecha date,
  p_hora time without time zone,
  p_id_supervisor bigint,
  p_id_inspector bigint,
  p_observacion text,
  p_foto_url text,
  p_detalles jsonb,
  p_id_inspeccion bigint default null,
  p_apoyos_sg jsonb default '[]'::jsonb
)
returns jsonb
```

---

## Payload de parámetros

| Parámetro | Tipo PostgreSQL | Tipo TypeScript recomendado | Requerido | Descripción |
|---|---|---|---|---|
| `p_fecha` | `date` | `string` | Sí | Fecha de la calificación. |
| `p_hora` | `time without time zone` | `string` | Sí | Hora de la calificación. |
| `p_id_supervisor` | `bigint` | `number` | Sí | Supervisor principal. |
| `p_id_inspector` | `bigint` | `number` | Sí | Inspector/evaluador. |
| `p_observacion` | `text` | `string` | Sí | Observación general. |
| `p_foto_url` | `text` | `string \| null` | Sí | URL de la fotografía o `null`. |
| `p_detalles` | `jsonb` | `DetallePayload[]` | Sí | Criterios y puntuaciones de la inspección principal. |
| `p_id_inspeccion` | `bigint` | `number \| null` | No | ID existente al editar. `null` cuando se crea. |
| `p_apoyos_sg` | `jsonb` | `ApoyoSgPayload[]` | No | Calificaciones adicionales de Servicios Generales. |

---

## Tipo de `p_detalles`

```ts
interface DetallePayload {
  id_criterio: number;
  puntuacion: number;
}
```

Ejemplo:

```json
[
  {
    "id_criterio": 1,
    "puntuacion": 5
  },
  {
    "id_criterio": 2,
    "puntuacion": 3
  },
  {
    "id_criterio": 3,
    "puntuacion": 5
  },
  {
    "id_criterio": 4,
    "puntuacion": 5
  }
]
```

---

## Tipo de `p_apoyos_sg`

```ts
interface ApoyoSgPayload {
  id_supervisor: number;
  puntuacion: number;
  observacion?: string;
}
```

Ejemplo:

```json
[
  {
    "id_supervisor": 6,
    "puntuacion": 5,
    "observacion": "Apoyo en servicios generales"
  }
]
```

---

## Ejemplo de creación

```ts
const detalles = Object.entries(form.detalles).map(
  ([idCriterio, puntuacion]) => ({
    id_criterio: Number(idCriterio),
    puntuacion: Number(puntuacion),
  }),
);

const { data, error } = await supabaseRatings.rpc(
  "rpc_guardar_calificacion_diaria",
  {
    p_fecha: form.fecha,
    p_hora: form.hora,
    p_id_supervisor: Number(form.id_supervisor),
    p_id_inspector: Number(form.id_inspector),
    p_observacion: form.observacion,
    p_foto_url: fotoUrl ?? null,
    p_detalles: detalles,
    p_id_inspeccion: null,
    p_apoyos_sg: apoyosSg,
  },
);
```

---

## Ejemplo de actualización

La única diferencia principal es enviar `p_id_inspeccion`:

```ts
const { data, error } = await supabaseRatings.rpc(
  "rpc_guardar_calificacion_diaria",
  {
    p_fecha: form.fecha,
    p_hora: form.hora,
    p_id_supervisor: Number(form.id_supervisor),
    p_id_inspector: Number(form.id_inspector),
    p_observacion: form.observacion,
    p_foto_url: fotoUrl ?? null,
    p_detalles: detalles,
    p_id_inspeccion: editingId,
    p_apoyos_sg: apoyosSg,
  },
);
```

---

## Retorno

```ts
interface GuardarCalificacionDiariaResponse {
  inspection: Inspeccion;
  details: InspeccionDetalle[];

  affected_inspections: Inspeccion[];
  affected_details: InspeccionDetalle[];
}
```

Ejemplo:

```json
{
  "inspection": {
    "id_inspeccion": 1790000000000,
    "fecha": "2026-10-01",
    "hora": "10:30:00",
    "foto_url": null,
    "observacion": "",
    "id_supervisor": 1,
    "id_inspector": 5
  },
  "details": [
    {
      "id_inspeccion": 1790000000000,
      "id_criterio": 1,
      "puntuacion": 5,
      "created_at": "2026-10-01T15:30:00+00:00"
    }
  ],
  "affected_inspections": [],
  "affected_details": []
}
```

### Diferencia entre los campos

`inspection` y `details`:

```text
solo representan la inspección principal
```

`affected_inspections` y `affected_details`:

```text
representan todos los registros afectados por la operación,
incluyendo la inspección principal y los posibles apoyos SG
```

Para sincronizar Pinia, es preferible usar:

```text
affected_inspections
affected_details
```

porque cubren todos los cambios realizados por la transacción.

---

## Qué reemplaza

Reemplaza:

```text
INSERT inspecciones
INSERT inspecciones_detalle
UPDATE inspecciones
UPDATE individual por cada criterio
INSERT de criterios nuevos
búsqueda y actualización de inspecciones SG
recarga completa posterior
```

Todo queda dentro de una única operación PostgreSQL.

---

## Cómo debe usarse en Pinia

Ejemplo conceptual:

```ts
for (const inspection of data.affected_inspections) {
  applyInspection(inspection);
}

applyAffectedDetails(data.affected_details);
```

El store debe sustituir los detalles de las inspecciones afectadas, no agregar duplicados sin comprobar `(id_inspeccion, id_criterio)`.

---

# 4. `rpc_eliminar_calificacion`

## Propósito

Centralizar la eliminación de:

- una inspección completa;
- un criterio específico;
- una reunión;
- una inspección que quede vacía después de eliminar su último criterio.

---

## Firma SQL

```sql
public.rpc_eliminar_calificacion(
  p_id_inspeccion bigint,
  p_id_criterio bigint default null,
  p_observacion_actualizada text default null
)
returns jsonb
```

---

## Payload de parámetros

| Parámetro | Tipo PostgreSQL | Tipo TypeScript recomendado | Requerido | Descripción |
|---|---|---|---|---|
| `p_id_inspeccion` | `bigint` | `number` | Sí | Inspección que se va a modificar/eliminar. |
| `p_id_criterio` | `bigint` | `number \| null` | No | Si es `null`, elimina toda la inspección. Si tiene ID, elimina solamente ese criterio. |
| `p_observacion_actualizada` | `text` | `string \| null` | No | Observación que debe permanecer después de eliminar un criterio, por ejemplo después de retirar el bloque de reunión. |

---

## Eliminar inspección completa

```ts
const { data, error } = await supabaseRatings.rpc(
  "rpc_eliminar_calificacion",
  {
    p_id_inspeccion: inspectionId,
    p_id_criterio: null,
    p_observacion_actualizada: null,
  },
);
```

Como `inspecciones_detalle.id_inspeccion` tiene `ON DELETE CASCADE`, no es necesario eliminar primero los detalles.

---

## Eliminar solamente una reunión

```ts
const { data, error } = await supabaseRatings.rpc(
  "rpc_eliminar_calificacion",
  {
    p_id_inspeccion: inspectionId,
    p_id_criterio: 5,
    p_observacion_actualizada: observacionSinReunion,
  },
);
```

La RPC elimina únicamente el detalle indicado.

Después comprueba:

```text
¿quedan detalles en la inspección?
        │
        ├── Sí
        │    ↓
        │  mantiene inspección
        │
        └── No
             ↓
           elimina también la cabecera
```

Esto evita dejar una `inspecciones` vacía cuando, por ejemplo, el único detalle era la reunión.

---

## Retorno

```ts
interface EliminarCalificacionResponse {
  ok: boolean;

  deleted_inspection_ids: number[];

  inspection: Inspeccion | null;

  details: InspeccionDetalle[];
}
```

---

## Caso A: se eliminó toda la inspección

```json
{
  "ok": true,
  "deleted_inspection_ids": [
    1790000000000
  ],
  "inspection": null,
  "details": []
}
```

El frontend debe eliminarla del store:

```ts
for (const id of data.deleted_inspection_ids) {
  removeInspection(id);
}
```

---

## Caso B: solamente se eliminó un criterio

```json
{
  "ok": true,
  "deleted_inspection_ids": [],
  "inspection": {
    "id_inspeccion": 1790000000000,
    "fecha": "2026-10-01",
    "hora": "09:00:00",
    "foto_url": null,
    "observacion": "",
    "id_supervisor": 1,
    "id_inspector": 5
  },
  "details": [
    {
      "id_inspeccion": 1790000000000,
      "id_criterio": 1,
      "puntuacion": 5,
      "created_at": "2026-10-01T14:00:00+00:00"
    }
  ]
}
```

En este caso el frontend debe mantener la inspección y sustituir sus detalles.

---

## Qué reemplaza

Reemplaza:

```text
SELECT observacion
procesamiento frontend
DELETE inspecciones_detalle
DELETE inspecciones
UPDATE inspecciones
recarga completa
```

El procesamiento necesario para construir `p_observacion_actualizada` puede seguir realizándose en el frontend, especialmente mientras las observaciones de reunión sigan almacenándose mediante marcadores en `inspecciones.observacion`.

---

# Resumen de las RPC

| RPC | Lectura | Crear | Actualizar | Eliminar | Retorno |
|---|---:|---:|---:|---:|---|
| `rpc_calificaciones_snapshot` | Sí | No | No | No | Catálogos + inspecciones + detalles |
| `rpc_guardar_calificacion_reunion` | No | Sí | Sí | No | `inspection`, `details` |
| `rpc_guardar_calificacion_diaria` | No | Sí | Sí | No | `inspection`, `details`, `affected_inspections`, `affected_details` |
| `rpc_eliminar_calificacion` | No | No | Sí | Sí | Estado final de la inspección/eliminación |

---

# Estrategia recomendada en `ratingsStore.service.ts`

## Lectura

```ts
async fetchSnapshot(params) {
  const { data, error } = await supabaseRatings.rpc(
    "rpc_calificaciones_snapshot",
    params,
  );

  if (error) throw error;

  return data;
}
```

---

## Guardar diaria

```ts
async saveDaily(payload) {
  const { data, error } = await supabaseRatings.rpc(
    "rpc_guardar_calificacion_diaria",
    payload,
  );

  if (error) throw error;

  return data;
}
```

---

## Guardar reunión

```ts
async saveMeeting(payload) {
  const { data, error } = await supabaseRatings.rpc(
    "rpc_guardar_calificacion_reunion",
    payload,
  );

  if (error) throw error;

  return data;
}
```

---

## Eliminar

```ts
async deleteRating(payload) {
  const { data, error } = await supabaseRatings.rpc(
    "rpc_eliminar_calificacion",
    payload,
  );

  if (error) throw error;

  return data;
}
```

---

# Actualización de Pinia

La intención de los retornos de escritura es evitar:

```ts
await loadData({ forceStore: true });
```

después de cada operación.

El flujo recomendado es:

```text
RPC
 ↓
respuesta JSON
 ↓
validación
 ↓
upsert local en Pinia
 ↓
la UI se actualiza mediante computed
```

Ejemplo:

```ts
const result = await ratingsService.saveMeeting(payload);

applyInspection(result.inspection);
replaceInspectionDetails(
  result.inspection.id_inspeccion,
  result.details,
);
```

Para una calificación diaria:

```ts
const result = await ratingsService.saveDaily(payload);

for (const inspection of result.affected_inspections) {
  applyInspection(inspection);
}

applyAffectedDetails(result.affected_details);
```

Para eliminar:

```ts
const result = await ratingsService.deleteRating(payload);

for (const id of result.deleted_inspection_ids) {
  removeInspection(id);
}

if (result.inspection) {
  applyInspection(result.inspection);
  replaceInspectionDetails(
    result.inspection.id_inspeccion,
    result.details,
  );
}
```

---

# Consideraciones

## 1. No mezclar proyectos Supabase

Estas RPC pertenecen a la base de **Calificaciones**.

No deben intentar consultar directamente tablas del otro proyecto, como:

```text
PROFILE
ORDEN_TRABAJO
MECANICOS
```

Las RPC de ese proyecto deben mantenerse separadas.

---

## 2. Seguridad

Las RPC fueron creadas como:

```sql
SECURITY INVOKER
```

y con ejecución para:

```text
authenticated
```

Por lo tanto, respetan las políticas RLS de las tablas subyacentes.

---

## 3. Identidad de una puntuación

En `inspecciones_detalle`, una puntuación se identifica mediante:

```text
(id_inspeccion, id_criterio)
```

Por ello, el store debe hacer upsert usando esa combinación y no asumir un campo `id` independiente.

---

## 4. Reunión sin inspección diaria

`rpc_guardar_calificacion_reunion` permite:

```ts
p_id_inspeccion: null
```

Esto crea una inspección cuyo único detalle puede ser el criterio de reunión.

No es necesario crear calificaciones para los demás criterios.

---

## 5. Eliminación de una reunión única

Si se elimina el criterio de reunión y la inspección ya no tiene otros detalles:

```text
rpc_eliminar_calificacion
```

elimina también la cabecera de `inspecciones`.

De esta manera no quedan inspecciones vacías.

---

# Flujo final esperado

```text
                     ┌──────────────────────────────┐
                     │ rpc_calificaciones_snapshot │
                     └──────────────┬───────────────┘
                                    │
                                    ▼
                              ratingsStore
                                    │
                     ┌──────────────┼───────────────┐
                     ▼              ▼               ▼
                  Dashboard      Formulario       Reuniones


Crear / editar diaria
        │
        ▼
rpc_guardar_calificacion_diaria
        │
        ▼
affected_inspections
affected_details
        │
        ▼
actualizar Pinia


Crear / editar reunión
        │
        ▼
rpc_guardar_calificacion_reunion
        │
        ▼
inspection
details
        │
        ▼
actualizar Pinia


Eliminar
        │
        ▼
rpc_eliminar_calificacion
        │
        ├── deleted_inspection_ids
        ├── inspection
        └── details
                │
                ▼
          actualizar Pinia
```
