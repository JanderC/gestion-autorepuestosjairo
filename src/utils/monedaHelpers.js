export function convertirAUSD(monto, moneda, tasa) {
  const m = Number(monto);
  if (moneda === "USD") return m;
  if (moneda === "COP") return m / Number(tasa.usd_cop);
  if (moneda === "BS") {
    const usdBs = tasa.bs_cop_manual ? Number(tasa.usd_cop) / Number(tasa.bs_cop) : Number(tasa.usd_bs);
    return m / usdBs;
  }
  return m;
}

export function convertirDesdeUSD(montoUSD, moneda, tasa) {
  const m = Number(montoUSD);
  if (moneda === "USD") return m;
  if (moneda === "COP") return m * Number(tasa.usd_cop);
  if (moneda === "BS") {
    const usdBs = tasa.bs_cop_manual ? Number(tasa.usd_cop) / Number(tasa.bs_cop) : Number(tasa.usd_bs);
    return m * usdBs;
  }
  return m;
}

export function convertirEntreMonedas(monto, monedaOrigen, monedaDestino, tasa) {
  if (monedaOrigen === monedaDestino) return Number(monto);
  const usd = convertirAUSD(monto, monedaOrigen, tasa);
  return convertirDesdeUSD(usd, monedaDestino, tasa);
}

export function precioListaEnMoneda(producto, monedaDestino, tasa) {
  if (monedaDestino === producto.moneda_base) return Number(producto.precio_venta);

  const manual = producto[`precio_manual_${monedaDestino.toLowerCase()}`];
  if (manual != null) return Number(manual);

  if (monedaDestino === "BS" && producto.precio_manual_cop != null) {
    return convertirEntreMonedas(producto.precio_manual_cop, "COP", "BS", tasa);
  }
  if (monedaDestino === "COP" && producto.precio_manual_bs != null) {
    return convertirEntreMonedas(producto.precio_manual_bs, "BS", "COP", tasa);
  }
  return convertirEntreMonedas(producto.precio_venta, producto.moneda_base, monedaDestino, tasa);
}