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

# SPEC-04 — Configuración de roles, columnas e indicadores

## Objetivo

Centralizar la visibilidad de columnas, campos e indicadores por rol para que la tabla desktop y las cards mobile no tengan reglas duplicadas.

## Archivos a crear

```txt
src/components/compras/list/solicitudListRoleConfig.ts
```

## Subspec lógica

Crear una configuración por rol:

```txt
admin
gerencia
operativo
almacen
secretaria
```

Cada configuración debe definir:

```txt
desktopColumns
mobileFields
canSeeFolio
canSeeFolioOc
canSeeArea
canSeeSolicitante
canSeeEquipos
canSeeFechaEntrega
canSeeAdjuntos
canSeeDiferenciaOc
canSeeBloqueado
canSeeConteos
```

### Reglas por rol

#### Operativo

Desktop columns:

```txt
folio
observacion
estado
prioridad
equipos
fechaEntrega
indicadores
```

Puede ver:

```txt
folio_sol
folio_oc_principal si existe
equipos
fecha entrega
adjuntos
diferencia OC
bloqueado
```

No puede ver:

```txt
area
solicitante
email
rol
```

#### Admin

Desktop columns:

```txt
folio
observacion
estado
prioridad
equipos
area
solicitante
fechaEntrega
indicadores
```

Puede ver:

```txt
todo lo del listado
```

No mostrar:

```txt
email
rol técnico
```

#### Gerencia

Desktop columns:

```txt
folio
observacion
estado
prioridad
equipos
area
fechaEntrega
indicadores
```

Puede ver:

```txt
folio_sol
folio_oc_principal si existe
equipos
area
fecha entrega
adjuntos
diferencia OC
bloqueado
```

No puede ver:

```txt
solicitante
email
rol
```

#### Almacén

Desktop columns:

```txt
observacion
area
prioridad
estado
bloqueado
```

Puede ver:

```txt
observacion
area
prioridad
estado
bloqueado
```

No puede ver:

```txt
folio_sol
folio_oc
equipos
solicitante
fecha entrega
adjuntos
diferencia OC
email
rol
```

#### Secretaría

Desktop columns:

```txt
folio
observacion
area
solicitante
prioridad
estado
fechaEntrega
bloqueado
```

Puede ver:

```txt
folio_sol
observacion
area
solicitante
prioridad
estado
fecha entrega
bloqueado
```

No puede ver:

```txt
folio_oc
equipos
adjuntos
diferencia OC
email
rol
```

## Subspec types

Importar desde:

```txt
src/stores/db_compras/solicitudes_compra/solicitudesCompra.types.ts
```

Tipos usados:

```txt
SolicitudCompraRoleCodigo
SolicitudCompraColumnKey
```

Crear tipos locales pequeños solo si son exclusivos de config, por ejemplo:

```txt
SolicitudListRoleConfig
```

No duplicar tipos del store.

## Subspec views / composables / components

Este archivo será usado por:

```txt
SolicitudesDesktopTable.vue
SolicitudMobileCard.vue
SolicitudIndicadoresCell.vue
```

No debe renderizar UI.

## Reglas de fallback

Si llega un rol desconocido:

- usar configuración de `operativo` como fallback seguro;
- no mostrar solicitante;
- no mostrar área;
- no mostrar campos sensibles;
- no mostrar OC si no se conoce el permiso.

## No hacer

- No llamar Supabase.
- No importar store.
- No transformar datos.
- No filtrar la lista.
- No poner condicionales de roles grandes en componentes si pueden vivir aquí.

## Criterios de aceptación

- Cada rol tiene columnas desktop explícitas.
- Cada rol tiene campos mobile explícitos.
- Almacén no recibe/renderiza folio ni OC.
- Secretaría no renderiza OC, adjuntos, equipos ni diferencia OC.
- Admin, gerencia y operativo pueden ver diferencia OC si aplica.
- Bloqueado queda visible para todos.
