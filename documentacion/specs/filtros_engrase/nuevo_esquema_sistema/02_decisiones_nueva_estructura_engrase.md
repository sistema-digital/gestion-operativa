# Decisiones tomadas para la nueva estructura de sistemas, subsistemas y aceites

## Propósito

Este documento reúne las decisiones de diseño tomadas durante la migración.

Debe utilizarse como referencia funcional para mantener el backend y actualizar el frontend sin volver a introducir supuestos del modelo legacy.

---

# 1. El catálogo `aceite` se conserva

Se decidió conservar `engrase.aceite` exactamente como catálogo principal de aceites.

Se mantuvieron los 9 registros existentes.

No se recreó el catálogo ni se cambiaron sus IDs.

La migración modifica únicamente cómo un equipo se relaciona con un aceite.

---

# 2. Los sistemas legacy no se migran

Los 10 registros de `sistema_aceite` fueron descartados.

No se utilizaron para poblar automáticamente el nuevo catálogo `sistema`.

Razón:

el modelo anterior no diferenciaba de manera confiable entre sistema, subsistema y profundidad jerárquica.

---

# 3. Las 108 asignaciones legacy no se migran

Las 108 relaciones antiguas equipo/sistema/aceite fueron eliminadas durante el corte definitivo.

No se intentó inferir padres ni subsistemas a partir de ellas.

La nueva estructura empieza vacía.

---

# 4. `sistema` y `subsistema` son catálogos independientes

Se crearon dos catálogos separados:

- `engrase.sistema`;
- `engrase.subsistema`.

Un nombre puede existir conceptualmente en ambos catálogos sin que uno sustituya al otro.

No se creó un único catálogo genérico mezclando ambos tipos.

---

# 5. `activo` solo controla nuevas selecciones

Los catálogos `sistema` y `subsistema` tienen `activo`.

Su significado es:

- `true`: disponible para nuevas asignaciones;
- `false`: no disponible para nuevas asignaciones.

No significa que deba eliminarse de equipos existentes.

Si un equipo ya utiliza un sistema, subsistema o aceite que posteriormente queda inactivo, la lectura del equipo debe seguir mostrándolo.

---

# 6. La estructura del equipo no tiene `activo`

`equipo_estructura_sistema` no tiene columna `activo`.

Si el nodo existe, forma parte de la estructura actual del equipo.

Para quitarlo se elimina el nodo.

No existe un estado intermedio de nodo desactivado.

---

# 7. La estructura del equipo no tiene `orden`

No se agregó una columna `orden`.

El orden visual debe derivarse del árbol y de las necesidades del frontend.

La identidad estructural depende de:

- `id`;
- `parent_id`;
- tipo de nodo.

---

# 8. Un nodo raíz siempre representa un sistema

Un nodo raíz cumple conceptualmente:

```json
{
  "parent_id": null,
  "sistema_id": 1,
  "subsistema_id": null
}
```

Un subsistema no puede ser raíz.

---

# 9. Todo nodo hijo representa un subsistema

Un nodo hijo cumple conceptualmente:

```json
{
  "parent_id": 100,
  "sistema_id": null,
  "subsistema_id": 5
}
```

Un sistema no puede ser hijo.

---

# 10. Se permiten N niveles

Después del sistema raíz, todos los niveles son subsistemas.

No existen catálogos separados para subsubsistema o niveles posteriores.

Ejemplo conceptual:

```json
{
  "nodos": [
    {
      "id": 100,
      "parent_id": null,
      "sistema": "HIDRAULICO"
    },
    {
      "id": 101,
      "parent_id": 100,
      "subsistema": "DIRECCION"
    },
    {
      "id": 102,
      "parent_id": 101,
      "subsistema": "BOMBA"
    },
    {
      "id": 103,
      "parent_id": 102,
      "subsistema": "REDUCTOR"
    }
  ]
}
```

---

# 11. El padre debe pertenecer al mismo equipo

Un nodo de un equipo no puede usar como padre un nodo de otro equipo.

La base de datos lo valida.

Esto evita árboles cruzados entre equipos.

---

# 12. Un nodo no puede ser su propio padre

La base de datos impide:

```json
{
  "id": 100,
  "parent_id": 100
}
```

---

# 13. Los ciclos están prohibidos

La estructura debe ser un árbol válido.

No puede existir una relación equivalente a:

```json
{
  "relaciones": [
    {
      "id": 100,
      "parent_id": 102
    },
    {
      "id": 101,
      "parent_id": 100
    },
    {
      "id": 102,
      "parent_id": 101
    }
  ]
}
```

La validación existe tanto para referencias temporales como para movimientos de nodos existentes.

---

# 14. El aceite es opcional por nodo

Un nodo puede existir sin aceite.

Ejemplo válido:

```json
{
  "id": 100,
  "sistema": "HIDRAULICO",
  "aceite": null
}
```

También un subsistema puede existir sin aceite.

---

# 15. Cualquier nivel puede tener aceite

Puede tener aceite:

- el sistema raíz;
- un subsistema de primer nivel;
- un subsistema profundo.

Ejemplo válido:

```json
{
  "ruta": "HIDRAULICO > DIRECCION > BOMBA > REDUCTOR",
  "aceite": "85W140"
}
```

---

# 16. Una ubicación admite un solo aceite

La relación final utiliza un único `aceite_id` por `estructura_sistema_id`.

Conceptualmente:

```json
{
  "estructura_sistema_id": 103,
  "aceite_id": 6
}
```

No se permite tener dos relaciones de aceite simultáneas sobre el mismo nodo.

---

# 17. Un mismo aceite puede reutilizarse

La restricción es por ubicación, no por aceite.

El mismo `aceite_id` puede aparecer en múltiples:

- sistemas;
- subsistemas;
- equipos.

---

# 18. El aceite no define la estructura

La estructura existe independientemente del aceite.

Primero existe el nodo.

Después, opcionalmente, se relaciona un aceite.

Esto permite extender la estructura en el futuro con otros atributos sin convertir el aceite en el centro del modelo.

---

# 19. No se utilizó un modelo EAV para propiedades conocidas

La estructura se diseñó para permitir futuras relaciones o atributos.

Sin embargo, para propiedades conocidas y estables se prefieren campos o relaciones tipadas.

No se decidió convertir el sistema en una estructura genérica de clave/valor.

---

# 20. El frontend recibe una lista plana con `parent_id`

Para edición no se devuelve un JSON recursivo.

Se devuelve una lista plana.

Ejemplo:

```json
{
  "estructura_sistemas": [
    {
      "id": 100,
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
      "id": 101,
      "parent_id": 100,
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

Razón:

es más fácil para Vue crear, editar, mover, comparar y eliminar nodos.

---

# 21. Los nodos nuevos utilizan `temp_id`

Durante una creación o edición puede ser necesario crear padre e hijo dentro de la misma llamada.

Como el padre todavía no tiene ID real, el frontend usa `temp_id`.

Ejemplo:

```json
{
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
    }
  ]
}
```

La respuesta devuelve un mapa de IDs reales.

```json
{
  "estructura_temp_ids": {
    "n1": 100,
    "n2": 101
  }
}
```

---

# 22. El payload legacy `aceites` deja de ser válido

La actualización no debe enviar:

```json
{
  "aceites": {
    "nuevos": [],
    "actualizados": [],
    "eliminados": []
  }
}
```

Ahora el aceite se modifica dentro de `estructura_sistemas`.

---

# 23. En creación debe enviarse `estructura_sistemas`

La creación completa debe entrar por el flujo nuevo.

Incluso si el equipo inicialmente no tendrá sistemas, la app debe enviar:

```json
{
  "estructura_sistemas": {
    "nuevos": []
  }
}
```

Esto evita que la RPC intente entrar en el flujo antiguo que ya fue retirado.

---

# 24. En actualización `estructura_sistemas` puede estar vacío

Una actualización que no cambie estructura puede enviar:

```json
{
  "estructura_sistemas": {
    "nuevos": [],
    "actualizados": [],
    "eliminados": []
  }
}
```

También puede omitirse cuando solo cambian otras partes del equipo, porque el helper actual normaliza la ausencia a listas vacías.

No debe enviarse el bloque legacy `aceites`.

---

# 25. `aceite_id: null` significa quitar el aceite, no eliminar el nodo

Para retirar solamente el aceite:

```json
{
  "actualizados": [
    {
      "id": 101,
      "aceite_id": null
    }
  ]
}
```

El nodo permanece.

---

# 26. Eliminar un nodo elimina su subárbol

La estructura utiliza cascada.

Si se elimina un nodo padre:

- se eliminan sus descendientes;
- se eliminan las relaciones de aceite de esos nodos.

La aplicación debe mostrar una confirmación apropiada cuando un nodo tenga hijos.

---

# 27. No se filtran valores inactivos al leer un equipo existente

La RPC de lectura del equipo devuelve el sistema, subsistema y aceite asignado aunque estén inactivos.

Esto permite editar equipos existentes sin perder contexto histórico/operativo.

---

# 28. Los auxiliares de selección solo muestran activos

Para agregar nuevas relaciones, `rpc_obtener_auxiliares_edicion_equipo` devuelve únicamente:

- sistemas activos;
- subsistemas activos;
- aceites activos.

---

# 29. Los auxiliares administrativos incluyen activos e inactivos

`rpc_catalogo_auxiliares` no está limitado a activos.

Sirve como contexto de administración de catálogos.

---

# 30. Los catálogos no se eliminan desde la operación normal

Para `sistema` y `subsistema`, la acción normal es activar o desactivar.

La política de acceso permite lectura, creación y actualización para usuarios autenticados, pero no eliminación directa desde el flujo normal.

---

# 31. Las relaciones del equipo sí tienen CRUD

`equipo_estructura_sistema` y `equipo_aceite` permiten crear, leer, actualizar y eliminar.

La eliminación estructural está controlada por integridad y cascadas.

---

# 32. Las estadísticas de aceite se atribuyen al sistema raíz

Si un aceite está asignado en:

```json
{
  "ruta": "HIDRAULICO > DIRECCION > BOMBA",
  "aceite": "AW100"
}
```

para las estadísticas de `fn_catalogo_aceite_item` cuenta dentro del sistema raíz `HIDRAULICO`.

No cuenta como un sistema llamado `BOMBA`.

---

# 33. `rpc_obtener_aceites_equipo` devuelve la ruta completa

La lectura resumida de aceites construye una ruta legible.

Ejemplo:

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

`subsistema` corresponde al nodo actual donde está el aceite.

`ruta` contiene el contexto completo.

---

# 34. Se separó la actualización base de la actualización de estructura

La lógica de equipo, etapas y filtros quedó en `fn_actualizar_equipo_base`.

La lógica de estructura y aceite quedó en `fn_actualizar_equipo_relaciones_base` junto con `fn_aplicar_estructura_sistemas`.

Esto elimina la dependencia de helpers legacy.

---

# 35. Se mantuvieron nombres de RPC cuando seguían teniendo sentido

Se conservaron nombres como:

- `rpc_catalogo_sistemas_listar`;
- `rpc_catalogo_sistema_guardar`;
- `rpc_crear_equipo_completo`;
- `rpc_actualizar_equipo_completo`;
- `rpc_obtener_equipo_para_edicion`;
- `rpc_obtener_aceites_equipo`.

El contrato interno cambió donde era necesario, pero no se renombró una RPC solamente por la migración.

---

# 36. Se añadieron RPC específicas de subsistema

Se añadieron:

- `rpc_catalogo_subsistemas_listar`;
- `rpc_catalogo_subsistema_guardar`.

Los subsistemas son ahora un catálogo de primera clase.

---

# 37. El nombre `equipo_aceite` fue reutilizado para el modelo final

Durante la transición existió `equipo_aceite_v2`.

Después del corte:

- la tabla antigua fue eliminada;
- la V2 se convirtió en la nueva `equipo_aceite`;
- la compatibilidad temporal `equipo_aceite_v2` también fue eliminada.

No debe existir código nuevo que haga referencia a `equipo_aceite_v2`.

---

# 38. Estado final de la arquitectura

```json
{
  "equipo": {
    "estructura": {
      "tabla": "equipo_estructura_sistema",
      "raices": "sistema",
      "hijos": "subsistema",
      "niveles": "N"
    },
    "aceites": {
      "tabla": "equipo_aceite",
      "relacion": "nodo_a_aceite",
      "aceite_opcional": true,
      "un_aceite_por_nodo": true
    }
  }
}
```

---

# 39. Regla principal para el frontend

La unidad que la interfaz debe crear, editar y eliminar ya no es una relación sistema/aceite.

La unidad principal es el **nodo de estructura**.

El aceite es solamente uno de los atributos opcionales de ese nodo.
