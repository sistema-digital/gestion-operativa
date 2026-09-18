# SPEC-04 — Resolución automática de código

## Objetivo

Documentar la resolución local de un código de actividad ingresado en una fila de jornada: consulta de catálogos precargados, prioridad entre labor y parada, y actualización de la actividad resuelta. Esta SPEC no define persistencia ni contratos de backend.

## Alcance

- Resolver `JornadaFilaModel.codigo` contra `CatalogosJornada.labores` y `CatalogosJornada.tiposParada`.
- Priorizar una labor activa antes de una parada activa cuando ambas coincidan por `orden`.
- Actualizar `tipoActividad`, `actividadId` y `actividadNombre` en la fila, o devolver esos mismos tres campos desde el composable.
- Documentar los estados de código vacío y código no reconocido, la presentación de la actividad y el contrato local del componente.

## Fuera de alcance

- Carga, actualización o vigencia de los catálogos.
- Unicidad de `orden` dentro de un catálogo o entre ambos catálogos.
- Reglas de negocio para actividades inactivas más allá de que no participan en la búsqueda actual.
- Persistencia de filas, traducción a eventos administrativos y secuencia de transiciones.
- Nombres de parámetros, payloads, respuestas o errores de RPC.
- Reglas sobre formato, longitud, ceros a la izquierda o normalización del código fuera de los ejemplos visuales.

## Fuentes

1. `documentacion/formulario_captura_padas/INDEX_SPECS.md` — jerarquía de fuentes y orden de lectura.
2. `documentacion/formulario_captura_padas/registro_jornada_integracion_completa.html` — referencia visual, tratada como tal.
3. `documentacion/formulario_captura_padas/registroJornada.types.ts` — tipos de fila y catálogos.
4. `documentacion/formulario_captura_padas/components/JornadaFila.vue` — comportamiento y presentación de la fila.
5. `documentacion/formulario_captura_padas/composables/useJornadaAdmin.ts` — función de resolución y validación local.

No se verificó una firma real de Supabase: no es necesaria para confirmar la resolución local y las fuentes revisadas no exponen un RPC directo para ella.

## Clasificación de evidencia

- **Confirmado:** comportamiento o forma de datos implementados en los tipos, componente o composable revisados.
- **Decisión de UI:** interacción o presentación respaldada por `JornadaFila.vue` o por el HTML; no amplía reglas de negocio ni de persistencia.
- **Ejemplo visual:** contenido o comportamiento del HTML que ilustra el diseño, pero no se convierte en una regla funcional.
- **Pendiente:** información necesaria para implementar, integrar o validar que las fuentes revisadas no confirman.

## Modelo de datos relevante

**Confirmado.** `ActividadTipo` admite `labor` o `parada`. `JornadaFilaModel` contiene `codigo: number | null`, `tipoActividad: ActividadTipo | null`, `actividadId: string | null` y `actividadNombre: string`; el comentario del tipo indica que estos últimos tres campos se resuelven automáticamente a partir del código.

**Confirmado.** Cada elemento de `LaborCatalogo` y `TipoParadaCatalogo` aporta `id`, `orden`, `nombre` y `activo`. `CatalogosJornada` agrupa las colecciones `labores` y `tiposParada` usadas para resolver la actividad.

**Pendiente.** No se confirma el origen de estos catálogos, su actualización, ni una garantía de unicidad de `orden`.

## Resolución por código

**Confirmado.** Cuando cambia `model.codigo`, `JornadaFila.vue` ejecuta su resolución local. `useJornadaAdmin.ts` también expone `resolverCodigo(codigo, catalogos)`, que devuelve el subconjunto `tipoActividad`, `actividadId` y `actividadNombre` de la fila.

**Confirmado.** Si una labor activa coincide, el resultado es:

```text
tipoActividad = labor
actividadId = labor.id
actividadNombre = labor.nombre
```

**Confirmado.** Si no hay labor activa coincidente y una parada activa coincide, el resultado usa `parada.id` y `parada.nombre`, con `tipoActividad = parada`.

**Decisión de UI.** La persona usuaria ingresa el código; el campo de labor/causa se muestra de solo lectura. No hay selector manual de tipo de actividad en `JornadaFila.vue`.

**Ejemplo visual.** El HTML muestra códigos de tres dígitos, ceros a la izquierda y un `padStart(3, '0')` en su script demostrativo. Esto no se formaliza como regla: la implementación Vue recibe un `number | null` y no contiene esa normalización ni un límite de longitud.

## Prioridad de búsqueda

**Confirmado.** La búsqueda compara igualdad estricta entre el código y `orden`, y solo considera entradas con `activo` verdadero:

1. `catalogos.labores` por `orden`.
2. Si no se encuentra una labor activa, `catalogos.tiposParada` por `orden`.

Por lo tanto, si ambos catálogos contienen el mismo `orden` activo, la resolución local resulta en `labor`.

**Pendiente.** No se confirma si dicha colisión debe evitarse, advertirse o resolverse de otra forma en backend.

## Estados de la actividad resuelta

| Estado                                         | Resultado local                                                                                                                                     | Clasificación                                                   |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Código vacío / nulo                            | `tipoActividad` y `actividadId` se establecen en `null`; `actividadNombre` queda vacío.                                                             | Confirmado para `codigo == null`                                |
| Labor activa reconocida                        | Se asignan tipo `labor`, ID y nombre de la labor.                                                                                                   | Confirmado                                                      |
| Parada activa reconocida                       | Se asignan tipo `parada`, ID y nombre de la parada, solo después de no encontrar una labor activa.                                                  | Confirmado                                                      |
| Código no reconocido o sin coincidencia activa | `tipoActividad` y `actividadId` quedan en `null`; `actividadNombre` toma el texto `Código no reconocido`.                                           | Confirmado                                                      |
| Presentación de parada                         | La salida de actividad agrega el token de presentación `bg-warning-bg` cuando `tipoActividad` es `parada`.                                          | Decisión de UI                                                  |
| Presentación de código vacío o no reconocido   | El HTML ilustra placeholder, estado visual de error y validación nativa; el componente Vue no implementa esas señales para el código no reconocido. | Ejemplo visual; pendiente de definición para la UI implementada |

## Flujo

```text
Código de la fila cambia
        ↓
¿código es null?
 ├─ Sí → limpiar tipo, ID y nombre
 └─ No → buscar labor activa por orden
             ↓
        ¿encontrada?
         ├─ Sí → resolver como labor
         └─ No → buscar parada activa por orden
                    ↓
               ¿encontrada?
                ├─ Sí → resolver como parada
                └─ No → marcar «Código no reconocido»
```

**Confirmado.** `JornadaFila.vue` observa el cambio de `codigo` y actualiza directamente el modelo. El composable ofrece el mismo resultado como valor de retorno, sin que esta SPEC establezca cuál de ambas rutas debe ser la única fuente de verdad.

**Pendiente.** No se confirma cuándo se cargan los catálogos ni qué debe ocurrir si el código ya tiene valor antes de que cambie, o antes de que los catálogos estén disponibles.

## Contrato entre componentes

**Confirmado.** `JornadaFila.vue` recibe `numero` y `catalogos: CatalogosJornada`, y expone un `defineModel<JornadaFilaModel>` requerido. El componente modifica en ese modelo los tres campos resueltos.

**Confirmado.** El componente emite únicamente `eliminar` y `crear-implemento`. Ninguno de esos eventos representa resolución de código, guardado o llamada a RPC.

**Decisión de UI.** El valor de `actividadNombre` se muestra en un campo `readonly`; el campo de código usa entrada numérica mediante `inputmode="numeric"`.

**Pendiente.** No hay en las fuentes revisadas un contrato que anuncie al padre la resolución como evento independiente, ni una política para impedir que otro consumidor modifique los campos resueltos.

## RPC involucrados

**Confirmado.** `JornadaFila.vue` declara que no ejecuta RPC y utiliza catálogos precargados por el padre.

**Confirmado.** El composable enumera RPC administrativos como destino futuro de la traducción de filas, pero `finalizarDesdeFilas` lanza explícitamente un error indicando que esa secuencia sigue pendiente de conexión. Esa lista no constituye una firma ni un contrato de RPC.

**Pendiente.** Para documentar cualquier RPC relacionado con carga de catálogos o persistencia de una actividad resuelta se debe verificar la firma real en Supabase: nombre del RPC, parámetros tipados, respuesta, errores y reglas de ejecución. Es necesaria porque las fuentes revisadas no los proporcionan; la fuente a verificar es la definición real del RPC en Supabase.

## Validaciones

**Confirmado.** `validarContinuidad` rechaza una colección sin filas. Para cada fila rechaza ausencia de `inicio`, `fin`, `codigo` o `actividadId`; también rechaza un fin no posterior al inicio y discontinuidad entre filas consecutivas.

**Confirmado.** En esa validación, la condición `!fila.codigo` trata `0` como incompleto, aunque la resolución de código solo considera vacío el valor `null`.

**Pendiente.** No se confirma si el código `0` es válido, si el código debe ser requerido durante la edición, ni qué validación debe mostrar la fila antes de finalizar. Tampoco se confirma una validación de unicidad, rango, longitud o formato del código.

## Estados de error

**Confirmado.** Para una coincidencia ausente, la resolución asigna el texto `Código no reconocido` y limpia tipo e ID. Durante `finalizarDesdeFilas`, si falla la continuidad se lanza el mensaje de validación; el composable mantiene `error: string | null` y usa `Error desconocido` solo para una excepción que no sea instancia de `Error`.

**Decisión de UI.** El HTML ilustra que un código no reconocido puede usar validación nativa y tokens semánticos de peligro. Esa interacción no está implementada en `JornadaFila.vue` y no se prescribe aquí.

**Pendiente.** No se documentan errores de catálogo, reintentos, indisponibilidad de red ni errores de Supabase para esta resolución.

## Responsive

**Decisión de UI.** En el tamaño base, `JornadaFila.vue` usa una cuadrícula de tarjeta y muestra etiquetas por campo; desde el modificador `md` cambia a una cuadrícula de columnas y oculta esas etiquetas. El resultado de actividad sigue siendo de solo lectura en ambos formatos.

**Pendiente.** No se confirman requisitos de accesibilidad adicionales, mensajes asistivos para una actividad no reconocida ni comportamiento de foco después de resolver un código.

## Criterios de aceptación

1. Con una labor activa cuyo `orden` sea igual al código de la fila, al cambiar el código la fila muestra su nombre y contiene su ID y `tipoActividad = labor`.
2. Sin una labor activa coincidente y con una parada activa cuyo `orden` sea igual al código, la fila muestra el nombre de la parada y contiene su ID y `tipoActividad = parada`.
3. Con coincidencias activas en ambos catálogos para el mismo código, el resultado es la labor.
4. Con `codigo = null`, la fila queda con tipo e ID nulos y nombre vacío.
5. Con un código que no coincide con una entrada activa, la fila queda con tipo e ID nulos y muestra `Código no reconocido`.
6. La interfaz no ofrece un control para seleccionar manualmente `labor` o `parada`; el nombre resuelto se presenta en un campo de solo lectura.
7. La resolución de una fila no llama un RPC directamente.
8. La validación de continuidad no permite finalizar una fila sin `actividadId`.

## Casos límite

- **Confirmado:** un código que solo coincide con una entrada inactiva termina como no reconocido, porque ambas búsquedas exigen `activo`.
- **Confirmado:** el valor `0` no se considera nulo para resolver, pero sí se considera incompleto en `validarContinuidad` por la condición actual basada en valor falsy.
- **Pendiente:** dos entradas activas con el mismo `orden` dentro del mismo catálogo: la búsqueda actual tomaría la primera coincidencia, pero no hay una regla de negocio que lo respalde.
- **Pendiente:** una coincidencia activa en ambos catálogos: la prioridad local es labor, pero falta confirmar si esa colisión está permitida por negocio.
- **Pendiente:** cambios de catálogos después de una resolución, carga asíncrona de catálogos, y edición de un código con ceros a la izquierda.

## Pendientes / preguntas abiertas

1. Verificar en Supabase cuál es el RPC —si existe— que entrega `labores` y `tiposParada`, incluyendo firma real, respuesta tipada y criterio de `activo`. Es necesaria para confirmar que los campos frontend `orden`, `id`, `nombre` y `activo` corresponden al contrato real; la fuente requerida es la definición del RPC en Supabase.
2. Confirmar si `orden` debe ser único dentro de cada catálogo y globalmente entre labores y paradas. Sin esa regla no puede definirse una política de colisiones más allá de la prioridad local actual.
3. Confirmar la regla de formato del código: longitud, ceros a la izquierda, rango y si `0` es admisible. El HTML solo aporta ejemplos visuales y la validación actual trata `0` de forma distinta de la resolución.
4. Confirmar el tratamiento de catálogos no cargados, desactualizados o con error; las fuentes revisadas no describen estados de carga ni recuperación.
5. Confirmar el patrón de UI para código no reconocido en la implementación Vue: mensaje, accesibilidad, bloqueo durante edición y token visual. El HTML es demostrativo y no constituye requisito.
6. Verificar las firmas reales de los RPC administrativos antes de documentar transiciones o persistencia. El composable solo los menciona como integración pendiente y no contiene llamadas implementadas.

## Tabla de trazabilidad

| Regla o dato                                                             | Clasificación  | Fuente exacta                                                                                              |
| ------------------------------------------------------------------------ | -------------- | ---------------------------------------------------------------------------------------------------------- |
| Tipos `labor` y `parada`                                                 | Confirmado     | `registroJornada.types.ts`, líneas 8 y 49–61                                                               |
| Catálogos y campos `id`, `orden`, `nombre`, `activo`                     | Confirmado     | `registroJornada.types.ts`, líneas 21–34 y 75–80                                                           |
| Búsqueda de labor activa antes de parada activa                          | Confirmado     | `components/JornadaFila.vue`, líneas 40–68; `composables/useJornadaAdmin.ts`, líneas 47–74                 |
| Código nulo limpia tipo, ID y nombre                                     | Confirmado     | `components/JornadaFila.vue`, líneas 41–46; `composables/useJornadaAdmin.ts`, líneas 51–53                 |
| Sin coincidencia se muestra `Código no reconocido`                       | Confirmado     | `components/JornadaFila.vue`, líneas 65–67; `composables/useJornadaAdmin.ts`, línea 73                     |
| La resolución se activa al cambiar el código                             | Confirmado     | `components/JornadaFila.vue`, línea 70                                                                     |
| Campo de actividad de solo lectura y sin selector de tipo                | Decisión de UI | `components/JornadaFila.vue`, líneas 101–113; `registro_jornada_integracion_completa.html`, líneas 913–920 |
| Diferenciación visual de parada con token de tema                        | Decisión de UI | `components/JornadaFila.vue`, línea 112                                                                    |
| Código de tres dígitos, relleno con ceros y validación nativa del mockup | Ejemplo visual | `registro_jornada_integracion_completa.html`, líneas 1691–1734                                             |
| No hay RPC directo en la fila                                            | Confirmado     | `components/JornadaFila.vue`, líneas 20–21                                                                 |
| RPC administrativos listados, pero integración pendiente                 | Confirmado     | `composables/useJornadaAdmin.ts`, líneas 86–112                                                            |
| Validación de actividad resuelta mediante `actividadId`                  | Confirmado     | `composables/useJornadaAdmin.ts`, líneas 28–45                                                             |
| Contrato de modelo, props y eventos de la fila                           | Confirmado     | `components/JornadaFila.vue`, líneas 28–38 y 116–122                                                       |
| Fuente de catálogo, unicidad, formato de código y contratos RPC          | Pendiente      | Ausente de las fuentes revisadas; requiere definición real del RPC en Supabase y regla de negocio          |
