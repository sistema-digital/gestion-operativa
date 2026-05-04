export const ORDENES_TRABAJO_HORAS_COLORS = {
  "Concluida": {
    "text": "#2D8A4E",
    "background": "#A2D3B3",
    "cssClass": "est-success"
  },
  "Concluido": {
    "text": "#2D8A4E",
    "background": "#A2D3B3",
    "cssClass": "est-success"
  },
  "En Proceso": {
    "text": "#1A6B9A",
    "background": "#98C6E6",
    "cssClass": "est-info"
  },
  "Ausencia": {
    "text": "#C97B2F",
    "background": "#E8C18E",
    "cssClass": "est-warning"
  },
  "Retrasada": {
    "text": "#C0392B",
    "background": "#E69C95",
    "cssClass": "est-danger"
  },
  "Retrasado": {
    "text": "#C0392B",
    "background": "#E69C95",
    "cssClass": "est-danger"
  },
  "Cancelado": {
    "text": "#8F8A7F",
    "background": "#C2BAB0",
    "cssClass": "est-muted"
  }
};

export const getOrderStatusColor = (status: string) => {
  const normalizedStatus = Object.keys(ORDENES_TRABAJO_HORAS_COLORS).find(
    k => k.toLowerCase() === status.toLowerCase()
  );
  if (normalizedStatus) {
    return (ORDENES_TRABAJO_HORAS_COLORS as any)[normalizedStatus];
  }
  // Default fallback
  return {
    "text": "#64748B",
    "background": "#F1F5F9",
    "cssClass": "est-default"
  };
};
