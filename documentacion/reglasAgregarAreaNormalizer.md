# Reglas antes de agregar algo al normalizador de areas

Usa este checklist antes de agregar nuevas areas, aliases o reglas a:

```text
src/components/compras/permissions/areaNormalizer.ts
```

Revision obligatoria:

1. Confirma el texto exacto que llega desde Supabase o desde el perfil del usuario.
2. Normaliza mentalmente el valor esperado con `normalizeAreaText`: sin tildes, con trim y en mayusculas.
3. Revisa si el valor pertenece a una categoria existente: `all`, `operativa`, `gerencia`, `almacen`, `secretaria` o `sin_permiso`.
4. Revisa si ya existe un mapeo equivalente en `AREAS_OPERATIVAS` o en `getSolicitudArea`.
5. Verifica si agregar el area puede abrir permisos que antes estaban bloqueados.

Reglas:

1. Agrega a `AREAS_OPERATIVAS` solo areas que realmente deben mapear a `operativa`.
2. Agrega condiciones explicitas en `getSolicitudArea` para areas administrativas.
3. No uses comparaciones parciales como `includes`, salvo que exista una regla documentada y aprobada.
4. No uses `any`.
5. No cambies la salida por defecto: siempre debe ser `sin_permiso`.
6. No agregues normalizaciones que alteren el significado del area original.
7. Ejecuta la verificacion de tipos despues del cambio.

Datos necesarios para agregar una regla:

- Area original exacta: `[AREA_ORIGINAL]`
- Area normalizada esperada: `[AREA_NORMALIZADA]`
- Resultado `SolicitudArea`: `[SOLICITUD_AREA]`
- Fuente del dato: `[SUPABASE_PERFIL_OTRA]`
- Consumidores afectados: `[RUTAS]`

Si el cambio entra en conflicto con reglas existentes o no hay certeza del permiso correcto, no hagas cambios y responde:

```text
No se aplicaron cambios por conflictos encontrados:
- [CONFLICTO_1]
- [CONFLICTO_2]

Propuesta segura:
- [PROPUESTA_1]
- [PROPUESTA_2]
```
