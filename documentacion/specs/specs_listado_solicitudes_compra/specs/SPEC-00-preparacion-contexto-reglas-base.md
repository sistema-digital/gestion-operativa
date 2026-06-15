# Specs granulares — Listado de Solicitudes de Compra

> Módulo: Compras / Solicitudes de Compra  
> Stack: Vue 3 + TypeScript estricto + Pinia + Supabase + Tailwind  
> Fuente principal de datos: `rpc_obtener_solicitudes_lista_usuario`  
> Vista principal confirmada: `src/views/compras/SolicitudesCompraView.vue`  
> Store confirmado: `src/stores/db_compras/solicitudes_compra/`

## Contexto obligatorio antes de implementar

Antes de implementar este spec, leer:

```txt
referencias/fileproject_ubicacion_archivos.md
referencias/contexto_bd_compras_por_submodulos_CORREGIDO_2026_06_15.md
referencias/contexto_final_CORREGIDO_2026_06_15.md
referencias/screen_list_Desktop.png
referencias/screen_main_mobile.png
```

Reglas transversales:

- No modificar base de datos desde estos specs.
- No crear migraciones.
- No crear rutas de detalle todavía.
- No implementar creación de solicitud todavía.
- No implementar carga real de equipos todavía.
- No usar PrimeVue; solo Tailwind y componentes Vue propios.
- No llamar `.rpc(...)` ni `.from(...)` fuera de archivos `.service.ts`.
- No declarar tipos dentro del store.
- Usar `estado.codigo`, no IDs numéricos.
- `folio_oc` no pertenece a `solicitud_compra`; viene agregado desde OC/importación.
- `PROFILE` y equipos son dependencias externas: no se crean, no se eliminan y no se alteran desde este módulo.

---

# SPEC-00 — Preparación de contexto y reglas base

## Objetivo

Establecer el punto de partida del trabajo para que ninguna implementación del listado se haga sin revisar la estructura real del proyecto, el contexto de BD vigente y las referencias visuales.

Este spec no genera código funcional. Sirve como tarea de preparación obligatoria.

## Archivos a leer

```txt
referencias/fileproject_ubicacion_archivos.md
referencias/contexto_bd_compras_por_submodulos_CORREGIDO_2026_06_15.md
referencias/contexto_final_CORREGIDO_2026_06_15.md
referencias/screen_list_Desktop.png
referencias/screen_main_mobile.png
```

## Archivos a crear o modificar

Ninguno.

## Subspec lógica

Validar estas reglas antes de iniciar cualquier spec posterior:

1. La vista principal confirmada es:

```txt
src/views/compras/SolicitudesCompraView.vue
```

2. Los componentes del listado pertenecen a:

```txt
src/components/compras/list/
```

3. El store y sus archivos de soporte pertenecen a:

```txt
src/stores/db_compras/solicitudes_compra/
```

4. La fuente principal de datos es el RPC:

```txt
rpc_obtener_solicitudes_lista_usuario
```

5. El listado no debe consultar `vw_solicitudes_lista` directamente desde frontend.
6. El listado no debe consultar equipos reales todavía.
7. El listado debe usar equipos mock temporales:

```txt
422005
422009
422014
```

8. El código debe quedar preparado para que luego una carga batch de equipos reemplace el mock.
9. El buscador debe llamar al RPC.
10. El buscador por equipo queda preparado para futuro, pero no se implementa ahora.
11. El botón `Crear` queda preparado, pero no crea ni navega.
12. Click en fila/card queda preparado, pero no navega.
13. El listado debe funcionar por rol usando configuración centralizada.
14. No se deben duplicar tipos, helpers ni stores.
15. No se debe crear carpeta `src/modules/` para esta implementación porque el `fileproject` confirma estructura con `views`, `components` y `stores`.

## Subspec types

No crear tipos en este spec.

Definir solo que el spec siguiente debe crear:

```txt
SolicitudCompraListRpcParams
SolicitudCompraListRpcRow
SolicitudCompraListItem
SolicitudCompraListState
SolicitudCompraListFilters
SolicitudCompraGrupoListado
SolicitudCompraRoleCodigo
SolicitudCompraColumnKey
SolicitudCompraIndicadores
SolicitudCompraEquipoPreview
SolicitudCompraPagination
```

## Subspec views / composables / components

No crear vistas ni componentes.

Confirmar que los specs posteriores separarán:

```txt
- lógica de datos
- types
- mapper
- store
- composable
- vista principal
- toolbar
- tabs
- desktop table
- celdas
- mobile list
- mobile card
- estados visuales
```

## Reglas visuales confirmadas

Desktop:

- Debe parecer ERP administrativo.
- Debe usar tabla.
- Debe ser compacto, denso y funcional.
- No debe parecer formulario ampliado.
- No debe usar cards.

Mobile:

- No debe parecer ERP.
- Debe usar cards.
- Debe ser cómodo para lectura táctil.
- No debe comprimir columnas.

## No hacer

- No implementar código.
- No crear archivos.
- No modificar BD.
- No cambiar RPC.
- No crear rutas.
- No conectar equipos reales.
- No implementar detalle.
- No implementar creación.

## Criterios de aceptación

- Queda confirmado el alcance del listado.
- Queda confirmada la estructura de carpetas.
- Queda confirmada la separación entre compras y equipos externos.
- Queda confirmado que los specs se implementarán de forma incremental.
