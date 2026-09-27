# SPEC-05 — Catálogos de sistemas y subsistemas, y consulta de aceites

## Objetivo

Completar la capa administrativa del nuevo esquema de lubricación: mantener
catálogos independientes de **Sistemas**, **Subsistemas** y **Aceites**, y
mostrar las asignaciones de aceite de un equipo mediante su ruta estructural
completa.

Este spec no administra nodos de un equipo. Esa responsabilidad pertenece al
editor **Estructura de lubricación** de SPEC-03 y SPEC-04. Aquí se administran
únicamente valores reutilizables de catálogo y se consultan lecturas derivadas
del árbol ya persistido.

## Referencias obligatorias

- [Decisiones de la nueva estructura](./02_decisiones_nueva_estructura_engrase.md), en especial las decisiones 1, 4, 5, 27, 29, 30, 32, 33 y 36.
- [Contratos RPC de la nueva estructura](./03_rpc_payloads_nueva_estructura_engrase.md), secciones 14 a 17 y 23 a 25.
- [SPEC-01 — Contratos y modelo compartido](./04_spec_01_contratos_modelo_compartido.md).
- [SPEC-03 — Creación de estructura de lubricación](./06_spec_03_creacion_estructura_lubricacion.md).
- [SPEC-04 — Edición de estructura de lubricación](./07_spec_04_edicion_estructura_lubricacion.md).

Ante contradicción, prevalece el contrato RPC vigente y validado en base de
datos.

## Dependencias de entrada

- SPEC-01 está terminado y expone contratos validados para `sistemas`,
  `subsistemas`, `aceites` y nodos de estructura.
- SPEC-03 y SPEC-04 son la única vía que crea, edita, mueve o elimina nodos de
  un equipo y asigna aceite a esos nodos.
- El backend expone `rpc_catalogo_sistemas_listar`,
  `rpc_catalogo_sistema_guardar`, `rpc_catalogo_subsistemas_listar`,
  `rpc_catalogo_subsistema_guardar` y `rpc_obtener_aceites_equipo` conforme a
  [03_rpc_payloads_nueva_estructura_engrase.md](./03_rpc_payloads_nueva_estructura_engrase.md).

## Alcance

1. Mantener el catálogo de Sistemas como catálogo de raíces de estructura.
2. Crear una sección administrativa equivalente para el catálogo de
   Subsistemas.
3. Mantener el catálogo de Aceites independiente de la estructura y corregir
   su semántica de lectura a sistemas raíz.
4. Consumir y mostrar `rpc_obtener_aceites_equipo(p_equipo_id)` con la ruta
   completa del nodo que tiene aceite.
5. Aplicar reglas de activos: las pantallas administrativas muestran y pueden
   cambiar el estado; los formularios de estructura solo ofrecen activos para
   nuevas selecciones.
6. Validar contratos remotos con Zod, implementar estados de carga/error y
   añadir pruebas de mapper, store y componentes.

## Fuera de alcance

- Crear, editar, mover o eliminar nodos de `estructura_sistemas` desde los
  catálogos.
- Asociar directamente un sistema con un aceite o con un equipo.
- Crear un catálogo genérico que mezcle sistema y subsistema.
- Eliminar físicamente sistemas o subsistemas desde la interfaz.
- Cambiar el catálogo de aceite, sus nueve IDs conservados o sus RPC de
  guardado, salvo ajustar su visualización a las métricas vigentes.
- Alterar contratos o reglas del backend.

## Regla funcional central

Los tres conceptos deben conservarse separados:

| Concepto                  | Qué administra la UI                                             | Qué no administra                            |
| ------------------------- | ---------------------------------------------------------------- | -------------------------------------------- |
| Sistema                   | Nombre y estado de un posible nodo raíz.                         | Padres, subsistemas, equipos o aceites.      |
| Subsistema                | Nombre y estado de un posible nodo hijo a cualquier profundidad. | Un sistema padre fijo, equipos o aceites.    |
| Aceite                    | Nombre y estado del catálogo de aceite.                          | La ubicación del aceite dentro de un equipo. |
| Estructura de lubricación | Nodos, padres y aceite opcional por nodo.                        | Definición global de los tres catálogos.     |

Desactivar un catálogo no borra ni oculta valores ya usados por equipos. Solo
impide seleccionarlo al crear una raíz, hijo o nueva asignación de aceite.

## Estado actual a reemplazar

La pantalla de catálogos ya contiene secciones de Aceites y Sistemas, pero no
una sección de Subsistemas. Además, la UI de Aceites llama a sus relaciones
`sistemas asociados` sin explicar que el backend las agrupa por **sistema
raíz**, incluso cuando el aceite está en un subsistema profundo.

El spec debe revisar, como mínimo:

- `src/views/engrase/catalogo/CatalogoEngraseView.vue`;
- `src/views/engrase/catalogo/CatalogoSistemasSection.vue`;
- `src/views/engrase/catalogo/CatalogoAceitesSection.vue`;
- `src/components/engrase/catalogo/aceites/`;
- stores, servicios, mappers y pruebas bajo
  `src/stores/dbequipos/engrase/catalogo/`;
- la lectura que hoy consume `rpc_obtener_aceites_equipo` en el listado o
  detalle de equipos.

No se debe conservar ni introducir `sistema_aceite`, `sistemas_aceite` o una
relación plana de aceite por sistema.

## Contratos remotos

### Sistemas

`rpc_catalogo_sistemas_listar()` devuelve elementos con:

```ts
interface CatalogoSistemaItem {
  id: number;
  nombre: string;
  activo: boolean;
  creadoEn: string | null;
  actualizadoEn: string | null;
  aceites: CatalogoAceiteRelacionado[];
  impacto: CatalogoImpacto;
}
```

`aceites` e `impacto` son métricas de uso derivadas de los nodos de estructura;
no son relaciones que el usuario pueda editar en esta vista.

El guardado usa exclusivamente:

```json
{ "id": null, "nombre": "HIDRAULICO", "activo": true }
```

o, para actualizar:

```json
{ "id": 1, "nombre": "HIDRAULICO", "activo": false }
```

### Subsistemas

Crear módulos propios, paralelos a los de Sistemas:

```text
src/stores/dbequipos/engrase/catalogo/subsistemasCatalogo.types.ts
src/stores/dbequipos/engrase/catalogo/subsistemasCatalogo.mappers.ts
src/stores/dbequipos/engrase/catalogo/subsistemasCatalogo.service.ts
src/stores/dbequipos/engrase/catalogo/subsistemasCatalogo.store.ts
src/composables/engrase/catalogo/useCatalogoSubsistemas.ts
```

La respuesta de `rpc_catalogo_subsistemas_listar()` contiene, además de los
campos comunes:

```ts
interface CatalogoSubsistemaItem {
  id: number;
  nombre: string;
  activo: boolean;
  creadoEn: string | null;
  actualizadoEn: string | null;
  sistemas: CatalogoSistemaRelacionado[];
  aceites: CatalogoAceiteRelacionado[];
  impacto: CatalogoImpacto;
}
```

Los `sistemas` informan en qué raíces se utiliza el subsistema. No significan
que el subsistema quede ligado a un solo padre: puede aparecer bajo distintas
rutas y a distintas profundidades.

El guardado llama `rpc_catalogo_subsistema_guardar` con solo `id`, `nombre` y
`activo`. Errores como `SUBSISTEMA_NOMBRE_DUPLICADO` y
`SUBSISTEMA_NOMBRE_REQUERIDO` deben mostrar un mensaje accionable junto al
campo correspondiente.

### Aceites

`rpc_catalogo_aceites_listar()` conserva el catálogo de aceite y sus IDs. La
estructura `item.sistemas` debe interpretarse estrictamente como sistemas
**raíz** calculados al ascender desde cada nodo con aceite. Por ejemplo, si el
aceite está en `HIDRÁULICO > DIRECCIÓN > BOMBA`, la ficha de aceite muestra
`HIDRÁULICO`, no `BOMBA` como sistema.

El catálogo no crea asociaciones. El texto de ayuda debe indicar:

> Las ubicaciones y asignaciones se administran desde la Estructura de
> lubricación de cada equipo.

### Consulta de aceites de equipo

Modelar la respuesta sin wrapper de `rpc_obtener_aceites_equipo`:

```ts
interface AceiteEquipoRuta {
  sistema: string;
  subsistema: string | null;
  ruta: string;
  aceite: string;
}
```

La colección puede ser vacía. Cada fila representa un nodo que tiene aceite,
no un nodo sin aceite ni una asociación legacy. La UI siempre muestra `ruta`;
`subsistema` es solo un resumen del último nodo y nunca sustituye a la ruta.

## Validación, mappers y estado

- Usar Zod para respuestas de los RPC nuevos o modificados. Ningún resultado
  remoto no validado pasa a un store o componente.
- Rechazar IDs no positivos, nombres vacíos y contadores negativos.
- Normalizar fechas UTC por
  `src/utils/formatCompactPanamaDate.ts` en cualquier componente que presente
  `creadoEn` o `actualizadoEn`.
- No convertir una clave requerida ausente en `[]` como fallback silencioso.
  Una respuesta de catálogo incompleta debe crear un error recuperable de
  contrato.
- La carga debe deduplicarse por store y el filtrado, orden y paginación local
  no deben disparar nuevas RPC innecesarias.
- La creación o actualización reemplaza/insertan el elemento retornado por RPC
  y recalcula su resumen local sin recargar toda la pantalla.

## Experiencia de usuario

### Navegación del catálogo

Agregar `Subsistemas` como sección de primer nivel junto a Tipos de filtro,
Filtros, Aceites y Sistemas:

```text
Tipos de filtro | Filtros | Aceites | Sistemas | Subsistemas
```

La ruta, el tipo de sección y la navegación deben estar tipados. La sección
activa mantiene el mismo patrón de carga, filtros, drawer y foco que las otras
secciones de catálogo.

### Sección Sistemas

La experiencia existente se conserva con esta aclaración funcional:

- La tabla muestra nombre, estado, aceites utilizados y resumen de uso.
- Los aceites relacionados son una lectura agregada de los nodos cuyo sistema
  raíz coincide con el elemento.
- Crear o editar un sistema nunca agrega, elimina ni mueve estructura de un
  equipo.
- Al desactivar un sistema en uso, el diálogo de confirmación informa cuántos
  equipos se ven afectados y explica que el valor seguirá visible en equipos
  existentes, pero dejará de estar disponible en nuevas selecciones.

### Sección Subsistemas

Usar la misma disposición responsiva de Sistemas: toolbar, tabla en escritorio,
tarjetas en móvil, drawer de detalle y diálogos de descarte/confirmación.

La tabla de escritorio tiene:

```text
Nombre | Sistemas raíz donde se utiliza | Aceites relacionados | Estado | Uso | Abrir
```

En móvil, cada tarjeta debe mostrar el nombre, estado, hasta dos sistemas raíz
o aceites y el resumen `Equipos N · Asignaciones N`. La ruta completa no se
puede deducir del catálogo de subsistemas y no debe inventarse.

El drawer muestra:

```text
Detalles del subsistema
Nombre para mostrar *   [ DIRECCIÓN                 ]
Estado                  [ Activo | Desactivado      ]

Sistemas raíz donde se utiliza
HIDRÁULICO  4

Aceites relacionados
AW100       4

Resumen de uso
Equipos 4 · Total asignaciones 4
```

Los datos de impacto son de solo lectura. El drawer para crear omite las
secciones de impacto y explica que el subsistema se asigna posteriormente desde
la estructura de lubricación de un equipo.

### Sección Aceites

Conservar creación, edición, filtros y estado del catálogo de aceite. Ajustar
los textos de tabla, filtros y drawer para evitar ambigüedad:

- `Sistemas asociados` pasa a **Sistemas raíz donde se utiliza**.
- El filtro por sistema se etiqueta **Sistema raíz**.
- La ficha explica que el conteo puede incluir aceites asignados en
  subsistemas profundos.
- El texto de creación deja claro que crear un aceite no lo asigna a equipos.

No se agrega un selector de subsistema al catálogo de aceite: el RPC de aceite
agrupa métricas por raíz y la relación exacta vive en el equipo.

### Detalle de aceites de un equipo

Donde la aplicación muestre el resultado de `rpc_obtener_aceites_equipo`,
renderizar una lista compacta:

```text
Aceites de lubricación
HIDRÁULICO > DIRECCIÓN > BOMBA     AW100
TRANSMISIÓN                        80W90
```

- La ruta es el rótulo principal; el aceite es el valor asociado.
- Si la colección está vacía, mostrar `Sin aceites asignados en la estructura
de lubricación` sin tratarlo como error.
- Si una ruta es muy larga, truncarla visualmente solo si conserva un nombre
  accesible completo mediante `title` o `aria-label`.
- Este listado es de lectura. Para cambios, ofrecer un enlace o acción clara
  hacia la edición del equipo y su sección **Estructura de lubricación**.

## Reglas de interacción, accesibilidad y responsividad

- Todos los botones y elementos que emiten selección incluyen
  `cursor-pointer` cuando estén habilitados.
- Los controles de selección usan `vue-multiselect`; no usar `<select>` nativo
  para filtros o formularios de lista.
- Los botones y filas táctiles usan al menos 44 px en `xs` y `sm`; la densidad
  compacta del ERP se aplica desde escritorio.
- Los drawers son hojas inferiores desplazables en móvil y paneles laterales
  en escritorio. El foco vuelve al disparador al cerrarlos.
- Los diálogos de activación/desactivación y descarte atrapan el foco, permiten
  `Escape` cuando no hay guardado en curso y anuncian errores con `aria-live`.
- No usar solo color para comunicar `Activo`, `Desactivado` o `Conservado en
equipos existentes`.

## Archivos afectados

Como mínimo, revisar o crear:

- `src/views/engrase/catalogo/CatalogoEngraseView.vue`;
- `src/views/engrase/catalogo/CatalogoSistemasSection.vue`;
- `src/views/engrase/catalogo/CatalogoSubsistemasSection.vue`;
- `src/views/engrase/catalogo/CatalogoAceitesSection.vue`;
- `src/components/engrase/catalogo/sistemas/`;
- `src/components/engrase/catalogo/subsistemas/`;
- `src/components/engrase/catalogo/aceites/`;
- `src/stores/dbequipos/engrase/catalogo/sistemasCatalogo.*`;
- `src/stores/dbequipos/engrase/catalogo/subsistemasCatalogo.*`;
- `src/stores/dbequipos/engrase/catalogo/aceitesCatalogo.*`;
- `src/composables/engrase/catalogo/useCatalogoSubsistemas.ts`;
- el mapper, servicio, store y componentes que consumen
  `rpc_obtener_aceites_equipo`.

No duplicar modelos comunes de impacto ni componentes de estado si pueden ser
tipados y reutilizados sin ocultar las diferencias entre Sistemas y
Subsistemas.

## Pruebas mínimas

### Contrato y store

1. Mapper de sistemas acepta métricas agregadas de aceite por sistema raíz.
2. Mapper de subsistemas acepta sistemas y aceites relacionados, y rechaza una
   respuesta sin la colección requerida o con métricas inválidas.
3. Crear y actualizar un subsistema llama el RPC con solo `id`, `nombre` y
   `activo`.
4. Desactivar un sistema o subsistema conserva el elemento en catálogo y
   actualiza localmente resumen, filtros y selección.
5. Un error de nombre duplicado se asocia al campo de nombre y un error de
   transporte permite reintentar.
6. El store deduplica cargas concurrentes y filtra/ordena sin solicitar red.
7. El mapper de rutas de aceite acepta una lista vacía y una ruta profunda;
   rechaza texto vacío o estructura de wrapper `ok` no documentada.

### Componentes e interacción

1. La navegación permite abrir Subsistemas y conserva el foco en su título.
2. Sistemas y Subsistemas distinguen visualmente estado, uso y métricas sin
   presentar asociaciones editables.
3. El drawer de subsistema crea, edita, descarta y confirma cambios de forma
   accesible en móvil y escritorio.
4. Los filtros y formularios de lista usan `vue-multiselect`.
5. El catálogo de aceite etiqueta sus relaciones como sistemas raíz y no como
   ubicaciones planas.
6. Una ruta profunda de aceite de equipo se muestra completa para tecnologías
   asistivas y no se confunde con un único subsistema.
7. Los estados vacíos y de error tienen CTA de crear, limpiar o reintentar
   según corresponda.

### Regresión

- La edición de catálogo de aceite no altera estructura ni asignaciones de
  equipos.
- Las nuevas selecciones en creación y edición de estructura siguen ofreciendo
  solo valores activos; los valores inactivos existentes se preservan en el
  equipo.
- No queda código de producción que dependa de `sistema_aceite`,
  `sistemas_aceite` o `equipo_aceite_v2`.
- Typecheck, pruebas unitarias, pruebas de componentes y formato Prettier pasan.

## Criterios de aceptación

1. La navegación de catálogo incluye Sistemas, Subsistemas y Aceites como
   catálogos independientes.
2. Sistemas y Subsistemas permiten crear, renombrar, activar y desactivar;
   no permiten eliminar ni alterar nodos de equipos.
3. La UI de Aceites conserva su catálogo, pero comunica y filtra sus métricas
   por sistema raíz.
4. La lectura de aceites de un equipo muestra rutas completas de estructura y
   nunca pares legacy `sistema + aceite`.
5. Las pantallas administrativas manejan activos e inactivos correctamente y
   las nuevas asignaciones de equipo continúan usando solo activos.
6. Los contratos remotos inválidos fallan de forma visible y recuperable, sin
   degradarse silenciosamente a datos vacíos.
7. La interfaz es utilizable en móvil y escritorio, con foco, teclado, lectores
   de pantalla y controles de selección consistentes.

## Riesgos y mitigación

| Riesgo                                                        | Mitigación                                                                                      |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Tratar un subsistema como hijo de un sistema fijo.            | Mostrar solo métricas de raíces; no guardar padres en el catálogo.                              |
| Reintroducir asociaciones planas desde el catálogo de aceite. | Mantener los campos de impacto como solo lectura y enlazar cambios a Estructura de lubricación. |
| Ocultar equipos existentes al desactivar un catálogo.         | Separar catálogos administrativos de auxiliares activos y probar el flujo completo.             |
| Perder el contexto de un aceite profundo.                     | Presentar siempre `ruta` desde `rpc_obtener_aceites_equipo`.                                    |
| Duplicar tres implementaciones casi iguales.                  | Reutilizar primitivas de lista, drawer y métricas con contratos tipados, sin fusionar dominios. |

## Salida para el siguiente spec

Al terminar, el frontend tendrá catálogos completos y semánticamente correctos
para sistemas, subsistemas y aceites, y podrá mostrar el resultado estructural
de los aceites de cada equipo. El siguiente spec de estabilización podrá retirar
las últimas referencias legacy, ejecutar regresiones end-to-end y validar el
corte completo a producción.
