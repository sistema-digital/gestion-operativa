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

export function toDateInputValue(value: Date | string | null | undefined): string {
  if (!value) return "";
  
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function parseDateParts(dateString: string) {
  if (!dateString) return [];
  const parts = dateString.split("T")[0].split("-");
  return parts;
}
