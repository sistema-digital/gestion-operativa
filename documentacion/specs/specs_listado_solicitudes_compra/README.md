# Paquete de specs — Listado de Solicitudes de Compra

Este ZIP contiene specs granulares para implementar el listado de solicitudes de compra sin mezclar toda la lógica en una sola tarea grande.

## Decisiones confirmadas

- Vista: `src/views/compras/SolicitudesCompraView.vue`.
- Store: `src/stores/db_compras/solicitudes_compra/`.
- RPC: `rpc_obtener_solicitudes_lista_usuario`.
- Carga inicial: 25 solicitudes más recientes por `created_at`.
- Scroll infinito: 25 en 25.
- Búsqueda: llama al RPC sin paginación remota; la vista muestra resultados de 25 en 25 de forma local.
- Equipos: por ahora mock fijo `422005`, `422009`, `422014`.
- Equipos reales: preparado para batch asincrónico futuro con loader por celda/card.
- Búsqueda por equipo: preparada para futuro, no implementada ahora.
- Click en fila/card: preparado, sin navegación real.
- Crear: preparado, sin navegación real.
- Estilo desktop: sí debe parecer ERP administrativo.
- Estilo mobile: no debe parecer ERP; debe usar cards cómodas.

## Orden de implementación sugerido

1. `SPEC-00` — Preparación de contexto y reglas base.
2. `SPEC-01` — Types base.
3. `SPEC-02` — Service RPC.
4. `SPEC-03` — Helpers y mappers.
5. `SPEC-04` — Configuración por rol.
6. `SPEC-05` — Store Pinia.
7. `SPEC-06` — Composable de pantalla.
8. `SPEC-07` — Vista principal.
9. `SPEC-08` — Toolbar.
10. `SPEC-09` — Tabs de grupo.
11. `SPEC-10` — Tabla desktop.
12. `SPEC-11` — Celdas reutilizables.
13. `SPEC-12` — Lista mobile.
14. `SPEC-13` — Card mobile.
15. `SPEC-14` — Loading, empty, error y scroll.
16. `SPEC-15` — Preparación futura de equipos batch.
17. `SPEC-16` — Preparación futura de búsqueda por equipo.
18. `SPEC-17` — Preparación futura de navegación a detalle.
19. `SPEC-18` — Preparación futura de crear solicitud.
20. `SPEC-19` — Densidad visual desktop ERP y mobile cards.

## Estructura objetivo

```txt
src/
├── views/
│   └── compras/
│       └── SolicitudesCompraView.vue
│
├── components/
│   └── compras/
│       └── list/
│           ├── SolicitudesListToolbar.vue
│           ├── SolicitudesGrupoTabs.vue
│           ├── SolicitudesListSkeleton.vue
│           ├── SolicitudesListEmptyState.vue
│           ├── SolicitudesListErrorState.vue
│           ├── SolicitudesListLoadMoreTrigger.vue
│           ├── solicitudListRoleConfig.ts
│           ├── useSolicitudesCompraList.ts
│           ├── desktop/
│           │   └── SolicitudesDesktopTable.vue
│           ├── mobile/
│           │   ├── SolicitudesMobileList.vue
│           │   └── SolicitudMobileCard.vue
│           └── cells/
│               ├── SolicitudFolioCell.vue
│               ├── SolicitudObservacionCell.vue
│               ├── SolicitudEstadoBadge.vue
│               ├── SolicitudPrioridadBadge.vue
│               ├── SolicitudEquiposCell.vue
│               ├── SolicitudFechaEntregaCell.vue
│               ├── SolicitudIndicadoresCell.vue
│               ├── SolicitudAreaCell.vue
│               ├── SolicitudSolicitanteCell.vue
│               └── SolicitudBloqueadoCell.vue
│
└── stores/
    └── db_compras/
        └── solicitudes_compra/
            ├── solicitudesCompra.types.ts
            ├── solicitudesCompra.service.ts
            ├── solicitudesCompra.helpers.ts
            ├── solicitudesCompra.mappers.ts
            └── solicitudesCompra.store.ts
```

## Referencias incluidas

```txt
referencias/fileproject_ubicacion_archivos.md
referencias/contexto_bd_compras_por_submodulos_CORREGIDO_2026_06_15.md
referencias/contexto_final_CORREGIDO_2026_06_15.md
referencias/screen_list_Desktop.png
referencias/screen_main_mobile.png
```
