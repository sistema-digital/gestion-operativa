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

# SPEC-18 — Preparación futura de crear solicitud

## Objetivo

Dejar preparado el botón/FAB de crear solicitud sin implementar el flujo de creación.

## Archivos afectados

```txt
src/views/compras/SolicitudesCompraView.vue
src/components/compras/list/SolicitudesListToolbar.vue
src/components/compras/list/useSolicitudesCompraList.ts
src/stores/db_compras/solicitudes_compra/solicitudesCompra.store.ts
```

## Subspec lógica

### Desktop

El toolbar muestra botón:

```txt
Crear
```

Al hacer click:

```txt
emit('create')
```

La vista/composable recibe el evento y llama:

```txt
onCreateClick()
```

### Mobile

La vista muestra FAB dorado.

Al hacer click:

```txt
onCreateClick()
```

### Composable

`onCreateClick()` llama:

```txt
store.prepararCrearSolicitud()
```

### Store

`prepararCrearSolicitud()` por ahora:

- no llama RPC;
- no navega;
- no abre modal;
- deja comentario para integración futura.

## Subspec types

No crear tipos nuevos.

## Subspec views / components

### Botón desktop

- Dentro del bloque de filtros.
- Estilo ERP compacto.
- Verde/teal corporativo.
- Texto `Crear`.

### FAB mobile

- Dorado.
- Circular.
- Flotante abajo a la derecha.
- No debe tapar contenido importante.
- Puede incluir ícono `+`.

## No hacer

- No llamar `rpc_crear_borrador_solicitud`.
- No crear vista de nueva solicitud.
- No crear formulario.
- No modificar router.
- No abrir modal.

## Criterios de aceptación

- Botón desktop existe y emite evento.
- FAB mobile existe y emite evento.
- No hay creación real.
- No hay navegación real.
- Futuro flujo queda conectado desde un solo punto.
