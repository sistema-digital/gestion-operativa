export const getSolicitudPermissions = (userArea: string, estadoId?: number) => {
  const isAlmacen = userArea === 'ALMACEN' || userArea === 'ALL';
  const isGerencia = userArea === 'GERENCIA' || userArea === 'ALL';
  const isCOMPRAS = userArea === 'COMPRAS' || userArea === 'ALL'; // Supongamos
  
  // Base solicitante o all
  const canEditGeneral = true; // Por ahora, permitimos crear. Si es editar, restringir
  
  return {
    solicitante: {
      canEditGeneral: true,
      canEditEquipos: true,
      canEditItems: true,
      canEditCantidad: true,
      canEditCantidadInventario: false,
      canEditCantidadGerencia: false,
      canEditEstado: false
    },
    almacen: {
      canEditGeneral: false,
      canEditEquipos: false,
      canEditItems: false,
      canEditCantidad: false,
      canEditCantidadInventario: true,
      canEditCantidadGerencia: false,
      canEditEstado: true
    },
    gerencia: {
      canEditGeneral: false,
      canEditEquipos: false,
      canEditItems: false,
      canEditCantidad: false,
      canEditCantidadInventario: false,
      canEditCantidadGerencia: true,
      canEditEstado: true
    },
    compras: {
      canEditGeneral: false,
      canEditEquipos: false,
      canEditItems: false,
      canEditCantidad: false,
      canEditCantidadInventario: false,
      canEditCantidadGerencia: false,
      canEditCantidadSubidaSistema: true,
      canEditFolio: true,
      canEditEstado: true
    }
  };
};
