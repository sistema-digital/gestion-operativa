# Estrategia V2: tareas zona con múltiples zonas, asociación de dudas y tiempo por zona

**Proyecto:** `rastreo_tareas`  
**Fecha de documentación:** 2026-09-29  
**Objetivo:** documentar el estado actual de la lógica de base de datos para tareas tipo `zona`, asociación de `duda_automatica`, edición segura de zonas de control, cálculo de tiempo por zona y notificaciones Realtime hacia la UI.

---

## 1. Resumen ejecutivo

La estrategia V2 quedó ajustada para resolver un problema operativo concreto: una tarea tipo `zona` se crea inicialmente con una zona dibujada por el supervisor, pero el equipo puede detenerse y trabajar cerca de esa zona sin entrar exactamente en el polígono. En ese caso el sistema puede generar una `duda_automatica`. Esa duda puede representar en realidad la ejecución de la tarea zona planificada.

La estrategia actual separa claramente **creación**, **ejecución**, **asociación** y **edición**:

1. `crear_tarea_v2` mantiene la regla de que una tarea tipo `zona` se crea con **exactamente una zona inicial**.
2. Después de creada, una tarea tipo `zona` puede tener **una o más zonas de control**.
3. Si se genera una duda cerca de una tarea zona del mismo equipo, fecha y área:
   - `<= 100 m` y existe un único candidato: asociación automática al cerrar la duda.
   - `> 100 m y <= 300 m`: sugerencia para la UI; requiere decisión del usuario.
   - `> 300 m`: no se relaciona.
   - si hay más de un candidato dentro del rango de análisis, no se asocia automáticamente.
4. La zona creada por la duda se **reutiliza** como zona de control de la tarea real; no se crea otra geometría idéntica.
5. Al asociarse, se elimina la relación visual `duda -> permanencia`, pero **no se eliminan ni copian las visitas históricas**.
6. `visitas_zona_tarea_tracker` es la fuente de detalle para saber cuánto tiempo hubo en cada zona.
7. `obtener_resumen_tiempo_tarea` une intervalos temporales para evitar contar dos veces períodos que se solapan.
8. `actualizar_tarea_v2` administra las zonas de una tarea mediante operaciones explícitas: `agregar`, `actualizar`, `quitar` y `reemplazar`. Omitir una zona del payload ya no significa eliminarla.

---

## 2. Modelo conceptual resultante

### 2.1 Creación de una tarea zona

Una tarea zona comienza así:

```text
Tarea Zona A
└── Zona control inicial A1
```

La creación sigue siendo estricta:

```text
crear_tarea_v2(tipo = "zona")
→ exactamente 1 zona de control
```

No se modificó esta regla.

### 2.2 Evolución posterior

Después de creada, la misma tarea puede terminar así:

```text
Tarea Zona A
├── Zona control A1    ← zona original
├── Zona control A2    ← duda asociada
└── Zona control A3    ← agregada posteriormente
```

La BD exige únicamente:

```text
cantidad de zonas de control activas >= 1
```

La decisión de reemplazar visualmente la zona inicial por otra es una decisión de UI/usuario; la BD no maneja un atributo especial `es_zona_inicial`.

---

## 3. Tablas que participan

### `public.tareas`

Representa la tarea general. Campos importantes para esta estrategia:

- `id`
- `area_id`
- `fecha_programada`
- `tipo_tarea_id`
- `source_id`
- `tracker_id`
- `usuario_asignado_id`
- `estado_tarea_id`
- `estado_operativo_tarea_id`
- `punto_enrutado`
- `orden_ruta`

Tipos relevantes:

- `zona`
- `finca`
- `duda_automatica`

### `public.zonas_operativas`

Contiene la geometría real del polígono.

Campos relevantes:

- `id`
- `geom`
- `tipo_zona`
- `origen`
- `activa`

### `public.tarea_zonas`

Relaciona una tarea con una zona.

Clave:

```text
(tarea_id, zona_id, rol)
```

Roles existentes:

- `control`
- `permanencia`

Con la nueva estrategia, una tarea tipo `zona` puede tener varias filas:

```text
Tarea Zona
├── zona_id A / rol=control
├── zona_id B / rol=control
└── zona_id C / rol=control
```

### `public.visitas_tarea_tracker`

Representa las visitas generales a la tarea.

Se mantiene como fuente de contexto/tiempo general de la tarea.

### `public.visitas_zona_tarea_tracker`

Representa visitas a una zona concreta.

Es la fuente autoritativa para responder:

```text
¿Cuánto tiempo estuvo el tracker en esta zona específica?
```

Campos principales:

- `id`
- `tarea_id`
- `zona_id`
- `source_id`
- `tracker_id_snapshot`
- `usuario_id_snapshot`
- `numero_visita`
- `entrada_en`
- `salida_en`
- `duracion_segundos`
- `estado`

---

## 4. Regla de integridad: `validar_control_zona_tarea_v2()`

### Tipo

Función trigger, no RPC de frontend.

```text
public.validar_control_zona_tarea_v2()
RETURNS trigger
```

### Cambio realizado

Antes:

```text
finca → >= 1 zona control
zona  → exactamente 1 zona control
```

Ahora:

```text
finca → >= 1 zona control activa
zona  → >= 1 zona control activa
```

### Importante

Este cambio **no elimina la validación de creación**. `crear_tarea_v2` conserva su propia regla de exactamente una zona al crear una tarea tipo `zona`.

La separación es intencional:

```text
CREACIÓN
zona = exactamente 1 control

DESPUÉS DE CREADA
zona = 1..N controles
```

---

# 5. RPC `crear_tarea_v2`

## Estado

El contrato público se mantiene. La lógica relevante para tareas tipo `zona` **no fue flexibilizada durante la creación**.

## Firma

```sql
public.crear_tarea_v2(
  p_area_id uuid,
  p_tipo_codigo text,
  p_usuario_asignado_id uuid,
  p_tracker_id bigint,
  p_source_id bigint,
  p_tracker_label text,
  p_acompanantes text[],
  p_indicaciones text,
  p_fecha_programada date,
  p_prioridad_id smallint,
  p_tiempo_estimado_minutos integer,
  p_ubicacion_id uuid,
  p_punto_latitud double precision,
  p_punto_longitud double precision,
  p_linea_control_geojson jsonb,
  p_zona_control_geojson jsonb,
  p_orden_ruta integer
)
RETURNS jsonb
```

## Regla especial para `tipo_codigo = "zona"`

`p_zona_control_geojson` debe representar exactamente **una zona lógica**.

Puede ser un `Polygon` o `MultiPolygon`, pero el parser debe producir una sola zona lógica.

### Ejemplo de payload para crear una tarea zona

```json
{
  "p_area_id": "AREA_UUID",
  "p_tipo_codigo": "zona",
  "p_usuario_asignado_id": "USUARIO_UUID",
  "p_tracker_id": 10488914,
  "p_source_id": 10319800,
  "p_tracker_label": "450002 - Engrase",
  "p_acompanantes": [],
  "p_indicaciones": "Engrasar equipo en el punto indicado",
  "p_fecha_programada": "2026-09-29",
  "p_prioridad_id": 1,
  "p_tiempo_estimado_minutos": 30,
  "p_ubicacion_id": null,
  "p_punto_latitud": 8.4001,
  "p_punto_longitud": -82.6102,
  "p_linea_control_geojson": null,
  "p_zona_control_geojson": {
    "type": "Polygon",
    "coordinates": [
      [
        [-82.6104, 8.3999],
        [-82.6100, 8.3999],
        [-82.6100, 8.4003],
        [-82.6104, 8.4003],
        [-82.6104, 8.3999]
      ]
    ]
  },
  "p_orden_ruta": 3
}
```

## Ejemplo de return

```json
{
  "id": "TAREA_UUID",
  "version": 1,
  "area_id": "AREA_UUID",
  "tipo": "zona",
  "usuario_asignado_id": "USUARIO_UUID",
  "tracker_id": 10488914,
  "source_id": 10319800,
  "tracker_label": "450002 - Engrase",
  "fecha_programada": "2026-09-29",
  "ubicacion_id": null,
  "zona_control_ids": [
    "ZONA_INICIAL_UUID"
  ],
  "orden_ruta": 3,
  "solicitud_recalculo_ruta_id": "SOLICITUD_UUID",
  "requiere_procesar_ruta": true,
  "estado_tarea_id": 1,
  "estado_operativo_tarea_id": 1,
  "creado_en": "2026-09-29T15:00:00Z",
  "actualizado_en": "2026-09-29T15:00:00Z"
}
```

---

# 6. RPC `actualizar_tarea_v2`

## Firma

```sql
public.actualizar_tarea_v2(
  p_tarea_id uuid,
  p_version_esperada integer,
  p_tipo_codigo text,
  p_usuario_asignado_id uuid,
  p_tracker_id bigint,
  p_source_id bigint,
  p_tracker_label text,
  p_acompanantes text[],
  p_indicaciones text,
  p_fecha_programada date,
  p_prioridad_id smallint,
  p_tiempo_estimado_minutos integer,
  p_ubicacion_id uuid,
  p_punto_latitud double precision,
  p_punto_longitud double precision,
  p_linea_control_geojson jsonb,
  p_zona_control_geojson jsonb,
  p_orden_ruta integer
)
RETURNS jsonb
```

## Cambio principal

Para tareas tipo `zona`, `p_zona_control_geojson` ya no representa necesariamente “el conjunto completo final”.

Ahora se interpreta como **operaciones incrementales**.

Esto evita el error anterior:

```text
BD tiene A, B, C
frontend manda A, C

ANTES:
→ B se interpretaba como eliminada

AHORA:
→ B se mantiene salvo que el payload diga explícitamente "quitar"
```

## Operaciones soportadas

### 6.1 Mantener una zona

```json
{
  "accion": "mantener",
  "id": "ZONA_UUID"
}
```

No cambia geometría ni elimina otras zonas.

### 6.2 Agregar una zona nueva por geometría

```json
{
  "accion": "agregar",
  "geom": {
    "type": "Polygon",
    "coordinates": [
      [
        [-82.61, 8.40],
        [-82.60, 8.40],
        [-82.60, 8.41],
        [-82.61, 8.41],
        [-82.61, 8.40]
      ]
    ]
  }
}
```

La BD crea una nueva fila en `zonas_operativas` y la relaciona como `control`.

### 6.3 Agregar una zona existente proveniente de una duda

```json
{
  "accion": "agregar",
  "id": "ZONA_DUDA_UUID"
}
```

Para que se permita:

- debe existir una `duda_automatica` que use esa zona como `permanencia`;
- debe tener el mismo `source_id` que la tarea destino;
- debe corresponder a la misma `fecha_programada`;
- no debe estar asociada como control a otra tarea zona del mismo tracker/fecha.

Cuando la asociación se confirma:

1. se agrega `tarea_zonas(tarea_real, zona, 'control')`;
2. se elimina `tarea_zonas(duda, zona, 'permanencia')`;
3. **no se eliminan** las filas de `visitas_zona_tarea_tracker`;
4. la duda queda operativamente como `visitada`;
5. la zona deja de aparecer como punto visual independiente de la duda.

### 6.4 Actualizar geometría de una zona existente

```json
{
  "accion": "actualizar",
  "id": "ZONA_UUID",
  "geom": {
    "type": "Polygon",
    "coordinates": []
  }
}
```

Restricción:

Si la tarea/zona ya tiene historia de visitas, la geometría no se modifica mediante esta operación normal.

### 6.5 Quitar una zona

```json
{
  "accion": "quitar",
  "id": "ZONA_UUID"
}
```

La operación elimina la relación `tarea_zonas(... rol='control')`.

Regla final:

```text
la tarea zona debe conservar >= 1 control activo
```

Por tanto no se permite dejar una tarea zona con cero zonas.

### 6.6 Reemplazar una zona por otra zona existente

```json
{
  "accion": "reemplazar",
  "id": "ZONA_A_QUITAR_UUID",
  "nueva_zona_id": "ZONA_NUEVA_UUID"
}
```

Internamente equivale a:

```text
agregar nueva zona
+
quitar zona anterior
```

### 6.7 Reemplazar una zona por una geometría nueva

```json
{
  "accion": "reemplazar",
  "id": "ZONA_A_QUITAR_UUID",
  "geom": {
    "type": "Polygon",
    "coordinates": []
  }
}
```

## Payload completo de ejemplo

```json
{
  "p_tarea_id": "TAREA_ZONA_UUID",
  "p_version_esperada": 4,
  "p_tipo_codigo": "zona",
  "p_usuario_asignado_id": "USUARIO_UUID",
  "p_tracker_id": 10488914,
  "p_source_id": 10319800,
  "p_tracker_label": "450002 - Engrase",
  "p_acompanantes": [],
  "p_indicaciones": "Engrasar equipos del sector",
  "p_fecha_programada": "2026-09-29",
  "p_prioridad_id": 1,
  "p_tiempo_estimado_minutos": 60,
  "p_ubicacion_id": null,
  "p_punto_latitud": 8.4001,
  "p_punto_longitud": -82.6102,
  "p_linea_control_geojson": null,
  "p_zona_control_geojson": [
    {
      "accion": "mantener",
      "id": "ZONA_ORIGINAL_UUID"
    },
    {
      "accion": "agregar",
      "id": "ZONA_DUDA_UUID"
    }
  ],
  "p_orden_ruta": 3
}
```

## Return

```json
{
  "id": "TAREA_ZONA_UUID",
  "version": 5,
  "area_id": "AREA_UUID",
  "tipo": "zona",
  "usuario_asignado_id": "USUARIO_UUID",
  "tracker_id": 10488914,
  "source_id": 10319800,
  "tracker_label": "450002 - Engrase",
  "fecha_programada": "2026-09-29",
  "ubicacion_id": null,
  "zona_control_ids": [
    "ZONA_ORIGINAL_UUID",
    "ZONA_DUDA_UUID"
  ],
  "orden_ruta": 3,
  "estado_tarea_id": 1,
  "estado_operativo_tarea_id": 3,
  "actualizado_en": "2026-09-29T16:00:00Z"
}
```

## Compatibilidad con payload antiguo

Se agregó `app_privado.normalizar_cambios_zonas_control_v2`.

Si una tarea todavía tiene **una sola zona** y el frontend manda solamente una geometría antigua:

```json
{
  "type": "Polygon",
  "coordinates": []
}
```

la BD lo transforma conceptualmente en:

```json
[
  {
    "accion": "actualizar",
    "id": "UNICA_ZONA_ACTUAL_UUID",
    "geom": {
      "type": "Polygon",
      "coordinates": []
    }
  }
]
```

Si la tarea ya tiene varias zonas, se exige una operación explícita para evitar ambigüedad.

---

# 7. Helper interno `normalizar_cambios_zonas_control_v2`

## Firma

```sql
app_privado.normalizar_cambios_zonas_control_v2(
  p_tarea_id uuid,
  p_cambios jsonb
)
RETURNS jsonb
```

## Uso

Solo debe ser llamado internamente por `actualizar_tarea_v2`.

No es un contrato recomendado para frontend.

## Objetivo

Mantener compatibilidad con la edición antigua de una única zona y obligar a usar operaciones explícitas cuando ya existen varias zonas.

---

# 8. Helper interno `aplicar_cambios_zonas_control_v2`

## Firma

```sql
app_privado.aplicar_cambios_zonas_control_v2(
  p_tarea_id uuid,
  p_cambios jsonb
)
RETURNS jsonb
```

## Return

Devuelve el arreglo final de IDs de zonas de control activas:

```json
[
  "ZONA_A_UUID",
  "ZONA_B_UUID",
  "ZONA_C_UUID"
]
```

## Responsabilidades

- agregar zonas;
- actualizar geometría cuando está permitido;
- quitar zonas;
- reemplazar zonas;
- validar asociaciones provenientes de dudas;
- limpiar la relación visual `permanencia` de las dudas cuando su zona pasa a ser control de una tarea real;
- impedir que la tarea quede sin ninguna zona de control.

---

# 9. Estrategia de creación y asociación de `duda_automatica`

## 9.1 Configuración

Actualmente:

```text
duda.permanencia_minutos = 10

duda.asociacion_zona_automatica_metros = 100

duda.asociacion_zona_sugerida_metros = 300

geocerca.zona_control_margen_metros = 20
```

## 9.2 Flujo

```text
Tracker detenido sin tarea activa
          │
          ▼
permanece >= 10 minutos
          │
          ▼
crear duda_automatica
          │
          ├── crear/reutilizar zona de permanencia
          └── abrir visitas_zona_tarea_tracker
          │
          ▼
buscar tareas zona del mismo:
  - source_id
  - fecha_programada
  - area_id
          │
          ▼
calcular distancia entre geometrías
```

### Resultado A — sin candidato <= 300 m

```text
La duda continúa como duda independiente.
```

### Resultado B — único candidato <= 100 m

Mientras la permanencia está abierta:

```text
solo se detecta y se notifica
NO se modifica todavía la tarea
```

Al cerrarse la duda:

```text
asociación automática
```

### Resultado C — único candidato > 100 m y <= 300 m

La BD no modifica automáticamente la tarea.

Al cerrar la duda se envía una sugerencia a UI.

### Resultado D — más de un candidato dentro del rango de análisis

Se considera ambiguo.

No existe asociación automática.

---

# 10. Helper `procesar_candidato_duda_zona_v2`

## Firma

```sql
app_privado.procesar_candidato_duda_zona_v2(
  p_duda_tarea_id uuid,
  p_zona_id uuid,
  p_finalizar boolean DEFAULT false
)
RETURNS jsonb
```

## Parámetros

### `p_duda_tarea_id`

ID de la tarea `duda_automatica`.

### `p_zona_id`

Zona de permanencia generada/reutilizada por la duda.

### `p_finalizar`

- `false`: la duda está activa; solo detectar/notificar candidato.
- `true`: la permanencia ya cerró; se permite asociación automática.

## Return: sin candidato

```json
{
  "codigo": "duda_sin_zona_cercana"
}
```

## Return: candidato automático todavía abierto

```json
{
  "tipo": "duda_zona_cercana_detectada",
  "tarea_id": "TAREA_ZONA_UUID",
  "duda_tarea_id": "DUDA_UUID",
  "zona_id": "ZONA_DUDA_UUID",
  "distancia_metros": 47.5,
  "automatica": true,
  "se_asociara_al_cerrar": true,
  "requiere_revision": false,
  "ocurrido_en": "2026-09-29T16:00:00Z"
}
```

## Return: asociación automática cerrada

```json
{
  "tipo": "duda_zona_asociada_automaticamente",
  "tarea_id": "TAREA_ZONA_UUID",
  "duda_tarea_id": "DUDA_UUID",
  "zona_id": "ZONA_DUDA_UUID",
  "distancia_metros": 47.5,
  "metodo": "automatico",
  "requiere_revision": false,
  "zonas_control_ids": [
    "ZONA_ORIGINAL_UUID",
    "ZONA_DUDA_UUID"
  ],
  "ocurrido_en": "2026-09-29T16:45:00Z"
}
```

## Return: sugerencia manual 100–300 m

```json
{
  "tipo": "duda_zona_sugerida",
  "tarea_id": "TAREA_ZONA_UUID",
  "duda_tarea_id": "DUDA_UUID",
  "zona_id": "ZONA_DUDA_UUID",
  "distancia_metros": 185.2,
  "automatica": false,
  "requiere_revision": true,
  "finalizada": true,
  "acciones": [
    "agregar",
    "ignorar"
  ],
  "ocurrido_en": "2026-09-29T16:45:00Z"
}
```

## Return: ambiguo

```json
{
  "tipo": "duda_zona_ambigua",
  "duda_tarea_id": "DUDA_UUID",
  "zona_id": "ZONA_DUDA_UUID",
  "candidatos": 2,
  "requiere_revision": true,
  "finalizada": true,
  "ocurrido_en": "2026-09-29T16:45:00Z"
}
```

---

# 11. RPC `sb_v2_procesar_detencion_tracker`

## Firma

```sql
public.sb_v2_procesar_detencion_tracker(
  p_source_id bigint,
  p_tracker_id bigint,
  p_tracker_label text,
  p_posicion geography,
  p_capturada_en timestamptz,
  p_movement_status text,
  p_movement_status_update timestamptz,
  p_en_resguardo_id uuid
)
RETURNS jsonb
```

## Cambio realizado

La función ahora integra la detección/asociación de dudas.

### Al crear una duda

Después de crear la tarea, zona y visita:

```sql
procesar_candidato_duda_zona_v2(
  v_duda,
  v_zona,
  false
)
```

### Return relevante

```json
{
  "codigo": "duda_automatica_creada",
  "tarea_duda_id": "DUDA_UUID",
  "zona_id": "ZONA_UUID",
  "visita_zona_id": "VISITA_UUID",
  "usuario_id": "USUARIO_UUID",
  "asociacion_zona": {
    "tipo": "duda_zona_cercana_detectada",
    "tarea_id": "TAREA_ZONA_UUID",
    "distancia_metros": 47.5,
    "automatica": true,
    "se_asociara_al_cerrar": true
  }
}
```

### Al pasar a `moving`

Primero cierra la visita de la zona de duda:

```text
salida_en
duracion_segundos
estado = cerrada
```

Después ejecuta:

```sql
procesar_candidato_duda_zona_v2(
  duda_id,
  zona_id,
  true
)
```

### Return relevante

```json
{
  "codigo": "detencion_finalizada",
  "tarea_duda_id": "DUDA_UUID",
  "zona_id": "ZONA_UUID",
  "asociacion_zona": {
    "tipo": "duda_zona_asociada_automaticamente",
    "tarea_id": "TAREA_ZONA_UUID",
    "distancia_metros": 47.5
  }
}
```

## Razón para asociar al cerrar y no al crear

Mientras una duda está abierta todavía no se conoce su duración final.

La estrategia es:

```text
CREAR DUDA
→ detectar cercanía
→ avisar UI
→ continuar acumulando tiempo

SALIR / MOVING
→ cerrar visita
→ duración definitiva
→ asociar automáticamente si corresponde
```

---

# 12. Broadcast / Realtime hacia UI

La nueva estrategia reutiliza Realtime existente.

## Evento

```text
cambio_operacion
```

## Canales

Por área:

```text
area:<area_id>:ubicaciones
```

Y cuando existe usuario asignado:

```text
trabajador:<usuario_id>
```

## Eventos relevantes

### `duda_zona_cercana_detectada`

Durante la permanencia.

UI recomendada para `automatica=true`:

```text
Permanencia detectada a 47.5 m de la Tarea Zona X.
Se asociará automáticamente cuando finalice la permanencia.
```

No mostrar botones de aprobación si `automatica=true`.

### `duda_zona_asociada_automaticamente`

Al cerrar una duda <=100 m con candidato único.

UI:

```text
Permanencia de la duda asociada a Tarea Zona X.
```

La UI debe refrescar el detalle/listado de la tarea destino.

### `duda_zona_sugerida`

Para 100–300 m.

UI sugerida:

```text
Posible permanencia relacionada
Distancia: 185 m

[Agregar zona]
[Ignorar]
```

El botón `Agregar zona` debe llamar `actualizar_tarea_v2` con:

```json
[
  {
    "accion": "agregar",
    "id": "ZONA_DUDA_UUID"
  }
]
```

### `duda_zona_ambigua`

Hay más de una tarea zona candidata.

No debe elegirse automáticamente una tarea.

---

# 13. RPC `sb_v2_procesar_zonas_control_tarea`

## Firma

```sql
public.sb_v2_procesar_zonas_control_tarea(
  p_source_id bigint,
  p_tracker_id bigint,
  p_posicion geography,
  p_capturada_en timestamptz
)
RETURNS jsonb
```

## Cambio realizado

Antes el seguimiento por zona de control se aplicaba esencialmente a tareas `finca`.

Ahora aplica a:

```text
finca
zona
```

Por tanto una tarea `zona` con tres controles puede registrar separadamente:

```text
Zona A → visita #1
Zona B → visita #1
Zona B → visita #2
Zona C → visita #1
```

## Return general

```json
{
  "codigo": "zona_control_entrada",
  "tarea_id": "TAREA_UUID",
  "abiertas": [
    {
      "visita_zona_id": "VISITA_UUID",
      "zona_id": "ZONA_UUID"
    }
  ],
  "cerradas": []
}
```

Posibles códigos relevantes:

- `zona_control_entrada`
- `zona_control_salida`
- `zona_control_cambio`
- `zona_control_sin_transicion`
- `zonas_control_cerradas_fin_tarea`
- `sin_tarea_finca_activa` — nombre heredado; puede aparecer aunque el procesador ahora soporte también tareas `zona`.

---

# 14. Nueva estrategia de tiempo por zona

## Problema anterior

Cuando una tarea tipo `zona` tenía exactamente un control era posible mostrar simplemente el tiempo general de la tarea.

Ejemplo:

```text
Tarea Zona
└── Zona A

Tiempo tarea = 1 h 20 min
Tiempo Zona A = 1 h 20 min
```

No existía ambigüedad.

Con múltiples controles:

```text
Tarea Zona
├── Zona A
├── Zona B
└── Zona C
```

el tiempo general `1 h 20 min` ya no indica dónde estuvo realmente el equipo.

Se necesita:

```text
Zona A = 0 min
Zona B = 52 min
Zona C = 28 min
```

## Solución

- `visitas_tarea_tracker`: contexto/visita general de tarea.
- `visitas_zona_tarea_tracker`: desglose real por zona.
- `obtener_resumen_tiempo_tarea`: total temporal sin doble conteo.

---

# 15. Helper `obtener_resumen_zona_tarea_v2`

## Firma

```sql
app_privado.obtener_resumen_zona_tarea_v2(
  p_tarea_id uuid,
  p_zona_id uuid
)
RETURNS jsonb
```

## Fuentes

Para una zona de una tarea real busca:

1. visitas cuyo `tarea_id` ya es la tarea real;
2. visitas históricas de una `duda_automatica` que tengan el mismo `zona_id`, `source_id` y fecha.

Esto permite eliminar la relación visual de la duda sin perder sus tiempos.

## Compatibilidad histórica

Si la tarea tipo `zona` todavía tiene una sola zona de control y no existen visitas específicas por zona, se usa como fallback la visita general de `visitas_tarea_tracker`.

## Return

```json
{
  "cantidad_visitas": 2,
  "segundos_visitas_cerradas": 6540,
  "segundos_visita_abierta": 0,
  "segundos_totales": 6540,
  "visita_abierta": false,
  "visita_actual_id": null,
  "llegada_actual_en": null,
  "primera_llegada_en": "2026-09-21T17:12:34Z",
  "ultima_salida_en": "2026-09-21T19:03:15Z",
  "ultima_actualizacion_tracker_en": "2026-09-29T16:22:21Z",
  "segundos_sin_datos": 0
}
```

---

# 16. Helper `obtener_visitas_zona_tarea_v2`

## Firma

```sql
app_privado.obtener_visitas_zona_tarea_v2(
  p_tarea_id uuid,
  p_zona_id uuid
)
RETURNS jsonb
```

## Return

Devuelve un arreglo de visitas:

```json
[
  {
    "id": "VISITA_UUID",
    "numero_visita": 1,
    "entrada_en": "2026-09-21T17:12:34Z",
    "salida_en": "2026-09-21T18:04:36Z",
    "duracion_segundos": 3122,
    "estado": "cerrada",
    "source_id": 10319800,
    "tracker_id": 10488914,
    "usuario_id": "USUARIO_UUID",
    "actualizado_en": "2026-09-21T18:04:36Z",
    "origen_tiempo": "duda_asociada"
  }
]
```

Valores actuales de `origen_tiempo` en este helper:

- `visita_zona`
- `duda_asociada`
- `visita_tarea_historica`

---

# 17. RPC `obtener_resumen_tiempo_tarea`

## Firma

```sql
public.obtener_resumen_tiempo_tarea(
  p_tarea_id uuid
)
RETURNS TABLE(
  tarea_id uuid,
  cantidad_visitas integer,
  segundos_visitas_cerradas bigint,
  segundos_visita_abierta bigint,
  segundos_totales bigint,
  visita_abierta boolean,
  llegada_actual_en timestamptz,
  primera_llegada_en timestamptz,
  ultima_salida_en timestamptz,
  segundos_sin_datos bigint
)
```

## Cambio principal

Para tareas `zona`, combina:

- visitas generales a la tarea;
- visitas específicas a sus zonas;
- visitas históricas provenientes de dudas asociadas.

Pero **no suma ciegamente** los segundos.

Se utiliza unión de rangos temporales para evitar duplicación.

### Ejemplo

Datos:

```text
visita general = 10:00 → 11:00
visita zona B  = 10:20 → 10:50
```

Incorrecto:

```text
60 + 30 = 90 minutos
```

Correcto:

```text
unión temporal = 10:00 → 11:00 = 60 minutos
```

## Ejemplo de return

```json
{
  "tarea_id": "TAREA_UUID",
  "cantidad_visitas": 3,
  "segundos_visitas_cerradas": 8112,
  "segundos_visita_abierta": 0,
  "segundos_totales": 8112,
  "visita_abierta": false,
  "llegada_actual_en": null,
  "primera_llegada_en": "2026-09-21T17:12:34Z",
  "ultima_salida_en": "2026-09-21T19:29:27Z",
  "segundos_sin_datos": 0
}
```

---

# 18. `obtener_tarea_detalle_v2`

## Firma

```sql
public.obtener_tarea_detalle_v2(
  p_tarea_id uuid
)
RETURNS jsonb
```

## Impacto de la nueva estrategia

El RPC ya devuelve las zonas como arreglos:

```json
{
  "tarea": {
    "zonas_control": [],
    "zonas_permanencia": []
  },
  "zonas_detalle": []
}
```

Las tareas `zona` con múltiples zonas aparecen naturalmente como múltiples elementos de `zonas_control` / `zonas_detalle`.

### Duda asociada

Después de asociar una duda:

- se elimina su relación `rol='permanencia'`;
- `ubicacion_visual` queda `null` si no tiene otra fuente visual;
- `zonas_permanencia` queda vacío para la zona que fue absorbida;
- sus filas históricas de visita permanecen disponibles para el cálculo de tiempo de la tarea destino.

Ejemplo conceptual:

```json
{
  "tarea": {
    "tipo_codigo": "duda_automatica",
    "ubicacion_visual": null,
    "zonas_permanencia": []
  }
}
```

### Nota importante sobre `ubicacion_visual`

`ubicacion_visual` sí es un campo real del return del detalle.

El término `origen_visual` usado durante pruebas fue solamente un alias de diagnóstico y **no forma parte del contrato público**.

---

# 19. `listar_tareas_rastreo_v2`

## Firma

```sql
public.listar_tareas_rastreo_v2(
  p_area_id uuid DEFAULT null,
  p_fecha date DEFAULT null,
  p_usuario_asignado_id uuid DEFAULT null,
  p_source_id bigint DEFAULT null,
  p_estado_operativo_codigo text DEFAULT null,
  p_incluir_canceladas boolean DEFAULT true
)
RETURNS TABLE(...)
```

## Parámetros de ejemplo

```json
{
  "p_area_id": "AREA_UUID",
  "p_fecha": "2026-09-29",
  "p_usuario_asignado_id": null,
  "p_source_id": 10319800,
  "p_estado_operativo_codigo": null,
  "p_incluir_canceladas": true
}
```

## Campos importantes del return

Entre otros:

```json
{
  "id": "TAREA_UUID",
  "version": 5,
  "fecha_programada": "2026-09-29",
  "tipo_tarea_codigo": "zona",
  "source_id": 10319800,
  "tracker_id": 10488914,
  "cantidad_visitas": 2,
  "segundos_totales": 6540,
  "visita_abierta": false,
  "orden_ruta": 3,
  "punto_latitud": 8.40,
  "punto_longitud": -82.61
}
```

Para una duda que ya fue asociada, como ya no existe su relación `permanencia`, la ubicación derivada de esa zona deja de aparecer:

```json
{
  "tipo_tarea_codigo": "duda_automatica",
  "punto_latitud": null,
  "punto_longitud": null
}
```

si no existe otra fuente visual como `punto_enrutado`.

---

# 20. Limpieza visual de dudas asociadas

## Problema detectado

Inicialmente la asociación quedaba así:

```text
Zona X
├── Duda automática → rol=permanencia
└── Tarea Zona      → rol=control
```

Por eso la UI seguía mostrando el punto de la duda.

## Corrección actual

Ahora queda:

```text
Zona X
└── Tarea Zona → rol=control
```

La fila de visita permanece:

```text
visitas_zona_tarea_tracker
└── tarea_id = duda original
    zona_id  = Zona X
    entrada/salida/duración intactas
```

Así se separan dos conceptos:

- **relación visual/operativa actual**: `tarea_zonas`;
- **evidencia histórica de tiempo**: `visitas_zona_tarea_tracker`.

---

# 21. Estado histórico después del backfill

Se reprocesaron las dudas históricas cerradas con la nueva regla.

Resultado:

```text
11 dudas asociadas automáticamente
9 tareas zona afectadas
10 zonas distintas agregadas como control
9 sugerencias entre 100 y 300 m quedaron pendientes
0 casos ambiguos dentro del lote automático
```

Distancias de las 11 asociaciones automáticas:

```text
mínima: 0 m
máxima: 93.8 m
```

Después de limpiar la relación visual:

```text
11/11 dudas asociadas:
- ya no conservan tarea_zonas(... rol='permanencia')
- conservan sus visitas históricas
- la tarea destino conserva la zona como rol='control'
```

---

# 22. Flujo recomendado para frontend

## 22.1 Crear tarea zona

Frontend:

```text
usuario dibuja una zona
↓
crear_tarea_v2
↓
BD crea exactamente 1 control
```

## 22.2 Duda <=100 m

```text
duda creada
↓
Broadcast: duda_zona_cercana_detectada
  automatica=true
↓
UI informa, sin botones
↓
tracker sale / moving
↓
BD cierra tiempo
↓
asocia automáticamente
↓
Broadcast: duda_zona_asociada_automaticamente
↓
UI refresca tarea destino y mapa
```

## 22.3 Duda 100–300 m

```text
duda creada
↓
se detecta candidato
↓
tracker sale
↓
Broadcast: duda_zona_sugerida
↓
UI muestra:
[Agregar zona] [Ignorar]
```

Si el usuario elige agregar:

```json
{
  "p_zona_control_geojson": [
    {
      "accion": "agregar",
      "id": "ZONA_DUDA_UUID"
    }
  ]
}
```

dentro del payload completo de `actualizar_tarea_v2`.

## 22.4 Reemplazar visualmente la zona original

La BD no decide automáticamente cuál es “la inicial”.

La UI puede presentar:

```text
Zona original — 0 visitas
Zona detectada — 52 min

[Reemplazar original]
[Mantener ambas]
```

Si se reemplaza:

```json
{
  "accion": "reemplazar",
  "id": "ZONA_ORIGINAL_UUID",
  "nueva_zona_id": "ZONA_DUDA_UUID"
}
```

---

# 23. Reglas que el frontend debe respetar

1. **No mandar un arreglo parcial como si fuera el conjunto completo.** Usar operaciones explícitas.
2. `quitar` siempre debe identificar un `zona_id` concreto.
3. Una tarea zona nunca debe terminar con cero zonas de control.
4. Para una sugerencia 100–300 m, usar el `zona_id` incluido en el Broadcast.
5. No crear una geometría duplicada para una duda; reutilizar el `zona_id` existente.
6. Después de `duda_zona_asociada_automaticamente`, refrescar la tarea destino y el mapa.
7. No seguir dibujando una duda resuelta desde un estado local antiguo si el nuevo listado devuelve coordenadas `null`.
8. La duración general y el detalle por zona son conceptos distintos; no sumar ambos valores en frontend.

---

# 24. Consideraciones sobre tiempo y doble conteo

El frontend debe considerar:

```text
segundos_totales de tarea
≠
suma obligatoria de todos los segundos mostrados en diferentes fuentes
```

El backend ya calcula el total mediante unión temporal.

Ejemplo:

```text
Tarea general: 08:00–10:00
Zona B:        08:30–09:00
Zona C:        09:15–09:45

Total real de tarea = 2 horas
```

No:

```text
2 h + 30 m + 30 m = 3 h
```

Para reportes:

- usar `obtener_resumen_tiempo_tarea` para total de tarea;
- usar `zonas_detalle[].tiempo` para desglose por zona.

---

# 25. Decisiones de diseño importantes

### No se creó una tabla de asociación nueva

La asociación usa el modelo existente:

```text
tarea_zonas
```

La misma `zona_operativa` pasa a ser un control de la tarea real.

### No se copian visitas

Las visitas de la duda permanecen en su fila original.

Esto evita:

- duplicar minutos;
- perder trazabilidad;
- alterar evidencia GPS histórica.

### La duda deja de ser un punto operativo visible

Al asociarse se elimina su relación `permanencia`.

Esto hace que la UI deje de mostrarla como destino/punto independiente.

### La tarea real puede tener varias zonas

El modelo queda preparado para reflejar la realidad de campo sin obligar a que todo ocurra dentro de un único polígono dibujado inicialmente.

---

# 26. Resumen de funciones afectadas

| Función | Tipo | Cambio principal |
|---|---|---|
| `crear_tarea_v2` | RPC público | Mantiene exactamente una zona inicial para tipo `zona` |
| `actualizar_tarea_v2` | RPC público | Operaciones incrementales de zonas; ya no elimina por omisión |
| `validar_control_zona_tarea_v2` | Trigger | Tarea zona puede tener 1..N controles |
| `sb_v2_procesar_detencion_tracker` | Procesador | Detecta candidato al crear duda y resuelve al cerrarla |
| `sb_v2_procesar_zonas_control_tarea` | Procesador | Registra visitas de control para tareas `finca` y `zona` |
| `obtener_resumen_tiempo_tarea` | RPC/función pública | Une intervalos y evita doble conteo |
| `obtener_tarea_detalle_v2` | RPC público | Refleja múltiples controles y desaparición visual de duda asociada |
| `listar_tareas_rastreo_v2` | RPC público | Duda asociada deja de devolver coordenadas provenientes de permanencia |
| `normalizar_cambios_zonas_control_v2` | Helper interno | Compatibilidad con edición antigua de una zona |
| `aplicar_cambios_zonas_control_v2` | Helper interno | Alta/baja/actualización/reemplazo y limpieza de duda |
| `procesar_candidato_duda_zona_v2` | Helper interno | Regla <=100 automática / <=300 sugerida |
| `obtener_resumen_zona_tarea_v2` | Helper interno | Tiempo agregado de una zona específica |
| `obtener_visitas_zona_tarea_v2` | Helper interno | Historial detallado por zona y origen del tiempo |

---

# 27. Contrato recomendado para UI

La UI debería considerar como contratos principales:

```text
crear_tarea_v2
actualizar_tarea_v2
listar_tareas_rastreo_v2
obtener_tarea_detalle_v2
Realtime: cambio_operacion
```

Y **no llamar directamente** desde cliente:

```text
app_privado.normalizar_cambios_zonas_control_v2
app_privado.aplicar_cambios_zonas_control_v2
app_privado.procesar_candidato_duda_zona_v2
app_privado.obtener_resumen_zona_tarea_v2
app_privado.obtener_visitas_zona_tarea_v2
```

Esos helpers existen para encapsular reglas de consistencia dentro de la BD.

---

# 28. Flujo completo resumido

```text
SUPERVISOR CREA TAREA ZONA
        │
        ▼
1 zona inicial obligatoria
        │
        ▼
TRACKER TRABAJA CERCA PERO FUERA
        │
        ▼
10 min detenido
        │
        ▼
DUDA AUTOMÁTICA
+ zona permanencia
+ visita zona abierta
        │
        ▼
buscar tarea zona misma fecha/source/área
        │
        ├── >300 m → duda normal
        │
        ├── 100–300 m → sugerencia UI al cerrar
        │
        ├── múltiples candidatos → revisión
        │
        └── <=100 m + candidato único
                  │
                  ▼
             esperar salida
                  │
                  ▼
             cerrar visita
                  │
                  ▼
       agregar zona como control
                  │
                  ▼
       quitar permanencia de duda
                  │
                  ▼
       conservar visitas históricas
                  │
                  ▼
       Broadcast a UI
                  │
                  ▼
       tarea zona muestra tiempo
       individual de la nueva zona
```

---

## 29. Resultado esperado del modelo

Ejemplo final:

```text
Tarea Zona #25
Tiempo total real: 1 h 31 min

Zonas:
- Zona original: 0 min
- Zona detectada A: 52 min
- Zona detectada B: 39 min
```

La UI puede posteriormente permitir al supervisor retirar la zona original si nunca fue utilizada, pero esa decisión no es automática en la BD.

El resultado conserva simultáneamente:

- precisión operativa;
- trazabilidad histórica;
- tiempos por zona;
- tiempo total sin duplicación;
- compatibilidad con tareas antiguas de una sola zona;
- un único RPC público para editar la tarea y sus zonas.
