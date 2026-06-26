export function formatDateDisplay(dateString: string | null | undefined): string {
  if (!dateString) return "Sin fecha";

  let year, month, day;

  // Si tiene el formato YYYY-MM-DD
  if (dateString.includes("-") && dateString.length >= 10) {
    const parts = dateString.split("-");
    year = parts[0];
    month = parts[1];
    // Manejar el caso de que la fecha tenga tiempo (ej. 2026-05-05T10:30:00)
    day = parts[2].substring(0, 2);
  } else {
    // Si es un string Date parseable aunque no sea YYYY-MM-DD (por seguridad)
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      year = date.getFullYear().toString();
      month = (date.getMonth() + 1).toString().padStart(2, "0");
      day = date.getDate().toString().padStart(2, "0");
    } else {
      return "Fecha inválida";
    }
  }

  const months = [
    "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
    "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"
  ];

  const monthIndex = parseInt(month, 10) - 1;
  const monthName = months[monthIndex];

  return `${day} ${monthName} ${year}`;
}

export function formatPanamaDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "Sin fecha";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Fecha inválida";

  const parts = new Intl.DateTimeFormat("es-PA", {
    timeZone: "America/Panama",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);

  const getPart = (type: Intl.DateTimeFormatPartTypes) => {
    return parts.find((part) => part.type === type)?.value || "";
  };

  return `${getPart("day")} ${getPart("month").replace(".", "").toUpperCase()} ${getPart("year")} ${getPart("hour")}:${getPart("minute")} ${getPart("dayPeriod").toUpperCase()}`;
}

export function formatPanamaCaptureDateTime(value: Date | string | null | undefined): string {
  if (!value) return "Sin fecha";

  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return "Fecha invalida";

  const parts = new Intl.DateTimeFormat("es-PA", {
    timeZone: "America/Panama",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);

  const getPart = (type: Intl.DateTimeFormatPartTypes) => {
    return parts.find((part) => part.type === type)?.value || "";
  };

  const dayPeriod = getPart("dayPeriod")
    .replace(/\./g, "")
    .trim()
    .toUpperCase();

  const normalizedDayPeriod = dayPeriod === "PM" ? "P. M" : "A. M";

  return `${getPart("day")} ${getPart("month").replace(".", "").toUpperCase()} ${getPart("year")} ${getPart("hour")}:${getPart("minute")} ${normalizedDayPeriod}`;
}

export function toDateInputValue(value: Date | string | null | undefined): string {
  if (!value) return "";
  
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
}

export function parseDateParts(dateString: string) {
  if (!dateString) return [];
  const parts = dateString.split("T")[0].split("-");
  return parts;
}
