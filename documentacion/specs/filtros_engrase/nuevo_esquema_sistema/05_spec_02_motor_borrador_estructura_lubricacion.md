# SPEC-02 — Motor de borrador para estructura de lubricación

## Objetivo

Implementar un módulo de dominio puro y reutilizable que permita a creación y
edición construir, modificar, validar y comparar la **lista plana de nodos**
de la estructura de lubricación de un equipo.

La unidad de trabajo deja de ser una asociación plana `sistema + aceite`. El
motor trabaja con nodos: una raíz representa un sistema; cualquier descendiente
representa un subsistema; el aceite es opcional en todos los niveles.

Al finalizar este spec no se modifica todavía la interfaz de usuario. Los
specs de creación y edición consumirán este motor para presentar el editor de
árbol denominado **Estructura de lubricación**.

## Referencias obligatorias

- [Decisiones de la nueva estructura](./02_decisiones_nueva_estructura_engrase.md).
- [Contratos RPC de la nueva estructura](./03_rpc_payloads_nueva_estructura_engrase.md), en especial las secciones 2 a 11, 19, 21, 26, 28 y 29.
- [SPEC-01 — Contratos y modelo compartido](./04_spec_01_contratos_modelo_compartido.md).

En caso de contradicción, prevalece el contrato RPC vigente del backend.

## Dependencia de entrada

SPEC-01 debe estar terminado. Este spec consume sus tipos compartidos:

- `CatalogoActivo`;
- `AuxiliaresEstructuraLubricacion`;
- `NodoEstructuraLubricacion` recibido en la lectura de edición;
- DTOs de respuesta ya validados en el límite remoto.

No debe volver a declarar tipos equivalentes a `sistema_aceite`,
`equipo_aceite_id` o la lista legacy `aceites`.

## Alcance

1. Definir el borrador local plano, sus referencias de identidad y estados de
   operación.
2. Implementar operaciones puras para agregar, editar, mover y eliminar nodos.
3. Gestionar la asignación o retiro de aceite en un nodo sin borrar la
   estructura.
4. Derivar un árbol de solo lectura para la UI a partir de la lista plana.
5. Validar invariantes estructurales locales antes de persistir.
6. Comparar snapshot y borrador para construir `estructura_sistemas` con
   `nuevos`, `actualizados` y `eliminados`.
7. Cubrir el motor con pruebas unitarias exhaustivas.

## Fuera de alcance

- Componentes, drawers, menús contextuales, confirmaciones o interacción móvil.
- Integrar el motor en el wizard de creación o la vista de edición.
- Llamar RPC, guardar un equipo o aplicar `estructura_temp_ids` a un store.
- Crear o editar los catálogos de sistema, subsistema o aceite.
- Implementar arrastrar y soltar; el motor sí admite mover nodos para que la UI
  posterior pueda elegir el mecanismo adecuado.

## Ubicación propuesta

Crear módulos compartidos, ajustando el nombre solo si ya existe una convención
equivalente en el proyecto:

```text
src/stores/dbequipos/engrase/shared/estructuraLubricacion.draft.types.ts
src/stores/dbequipos/engrase/shared/estructuraLubricacion.draft.ts
src/stores/dbequipos/engrase/shared/estructuraLubricacion.payload.ts
src/stores/dbequipos/engrase/shared/estructuraLubricacion.tree.ts
src/stores/dbequipos/engrase/shared/estructuraLubricacion.validation.ts
src/stores/dbequipos/engrase/shared/*.test.ts
```

El motor no debe depender de Vue, Pinia, rutas, componentes ni Supabase. Debe
recibir datos y devolver datos; el store será responsable de conservar su
estado reactivo.

## Modelo local

### Identidad de nodo

Un nodo local puede ser persistido o nuevo, pero nunca ambos:

```ts
type EstadoNodoEstructura = "existente" | "nuevo" | "pendiente_eliminacion";

interface NodoEstructuraBorrador {
  localId: string;
  estadoLocal: EstadoNodoEstructura;
  id: number | null;
  tempId: string | null;
  parentId: number | null;
  parentTempId: string | null;
  sistemaId: number | null;
  subsistemaId: number | null;
  aceiteId: number | null;
  sistema: CatalogoActivo | null;
  subsistema: CatalogoActivo | null;
  aceite: CatalogoActivo | null;
}
```

Reglas de identidad:

- Un nodo `existente` tiene `id` positivo y `tempId: null`.
- Un nodo `nuevo` tiene `id: null` y `tempId` no vacío y único.
- `localId` es estable dentro del borrador y sirve únicamente para claves de UI.
- Un padre se identifica por `parentId` o por `parentTempId`; ambos no pueden
  tener un valor no nulo al mismo tiempo.
- Un nodo marcado `pendiente_eliminacion` permanece en el borrador para poder
  calcular el payload y mostrar una confirmación, pero no aparece entre los
  nodos activos del árbol de la UI.

No usar `any` ni `unknown` en las APIs públicas del motor.

### Tipo del nodo según padre

| Situación                   | `sistemaId` | `subsistemaId` | Padre                |
| --------------------------- | ----------- | -------------- | -------------------- |
| Raíz                        | ID positivo | `null`         | ninguno              |
| Hijo, cualquier profundidad | `null`      | ID positivo    | existente o temporal |

`aceiteId` puede ser un ID positivo o `null` en ambos casos. Un aceite no crea
ni determina la ubicación del nodo.

## API funcional requerida

Los nombres pueden variar, pero la semántica y el tipado explícito son
obligatorios.

### Inicializar y clonar

```ts
function crearBorradorEstructura(
  nodos: readonly NodoEstructuraLubricacion[],
): NodoEstructuraBorrador[];

function clonarBorradorEstructura(
  nodos: readonly NodoEstructuraBorrador[],
): NodoEstructuraBorrador[];
```

La inicialización mantiene el orden plano de la respuesta, genera un `localId`
estable y no transforma el snapshot a un árbol recursivo.

### Agregar nodos

```ts
interface AgregarRaizEstructuraInput {
  sistema: CatalogoActivo;
  aceite: CatalogoActivo | null;
}

interface AgregarHijoEstructuraInput {
  parentLocalId: string;
  subsistema: CatalogoActivo;
  aceite: CatalogoActivo | null;
}

function agregarRaizEstructura(
  nodos: readonly NodoEstructuraBorrador[],
  input: AgregarRaizEstructuraInput,
): ResultadoMutacionEstructura;

function agregarHijoEstructura(
  nodos: readonly NodoEstructuraBorrador[],
  input: AgregarHijoEstructuraInput,
): ResultadoMutacionEstructura;
```

Agregar una raíz crea `tempId`, no tiene padre y solo acepta un sistema activo.
Agregar un hijo exige que el padre activo exista y usa `parentId` si este está
persistido, o `parentTempId` si aún es nuevo. No hay límite de profundidad.

No se aplica una restricción de “un aceite por sistema”: dos ubicaciones
distintas pueden reutilizar el mismo aceite. El límite de un aceite corresponde
al campo único `aceiteId` del propio nodo.

### Editar ubicación y aceite

```ts
interface ActualizarNodoEstructuraInput {
  localId: string;
  aceite: CatalogoActivo | null;
}

function actualizarAceiteNodo(
  nodos: readonly NodoEstructuraBorrador[],
  input: ActualizarNodoEstructuraInput,
): ResultadoMutacionEstructura;
```

Este spec no permite convertir una raíz en hijo ni un hijo en raíz mediante una
edición de catálogo. El tipo del nodo se conserva; solo se permite cambiar o
quitar el aceite. Quitar aceite deja `aceiteId: null` y conserva el nodo.

Los valores inactivos existentes recibidos desde el equipo permanecen visibles
en el borrador. Para una nueva raíz, hijo o cambio de aceite solo se aceptan
elementos del auxiliar activo correspondiente.

### Mover un nodo existente

```ts
interface MoverNodoEstructuraInput {
  localId: string;
  nuevoPadreLocalId: string | null;
}

function moverNodoEstructura(
  nodos: readonly NodoEstructuraBorrador[],
  input: MoverNodoEstructuraInput,
): ResultadoMutacionEstructura;
```

Reglas:

- Una raíz no se puede mover bajo otro nodo porque pasaría a representar un
  sistema hijo, lo cual es inválido.
- Un hijo puede moverse a otra ubicación activa del mismo borrador.
- Un hijo no puede convertirse en raíz sin cambiar de tipo; la operación se
  rechaza. La futura UI debe crear una raíz nueva si necesita esa estructura.
- El destino no puede ser el mismo nodo ni uno de sus descendientes.
- El motor debe soportar que el nuevo padre sea temporal, generando
  `parentTempId`.

### Eliminar y deshacer

```ts
interface EliminarNodoEstructuraResultado {
  nodos: NodoEstructuraBorrador[];
  eliminados: NodoEstructuraBorrador[];
}

function obtenerSubarbolActivo(
  nodos: readonly NodoEstructuraBorrador[],
  localId: string,
): NodoEstructuraBorrador[];

function marcarNodoParaEliminar(
  nodos: readonly NodoEstructuraBorrador[],
  localId: string,
): EliminarNodoEstructuraResultado;

function deshacerEliminacionNodo(
  nodos: readonly NodoEstructuraBorrador[],
  localId: string,
): ResultadoMutacionEstructura;
```

Eliminar incluye el subárbol completo. Los nodos existentes pasan a
`pendiente_eliminacion`; los nodos nuevos del subárbol se retiran por completo
del borrador, porque nunca deben aparecer en `eliminados`.

`obtenerSubarbolActivo` será utilizado por la UI posterior para informar, antes
de confirmar, cuántos nodos descendientes y asignaciones de aceite desaparecerán.

Al deshacer, se restituye el subárbol eliminado mientras sus padres sigan
activos. Si el padre fue eliminado, la UI debe deshacer desde el padre; no se
permiten nodos activos huérfanos.

## Árbol derivado para presentación

La fuente de verdad es la lista plana. Crear una derivación sin mutar el
borrador:

```ts
interface NodoEstructuraArbol extends NodoEstructuraBorrador {
  hijos: NodoEstructuraArbol[];
  profundidad: number;
  ruta: string;
}

function construirArbolEstructura(
  nodos: readonly NodoEstructuraBorrador[],
): NodoEstructuraArbol[];
```

El árbol debe:

- excluir los nodos pendientes de eliminación;
- preservar las raíces en el orden plano de origen y los hijos en el orden en
  que aparecen en la lista; no inventar un campo `orden`;
- calcular `profundidad` y `ruta` para sangría, accesibilidad y mensajes de
  confirmación;
- fallar con un error de dominio si encuentra un padre inexistente, un ciclo o
  un nodo que no pueda alcanzarse desde una raíz.

## Validación de borrador

```ts
interface ErrorValidacionEstructura {
  codigo: string;
  mensaje: string;
  localId?: string;
}

interface ResultadoValidacionEstructura {
  valido: boolean;
  errores: ErrorValidacionEstructura[];
}

function validarBorradorEstructura(
  nodos: readonly NodoEstructuraBorrador[],
): ResultadoValidacionEstructura;
```

Debe detectar, como mínimo:

- ID persistido o temporal duplicado;
- raíz sin sistema, con subsistema o con padre;
- hijo sin subsistema, con sistema o sin padre;
- padre inexistente, propio, pendiente de eliminación o de otro árbol;
- `parentId` y `parentTempId` definidos simultáneamente;
- ciclos, incluidos los compuestos solo por referencias temporales;
- catálogo o aceite nuevo no activo;
- referencias incoherentes entre ID y objeto de catálogo;
- nodo no alcanzable desde una raíz activa.

La validación local anticipa errores de backend, pero no sustituye sus reglas de
integridad. Los errores deben ser específicos y mapeables a los mensajes de los
formularios posteriores.

## Construcción del payload diferencial

### Contrato de salida

```ts
interface EstructuraSistemasCambiosPayload {
  nuevos: NodoEstructuraNuevoPayload[];
  actualizados: NodoEstructuraActualizadoPayload[];
  eliminados: NodoEstructuraEliminadoPayload[];
}
```

El módulo recibe el snapshot persistido y el borrador actual. Devuelve los tres
arreglos, aunque estén vacíos, para que creación y edición puedan enviarlos
directamente según su contrato.

```ts
function construirCambiosEstructura(
  original: readonly NodoEstructuraLubricacion[],
  borrador: readonly NodoEstructuraBorrador[],
): EstructuraSistemasCambiosPayload;
```

### Reglas de generación

- **Nuevo:** incluye `temp_id`, `parent_id`, `parent_temp_id`, `sistema_id`,
  `subsistema_id` y `aceite_id`. Una raíz usa ambos campos de padre en `null`;
  un hijo de un padre persistido usa `parent_id`; un hijo de un padre nuevo usa
  `parent_temp_id`. No deben enviarse ambos campos de padre con valores no
  nulos.
- **Actualizado:** incluye solo propiedades que cambiaron: `parent_id` o
  `parent_temp_id`, y/o `aceite_id`. No reenvía catálogos sin cambios.
- **Eliminado:** incluye únicamente `{ id }` de nodos existentes marcados para
  eliminar. Si se marca un padre y sus descendientes, se envía solo el padre:
  el backend elimina el subárbol en cascada.
- **Aceite removido:** un nodo existente con aceite original y `aceiteId: null`
  genera `{ id, aceite_id: null }`; no se elimina el nodo.
- **Sin cambios:** si no existe cambio estructural, devuelve los tres arreglos
  vacíos y nunca un bloque legacy `aceites`.

### Contrato confirmado para padre persistido

El backend admite `parent_id` en `nuevos[]` para crear un nodo hijo bajo un
padre persistido del mismo equipo. El motor debe generar ese campo con un ID
positivo y mantener `parent_temp_id: null`. La validación de backend rechaza
padres de otro equipo y referencias de padre ambiguas.

## Uso esperado por los specs siguientes

```text
SPEC-03 Creación
  auxiliares activos → motor → árbol de UI → estructura_sistemas.nuevos

SPEC-04 Edición
  estructura_sistemas plana → motor → árbol de UI
  → nuevos / actualizados / eliminados
```

La UI no modifica objetos del árbol derivado. Emite intenciones tipadas al
store, y el store usa el motor para reemplazar la lista plana de borrador.

## Pruebas mínimas

1. Inicializa raíz e hijo desde una lista plana y conserva valores inactivos
   existentes.
2. Agrega una raíz sin aceite y un hijo con aceite reutilizado en otra rama.
3. Permite N niveles de subsistemas.
4. Rechaza subsistema como raíz, sistema como hijo y un hijo sin padre.
5. Rechaza IDs, `tempId` y referencias de padre duplicadas.
6. Rechaza padre inexistente, propio, pendiente de eliminación y ciclos de dos
   o más nodos.
7. Cambiar y retirar aceite modifica solo `aceite_id`; retirar aceite no elimina
   el nodo.
8. Mover un hijo actualiza el tipo de referencia de padre correcto y rechaza
   moverlo bajo su descendiente.
9. Crear un hijo nuevo bajo padre persistido envía `parent_id`; bajo padre
   temporal envía `parent_temp_id`.
10. Eliminar un nodo existente marca el subárbol; eliminar un nodo nuevo lo
    elimina del borrador; el payload solo envía el padre persistido.
11. Deshacer una eliminación recupera el subárbol cuando su ancestro está activo.
12. El árbol derivado conserva orden, profundidad y ruta, y excluye nodos
    pendientes de eliminación.
13. El payload de creación contiene nodos nuevos y nunca una clave `aceites`.
14. El payload de edición incluye únicamente cambios reales de aceite o padre y
    no reenvía nodos sin cambios.
15. Los tres arreglos vacíos representan una estructura sin cambios.

## Criterios de aceptación

1. El motor opera exclusivamente sobre la estructura de nodos, no sobre pares
   `sistema + aceite`.
2. La lista plana es la única fuente de verdad; el árbol es derivado y puro.
3. Se soportan raíces, descendientes y profundidad N.
4. El aceite es opcional en cualquier nodo y se puede reutilizar entre nodos.
5. Los valores inactivos existentes se conservan, mientras las nuevas acciones
   solo aceptan auxiliares activos.
6. Se detectan localmente ciclos, nodos huérfanos y tipos de nodo inválidos.
7. La eliminación de un padre representa su subárbol sin producir eliminaciones
   redundantes de descendientes en el payload.
8. El payload se ajusta a `estructura_sistemas` y no contiene un bloque legacy
   `aceites`.
9. No se usan `any` ni `unknown` en la API pública del motor.
10. Typecheck y todas las pruebas nuevas y afectadas pasan.

## Riesgos y mitigación

| Riesgo                                                  | Mitigación                                                                                            |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Usar el árbol como estado y desincronizar padres/hijos  | Conservar solo la lista plana; derivar el árbol con una función pura.                                 |
| Dejar huérfanos tras borrar o mover                     | Validar colección completa tras toda mutación y bloquear el resultado inválido.                       |
| Eliminar descendientes dos veces en el payload          | Colapsar eliminaciones al ancestro persistido más alto.                                               |
| Reintroducir la regla legacy de un aceite por sistema   | Permitir reutilizar `aceiteId`; limitarlo únicamente a un valor por nodo.                             |
| Enviar una referencia de padre ambigua en un nodo nuevo | Usar `parent_id` para padre persistido o `parent_temp_id` para padre temporal, nunca ambos con valor. |

## Dependencias y salida

- **Entrada:** SPEC-01 terminado y contrato backend vigente con `parent_id` en
  `nuevos[]` para un hijo bajo padre persistido.
- **Salida:** un motor de dominio testeado que deja a creación y edición listas
  para implementar su interfaz de **Estructura de lubricación** sin depender de
  lógica legacy.
