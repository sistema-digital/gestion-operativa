# SPEC-06 — Corte, regresión y aceptación del nuevo esquema de lubricación

## Objetivo

Cerrar la migración frontend hacia la estructura vigente de lubricación y dejar
evidencia verificable de que ningún flujo de producción conserva el modelo
legacy de asociación plana `sistema + aceite`.

Este spec integra los resultados de los cinco specs anteriores, ejecuta la
regresión funcional de creación, edición, catálogos y consulta de aceites, y
retira código, pruebas y textos que puedan reintroducir el contrato eliminado.

Al finalizar, la unidad que la interfaz crea, muestra, edita y elimina es un
**nodo de estructura de lubricación**. El aceite es un atributo opcional de ese
nodo; no existe una pantalla ni un payload que gestione una relación plana de
aceite por sistema.

## Referencias obligatorias

- [Sistema legacy de sistemas y aceites](./01_sistema_legacy_engrase.md).
- [Decisiones de la nueva estructura](./02_decisiones_nueva_estructura_engrase.md), en especial las decisiones 5, 8 a 18, 20 a 28, 31 a 39.
- [Contratos RPC de la nueva estructura](./03_rpc_payloads_nueva_estructura_engrase.md), en especial las secciones 2 a 5, 12, 18, 19, 21 a 23 y 31.
- [SPEC-01 — Contratos y modelo compartido](./04_spec_01_contratos_modelo_compartido.md).
- [SPEC-02 — Motor de borrador](./05_spec_02_motor_borrador_estructura_lubricacion.md).
- [SPEC-03 — Creación de estructura de lubricación](./06_spec_03_creacion_estructura_lubricacion.md).
- [SPEC-04 — Edición de estructura de lubricación](./07_spec_04_edicion_estructura_lubricacion.md).
- [SPEC-05 — Catálogos y consulta de aceites](./08_spec_05_catalogos_y_consulta_aceites.md).

Ante contradicción, prevalecen el contrato RPC vigente y las decisiones de
modelo validadas en base de datos. No se conserva compatibilidad con el
payload legacy salvo que el backend publique expresamente una transición nueva
y documentada; este spec no debe inventarla.

## Dependencias de entrada

Los SPEC-01 a SPEC-05 deben estar terminados antes de comenzar el corte.

El backend debe exponer y estar operativo con:

- `rpc_obtener_auxiliares_edicion_equipo()` con `sistemas`, `subsistemas` y
  `aceites` activos;
- `rpc_crear_equipo_completo(p_datos)` con `estructura_sistemas.nuevos`;
- `rpc_actualizar_equipo_completo(p_codigo_equipo, p_cambios)` con
  `estructura_sistemas.nuevos`, `actualizados` y `eliminados`;
- `rpc_obtener_equipo_para_edicion(p_codigo)` con la lista plana
  `estructura_sistemas`;
- `rpc_obtener_aceites_equipo(p_equipo_id)` con rutas completas;
- RPC de catálogo de sistemas, subsistemas y aceites según SPEC-05.

No se debe realizar un corte de frontend contra una versión de backend que aún
devuelva `sistemas_aceite` o una lista `aceites` legacy en la lectura de
edición.

## Alcance

1. Integrar y verificar los flujos creados en SPEC-01 a SPEC-05.
2. Retirar las referencias de producción al contrato legacy.
3. Reescribir o eliminar pruebas que solo verifiquen asociaciones planas.
4. Ejecutar una matriz de regresión de UI, dominio, RPC y accesibilidad.
5. Verificar que las respuestas inválidas fallen de forma visible, sin
   degradarse a estructuras vacías.
6. Definir criterios de liberación y de reversión operativa.

## Fuera de alcance

- Cambiar tablas, funciones, políticas RLS o datos del backend.
- Migrar las 108 asociaciones legacy eliminadas; esas relaciones no se deben
  reconstruir ni inferir.
- Recrear `engrase.sistema_aceite`, `equipo_aceite_v2` ni adaptadores de
  compatibilidad silenciosa.
- Añadir drag and drop si el editor de SPEC-04 no lo requiere para cumplir los
  flujos definidos.
- Rediseñar los catálogos más allá de los cambios funcionales de SPEC-05.

## Regla de corte

El corte se considera correcto únicamente si se cumple esta equivalencia:

| Operación          | Forma permitida                                                           |
| ------------------ | ------------------------------------------------------------------------- |
| Crear equipo       | `estructura_sistemas: { nuevos: [...] }`, incluso si la lista está vacía. |
| Editar estructura  | `estructura_sistemas: { nuevos, actualizados, eliminados }`.              |
| Quitar aceite      | Actualizar el nodo con `aceite_id: null`; conservar el nodo.              |
| Eliminar ubicación | Eliminar el nodo y confirmar el subárbol afectado.                        |
| Leer equipo        | Consumir lista plana de `estructura_sistemas` con `id` y `parent_id`.     |
| Consultar aceites  | Mostrar la ruta de `rpc_obtener_aceites_equipo`.                          |

Las siguientes formas están prohibidas en código de producción:

```ts
// Prohibido: modelo y payload legacy.
sistemas_aceite;
sistema_aceite_id;
equipo_aceite_v2;

{
  aceites: {
    nuevos: [],
    actualizados: [],
    eliminados: [],
  },
}
```

`equipo_aceite_id` puede aparecer únicamente si el backend lo mantiene como
identificador histórico de una respuesta ajena al esquema migrado. Para los
flujos de lubricación cubiertos por este spec, el identificador operativo es
el `id` de `equipo_estructura_sistema`; no se debe usar
`equipo_aceite_id` para crear, actualizar o borrar una ubicación.

## Actividades de implementación

### 1. Inventario y retirada de legacy

Revisar primero los directorios afectados por la migración:

```text
src/components/engrase/creacion/aceites/
src/components/engrase/edicion/aceites/
src/components/engrase/catalogo/aceites/
src/views/engrase/EquipoEngraseCrearView.vue
src/views/engrase/EquipoEngraseEditarView.vue
src/views/engrase/catalogo/CatalogoEngraseView.vue
src/stores/dbequipos/engrase/
src/composables/engrase/
```

Eliminar, renombrar o reemplazar los módulos que tengan una responsabilidad
puramente legacy. En particular, no deben sobrevivir componentes cuyo contrato
sea seleccionar exactamente un `sistema` y un `aceite` como una única
asociación.

Los nombres visibles también deben reflejar el modelo nuevo:

- El paso del wizard se llama **Estructura de lubricación**.
- Los mensajes de lista vacía hablan de nodos o estructura, no de
  “asociaciones aceite-sistema”.
- Los diálogos de eliminación indican si se eliminarán descendientes y
  aceites asignados.
- El catálogo de aceite habla de **sistemas raíz donde se utiliza**.

Se permite conservar los documentos históricos en
`documentacion/specs/.../01_sistema_legacy_engrase.md`. La búsqueda de
limpieza no debe borrar ni alterar esa evidencia histórica.

### 2. Coherencia entre dominio, stores y UI

Verificar que exista una sola fuente de verdad por editor:

- el store conserva una lista plana de borrador;
- el árbol visible se deriva de esa lista;
- la expansión de nodos, el foco y el menú abierto son estado de UI y no se
  mezclan con el payload persistible;
- creación y edición consumen el mismo motor de borrador;
- ningún componente altera directamente props o el snapshot original;
- los payloads se construyen exclusivamente mediante el diff del motor.

No se debe mantener en paralelo una lista de `aceites` para “simplificar” la
UI. Las tarjetas o filas que muestran aceite deben derivarse de los nodos que
tengan `aceiteId` no nulo.

### 3. Pruebas a sustituir

Eliminar o reescribir pruebas que afirmen cualquiera de estas reglas legacy:

- un aceite por sistema;
- existencia de `sistemasAceite`;
- lectura de `aceites` como `{ equipo_aceite_id, sistema, aceite }`;
- payload `aceites.nuevos`, `aceites.actualizados` o `aceites.eliminados`;
- creación temporal de un catálogo `sistema_aceite`.

Las pruebas nuevas deben usar fixtures de estructura que incluyan raíces,
descendientes, aceite nulo, aceite profundo y catálogos inactivos existentes.
No utilizar `any` ni `unknown` en fixtures, stubs ni APIs de prueba cuando se
pueda declarar un tipo concreto.

### 4. Verificación estática de referencias

Antes de aprobar la liberación, ejecutar búsquedas enfocadas en código de
producción y revisar cada coincidencia:

```powershell
rg -n -i "sistema_aceite|sistemas_aceite|equipo_aceite_v2" src
rg -n "aceites:\s*\{" src/stores/dbequipos/engrase src/composables/engrase
rg -n "equipo_aceite_id" src/components src/views src/stores/dbequipos/engrase
```

El resultado esperado es cero coincidencias en los flujos migrados, excepto
una referencia explícitamente justificada por otro dominio que no represente
estructura de lubricación. Una excepción debe documentar archivo, motivo,
propietario y fecha prevista de retiro; no basta con ignorar el resultado.

También revisar importaciones huérfanas, rutas sin uso y componentes de aceites
que ya no sean alcanzables tras cambiar el wizard y la edición.

## Matriz mínima de regresión funcional

### Creación

| Caso                  | Acción                                              | Resultado esperado                                                                                 |
| --------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Equipo sin estructura | Crear equipo sin nodos.                             | El request contiene `estructura_sistemas.nuevos: []`; la creación es válida.                       |
| Raíz sin aceite       | Agregar sistema raíz y no seleccionar aceite.       | Se guarda un nodo raíz con `aceite_id: null`.                                                      |
| Raíz con aceite       | Agregar sistema raíz con aceite.                    | Se guarda un único nodo raíz con el aceite elegido.                                                |
| Árbol profundo        | Agregar raíz y tres niveles de subsistema.          | Cada hijo conserva la referencia de su padre temporal; no existe límite artificial de profundidad. |
| Aceite reutilizado    | Seleccionar el mismo aceite en dos nodos distintos. | La UI y el payload lo permiten.                                                                    |
| Catálogo inactivo     | Intentar una nueva selección.                       | Sistemas, subsistemas y aceites inactivos no aparecen como opciones nuevas.                        |

### Edición

| Caso                 | Acción                                                    | Resultado esperado                                                                               |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Lectura plana        | Cargar raíz, hijo y nieto desde RPC.                      | El árbol se deriva correctamente de `parent_id`.                                                 |
| Inactivo existente   | Cargar un sistema, subsistema o aceite inactivo ya usado. | Permanece visible, identificado como inactivo y no se pierde al guardar cambios no relacionados. |
| Cambiar aceite       | Modificar aceite de un nodo existente.                    | Solo el nodo aparece en `estructura_sistemas.actualizados`.                                      |
| Quitar aceite        | Retirar aceite de un nodo existente.                      | Se envía `{ id, aceite_id: null }`; el nodo sigue visible.                                       |
| Nuevo hijo           | Crear hijo bajo un nodo existente.                        | Se envía `parent_id` del nodo padre.                                                             |
| Nuevo descendiente   | Crear hijo bajo un padre nuevo.                           | Se envía `parent_temp_id` del padre temporal.                                                    |
| Mover hijo           | Cambiar el padre de un subsistema existente.              | El payload actualiza el padre sin convertirlo en raíz ni crear ciclos.                           |
| Eliminar rama        | Eliminar nodo con descendientes.                          | La UI muestra el alcance antes de confirmar y el payload elimina el subárbol según el motor.     |
| Cancelar eliminación | Cancelar o deshacer.                                      | El borrador y el árbol vuelven al estado previo.                                                 |

### Catálogos y consulta

| Caso               | Acción                                              | Resultado esperado                                                                      |
| ------------------ | --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Subsistemas        | Abrir, crear, renombrar y desactivar un subsistema. | Opera como catálogo independiente; no solicita padre fijo.                              |
| Sistema raíz       | Ver métricas de un sistema.                         | Los aceites se interpretan como métricas agregadas de la raíz.                          |
| Aceite profundo    | Consultar aceite ubicado en un nodo profundo.       | El catálogo lo agrupa por sistema raíz y el detalle de equipo muestra la ruta completa. |
| Sin aceites        | Consultar equipo con nodos sin aceite.              | Muestra estado vacío informativo, no error ni asociación ficticia.                      |
| Cambio de catálogo | Renombrar o desactivar un valor en uso.             | No modifica nodos de equipos; los valores existentes siguen legibles.                   |

## Estados, accesibilidad y responsividad

La validación no se limita al payload. Comprobar en escritorio y móvil:

- estado de carga inicial, error recuperable, vacío y sin resultados;
- árbol con nombres largos y profundidad mayor que tres;
- expansión y contracción por teclado;
- retorno de foco al cerrar drawer, menú o diálogo;
- `Escape` cierra solo la capa permitida y no cancela un guardado activo;
- confirmación de borrado con texto del nodo, cantidad de descendientes y
  cantidad de aceites afectados;
- controles de selección con `vue-multiselect`, no `<select>` nativo;
- botones y filas interactivas con `cursor-pointer` al estar habilitados;
- objetivos táctiles de al menos 44 px en `xs` y `sm`;
- rutas largas disponibles completas para lector de pantalla mediante texto,
  `aria-label` o `title` cuando se trunquen visualmente;
- estado inactivo comunicado por texto, no solo por color.

No se exige que un árbol completo se muestre expandido en móvil. Sí se exige
que cualquier nodo sea alcanzable, comprensible y editable sin perder el
contexto de su ruta padre.

## Validación de contratos y errores

Ejecutar pruebas de integración de servicios con respuestas reales o fixtures
equivalentes a las RPC vigentes. Deben fallar de forma recuperable cuando:

- falta `estructura_sistemas` en la respuesta de edición;
- falta `sistemas`, `subsistemas` o `aceites` en auxiliares;
- un ID es cero, negativo o no entero;
- una raíz recibe subsistema o un hijo recibe sistema;
- un nombre es vacío;
- un `parent_id` no existe en el conjunto;
- existe un ciclo;
- el backend devuelve una forma legacy en lugar de la forma vigente.

Los stores y componentes no deben convertir ninguno de esos errores en listas
vacías, ni conservar un borrador parcialmente mutado tras un fallo de carga o
guardado.

## Comandos de verificación

Ejecutar, como mínimo, al finalizar la implementación:

```powershell
pnpm exec prettier --write <cada-archivo-modificado>
pnpm test:run
pnpm typecheck
```

Ejecutar además los comandos de búsqueda de la sección “Verificación estática
de referencias”. Si el proyecto cuenta con pruebas de navegador configuradas,
agregar los escenarios críticos de creación, edición profunda y eliminación de
subárbol a esa suite.

La validación debe reportar por separado:

1. pruebas de dominio y payload;
2. pruebas de mapper y servicios;
3. pruebas de stores y componentes;
4. typecheck;
5. formato;
6. revisión de referencias legacy.

## Criterios de aceptación

1. Creación y edición no envían ningún bloque top-level `aceites`.
2. Creación siempre envía `estructura_sistemas.nuevos`, incluso vacío.
3. Edición consume y conserva una lista plana de nodos; la UI deriva de ella
   un árbol de profundidad N.
4. Una raíz es siempre un sistema y un hijo es siempre un subsistema.
5. El aceite puede ser nulo o estar en cualquier nivel; el mismo aceite puede
   reutilizarse en distintos nodos.
6. Retirar un aceite no elimina la ubicación; eliminar una ubicación confirma
   y elimina su subárbol.
7. Valores inactivos ya asignados siguen visibles; los auxiliares de nuevas
   selecciones solo ofrecen activos.
8. La navegación administrativa incluye Sistemas, Subsistemas y Aceites como
   catálogos independientes.
9. La consulta de aceites de equipo muestra rutas completas y no pares planos
   de sistema y aceite.
10. No quedan referencias legacy en código de producción de los flujos
    migrados, ni pruebas que aprueben el payload legacy como comportamiento
    vigente.
11. Los errores de contrato, red y guardado se muestran de forma recuperable;
    nunca se ocultan con arreglos vacíos.
12. Las pruebas, typecheck y formato terminan correctamente.

## Criterio de liberación

Se puede liberar únicamente cuando todos los criterios de aceptación se
cumplan, la matriz de regresión haya sido ejecutada contra el backend migrado y
las búsquedas estáticas no tengan coincidencias legacy no justificadas.

La evidencia mínima a adjuntar al cambio es:

- salida de `pnpm test:run`;
- salida de `pnpm typecheck`;
- resultado de las búsquedas de legacy;
- capturas o registro de prueba manual en móvil y escritorio para creación,
  edición profunda, retiro de aceite y eliminación de subárbol;
- request/response saneados de creación y edición que demuestren
  `estructura_sistemas`.

## Reversión operativa

No realizar una reversión de interfaz que vuelva a emitir `aceites` ni que
intente consumir `sistemas_aceite`: el backend final ya eliminó ese contrato.

Si se detecta una incidencia después del despliegue, la respuesta segura es:

1. deshabilitar temporalmente la acción que produzca el fallo, si es posible;
2. conservar el borrador local y mostrar un error recuperable;
3. corregir el contrato o la implementación contra `estructura_sistemas`;
4. reintentar sin reconstruir asociaciones legacy ni inferir datos históricos.

## Riesgos y mitigación

| Riesgo                                                    | Mitigación                                                                                       |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Una respuesta legacy se interpreta como estructura vacía. | Zod rechaza claves faltantes y el mapper informa error recuperable.                              |
| El árbol se reduce a filas de sistema y aceite.           | Pruebas de profundidad N y revisión de UI basada en rutas y padres.                              |
| Un cambio de aceite borra el nodo.                        | Caso explícito que exige `aceite_id: null` y conserva la ubicación.                              |
| Un borrado elimina más de lo esperado.                    | Confirmación previa basada en el subárbol derivado, con conteos claros.                          |
| Un valor inactivo desaparece al editar.                   | Separar auxiliares activos de valores existentes y cubrir el guardado sin cambios estructurales. |
| Persisten pruebas legacy que dan falsa confianza.         | Reescribir fixtures y aserciones para `estructura_sistemas`; revisar coincidencias estáticas.    |
| La UI es correcta solo en escritorio.                     | Pruebas de foco, teclado, hoja móvil y rutas largas en `xs` y `sm`.                              |

## Resultado esperado

El frontend queda alineado con la arquitectura final:

```text
Equipo
└─ Estructura de lubricación
   ├─ Sistema raíz
   │  └─ Subsistema (N niveles)
   │     └─ Aceite opcional
   └─ Sistema raíz
```

No se recrean sistemas legacy ni asociaciones antiguas. La estructura se
declara explícitamente por equipo y el aceite se administra únicamente dentro
de esa estructura.
