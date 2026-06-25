MAPA DE IMPLEMENTACION — PRODUCTO TEMPORAL Y UNIDADES DINAMICAS
MODULO: Compras / Solicitudes de compra
SUBFLUJO: Paso 2 / Productos
FECHA DE CONTEXTO: 2026-06-24
PROYECTO: gestion operativa / solicitudes compras

Referencia principal:

- `documentacion/specs/creacion_solicitudes/SPEC-01-producto-temporal-unidades-dinamicas.md`

=====================================================================
1. OBJETIVO DEL MAPA
=====================================================================

Traducir la especificacion funcional a una estructura concreta de archivos, responsabilidades y secuencia de implementacion.

Este documento responde:

- que archivos crear
- que archivos modificar
- que responsabilidad vive en cada capa
- como fluye la data desde BD hasta el formulario
- en que orden conviene implementar

=====================================================================
2. RESUMEN DE ARQUITECTURA
=====================================================================

Capas involucradas:

1. Service de unidades
2. Composable de selector de unidades
3. Componente de formulario de producto temporal
4. Integracion del overlay dentro del paso 2
5. Ajustes en store/composable del wizard para crear y editar temporales
6. Integracion visual con listado de productos

Flujo principal:

`public.unidad_medida`
-> service `db_compras/unidad`
-> composable de unidades
-> formulario de producto temporal
-> paso 2 productos
-> store de creacion de solicitud
-> payload final `p_productos`

=====================================================================
3. ARCHIVOS A CREAR
=====================================================================

3.1 Service de unidades

Crear carpeta:

- `src/services/db_compras/unidad/`

Crear archivo:

- `src/services/db_compras/unidad/unidadMedida.service.ts`

Responsabilidad:

- consultar `public.unidad_medida`
- filtrar registros activos
- resolver `distinct` por `descripcion`
- devolver estructura normalizada para UI y persistencia

3.2 Tipos de unidad

Crear archivo:

- `src/services/db_compras/unidad/unidadMedida.types.ts`

Responsabilidad:

- tipar fila cruda de Supabase
- tipar opcion normalizada de unidad
- tipar resultado de consulta si hace falta separar raw y mapped

3.3 Composable de unidades

Crear archivo:

- `src/composables/compras/useUnidadMedidaOptions.ts`

Responsabilidad:

- cargar unidades desde el service
- manejar `loading`, `error`, `query`
- filtrar por `descripcion`, `codigo`, `abreviatura`, `id`
- exponer opciones visibles mostrando solo `descripcion`
- exponer seleccion actual

3.4 Formulario de producto temporal

Crear archivo:

- `src/components/compras/crear/CrearSolicitudCompraProductoTemporalForm.vue`

Responsabilidad:

- renderizar formulario vertical
- manejar modo `crear` o `editar`
- emitir `cancel`
- emitir `submit`
- integrar buscador de unidad usando el composable

3.5 Overlay responsive del formulario

Crear archivo:

- `src/components/compras/crear/CrearSolicitudCompraProductoTemporalOverlay.vue`

Responsabilidad:

- renderizar drawer en `lg`
- renderizar bottom sheet en `md/sm`
- aplicar overlay borroso
- controlar layout, contenedor y acciones visibles
- delegar el formulario interno al componente de formulario

Opcional:

Si durante la implementacion el equipo prefiere reducir componentes, el overlay y el formulario pueden vivir juntos en un solo SFC. Aun asi, la separacion recomendada es mantener:

- un componente contenedor para overlay
- un componente interno para formulario

=====================================================================
4. ARCHIVOS A MODIFICAR
=====================================================================

4.1 Paso 2 productos

Modificar:

- `src/components/compras/crear/CrearSolicitudCompraStepProductos.vue`

Cambios esperados:

- conservar logica actual del CTA manual
- emitir evento para abrir alta vacia desde boton manual
- emitir evento para abrir alta precargada desde fila manual
- mostrar `Editar` solo en items temporales
- mantener `Eliminar` para ambos tipos
- integrar apertura del overlay o delegar al padre

4.2 Vista del wizard

Modificar:

- `src/views/compras/SolicitudCompraCrearView.vue`

Cambios esperados:

- conectar el evento `manual-request`
- montar el overlay de producto temporal
- manejar estado de apertura/cierre
- manejar modo `crear` y `editar`
- pasar callbacks para guardar o actualizar producto temporal

4.3 Composable principal del wizard

Modificar:

- `src/composables/compras/useCrearSolicitudCompraWizard.ts`

Cambios esperados:

- exponer acciones para agregar producto temporal
- exponer accion para editar producto temporal
- exponer helpers si se decide centralizar el modo del overlay

4.4 Store de creacion de solicitud

Modificar:

- `src/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.store.ts`

Cambios esperados:

- mantener `agregarProductoTemporal`
- agregar accion para actualizar producto temporal existente
- no permitir editar productos existentes

4.5 Tipos del store

Modificar si hace falta:

- `src/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types.ts`

Cambios esperados:

- verificar si `ProductoSolicitudTemporalItem` ya cubre todo
- agregar tipos de draft del formulario si ayuda a separar datos de UI y datos persistidos

4.6 Schemas de validacion

Modificar si hace falta:

- `src/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.schemas.ts`

Cambios esperados:

- conservar validacion de temporal
- confirmar que `unidadCodigo` siga siendo el valor persistido
- si se agrega `unidadLabel = descripcion`, mantener consistencia con la validacion

=====================================================================
5. ESTRUCTURA DE DATOS RECOMENDADA
=====================================================================

5.1 Tipo crudo de unidad

Referencia conceptual:

```ts
type UnidadMedidaRow = {
  id: number;
  codigo: string;
  abreviatura: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
};
```

5.2 Tipo normalizado para selector

Referencia conceptual:

```ts
type UnidadMedidaOption = {
  id: number;
  codigo: string;
  abreviatura: string;
  descripcion: string;
  searchValue: string;
};
```

Notas:

- `descripcion` es el unico texto visible en la lista
- `searchValue` puede ser derivado y no persistirse
- `codigo` debe conservarse para guardar en `unidadCodigo`

5.3 Draft del formulario temporal

Referencia conceptual:

```ts
type ProductoTemporalDraft = {
  descripcion: string;
  unidadCodigo: string;
  unidadLabel: string;
  notas: string;
};
```

=====================================================================
6. FLUJO DE DATOS DETALLADO
=====================================================================

6.1 Carga de unidades

1. El overlay o formulario se monta.
2. El formulario invoca `useUnidadMedidaOptions`.
3. El composable llama al service.
4. El service consulta `public.unidad_medida`.
5. El service devuelve opciones normalizadas.
6. El composable expone lista filtrable al input buscador.

6.2 Alta desde boton manual

1. Usuario hace click en boton manual.
2. Paso 2 emite apertura en modo `crear`.
3. Padre abre overlay con draft vacio.
4. Usuario llena descripcion, unidad y notas.
5. Usuario confirma `Agregar`.
6. Se llama accion de store para agregar temporal.
7. Se cierra overlay.
8. Se refresca el listado visual del paso 2.

6.3 Alta desde fila manual

1. Usuario escribe en buscador general de productos.
2. Usuario selecciona fila manual.
3. Paso 2 emite apertura en modo `crear` con descripcion inicial.
4. Padre abre overlay con descripcion precargada.
5. Usuario completa unidad y notas.
6. Usuario confirma `Agregar`.
7. Se agrega temporal al store.
8. Se cierra overlay.

6.4 Edicion de temporal

1. Usuario hace click en `Editar` desde item temporal.
2. Paso 2 emite apertura en modo `editar` con item seleccionado.
3. Padre abre overlay con draft cargado.
4. Usuario modifica campos.
5. Usuario confirma `Guardar cambios`.
6. Store actualiza solo ese temporal.
7. Se cierra overlay.

=====================================================================
7. RESPONSABILIDAD POR CAPA
=====================================================================

7.1 Service

Debe resolver:

- lectura de Supabase
- filtro por `activo = true`
- ordenamiento razonable para UX
- distinct por `descripcion`
- mapeo minimo seguro

No debe resolver:

- apertura/cierre del overlay
- filtrado reactivo del input del formulario
- estado visual

7.2 Composable de unidades

Debe resolver:

- carga inicial
- reintento si aplica
- query de busqueda
- filtro local
- lista visible
- opcion seleccionada

No debe resolver:

- guardar producto temporal en store principal

7.3 Formulario

Debe resolver:

- inputs y errores de UI local
- presentacion vertical
- mostrar solo descripcion en opciones
- recoger el valor final elegido

No debe resolver:

- acceso directo a Supabase
- mutacion del store principal sin emitir evento

7.4 Paso 2

Debe resolver:

- presentar buscador existente y listado
- distinguir items temporales de existentes
- disparar apertura del overlay

7.5 Vista padre

Debe resolver:

- estado del overlay
- modo `crear` / `editar`
- draft actual del formulario
- conexion entre hijo visual y store

=====================================================================
8. PROPUESTA DE EVENTOS ENTRE COMPONENTES
=====================================================================

8.1 Eventos desde `CrearSolicitudCompraStepProductos.vue`

Eventos sugeridos:

- `manual-request`
- `edit-producto-temporal`
- `remove-producto`

Comportamiento:

- `manual-request` puede seguir transportando el texto inicial
- `edit-producto-temporal` debe transportar el item temporal completo o su `localId`

8.2 Eventos desde `CrearSolicitudCompraProductoTemporalForm.vue`

Eventos sugeridos:

- `cancel`
- `submit`

Payload de `submit`:

- draft normalizado con `descripcion`, `unidadCodigo`, `unidadLabel`, `notas`

=====================================================================
9. ORDEN RECOMENDADO DE IMPLEMENTACION
=====================================================================

Fase 1:

- crear tipos de unidad
- crear service de unidad
- verificar consulta, distinct y shape de datos

Fase 2:

- crear composable `useUnidadMedidaOptions`
- dejar lista la busqueda local y seleccion

Fase 3:

- crear formulario `CrearSolicitudCompraProductoTemporalForm.vue`
- integrar buscador de unidad y validaciones locales

Fase 4:

- crear overlay responsive
- validar drawer `lg` y bottom sheet `md/sm`

Fase 5:

- integrar apertura desde paso 2
- conectar modo crear
- conectar modo editar para temporales

Fase 6:

- agregar accion de update en store
- verificar persistencia de `unidadCodigo` y `unidadLabel`

Fase 7:

- revisar resumen y payload final
- probar alta, edicion y eliminacion de temporales

=====================================================================
10. RIESGOS Y PUNTOS DE ATENCION
=====================================================================

1. `distinct` por `descripcion` puede ocultar varias filas con diferente `codigo`.

Impacto:

- la UI queda limpia
- pero hay que definir con criterio cual fila representara cada descripcion

Recomendacion:

- elegir una sola fila canonica por descripcion con regla deterministica
- documentar ese criterio en el service

2. Puede haber descripciones nulas o vacias en BD.

Recomendacion:

- filtrar o normalizar antes de exponerlas al formulario

3. El store actual agrega temporales pero no actualiza.

Recomendacion:

- introducir una accion dedicada de update en vez de reciclar remove + add

4. Si el overlay se controla demasiado abajo en el arbol, la sincronizacion con el wizard puede volverse fragil.

Recomendacion:

- controlar apertura, modo y draft en la vista padre o en un contenedor cercano al paso

=====================================================================
11. RESULTADO ESPERADO AL FINAL
=====================================================================

Al terminar la implementacion, el flujo debe quedar asi:

- el usuario busca productos existentes como hoy
- puede crear un temporal desde boton o fila manual
- el formulario abre como drawer o bottom sheet segun breakpoint
- la unidad se busca desde BD real
- la lista de unidades muestra solo descripcion
- el temporal puede editarse si ya fue agregado
- el store conserva `unidadCodigo` para enviar el payload correcto

