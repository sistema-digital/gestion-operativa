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

# SPEC-16 — Preparación futura de búsqueda por equipo

## Objetivo

Documentar cómo se integrará la búsqueda por equipo cuando exista un RPC/servicio batch en la BD de equipos, sin implementarlo todavía.

## Estado actual

El placeholder menciona equipo:

```txt
Buscar por folio, observación, equipo u orden de compra
```

Pero la búsqueda real por equipo queda pendiente.

La búsqueda actual debe funcionar con lo que resuelve `rpc_obtener_solicitudes_lista_usuario`:

```txt
folio
observación
OC
estado
prioridad
área/solicitante según rol
```

## Subspec lógica futura

Cuando exista búsqueda por equipo:

1. Detectar si el texto parece código de equipo.
2. Consultar BD equipos con un RPC batch/search.
3. Obtener `solicitud_id[]` asociadas.
4. Combinar con resultados del RPC de compras o llamar un RPC de compras que acepte IDs.
5. Mantener paginación visual de 25 en 25.

### Alternativa recomendada futura

Crear en la BD de compras o equipos una función que devuelva IDs:

```txt
rpc_buscar_solicitudes_por_equipo(p_busqueda text)
```

Resultado:

```txt
solicitud_id uuid
cod_equipo text
```

Luego el store de compras podría:

- pedir IDs a equipos;
- pedir solicitudes por esos IDs si se crea un RPC para eso;
- o filtrar resultados ya cargados si el volumen es pequeño.

## Subspec types futuro

Tipos sugeridos:

```txt
SolicitudEquipoSearchResult
SolicitudCompraSearchMode = 'rpc_compras' | 'equipo_batch' | 'mixto'
```

## Subspec views / components

No cambia UI.

El buscador sigue siendo el mismo.

## No hacer ahora

- No implementar búsqueda por equipo.
- No consultar `equipo_solicitudes` directamente desde componentes.
- No hacer llamadas por cada fila.
- No cambiar RPC actual.

## Criterios de aceptación actual

- La búsqueda normal funciona por RPC compras.
- El placeholder puede mencionar equipo porque la UI queda preparada.
- El código no contiene implementación incompleta de equipos.
- Queda claro dónde implementar después.
