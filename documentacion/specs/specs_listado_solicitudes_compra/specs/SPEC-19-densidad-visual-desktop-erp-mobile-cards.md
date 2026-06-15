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

# SPEC-19 — Densidad visual: desktop ERP y mobile cards

## Objetivo

Ajustar la densidad visual del listado para que:

- desktop sí parezca una aplicación ERP administrativa de compras/inventario;
- mobile no parezca ERP, sino una experiencia cómoda basada en cards.

## Archivos afectados

```txt
src/views/compras/SolicitudesCompraView.vue
src/components/compras/list/**
```

## Referencias visuales

```txt
referencias/screen_list_Desktop.png
referencias/screen_main_mobile.png
```

## Subspec lógica

No aplica lógica de datos.

Este spec controla:

```txt
densidad visual
tamaño de inputs
tamaño de filas
distribución desktop
distribución mobile
sensación general de la interfaz
```

No debe modificar:

```txt
RPC
stores
services
mappers
permisos
reglas por rol
carga por scroll
búsqueda
```

## Subspec types

No aplica.

No crear ni modificar tipos.

## Subspec views / components

### Desktop: ERP administrativo

El desktop debe parecer:

```txt
ERP / inventario / compras / gestión interna
```

Debe sentirse:

```txt
compacto
denso
administrativo
serio
funcional
con muchas columnas visibles
orientado a revisión rápida
```

### Reglas visuales desktop

```txt
- Usar tabla, no cards.
- Toolbar compacta.
- Inputs/selects/botones con altura aproximada de 32px a 36px.
- Fuente base aproximada: 12px a 13px.
- Encabezados de tabla: 11px a 12px, peso medio.
- Padding de celdas reducido: px-2 o px-3, py-2.
- Filas de tabla entre 72px y 92px aproximadamente.
- Observación con máximo 3 líneas usando line-clamp-3.
- Badges compactos.
- Chips de equipos compactos.
- Folio principal visible, OC debajo en tamaño menor y opacidad baja.
- Contenedor blanco con borde suave y sombra ligera.
- Bloque de filtros como barra de control ERP, no formulario grande.
```

Cantidad visual esperada:

```txt
6 a 9 filas visibles en un viewport desktop normal
```

según altura real y contenido.

### No usar en desktop

```txt
- Cards.
- Inputs de 44px a 48px tipo mobile.
- Botones grandes.
- Padding excesivo.
- Filas de 108px a 128px.
- Espacios vacíos exagerados.
- Títulos grandes.
- Textos de ayuda largos.
```

### Mobile: cards operativas

Mobile no debe parecer ERP.

Debe parecer:

```txt
app mobile operativa con cards
```

Debe sentirse:

```txt
cómodo
táctil
visual
fácil de leer
orientado a revisión rápida en teléfono
```

### Reglas visuales mobile

```txt
- Usar cards apiladas.
- No usar tabla.
- No comprimir columnas como ERP.
- Folio grande y visible cuando el rol pueda verlo.
- Estado arriba a la derecha como badge.
- OC debajo del folio solo si aplica.
- Observación como contenido principal, máximo 3 líneas.
- Prioridad, fecha y equipos como chips o elementos compactos.
- Indicadores abajo de la card.
- Cards con padding cómodo.
- FAB dorado visible, sin tapar contenido importante.
- Bottom nav fijo si corresponde al layout mobile.
```

### No usar en mobile

```txt
- Tabla horizontal.
- Columnas comprimidas.
- Fuente demasiado pequeña.
- Celdas tipo grid ERP.
- Scroll interno dentro de cards.
```

## Reglas de paleta

Usar la paleta del contexto:

```txt
Fondo principal: #EEECE4
Card/contenedor: #FFFFFF o #FAF9F5
Verde corporativo oscuro: #003D36
Teal activo: #005C53
Dorado: #D9A73F
Texto principal: #111827
Texto secundario: #7A746B
Bordes suaves: #E5E0D6
```

## Criterios de aceptación

- En desktop el listado se siente tipo ERP administrativo.
- En desktop se ven varias filas sin zoom exagerado.
- En desktop los filtros son compactos.
- En desktop la tabla mantiene columnas por rol sin romperse.
- En desktop no se usan cards.
- En mobile no se usa tabla.
- En mobile las solicitudes se muestran como cards cómodas.
- En mobile no se intenta copiar la densidad ERP.
- La observación mantiene `line-clamp-3` en desktop y mobile.
- El diseño respeta la paleta CADASA.
- No se agregan títulos grandes ni textos de ayuda innecesarios.
