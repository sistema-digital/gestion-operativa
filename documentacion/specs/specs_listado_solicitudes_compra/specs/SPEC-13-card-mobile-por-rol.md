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

# SPEC-13 — Card mobile por rol

## Objetivo

Crear la card mobile de una solicitud, mostrando campos según el rol del usuario.

## Archivos a crear

```txt
src/components/compras/list/mobile/SolicitudMobileCard.vue
```

## Subspec lógica

Props:

```txt
item: SolicitudCompraListItem
roleCodigo: SolicitudCompraRoleCodigo
```

Emits:

```txt
click
```

Reglas:

- Usar `solicitudListRoleConfig.ts`.
- No mostrar campos no permitidos por rol.
- No mostrar labels del rol.
- No mostrar campos vacíos.
- No mostrar `Sin OC`.
- Card completa clickeable.
- No botón `Ver`.
- No navegación.

## Subspec types

Usar:

```txt
SolicitudCompraListItem
SolicitudCompraRoleCodigo
```

## Subspec views / components

Puede reutilizar:

```txt
SolicitudEstadoBadge.vue
SolicitudPrioridadBadge.vue
SolicitudEquiposCell.vue
SolicitudIndicadoresCell.vue
SolicitudFolioCell.vue
SolicitudFechaEntregaCell.vue
```

### Layout mobile operativo/admin/gerencia

Estructura recomendada:

```txt
[Folio + OC]                         [Estado]
[Observación line-clamp-3]
[Prioridad] [Fecha] [Equipos chips]
[Indicadores]
```

### Layout mobile admin adicional

Debe incluir:

```txt
Área
Solicitante
```

con tratamiento compacto, sin parecer tabla.

### Layout mobile gerencia adicional

Debe incluir:

```txt
Área
```

No incluir solicitante.

### Layout mobile almacén

Debe ser simple:

```txt
[Observación line-clamp-3]
[Área] [Prioridad] [Estado] [Bloqueado si aplica]
```

No mostrar:

```txt
folio
OC
equipos
solicitante
fecha entrega
adjuntos
diferencia OC
```

### Layout mobile secretaría

Debe ser simple:

```txt
[Folio]
[Observación line-clamp-3]
[Área]
[Solicitante]
[Prioridad] [Estado] [Fecha] [Bloqueado si aplica]
```

No mostrar:

```txt
OC
equipos
adjuntos
diferencia OC
```

## Reglas visuales

- Mobile no debe parecer ERP.
- Folio grande cuando aplica.
- Estado arriba a la derecha.
- Observación como información principal.
- Chips táctiles, no demasiado pequeños.
- Card con padding cómodo.
- Borde suave y sombra ligera.

## No hacer

- No implementar navegación.
- No llamar Supabase.
- No llamar store.
- No mostrar email.
- No mostrar rol.
- No poner botones internos.

## Criterios de aceptación

- Card cambia contenido según rol.
- Se parece a la referencia mobile.
- No se comprime como tabla.
- No muestra badges vacíos.
- Click en card emite evento.
