# Prompt para modificar tipos existentes

Actua como un desarrollador senior de Vue 3 y TypeScript estricto.

Necesito modificar tipos existentes en el modulo:

```text
[RUTA_DEL_MODULO]
```

Antes de escribir codigo:

1. Revisa los archivos de tipos existentes relacionados con el cambio.
2. Revisa los componentes, stores o services que consumen esos tipos.
3. Identifica si el nuevo contrato rompe un tipo, interfaz, importacion o respuesta ya usada.
4. No dupliques tipos si ya existe un tipo equivalente.
5. Mantén nombres, estilo y convenciones del proyecto.

Regla de conflicto obligatoria:

Si el cambio pedido entra en conflicto con tipos existentes, contratos consumidos, nombres ya usados o shapes que no pueden migrarse de forma segura, no hagas cambios en el codigo. En ese caso, responde solo con:

```text
No se aplicaron cambios por conflictos encontrados:
- [CONFLICTO_1]
- [CONFLICTO_2]

Propuesta segura:
- [PROPUESTA_1]
- [PROPUESTA_2]
```

Reglas obligatorias:

1. Usa TypeScript estricto.
2. Evita `any`; usa tipos especificos, `unknown` con narrowing, genericos o uniones discriminadas.
3. Exporta solo lo necesario para los consumidores reales.
4. No cambies componentes, stores ni services si el pedido es solo de tipos, salvo que se indique explicitamente.
5. No inventes campos, tablas, columnas, endpoints ni RPCs.
6. Conserva compatibilidad hacia atras cuando sea posible.
7. Si un tipo representa una respuesta externa, modela tambien los casos de error o ausencia de datos si aplican.

Datos del cambio:

- Tipo o interfaz a modificar: `[NOMBRE_TIPO]`
- Nuevo campo o comportamiento: `[DESCRIPCION]`
- Archivos consumidores conocidos: `[RUTAS]`
- Restricciones de compatibilidad: `[RESTRICCIONES]`

Resultado esperado:

1. Modifica solo los archivos necesarios.
2. Muestra la lista de archivos modificados.
3. Explica brevemente el contrato final.
4. Ejecuta la verificacion de tipos o indica por que no se pudo ejecutar.
