const SIMBOLOS = { USD: "$", COP: "$", VES: "Bs." };
const LOCALES = { USD: "en-US", COP: "es-CO", VES: "es-VE" };

export function formatearMoneda(valor, moneda) {
  const numero = Number(valor) || 0;
  const simbolo = SIMBOLOS[moneda] || "";
  const texto = numero.toLocaleString(LOCALES[moneda] || "es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${simbolo} ${texto} ${moneda}`;
}