# SPEC-01 — Modelo de datos frontend

> Módulo: Registro administrativo de jornadas  
> Estado: basada en tipos frontend; no es un contrato de Supabase.

## Objetivo

Documentar el modelo frontend compartido de la captura administrativa: estado, filas, datos generales, catálogos y datos tipados para crear un implemento. La fuente principal es `registroJornada.types.ts`.

## Alcance

- Declarar tipos, campos, nulabilidad y opcionalidad existentes.
- Distinguir el estado, los datos generales, las filas, los catálogos y el payload frontend de implemento.
- Registrar la única relación de resolución declarada: la actividad de una fila se resuelve automáticamente desde `codigo`.

## Fuera de alcance

- Formatos de fecha u hora, validación de formularios, continuidad, duración, orden de filas o traducción a eventos.
- Props, eventos, titularidad del estado, carga de catálogos y equipos.
- Tablas, columnas, parámetros, payloads, respuestas, errores o comportamiento de RPC/Supabase.
- Código, componentes, servicios, migraciones o RPC.

## Fuentes

| Fuente                                                                              | Uso en esta SPEC                                                                     |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `documentacion/formulario_captura_padas/registroJornada.types.ts`                   | Fuente principal de tipos, campos, nulabilidad, opcionalidad y resolución comentada. |
| `documentacion/formulario_captura_padas/INDEX_SPECS.md`                             | Jerarquía de fuentes, alcance recomendado y límites del HTML.                        |
| `documentacion/formulario_captura_padas/registro_jornada_integracion_completa.html` | Contexto visual únicamente; no modifica el contrato de tipos.                        |

No se verificó una firma real de Supabase: esta SPEC no documenta integración ni contratos RPC.

## Clasificación de evidencia

### Confirmado

- Los tipos son compartidos por los componentes de captura administrativa y no ejecutan RPC.
- `ActividadTipo` solo admite `labor` y `parada`.
- `JornadaState` extiende `JornadaDatosGeneralesModel`.
- `JornadaFilaModel` contiene un bloque de actividad comentado como resuelto automáticamente a partir de `codigo`.
- `CatalogosJornada` agrupa cuatro colecciones tipadas.

### Decisión de UI

- El HTML presenta fecha, operador, equipo, filas, observaciones e implemento. Es una referencia de presentación y jerarquía visual; no cambia los tipos ni sus restricciones.

### Ejemplo visual — no convertir en regla

- Fechas, horas, códigos, nombres, identificadores, números de equipo e implemento, placeholders y opciones concretas mostradas en el HTML.
- Cualquier firma, payload o comportamiento de RPC mostrado solo por el HTML.

### Pendiente

- Todo contrato de Supabase y toda regla de negocio no expresada por los tipos requiere sus fuentes específicas.

## Estado / modelo de datos

### Tipos base y catálogos

| Tipo                   | Campos declarados                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| `ActividadTipo`        | `'labor' \| 'parada'`                                                                                     |
| `OperadorOption`       | `id: string`; `nombre: string`                                                                            |
| `EquipoOption`         | `numero: string`; `etiqueta: string`; `area?: string \| null`                                             |
| `LaborCatalogo`        | `id: string`; `orden: number`; `nombre: string`; `activo: boolean`                                        |
| `TipoParadaCatalogo`   | `id: string`; `orden: number`; `nombre: string`; `activo: boolean`; `libera_labor_actual?: boolean`       |
| `ImplementoTipoOption` | `id: string`; `nombre: string`                                                                            |
| `ImplementoOption`     | `id: string`; `numero: string`; `nombre: string \| null`; `tipo_implemento_id: string`; `activo: boolean` |

Una propiedad que usa `?` puede omitirse. Esto es distinto de `null`: `EquipoOption.area` y `TipoParadaCatalogo.libera_labor_actual` son opcionales; si `area` existe, puede ser `string` o `null`.

### Datos generales y estado de jornada

| Modelo / campo                            | Tipo declarado       | Presencia                              |
| ----------------------------------------- | -------------------- | -------------------------------------- |
| `JornadaDatosGeneralesModel.fecha`        | `string \| null`     | Requerido en el objeto; admite `null`. |
| `JornadaDatosGeneralesModel.operadorId`   | `string \| null`     | Requerido en el objeto; admite `null`. |
| `JornadaDatosGeneralesModel.equipoNumero` | `string \| null`     | Requerido en el objeto; admite `null`. |
| `JornadaDatosGeneralesModel.area`         | `string \| null`     | Requerido en el objeto; admite `null`. |
| `JornadaState.observaciones`              | `string`             | Requerido; no admite `null`.           |
| `JornadaState.filas`                      | `JornadaFilaModel[]` | Requerido; colección de filas.         |

`JornadaState` extiende `JornadaDatosGeneralesModel`. No hay campos calculados declarados en estos tipos.

### Modelo de fila

| Campo             | Tipo declarado          | Presencia                    | Evidencia adicional                                                      |
| ----------------- | ----------------------- | ---------------------------- | ------------------------------------------------------------------------ |
| `idLocal`         | `string`                | Requerido; no admite `null`. | El nombre indica identificador local; su ciclo de vida no está definido. |
| `inicio`          | `string`                | Requerido; no admite `null`. | No se declara formato.                                                   |
| `fin`             | `string`                | Requerido; no admite `null`. | No se declara formato.                                                   |
| `codigo`          | `number \| null`        | Requerido; admite `null`.    | —                                                                        |
| `tipoActividad`   | `ActividadTipo \| null` | Requerido; admite `null`.    | Bloque comentado como resuelto desde `codigo`.                           |
| `actividadId`     | `string \| null`        | Requerido; admite `null`.    | Bloque comentado como resuelto desde `codigo`.                           |
| `actividadNombre` | `string`                | Requerido; no admite `null`. | Bloque comentado como resuelto desde `codigo`.                           |
| `implementoId`    | `string \| null`        | Requerido; admite `null`.    | —                                                                        |

### Catálogos agrupados

| Campo de `CatalogosJornada` | Tipo de elementos        |
| --------------------------- | ------------------------ |
| `labores`                   | `LaborCatalogo[]`        |
| `tiposParada`               | `TipoParadaCatalogo[]`   |
| `implementos`               | `ImplementoOption[]`     |
| `implementoTipos`           | `ImplementoTipoOption[]` |

### Datos frontend para crear un implemento

| Campo de `ImplementoCrearPayload` | Tipo declarado   | Presencia                           |
| --------------------------------- | ---------------- | ----------------------------------- |
| `numero`                          | `string`         | Requerido; no admite `null`.        |
| `tipoImplementoId`                | `string`         | Requerido; no admite `null`.        |
| `nombre`                          | `string \| null` | Opcional; si existe, admite `null`. |

Este tipo es un payload frontend. No se afirma que corresponda a parámetros, nombres o estructura de una RPC.

## Reglas funcionales

- La única clasificación de actividad declarada es `labor` o `parada`.
- La actividad de la fila se declara como resuelta automáticamente a partir de `codigo`.
- No se declara algoritmo, catálogos consultados, comportamiento ante ausencia/error ni momento de actualización de `tipoActividad`, `actividadId` y `actividadNombre`.
- `JornadaState` incorpora una colección de filas mediante `filas`.
- La ausencia de una propiedad opcional no equivale a `null`.

## Flujo

El archivo fuente no declara flujo de negocio ni de persistencia. Solo respalda esta relación estructural:

```text
JornadaDatosGeneralesModel
        ↓ extendido por
JornadaState ───────────────→ filas: JornadaFilaModel[]

CatalogosJornada ───────────→ labores / tiposParada / implementos / implementoTipos

JornadaFilaModel.codigo ────→ actividad resuelta automáticamente (comentario del tipo)
```

## Contrato entre componentes

Los tipos se describen como compartidos por componentes de captura administrativa. Esta fuente no declara props, eventos, enlaces de modelo ni qué componente posee el estado; por ello, esta SPEC no fija contratos de comunicación.

| Modelo compartido                      | Uso confirmado por su declaración                                             |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| `JornadaDatosGeneralesModel`           | Modelo de datos generales de jornada.                                         |
| `JornadaState`                         | Estado que añade observaciones y filas a los datos generales.                 |
| `JornadaFilaModel`                     | Modelo de una fila de jornada.                                                |
| `CatalogosJornada` y tipos de catálogo | Colecciones para labores, tipos de parada, implementos y tipos de implemento. |
| `ImplementoCrearPayload`               | Datos tipados para creación frontend de un implemento.                        |

## RPC involucrados

Ninguno confirmado por `registroJornada.types.ts`: el encabezado declara que el archivo no ejecuta RPC.

No se documentan RPC, firmas, parámetros, payloads, respuestas, tablas ni columnas. `ImplementoCrearPayload` no permite deducir un contrato de Supabase.

## Validaciones

La fuente expresa restricciones de forma de TypeScript: unión literal, tipos escalares, propiedades requeridas, propiedades opcionales y campos que admiten `null`.

No declara obligatoriedad de formulario, formato de fecha/hora, rangos, unicidad, continuidad temporal, reglas de creación de implemento ni mensajes de validación.

## Estados de error

No hay tipo, campo ni contrato de errores declarado. Los errores de carga, resolución de código, creación de implemento y persistencia requieren fuentes específicas.

## Responsive

El modelo TypeScript no define comportamiento responsive. El HTML propone una presentación responsive como decisión de UI; no añade campos ni reglas al modelo.

## Criterios de aceptación

- El documento identifica `ActividadTipo` exclusivamente como `'labor' | 'parada'`.
- El documento refleja que `JornadaState` extiende `JornadaDatosGeneralesModel` y añade `observaciones: string` y `filas: JornadaFilaModel[]`.
- Cada campo de `JornadaFilaModel` está documentado con tipo y nulabilidad, sin atribuir formatos a `inicio` o `fin`.
- El documento distingue campos opcionales de campos que admiten `null`.
- El documento incluye los cuatro grupos de `CatalogosJornada` y sus tipos de elemento.
- El documento refleja que `ImplementoCrearPayload.nombre` es opcional y, si existe, admite `null`.
- La resolución desde `codigo` se limita al comentario fuente; no se define algoritmo.
- No se presentan contratos RPC, tablas, columnas, parámetros, payloads ni respuestas como hechos.
- Los valores concretos del HTML se identifican como ejemplos visuales, no como reglas del modelo.

## Casos límite

- `codigo` puede ser `null`; el modelo no define cómo se representa o persiste esa condición.
- `tipoActividad` y `actividadId` pueden ser `null`; no se declara qué condición los genera.
- `actividadNombre` no admite `null`, pero el tipo no define su valor cuando `actividadId` es `null`.
- `EquipoOption.area` puede omitirse o ser `null`, mientras `JornadaDatosGeneralesModel.area` debe existir aunque admita `null`.
- `ImplementoCrearPayload.nombre` puede omitirse o ser `null`; la fuente no define si esas condiciones tienen semánticas distintas.
- `TipoParadaCatalogo.libera_labor_actual` puede omitirse; la fuente no define el significado de su ausencia.

## Pendientes / preguntas abiertas

| Información faltante                                                                 | Por qué es necesaria                                                                                      | Fuente que debe verificarse                                                                                      |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Formato y semántica de `fecha`, `inicio` y `fin`.                                    | Para documentar captura, visualización, validación y zona horaria sin suponer el formato de los `string`. | `JornadaDatosGenerales.vue`, `JornadaFila.vue`, `useJornadaAdmin.ts` y, si se persisten, firma real de Supabase. |
| Regla que resuelve `codigo` en `tipoActividad`, `actividadId` y `actividadNombre`.   | Para definir resultados válidos, inválidos o sin coincidencia.                                            | `JornadaFila.vue`, `useJornadaAdmin.ts` y catálogos reales aplicables.                                           |
| Significado y ciclo de vida de `idLocal`.                                            | Para saber si solo identifica una fila en UI o correlaciona con un dato persistido.                       | `RegistroJornadaPage.vue`, `JornadaDetalle.vue`, `JornadaFila.vue` y `useJornadaAdmin.ts`.                       |
| Semántica de ausencia frente a `null` para `area`, `libera_labor_actual` y `nombre`. | Para serializar y validar sin colapsar valores potencialmente distintos.                                  | Componentes consumidores, `useJornadaAdmin.ts` y firma real de Supabase si se persisten.                         |
| Correspondencia entre `ImplementoCrearPayload` y una operación de creación.          | Para no convertir un tipo frontend en una firma RPC inferida.                                             | `registroJornada.service.ts` y firma real de `rpc_admin_registrar_implemento` en Supabase.                       |
| Estados de carga y error.                                                            | Para especificar retroalimentación de UI y recuperación ante fallos.                                      | `RegistroJornadaPage.vue`, `useJornadaAdmin.ts` y `registroJornada.service.ts`.                                  |

## Tabla de trazabilidad

| Regla o dato documentado                                                                                  | Clasificación  | Fuente exacta                                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Los tipos son compartidos por componentes de captura administrativa y no ejecutan RPC.                    | Confirmado     | `documentacion/formulario_captura_padas/registroJornada.types.ts`, líneas 1-6.                                                                                                          |
| `ActividadTipo` admite únicamente `labor` y `parada`.                                                     | Confirmado     | `documentacion/formulario_captura_padas/registroJornada.types.ts`, línea 8.                                                                                                             |
| Opciones y catálogos declaran los campos, nulabilidad y opcionalidad documentados.                        | Confirmado     | `documentacion/formulario_captura_padas/registroJornada.types.ts`, líneas 10-47.                                                                                                        |
| `JornadaFilaModel` y sus campos son los declarados por la interfaz.                                       | Confirmado     | `documentacion/formulario_captura_padas/registroJornada.types.ts`, líneas 49-61.                                                                                                        |
| La actividad se resuelve automáticamente a partir del código.                                             | Confirmado     | `documentacion/formulario_captura_padas/registroJornada.types.ts`, línea 55.                                                                                                            |
| `JornadaState` extiende los datos generales y añade observaciones y filas.                                | Confirmado     | `documentacion/formulario_captura_padas/registroJornada.types.ts`, líneas 63-73.                                                                                                        |
| `CatalogosJornada` agrupa cuatro colecciones.                                                             | Confirmado     | `documentacion/formulario_captura_padas/registroJornada.types.ts`, líneas 75-80.                                                                                                        |
| `ImplementoCrearPayload` declara número, tipo de implemento y nombre opcional.                            | Confirmado     | `documentacion/formulario_captura_padas/registroJornada.types.ts`, líneas 82-86.                                                                                                        |
| El HTML sirve para presentación, no para contratos definitivos de tipos o RPC.                            | Decisión de UI | `documentacion/formulario_captura_padas/INDEX_SPECS.md`, líneas 36-66 y 483-508; `documentacion/formulario_captura_padas/registro_jornada_integracion_completa.html`, líneas 1010-1399. |
| El alcance recomendado de SPEC-01 incluye estado, filas, catálogos, IDs, nulabilidad y campos calculados. | Confirmado     | `documentacion/formulario_captura_padas/INDEX_SPECS.md`, sección 8, «SPEC-01 — Modelo de datos frontend».                                                                               |