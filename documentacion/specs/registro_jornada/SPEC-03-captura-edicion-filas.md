# SPEC-03 — Captura y edición de filas

## Objetivo

Documentar el comportamiento actualmente respaldado para capturar y editar las filas cronológicas de una jornada: alta, eliminación, horas, duración, continuidad, orden y comunicación entre los componentes involucrados.

## Alcance

- Colección `filas` de `JornadaState`.
- Modelo y edición local de una `JornadaFilaModel`.
- Agregar y eliminar filas en `JornadaDetalle`.
- Cálculo visual local de duración en `JornadaFila`.
- Validación local de continuidad expuesta por `useJornadaAdmin`.
- Presentación de filas en tabla de escritorio y tarjetas en pantallas pequeñas.

## Fuera de alcance

- Persistencia de filas, eventos administrativos y contratos de RPC.
- Traducción de filas a eventos.
- Datos generales de la jornada, resumen, acciones finales y borradores.
- Creación y administración de implementos; esta SPEC solo registra el vínculo de la fila con `implementoId` y el evento para solicitar su creación.
- La resolución detallada del código hacia labor o parada, salvo los campos de fila que dicha resolución actualiza.

## Fuentes

Se siguió el orden y la prioridad de fuentes definidos en `documentacion/formulario_captura_padas/INDEX_SPECS.md`.

1. `documentacion/formulario_captura_padas/registro_jornada_integracion_completa.html` — referencia visual y de interacción de ejemplo.
2. `documentacion/formulario_captura_padas/registroJornada.types.ts` — tipos de estado y de fila.
3. `documentacion/formulario_captura_padas/RegistroJornadaPage.vue` — propiedad y contrato del estado de filas.
4. `documentacion/formulario_captura_padas/components/JornadaDetalle.vue` — gestión de la colección.
5. `documentacion/formulario_captura_padas/components/JornadaFila.vue` — edición y duración de una fila.
6. `documentacion/formulario_captura_padas/composables/useJornadaAdmin.ts` — validación de continuidad y estado de error.

No se verificó una firma real de Supabase: las fuentes revisadas no aportan una firma contractual y no fue necesaria para describir el comportamiento local de esta SPEC.

## Clasificación de evidencia

- **Confirmado:** comportamiento o dato presente en los tipos, página, componentes o composable revisados.
- **Decisión de UI:** presentación o interacción expresada por un componente o por el HTML de referencia; no equivale por sí sola a una regla de persistencia.
- **Ejemplo visual:** dato concreto mostrado en el HTML; no constituye una regla.
- **Pendiente:** información requerida para completar la especificación que no está confirmada por las fuentes permitidas.

## Modelo de fila

**Confirmado.** `JornadaState` hereda los datos generales y contiene `filas: JornadaFilaModel[]`. La página posee ese estado como un objeto reactivo y lo entrega a `JornadaDetalle` mediante `v-model:filas`.

**Confirmado.** Cada `JornadaFilaModel` contiene:

| Campo             | Tipo                          | Uso respaldado                                    |
| ----------------- | ----------------------------- | ------------------------------------------------- |
| `idLocal`         | `string`                      | Identificador local y clave del `v-for`.          |
| `inicio`          | `string`                      | Hora de inicio editable.                          |
| `fin`             | `string`                      | Hora de fin editable.                             |
| `codigo`          | `number \| null`              | Código editable.                                  |
| `tipoActividad`   | `'labor' \| 'parada' \| null` | Resultado de la resolución del código.            |
| `actividadId`     | `string \| null`              | Identificador de la actividad resuelta.           |
| `actividadNombre` | `string`                      | Texto de actividad mostrado como solo lectura.    |
| `implementoId`    | `string \| null`              | Implemento seleccionado o ausencia de implemento. |

**Confirmado.** Al no haber código, `JornadaFila` limpia `tipoActividad`, `actividadId` y `actividadNombre`. Si no encuentra un código activo en los catálogos revisados, deja los dos identificadores de actividad en `null` y muestra `Código no reconocido`.

## Gestión de filas

**Confirmado — agregar.** `JornadaDetalle.agregarFila()` agrega al final una fila con un `idLocal` generado por `crypto.randomUUID()`, `fin` vacío, `codigo` nulo, actividad sin resolver y `actividadNombre` vacío.

**Confirmado — copia de hora anterior.** Al agregar una fila, su `inicio` toma el `fin` de la última fila existente. Cuando no hay filas, usa el valor inicial literal `06:00`.

**Confirmado — implemento al agregar.** La nueva fila toma el `implementoId` de la última fila; si no existe última fila, toma `null`.

**Confirmado — eliminar.** El evento `eliminar` de `JornadaFila` invoca `eliminarFila(index)` en `JornadaDetalle`, que ejecuta `filas.value.splice(index, 1)`. La colección no conserva un hueco y la numeración visual se deriva del índice actual (`index + 1`).

**Pendiente.** No hay regla confirmada para impedir eliminar la única fila, solicitar confirmación, compensar automáticamente los horarios colindantes o restaurar una fila eliminada.

## Cálculo de duración

**Confirmado.** `JornadaFila` calcula localmente la duración solo cuando `inicio` y `fin` tienen valor. Convierte ambas horas `HH:mm` a minutos, resta inicio a fin y muestra el resultado como `HH:mm` con horas y minutos de dos dígitos.

**Confirmado.** Si falta alguna hora o la diferencia es negativa, la fila muestra `--:--`.

**Pendiente.** No se confirma cómo tratar turnos que atraviesan medianoche, formatos de hora distintos de `HH:mm`, ni si la duración calculada debe persistirse o enviarse a un RPC.

## Continuidad y orden cronológico

**Confirmado.** `validarContinuidad(filas)` devuelve inválido cuando no hay filas; cuando una fila no tiene `inicio`, `fin`, `codigo` o `actividadId`; cuando `fin <= inicio`; o cuando, desde la segunda fila, el `fin` de la fila anterior es distinto del `inicio` de la actual.

**Confirmado.** Para una secuencia válida devuelve el mensaje `La secuencia de horas es continua.`. La página calcula este resultado sobre `jornada.filas` y lo entrega a `JornadaAcciones` como `valido` y `mensaje-validacion`.

**Confirmado.** La validación comprueba la secuencia en el orden actual del arreglo; no ordena las filas.

**Decisión de UI.** `JornadaDetalle` informa que las horas deben ser continuas y sin solapamientos.

**Decisión de UI / no implementada en Vue.** El script del HTML de referencia copia el nuevo valor de fin de una fila al inicio de la fila siguiente al cambiar ese fin. `JornadaDetalle.vue` y `JornadaFila.vue` no contienen esa propagación. Por tanto, no se establece como comportamiento confirmado de la implementación Vue.

**Pendiente.** No hay comportamiento confirmado para reordenar filas manualmente, ordenar automáticamente por hora, bloquear ediciones que rompan continuidad, ni propagar cambios de `inicio` o `fin` a filas adyacentes.

## Flujo

1. **Confirmado:** `RegistroJornadaPage` posee `jornada.filas` y la enlaza bidireccionalmente con `JornadaDetalle`.
2. **Confirmado:** al pulsar la acción de agregar, `JornadaDetalle` añade una fila al arreglo siguiendo los valores iniciales documentados en esta SPEC.
3. **Confirmado:** cada `JornadaFila` edita su propio modelo mediante `v-model`; muestra inicio, fin, código, actividad de solo lectura, implemento, duración y una acción de eliminación.
4. **Confirmado:** la fila emite `eliminar`; el detalle elimina el índice correspondiente.
5. **Confirmado:** al solicitar crear implemento, la fila emite `crear-implemento`, el detalle propaga el índice y la página abre el flujo de implemento fuera del alcance de esta SPEC.
6. **Confirmado:** la página evalúa continuidad con `validarContinuidad(jornada.filas)`.
7. **Pendiente:** la traducción de las filas válidas a eventos y su persistencia está marcada como pendiente dentro de `finalizarDesdeFilas`.

## Contrato entre componentes

| Origen                | Destino               | Contrato confirmado                                                                 |
| --------------------- | --------------------- | ----------------------------------------------------------------------------------- |
| `RegistroJornadaPage` | `JornadaDetalle`      | `v-model:filas="jornada.filas"` y prop `catalogos`.                                 |
| `JornadaDetalle`      | `JornadaFila`         | `v-model="filas[index]"`, `numero="index + 1"`, prop `catalogos`.                   |
| `JornadaFila`         | `JornadaDetalle`      | Evento `eliminar`; el padre elimina la posición recibida en el cierre del template. |
| `JornadaFila`         | `JornadaDetalle`      | Evento `crear-implemento`; el detalle propaga `crear-implemento(index)`.            |
| `JornadaDetalle`      | `RegistroJornadaPage` | Evento `crear-implemento` con el índice de la fila.                                 |
| `RegistroJornadaPage` | `JornadaAcciones`     | Resultado de continuidad mediante `valido` y `mensaje-validacion`.                  |

**Pendiente.** No se confirma un evento específico para propagar cambios de hora, duración, código o implemento porque se realizan mediante el modelo bidireccional de la fila.

## RPC involucrados

**Confirmado.** `JornadaDetalle` y `JornadaFila` declaran no tener RPC directo.

**Pendiente.** `useJornadaAdmin.finalizarDesdeFilas` enumera en comentarios RPC administrativos potencialmente asociados a la traducción de filas, pero la secuencia está sin implementar y ninguna firma real de Supabase fue verificada. Esta SPEC no define nombres de parámetros, payloads, respuestas, tablas, columnas ni reglas de persistencia para esos RPC.

## Validaciones

**Confirmado.** La validación local exige al menos una fila y, para cada fila, `inicio`, `fin`, `codigo` y `actividadId`.

**Confirmado.** La hora de fin debe ser posterior a la de inicio según la comparación de las cadenas usadas por el composable.

**Confirmado.** A partir de la segunda fila, `filas[i - 1].fin` debe coincidir exactamente con `filas[i].inicio`.

**Pendiente.** No se confirma validación de rango de código, longitud o ceros a la izquierda en el componente Vue, obligatoriedad de `implementoId`, validación de fecha/hora contra zona horaria, ni validación del servidor.

## Estados de error

**Confirmado.** `useJornadaAdmin` mantiene `error: Ref<string | null>` y `guardando: Ref<boolean>`; `finalizarDesdeFilas` limpia el error antes de su bloque de ejecución y guarda el mensaje de un error capturado.

**Confirmado.** Si las filas no cumplen continuidad, `finalizarDesdeFilas` lanza un `Error` con el mensaje de `validarContinuidad` antes de activar `guardando`.

**Confirmado.** La integración de finalización actualmente lanza el error `Pendiente conectar la secuencia de filas a los RPC administrativos en este composable.`; no constituye un error de backend verificado.

**Pendiente.** No están confirmados mensajes, códigos, reintentos, recuperación ni presentación de errores procedentes de Supabase.

## Responsive

**Decisión de UI.** En pantallas `md` o mayores, `JornadaDetalle` presenta columnas para número, inicio, fin, código, labor/causa, implemento, duración y acción. El contenedor permite desplazamiento horizontal y declara un ancho mínimo de contenido.

**Decisión de UI.** Por debajo de `md`, cada fila se presenta como tarjeta en una cuadrícula; las etiquetas de los campos aparecen dentro de la fila. La acción de agregar permanece al final del detalle.

**Ejemplo visual.** El HTML representa filas de horas consecutivas y sus duraciones; esas horas y códigos son demostrativos y no fijan valores iniciales, catálogo ni duración de negocio.

## Criterios de aceptación

- [ ] Dada una colección vacía, al agregar una fila se incorpora un elemento con `inicio` igual a `06:00`, `fin` vacío, código y actividad sin resolver, e `implementoId` nulo.
- [ ] Dada una colección con una última fila, al agregar una fila su `inicio` coincide con el `fin` de esa última fila y su `implementoId` coincide con el de la última fila.
- [ ] Al eliminar una fila, el arreglo queda sin ese elemento y la numeración renderizada de las filas restantes es consecutiva desde 1.
- [ ] Una fila con inicio y fin válidos muestra la diferencia local en formato `HH:mm`; si falta una hora o el fin es anterior al inicio, muestra `--:--`.
- [ ] La validación falla sin filas, con campos obligatorios de fila faltantes, con `fin <= inicio`, o con una discontinuidad entre el fin previo y el inicio actual.
- [ ] La validación aprueba una colección no vacía cuyas filas completas tengan fin posterior al inicio y continuidad exacta en el orden del arreglo.
- [ ] La edición del nombre de actividad no está disponible en la fila: se muestra como un valor de solo lectura.
- [ ] Las filas no realizan llamadas RPC directas desde `JornadaDetalle` ni `JornadaFila`.
- [ ] En escritorio se muestran las columnas documentadas y en pantallas menores a `md` se muestran las etiquetas de campo de la tarjeta.

## Casos límite

| Caso                               | Tratamiento respaldado                                                                                                              |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Sin filas                          | La continuidad es inválida y el mensaje solicita agregar al menos un registro.                                                      |
| Nueva primera fila                 | Inicia en `06:00`; no hay fila previa de la que copiar hora o implemento.                                                           |
| Falta inicio o fin                 | La duración muestra `--:--`; la continuidad es inválida.                                                                            |
| Fin igual o anterior al inicio     | La duración muestra `--:--` si la diferencia es negativa; la continuidad rechaza fin igual o anterior.                              |
| Espacio o solapamiento entre filas | La continuidad es inválida si el fin anterior y el inicio actual no son idénticos.                                                  |
| Código vacío                       | Se limpian los campos de actividad resuelta; la continuidad es inválida.                                                            |
| Código no reconocido               | La actividad queda sin identificador y se muestra `Código no reconocido`; la continuidad es inválida por ausencia de `actividadId`. |
| Eliminación intermedia             | Se elimina solo esa posición; cualquier discontinuidad posterior queda sujeta a la validación normal.                               |
| Cruce de medianoche                | Pendiente.                                                                                                                          |

## Pendientes / preguntas abiertas

- Se necesita verificar la firma real en Supabase de cada RPC que procese filas o eventos administrativos. Es necesaria para documentar contratos de integración sin inventar parámetros, payloads, respuestas, tablas o columnas. Debe verificarse en Supabase o en una fuente de backend que exponga las firmas reales.
- Se necesita confirmar el comportamiento deseado al editar la hora fin de una fila: el HTML de referencia actualiza el inicio siguiente, pero los componentes Vue revisados no lo implementan.
- Se necesita confirmar si debe haber ordenamiento o reordenamiento cronológico, y si una edición que rompe la continuidad debe bloquearse, corregirse automáticamente o solo marcarse como inválida.
- Se necesita definir el tratamiento de jornadas que cruzan medianoche y la fuente de verdad de zona horaria.
- Se necesita confirmar las validaciones de código, implemento y cualquier validación de servidor.
- Se necesita confirmar cómo se muestra al usuario el `error` expuesto por el composable, pues la página revisada no lo entrega a un componente visual.

## Tabla de trazabilidad

| Regla o dato                                                                           | Clasificación                           | Fuente exacta                                                                                  |
| -------------------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `JornadaState` contiene `filas: JornadaFilaModel[]`                                    | Confirmado                              | `registroJornada.types.ts`, interfaces `JornadaState` y `JornadaFilaModel`                     |
| La página es propietaria de `jornada.filas` y lo enlaza con el detalle                 | Confirmado                              | `RegistroJornadaPage.vue`, estado `jornada` y `<JornadaDetalle v-model:filas="jornada.filas">` |
| Alta: inicio desde el fin anterior o `06:00`; copia de implemento                      | Confirmado                              | `components/JornadaDetalle.vue`, función `agregarFila`                                         |
| Eliminación por índice y renumeración por `index + 1`                                  | Confirmado                              | `components/JornadaDetalle.vue`, función `eliminarFila` y `v-for`                              |
| Duración como diferencia de horas; `--:--` con datos incompletos o diferencia negativa | Confirmado                              | `components/JornadaFila.vue`, computada `duracion`                                             |
| Continuidad, campos exigidos y fin posterior                                           | Confirmado                              | `composables/useJornadaAdmin.ts`, función `validarContinuidad`                                 |
| La validación se consume desde la página                                               | Confirmado                              | `RegistroJornadaPage.vue`, computada `validacion` y props de `JornadaAcciones`                 |
| No hay RPC directo en detalle ni fila                                                  | Confirmado                              | Comentarios de cabecera de `components/JornadaDetalle.vue` y `components/JornadaFila.vue`      |
| Tabla en escritorio y tarjeta con etiquetas en móvil                                   | Decisión de UI                          | `components/JornadaDetalle.vue` y `components/JornadaFila.vue`, templates y clases responsivas |
| Actualizar el inicio siguiente cuando cambia el fin actual                             | Decisión de UI / no implementada en Vue | `registro_jornada_integracion_completa.html`, listener `end.addEventListener('change', ...)`   |
| Horas, códigos, actividades e implementos representados en la maqueta                  | Ejemplo visual                          | `registro_jornada_integracion_completa.html`, filas dentro de `#journeyBody`                   |
| Contratos de RPC y persistencia de filas                                               | Pendiente                               | `composables/useJornadaAdmin.ts`, `finalizarDesdeFilas`; firma real de Supabase no verificada  |
