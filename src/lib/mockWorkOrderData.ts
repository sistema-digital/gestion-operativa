export function generateMockWorkOrders(count = 100, date: string) {
  const areas = [
    'Equipo Pesado',
    'Engrase',
    'Cosecha Mecanizada',
    'Cosecha Agricola',
    'Servicios Generales',
    'Mecanica de Transporte'
  ];
  const estatusList = ['Programado', 'En Proceso', 'Concluida'];

  const data: any[] = [];

  for (let i = 0; i < count; i++) {
    const isSg = Math.random() > 0.8;
    const isOmSg = isSg && Math.random() > 0.5;
    const duracion = Math.floor(Math.random() * 8) + 1;
    const retraso = Math.random() > 0.8 ? Math.floor(Math.random() * 4) + 1 : 0;
    const randomArea = areas[Math.floor(Math.random() * areas.length)];
    const randomMechanicId = Math.floor(Math.random() * 50) + 1;

    // Get week string for date
    const d = new Date(date);
    const dateObj = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = dateObj.getUTCDay() || 7;
    dateObj.setUTCDate(dateObj.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(dateObj.getUTCFullYear(), 0, 1));
    const weekStr = String(Math.ceil((((dateObj.getTime() - yearStart.getTime()) / 86400000) + 1) / 7));

    const idOm = `OM-${Math.floor(Math.random() * 90000) + 10000}`;
    const idSg = isSg ? `SG-${Math.floor(Math.random() * 90000) + 10000}` : null;

    const row: any = {
      ID_OT: `OT-${Math.floor(Math.random() * 90000) + 10000}`,
      id_om: !isSg ? idOm : null,
      id_sg: idSg,
      Fecha: date,
      "Duración (horas)": duracion,
      Estatus: estatusList[Math.floor(Math.random() * estatusList.length)],
      "Retraso (horas)": retraso,
      Semana: weekStr,
      MECANICOS: {
        id: randomMechanicId,
        NOMBRE: `Mecánico Mock ${randomMechanicId}`,
        AREA: randomArea,
        "EQUIPO DE TRABAJO": `Equipo ${Math.floor(Math.random() * 3) + 1}`
      },
      ORDEN_MANTENIMIENTO: null,
      OM_SG: null
    };

    if (!isSg) {
      row.ORDEN_MANTENIMIENTO = {
        "Área": randomArea,
        "Descripcion": `Mantenimiento mock ${i + 1}`
      };
    } else {
      row.OM_SG = {
        id_sg: idSg,
        tipo_trabajo: Math.random() > 0.5 ? 'Mecanico' : 'Electrico',
        ORDEN_MANTENIMIENTO: {
          "Área": 'Servicios Generales',
          "Descripcion": `Mantenimiento SG mock ${i + 1}`
        }
      };
      if (isOmSg) {
          row.id_om = idOm; // Sometimes an SG relates to OM
      }
    }

    data.push(row);
  }

  return data;
}
