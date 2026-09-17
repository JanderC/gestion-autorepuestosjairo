const ZONA_HORARIA = "America/Caracas";

export function formatearHora(fecha) {
  return new Date(fecha).toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ZONA_HORARIA,
  });
}

export function formatearFechaHora(fecha) {
  return new Date(fecha).toLocaleString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ZONA_HORARIA,
  });
}

export function formatearFechaCompleta(fecha) {
  return new Date(fecha).toLocaleString("es-VE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: ZONA_HORARIA,
  });
}