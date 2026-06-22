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

# SPEC-09 — Tabs de grupo de listado

## Objetivo

Crear el segmented control para cambiar entre solicitudes en proceso, completadas y descartadas.

## Archivos a crear

```txt
src/components/compras/list/SolicitudesGrupoTabs.vue
```

## Subspec lógica

Props:

```txt
modelValue: SolicitudCompraGrupoListado
```

Emits:

```txt
update:modelValue
```

Opciones:

```txt
en_proceso → En Proceso
completadas → Completadas
descartadas → Descartadas
```

Reglas:

- El componente solo cambia el valor del grupo.
- No decide qué estados pertenecen a cada grupo; eso ya viene desde RPC/vista BD.
- No filtra localmente por estado.

## Subspec types

Usar:

```txt
SolicitudCompraGrupoListado
```

## Subspec views / components

### Desktop

Ubicación:

- justo encima de la tabla;
- pegado a la izquierda del contenedor de tabla.

Estilo:

- activo: verde/teal oscuro con texto blanco;
- inactivo: blanco/gris claro con texto oscuro;
- altura compacta ERP: 30px a 34px.

### Mobile

Ubicación:

- debajo de buscador/filtros;
- encima de cards.

Estilo:

- botones más altos que desktop;
- táctiles;
- visualmente similares a la imagen mobile.

## No hacer

- No llamar store directamente.
- No llamar Supabase.
- No hardcodear estados internos.
- No mostrar badges de conteo todavía salvo que exista dato futuro.

## Criterios de aceptación

- Cambiar tab emite `update:modelValue`.
- La vista/composable recarga usando `p_grupo_listado`.
- El componente funciona en desktop y mobile.
- No mezcla lógica de BD.
