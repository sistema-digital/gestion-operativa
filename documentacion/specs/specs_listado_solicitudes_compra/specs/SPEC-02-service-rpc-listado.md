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

# SPEC-02 — Service del RPC de listado

## Objetivo

Crear el service responsable de llamar a `rpc_obtener_solicitudes_lista_usuario` para obtener datos del listado.

Este spec implementa acceso a Supabase, pero no transforma datos a UI. La transformación va en el mapper.

## Archivos a crear

```txt
src/stores/db_compras/solicitudes_compra/solicitudesCompra.service.ts
```

## Archivos a leer

```txt
src/lib/supabase.ts
src/stores/db_compras/solicitudes_compra/solicitudesCompra.types.ts
```

## Subspec lógica

Crear un objeto service:

```txt
solicitudesCompraService
```

Debe exponer dos métodos:

```txt
obtenerSolicitudesListaPagina(params)
buscarSolicitudesLista(params)
```

### Método: obtenerSolicitudesListaPagina

Uso:

- carga inicial;
- scroll infinito;
- filtros sin búsqueda activa.

Entrada:

```txt
SolicitudCompraListRpcParams
```

Reglas:

```txt
p_limit = 25
p_offset = offset actual
p_busqueda = null o texto vacío
```

Debe respetar filtros:

```txt
p_grupo_listado
p_estado_codigo
p_prioridad_codigo
p_fecha_desde
p_fecha_hasta
p_solo_bloqueadas
p_solo_diferencia_oc
```

Salida:

```txt
Promise<SolicitudCompraListRpcRow[]>
```

### Método: buscarSolicitudesLista

Uso:

- cuando `busqueda.trim().length > 0`.

Entrada:

```txt
SolicitudCompraListRpcParams
```

Reglas:

```txt
p_busqueda = texto normalizado
p_limit = límite alto razonable
p_offset = 0
```

Recomendación inicial de límite:

```txt
p_limit = 500
```

Motivo:

- La búsqueda no usa paginación remota.
- La vista mostrará localmente de 25 en 25.
- Si más adelante el volumen crece demasiado, se puede cambiar el diseño de búsqueda.

### Manejo de errores

Si Supabase devuelve error:

```txt
throw new Error(error.message || 'No se pudieron obtener las solicitudes')
```

No devolver errores silenciosos.

### Uso de Supabase

El único lugar con `.rpc(...)` para esta funcionalidad debe ser:

```txt
solicitudesCompra.service.ts
```

Ejemplo conceptual del RPC llamado:

```txt
supabase.rpc('rpc_obtener_solicitudes_lista_usuario', params)
```

## Subspec types

Importar desde:

```txt
./solicitudesCompra.types
```

Tipos usados:

```txt
SolicitudCompraListRpcParams
SolicitudCompraListRpcRow
```

No declarar interfaces dentro del service.

## Subspec views / composables / components

No aplica.

Este spec no crea:

```txt
- vistas
- componentes
- composables
- store
```

## No hacer

- No mapear datos para UI.
- No cargar equipos.
- No mezclar permisos por rol.
- No implementar debounce.
- No implementar scroll.
- No consultar `equipo_solicitudes`.
- No usar `.from('vw_solicitudes_lista')`.

## Criterios de aceptación

- El service llama correctamente a `rpc_obtener_solicitudes_lista_usuario`.
- Los métodos devuelven filas crudas tipadas.
- Los errores de Supabase se propagan como `Error`.
- No hay lógica visual en el service.
- No hay llamadas a Supabase fuera del service para esta funcionalidad.
