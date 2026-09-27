# RPC y contratos JSON para la nueva estructura

## Objetivo

Este documento contiene los contratos que la aplicación debe utilizar después de la migración de sistemas, subsistemas y aceites.

Todos los ejemplos de datos están expresados únicamente en JSON.

---

# 1. Resumen de RPC afectadas

## Actualizadas

- `rpc_catalogo_sistemas_listar()`
- `rpc_catalogo_sistema_guardar(p_data)`
- `rpc_catalogo_auxiliares()`
- `rpc_obtener_auxiliares_edicion_equipo()`
- `rpc_crear_equipo_completo(p_datos)`
- `rpc_actualizar_equipo_completo(p_codigo_equipo, p_cambios)`
- `rpc_obtener_equipo_para_edicion(p_codigo)`
- `rpc_obtener_aceites_equipo(p_equipo_id)`

## Nuevas

- `rpc_catalogo_subsistemas_listar()`
- `rpc_catalogo_subsistema_guardar(p_data)`

## Helpers internos relevantes

- `fn_resolver_sistema(p_data)`
- `fn_resolver_subsistema(p_data)`
- `fn_validar_payload_estructura_sistemas(p_data)`
- `fn_aplicar_estructura_sistemas(p_equipo_id, p_data)`
- `fn_actualizar_equipo_base(p_codigo_equipo, p_cambios)`
- `fn_actualizar_equipo_relaciones_base(p_codigo_equipo, p_cambios)`
- `fn_catalogo_sistema_item(p_id)`
- `fn_catalogo_subsistema_item(p_id)`
- `fn_catalogo_aceite_item(p_id)`

La app normalmente debe consumir las RPC públicas y no llamar directamente los helpers internos.

---

# 2. Contrato central `estructura_sistemas`

Este es el bloque que reemplaza completamente el bloque legacy `aceites`.

## Estructura general

```json
{
  "estructura_sistemas": {
    "nuevos": [],
    "actualizados": [],
    "eliminados": []
  }
}
```

---

# 3. Nodo nuevo raíz

Un nodo raíz siempre utiliza `sistema_id`.

```json
{
  "temp_id": "n1",
  "parent_temp_id": null,
  "sistema_id": 1,
  "subsistema_id": null,
  "aceite_id": null
}
```

También puede tener aceite.

```json
{
  "temp_id": "n1",
  "parent_temp_id": null,
  "sistema_id": 1,
  "subsistema_id": null,
  "aceite_id": 3
}
```

---

# 4. Nodo nuevo hijo

Un nodo hijo siempre utiliza `subsistema_id`.

```json
{
  "temp_id": "n2",
  "parent_temp_id": "n1",
  "sistema_id": null,
  "subsistema_id": 5,
  "aceite_id": 2
}
```

---

# 5. Estructura nueva de varios niveles

```json
{
  "estructura_sistemas": {
    "nuevos": [
      {
        "temp_id": "n1",
        "parent_temp_id": null,
        "sistema_id": 1,
        "subsistema_id": null,
        "aceite_id": null
      },
      {
        "temp_id": "n2",
        "parent_temp_id": "n1",
        "sistema_id": null,
        "subsistema_id": 5,
        "aceite_id": 2
      },
      {
        "temp_id": "n3",
        "parent_temp_id": "n2",
        "sistema_id": null,
        "subsistema_id": 8,
        "aceite_id": null
      },
      {
        "temp_id": "n4",
        "parent_temp_id": "n3",
        "sistema_id": null,
        "subsistema_id": 10,
        "aceite_id": 6
      }
    ],
    "actualizados": [],
    "eliminados": []
  }
}
```

---

# 6. Actualizar solamente el aceite de un nodo

```json
{
  "estructura_sistemas": {
    "nuevos": [],
    "actualizados": [
      {
        "id": 101,
        "aceite_id": 6
      }
    ],
    "eliminados": []
  }
}
```

---

# 7. Quitar aceite sin eliminar el nodo

```json
{
  "estructura_sistemas": {
    "nuevos": [],
    "actualizados": [
      {
        "id": 101,
        "aceite_id": null
      }
    ],
    "eliminados": []
  }
}
```

---

# 8. Mover un nodo a un padre existente

```json
{
  "estructura_sistemas": {
    "nuevos": [],
    "actualizados": [
      {
        "id": 105,
        "parent_id": 110
      }
    ],
    "eliminados": []
  }
}
```

El padre debe pertenecer al mismo equipo.

---

# 9. Mover un nodo debajo de un padre creado en la misma llamada

```json
{
  "estructura_sistemas": {
    "nuevos": [
      {
        "temp_id": "nuevo_padre",
        "parent_temp_id": "raiz",
        "sistema_id": null,
        "subsistema_id": 8,
        "aceite_id": null
      }
    ],
    "actualizados": [
      {
        "id": 105,
        "parent_temp_id": "nuevo_padre"
      }
    ],
    "eliminados": []
  }
}
```

---

# 10. Eliminar un nodo

```json
{
  "estructura_sistemas": {
    "nuevos": [],
    "actualizados": [],
    "eliminados": [
      {
        "id": 105
      }
    ]
  }
}
```

Eliminar un nodo elimina también sus descendientes y sus relaciones de aceite.

---

# 11. Campos permitidos por tipo de operación

## `nuevos`

```json
{
  "temp_id": "string",
  "parent_temp_id": null,
  "sistema_id": 1,
  "subsistema_id": null,
  "aceite_id": null
}
```

Campos permitidos:

- `temp_id`
- `parent_temp_id`
- `sistema_id`
- `subsistema_id`
- `aceite_id`

## `actualizados`

```json
{
  "id": 101,
  "parent_id": 100,
  "parent_temp_id": null,
  "sistema_id": null,
  "subsistema_id": 5,
  "aceite_id": 2
}
```

Campos permitidos:

- `id`
- `parent_id`
- `parent_temp_id`
- `sistema_id`
- `subsistema_id`
- `aceite_id`

No deben enviarse simultáneamente `parent_id` y `parent_temp_id` con valores no nulos.

## `eliminados`

```json
{
  "id": 101
}
```

Solamente se permite `id`.

---

# 12. `rpc_obtener_auxiliares_edicion_equipo()`

## Envío

No recibe payload.

## Retorno

```json
{
  "ok": true,
  "tipos_equipo": [
    {
      "id": 1,
      "nombre": "TRACTOR",
      "subtipos_sugeridos": [
        "AGRÍCOLA",
        "PESADO"
      ]
    }
  ],
  "etapas": [
    {
      "id": 1,
      "nombre": "ZAFRA"
    }
  ],
  "tipos_filtro": [
    {
      "id": 1,
      "nombre": "ACEITE MOTOR",
      "tipos_equipo_que_lo_usan": [
        "TRACTOR"
      ]
    }
  ],
  "sistemas": [
    {
      "id": 1,
      "nombre": "HIDRAULICO"
    }
  ],
  "subsistemas": [
    {
      "id": 5,
      "nombre": "DIRECCION"
    }
  ],
  "aceites": [
    {
      "id": 2,
      "nombre": "AW100"
    }
  ]
}
```

Los arreglos `sistemas`, `subsistemas` y `aceites` contienen únicamente elementos activos.

Esta es la RPC recomendada para alimentar selects de creación y edición.

---

# 13. `rpc_catalogo_auxiliares()`

## Envío

No recibe payload.

## Retorno

```json
{
  "ok": true,
  "tipos_filtro": [
    {
      "id": 1,
      "nombre": "ACEITE MOTOR",
      "activo": true
    }
  ],
  "sistemas": [
    {
      "id": 1,
      "nombre": "HIDRAULICO",
      "activo": true
    }
  ],
  "subsistemas": [
    {
      "id": 5,
      "nombre": "DIRECCION",
      "activo": false
    }
  ]
}
```

Esta RPC puede incluir activos e inactivos y es más apropiada para administración de catálogos.

---

# 14. `rpc_catalogo_sistema_guardar(p_data)`

## Crear

```json
{
  "id": null,
  "nombre": "HIDRAULICO",
  "activo": true
}
```

## Editar

```json
{
  "id": 1,
  "nombre": "HIDRAULICO",
  "activo": false
}
```

No admite otros campos.

## Retorno correcto

```json
{
  "ok": true,
  "operacion": "creado",
  "codigo": "SISTEMA_CREADO",
  "mensaje": "El sistema se creó correctamente.",
  "afecta_equipos": 0,
  "item": {
    "id": 1,
    "nombre": "HIDRAULICO",
    "activo": true,
    "creado_en": "2026-09-27T03:00:00-05:00",
    "actualizado_en": "2026-09-27T03:00:00-05:00",
    "aceites": [],
    "impacto": {
      "total_equipos": 0,
      "total_asignaciones": 0,
      "tipos_equipo": []
    }
  }
}
```

## Retorno de error de validación

```json
{
  "ok": false,
  "codigo": "SISTEMA_NOMBRE_DUPLICADO",
  "mensaje": "Ya existe un sistema con ese nombre."
}
```

Otros códigos posibles incluyen:

- `PAYLOAD_INVALIDO`
- `SISTEMA_NOMBRE_REQUERIDO`
- `SISTEMA_NOMBRE_DUPLICADO`
- `SISTEMA_NO_ENCONTRADO`

---

# 15. `rpc_catalogo_sistemas_listar()`

## Envío

No recibe payload.

## Retorno

```json
{
  "ok": true,
  "items": [
    {
      "id": 1,
      "nombre": "HIDRAULICO",
      "activo": true,
      "creado_en": "2026-09-27T03:00:00-05:00",
      "actualizado_en": "2026-09-27T03:00:00-05:00",
      "aceites": [
        {
          "id": 2,
          "nombre": "AW100",
          "cantidad_equipos": 4
        }
      ],
      "impacto": {
        "total_equipos": 4,
        "total_asignaciones": 4,
        "tipos_equipo": [
          {
            "id": 1,
            "nombre": "TRACTOR",
            "cantidad_equipos": 4
          }
        ]
      }
    }
  ],
  "resumen": {
    "total": 1,
    "activos": 1,
    "desactivados": 0
  }
}
```

---

# 16. `rpc_catalogo_subsistema_guardar(p_data)`

## Crear

```json
{
  "id": null,
  "nombre": "DIRECCION",
  "activo": true
}
```

## Editar

```json
{
  "id": 5,
  "nombre": "DIRECCION",
  "activo": false
}
```

## Retorno correcto

```json
{
  "ok": true,
  "operacion": "creado",
  "codigo": "SUBSISTEMA_CREADO",
  "mensaje": "El subsistema se creó correctamente.",
  "afecta_equipos": 0,
  "item": {
    "id": 5,
    "nombre": "DIRECCION",
    "activo": true,
    "creado_en": "2026-09-27T03:00:00-05:00",
    "actualizado_en": "2026-09-27T03:00:00-05:00",
    "sistemas": [],
    "aceites": [],
    "impacto": {
      "total_equipos": 0,
      "total_asignaciones": 0,
      "tipos_equipo": []
    }
  }
}
```

## Retorno de error

```json
{
  "ok": false,
  "codigo": "SUBSISTEMA_NOMBRE_DUPLICADO",
  "mensaje": "Ya existe un subsistema con ese nombre."
}
```

Otros códigos posibles incluyen:

- `PAYLOAD_INVALIDO`
- `SUBSISTEMA_NOMBRE_REQUERIDO`
- `SUBSISTEMA_NOMBRE_DUPLICADO`
- `SUBSISTEMA_NO_ENCONTRADO`

---

# 17. `rpc_catalogo_subsistemas_listar()`

## Envío

No recibe payload.

## Retorno

```json
{
  "ok": true,
  "items": [
    {
      "id": 5,
      "nombre": "DIRECCION",
      "activo": true,
      "creado_en": "2026-09-27T03:00:00-05:00",
      "actualizado_en": "2026-09-27T03:00:00-05:00",
      "sistemas": [
        {
          "id": 1,
          "nombre": "HIDRAULICO",
          "cantidad_equipos": 4
        }
      ],
      "aceites": [
        {
          "id": 2,
          "nombre": "AW100",
          "cantidad_equipos": 4
        }
      ],
      "impacto": {
        "total_equipos": 4,
        "total_asignaciones": 4,
        "tipos_equipo": [
          {
            "id": 1,
            "nombre": "TRACTOR",
            "cantidad_equipos": 4
          }
        ]
      }
    }
  ],
  "resumen": {
    "total": 1,
    "activos": 1,
    "desactivados": 0
  }
}
```

---

# 18. `rpc_crear_equipo_completo(p_datos)`

## Cambio obligatorio para la app

La creación debe enviar `estructura_sistemas`.

No debe depender del bloque legacy `aceites`.

Incluso sin sistemas inicialmente:

```json
{
  "estructura_sistemas": {
    "nuevos": []
  }
}
```

## Payload completo de ejemplo

```json
{
  "datos_equipo": {
    "codigo": "484200",
    "tipo_equipo": {
      "id": 1
    },
    "subtipo": "TRACTOR",
    "estado": "activo"
  },
  "etapas": {
    "agregadas": [
      {
        "etapa_id": 1
      }
    ]
  },
  "filtros": {
    "nuevos": [
      {
        "tipo_filtro": {
          "id": 1
        },
        "filtro": {
          "id": 1
        },
        "cantidad": 1
      }
    ]
  },
  "estructura_sistemas": {
    "nuevos": [
      {
        "temp_id": "s1",
        "parent_temp_id": null,
        "sistema_id": 1,
        "subsistema_id": null,
        "aceite_id": null
      },
      {
        "temp_id": "ss1",
        "parent_temp_id": "s1",
        "sistema_id": null,
        "subsistema_id": 5,
        "aceite_id": 2
      }
    ]
  }
}
```

## Retorno

```json
{
  "ok": true,
  "codigo": "EQUIPO_CREADO",
  "mensaje": "El equipo 484200 se creó correctamente.",
  "equipo_lista": {
    "id": 200,
    "codigo": "484200",
    "tipo_equipo_id": 1,
    "tipo_equipo": "TRACTOR",
    "subtipo": "TRACTOR",
    "estado": "activo",
    "main_storage_path": null,
    "tiene_imagen_main": false,
    "imagen_actualizada_en": null,
    "etapas": [
      {
        "id": 1,
        "nombre": "ZAFRA"
      }
    ]
  },
  "cambios_detalle": {
    "estructura_actualizada": true,
    "aceites_cambiaron": true
  },
  "resumen_operaciones": {
    "etapas_agregadas": 1,
    "filtros_agregados": 1,
    "sistemas_agregados": 1,
    "subsistemas_agregados": 1,
    "estructura_actualizada": true,
    "aceites_agregados": 1,
    "aceites_actualizados": 0,
    "aceites_eliminados": 0,
    "nodos_estructura_agregados": 2,
    "nodos_estructura_actualizados": 0,
    "nodos_estructura_eliminados": 0
  },
  "estructura_temp_ids": {
    "s1": 300,
    "ss1": 301
  }
}
```

---

# 19. `rpc_actualizar_equipo_completo(p_codigo_equipo, p_cambios)`

## Parámetro de identificación

```json
{
  "p_codigo_equipo": "484200"
}
```

## Payload de actualización completo

```json
{
  "datos_equipo": {
    "subtipo": "TRACTOR AGRICOLA"
  },
  "etapas": {
    "agregadas": [],
    "eliminadas": []
  },
  "filtros": {
    "nuevos": [],
    "actualizados": [],
    "eliminados": []
  },
  "estructura_sistemas": {
    "nuevos": [
      {
        "temp_id": "nuevo_hijo",
        "parent_temp_id": null,
        "sistema_id": 2,
        "subsistema_id": null,
        "aceite_id": 3
      }
    ],
    "actualizados": [
      {
        "id": 301,
        "aceite_id": 6
      }
    ],
    "eliminados": []
  }
}
```

## Actualización mínima de aceite

```json
{
  "estructura_sistemas": {
    "nuevos": [],
    "actualizados": [
      {
        "id": 301,
        "aceite_id": 6
      }
    ],
    "eliminados": []
  }
}
```

## Actualización sin cambios de estructura

```json
{
  "datos_equipo": {
    "subtipo": "TRACTOR AGRICOLA"
  },
  "estructura_sistemas": {
    "nuevos": [],
    "actualizados": [],
    "eliminados": []
  }
}
```

## Retorno

```json
{
  "ok": true,
  "codigo": "EQUIPO_ACTUALIZADO",
  "mensaje": "El equipo 484200 se actualizó correctamente.",
  "equipo_lista": {
    "id": 200,
    "codigo": "484200",
    "tipo_equipo_id": 1,
    "tipo_equipo": "TRACTOR",
    "subtipo": "TRACTOR AGRICOLA",
    "estado": "activo",
    "main_storage_path": null,
    "tiene_imagen_main": false,
    "imagen_actualizada_en": null,
    "etapas": [
      {
        "id": 1,
        "nombre": "ZAFRA"
      }
    ]
  },
  "cambios_detalle": {
    "datos_equipo_cambiaron": true,
    "etapas_cambiaron": false,
    "filtros_cambiaron": false,
    "aceites_cambiaron": true,
    "estructura_sistemas_cambiaron": true,
    "estructura_actualizada": true
  },
  "resumen_operaciones": {
    "etapas_agregadas": 0,
    "etapas_eliminadas": 0,
    "filtros_agregados": 0,
    "filtros_actualizados": 0,
    "filtros_eliminados": 0,
    "historiales_filtro_creados": 0,
    "aceites_agregados": 1,
    "aceites_actualizados": 1,
    "aceites_eliminados": 0,
    "estructura_agregada": 1,
    "estructura_actualizada": 0,
    "estructura_eliminada": 0,
    "sistemas_agregados": 1,
    "subsistemas_agregados": 0,
    "estructura_cambio": true,
    "nodos_estructura_agregados": 1,
    "nodos_estructura_actualizados": 0,
    "nodos_estructura_eliminados": 0
  },
  "estructura_temp_ids": {
    "nuevo_hijo": 302
  }
}
```

---

# 20. Payload legacy que ya no debe enviarse

No enviar:

```json
{
  "aceites": {
    "nuevos": [],
    "actualizados": [],
    "eliminados": []
  }
}
```

La actualización lo rechaza.

La app debe eliminar este bloque de su store, DTO y lógica de comparación.

---

# 21. `rpc_obtener_equipo_para_edicion(p_codigo)`

## Parámetro

```json
{
  "p_codigo": "484200"
}
```

## Retorno

```json
{
  "ok": true,
  "equipo": {
    "id": 200,
    "codigo": "484200",
    "tipo_equipo_id": 1,
    "tipo_equipo": "TRACTOR",
    "subtipo": "TRACTOR AGRICOLA",
    "estado": "activo",
    "main_storage_path": null,
    "tiene_imagen_main": false,
    "imagen_actualizada_en": null
  },
  "etapas": [
    {
      "id": 1,
      "nombre": "ZAFRA"
    }
  ],
  "filtros": [
    {
      "id": 500,
      "equipo_id": 200,
      "tipo_filtro_id": 1,
      "filtro_id": 1,
      "cantidad": 1,
      "tipoFiltro": {
        "id": 1,
        "nombre": "ACEITE MOTOR",
        "activo": true
      },
      "filtro": {
        "id": 1,
        "codigo": "FILTRO-001",
        "esta_en_lista_compras": true,
        "activo": true
      },
      "cantidad_equivalencias": 0
    }
  ],
  "estructura_sistemas": [
    {
      "id": 300,
      "parent_id": null,
      "sistema": {
        "id": 1,
        "nombre": "HIDRAULICO",
        "activo": true
      },
      "subsistema": null,
      "aceite": null
    },
    {
      "id": 301,
      "parent_id": 300,
      "sistema": null,
      "subsistema": {
        "id": 5,
        "nombre": "DIRECCION",
        "activo": true
      },
      "aceite": {
        "id": 2,
        "nombre": "AW100",
        "activo": true
      }
    }
  ]
}
```

La clave antigua `aceites` ya no forma parte de esta respuesta.

La app debe construir el árbol a partir de `id` y `parent_id`.

---

# 22. Construcción conceptual del árbol en frontend

Entrada:

```json
{
  "estructura_sistemas": [
    {
      "id": 300,
      "parent_id": null,
      "sistema": {
        "id": 1,
        "nombre": "HIDRAULICO"
      },
      "subsistema": null
    },
    {
      "id": 301,
      "parent_id": 300,
      "sistema": null,
      "subsistema": {
        "id": 5,
        "nombre": "DIRECCION"
      }
    },
    {
      "id": 302,
      "parent_id": 301,
      "sistema": null,
      "subsistema": {
        "id": 8,
        "nombre": "BOMBA"
      }
    }
  ]
}
```

Representación visual resultante:

```json
{
  "id": 300,
  "nombre": "HIDRAULICO",
  "hijos": [
    {
      "id": 301,
      "nombre": "DIRECCION",
      "hijos": [
        {
          "id": 302,
          "nombre": "BOMBA",
          "hijos": []
        }
      ]
    }
  ]
}
```

La representación visual es responsabilidad de la app.

El backend continúa enviando la lista plana.

---

# 23. `rpc_obtener_aceites_equipo(p_equipo_id)`

## Parámetro

```json
{
  "p_equipo_id": 200
}
```

## Retorno

```json
[
  {
    "sistema": "HIDRAULICO",
    "subsistema": "DIRECCION",
    "ruta": "HIDRAULICO > DIRECCION",
    "aceite": "AW100"
  },
  {
    "sistema": "TRANSMISION",
    "subsistema": null,
    "ruta": "TRANSMISION",
    "aceite": "80W90"
  }
]
```

No devuelve wrapper `ok`.

Si no hay aceites devuelve:

```json
[]
```

En jerarquías profundas:

```json
[
  {
    "sistema": "HIDRAULICO",
    "subsistema": "REDUCTOR",
    "ruta": "HIDRAULICO > DIRECCION > BOMBA > REDUCTOR",
    "aceite": "85W140"
  }
]
```

---

# 24. `fn_catalogo_aceite_item(p_id)`

Aunque es helper interno, su estructura es importante porque alimenta información de catálogo.

## Resultado conceptual

```json
{
  "id": 2,
  "nombre": "AW100",
  "activo": true,
  "creado_en": "2026-01-01T00:00:00-05:00",
  "actualizado_en": "2026-01-01T00:00:00-05:00",
  "sistemas": [
    {
      "id": 1,
      "nombre": "HIDRAULICO",
      "cantidad_equipos": 4
    }
  ],
  "impacto": {
    "total_equipos": 4,
    "total_asignaciones": 6,
    "tipos_equipo": [
      {
        "id": 1,
        "nombre": "TRACTOR",
        "cantidad_equipos": 4
      }
    ]
  }
}
```

Los sistemas se calculan subiendo desde el nodo del aceite hasta el sistema raíz.

---

# 25. Reglas de activos durante creación y edición

## Disponible para asignar

```json
{
  "sistema": {
    "activo": true
  },
  "subsistema": {
    "activo": true
  },
  "aceite": {
    "activo": true
  }
}
```

## Existente pero inactivo

La lectura de un equipo puede devolver:

```json
{
  "id": 301,
  "parent_id": 300,
  "sistema": null,
  "subsistema": {
    "id": 5,
    "nombre": "DIRECCION",
    "activo": false
  },
  "aceite": {
    "id": 2,
    "nombre": "AW100",
    "activo": false
  }
}
```

La app debe mostrarlo porque ya está asignado.

No debe ofrecerlo para una asignación nueva.

---

# 26. Reglas de validación importantes para el frontend

## Raíz válida

```json
{
  "parent_temp_id": null,
  "sistema_id": 1,
  "subsistema_id": null
}
```

## Hijo válido

```json
{
  "parent_temp_id": "n1",
  "sistema_id": null,
  "subsistema_id": 5
}
```

## Raíz inválida

```json
{
  "parent_temp_id": null,
  "sistema_id": null,
  "subsistema_id": 5
}
```

## Hijo inválido

```json
{
  "parent_temp_id": "n1",
  "sistema_id": 1,
  "subsistema_id": null
}
```

## Referencia circular inválida

```json
{
  "nuevos": [
    {
      "temp_id": "a",
      "parent_temp_id": "b",
      "sistema_id": null,
      "subsistema_id": 5,
      "aceite_id": null
    },
    {
      "temp_id": "b",
      "parent_temp_id": "a",
      "sistema_id": null,
      "subsistema_id": 6,
      "aceite_id": null
    }
  ]
}
```

---

# 27. Errores relevantes de estructura

La app debe tratar estos errores como errores de validación funcional:

- `ESTRUCTURA_SISTEMAS_PAYLOAD_INVALIDO`
- `ESTRUCTURA_SISTEMAS_TEMP_ID_REQUERIDO`
- `ESTRUCTURA_SISTEMAS_TEMP_ID_DUPLICADO`
- `ESTRUCTURA_SISTEMAS_PARENT_TEMP_NO_EXISTE`
- `ESTRUCTURA_SISTEMAS_PARENT_SELF`
- `ESTRUCTURA_SISTEMAS_CICLO_TEMPORAL`
- `ESTRUCTURA_SISTEMAS_RAIZ_INVALIDA`
- `ESTRUCTURA_SISTEMAS_HIJO_INVALIDO`
- `ESTRUCTURA_SISTEMAS_PARENT_AMBIGUO`
- `ESTRUCTURA_SISTEMAS_ID_ACTUALIZADO_DUPLICADO`
- `ESTRUCTURA_SISTEMAS_ID_ELIMINADO_DUPLICADO`
- `ESTRUCTURA_SISTEMAS_ID_EN_ACTUALIZADOS_Y_ELIMINADOS`
- `SISTEMA_NO_DISPONIBLE_PARA_ASIGNAR`
- `SUBSISTEMA_NO_DISPONIBLE_PARA_ASIGNAR`
- `ACEITE_NO_DISPONIBLE_PARA_ASIGNAR`
- `ESTRUCTURA_SISTEMA_NO_EXISTE_EN_EQUIPO`
- `ESTRUCTURA_SISTEMAS_PARENT_NO_EXISTE_EN_EQUIPO`
- `ESTRUCTURA_SISTEMA_A_ELIMINAR_NO_EXISTE_EN_EQUIPO`
- `ACEITES_LEGACY_NO_SOPORTADOS`

---

# 28. Diferencias que debe aplicar el store de la app

## Estado anterior

```json
{
  "aceites": [
    {
      "equipo_aceite_id": 50,
      "sistema": {
        "id": 3
      },
      "aceite": {
        "id": 2
      }
    }
  ]
}
```

## Estado nuevo recomendado

```json
{
  "estructuraSistemas": [
    {
      "id": 300,
      "temp_id": null,
      "parent_id": null,
      "parent_temp_id": null,
      "sistema_id": 1,
      "subsistema_id": null,
      "aceite_id": null,
      "estado_local": "existente"
    },
    {
      "id": 301,
      "temp_id": null,
      "parent_id": 300,
      "parent_temp_id": null,
      "sistema_id": null,
      "subsistema_id": 5,
      "aceite_id": 2,
      "estado_local": "existente"
    }
  ]
}
```

`estado_local` es una sugerencia del frontend, no forma parte del payload del backend.

---

# 29. Transformación recomendada antes de guardar

El frontend puede mantener internamente nodos y luego convertirlos a:

```json
{
  "estructura_sistemas": {
    "nuevos": [
      {
        "temp_id": "tmp-1",
        "parent_temp_id": null,
        "sistema_id": 1,
        "subsistema_id": null,
        "aceite_id": null
      }
    ],
    "actualizados": [
      {
        "id": 301,
        "aceite_id": 6
      }
    ],
    "eliminados": [
      {
        "id": 305
      }
    ]
  }
}
```

No es necesario reenviar todos los nodos existentes.

Solo deben enviarse los cambios.

---

# 30. Mapa de flujo recomendado para la app

## Abrir formulario de creación

1. Consumir `rpc_obtener_auxiliares_edicion_equipo()`.
2. Construir nodos locales.
3. Enviar `rpc_crear_equipo_completo()` con `estructura_sistemas.nuevos`.

## Abrir formulario de edición

1. Consumir `rpc_obtener_auxiliares_edicion_equipo()`.
2. Consumir `rpc_obtener_equipo_para_edicion(p_codigo)`.
3. Guardar la lista plana original.
4. Editar localmente.
5. Calcular `nuevos`, `actualizados` y `eliminados`.
6. Enviar `rpc_actualizar_equipo_completo()`.

## Administrar catálogos

1. Consumir `rpc_catalogo_sistemas_listar()`.
2. Consumir `rpc_catalogo_subsistemas_listar()`.
3. Guardar cambios con sus RPC `guardar`.
4. Preferir `activo=false` a eliminar registros.

---

# 31. Checklist mínimo antes de cambiar la app a producción

- eliminar referencias a `sistema_aceite`;
- eliminar referencias a `sistema_aceite_id`;
- eliminar referencias a `equipo_aceite_v2`;
- no asumir que `equipo_aceite` contiene `equipo_id`;
- eliminar el bloque top-level `aceites`;
- usar `estructura_sistemas`;
- agregar soporte de `temp_id`;
- agregar soporte de `parent_id`;
- construir árbol desde lista plana;
- permitir aceite nulo;
- permitir aceite en raíz o hijo;
- manejar N niveles;
- mostrar asignaciones inactivas existentes;
- usar solo catálogos activos para nuevas selecciones;
- advertir al eliminar un nodo con hijos;
- utilizar `estructura_temp_ids` después de crear;
- interpretar `aceite_id: null` como quitar aceite;
- manejar errores de validación de estructura;
- no volver a poblar `sistema_aceite`;
- no reconstruir las 108 asignaciones legacy automáticamente.
