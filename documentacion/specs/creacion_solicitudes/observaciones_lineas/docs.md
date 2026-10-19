# Funcionamiento actualizado de las observaciones por línea — Solicitudes de Compra

He verificado los RPC existentes en tu base de datos `bd_compras` de Supabase. Esta es la lógica que tienes actualmente implementada y el contrato que debe utilizar tu frontend Vue 3 + TypeScript + Tailwind.

## 1. Funcionamiento general

El Supervisor puede crear observaciones que estén relacionadas con uno o varios productos o servicios de una solicitud.

La relación es de muchos a muchos:

- Una observación puede aplicarse a un producto.
- Una observación puede aplicarse a varios productos.
- Un producto puede tener múltiples observaciones.
- Una solicitud puede contener múltiples observaciones.
- También funciona con productos manuales y servicios.

Por ejemplo:

| Producto        | Código      | Observaciones asociadas |
| --------------- | ----------- | ----------------------- |
| Filtro P1951    | T003-PT951  | OBS-01                  |
| Filtro BF1222   | T003-BF1222 | OBS-01, OBS-02          |
| Producto manual | Temporal    | OBS-02                  |

Donde:

- OBS-01: Comprar ambos filtros de la misma marca.
- OBS-02: Verificar la compatibilidad con el equipo.

El backend almacena cada texto una sola vez y guarda las relaciones con los productos afectados.

## 2. RPC involucrados

| RPC / función                                 | Responsabilidad                                                           | Retorno               |
| --------------------------------------------- | ------------------------------------------------------------------------- | --------------------- |
| `rpc_crear_solicitud_compra_go`               | Crea la solicitud, sus productos o servicios y sus observaciones          | `jsonb`               |
| `fn_registrar_observaciones_creacion`         | Vincula internamente las observaciones con los detalles creados           | `integer`             |
| `rpc_obtener_observaciones_solicitud`         | Consulta observaciones y sus relaciones según el rol                      | Conjunto de registros |
| `fn_actualizar_lineas_snapshot_observaciones` | Actualiza los números de línea asociados después de aprobar               | `integer`             |
| `rpc_aprobar_solicitud`                       | Aprueba la solicitud y asigna líneas definitivas a productos              | `jsonb`               |
| `rpc_guardar_observacion_gerencia`            | Registra observaciones generales de Gerencia para Supervisor o Secretaría | `uuid`                |

Para crear una solicitud con observaciones, el frontend debe llamar únicamente a `rpc_crear_solicitud_compra_go`. La función `fn_registrar_observaciones_creacion` se ejecuta dentro del RPC principal.

La observación general de la solicitud y las observaciones por línea son datos distintos:

| Parámetro         | Uso                                                                              |
| ----------------- | -------------------------------------------------------------------------------- |
| `p_observacion`   | Texto general de la solicitud, sin líneas asociadas                              |
| `p_observaciones` | Arreglo JSON de observaciones específicas relacionadas con uno o varios detalles |

Las observaciones específicas se guardan como `indicacion_detalle`, con alcance `detalle`, estado inicial `activa` y audiencia `secretaria`. Esto no impide que Supervisor y Gerencia también puedan verlas según las reglas del RPC de consulta.

## 3. Payload completo de creación

El RPC principal recibe 13 parámetros, de los cuales los primeros cuatro no tienen valor predeterminado.

| Parámetro                     | Tipo PostgreSQL | Descripción                                                   |
| ----------------------------- | --------------- | ------------------------------------------------------------- |
| `p_tipo_codigo`               | `text`          | `producto` o `servicio`                                       |
| `p_etapa_codigo`              | `text`          | `zafra`, `cultivo` u `otros`                                  |
| `p_fecha_entrega`             | `date`          | Fecha solicitada, formato `YYYY-MM-DD`                        |
| `p_observacion`               | `text`          | Observación general obligatoria                               |
| `p_contextos_destino`         | `jsonb`         | Equipos, áreas u otros destinos; por defecto `[]`             |
| `p_productos`                 | `jsonb`         | Productos de catálogo y temporales; por defecto `[]`          |
| `p_servicios`                 | `jsonb`         | Servicios de la solicitud; por defecto `[]`                   |
| `p_observaciones`             | `jsonb`         | Observaciones por línea; por defecto `[]`                     |
| `p_enviar`                    | `boolean`       | `true` para enviar, `false` para crear en borrador            |
| `p_solicitar_urgente`         | `boolean`       | Indica si solicita prioridad urgente                          |
| `p_motivo_urgencia`           | `text`          | Justificación de urgencia                                     |
| `p_adjuntos`                  | `jsonb`         | Archivos adjuntos                                             |
| `p_requerir_adjuntos_storage` | `boolean`       | Exige comprobación de adjuntos en Storage; por defecto `true` |

### Ejemplo con los productos de tu interfaz

En este ejemplo se crean tres productos y dos observaciones compartidas.

```
{
  "p_tipo_codigo": "producto",
  "p_etapa_codigo": "cultivo",
  "p_fecha_entrega": "2026-10-22",
  "p_observacion": "Repuestos necesarios para mantenimiento.",

  "p_contextos_destino": [],

  "p_productos": [
    {
      "temporal": false,
      "cod_producto": "T003-PT951"
    },
    {
      "temporal": false,
      "cod_producto": "T003-BF1222"
    },
    {
      "temporal": true,
      "nombre": "AFDADF",
      "descripcion": "Producto solicitado manualmente",
      "unidad_codigo": "caja"
    }
  ],

  "p_servicios": [],

  "p_observaciones": [
    {
      "texto": "Comprar ambos filtros de la misma marca.",
      "codigos_producto": [
        "T003-PT951",
        "T003-BF1222"
      ],
      "indices_temporales": [],
      "indices_servicios": []
    },
    {
      "texto": "Verificar compatibilidad con el equipo.",
      "codigos_producto": [
        "T003-BF1222"
      ],
      "indices_temporales": [3],
      "indices_servicios": []
    }
  ],

  "p_enviar": true,
  "p_solicitar_urgente": false,
  "p_motivo_urgencia": null,
  "p_adjuntos": [],
  "p_requerir_adjuntos_storage": true
}
```

Ejemplo ilustrativo. Los productos de catálogo y la unidad del producto manual deben existir y estar habilitados en la BD para que la solicitud sea válida.

### ¿Cómo funciona `p_observaciones`?

Cada objeto representa una observación diferente.

| Propiedad            | Tipo       | Funcionamiento                                        |
| -------------------- | ---------- | ----------------------------------------------------- |
| `texto`              | `string`   | Contenido de la observación                           |
| `codigos_producto`   | `string[]` | Productos de catálogo a los que aplica                |
| `indices_temporales` | `number[]` | Posiciones de los productos manuales en `p_productos` |
| `indices_servicios`  | `number[]` | Posiciones de los servicios en `p_servicios`          |

Los tres arreglos de referencias pueden omitirse cuando no se usan, porque la función los interpreta como arreglos vacíos. Sin embargo, recomiendo enviarlos explícitamente para mantener un contrato consistente.

### ¿Por qué los productos manuales usan índices?

Porque los productos manuales todavía no tienen un UUID definitivo ni un código de producto del catálogo.

En el ejemplo:

| Índice de entrada | Producto    | Tipo     |
| ----------------- | ----------- | -------- |
| 1                 | T003-PT951  | Catálogo |
| 2                 | T003-BF1222 | Catálogo |
| 3                 | AFDADF      | Manual   |

Por lo tanto, `indices_temporales: [3]` identifica el tercer producto del arreglo, no un número definitivo de línea.

Importante: estos índices comienzan en 1 y se calculan sobre el arreglo completo `p_productos`, no solamente sobre los productos manuales.

### Caso de servicios

El mismo RPC admite observaciones por servicio. Por ejemplo:

```
{
  "p_tipo_codigo": "servicio",
  "p_productos": [],
  "p_servicios": [
    {
      "descripcion": "Reparación de sistema hidráulico",
      "cantidad": 1,
      "unidad_codigo": "servicio"
    },
    {
      "descripcion": "Inspección general del equipo",
      "cantidad": 1,
      "unidad_codigo": "servicio"
    }
  ],
  "p_observaciones": [
    {
      "texto": "Realizar ambas actividades en la misma visita.",
      "codigos_producto": [],
      "indices_temporales": [],
      "indices_servicios": [1, 2]
    }
  ]
}
```

Fragmento de parámetros para explicar el caso de servicios. Debe acompañarse del resto de parámetros obligatorios del RPC.

## 4. Lógica interna de `rpc_crear_solicitud_compra_go`

1. Validación inicial

   Se obtiene el usuario autenticado y se comprueba que tenga un rol permitido. También se validan tipo, etapa, fecha de entrega, observación general y estructura de los arreglos JSON.
2. Creación de la solicitud

   Inserta el registro principal en `solicitud_compra` y obtiene el UUID mediante `RETURNING id`.
3. Creación de productos o servicios

   Inserta cada elemento en su tabla correspondiente. Los productos manuales se crean primero en `producto`, con código temporal generado por el sistema.
4. Construcción del mapa de detalles

   Por cada elemento guarda internamente un objeto que relaciona su código o índice original con el UUID recién generado.
5. Registro de observaciones

   Ejecuta `fn_registrar_observaciones_creacion`, pasando las observaciones, el mapa de detalles, el actor y el ciclo.
6. Registro del historial y adjuntos

   Guarda el estado inicial, el evento de creación, los adjuntos y, cuando corresponda, la petición de urgencia.
7. Respuesta al frontend

   Devuelve un objeto JSON con el UUID de la solicitud, estado, cantidades y mapa de detalles creados.

### Funcionamiento de la función interna de observaciones

La función:

```
fn_registrar_observaciones_creacion(
  p_solicitud_id,
  p_tipo_codigo,
  p_observaciones,
  p_mapa_detalles,
  p_actor,
  p_ciclo
)
```

realiza dos inserciones principales.

Primero crea una fila en `solicitud_observacion`:

```
INSERT INTO public.solicitud_observacion (
  solicitud_id,
  proposito_codigo,
  alcance_codigo,
  aplica_a_tipo,
  audiencia_role_codigo,
  texto,
  ciclo,
  lineas_snapshot,
  estado_codigo,
  creado_por_email,
  creado_por_role_codigo
)
VALUES (
  -- Valores calculados internamente
);
```

Los valores establecidos por el RPC son:

| Campo                   | Valor inicial                 |
| ----------------------- | ----------------------------- |
| `proposito_codigo`      | `indicacion_detalle`          |
| `alcance_codigo`        | `detalle`                     |
| `aplica_a_tipo`         | `producto` o `servicio`       |
| `audiencia_role_codigo` | `secretaria`                  |
| `estado_codigo`         | `activa`                      |
| `ciclo`                 | `1`                           |
| `lineas_snapshot`       | `null`                        |
| `creado_por_email`      | Email del usuario autenticado |

Posteriormente, la función busca el UUID real de cada detalle utilizando el mapa generado por el RPC principal y crea las relaciones en `solicitud_observacion_detalle`.

Por ejemplo:

Tabla `solicitud_observacion`

| ID     | Texto                                   |
| ------ | --------------------------------------- |
| OBS-01 | Comprar ambos filtros de la misma marca |
| OBS-02 | Verificar compatibilidad con el equipo  |

Tabla `solicitud_observacion_detalle`

| Observación | Detalle vinculado |
| ----------- | ----------------- |
| OBS-01      | Filtro P1951      |
| OBS-01      | Filtro BF1222     |
| OBS-02      | Filtro BF1222     |
| OBS-02      | Producto manual   |

Se usan identificadores abreviados para ilustrar las relaciones; la BD almacena UUID.

La función interna devuelve el número de observaciones creadas, no la cantidad de relaciones. En el ejemplo devuelve `2`, aunque se hayan insertado cuatro relaciones.

Si una referencia no corresponde a un detalle creado, la función genera una excepción. Como se ejecuta dentro de la operación de creación, un error provoca que se revierta la transacción de base de datos.

## 5. ¿Qué devuelve el RPC principal?

`rpc_crear_solicitud_compra_go` devuelve un `jsonb`.

Un ejemplo reducido de su respuesta, con identificadores ilustrativos, es:

```
{
  "solicitud_id": "UUID_SOLICITUD",
  "folio_sol": null,
  "tipo_codigo": "producto",
  "etapa_codigo": "cultivo",
  "estado_codigo": "para_revision_almacen",
  "prioridad_codigo": "normal",
  "ciclo_estado": 1,

  "productos_total": 3,
  "servicios_total": 0,
  "observaciones_total": 2,
  "destinos_total": 0,
  "adjuntos_total": 0,

  "detalles_creados": [
    {
      "tipo": "producto",
      "indice": 1,
      "temporal": false,
      "codigo_entrada": "T003-PT951",
      "codigo_generado": null,
      "producto_id": "UUID_PRODUCTO_1",
      "detalle_id": "UUID_DETALLE_1"
    },
    {
      "tipo": "producto",
      "indice": 2,
      "temporal": false,
      "codigo_entrada": "T003-BF1222",
      "codigo_generado": null,
      "producto_id": "UUID_PRODUCTO_2",
      "detalle_id": "UUID_DETALLE_2"
    },
    {
      "tipo": "producto",
      "indice": 3,
      "temporal": true,
      "codigo_entrada": null,
      "codigo_generado": "CODIGO_TEMPORAL_GENERADO",
      "producto_id": "UUID_PRODUCTO_3",
      "detalle_id": "UUID_DETALLE_3"
    }
  ],

  "peticion_urgente_creada": false
}
```

Hay tres detalles relevantes en esta respuesta:

1. `observaciones_total` indica cuántas observaciones se registraron, no cuántas líneas quedaron asociadas.
2. `detalles_creados` permite conocer los UUID definitivos de los productos o servicios, incluidos los temporales.
3. El RPC no devuelve los UUID individuales de las observaciones creadas. Para recuperarlas debe utilizarse el RPC de consulta.

El estado inicial depende de `p_enviar` y del tipo:

| Condición                       | `estado_codigo`          |
| ------------------------------- | ------------------------ |
| `p_enviar = false`              | `borrador`               |
| Productos con `p_enviar = true` | `para_revision_almacen`  |
| Servicios con `p_enviar = true` | `para_revision_gerencia` |

## 6. ¿Cómo consultar las observaciones después de crear?

Se utiliza:

`rpc_obtener_observaciones_solicitud`

### Parámetro de entrada

```
{
  "p_solicitud_id": "UUID_SOLICITUD"
}
```

### Respuesta

Este RPC devuelve varias filas, una por cada observación visible para el usuario.

Ejemplo de una fila:

```
{
  "observacion_id": "UUID_OBSERVACION",
  "proposito_codigo": "indicacion_detalle",
  "alcance_codigo": "detalle",
  "aplica_a_tipo": "producto",
  "audiencia_role_codigo": "secretaria",

  "texto": "Comprar ambos filtros de la misma marca.",

  "ciclo": 1,
  "lineas_snapshot": [1, 3],
  "estado_codigo": "activa",

  "creado_por_email": "usuario@empresa.com",
  "creado_por_role_codigo": "operativo",

  "created_at": "2026-10-15T20:00:00Z",
  "resolved_at": null,

  "detalles": [
    {
      "detalle_id": "UUID_DETALLE_1",
      "producto_id": "UUID_PRODUCTO_1",
      "cod_producto": "T003-PT951",
      "nombre": "FILTRO P1951",
      "linea_solicitud": 1,
      "activo": true,
      "ciclo": 1
    },
    {
      "detalle_id": "UUID_DETALLE_2",
      "producto_id": "UUID_PRODUCTO_2",
      "cod_producto": "T003-BF1222",
      "nombre": "FILTRO BF1222",
      "linea_solicitud": 3,
      "activo": true,
      "ciclo": 1
    }
  ]
}
```

Respuesta ilustrativa de una observación de productos después de la asignación de líneas. Los UUID, fechas y números de línea son ejemplos, no datos consultados de una solicitud real.

El campo `detalles` cambia según el tipo de solicitud:

- Productos: contiene identificadores, código, nombre, número de línea, estado activo y ciclo.
- Servicios: contiene `detalle_id`, `descripcion`, `cantidad`, `activo` y `ciclo`. No devuelve un número de línea para servicios.

Las observaciones generales de Gerencia tienen `detalles: []`.

### ¿Quién puede ver las observaciones?

| Rol                      | Regla actual                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| Supervisor (`operativo`) | Ve `indicacion_detalle` y `correccion_supervisor`                                                      |
| Gerencia                 | Ve todas                                                                                               |
| Admin                    | Ve todas                                                                                               |
| Secretaría               | Ve `indicacion_detalle` e `instruccion_secretaria` en los estados habilitados después de la aprobación |
| Almacén                  | No recibe observaciones desde este RPC                                                                 |

La aprobación de cada línea todavía no actúa como filtro individual de visibilidad para Secretaría. El RPC devuelve las observaciones permitidas por rol y estado general de la solicitud, incluidos los detalles relacionados que estén inactivos.

## 7. Qué sucede cuando Gerencia aprueba los productos

Inicialmente, las observaciones se relacionan con UUID, no con números de línea.

En la aprobación, `rpc_aprobar_solicitud` recibe `p_detalles_orden`, que puede contener UUID de detalles o objetos con `detalle_id`.

La función exige que el arreglo contenga exactamente una vez cada producto activo y asigna `linea_solicitud` según su posición.

Después ejecuta:

```
fn_actualizar_lineas_snapshot_observaciones(
  p_solicitud_id
)
```

Esta función toma las relaciones existentes, busca los números definitivos de cada producto activo y actualiza `lineas_snapshot`.

Ejemplo:

Antes de la aprobación

Observación A

Vinculada a dos UUID de detalles

lineas_snapshot = null

Después de la aprobación

Observación A

Vinculada a los mismos UUID

01

03

Los números son una referencia adicional: la relación real continúa siendo mediante UUID.

Si uno de los productos está inactivo, no se incluye en el arreglo actualizado de números de línea, pero la relación original permanece almacenada.

## 8. Reglas de validación actuales

| Situación                                             | Comportamiento del backend         |
| ----------------------------------------------------- | ---------------------------------- |
| `p_observaciones` vacío                               | Permitido; crea cero observaciones |
| Observación sin texto                                 | Rechaza                            |
| Observación sin productos ni servicios asociados      | Rechaza                            |
| Código de producto inexistente dentro de la solicitud | Rechaza                            |
| Índice temporal inexistente                           | Rechaza                            |
| Índice igual a 0 o negativo                           | Rechaza                            |
| Observación de servicio asociada a un producto        | Rechaza                            |
| Observación de producto asociada a un servicio        | Rechaza                            |
| Una observación con varias líneas                     | Permitido                          |
| Varias observaciones sobre una línea                  | Permitido                          |

Existe una limitación adicional: para productos de catálogo, la función identifica los detalles por código y utiliza el primer resultado coincidente (`LIMIT 1`). Por tanto, si se incluye dos veces el mismo código de producto en la misma solicitud, una observación por código no permite distinguir correctamente entre esas dos filas.

Para evitar esa ambigüedad, conviene impedir códigos duplicados en el formulario o modificar posteriormente el contrato para aceptar identificadores locales de fila.

## 9. Implementación en Vue 3 + TypeScript

Para la creación, el frontend debe mantener identificadores locales estables, independientes de la posición visible de las filas.

Un modelo recomendado:

```
interface ObservacionFormulario {
  id: string;
  texto: string;
  productoLocalIds: string[];
}
```

Antes de ejecutar el RPC, el frontend convierte esos identificadores a los formatos que acepta Supabase.

```
const observacionesPayload = observaciones.map(obs => {
  const seleccionados = obs.productoLocalIds
    .map(id => {
      const index = productos.findIndex(p => p.localId === id);

      if (index === -1) {
        throw new Error("Producto asociado no encontrado");
      }

      return { producto: productos[index], index };
    });

  return {
    texto: obs.texto.trim(),

    codigos_producto: seleccionados
      .filter(x => !x.producto.temporal)
      .map(x => x.producto.cod_producto),

    indices_temporales: seleccionados
      .filter(x => x.producto.temporal)
      .map(x => x.index + 1),

    indices_servicios: []
  };
});
```

Después se envía `observacionesPayload` dentro de `p_observaciones`, junto con `p_productos` en exactamente el mismo orden utilizado para calcular los índices.

### Qué está pendiente de implementar

Por último, hay que distinguir la creación de la modificación posterior:

| Funcionalidad                                                     | Situación actual                                                                            |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Crear observaciones por una o varias líneas durante la creación   | Implementado                                                                                |
| Recuperar sus asociaciones                                        | Implementado                                                                                |
| Conservar relaciones tras asignar números definitivos             | Implementado                                                                                |
| Modificar una observación desde la UI antes de enviar             | Puede resolverse con estado local de Vue                                                    |
| Editar el texto o cambiar líneas de una observación ya persistida | No hay un RPC específico implementado                                                       |
| Eliminar una observación ya persistida                            | No hay un RPC específico implementado                                                       |
| Guardar observaciones en la tabla `solicitud_compra_borrador`     | Existe columna `observaciones`, pero los RPC separados de borrador no reciben ese parámetro |

Conclusión para tu implementación: durante la creación, Vue administra las observaciones en memoria; cuando el Supervisor envía la solicitud, `rpc_crear_solicitud_compra_go` registra todo en una operación y retorna el resumen de los detalles creados. Para mostrar las observaciones después, debe utilizarse `rpc_obtener_observaciones_solicitud`. Para editar observaciones ya guardadas en la base de datos, sería necesario implementar una operación adicional.