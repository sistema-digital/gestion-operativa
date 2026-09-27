# Sistema legacy de sistemas y aceites

## Propósito de este documento

Este documento explica cómo funcionaba el modelo anterior de sistemas y aceites en Engrase, qué objetos utilizaba, qué limitaciones tenía y qué cambió después de la migración.

Está pensado como contexto para actualizar la aplicación frontend sin confundir el significado anterior de `equipo_aceite` con el significado actual.

---

# 1. Qué era el modelo legacy

El modelo anterior trataba el sistema de aceite y la asignación de aceite como una relación prácticamente plana.

Los objetos principales eran:

- `engrase.aceite`
- `engrase.sistema_aceite`
- `engrase.equipo_aceite`

## `engrase.aceite`

Era y sigue siendo el catálogo de aceites.

Este catálogo **no fue reemplazado**.

Se conservaron los 9 registros existentes y sus IDs.

Ejemplos de aceites que ya existían:

- 15W40
- 80W90
- 85W140
- 8T9577
- AW100
- AW68 SIN CINC
- DONAX-TG =ATF
- ISO VG46
- TRACTOR FLUID =TD

La migración cambió la forma de asociar estos aceites a los equipos, pero no cambió el catálogo `aceite`.

---

# 2. `sistema_aceite`

El catálogo legacy `engrase.sistema_aceite` representaba directamente conceptos como MOTOR, HIDRAULICO y otros sistemas.

Antes del corte definitivo contenía 10 registros.

Su problema principal era que un único catálogo intentaba representar toda la ubicación funcional del aceite.

No existía separación entre:

- sistema raíz;
- subsistema;
- niveles posteriores.

Por ejemplo, el modelo no podía representar de manera natural una jerarquía como:

- HIDRAULICO
  - DIRECCION
    - BOMBA
      - REDUCTOR

El concepto `sistema_aceite` quedó eliminado completamente.

Actualmente **no existe** `engrase.sistema_aceite`.

---

# 3. `equipo_aceite` legacy

La tabla antigua relacionaba directamente:

- un equipo;
- un sistema de aceite;
- un aceite.

Su concepto era equivalente a este objeto:

```json
{
  "equipo_id": 50,
  "sistema_aceite_id": 3,
  "aceite_id": 2
}
```

La asociación dependía directamente del equipo y del sistema legacy.

No existía un nodo intermedio de estructura.

Antes del corte existían 108 asignaciones en esta tabla.

Esas 108 asignaciones fueron descartadas deliberadamente y no fueron migradas al modelo nuevo.

---

# 4. Restricción del modelo anterior

El modelo legacy tenía una restricción conceptual equivalente a:

```json
{
  "equipo": "484091",
  "sistema": "HIDRAULICO",
  "aceite": "AW100"
}
```

El sistema era directamente la ubicación del aceite.

Eso impedía representar correctamente casos como:

```json
{
  "equipo": "484091",
  "estructura": {
    "sistema": "HIDRAULICO",
    "subsistema": "DIRECCION",
    "aceite": "AW100"
  }
}
```

y todavía menos una estructura de varios niveles.

---

# 5. Cómo veía esto la aplicación anterior

La aplicación podía pensar el aceite como una lista plana de relaciones.

Conceptualmente:

```json
{
  "aceites": [
    {
      "sistema": {
        "id": 3,
        "nombre": "HIDRAULICO"
      },
      "aceite": {
        "id": 2,
        "nombre": "AW100"
      }
    }
  ]
}
```

El sistema y el aceite estaban fuertemente acoplados.

No existía:

- `parent_id`;
- `sistema` versus `subsistema`;
- árbol;
- profundidad N;
- aceite opcional por nodo.

---

# 6. Qué se eliminó

Después de la migración final ya no existen:

- `engrase.sistema_aceite`;
- la tabla legacy original de `engrase.equipo_aceite`;
- `engrase.equipo_aceite_v2`;
- `fn_resolver_sistema_aceite`;
- helpers temporales conectados exclusivamente al diseño antiguo.

También fueron eliminados los 10 sistemas legacy y las 108 asignaciones antiguas.

No deben recrearse ni utilizarse desde la aplicación.

---

# 7. Qué significa `equipo_aceite` ahora

Este punto es crítico para actualizar el frontend.

El nombre `engrase.equipo_aceite` sigue existiendo, pero **ya no representa lo mismo**.

Antes:

```json
{
  "id": 100,
  "equipo_id": 50,
  "sistema_aceite_id": 3,
  "aceite_id": 2
}
```

Ahora:

```json
{
  "id": 100,
  "estructura_sistema_id": 250,
  "aceite_id": 2
}
```

Ya no contiene:

- `equipo_id`;
- `sistema_aceite_id`.

El equipo se obtiene a través del nodo de estructura.

La relación actual es:

- equipo;
- nodo de estructura;
- aceite.

---

# 8. Diferencia conceptual principal

## Antes

```json
{
  "equipo": "484091",
  "sistema_aceite": "HIDRAULICO",
  "aceite": "AW100"
}
```

## Ahora

```json
{
  "equipo": "484091",
  "nodo": {
    "id": 250,
    "parent_id": 249,
    "sistema": null,
    "subsistema": {
      "id": 5,
      "nombre": "DIRECCION"
    },
    "aceite": {
      "id": 2,
      "nombre": "AW100"
    }
  }
}
```

El aceite es ahora una propiedad opcional de una ubicación de la estructura del equipo.

---

# 9. Por qué no se migraron los 108 registros antiguos

La decisión fue no inferir una jerarquía nueva a partir de datos que originalmente no tenían esa jerarquía.

Los registros legacy solo indicaban:

- equipo;
- sistema legacy;
- aceite.

No indicaban de forma confiable:

- qué valores eran sistemas raíz;
- cuáles debían convertirse en subsistemas;
- cuál debía ser el padre;
- cuántos niveles debía tener la estructura.

Migrarlos automáticamente habría creado una estructura supuesta.

Por eso se decidió:

- conservar el catálogo real de aceites;
- descartar sistemas legacy;
- descartar asignaciones legacy;
- empezar los nuevos catálogos `sistema` y `subsistema` vacíos;
- registrar la estructura nueva explícitamente.

---

# 10. Impacto directo para el frontend

La aplicación nueva no debe enviar ni esperar el bloque legacy:

```json
{
  "aceites": {
    "nuevos": [],
    "actualizados": [],
    "eliminados": []
  }
}
```

La estructura nueva utiliza:

```json
{
  "estructura_sistemas": {
    "nuevos": [],
    "actualizados": [],
    "eliminados": []
  }
}
```

Los aceites se incluyen dentro de cada nodo mediante `aceite_id`.

---

# 11. Qué debe eliminarse del código de la app

Debe eliminarse cualquier lógica basada en:

- `sistema_aceite_id`;
- lista `sistemas_aceite`;
- `equipo_id` dentro de una relación de aceite;
- actualización independiente de `aceites.nuevos`;
- actualización independiente de `aceites.actualizados`;
- actualización independiente de `aceites.eliminados`;
- selección de un sistema de aceite como si fuera una única ubicación plana.

---

# 12. Qué debe sustituir esa lógica

La app debe trabajar con:

- catálogo de `sistemas`;
- catálogo de `subsistemas`;
- lista plana de nodos con `id` y `parent_id`;
- `sistema` solamente en nodos raíz;
- `subsistema` solamente en nodos hijos;
- `aceite` opcional en cualquier nodo;
- `estructura_sistemas.nuevos`;
- `estructura_sistemas.actualizados`;
- `estructura_sistemas.eliminados`.

---

# 13. Estado final esperado

```json
{
  "catalogos": {
    "aceite": {
      "estado": "conservado",
      "registros": 9
    },
    "sistema": {
      "estado": "nuevo"
    },
    "subsistema": {
      "estado": "nuevo"
    }
  },
  "estructura": {
    "equipo_estructura_sistema": "vigente",
    "equipo_aceite": "vigente"
  },
  "legacy": {
    "sistema_aceite": "eliminado",
    "equipo_aceite_antiguo": "eliminado",
    "equipo_aceite_v2": "eliminado",
    "asignaciones_legacy": 0
  }
}
```

---

# 14. Regla para mantenimiento futuro

Si en el código aparece el nombre `equipo_aceite`, debe asumirse exclusivamente la estructura actual:

```json
{
  "estructura_sistema_id": 250,
  "aceite_id": 2
}
```

Nunca debe asumirse nuevamente la estructura antigua:

```json
{
  "equipo_id": 50,
  "sistema_aceite_id": 3,
  "aceite_id": 2
}
```
