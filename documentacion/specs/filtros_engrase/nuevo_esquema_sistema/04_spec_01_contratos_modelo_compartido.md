# SPEC-01 — Contratos y modelo compartido de estructura de lubricación

## Objetivo

Preparar la capa compartida de frontend para que creación y edición de equipos
consuman el esquema vigente de sistemas, subsistemas y aceites sin depender del
modelo legacy.

Al terminar este spec, el código tendrá contratos tipados, validación de datos
remotos y utilidades puras para representar una **lista plana de nodos de
estructura**. Este spec no construye todavía la interfaz de árbol ni modifica
el flujo visual del wizard.

## Referencias obligatorias

- [Decisiones de la nueva estructura](./02_decisiones_nueva_estructura_engrase.md).
- [Contratos RPC de la nueva estructura](./03_rpc_payloads_nueva_estructura_engrase.md).

En caso de contradicción, prevalece el contrato RPC más reciente y validado en
base de datos.

## Alcance

1. Reemplazar los contratos remotos legacy de auxiliares y de lectura de equipo.
2. Definir el modelo de dominio compartido para nodos persistidos y temporales.
3. Incorporar validadores Zod para respuestas de RPC afectadas.
4. Exponer mappers puros, seguros y testeados para los nuevos contratos.
5. Retirar tipos y referencias compartidas que modelen la asociación plana
   `sistema + aceite`.

## Fuera de alcance

- Renderizar el árbol, drawers, menús de nodo o interacción móvil.
- Mutar localmente nodos desde creación o edición.
- Construir `estructura_sistemas.nuevos`, `actualizados` o `eliminados`.
- Crear el catálogo visual de subsistemas.
- Cambiar las RPC de backend.

Los puntos anteriores corresponden a los specs posteriores de motor de
borrador, creación, edición y catálogos.

## Estado actual a reemplazar

Actualmente existen contratos de frontend que esperan o producen:

- `sistemas_aceite`;
- `aceites` como lista de `{ equipo_aceite_id, sistema, aceite }`;
- `aceites.nuevos`, `aceites.actualizados` y `aceites.eliminados`;
- una regla local de un aceite por sistema.

Esos contratos son incompatibles con el esquema actual y no deben conservarse
como adaptadores silenciosos ni como fallback. Un backend que devuelva una
respuesta inválida debe producir un error de contrato visible y recuperable.

## Modelo de dominio objetivo

Crear un módulo compartido, por ejemplo:

```text
src/stores/dbequipos/engrase/shared/estructuraLubricacion.types.ts
src/stores/dbequipos/engrase/shared/estructuraLubricacion.schemas.ts
src/stores/dbequipos/engrase/shared/estructuraLubricacion.mappers.ts
```

Los nombres definitivos pueden ajustarse a la convención existente, pero el
modelo debe ser reutilizable por creación y edición, sin importar los stores de
uno u otro flujo.

### Entidades de catálogo

```ts
interface CatalogoActivo {
  id: number;
  nombre: string;
  activo: boolean;
}

interface AuxiliaresEstructuraLubricacion {
  sistemas: CatalogoActivo[];
  subsistemas: CatalogoActivo[];
  aceites: CatalogoActivo[];
}
```

Los auxiliares para nuevas selecciones incluyen únicamente elementos activos.
La lectura de un equipo puede incluir elementos inactivos ya asociados; dichos
valores se deben preservar y mostrar, no descartar.

### Nodo persistido recibido desde el backend

```ts
interface NodoEstructuraLubricacion {
  id: number;
  parentId: number | null;
  sistema: CatalogoActivo | null;
  subsistema: CatalogoActivo | null;
  aceite: CatalogoActivo | null;
}
```

Invariantes que el mapper debe exigir:

- Si `parentId` es `null`, `sistema` existe y `subsistema` es `null`.
- Si `parentId` no es `null`, `sistema` es `null` y `subsistema` existe.
- El nodo puede tener `aceite: null`.
- `id` y los IDs de catálogo son enteros positivos.
- Ningún campo de nombre puede ser vacío después de normalizar espacios.

La detección de padre inexistente, ciclos y relación entre nodos se realizará
en el spec del motor de borrador, porque requiere evaluar la colección completa.

### Referencias temporales para trabajo local

Definir tipos explícitos para nodos nuevos y sus padres, sin `any` ni
`unknown` en la API pública del módulo:

```ts
interface NodoEstructuraTemporal {
  tempId: string;
  parentTempId: string | null;
  sistemaId: number | null;
  subsistemaId: number | null;
  aceiteId: number | null;
}
```

El spec posterior puede extenderlos con estado de operación y referencias a
padres persistidos. Este spec solo deja claro que un nodo nuevo se identifica
con `temp_id`, y no con `equipo_aceite_id`.

## Contratos RPC a implementar

### Auxiliares de creación y edición

`rpc_obtener_auxiliares_edicion_equipo()` debe mapear:

```json
{
  "ok": true,
  "sistemas": [{ "id": 1, "nombre": "HIDRAULICO" }],
  "subsistemas": [{ "id": 5, "nombre": "DIRECCION" }],
  "aceites": [{ "id": 2, "nombre": "AW100" }]
}
```

Los elementos de este RPC se modelan como activos en el frontend, dado que el
contrato garantiza que solo devuelve opciones habilitadas para una nueva
selección.

No se debe leer `sistemas_aceite`, ni completar `subsistemas` con una lista
vacía cuando la clave requerida no esté presente.

### Lectura para edición

`rpc_obtener_equipo_para_edicion(p_codigo)` debe mapear la clave
`estructura_sistemas`:

```json
{
  "estructura_sistemas": [
    {
      "id": 300,
      "parent_id": null,
      "sistema": { "id": 1, "nombre": "HIDRAULICO", "activo": true },
      "subsistema": null,
      "aceite": null
    },
    {
      "id": 301,
      "parent_id": 300,
      "sistema": null,
      "subsistema": { "id": 5, "nombre": "DIRECCION", "activo": false },
      "aceite": { "id": 2, "nombre": "AW100", "activo": true }
    }
  ]
}
```

El snapshot de edición deberá sustituir `aceites` por
`estructuraSistemas: NodoEstructuraLubricacion[]`. El mapper no debe construir
un árbol recursivo: conserva la lista plana y normaliza `parent_id` a
`parentId`.

### Contratos de respuesta de guardado

Actualizar los DTOs de creación y edición para reconocer los campos nuevos que
devuelve el backend:

- `estructura_sistemas_cambiaron` dentro de `cambios_detalle`;
- conteos de estructura, sistemas y subsistemas en `resumen_operaciones`;
- `estructura_temp_ids` cuando corresponda.

Mantener los conteos `aceites_agregados`, `aceites_actualizados` y
`aceites_eliminados`, porque siguen siendo métricas válidas. No son evidencia
de que deba volver a existir un bloque de request llamado `aceites`.

## Validación remota con Zod

El proyecto dispone de Zod; se debe utilizar para validar respuestas RPC en el
límite de datos remotos.

Requisitos:

- `z.object(...).strict()` para la forma conocida cuando sea viable con el
  contrato RPC; usar `.passthrough()` solo en respuestas cuyo backend agregue
  campos no consumidos de forma documentada.
- Reutilizar esquemas para catálogo, nodo y entidad de equipo.
- Convertir fallos de `safeParse` en el error de dominio existente, con código
  `RESPUESTA_INVALIDA` y un mensaje accionable.
- Nunca propagar un resultado de Zod como `unknown` o `any` hacia un store,
  componente o composable.

## Archivos afectados

Como mínimo, revisar y migrar:

- `src/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.dto.ts`;
- `src/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.mappers.ts`;
- `src/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types.ts`;
- `src/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types.ts`;
- `src/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.mappers.ts`;
- DTOs, mappers y pruebas de los servicios de creación y edición;
- los nuevos módulos compartidos de estructura de lubricación.

Los stores y componentes podrán requerir cambios mecánicos para compilar tras
renombrar contratos; no se les debe dar comportamiento de árbol en este spec.
Los cambios de experiencia de usuario pertenecen a los specs siguientes.

## Criterios de aceptación

1. No quedan referencias de producción a `sistemas_aceite`,
   `sistema_aceite_id` ni `equipo_aceite_v2`.
2. Los auxiliares de ambos flujos exponen `sistemas`, `subsistemas` y
   `aceites` activos.
3. La lectura de edición conserva `estructura_sistemas` como lista plana y
   preserva asociaciones inactivas existentes.
4. Un nodo raíz y un nodo hijo válidos se mapean correctamente; una forma que
   mezcle sistema raíz y subsistema hijo se rechaza.
5. Un nodo sin aceite se acepta.
6. Una respuesta ausente, con ID no positivo, nombre vacío o tipo de nodo
   inválido falla como `RESPUESTA_INVALIDA`; nunca se degrada silenciosamente a
   un arreglo vacío.
7. Los tipos de request de creación y edición dejan de declarar un bloque
   top-level `aceites`.
8. Typecheck y pruebas unitarias afectadas pasan.

## Pruebas mínimas

- Mapper de auxiliares con sistemas, subsistemas y aceites activos.
- Rechazo de `sistemas_aceite` como contrato de entrada válido.
- Mapper de equipo con raíz sin aceite y descendiente con aceite.
- Lectura de nodo con sistema, subsistema o aceite inactivo que ya pertenece
  al equipo.
- Rechazo de raíz sin sistema, raíz con subsistema, hijo con sistema o hijo sin
  subsistema.
- Rechazo de valores `null`, texto vacío, IDs cero/negativos y arreglos de
  estructura ausentes.
- Mapeo de `estructura_temp_ids` y métricas de estructura en respuestas de
  guardado.

## Dependencias y salida

- **Entrada:** backend con los contratos de `03_rpc_payloads_nueva_estructura_engrase.md` disponibles.
- **Salida para SPEC-02:** tipos y mappers confiables para construir un borrador
  de estructura plano, sin depender de la relación legacy de aceite.

## Riesgo principal

Los mappers actuales usan valores por defecto como `dto.aceites ?? []` y
`dto.sistemas_aceite ?? []`. Tras el corte de backend, ese patrón puede ocultar
un contrato roto y mostrar una estructura vacía. Este spec debe eliminar esos
fallbacks para que una migración incompleta falle de forma explícita.
