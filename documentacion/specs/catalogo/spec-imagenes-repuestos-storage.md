# Feature: Imágenes de Repuestos con Storage Privado

> Módulo: Catálogo / Repuestos  
> Stack: Vue 3 + TypeScript + Pinia + Supabase JS + Supabase Storage + Tailwind  
> Fecha: 2026-06-26  
> Estado: Implementación ajustada según decisiones funcionales y UX del chat

## Objetivo

Rediseñar el manejo de imágenes del catálogo de repuestos para dejar de guardar `base64` en la tabla principal y pasar a un flujo con `Supabase Storage` privado, soportando hasta 4 imágenes por repuesto:

- `frente` obligatoria
- `lado` obligatoria
- `puesta` opcional
- `extra` opcional

La imagen `frente` genera además una miniatura cuadrada de `200x200`, usada como imagen principal de vista rápida.

## Contexto actual

Luego de la implementación realizada:

- create y update trabajan con objetos `File` en memoria;
- las previews del formulario usan URLs locales temporales tipo `blob:`;
- `imagen_1` ya no guarda `base64`, sino el `path` de la miniatura en Storage;
- `imagen_2` ya no guarda `base64`, sino la lista ordenada de `paths` de originales;
- el detalle interpreta `imagen_1` como miniatura y `imagen_2` como galería original.

Archivos relevantes:

```txt
src/components/catalogo/create/RepuestoCreatePanel.vue
src/components/catalogo/update/RepuestoUpdatePanel.vue
src/components/catalogo/create/CatalogImageUpload.vue
src/components/catalogo/update/UpdateImageUpload.vue
src/components/catalogo/RepuestoDetailPanel.vue
src/stores/dbequipos/repuestos/repuestos.types.ts
src/stores/dbequipos/repuestos/repuestos.images.ts
src/stores/dbequipos/repuestos/repuestos.store.ts
src/stores/dbequipos/repuestos/repuestos.service.ts
```

## Problema que resuelve

- elimina el peso excesivo de `base64` en la tabla;
- separa almacenamiento físico y datos de negocio;
- soporta múltiples imágenes por repuesto;
- incorpora miniatura optimizada;
- mantiene bucket privado con serving vía signed URLs;
- permite borrado y reemplazo parcial con sincronización entre Storage y columnas.

## Alcance

- Reemplazar `base64` por subida de archivos a `Supabase Storage`.
- Soportar 4 imágenes por repuesto.
- Generar miniatura `200x200` desde `frente`.
- Mantener compatibilidad con la tabla actual usando `imagen_1` e `imagen_2`.
- Restringir acceso a imágenes a usuarios autenticados.
- Permitir captura desde cámara en móvil cuando el navegador lo soporte.
- Mostrar errores visibles cuando falle la lectura de imágenes privadas.

## Fuera de alcance

- Crear una tabla hija nueva para imágenes en esta fase.
- Cambiar el esquema SQL de `catalogo_repuestos_captura`.
- Implementar recorte manual visual.
- Implementar `getUserMedia` con preview en vivo y overlay de captura.

## Decisión funcional

### Cantidad y tipos

Se manejarán hasta 4 imágenes:

1. `frente` obligatoria
2. `lado` obligatoria
3. `puesta` opcional
4. `extra` opcional

### Miniatura

- `frente` es la fuente de la miniatura.
- La miniatura es cuadrada de `200x200`.
- Se guarda como archivo independiente en Storage.

### Persistencia en la tabla actual

- `imagen_1`: `storage path` de la miniatura `200x200`
- `imagen_2`: lista de `storage paths` de originales separadas por `;`

Orden lógico de `imagen_2`:

```txt
frente;lado;puesta;extra
```

Si faltan slots al final:

```txt
frente;lado
```

Si se elimina una imagen intermedia en update, se preserva la posición dejando hueco vacío:

```txt
frente;;puesta
```

Esto permite seguir asignando por índice:

- posición 1 = `frente`
- posición 2 = `lado`
- posición 3 = `puesta`
- posición 4 = `extra`

## Decisión técnica

### Guardar `storage path`, no `publicUrl`

Se guarda el `path` del objeto dentro del bucket, no una URL pública.

Ejemplo:

```txt
imagen_1 = repuestos/{user_id}/{repuesto_id}/thumb-200x200.jpg
imagen_2 = repuestos/{user_id}/{repuesto_id}/frente.jpg;repuestos/{user_id}/{repuesto_id}/lado.jpg;repuestos/{user_id}/{repuesto_id}/puesta.jpg;repuestos/{user_id}/{repuesto_id}/extra.jpg
```

Ventajas:

- funciona con bucket privado;
- permite regenerar signed URLs;
- evita acoplar la tabla al dominio de entrega;
- facilita cambiar la estrategia de serving luego.

## Bucket de Storage

Bucket:

```txt
catalogo-repuestos
```

Tipo de acceso:

```txt
private
```

Estructura sugerida:

```txt
repuestos/{user_id}/{repuesto_id}/thumb-200x200.jpg
repuestos/{user_id}/{repuesto_id}/frente.jpg
repuestos/{user_id}/{repuesto_id}/lado.jpg
repuestos/{user_id}/{repuesto_id}/puesta.jpg
repuestos/{user_id}/{repuesto_id}/extra.jpg
```

## Seguridad del bucket

El bucket permanece privado y usa políticas RLS sobre `storage.objects`.

### Reglas objetivo

- solo usuarios autenticados pueden subir;
- solo usuarios autenticados pueden leer;
- solo usuarios autenticados pueden borrar;
- opcionalmente cada usuario solo puede escribir dentro de su carpeta;
- no usar `getPublicUrl`.

### Política base mínima

```sql
create policy "catalogo repuestos insert auth"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'catalogo-repuestos'
);

create policy "catalogo repuestos select auth"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'catalogo-repuestos'
);

create policy "catalogo repuestos update auth"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'catalogo-repuestos'
)
with check (
  bucket_id = 'catalogo-repuestos'
);

create policy "catalogo repuestos delete auth"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'catalogo-repuestos'
);
```

## Serving de imágenes

Como el bucket es privado:

- no usar `getPublicUrl()`;
- usar `createSignedUrl()` para imágenes individuales;
- no persistir signed URLs en la base de datos.

### Recomendación de serving

- usar `createSignedUrl(path, 3600)` al abrir paneles o detalle;
- si una signed URL falla o devuelve `null`, mostrar error visible en la UI;
- no fallar silenciosamente.

## Flujo de creación

### Paso 1

El usuario llena el formulario base del repuesto.

### Paso 2

El usuario agrega:

- frente
- lado
- puesta opcional
- extra opcional

### Paso 3

Frontend valida:

- máximo 4 imágenes;
- tipos esperados `image/jpeg,image/png,image/webp`;
- tamaño máximo por archivo configurable;
- obligatoriedad de `frente` y `lado`.

### Paso 4

Se crea el repuesto para obtener `repuesto_id`.

### Paso 5

Se genera miniatura `200x200` desde `frente`.

### Paso 6

Se suben archivos a Storage:

- `thumb-200x200`
- `frente`
- `lado`
- `puesta` si aplica
- `extra` si aplica

### Paso 7

Se actualiza el repuesto con:

- `imagen_1 = path miniatura`
- `imagen_2 = paths originales separados por ;`

### Regla transaccional aplicada en create

La creación del catálogo depende del éxito del flujo de imágenes:

- si falla la subida o la generación de miniatura:
  - se eliminan del bucket los archivos subidos parcialmente;
  - se elimina el repuesto creado en tabla;
  - se muestra error;
  - no debe quedar un catálogo parcialmente creado.

## Flujo de actualización

- Si el usuario no cambia imágenes, no se toca Storage.
- Si reemplaza una o más imágenes:
  - se vuelve a subir solo lo modificado;
  - si cambia `frente`, se regenera la miniatura;
  - se actualiza `imagen_1` e `imagen_2`.
- Si elimina una imagen existente:
  - primero debe eliminarse exitosamente en Storage;
  - solo después se limpia el `path` correspondiente en columnas;
  - si elimina `frente`, también debe eliminarse la miniatura;
  - si falla la eliminación en Storage, no se limpia la columna.
- Si se borró algo en Storage y luego falla otra parte del update:
  - el sistema debe intentar sincronizar la tabla para no dejar `paths` huérfanos.

## Comportamiento de cámara

### Flujo implementado

La UI ofrece dos acciones:

- `Tomar foto`
- `Elegir archivo`

Comportamiento esperado:

- si el navegador soporta cámara utilizable, `Tomar foto` intenta abrirla con `capture="environment"`;
- si no la soporta, ese flujo degrada al explorador de archivos o galería;
- `Elegir archivo` sigue disponible explícitamente.

### Limitaciones conocidas

- `capture="environment"` no garantiza comportamiento uniforme;
- algunos navegadores muestran cámara y galería en el mismo chooser;
- otros abren directamente galería o explorador.

## Transformación de imagen

La miniatura se genera en frontend con `canvas`.

### Reglas

- tomar la imagen `frente`;
- calcular recorte cuadrado centrado;
- exportar a `JPEG`;
- tamaño final `200x200`;
- calidad sugerida `0.82` a `0.9`.

## Preview en formulario

- La preview no transforma el archivo original.
- Se renderiza usando una URL local temporal (`blob:`).
- Debe mantener la proporción original de la imagen.
- Debe usar una altura fija para evitar que imágenes altas agranden demasiado el formulario.
- No se fuerza aspecto `1:1` en la preview.
- En mobile y tablet, los slots de imágenes se muestran en filas de dos columnas.

## Cambios requeridos por archivo

### `src/stores/dbequipos/repuestos/repuestos.types.ts`

- Mantener `imagen_1` e `imagen_2` como `string | null`.
- Agregar tipos auxiliares para slots, archivos, previews y signed URLs.

### `src/stores/dbequipos/repuestos/repuestos.images.ts`

- Centralizar parsing y construcción de `imagen_2`.
- Preservar huecos intermedios cuando se elimina una imagen en update.

### `src/stores/dbequipos/repuestos/repuestos.service.ts`

Helpers esperados:

- `uploadRepuestoImage(...)`
- `uploadRepuestoImages(...)`
- `deleteRepuestoStorageObject(...)`
- `createSquareThumbnail(...)`
- `createSignedImageUrl(...)`
- `createSignedImageUrls(...)`
- `resolveSignedImagesWithErrors(...)`

### `src/stores/dbequipos/repuestos/repuestos.store.ts`

Acciones esperadas:

- create con rollback si fallan imágenes;
- update con borrado condicionado al éxito en Storage;
- resolución de signed URLs y errores de lectura;
- sincronización posterior si hubo borrado parcial.

### `src/components/catalogo/create/CatalogImageUpload.vue`

Debe soportar:

- selección de archivo;
- intento de captura por cámara;
- degradación a galería/explorador;
- preview local;
- validación por campo;
- reemplazo individual;
- altura fija manteniendo proporción original.

### `src/components/catalogo/create/RepuestoCreatePanel.vue`

- trabajar con `File` en memoria;
- separar formulario y archivos locales;
- exigir `frente` y `lado`;
- usar subgrilla de dos columnas para imágenes.

### `src/components/catalogo/update/RepuestoUpdatePanel.vue`

- mostrar imágenes existentes con signed URLs;
- permitir reemplazo parcial;
- permitir borrado parcial;
- regenerar miniatura cuando cambia `frente`;
- mostrar errores visibles si falla la lectura.

### `src/components/catalogo/RepuestoDetailPanel.vue`

- interpretar `imagen_1` como miniatura;
- parsear `imagen_2` por `;`;
- mostrar galería original;
- mostrar error visible si alguna signed URL no pudo resolverse.

## Contrato temporal de parsing

```ts
type RepuestoImagenesParseadas = {
  miniaturaPath: string | null;
  originales: string[];
  frentePath: string | null;
  ladoPath: string | null;
  puestaPath: string | null;
  extraPath: string | null;
};
```

Reglas:

- `imagen_1` se interpreta como miniatura;
- `imagen_2` se divide por `;`;
- los vacíos intermedios se preservan por posición;
- el orden es la verdad de negocio en esta fase.

## Validaciones funcionales

- `frente` y `lado` son obligatorias.
- `puesta` es opcional.
- `extra` es opcional.
- máximo 4 imágenes.
- solo formatos permitidos.
- tamaño máximo por archivo configurable.
- si falla la subida de una imagen, no se debe guardar un estado incompleto silencioso.

## Estrategia de errores

- Si falla la creación del repuesto antes de subir imágenes, no subir nada.
- Si falla una subida o miniatura en create:
  - mostrar error claro;
  - no cerrar el panel;
  - revertir registro + Storage parcial.
- Si falla el borrado en Storage durante update:
  - mostrar error claro;
  - no limpiar la columna.
- Si falla la lectura de una imagen privada:
  - mostrar error visible en update o detalle.

## Riesgos conocidos

- Guardar múltiples paths en `imagen_2` separados por `;` sigue siendo una solución transitoria.
- El detalle, edición y listado deben respetar siempre el orden.
- Las signed URLs expiran y no deben persistirse.
- La cámara vía `capture` depende del navegador y del dispositivo.
- Preservar huecos en `imagen_2` es funcional, pero frágil a futuro.

## Evolución futura recomendada

Fase posterior ideal:

- crear tabla hija `catalogo_repuestos_imagenes`;
- un registro por imagen;
- campos por tipo: `frente`, `lado`, `puesta`, `extra`, `thumb`;
- metadatos: orden, mime, size, width, height, created_by;
- relación por `repuesto_id`.

## Criterios de aceptación

- El sistema deja de guardar `base64` en `imagen_1` e `imagen_2`.
- El bucket de imágenes es privado.
- Solo usuarios autenticados pueden acceder según políticas configuradas.
- El usuario puede cargar `frente`, `lado`, `puesta` opcional y `extra` opcional.
- `frente` y `lado` son obligatorias.
- La imagen `frente` genera miniatura `200x200`.
- `imagen_1` guarda la miniatura.
- `imagen_2` guarda los paths de originales separados por `;`.
- Create y update soportan el nuevo flujo.
- Si falla Storage en create, no debe quedar el repuesto creado.
- Si falla borrar un archivo en Storage durante update, no debe limpiarse la columna correspondiente.
- El detalle del repuesto puede mostrar miniatura y galería original.
- Si no se puede leer una imagen privada, la UI muestra error visible.
- La preview del formulario mantiene el aspecto original con altura fija.
- En mobile y tablet, las imágenes se muestran en filas de dos columnas.

## Referencias

- Supabase Storage fundamentals: https://supabase.com/docs/guides/storage/buckets/fundamentals
- Supabase Storage access control: https://supabase.com/docs/guides/storage/security/access-control
- Supabase Storage serving and downloads: https://supabase.com/docs/guides/storage/serving/downloads
