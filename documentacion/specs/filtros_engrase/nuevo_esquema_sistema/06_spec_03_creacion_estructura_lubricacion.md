# SPEC-03 — Creación de equipo: estructura de lubricación

## Objetivo

Migrar el paso 3 del wizard de creación de equipos desde la lista legacy de
**Aceites asociados** hacia una interfaz de árbol llamada
**Estructura de lubricación**.

La interfaz permitirá que la persona usuaria construya la ubicación funcional
del aceite en el equipo:

- crear sistemas raíz;
- agregar subsistemas bajo cualquier nodo, sin límite de profundidad;
- asignar, cambiar o retirar un aceite en cualquier nodo;
- eliminar un nodo junto con su subárbol, previa confirmación cuando aplique.

La fuente de verdad local seguirá siendo la lista plana del borrador. El árbol
solo será una proyección de presentación. Al crear el equipo, el wizard enviará
`estructura_sistemas.nuevos`, incluso si la lista está vacía; nunca enviará el
bloque legacy `aceites`.

## Referencias obligatorias

- [Decisiones de la nueva estructura](./02_decisiones_nueva_estructura_engrase.md), en especial las decisiones 5, 8 a 18, 20 a 28, 31 y 39.
- [Contratos RPC de la nueva estructura](./03_rpc_payloads_nueva_estructura_engrase.md), en especial las secciones 2 a 5, 12, 18, 23 y 31.
- [SPEC-01 — Contratos y modelo compartido](./04_spec_01_contratos_modelo_compartido.md).
- [SPEC-02 — Motor de borrador](./05_spec_02_motor_borrador_estructura_lubricacion.md).

Ante cualquier diferencia, prevalece el contrato RPC vigente del backend.

## Dependencias de entrada

Antes de iniciar este spec deben estar terminados SPEC-01 y SPEC-02:

1. Los auxiliares de creación exponen `sistemas`, `subsistemas` y `aceites`
   activos.
2. El motor de borrador puede agregar, actualizar aceite, marcar eliminación,
   construir el árbol derivado y producir `estructura_sistemas.nuevos`.
3. El contrato vigente permite crear un hijo nuevo bajo un padre persistido con
   `parent_id`; cuando el padre también es nuevo, usa `parent_temp_id`. Ambos
   campos no pueden enviarse con valores no nulos simultáneamente. En creación
   el flujo base usa `parent_temp_id`, porque todos los nodos del equipo son
   nuevos.

## Estado actual que se reemplaza

El paso 3 actual tiene como título **Aceites asociados** y muestra filas planas
con un sistema y un aceite. Al usar “Agregar aceite” abre un overlay con dos
selectores, bloquea repetir el sistema y persiste el resultado como:

```json
{
  "aceites": {
    "nuevos": [
      {
        "sistema": { "id": 1 },
        "aceite": { "id": 2 }
      }
    ]
  }
}
```

Este comportamiento debe retirarse porque no permite una estructura sin aceite,
subsistemas ni profundidad N. Tampoco debe sobrevivir la regla de “un aceite
por sistema”: la restricción real es un solo aceite opcional por **nodo**.

## Alcance

1. Sustituir el paso visual de aceites del wizard por **Estructura de
   lubricación**.
2. Integrar el motor de SPEC-02 al store de creación como única vía de
   mutación de los nodos.
3. Implementar el árbol, los menús contextuales, los drawers de nodo y la
   confirmación de eliminación de subárbol.
4. Convertir la validación y el resumen del wizard al nuevo modelo.
5. Construir el payload de creación usando `estructura_sistemas.nuevos`.
6. Retirar del flujo de creación los componentes, referencias y pruebas del
   modelo plano de aceites.
7. Cubrir desktop, móvil, teclado, lectores de pantalla y estados vacíos.

## Fuera de alcance

- Editar estructuras de equipos ya creados; eso corresponde a SPEC-04.
- Reordenar nodos o implementar arrastrar y soltar. La creación conserva el
  orden de inserción de la lista plana.
- Crear, editar, activar o desactivar catálogos de sistemas, subsistemas o
  aceites desde este paso; eso corresponde al spec de catálogos.
- Cambiar RPC, tablas o funciones de backend.
- Administrar la imagen del equipo, filtros, datos generales o etapas.

## Experiencia de usuario

### Paso del wizard

El paso 3 debe mostrar:

```text
Estructura de lubricación                         [+ Agregar sistema]
Defina los sistemas del equipo y, si corresponde, el aceite de cada ubicación.
Opcional · 0 nodos
```

No debe indicar “0 asociaciones” ni usar “Aceites asociados” como título. La
estructura es opcional: un equipo puede avanzar sin nodos, pero el payload debe
incluir `estructura_sistemas: { nuevos: [] }`.

Cuando no existan nodos, mostrar un estado vacío con icono `GitBranch` o
`Network` de Lucide:

```text
Aún no hay estructura de lubricación
Agregue un sistema para comenzar a organizar las ubicaciones de lubricación.
[Agregar sistema]
```

El botón principal y el botón de estado vacío ejecutan la misma intención
`agregar-raiz`. Deben ser `type="button"`, incluir `cursor-pointer` cuando
estén habilitados y `cursor-not-allowed` cuando el wizard esté bloqueado.

### Árbol de nodos

El árbol debe representar una ruta, no una tabla de asociaciones planas:

```text
▾ HIDRÁULICO                                      [⋯]
  Sin aceite
  └─ ▾ DIRECCIÓN                                   [⋯]
       Aceite: AW100
       └─ ▸ BOMBA                                  [⋯]
            Sin aceite
```

Cada fila de nodo debe incluir:

- control expandir/contraer solo si tiene hijos;
- icono visual distinto para sistema raíz y subsistema;
- nombre de la ubicación;
- estado del aceite: nombre, o “Sin aceite”;
- indicador discreto si algún catálogo asociado está inactivo;
- menú de acciones contextual;
- profundidad aplicada mediante sangría, no mediante una columna fija.

No se debe limitar visualmente la profundidad. Para evitar que una ruta muy
profunda pierda el contenido en móvil, la sangría debe tener un máximo visual
razonable y la ruta completa debe quedar disponible como `title`, texto de
apoyo o `aria-label`.

La lista plana del borrador no se modifica al expandir o contraer nodos. El
estado de expansión pertenece a la UI y se indexa por `localId`.

### Menú contextual de nodo

El control `⋯` abre un menú o drawer de acciones. Debe usar un icono Lucide y
ser un botón accesible con `aria-label` que incluya el nombre del nodo.

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
- Eliminar estructura
```

No se ofrece “Agregar sistema” dentro de un nodo, “convertir en sistema” ni
“mover” en este spec. Un sistema solo se agrega como raíz; todos sus
descendientes son subsistemas.

Si el nodo no tiene aceite, se muestra **Asignar aceite**. Si ya tiene uno, se
muestran **Cambiar aceite** y **Quitar aceite**. Quitar aceite no requiere
confirmación destructiva: conserva el nodo y actualiza su estado a “Sin
aceite”.

### Drawer para agregar una raíz

Al pulsar “Agregar sistema” se abre un drawer en desktop y una hoja inferior
en móvil. Debe mostrar:

```text
Agregar sistema
Ubicación raíz de la estructura de lubricación.

Sistema *       [Seleccione un sistema ▼]
Aceite          [Sin aceite ▼]

[Cancelar] [Agregar sistema]
```

Reglas de UI:

- El selector de sistema usa `vue-multiselect` y solo lista auxiliares activos.
- El selector de aceite usa `vue-multiselect`, incluye explícitamente la opción
  “Sin aceite” y solo lista aceites activos.
- No hay selector de padre ni selector de subsistema.
- El CTA queda deshabilitado hasta seleccionar un sistema válido.
- El mismo sistema puede aparecer como raíz más de una vez solo si el backend
  lo permite; este spec no inventa una restricción de unicidad no documentada.

### Drawer para agregar un subsistema

La acción contextual “Agregar subsistema” abre el mismo patrón de drawer, con
el padre visible y no editable:

```text
Agregar subsistema
Dentro de: HIDRÁULICO > DIRECCIÓN

Subsistema *    [Seleccione un subsistema ▼]
Aceite          [Sin aceite ▼]

[Cancelar] [Agregar subsistema]
```

El drawer recibe el `parentLocalId`, deriva la ruta desde el árbol y llama al
motor con ese identificador. No almacena rutas ni padres duplicados dentro del
estado del componente.

### Drawer para asignar o cambiar aceite

Esta acción debe ser deliberadamente estrecha: no permite editar la ubicación
ni su padre.

```text
Asignar aceite
Ubicación: HIDRÁULICO > DIRECCIÓN

Aceite          [AW100 ▼]

[Cancelar] [Guardar aceite]
```

Para nodos nuevos se muestran solo aceites activos. El control incluye “Sin
aceite” únicamente cuando la acción es cambiar aceite; elegirla equivale a
quitar el aceite y mantiene la estructura.

### Eliminación de estructura

Al elegir “Eliminar estructura”, primero se consulta el subárbol al motor. Si
el nodo no tiene descendientes, se pide confirmación breve; si los tiene, el
diálogo debe mostrar alcance inequívoco:

```text
¿Eliminar HIDRÁULICO?
Se eliminarán 4 nodos de la estructura y 2 asignaciones de aceite:
HIDRÁULICO > DIRECCIÓN > BOMBA > REDUCTOR

[Cancelar] [Eliminar estructura]
```

El diálogo debe informar cantidad de nodos y aceites que se retirarán. La
confirmación llama a `marcarNodoParaEliminar`; cancelar no muta el borrador.
Un nodo nuevo se retira completamente del borrador; un nodo persistido no
aplica en creación, pero el componente debe mantener una API compatible con el
motor sin exponer controles que no apliquen.

### Adaptación móvil

- En `xs` y `sm`, cada nodo se muestra como tarjeta o fila táctil de altura
  mínima de 44 px; el título, aceite y menú no deben truncarse sin alternativa
  accesible.
- Los drawers se presentan como hoja inferior con `max-height` y área interna
  desplazable; en `sm` en adelante pueden presentarse como panel lateral.
- Los menús que no dispongan de espacio deben convertirse en una hoja de
  acciones, no quedar recortados.
- La acción primaria ocupa el ancho disponible en móvil; los controles
  secundarios permanecen alcanzables sin desplazamiento horizontal.

## Arquitectura de componentes

La vista de ruta debe ser una superficie de composición; no debe concentrar el
estado visual, el árbol, la validación ni la construcción de payload.

| Componente o módulo                           | Responsabilidad                                               | Contrato principal                                                                           |
| --------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `EquipoEngraseCrearView.vue`                  | Componer el paso y conectar acciones del wizard con el store. | Pasa borrador, auxiliares y eventos tipados.                                                 |
| `EquipoCreacionEstructuraLubricacionStep.vue` | Encabezado, estado vacío, árbol y apertura de acciones.       | Props: árbol, bloqueo y errores; eventos: agregar raíz, abrir acción, confirmar eliminación. |
| `EstructuraLubricacionTree.vue`               | Renderizar raíces y delegar cada fila.                        | Props: nodos derivados y expansión; eventos de interacción por `localId`.                    |
| `EstructuraLubricacionNodeRow.vue`            | Mostrar un nodo, su aceite, expansión y menú contextual.      | Props: nodo y estado; eventos: alternar, acción.                                             |
| `EstructuraLubricacionNodeDrawer.vue`         | Formularios para raíz, hijo y aceite.                         | Props: modo, nodo o padre, auxiliares; evento `confirm` tipado.                              |
| `EstructuraLubricacionDeleteDialog.vue`       | Confirmar eliminación y explicar alcance.                     | Props: subárbol; eventos confirmar/cancelar.                                                 |
| Store de creación                             | Conservar lista plana reactiva y delegar mutaciones al motor. | Acciones tipadas que devuelven resultado del motor.                                          |

Se pueden ajustar los nombres, pero cada responsabilidad debe mantenerse. No
se debe reutilizar `EquipoCreacionAceiteForm.vue`,
`EquipoCreacionAceiteOverlay.vue` ni `EquipoCreacionAceitesStep.vue` como
contenedores del comportamiento legacy. Si se reutiliza alguna pieza visual,
debe quedar libre de conceptos `sistema + aceite` y aceptar contratos nuevos.

## Integración con el store de creación

### Estado de borrador

Sustituir `draft.aceites` por una lista plana de nodos de estructura, por
ejemplo `draft.estructuraSistemas`. Esta es la única fuente de verdad. El árbol
se obtiene con `construirArbolEstructura` del SPEC-02 mediante un `computed`.

El store debe exponer acciones con intención de dominio, como:

- `agregarSistemaRaiz`;
- `agregarSubsistema`;
- `asignarAceiteNodo`;
- `quitarAceiteNodo`;
- `solicitarEliminarNodo` o una consulta del subárbol;
- `confirmarEliminarNodo`;
- `alternarExpansionNodo` solo si el estado de expansión se mantiene en el
  store, aunque se prefiere conservarlo en el componente de paso.

Cada acción delega en una función pura del motor, reemplaza la lista reactiva
con el resultado y preserva los errores con códigos que la UI pueda mostrar.
No debe mutar directamente el árbol derivado, ni buscar por el nombre de un
sistema o aceite.

### Auxiliares

El paso consume exclusivamente:

- `auxiliares.sistemas` para raíces;
- `auxiliares.subsistemas` para hijos;
- `auxiliares.aceites` para el atributo opcional del nodo.

Los tres listados contienen solo elementos activos para acciones nuevas. En
creación no hay asociaciones antiguas que preservar, por lo que no se deben
insertar valores inactivos como opciones adicionales.

### Validación del paso

El paso es opcional; una estructura vacía no genera error. Si hay nodos, cada
mutación y el avance del wizard deben ejecutar la validación del motor.

Los errores se presentan dentro del paso, cerca del nodo o del drawer cuando
incluyan `localId`. Los errores globales se muestran bajo el encabezado. Deben
impedir avanzar únicamente cuando exista una estructura no vacía e inválida.

No debe persistir una lista de errores legacy de aceites ni usar los mensajes
“Sólo puede existir un aceite activo para el sistema”.

### Revisión y creación transaccional

La pantalla de revisión debe sustituir la tabla de pares sistema/aceite por una
representación legible del árbol o sus rutas. Ejemplo:

```text
Estructura de lubricación
HIDRÁULICO
└─ DIRECCIÓN · AW100
```

Al construir el argumento de `rpc_crear_equipo_completo`, incluir siempre:

```json
{
  "estructura_sistemas": {
    "nuevos": [
      {
        "temp_id": "estructura_1",
        "parent_temp_id": null,
        "sistema_id": 1,
        "subsistema_id": null,
        "aceite_id": null
      },
      {
        "temp_id": "estructura_2",
        "parent_temp_id": "estructura_1",
        "sistema_id": null,
        "subsistema_id": 5,
        "aceite_id": 2
      }
    ]
  }
}
```

Para una creación sin nodos, el resultado obligatorio es:

```json
{
  "estructura_sistemas": {
    "nuevos": []
  }
}
```

El objeto enviado no puede contener una clave top-level `aceites`, ni bloques
`nuevos`, `actualizados` o `eliminados` bajo dicha clave.

## Accesibilidad y comportamiento de teclado

- El árbol usa semántica de lista o árbol de forma coherente. Si se adopta
  `role="tree"`, se debe implementar por completo navegación con flechas,
  `Home`, `End`, expandir y contraer; de lo contrario se usará una lista
  semántica con botones explícitos, que es el enfoque recomendado para este
  spec.
- Todo botón de icono tiene nombre accesible; por ejemplo,
  “Acciones para HIDRÁULICO” o “Contraer DIRECCIÓN”.
- Al abrir un drawer, el foco llega a su título y después al primer selector.
  `Escape` cierra sin guardar cuando no hay una confirmación activa.
- Al cerrar, el foco vuelve al botón que abrió el drawer o menú.
- El diálogo de eliminación atrapa el foco y enfoca inicialmente la acción
  segura “Cancelar”.
- Los errores del formulario se anuncian mediante región `aria-live` y se
  vinculan a sus selectores con `aria-describedby`.
- No se comunica información únicamente mediante color: “Sin aceite” y los
  catálogos inactivos deben tener texto visible.

## Archivos afectados

La implementación debe revisar, como mínimo:

- `src/views/engrase/EquipoEngraseCrearView.vue`;
- `src/components/engrase/creacion/aceites/EquipoCreacionAceitesStep.vue`;
- `src/components/engrase/creacion/aceites/EquipoCreacionAceiteForm.vue`;
- `src/components/engrase/creacion/aceites/EquipoCreacionAceiteOverlay.vue`;
- `src/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types.ts`;
- `src/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.store.ts`;
- `src/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.payload.ts`;
- `src/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.validation.ts`;
- componentes y pruebas de revisión del wizard;
- pruebas de componentes, store, payload y flujo de creación afectadas.

Los componentes nuevos pueden ubicarse en
`src/components/engrase/creacion/estructura-lubricacion/` para separar el
dominio nuevo de la carpeta legacy `aceites`. Tras completar la migración,
eliminar los componentes legacy que no tengan otro consumidor.

## Pruebas mínimas

### Unitarias: store y payload

1. Una creación sin estructura construye `estructura_sistemas.nuevos: []`.
2. Agregar una raíz sin aceite genera nodo temporal válido.
3. Agregar un subsistema bajo una raíz temporal usa su `parent_temp_id`.
4. Se permiten tres o más niveles de subsistema.
5. Un mismo aceite se puede elegir en nodos distintos.
6. Quitar aceite conserva el nodo y emite `aceite_id: null` en el estado local;
   para creación queda como `aceite_id: null` en el nodo nuevo.
7. Ningún payload de creación contiene una clave `aceites`.
8. Una estructura inválida bloquea el avance y muestra un error específico.

### Componentes

1. El paso muestra “Estructura de lubricación”, no “Aceites asociados”.
2. El estado vacío abre el mismo drawer que el botón de encabezado.
3. El drawer de raíz solo permite seleccionar sistema y aceite opcional.
4. El drawer de hijo muestra la ruta del padre y solo permite subsistema y
   aceite opcional.
5. El árbol representa correctamente una raíz, un hijo y un nieto con su
   sangría y estados de aceite.
6. El menú ofrece las acciones correctas según exista o no aceite.
7. La confirmación de eliminación informa el total de nodos y aceites del
   subárbol antes de mutar el borrador.
8. Los controles principales se pueden usar mediante teclado y tienen nombres
   accesibles.
9. En viewport móvil, el drawer es utilizable y no hay desbordamiento
   horizontal.

### Regresión

- El wizard mantiene creación de datos, etapas, filtros e imagen.
- La revisión refleja las rutas de estructura antes de confirmar.
- Si el RPC de creación responde correctamente, el flujo continúa al paso de
  imagen exactamente como antes.
- Se eliminan o reescriben las pruebas que afirman la regla legacy de un aceite
  por sistema.

## Criterios de aceptación

1. El paso 3 se llama **Estructura de lubricación** y presenta un árbol, no
   pares planos de sistema y aceite.
2. Se pueden crear raíces con sistema, hijos con subsistema y profundidad N.
3. El aceite es opcional en todo nodo y se puede cambiar o retirar sin borrar
   su nodo.
4. Todas las nuevas selecciones usan `vue-multiselect` y solo catálogos activos.
5. La eliminación informa y confirma el efecto sobre el subárbol.
6. La lista plana del motor es la única fuente de verdad; la UI no conserva una
   copia recursiva mutable.
7. El payload de creación siempre incluye `estructura_sistemas.nuevos` y no
   contiene el bloque legacy `aceites`.
8. No quedan referencias de producción en el flujo de creación a
   `sistemasAceite`, `sistema_aceite`, `EquipoCreacionAceite*` ni a la regla de
   aceite único por sistema.
9. La interfaz es usable en móvil y escritorio, con foco, teclado y mensajes
   accesibles.
10. Typecheck, pruebas unitarias y pruebas de componentes afectadas pasan.

## Riesgos y mitigación

| Riesgo                                         | Mitigación                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------------ |
| Reproducir la interfaz como una tabla de pares | Usar siempre el árbol derivado y acciones por nodo.                            |
| Tratar aceite como requisito                   | Incluir “Sin aceite” y validar `aceiteId: null` como estado válido.            |
| Duplicar estado entre lista y árbol            | Guardar solo la lista plana en el store; derivar el árbol mediante `computed`. |
| Perder contexto al borrar un padre             | Mostrar ruta, conteo de descendientes y conteo de aceites antes de confirmar.  |
| Reintroducir `aceites` al crear                | Probar explícitamente la forma final de `p_datos` y buscar referencias legacy. |
| Drawer inaccesible o recortado en móvil        | Usar hoja inferior, foco administrado y pruebas con viewport móvil.            |

## Salida para el siguiente spec

Al terminar, el wizard de creación producirá estructuras nuevas válidas a través
de la experiencia de **Estructura de lubricación**. SPEC-04 podrá reutilizar el
motor y los componentes presentacionales donde sea apropiado para editar una
estructura existente, pero deberá manejar snapshots, cambios diferenciales,
catálogos inactivos existentes y nodos persistidos.
