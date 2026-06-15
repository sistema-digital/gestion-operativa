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

# SPEC-15 — Preparación futura de equipos batch

## Objetivo

Dejar documentado y preparado cómo integrar equipos reales por batch en el listado, sin implementarlo todavía.

## Estado actual

Actualmente los equipos del listado se mostrarán como mock:

```txt
422005
422009
422014
```

Esto permite avanzar con UI y estructura sin depender todavía del RPC batch de la BD de equipos.

## Archivos actuales relacionados

```txt
src/stores/dbequipos/equiposolicitudes/equipoSolicitudes.service.ts
```

Método existente:

```txt
obtenerEquiposSolicitud(solicitudId: string)
```

No se debe usar para el listado masivo porque obligaría a una llamada por fila.

## Subspec lógica futura

Cuando exista el RPC batch, se debe agregar un método futuro:

```txt
obtenerEquiposPorSolicitudes(solicitudIds: string[])
```

Flujo futuro:

1. El store carga solicitudes desde RPC compras.
2. La UI muestra filas/cards inmediatamente.
3. La celda de equipos muestra loader por cada solicitud pendiente.
4. El store llama al servicio batch de equipos.
5. El resultado se agrupa por `solicitud_id`.
6. El store actualiza solo la propiedad `equipos` de cada item.
7. Si falla, la celda muestra estado discreto o conserva fallback.

## Subspec types futuro

Tipos futuros sugeridos:

```txt
EquiposSolicitudBatchRow
EquiposSolicitudBatchResult
SolicitudEquiposBatchState
```

Formato esperado conceptual:

```txt
solicitud_id
cod_equipo
```

## Subspec views / components

`SolicitudEquiposCell.vue` debe estar preparada desde ahora para:

```txt
equipos.loading = true
equipos.codigos = []
equipos.error = null
```

Y también para:

```txt
equipos.loading = false
equipos.codigos = ['422005', '422009']
equipos.error = null
```

## No hacer ahora

- No crear RPC batch.
- No modificar BD equipos.
- No llamar `obtenerEquiposSolicitud` por cada fila.
- No crear dependencia fuerte desde componentes a `dbequipos`.
- No bloquear el render de solicitudes por equipos.

## Criterios de aceptación actual

- La UI muestra mock de equipos.
- El modelo UI soporta loader/error.
- La celda no se rompe si luego llegan equipos reales.
- La integración futura no obliga a rediseñar tabla/card.
