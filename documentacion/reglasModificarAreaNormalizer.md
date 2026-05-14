# Reglas antes de modificar el normalizador de areas

Usa este checklist antes de cambiar:

```text
src/components/compras/permissions/areaNormalizer.ts
```

Revision obligatoria:

1. Revisa `SolicitudArea` en `src/components/compras/permissions/types.ts`.
2. Revisa todos los consumidores de `getSolicitudArea`.
3. Confirma si el cambio afecta permisos, visibilidad de campos, columnas o acciones.
4. Confirma si el area nueva viene desde Supabase, desde perfil de usuario o desde una vista.
5. Verifica que el cambio no convierta areas desconocidas en `operativa` por defecto.

Reglas:

1. No modifiques `permisosForm.ts` como parte de un cambio del normalizador, salvo que el pedido lo indique explicitamente.
2. Mantén `normalizeAreaText` como funcion pura y sin dependencias externas.
3. Mantén `getSolicitudArea` retornando siempre un `SolicitudArea`.
4. Si un area no coincide con ningun mapeo, debe devolver `sin_permiso`.
5. No agregues aliases ambiguos sin confirmar su origen en datos reales.
6. No cambies valores existentes de `SolicitudArea` si ya hay consumidores activos.
7. Ejecuta la verificacion de tipos despues del cambio.

Si el cambio entra en conflicto con permisos existentes, consumidores actuales o nombres de area ambiguos, no hagas cambios y responde:

```text
No se aplicaron cambios por conflictos encontrados:
- [CONFLICTO_1]
- [CONFLICTO_2]

Propuesta segura:
- [PROPUESTA_1]
- [PROPUESTA_2]
```
