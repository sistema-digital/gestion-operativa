# SPEC-04 — Edición de estructura de lubricación

## Objetivo

Migrar la edición de equipos de Engrase desde asociaciones planas de
`Sistema + Aceite` a la experiencia de **Estructura de lubricación**.

La edición debe consumir la lista plana `estructura_sistemas` que devuelve el
backend, conservarla como fuente de verdad en el borrador, derivar un árbol
para la interfaz y guardar únicamente el diferencial en
`estructura_sistemas.nuevos`, `actualizados` y `eliminados`.

Al finalizar este spec, un usuario podrá crear, inspeccionar y eliminar nodos
de estructura; asignar, cambiar o quitar aceite en cualquier nodo; y guardar
todos esos cambios junto con los demás cambios del equipo. La unidad de trabajo
ya no es una relación `sistema + aceite`: es un nodo de estructura con aceite
opcional.

## Referencias obligatorias

- [Decisiones de la nueva estructura](./02_decisiones_nueva_estructura_engrase.md).
- [Contratos RPC de la nueva estructura](./03_rpc_payloads_nueva_estructura_engrase.md), especialmente las secciones 2 a 11, 12, 19 a 22, 25 a 31.
- [SPEC-01 — Contratos y modelo compartido](./04_spec_01_contratos_modelo_compartido.md).
- [SPEC-02 — Motor de borrador](./05_spec_02_motor_borrador_estructura_lubricacion.md).
- [SPEC-03 — Creación de estructura de lubricación](./06_spec_03_creacion_estructura_lubricacion.md).

En caso de contradicción, prevalecen las decisiones funcionales y el contrato
vigente de backend. No se debe conservar compatibilidad con el payload legacy.

## Dependencias de entrada

Este spec requiere que SPEC-01 y SPEC-02 estén terminados:

- el mapper de `rpc_obtener_equipo_para_edicion` expone
  `estructuraSistemas` como lista plana tipada;
- el mapper de auxiliares expone `sistemas`, `subsistemas` y `aceites` activos;
- el motor crea y clona borradores, deriva el árbol, valida invariantes y
  construye el payload diferencial;
- los nodos persistidos mantienen su `id`; los nuevos usan `tempId`;
- los catálogos inactivos ya asignados se preservan en la lectura de equipo.

SPEC-03 puede aportar componentes presentacionales reutilizables, pero la
edición no puede depender de supuestos exclusivos de creación, como que todos
los nodos sean temporales o que no existan valores inactivos.

## Estado actual que se reemplaza

Actualmente la edición muestra una sección **Aceites asociados** con filas
planas de sistema y aceite. Su overlay recibe una lista `sistemasAceite`, crea
o modifica objetos de la forma conceptual siguiente y calcula cambios bajo la
clave `aceites`:

```json
{
  "equipo_aceite_id": 30,
  "sistema": { "id": 1, "nombre": "HIDRAULICO" },
  "aceite": { "id": 2, "nombre": "AW100" }
}
```

Ese comportamiento es inválido porque:

- no representa `parent_id` ni subsistemas;
- no admite profundidad N;
- obliga a elegir un aceite junto con la ubicación;
- restringe erróneamente un aceite por sistema en vez de uno opcional por nodo;
- no permite quitar el aceite preservando el nodo;
- envía `aceites.nuevos`, `aceites.actualizados` y `aceites.eliminados`, bloque
  que el backend ya no admite.

No se debe crear un adaptador que transforme la estructura nueva a esta lista
plana para reutilizar la UI antigua.

## Alcance

1. Sustituir la sección visual de aceites por **Estructura de lubricación** en
   `EquipoEngraseEditarView.vue`.
2. Inicializar el borrador de edición con la lista plana original
   `estructuraSistemas` y mantener ese snapshot para el cálculo diferencial.
3. Integrar el motor de SPEC-02 con el store de edición para agregar raíces e
   hijos, cambiar o quitar aceite, mover hijos y eliminar subárboles.
4. Renderizar un árbol responsivo derivado de la lista plana, con acciones por
   nodo y confirmación explícita para eliminaciones estructurales.
5. Preservar en el árbol los sistemas, subsistemas y aceites inactivos que ya
   estaban asignados al equipo, sin ofrecerlos en nuevas selecciones.
6. Sustituir el bloque de cambios legacy por `estructura_sistemas` en el
   payload de `rpc_actualizar_equipo_completo`.
7. Actualizar estado de guardado, resumen, validaciones, accesibilidad y
   pruebas del flujo de edición afectado.

## Fuera de alcance

- Crear, editar, activar o desactivar catálogos de sistema, subsistema o
  aceite; eso corresponde al spec de catálogos.
- Cambiar la estructura de tablas, helpers o RPC de backend.
- Implementar arrastrar y soltar. Este spec expone **Mover** mediante una
  selección accesible de padre, porque el motor ya soporta el cambio de padre.
- Convertir un sistema raíz en subsistema, ni un subsistema en sistema raíz.
  Para ello el usuario crea el nodo de tipo correcto y elimina el anterior si
  corresponde.
- Modificar datos generales, etapas, filtros, imagen o navegación fuera de lo
  imprescindible para sustituir la sección legacy.

## Experiencia de usuario

### Sección de edición

La tarjeta o sección actual de aceites se reemplaza por:

```text
Estructura de lubricación                         [+ Agregar sistema]
Organice las ubicaciones del equipo y asigne aceite cuando corresponda.
3 nodos · 2 con aceite
```

Si no existen nodos, mostrar un estado vacío con icono Lucide `GitBranch` o
`Network`:

```text
Este equipo aún no tiene estructura de lubricación
Agregue un sistema para registrar sus ubicaciones y aceites.
[Agregar sistema]
```

El estado vacío no es un error ni bloquea guardar otros cambios del equipo.
El botón del encabezado y el del estado vacío ejecutan la misma intención:
abrir el drawer para agregar una raíz.

### Árbol de nodos

La interfaz debe mostrar la jerarquía y no una tabla de pares:

```text
▾ HIDRÁULICO                                      [⋯]
  Sin aceite
  └─ ▾ DIRECCIÓN                                   [⋯]
       Aceite: AW100
       └─ ▸ BOMBA                                  [⋯]
            Aceite: 85W140
```

Cada fila de nodo incluye:

- botón expandir/contraer únicamente cuando hay hijos activos;
- icono Lucide diferenciado para sistema raíz y subsistema;
- nombre de ubicación y ruta accesible completa;
- aceite asociado o el texto visible **Sin aceite**;
- señal textual discreta si el sistema, subsistema o aceite existente está
  inactivo, por ejemplo `Inactivo — conservado en este equipo`;
- botón de acciones `⋯` con `cursor-pointer` y nombre accesible que incluya el
  nombre del nodo;
- sangría por profundidad, con tope visual para no ocultar contenido en móvil.

El estado expandido se indexa por `localId` y pertenece a la interfaz. No se
guarda en el snapshot, el borrador ni el payload. La lista plana es la única
fuente de verdad del dominio.

### Acciones por nodo

El menú de acciones se abre como menú anclado en escritorio y como hoja de
acciones en móvil cuando el espacio sea insuficiente. Nunca puede quedar
recortado.

Para una raíz:

```text
HIDRÁULICO
- Agregar subsistema
- Asignar aceite / Cambiar aceite / Quitar aceite
- Eliminar estructura
```

Para un subsistema:

```text
DIRECCIÓN
- Agregar subsistema
- Asignar aceite / Cambiar aceite / Quitar aceite
- Mover a otro padre
- Eliminar estructura
```

Reglas:

- **Agregar subsistema** está disponible en cualquier nodo activo, sin límite
  de profundidad.
- **Asignar aceite** aparece solo cuando `aceiteId` es `null`.
- **Cambiar aceite** y **Quitar aceite** aparecen cuando existe aceite.
- Quitar aceite no borra el nodo ni requiere confirmación destructiva.
- **Mover a otro padre** solo se ofrece a subsistemas. No se ofrece a raíces.
- No se muestran opciones para convertir el tipo de un nodo ni para añadir un
  sistema debajo de otro nodo.

### Drawer para agregar sistema raíz

En escritorio se presenta como drawer lateral; en móvil como hoja inferior.

```text
Agregar sistema
Ubicación raíz de la estructura de lubricación.

Sistema *       [Seleccione un sistema ▼]
Aceite          [Sin aceite ▼]

[Cancelar] [Agregar sistema]
```

- Ambos selects usan `vue-multiselect`.
- Sistema lista exclusivamente `auxiliares.sistemas` activos.
- Aceite es opcional, contiene una opción explícita `Sin aceite` y lista solo
  `auxiliares.aceites` activos.
- No muestra select de padre ni de subsistema.
- El CTA queda deshabilitado hasta seleccionar un sistema válido.

### Drawer para agregar subsistema

```text
Agregar subsistema
Dentro de: HIDRÁULICO > DIRECCIÓN

Subsistema *    [Seleccione un subsistema ▼]
Aceite          [Sin aceite ▼]

[Cancelar] [Agregar subsistema]
```

El padre se identifica por `localId`. La ruta se deriva del árbol al abrir el
drawer y no se duplica en el estado del formulario. El drawer solo ofrece
`auxiliares.subsistemas` activos y aceite activo opcional.

### Drawer para aceite

Asignar o cambiar aceite es una acción limitada al atributo del nodo:

```text
Cambiar aceite
Ubicación: HIDRÁULICO > DIRECCIÓN

Aceite          [AW100 ▼]

[Cancelar] [Guardar aceite]
```

No permite cambiar padre, sistema o subsistema. Al editar una asignación ya
existente, el aceite actualmente asociado se muestra aunque sea inactivo; no
aparece como opción para otros nodos. Elegir `Sin aceite` equivale a enviar
`aceite_id: null` para ese nodo persistido.

### Movimiento de subsistema

Para evitar introducir arrastrar y soltar sin una especificación completa, la
acción **Mover a otro padre** abre un drawer:

```text
Mover subsistema
Mover: HIDRÁULICO > DIRECCIÓN > BOMBA

Nuevo padre *   [Seleccione una ubicación ▼]

[Cancelar] [Mover]
```

La lista muestra nodos activos del mismo equipo que sean destinos válidos. No
incluye el nodo a mover ni sus descendientes. Debe usar `vue-multiselect` y
mostrar una ruta legible para distinguir nombres repetidos. Si no hay destinos
válidos, la acción se deshabilita con explicación visible.

### Eliminación de estructura

Antes de mutar el borrador, la interfaz obtiene el subárbol activo desde el
motor. El diálogo informa el impacto real:

```text
¿Eliminar HIDRÁULICO?
Se eliminarán 4 nodos de la estructura y 2 asignaciones de aceite.
También se eliminarán: HIDRÁULICO > DIRECCIÓN > BOMBA > REDUCTOR

[Cancelar] [Eliminar estructura]
```

Al confirmar:

- nodos persistidos quedan `pendiente_eliminacion` para formar
  `estructura_sistemas.eliminados`;
- nodos nuevos del subárbol se retiran del borrador, porque nunca se enviarán
  como eliminados;
- el árbol deja de mostrar el subárbol activo;
- una acción de deshacer disponible en la sección permite restaurar el último
  subárbol eliminado mientras su padre también sea restaurable.

## Integración con el store de edición

### Estado

Sustituir en el snapshot y borrador los campos legacy `aceites` y sus estados
de operación por los nombres del dominio nuevo:

```ts
interface EquipoEdicionSnapshot {
  // datos, etapas, filtros e imagen existentes
  estructuraSistemas: NodoEstructuraLubricacion[];
}

interface EquipoEdicionDraft {
  // datos, etapas, filtros e imagen existentes
  estructuraSistemas: NodoEstructuraBorrador[];
}
```

El store conserva el snapshot original sin mutar y crea el borrador con el
motor. El árbol mostrado se deriva mediante `computed` a partir de
`draft.estructuraSistemas`; nunca se persiste una copia recursiva mutable.

El auxiliar de edición debe contener:

```ts
interface AuxiliaresEdicionEquipo {
  // tipos de equipo, etapas y filtros existentes
  sistemas: CatalogoActivo[];
  subsistemas: CatalogoActivo[];
  aceites: CatalogoActivo[];
}
```

No debe declarar ni completar `sistemasAceite`.

### Acciones de store requeridas

El store expone acciones tipadas de intención de dominio y delega en SPEC-02:

- `agregarSistemaRaiz(input)`;
- `agregarSubsistema(input)`;
- `actualizarAceiteNodo(input)`;
- `quitarAceiteNodo(localId)`;
- `moverNodo(input)`;
- `obtenerSubarbolParaEliminar(localId)`;
- `confirmarEliminarNodo(localId)`;
- `deshacerEliminacionNodo(localId)`.

Las acciones reemplazan la lista reactiva con la respuesta del motor. No
buscan ni identifican nodos por nombre; usan `localId`, `id` o `tempId` según
corresponda. Los errores del motor se convierten a la sección
`estructura-lubricacion` para la interfaz, sin reutilizar la sección legacy
`aceites`.

### Validación y capacidad de guardado

- La estructura vacía es válida.
- Si hay nodos activos, cada operación y el guardado ejecutan la validación
  integral del motor.
- Los errores por nodo se presentan cerca del nodo o del drawer que originó la
  acción; los errores globales se presentan en la cabecera de la sección.
- Un valor inactivo ya asociado no es un error por sí mismo.
- Una nueva selección inactiva, una raíz sin sistema, un hijo sin subsistema,
  un ciclo, un padre inexistente o un aceite inválido bloquean guardar.
- `hasOilChanges`, `hasOilErrors`, `activeOilsCount` y sus etiquetas se
  reemplazan por métricas coherentes de estructura, por ejemplo
  `hasStructureChanges`, `hasStructureErrors`, `activeStructureNodesCount` y
  `assignedOilsCount`.

## Persistencia y payload

`construirCambiosEquipo` debe delegar la comparación de estructura al motor y
adjuntar el resultado únicamente si hay diferencia:

```json
{
  "estructura_sistemas": {
    "nuevos": [
      {
        "temp_id": "estructura_7",
        "parent_temp_id": null,
        "sistema_id": 1,
        "subsistema_id": null,
        "aceite_id": null
      },
      {
        "temp_id": "estructura_8",
        "parent_temp_id": "estructura_7",
        "sistema_id": null,
        "subsistema_id": 5,
        "aceite_id": 2
      }
    ],
    "actualizados": [
      {
        "id": 301,
        "aceite_id": null
      },
      {
        "id": 302,
        "parent_id": 300
      }
    ],
    "eliminados": [{ "id": 305 }]
  }
}
```

Reglas:

- no enviar una clave top-level `aceites` bajo ninguna circunstancia;
- no enviar todos los nodos persistidos: solo cambios;
- quitar aceite de un nodo persistido envía `{ id, aceite_id: null }`;
- crear un nodo bajo padre persistido o temporal debe usar la forma de padre
  definida por el contrato final de backend; se debe cubrir explícitamente en
  pruebas de integración;
- un nodo persistido movido debajo de un padre nuevo utiliza `parent_temp_id`;
- eliminar un padre solo requiere sus IDs declarados por el motor; no enviar
  descendientes duplicados si la cascada del backend los elimina;
- una edición sin cambios de estructura puede omitir `estructura_sistemas`;
  si se decide enviarlo por consistencia, debe contener los tres arreglos
  vacíos y nunca el bloque legacy.

Después de un guardado exitoso, el store debe reconstruir snapshot y borrador
con la respuesta confirmada por backend. Si la respuesta contiene
`estructura_temp_ids`, debe reconciliar los temporales solo mediante esa
respuesta o mediante una recarga explícita y validada del equipo; no inventar
IDs locales.

## Componentes y responsabilidades

La vista de ruta sigue siendo una superficie de composición. Puede reutilizar
los componentes visuales de SPEC-03 únicamente si sus contratos ya son de
estructura, no de pares legacy.

| Componente o módulo                      | Responsabilidad                                           | Contrato principal                                       |
| ---------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------- |
| `EquipoEngraseEditarView.vue`            | Compone secciones y conecta el store con la UI.           | Pasa árbol, auxiliares y eventos tipados.                |
| `EquipoEstructuraLubricacionSection.vue` | Cabecera, estado vacío, árbol, errores y deshacer.        | Eventos: agregar raíz y acciones por `localId`.          |
| `EstructuraLubricacionTree.vue`          | Renderiza raíces y filas recursivas derivadas.            | Props de solo lectura; eventos por `localId`.            |
| `EstructuraLubricacionNodeRow.vue`       | Expansión, nombre, estado de aceite e invocación de menú. | Props de nodo y estado visual; evento de acción.         |
| `EstructuraLubricacionNodeDrawer.vue`    | Formularios para raíz, hijo, aceite y movimiento.         | Props tipadas de modo, contexto y auxiliares; `confirm`. |
| `EstructuraLubricacionDeleteDialog.vue`  | Explica y confirma impacto del subárbol.                  | Props: nodo y subárbol; eventos confirmar/cancelar.      |
| Store de edición                         | Mantiene snapshot, lista plana y save lifecycle.          | Delega al motor y al servicio RPC.                       |

Los nombres de archivo pueden ajustarse, pero no se debe mantener
`EquipoAceiteDraftRow.vue`, `EquipoAceiteForm.vue`, `EquipoAceiteOverlay.vue`
ni `EquipoAceitesSection.vue` para representar el comportamiento anterior.
Se eliminan una vez no tengan consumidores.

## Adaptación móvil, accesibilidad y teclado

- Usar una lista semántica con botones explícitos en lugar de `role="tree"`,
  salvo que se implemente íntegramente la navegación ARIA de árbol.
- Cada fila táctil y cada botón de icono conserva objetivo mínimo de 44 px en
  `xs` y `sm`; en escritorio puede usar la escala compacta de ERP.
- Las acciones que emiten selección, incluidos expansión, menú y CTAs, llevan
  `cursor-pointer` cuando estén habilitadas.
- Los drawers son hoja inferior desplazable en móvil y panel lateral en
  escritorio. Al abrir, el foco llega al título y luego al primer selector; al
  cerrar, vuelve al disparador.
- `Escape` cierra menú o drawer sin mutar. Un diálogo de eliminación atrapa
  foco y enfoca inicialmente `Cancelar`.
- Los errores se anuncian con `aria-live` y se conectan mediante
  `aria-describedby` al multiselect correspondiente.
- El color nunca es el único indicador de aceite ausente o catálogo inactivo.
- Las rutas profundas se exponen en `aria-label`, `title` o texto auxiliar si
  la presentación móvil limita la sangría.

## Archivos afectados

Revisar y migrar como mínimo:

- `src/views/engrase/EquipoEngraseEditarView.vue`;
- `src/components/engrase/edicion/aceites/EquipoAceitesSection.vue`;
- `src/components/engrase/edicion/aceites/EquipoAceiteDraftRow.vue`;
- `src/components/engrase/edicion/aceites/EquipoAceiteForm.vue`;
- `src/components/engrase/edicion/aceites/EquipoAceiteOverlay.vue`;
- `src/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types.ts`;
- `src/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.store.ts`;
- `src/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.payload.ts`;
- `src/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.validation.ts`;
- `src/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.mappers.ts`;
- DTOs, servicio y pruebas de edición afectados;
- componentes compartidos de estructura de lubricación generados en SPEC-03,
  cuando corresponda reutilizarlos o extenderlos.

Los componentes nuevos de edición pueden residir en
`src/components/engrase/edicion/estructura-lubricacion/`. Mantenerlos fuera de
`edicion/aceites/` evita perpetuar el modelo conceptual anterior.

## Pruebas mínimas

### Store, mapper y payload

1. La lectura de edición mapea una raíz sin aceite y descendientes de tres o
   más niveles como lista plana válida.
2. Un sistema, subsistema o aceite inactivo existente se conserva y se muestra
   en el borrador.
3. Agregar raíz, hijo temporal y nieto temporal genera padres mediante
   `parent_temp_id`.
4. Agregar un hijo bajo padre persistido usa el formato de padre confirmado por
   el contrato de backend.
5. Cambiar aceite de un nodo existente produce un único elemento en
   `actualizados`.
6. Quitar aceite de un nodo existente produce `{ id, aceite_id: null }` y no
   produce una eliminación estructural.
7. El mismo aceite puede asignarse a varios nodos distintos.
8. Mover un subsistema cambia solo el padre del nodo permitido y rechaza mover
   raíces, el propio nodo, descendientes o destinos de otro equipo.
9. Eliminar un subárbol persistido emite solo los IDs que exige la cascada, sin
   duplicar descendientes; eliminar un subárbol totalmente nuevo no emite
   eliminados.
10. Una actualización que no cambia estructura no contiene la clave legacy
    `aceites` y no genera falsos cambios.
11. La respuesta exitosa reconcilia `estructura_temp_ids` y reinicia el estado
    sucio correctamente.

### Componentes e interacción

1. La sección se titula **Estructura de lubricación** y no **Aceites
   asociados**.
2. El árbol representa raíz, hijo y nieto, con expansión independiente y ruta
   accesible.
3. El estado vacío y el botón de cabecera abren el mismo drawer de raíz.
4. El drawer de raíz no presenta padre ni subsistema; el de hijo presenta la
   ruta de padre y solo subsistemas.
5. Los selects usan `vue-multiselect`; las opciones nuevas son exclusivamente
   activas.
6. Un valor inactivo existente se muestra en el nodo y en el drawer de cambio,
   pero no como opción para otra asignación.
7. Quitar aceite conserva la fila y muestra `Sin aceite`.
8. El menú de una raíz no ofrece mover; el de un subsistema sí cuando existe
   un destino válido.
9. El diálogo de eliminación indica el total de nodos y aceites del subárbol
   antes de confirmar.
10. En móvil no hay desbordamiento horizontal y los drawers, menús y diálogos
    mantienen foco y son operables mediante teclado.

### Regresión

- Edición de datos, etapas, filtros e imagen continúa funcionando.
- Los indicadores de cambios y errores de la vista distinguen estructura de
  filtros y datos generales.
- Guardar cambios de estructura actualiza el listado de equipos sin recargar
  innecesariamente toda la lista.
- No quedan referencias de producción a `sistemasAceite`, `equipo_aceite_id`,
  `EquipoAceite*`, `EquipoAceitesSection` ni al bloque top-level `aceites` en
  el flujo de edición.

## Criterios de aceptación

1. La edición renderiza y modifica una **Estructura de lubricación** basada en
   lista plana y árbol derivado, no asociaciones planas.
2. Se pueden agregar sistemas raíz, subsistemas a profundidad N y aceite
   opcional en cualquier nodo.
3. Se pueden cambiar y quitar aceites sin borrar nodos; quitar aceite envía
   `aceite_id: null` para nodos persistidos.
4. La edición conserva valores inactivos existentes y solo ofrece catálogos
   activos para nuevas selecciones.
5. El movimiento de subsistemas y la eliminación de subárboles respetan las
   invariantes del motor y presentan confirmación clara cuando corresponde.
6. `rpc_actualizar_equipo_completo` recibe exclusivamente el diferencial bajo
   `estructura_sistemas`; el bloque legacy `aceites` no se produce ni se
   consume.
7. Estado, mensajes, métricas y pruebas dejan de usar lenguaje de aceite por
   sistema y pasan a hablar de nodos de estructura.
8. La interfaz es usable en móvil y escritorio, accesible con teclado, foco y
   lectores de pantalla.
9. Typecheck, pruebas unitarias, pruebas de componentes y regresiones del
   flujo de edición pasan.

## Riesgos y mitigación

| Riesgo                                       | Mitigación                                                                         |
| -------------------------------------------- | ---------------------------------------------------------------------------------- |
| Reducir el árbol a filas de sistema y aceite | Derivar siempre la vista desde `parentId` y probar profundidad N.                  |
| Perder valores inactivos existentes          | Separar referencias de lectura de auxiliares activos y cubrir ambos casos.         |
| Enviar nodos completos o payload legacy      | Centralizar el diff en el motor y probar la forma exacta de `estructura_sistemas`. |
| Borrar accidentalmente descendientes         | Consultar subárbol y confirmar conteos y rutas antes de mutar.                     |
| Crear ciclos mediante movimiento             | Filtrar destinos en UI y validar nuevamente en el motor antes de guardar.          |
| Duplicar estado entre árbol y borrador       | Persistir solo lista plana; expansión y árbol son derivados de UI.                 |
| Hacer la edición impracticable en móvil      | Usar tarjetas/filas compactas, hoja inferior y pruebas de viewport pequeño.        |

## Salida para el siguiente spec

Al terminar, creación y edición utilizarán el mismo modelo de estructura de
lubricación. El spec de catálogos podrá añadir la administración de
subsistemas y ajustar las estadísticas de aceites a sistemas raíz, sin volver a
introducir asociaciones planas en los formularios de equipo.
