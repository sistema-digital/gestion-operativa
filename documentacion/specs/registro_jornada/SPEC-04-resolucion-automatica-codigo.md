# SPEC-04 — Resolución automática de código

## Objetivo

Documentar cómo una fila de jornada resuelve el código ingresado por la persona usuaria contra los catálogos precargados, para obtener el tipo interno de actividad, su identificador y su nombre visible.

## Alcance

- Buscar un código numérico en `CatalogosJornada.labores` y, si no se resuelve allí, en `CatalogosJornada.tiposParada`.
- Aplicar la prioridad de labor sobre parada establecida por las implementaciones actuales.
- Actualizar `tipoActividad`, `actividadId` y `actividadNombre` de `JornadaFilaModel`.
- Mostrar el nombre resuelto como un campo de solo lectura en `JornadaFila`.
- Describir el estado para código vacío y para código no reconocido.
- Delimitar que la fila resuelve visualmente con catálogos recibidos; no ejecuta RPC directamente.

## Fuera de alcance

- Carga, actualización y procedencia de los catálogos.
- Persistencia de la fila o traducción de filas a eventos administrativos.
- Contratos, parámetros, respuestas o secuencias de RPC.
- Reglas de unicidad de `orden` dentro de un catálogo o entre ambos catálogos.
- Normalización de ceros a la izquierda, longitud máxima, sugerencias de códigos o búsqueda remota.
- Validación de jornada distinta de la comprobación que el composable actual ya realiza sobre la fila.

## Fuentes

Se siguió el orden y la jerarquía de fuentes de `documentacion/formulario_captura_padas/INDEX_SPECS.md` y se revisaron únicamente:

- `documentacion/formulario_captura_padas/registro_jornada_integracion_completa.html` — referencia visual y ejemplos.
- `documentacion/formulario_captura_padas/registroJornada.types.ts` — tipos de catálogos y fila.
- `documentacion/formulario_captura_padas/components/JornadaFila.vue` — resolución y presentación de una fila.
- `documentacion/formulario_captura_padas/composables/useJornadaAdmin.ts` — función reutilizable de resolución y validación previa a finalizar.

No se verificó una firma real de Supabase: no fue accesible desde las fuentes autorizadas para esta SPEC y la resolución de código no requiere una llamada RPC directa en `JornadaFila`.

## Clasificación de evidencia

- **Confirmado:** comportamiento o dato presente en tipos TypeScript o en la implementación Vue/composable revisada.
- **Decisión de UI:** presentación o interacción visible respaldada por `JornadaFila.vue` o la referencia HTML; no constituye por sí misma una regla de backend.
- **Ejemplo visual:** dato o interacción del HTML que ilustra el diseño; no se convierte en regla funcional.
- **Pendiente:** dato necesario que las fuentes revisadas no confirman.

## Modelo de datos relevante

**Confirmado** en `registroJornada.types.ts`:

- `ActividadTipo` admite `labor` o `parada`.
- `LaborCatalogo` y `TipoParadaCatalogo` tienen `id`, `orden`, `nombre` y `activo`; la parada además puede incluir `libera_labor_actual`.
- `CatalogosJornada` expone los arreglos `labores` y `tiposParada`.
- `JornadaFilaModel.codigo` es `number | null`.
- El resultado almacenado en cada fila es `tipoActividad: ActividadTipo | null`, `actividadId: string | null` y `actividadNombre: string`.

**Pendiente:** el significado de `libera_labor_actual` no se utiliza en la resolución revisada; cualquier efecto sobre la resolución o persistencia requiere otra fuente.

## Resolución por código

**Confirmado** en `JornadaFila.vue` y `useJornadaAdmin.ts`:

1. Si `codigo` es `null`, se asignan `tipoActividad = null`, `actividadId = null` y `actividadNombre = ''`.
2. Se busca una labor activa cuyo `orden` sea exactamente igual al código.
3. Si se encuentra, se asignan el tipo `labor`, el `id` y el `nombre` de esa labor.
4. Si no se encuentra una labor, se busca un tipo de parada activo cuyo `orden` sea exactamente igual al código.
5. Si se encuentra, se asignan el tipo `parada`, el `id` y el `nombre` del tipo de parada.
6. Si no hay coincidencia activa en ninguno de los dos catálogos, se asignan `tipoActividad = null`, `actividadId = null` y `actividadNombre = 'Código no reconocido'`.

**Confirmado:** `JornadaFila.vue` observa cambios en `model.codigo` y ejecuta su resolución local. El composable también expone `resolverCodigo(codigo, catalogos)` con el mismo orden de búsqueda y la misma forma de resultado.

**Pendiente:** no hay una fuente que confirme si el código debe resolverse al crear o hidratar una fila con un código ya presente, además de cuando cambia `codigo`.

## Prioridad de búsqueda

**Confirmado:** la búsqueda es `labor.orden` primero y `tipo_parada.orden` después. Por tanto, si un mismo valor coincide con una labor activa y una parada activa, la resolución actual elige la labor.

**Pendiente:** las fuentes no definen si esa coincidencia entre catálogos debe impedirse, permitirse o resolverse de otro modo en backend.

## Estados de la actividad resuelta

| Estado                                                 | Resultado del modelo                                                         | Clasificación |
| ------------------------------------------------------ | ---------------------------------------------------------------------------- | ------------- |
| Código vacío (`null`)                                  | Tipo e ID en `null`; nombre vacío.                                           | Confirmado    |
| Labor activa encontrada                                | Tipo `labor`; ID y nombre de la labor.                                       | Confirmado    |
| Parada activa encontrada, sin labor activa coincidente | Tipo `parada`; ID y nombre de la parada.                                     | Confirmado    |
| Sin coincidencia activa                                | Tipo e ID en `null`; nombre `Código no reconocido`.                          | Confirmado    |
| Código que solo coincide con un registro inactivo      | Se trata como sin coincidencia, porque ambas búsquedas filtran por `activo`. | Confirmado    |

**Decisión de UI:** el nombre de actividad se presenta en un `input` de solo lectura. Cuando el tipo es `parada`, el componente aplica la clase de tema `bg-warning-bg` al campo; la fuente no establece una presentación especial para el código no reconocido.

**Ejemplo visual:** el HTML ilustra el mensaje de actividad vacío con el texto «Ingrese un código», la detección de parada y una apariencia de error para un código no reconocido. Esos detalles no están implementados por `JornadaFila.vue` y no se especifican como obligación funcional.

## Flujo

```text
Persona usuaria cambia código en JornadaFila
        ↓
watch de codigo ejecuta resolverCodigo local
        ↓
labor activa por orden
        ↓ si no existe
tipo de parada activo por orden
        ↓
actualización de tipoActividad, actividadId y actividadNombre
```

**Confirmado:** la fila recibe los catálogos mediante la prop `catalogos` y no declara RPC directo.

**Pendiente:** el momento, responsable y mecanismo de carga o actualización de esos catálogos no pertenecen a las fuentes de esta SPEC.

## Contrato entre componentes

**Confirmado** en `JornadaFila.vue`:

- El modelo bidireccional requerido es `JornadaFilaModel`.
- Las props son `numero: number` y `catalogos: CatalogosJornada`.
- Los únicos eventos declarados son `eliminar` y `crear-implemento`.
- La actividad resuelta forma parte del modelo de la fila; no existe un evento específico de «actividad resuelta».

**Decisión de UI:** la persona usuaria escribe el código; el campo «Labor / causa» es de solo lectura. No hay selector visual del tipo de actividad.

## RPC involucrados

**Confirmado:** `JornadaFila.vue` no llama RPC directamente. `useJornadaAdmin.ts` importa un servicio, pero su función `finalizarDesdeFilas` está marcada como punto de integración pendiente y no ejecuta la secuencia administrativa.

**Pendiente:** falta verificar en Supabase la firma real de los RPC que podrían consumir `actividadId` y `tipoActividad` al persistir una jornada. Esta información es necesaria para documentar parámetros, payloads, respuestas, errores e idempotencia sin inferirlos. Debe verificarse en la definición real de las funciones RPC de Supabase, no en el HTML, comentarios o nombres de métodos del frontend.

## Validaciones

**Confirmado** en `useJornadaAdmin.ts`: `validarContinuidad` rechaza una fila si no tiene `inicio`, `fin`, `codigo` o `actividadId`; por ello un código vacío o no reconocido no pasa esa validación mientras `actividadId` permanezca en `null`.

**Pendiente:** no se confirma una validación de formato, rango, cantidad de dígitos, normalización, unicidad o disponibilidad remota del código. Tampoco se confirma una validación de `tipoActividad` separada de `actividadId`.

## Estados de error

**Confirmado:** para una resolución sin coincidencia activa, el nombre visible queda como `Código no reconocido` y el ID de actividad queda en `null`.

**Confirmado:** al finalizar desde filas, una validación no satisfactoria se convierte en un `Error` con el mensaje retornado por `validarContinuidad`; el composable guarda el mensaje en su ref `error`.

**Pendiente:** no hay manejo confirmado de errores de carga de catálogos, de RPC, de red o de concurrencia relacionado específicamente con resolver un código.

## Responsive

**Confirmado** en `JornadaFila.vue`: en el tamaño base la fila usa una cuadrícula compacta y las etiquetas de los campos se muestran; desde `md` cambia a una cuadrícula de columnas y las etiquetas de cada campo se ocultan.

**Decisión de UI** en el HTML: bajo el punto de corte móvil mostrado, la tabla se presenta como tarjetas compactas y el campo de actividad conserva la etiqueta «Labor / causa». La referencia visual no altera la regla de resolución.

## Criterios de aceptación

- Dado un código que coincide con `orden` de una labor activa, al resolverlo la fila contiene `tipoActividad = 'labor'`, el `actividadId` de esa labor y su `actividadNombre`.
- Dado un código que no coincide con una labor activa y sí con `orden` de una parada activa, al resolverlo la fila contiene `tipoActividad = 'parada'`, el `actividadId` de esa parada y su `actividadNombre`.
- Dado un código que coincide con labor activa y parada activa, la resolución actual devuelve la labor.
- Dado `codigo = null`, al resolverlo la fila deja tipo e ID en `null` y el nombre vacío.
- Dado un código sin coincidencia activa, al resolverlo la fila deja tipo e ID en `null` y muestra `Código no reconocido` como nombre de actividad.
- Al cambiar `model.codigo` en `JornadaFila`, se ejecuta la resolución local sin que el componente invoque un RPC.
- El campo de actividad resuelta no permite edición manual desde `JornadaFila`.

## Casos límite

- **Confirmado:** una coincidencia en un elemento inactivo no resuelve la actividad, porque la búsqueda exige `activo`.
- **Confirmado:** si ambos catálogos tienen una coincidencia activa, la labor prevalece por el orden de búsqueda.
- **Pendiente:** códigos negativos, decimales, cero, valores no numéricos, ceros a la izquierda y valores fuera de rango no tienen una regla confirmada.
- **Pendiente:** no hay una regla confirmada para catálogos vacíos, catálogos aún cargando o catálogos que cambian después de resolver una fila.
- **Pendiente:** no se confirma el comportamiento si existen varias entradas activas con el mismo `orden` dentro de un mismo catálogo; `find` tomaría la primera entrada del arreglo, pero esa observación de implementación no define una regla de negocio.

## Pendientes / preguntas abiertas

- ¿Las definiciones reales de Supabase garantizan que labor y tipo de parada disponen del código equivalente a `orden`, y cuál es su restricción de unicidad? Es necesaria para decidir si la prioridad de frontend cubre una ambigüedad válida o un dato inconsistente. Verificar los catálogos y/o funciones reales en Supabase.
- ¿Qué RPC recibe el resultado de resolución y con qué parámetros, payload, respuesta y errores? Es necesario para documentar persistencia sin inventar contratos. Verificar las firmas reales de las funciones RPC de Supabase.
- ¿Cuándo deben resolverse filas iniciales o hidratadas con código preexistente? Es necesario para cubrir carga y edición sin asumir que el `watch` se ejecuta inicialmente. Verificar el componente padre o una especificación de hidratación.
- ¿Debe la UI bloquear la edición o finalización al no reconocer un código, y qué mensaje accesible debe mostrar? La implementación actual bloquea por ausencia de `actividadId` durante `validarContinuidad`, pero no define una política de interacción completa. Verificar la SPEC de validaciones y errores.
- ¿Debe conservarse, normalizarse o rechazarse el formato con ceros a la izquierda? El tipo actual es numérico y la implementación comparativa es numérica; el HTML solo ilustra valores de tres dígitos. Verificar una regla de negocio o catálogo real.

## Tabla de trazabilidad

| Regla o dato                                                                                              | Clasificación  | Fuente exacta                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Forma de `JornadaFilaModel`, `CatalogosJornada`, labor y parada                                           | Confirmado     | `documentacion/formulario_captura_padas/registroJornada.types.ts` — interfaces `JornadaFilaModel`, `CatalogosJornada`, `LaborCatalogo` y `TipoParadaCatalogo`                                      |
| Buscar labor activa por `orden` antes que parada activa por `orden`                                       | Confirmado     | `documentacion/formulario_captura_padas/components/JornadaFila.vue` — función `resolverCodigo`; `documentacion/formulario_captura_padas/composables/useJornadaAdmin.ts` — función `resolverCodigo` |
| Resultado para código vacío y no reconocido                                                               | Confirmado     | `documentacion/formulario_captura_padas/components/JornadaFila.vue` — función `resolverCodigo`; `documentacion/formulario_captura_padas/composables/useJornadaAdmin.ts` — función `resolverCodigo` |
| Resolución al cambiar `model.codigo`                                                                      | Confirmado     | `documentacion/formulario_captura_padas/components/JornadaFila.vue` — `watch(() => model.value.codigo, resolverCodigo)`                                                                            |
| La actividad se muestra como solo lectura y parada usa el token de advertencia                            | Decisión de UI | `documentacion/formulario_captura_padas/components/JornadaFila.vue` — input de `actividadNombre` y clase condicional `bg-warning-bg`                                                               |
| Catálogos recibidos por prop y ausencia de RPC directo en la fila                                         | Confirmado     | `documentacion/formulario_captura_padas/components/JornadaFila.vue` — `defineProps`, comentario de cabecera y ausencia de llamadas RPC                                                             |
| Validación de `codigo` y `actividadId` antes de finalizar                                                 | Confirmado     | `documentacion/formulario_captura_padas/composables/useJornadaAdmin.ts` — función `validarContinuidad`                                                                                             |
| Tarjetas móviles, textos de ayuda, lista de códigos, relleno a tres dígitos y estilos de error del mockup | Ejemplo visual | `documentacion/formulario_captura_padas/registro_jornada_integracion_completa.html` — estilos móviles, `actividadPorCodigo` y `actualizarActividadDesdeCodigo`                                     |
| Firma y contrato de RPC, unicidad de códigos y reglas de persistencia                                     | Pendiente      | No verificado en una firma real de Supabase; verificar las definiciones reales de Supabase                                                                                                         |
