CONTEXTO DETALLADO PARA SPEC — VISTA DE CREACIÓN DE SOLICITUDES DE COMPRA
MÓDULO: Compras / Solicitudes de compra
ENFOQUE ACTUAL: Solicitud de tipo producto
FECHA DE CONTEXTO: 2026-06-18
PROYECTO: gestión operativa / solicitudes compras

=====================================================================
1. OBJETIVO DEL DOCUMENTO
=====================================================================

Este archivo sirve como contexto base para crear una SPEC funcional y técnica de la vista de creación de solicitudes de compra usando Vue 3, TypeScript, Pinia, Supabase, Zod y Vue Datepicker.

La vista debe permitir crear solicitudes de compra por pasos, conectada al flujo GO de Supabase:

- Preparar subida de adjuntos con rpc_preparar_upload_solicitud_go().
- Subir archivos a Supabase Storage usando ruta definitiva.
- Crear solicitud con rpc_crear_solicitud_compra_go().
- Enviar productos existentes o temporales.
- Asociar equipos por cod_equipo.
- Guardar como borrador o enviar a revisión.
- Solicitar urgencia solamente cuando se envía.

De momento, las imágenes/mockups y el comportamiento visual deben enfocarse en solicitudes de tipo producto, es decir:

- tipo_solicitud = zafra | cultivo | otros
- p_productos con productos existentes y productos temporales
- p_servicios = []

El modo servicio queda contemplado en arquitectura, pero NO es el foco visual de estas 12 sugerencias.

=====================================================================
2. TECNOLOGÍAS Y LIBRERÍAS CONFIRMADAS
=====================================================================

Frontend base:

- Vue 3
- TypeScript
- Vite
- Tailwind CSS
- Pinia
- Vue Router
- Supabase JS
- lucide-vue-next
- VueUse

Librerías agregadas por decisión reciente:

- Zod: validación de formularios y payloads.
- @vuepic/vue-datepicker: selección visual de fecha de entrega.

No usar por ahora:

- PrimeVue para este formulario.
- Tablas HTML nativas para productos.
- table, tr, td, th.

La tabla/listado visual de productos debe hacerse con divs, grid, flex y cards responsivas.

=====================================================================
3. TEMA VISUAL OBLIGATORIO
=====================================================================

El diseño debe usar la siguiente identidad visual como base:

@theme {
  /* Color Palette */
  --color-main: #004643;
  --color-main-light: #006B65;
  --color-main-dark: #002E2C;
  --color-main-muted: #004643CC;

  --color-second: #F0EDE5;
  --color-second-dark: #E2DDD3;
  --color-second-deep: #C9C3B4;

  --color-accent: #D4A853;
  --color-accent-light: #E8C47A;
  --color-accent-dark: #B8892F;

  --color-success: #2D8A4E;
  --color-success-bg: #E8F5ED;
  --color-warning: #C97B2F;
  --color-warning-bg: #FDF3E3;
  --color-danger: #C0392B;
  --color-danger-bg: #FDECEA;
  --color-info: #1A6B9A;
  --color-info-bg: #E3F0FA;

  --color-white: #FFFFFF;
  --color-gray-50: #F8F7F4;
  --color-gray-100: #EFEDE7;
  --color-gray-200: #D8D4CA;
  --color-gray-300: #B8B3A7;
  --color-gray-400: #8F8A7F;
  --color-gray-500: #6B6660;
  --color-gray-600: #4A4640;
  --color-gray-700: #2E2B26;
  --color-gray-900: #1A1917;

  /* Typography */
  --font-display: 'Bebas Neue', 'Arial Narrow', sans-serif;
  --font-body: 'DM Sans', 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Arial Narrow', sans-serif;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.07);
  --shadow-lg: 0 10px 30px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08);
  --shadow-xl: 0 20px 50px rgba(0,0,0,0.16), 0 8px 20px rgba(0,0,0,0.10);

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 14px;
  --radius-xl: 22px;
  --radius-full: 9999px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 300ms ease;
  --transition-slow: 400ms cubic-bezier(0.4, 0, 0.2, 1);
}

Uso visual recomendado:

- Fondo general: color-gray-50 o color-second.
- Cards: color-white.
- Bordes: color-gray-200.
- Texto principal: color-gray-900.
- Texto secundario: color-gray-500 o color-gray-600.
- Botón primario: color-accent con texto oscuro o blanco según contraste final.
- Botón secundario: blanco con borde color-main.
- Estado activo del stepper: color-main.
- Estados completados: color-success.
- Alertas de validación: color-danger y color-danger-bg.
- Advertencias de urgencia o productos faltantes: color-warning y color-warning-bg.

=====================================================================
4. ESTRUCTURA FINAL DEL FORMULARIO POR PASOS
=====================================================================

La vista NO debe tener 7 pasos. Debe tener 4 pasos visuales:

PASO 1 — Datos base
- Tipo de solicitud
- Fecha de entrega
- Equipos

PASO 2 — Productos
- Buscador de productos existentes arriba del listado visual.
- Botón para agregar producto temporal.
- Listado visual de productos agregados.
- Ejemplos de productos existentes y temporales.

PASO 3 — Observaciones y urgencia
- Observación de la solicitud.
- Switch o toggle para solicitar prioridad urgente.
- Motivo de urgencia visible solo cuando se active urgencia.
- Mensaje aclaratorio: la urgencia solo aplica al enviar, no al guardar borrador.

PASO 4 — Resumen y acción final
- Vista previa de todos los datos.
- Comparación clara de acciones: Guardar borrador o Enviar solicitud.
- Confirmación visual antes de crear.

=====================================================================
5. HEADER PERSISTENTE DEL FORMULARIO
=====================================================================

Cada paso debe mostrar visualmente el contexto del solicitante y la fecha de creación.

El header debe estar arriba del wizard, visible en todos los pasos.

Contenido mínimo:

- Título: Nueva solicitud de compra
- Subtítulo: Solicitud de producto
- Solicitante: nombre del usuario autenticado
- Área: área del usuario autenticado
- Fecha de creación visual: fecha/hora local America/Panama

Ejemplo visual:

Nueva solicitud de compra
Solicitud de producto
Solicitante: Juan Pérez
Área: Operativa
Fecha de creación: 18 jun 2026 · 08:42 a.m.

Nota técnica:

- La fecha de creación mostrada en frontend es solo visual.
- La fecha real de creación la define Supabase/PostgreSQL con now() al insertar.
- El frontend no debe enviar area_codigo, role_codigo, area_solicitante_id, role_solicitante_id ni solicitante_email a la RPC principal.
- La BD obtiene el actor autenticado internamente.

=====================================================================
6. STEPPER VISUAL
=====================================================================

Stepper desktop recomendado:

1 Datos base → 2 Productos → 3 Observaciones → 4 Resumen

Estados:

- Pendiente: círculo gris con número.
- Activo: círculo color-main, texto color-main.
- Completado: círculo color-success con check.
- Error: círculo color-danger o borde rojo.

Stepper mobile recomendado:

- Mostrar solo: Paso X de 4.
- Debajo: nombre del paso actual.
- Evitar saturar con los 4 labels completos en pantallas pequeñas.

=====================================================================
7. PASO 1 — DATOS BASE
=====================================================================

Campos:

- tipo_solicitud
- fecha_entrega
- equipos

Orden recomendado:

1. Tipo de solicitud
2. Fecha de entrega
3. Equipos

Tipos disponibles para estas imágenes/spec inicial:

- zafra
- cultivo
- otros

Aunque la RPC permite servicio, el modo servicio NO es foco visual por ahora.

Reglas:

- tipo_solicitud es obligatorio.
- fecha_entrega es obligatoria.
- fecha_entrega no debe ser menor a la fecha actual.
- mínimo 1 equipo obligatorio incluso para borrador.
- el equipo se guarda por cod_equipo.
- no enviar id del equipo a la RPC.
- evitar duplicar el mismo cod_equipo dentro de la selección.

Búsqueda de equipos:

- Input por código, descripción, modelo o marca si existe en la fuente.
- Mostrar chips seleccionados.
- Permitir remover chips.
- Si no hay equipo seleccionado, mostrar placeholder o empty state.

Ejemplos de equipos para mockup:

- EQ-001 · Tractor John Deere 6155M
- EQ-015 · Cosechadora Case IH 7250
- EQ-023 · Camión Freightliner M2

Validación visual:

- Si el usuario intenta avanzar sin completar campos, marcar errores por campo.
- El botón Siguiente debe estar deshabilitado cuando falten datos obligatorios o puede habilitarse y mostrar errores al tocarlo. Recomendada: habilitado solo cuando el paso esté válido para reducir fricción.

=====================================================================
8. PASO 2 — PRODUCTOS
=====================================================================

Este paso debe ser para tipo producto.

Componentes principales:

1. Buscador de productos existentes.
2. Botón Agregar producto temporal.
3. Listado visual de productos agregados.
4. Validaciones/empty states.

Reglas del buscador:

- Debe estar arriba de la tabla/listado visual.
- Buscar por cod_producto y descripción.
- Los resultados deben permitir agregar un producto existente con un botón Agregar.
- No permitir agregar el mismo cod_producto dos veces.
- No se debe mostrar cantidad para productos en creación.
- Las cantidades de productos se llenarán después, en revisión de almacén.

Ejemplos de productos existentes:

Producto existente 1:
- cod_producto: ACE-001
- descripcion: Aceite hidráulico ISO 68
- unidad_codigo: L
- unidad_label: Litro
- badge: Existente

Producto existente 2:
- cod_producto: FIL-003
- descripcion: Filtro de aceite Baldwin B2
- unidad_codigo: UND
- unidad_label: Unidad
- badge: Existente

Producto existente 3:
- cod_producto: GRS-002
- descripcion: Grasa multipropósito EP2
- unidad_codigo: KG
- unidad_label: Kilogramo
- badge: Existente

Producto temporal ejemplo:
- temporal: true
- descripcion: Empaque para tapa de válvula
- unidad_codigo: UND
- unidad_label: Unidad
- badge: Temporal

Payload para producto existente:

{
  "cod_producto": "ACE-001"
}

Payload para producto temporal:

{
  "temporal": true,
  "descripcion": "Empaque para tapa de válvula",
  "unidad_codigo": "unidad"
}

Validaciones de productos:

- Para guardar borrador: se puede permitir productos vacíos, si se quiere borrador flexible.
- Para enviar: mínimo 1 producto obligatorio.
- Producto existente: cod_producto obligatorio.
- Producto temporal: descripcion obligatoria y unidad_codigo obligatoria.
- No enviar servicios cuando el tipo sea producto.

Listado visual con divs:

No usar:

- table
- tr
- td
- th

Usar:

- div
- grid
- flex
- cards

Desktop recomendado:

- Encabezado visual con div grid.
- Columnas: Código / Descripción / Unidad / Tipo / Acción.
- Cada producto como row visual con div.
- Badge Existente o Temporal.
- Botones de editar/eliminar.

Mobile recomendado:

- Cada producto como card.
- Mostrar código o “Temporal”.
- Mostrar descripción.
- Mostrar unidad.
- Mostrar badge.
- Botón de eliminar visible.

Producto temporal:

- Abrir modal o drawer lateral.
- Campos: descripción, unidad de medida, notas opcionales.
- Botones: Cancelar / Agregar.
- Al agregar, insertar en la lista visual con badge Temporal.

=====================================================================
9. PASO 3 — OBSERVACIONES Y URGENCIA
=====================================================================

Campos:

- observacion
- solicitar_urgente
- motivo_urgencia

Reglas:

- observacion es obligatoria.
- solicitar_urgente es boolean.
- motivo_urgencia solo es obligatorio si:
  - el usuario va a enviar la solicitud, y
  - solicitar_urgente = true.
- si el usuario guarda borrador, la urgencia se ignora.
- si guarda borrador:
  - p_solicitar_urgente = false
  - p_motivo_urgencia = null

Mensaje visual recomendado cuando se active urgencia:

“La solicitud se creará con prioridad normal. La urgencia quedará pendiente de aprobación solo al enviar.”

Ejemplo de observación:

“Repuesto requerido para mantenimiento preventivo de equipos de zafra.”

Ejemplo con urgencia:

Observación:
“Repuesto crítico para evitar paro de máquina en plena zafra.”

Motivo de urgencia:
“Riesgo de paro de operación.”

Validación visual:

- Si observación está vacía, mostrar error debajo del textarea.
- Si solicita urgencia y presiona Enviar sin motivo, mostrar error en motivo.
- No bloquear Guardar borrador por motivo de urgencia vacío.

=====================================================================
10. PASO 4 — RESUMEN Y ACCIONES
=====================================================================

El último paso no debe pedir datos nuevos.

Debe mostrar:

- Solicitante
- Área
- Fecha de creación visual
- Tipo de solicitud
- Fecha de entrega
- Equipos seleccionados
- Productos agregados
- Observación
- Urgencia solicitada sí/no
- Motivo de urgencia si aplica
- Adjuntos si se agregan en esta vista

Acciones:

- Anterior
- Guardar borrador
- Enviar solicitud

Comportamiento de Guardar borrador:

- p_enviar = false
- estado final esperado: borrador
- prioridad directa: normal
- no se crea solicitud_prioridad_peticion
- si urgencia estaba marcada, se ignora

Comportamiento de Enviar solicitud:

- p_enviar = true
- si tipo producto: estado final esperado para_revision_almacen
- prioridad directa: normal
- si solicitar_urgente = true, se crea solicitud_prioridad_peticion con estado prioridad_pendiente

=====================================================================
11. FLUJO SUPABASE — RPCS Y STORAGE
=====================================================================

RPC para preparar adjuntos:

rpc_preparar_upload_solicitud_go()

Retorna:

- bucket_id
- upload_group_id
- base_path
- fecha_path
- area_codigo
- area_slug
- usuario_slug
- email

Bucket recomendado:

solicitudes-compras

Estructura de Storage:

solicitudes-compra/{area_slug}/{usuario_slug}/{fecha}/{upload_group_id}/{archivo_seguro}

Ejemplo:

solicitudes-compra/operativa/juan-perez/2026-06-18/ad-go-operativa-jp-file-sol-20260618-073522-a8f3/adj-001-factura-proveedor.pdf

Flujo correcto con adjuntos:

1. Usuario selecciona archivos.
2. Frontend llama rpc_preparar_upload_solicitud_go().
3. Frontend obtiene bucket_id, upload_group_id y base_path.
4. Frontend sube archivos a Supabase Storage.
5. Frontend arma p_adjuntos con metadata real.
6. Frontend llama rpc_crear_solicitud_compra_go().
7. La RPC valida que los archivos existan en storage.objects.
8. Si falta un archivo, la creación se aborta.

RPC principal:

rpc_crear_solicitud_compra_go(
  p_tipo_codigo text,
  p_fecha_entrega date,
  p_observacion text,
  p_equipos text[],
  p_productos jsonb,
  p_servicios jsonb,
  p_enviar boolean,
  p_solicitar_urgente boolean,
  p_motivo_urgencia text,
  p_adjuntos jsonb,
  p_requerir_adjuntos_storage boolean
)

Payload ejemplo para solicitud de producto enviada:

{
  "p_tipo_codigo": "zafra",
  "p_fecha_entrega": "2026-06-30",
  "p_observacion": "Repuesto crítico para mantenimiento preventivo de equipos de zafra.",
  "p_equipos": ["EQ-001", "EQ-015", "EQ-023"],
  "p_productos": [
    { "cod_producto": "ACE-001" },
    { "cod_producto": "FIL-003" },
    {
      "temporal": true,
      "descripcion": "Empaque para tapa de válvula",
      "unidad_codigo": "unidad"
    }
  ],
  "p_servicios": [],
  "p_enviar": true,
  "p_solicitar_urgente": true,
  "p_motivo_urgencia": "Riesgo de paro de operación",
  "p_adjuntos": [],
  "p_requerir_adjuntos_storage": true
}

Payload ejemplo para guardar borrador:

{
  "p_tipo_codigo": "zafra",
  "p_fecha_entrega": "2026-06-30",
  "p_observacion": "Pendiente completar repuestos requeridos.",
  "p_equipos": ["EQ-001"],
  "p_productos": [],
  "p_servicios": [],
  "p_enviar": false,
  "p_solicitar_urgente": false,
  "p_motivo_urgencia": null,
  "p_adjuntos": [],
  "p_requerir_adjuntos_storage": true
}

Respuesta esperada de rpc_crear_solicitud_compra_go():

{
  "solicitud_id": "uuid",
  "folio_sol": null,
  "tipo_codigo": "zafra",
  "estado_codigo": "para_revision_almacen",
  "prioridad_codigo": "normal",
  "ciclo_estado": 1,
  "productos_total": 3,
  "servicios_total": 0,
  "equipos_total": 3,
  "adjuntos_total": 0,
  "peticion_urgente_creada": true,
  "urgente_ignorado_por_borrador": false
}

=====================================================================
12. REGLAS DE NEGOCIO QUE LA UI DEBE RESPETAR
=====================================================================

Reglas de creación:

- folio_sol inicia en null.
- ciclo_estado inicia en 1.
- tipo producto enviado va a para_revision_almacen.
- guardado como borrador va a borrador.
- solicitud se crea con prioridad normal.
- la urgencia no cambia directamente la prioridad.
- si se solicita urgencia al enviar, se crea petición urgente pendiente.
- si se marca urgencia pero se guarda borrador, se ignora.

Reglas de equipos:

- mínimo 1 equipo para crear solicitud.
- guardar solo cod_equipo.
- evitar duplicados.

Reglas de productos existentes:

- cod_producto obligatorio.
- el producto debe existir.
- debe estar activo.
- no debe ser temporal.
- no enviar cantidad en creación.

Reglas de productos temporales:

- temporal = true.
- descripcion obligatoria.
- unidad_codigo obligatoria.
- la BD generará cod_producto temporal.
- se inserta en producto con es_temporal = true.

Reglas de cantidades:

- en creación, todos los productos deben quedar sin cantidad.
- no mostrar input de cantidad en productos.
- no enviar cantidad, cantidad_inventario ni cantidad_gerencia desde el formulario inicial.

Reglas de observación:

- observación obligatoria.

Reglas de adjuntos:

- el archivo se sube antes de crear la solicitud.
- la RPC valida existencia en Storage.
- si falta un archivo, no se crea la solicitud.
- p_adjuntos puede ser [] si aún no se exige adjunto por tipo o acción.

=====================================================================
13. VALIDACIÓN CON ZOD
=====================================================================

Validación por pasos:

PASO 1:
- tipoSolicitud obligatorio: zafra | cultivo | otros
- fechaEntrega obligatoria
- fechaEntrega >= fecha actual
- equipos.length >= 1

PASO 2:
- productos es arreglo
- si guardar borrador, puede permitir productos.length = 0
- si enviar, productos.length >= 1
- producto existente: cod_producto requerido
- producto temporal: descripcion requerida y unidad_codigo requerida

PASO 3:
- observacion obligatoria
- solicitarUrgente boolean
- motivoUrgencia requerido solo si acción final = enviar y solicitarUrgente = true

PASO 4:
- validación final según acción:
  - draft: reglas mínimas de creación
  - send: reglas completas de envío

Importante:

La validación del botón Siguiente puede ser por paso, pero la validación de Guardar borrador y Enviar debe ejecutarse completa al final.

=====================================================================
14. ESTRUCTURA DE ESTADO FRONTEND
=====================================================================

Estado recomendado:

CrearSolicitudFormState:

- currentStep: 1 | 2 | 3 | 4
- submitMode: draft | send | null
- fechaCreacionLocal: Date
- solicitanteNombre: string
- solicitanteEmail: string
- areaNombre: string
- tipoSolicitud: zafra | cultivo | otros | null
- fechaEntrega: string | null
- equipos: EquipoSeleccionado[]
- productos: ProductoSolicitudItem[]
- servicios: [] // fuera de foco visual actual
- observacion: string
- solicitarUrgente: boolean
- motivoUrgencia: string
- adjuntosLocales: File[]
- adjuntosSubidos: AdjuntoUploadMetadata[]
- uploadSession: null | { bucket_id, upload_group_id, base_path, fecha_path }
- loading: boolean
- uploading: boolean
- error: string | null

EquipoSeleccionado:

- cod_equipo: string
- descripcion?: string
- marca?: string
- modelo?: string
- tipo?: string

ProductoSolicitudItem existente:

- localId: string
- tipo: existente
- cod_producto: string
- descripcion: string
- unidad_codigo: string
- unidad_label: string

ProductoSolicitudItem temporal:

- localId: string
- tipo: temporal
- temporal: true
- descripcion: string
- unidad_codigo: string
- unidad_label: string
- notas?: string

=====================================================================
15. ARQUITECTURA DE COMPONENTES PROPUESTA
=====================================================================

Vista:

- SolicitudCompraCrearView.vue

Componentes:

- CrearSolicitudShell.vue
- CrearSolicitudHeader.vue
- CrearSolicitudStepper.vue
- CrearSolicitudStepDatosBase.vue
- CrearSolicitudStepProductos.vue
- CrearSolicitudStepObservacionesUrgencia.vue
- CrearSolicitudStepResumen.vue
- CrearSolicitudFooterActions.vue
- ProductoSearchBox.vue
- ProductosVisualList.vue
- ProductoTemporalModal.vue
- EquiposSelector.vue
- SolicitudCreateErrorBanner.vue

Store/composable:

- useCrearSolicitudCompraStore.ts
- useCrearSolicitudValidation.ts
- useSolicitudUpload.ts

Service:

- solicitudCompraCrear.service.ts

Schemas:

- solicitudCompraCrear.schemas.ts

Types:

- solicitudCompraCrear.types.ts

=====================================================================
16. 12 SUGERENCIAS VISUALES / IMÁGENES PARA SPEC
=====================================================================

Las 12 imágenes deben ser 3 propuestas por paso, enfocadas en tipo producto.

Referencia general ya generada en el entorno:

/mnt/data/a_clean_high_resolution_ui_ux_design_mockup_image.png

---------------------------------------------------------------------
PASO 1 — DATOS BASE
---------------------------------------------------------------------

Imagen 1.1 — Paso 1 estado inicial

Debe mostrar:
- Header con solicitante y fecha de creación.
- Stepper en paso 1 activo.
- Tipo de solicitud vacío.
- Fecha de entrega vacía.
- Buscador de equipos vacío.
- Empty state: “Aún no has seleccionado equipos”.
- Botón Guardar borrador visible.
- Botón Siguiente deshabilitado o visualmente inactivo.

Objetivo:
Mostrar la primera carga del formulario sin datos.

Imagen 1.2 — Paso 1 con datos válidos

Debe mostrar:
- Tipo de solicitud: Zafra.
- Fecha de entrega: 30/06/2026.
- Equipos seleccionados como chips:
  - EQ-001 · Tractor John Deere 6155M
  - EQ-015 · Cosechadora Case IH 7250
  - EQ-023 · Camión Freightliner M2
- Botón Siguiente activo.

Objetivo:
Mostrar cómo se ve el paso listo para avanzar.

Imagen 1.3 — Paso 1 con errores

Debe mostrar:
- Campos obligatorios vacíos.
- Bordes rojos en tipo, fecha y equipos.
- Mensajes:
  - “Este campo es obligatorio”
  - “Debe seleccionar al menos un equipo”
- Botón Siguiente deshabilitado.

Objetivo:
Mostrar validación clara por campo.

---------------------------------------------------------------------
PASO 2 — PRODUCTOS
---------------------------------------------------------------------

Imagen 2.1 — Buscar y agregar productos existentes

Debe mostrar:
- Stepper en paso 2 activo.
- Buscador arriba del listado visual.
- Placeholder: “Buscar producto por código o descripción...”.
- Resultados disponibles:
  - ACE-001 · Aceite hidráulico ISO 68 · Litro (L)
  - FIL-003 · Filtro de aceite Baldwin B2 · Unidad (UND)
  - GRS-002 · Grasa multipropósito EP2 · Kilogramo (KG)
- Botón Agregar en cada resultado.
- Botón “Agregar producto temporal” al lado del buscador o en la esquina superior derecha.

Objetivo:
Mostrar el flujo de agregar productos existentes.

Imagen 2.2 — Lista visual con existentes y temporales

Debe mostrar:
- Buscador arriba.
- Texto “3 productos agregados”.
- Listado con divs tipo tabla visual, NO tabla HTML.
- Productos:
  - ACE-001 · Aceite hidráulico ISO 68 · Litro (L) · badge Existente
  - FIL-003 · Filtro de aceite Baldwin B2 · Unidad (UND) · badge Existente
  - Temporal · Empaque para tapa de válvula · Unidad (UND) · badge Temporal
- Botones editar y eliminar por fila/card.
- No mostrar cantidad.

Objetivo:
Mostrar mezcla permitida de productos existentes y temporales dentro de solicitud tipo producto.

Imagen 2.3 — Modal de producto temporal

Debe mostrar:
- Fondo del paso 2 oscurecido.
- Modal o drawer “Agregar producto temporal”.
- Campos:
  - Descripción: Empaque para tapa de válvula
  - Unidad de medida: Unidad (UND)
  - Notas opcionales
- Botones:
  - Cancelar
  - Agregar

Objetivo:
Mostrar la captura de producto que no existe en catálogo.

Imagen 2.4 — Validación sin productos

Debe mostrar:
- Paso 2 activo.
- Alerta amarilla/naranja:
  “Aún no has agregado productos”
  “Debes agregar al menos un producto para enviar la solicitud.”
- Guardar borrador disponible.
- Siguiente deshabilitado si se quiere forzar productos para avanzar, o permitido si se valida al enviar. Recomendación visual: permitir guardar borrador y bloquear envío al final.

Objetivo:
Aclarar diferencia entre borrador y envío.

Nota:
Aunque se pidieron 3 sugerencias por paso, en paso 2 se recomienda conservar esta cuarta escena porque el producto es el núcleo del formulario. Si la SPEC debe quedar estrictamente en 12 imágenes, esta puede reemplazar una variante menos necesaria o integrarse como estado dentro de 2.1.

---------------------------------------------------------------------
PASO 3 — OBSERVACIONES Y URGENCIA
---------------------------------------------------------------------

Imagen 3.1 — Observación sin urgencia

Debe mostrar:
- Stepper en paso 3 activo.
- Textarea observación con ejemplo:
  “Se requiere para mantenimiento preventivo de equipos de zafra.”
- Toggle de urgencia apagado.
- Mensaje informativo:
  “La solicitud se creará con prioridad normal.”
- Botón Siguiente activo.

Objetivo:
Mostrar el caso normal sin urgencia.

Imagen 3.2 — Observación con urgencia activada

Debe mostrar:
- Toggle urgencia encendido.
- Campo motivo visible.
- Motivo seleccionado/escrito:
  “Riesgo de paro de operación.”
- Alerta informativa:
  “La prioridad urgente quedará pendiente de aprobación solo al enviar.”

Objetivo:
Mostrar cómo aparece el motivo de urgencia.

Imagen 3.3 — Validación motivo requerido

Debe mostrar:
- Urgencia encendida.
- Motivo vacío.
- Error debajo del motivo:
  “Este campo es obligatorio al solicitar prioridad urgente.”
- Observación válida.
- Botón Siguiente deshabilitado o error visible al intentar continuar.

Objetivo:
Mostrar validación condicional.

---------------------------------------------------------------------
PASO 4 — RESUMEN
---------------------------------------------------------------------

Imagen 4.1 — Resumen vista previa

Debe mostrar:
- Stepper en paso 4 activo.
- Cards de resumen:
  - Datos generales
  - Equipos
  - Productos
  - Observaciones
  - Urgencia
- Productos incluidos:
  - ACE-001 · Aceite hidráulico ISO 68
  - FIL-003 · Filtro de aceite Baldwin B2
  - Empaque para tapa de válvula · Temporal
- Botones:
  - Anterior
  - Guardar borrador
  - Enviar solicitud

Objetivo:
Mostrar revisión final antes de insertar.

Imagen 4.2 — Confirmación de acción

Debe mostrar:
- Modal pequeño sobre el resumen:
  “¿Qué deseas hacer?”
- Explicar opciones:
  - Guardar borrador para continuar después.
  - Enviar solicitud para revisión de almacén.
- Botones:
  - Guardar borrador
  - Enviar solicitud

Objetivo:
Evitar envíos accidentales.

Imagen 4.3 — Estado de procesamiento / éxito

Debe mostrar una de estas variantes:

Variante A: Procesando
- Botones deshabilitados.
- Texto: “Creando solicitud...”
- Indicador de progreso.

Variante B: Éxito
- Mensaje: “Solicitud creada correctamente.”
- Estado: para_revision_almacen o borrador según acción.
- Botón: Ver solicitud o Volver al listado.

Objetivo:
Mostrar cierre del flujo.

=====================================================================
17. CORRECCIÓN SOBRE CANTIDAD DE IMÁGENES
=====================================================================

La instrucción original pidió 12 imágenes, 3 por paso.

Distribución estricta:

- Paso 1: 3 imágenes
- Paso 2: 3 imágenes
- Paso 3: 3 imágenes
- Paso 4: 3 imágenes

Distribución sugerida final estricta:

1.1 Paso 1 inicial
1.2 Paso 1 válido
1.3 Paso 1 errores
2.1 Paso 2 buscar existentes
2.2 Paso 2 lista existentes + temporales
2.3 Paso 2 modal temporal
3.1 Paso 3 sin urgencia
3.2 Paso 3 con urgencia
3.3 Paso 3 error motivo
4.1 Paso 4 resumen
4.2 Paso 4 confirmación acción
4.3 Paso 4 procesando/éxito

La escena “Paso 2 validación sin productos” debe documentarse en la SPEC como estado interno del paso 2, no como imagen extra, si se necesitan exactamente 12 imágenes.

=====================================================================
18. CRITERIOS DE ACEPTACIÓN PARA LA SPEC
=====================================================================

Funcionales:

- El usuario puede completar el formulario en 4 pasos.
- El header de solicitante y fecha de creación está visible en todos los pasos.
- El tipo de solicitud controla el detalle del paso 2.
- En modo producto, se muestran productos existentes y temporales.
- El buscador de producto está arriba del listado visual.
- No se usan tablas HTML para el listado de productos.
- Los productos existentes se envían con cod_producto.
- Los productos temporales se envían con temporal=true, descripcion y unidad_codigo.
- No se captura cantidad de productos en creación.
- Se puede guardar como borrador.
- Se puede enviar solicitud.
- La urgencia solo se considera al enviar.
- La validación de motivo urgente no bloquea borrador.
- La RPC recibe p_servicios = [] para tipo producto.
- La UI no envía datos de actor que la BD obtiene internamente.

Visuales:

- La UI usa la paleta principal #004643 y acento #D4A853.
- El diseño se ve como wizard moderno con cards.
- El stepper marca estado activo, completado y error.
- En desktop, productos se muestran como grid visual tipo tabla con divs.
- En mobile, productos se muestran como cards.
- Los botones principales y secundarios son consistentes.
- Los errores son visibles por campo.
- Los mensajes de advertencia usan color-warning-bg.
- Los mensajes de error usan color-danger-bg.

Técnicos:

- Usar Zod para validar pasos y acción final.
- Usar Vue Datepicker para fecha de entrega.
- Usar Supabase JS para llamadas RPC y Storage.
- Usar Pinia o composable para estado del wizard.
- Separar service, store, schemas y types.
- Manejar loading, uploading, error y success.
- Evitar duplicados en equipos y productos.
- Construir payload final antes de llamar la RPC.

=====================================================================
19. ERRORES ESPERADOS Y MENSAJES UI
=====================================================================

Error: tipo vacío
Mensaje: “Seleccione un tipo de solicitud.”

Error: fecha vacía
Mensaje: “Seleccione una fecha de entrega.”

Error: fecha pasada
Mensaje: “La fecha de entrega no puede ser menor a la fecha actual.”

Error: equipos vacíos
Mensaje: “Debe seleccionar al menos un equipo.”

Error: sin productos al enviar
Mensaje: “Debe agregar al menos un producto para enviar la solicitud.”

Error: producto temporal sin descripción
Mensaje: “La descripción del producto temporal es obligatoria.”

Error: producto temporal sin unidad
Mensaje: “Seleccione una unidad de medida.”

Error: observación vacía
Mensaje: “La observación es obligatoria.”

Error: urgencia sin motivo al enviar
Mensaje: “Debe indicar el motivo de urgencia.”

Error: falla RPC
Mensaje general: “No se pudo crear la solicitud. Revise los datos e intente nuevamente.”

Error: archivo no existe en Storage
Mensaje: “Uno de los archivos no se subió correctamente. Vuelva a cargarlo antes de enviar.”

=====================================================================
20. FUENTES DE DATOS SUPABASE PARA MOSTRAR EN UI
=====================================================================

Solicitante:

- Se puede mostrar desde sesión/auth y perfil local.
- Contexto antiguo incluye tabla PROFILE con email, nombre, area y role.
- Contexto nuevo del flujo GO usa app_usuario/app_area mediante fn_require_actor y funciones internas.
- Para UI, mostrar nombre, email y área disponibles; si falta nombre, usar email.

Productos existentes:

Tabla base:

- producto

Campos útiles:

- id
- cod_producto
- descripcion
- unidad_medida_id
- activo
- es_temporal, si existe en esquema actualizado

Unidades:

Tabla base:

- unidad_medida

Campos útiles:

- id
- abreviatura
- descripcion

Equipos:

Tabla base/fuente:

- equipos

Campos útiles:

- cod_equipo
- modelo
- marca
- tipo
- activo

Solicitud:

Tabla base:

- solicitud_compra

Campos relevantes:

- id
- folio_sol
- tipo_solicitud_id
- estado_id
- prioridad_id
- fecha_entrega
- observacion
- ciclo_estado
- solicitante_email
- area_solicitante_id
- role_solicitante_id

Detalle producto:

Tabla base:

- solicitud_producto_detalle

Campos relevantes:

- solicitud_id
- producto_id
- descripcion_original_supervisor
- cantidad null
- cantidad_inventario null
- cantidad_gerencia null
- estado_detalle_id pendiente
- activo true
- requiere_revision_almacen true
- ciclo 1
- linea_solicitud null

Adjuntos:

Tabla base:

- solicitud_adjunto

Storage:

- storage.objects
- bucket: solicitudes-compras

=====================================================================
21. NOTAS IMPORTANTES PARA IMPLEMENTACIÓN
=====================================================================

1. La UI debe evitar mezclar productos y servicios.
2. En esta primera SPEC visual, todo debe ser tipo producto.
3. El paso 2 debe cambiar cuando en el futuro se seleccione servicio, pero eso queda fuera de estas imágenes.
4. No agregar campo cantidad para productos.
5. No generar folio en frontend.
6. No calcular estado en frontend para guardar en tabla; solo usar p_enviar y dejar que la RPC determine estado.
7. No enviar actor desde frontend.
8. No enviar area/role desde frontend.
9. No usar tabla HTML para productos.
10. Mantener diferencia clara entre borrador y enviar.
11. Los adjuntos deben subirse antes de crear la solicitud si se incluyen en el flujo.
12. Si una creación falla después de subir adjuntos, puede quedar archivo huérfano; existe RPC para listarlos.

=====================================================================
22. RESUMEN EJECUTIVO PARA SPEC
=====================================================================

Crear una vista wizard de 4 pasos para solicitudes de compra tipo producto. La vista debe mostrar siempre un header con solicitante, área y fecha visual de creación. El paso 1 captura tipo, fecha de entrega y equipos. El paso 2 permite buscar productos existentes arriba del listado y agregar productos temporales mediante modal/drawer. El listado de productos debe ser visual, con divs y responsive, nunca con table/tr/td/th. El paso 3 captura observación y urgencia condicional. El paso 4 muestra resumen y permite guardar borrador o enviar solicitud. La integración con Supabase se realiza mediante rpc_crear_solicitud_compra_go, enviando productos en JSONB, equipos como text[], servicios vacío, y adjuntos previamente subidos a Storage si existen. La BD define actor, estado, prioridad normal, historial, evento y petición urgente.

FIN DEL CONTEXTO.