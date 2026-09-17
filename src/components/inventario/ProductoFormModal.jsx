import { useState } from "react";
import { toast } from "react-toastify";
import { crearProducto, editarProducto, subirImagenProducto } from "../../api/productos.api";
import "./ProductoFormModal.css";

const MONEDAS = ["USD", "COP", "VES"];

export default function ProductoFormModal({ producto, categorias, categoriaSugerida, onGuardado, onCerrar }) {
  const esEdicion = !!producto;

  const [form, setForm] = useState({
    codigo: producto?.codigo || "",
    nombre: producto?.nombre || "",
    descripcion: producto?.descripcion || "",
    categoria: producto?.categoria || categoriaSugerida || "",
    moneda_base: producto?.moneda_base || "USD",
    precio_compra: producto?.precio_compra || "",
    modoGanancia: "porcentaje",
    porcentaje_ganancia: producto?.porcentaje_ganancia || "",
    precio_venta: producto?.precio_venta || "",
    stock: producto?.stock ?? 0,
    precio_manual_usd: producto?.precio_manual_usd || "",
    precio_manual_cop: producto?.precio_manual_cop || "",
    precio_manual_ves: producto?.precio_manual_ves || "",
  });
  const [imagenArchivo, setImagenArchivo] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(producto?.imagen_url || null);
  const [guardando, setGuardando] = useState(false);

  const actualizar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

  const manejarImagen = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    setImagenArchivo(archivo);
    setImagenPreview(URL.createObjectURL(archivo));
  };

  const ventaPreview =
    form.modoGanancia === "porcentaje" && form.precio_compra && form.porcentaje_ganancia
      ? (
          Number(form.precio_compra) +
          Number(form.precio_compra) * (Number(form.porcentaje_ganancia) / 100)
        ).toFixed(2)
      : null;

  const manejarSubmit = async (e) => {
    e.preventDefault();

    if (!form.nombre || !form.precio_compra || !form.moneda_base) {
      toast.error("Nombre, precio de compra y moneda base son obligatorios");
      return;
    }
    if (form.modoGanancia === "porcentaje" && !form.porcentaje_ganancia) {
      toast.error("Indicá el porcentaje de ganancia, o cambiá a modo manual");
      return;
    }
    if (form.modoGanancia === "manual" && !form.precio_venta) {
      toast.error("Indicá el precio de venta manual");
      return;
    }

    setGuardando(true);
    try {
      let imagen_url = producto?.imagen_url || null;

      if (imagenArchivo) {
        const formData = new FormData();
        formData.append("imagen", imagenArchivo);
        const respuesta = await subirImagenProducto(formData);
        imagen_url = respuesta.imagen_url;
      }

      const payload = {
        codigo: form.codigo || undefined,
        nombre: form.nombre,
        descripcion: form.descripcion,
        categoria: form.categoria,
        moneda_base: form.moneda_base,
        precio_compra: Number(form.precio_compra),
        precio_venta: form.modoGanancia === "manual" ? Number(form.precio_venta) : undefined,
        porcentaje_ganancia:
          form.modoGanancia === "porcentaje" ? Number(form.porcentaje_ganancia) : undefined,
        stock: Number(form.stock),
        imagen_url,
        precio_manual_usd: form.precio_manual_usd || null,
        precio_manual_cop: form.precio_manual_cop || null,
        precio_manual_ves: form.precio_manual_ves || null,
      };

      if (esEdicion) {
        await editarProducto(producto.id, payload);
        toast.success("Producto actualizado");
      } else {
        await crearProducto(payload);
        toast.success("Producto creado");
      }

      onGuardado();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al guardar el producto");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-jairo modal-grande" onClick={(e) => e.stopPropagation()}>
        <h3>{esEdicion ? "Editar producto" : "Nuevo producto"}</h3>

        <form onSubmit={manejarSubmit} className="form-producto">
          <div className="form-fila">
            <div className="form-campo">
              <label>Imagen</label>
              <label className="uploader-imagen">
                {imagenPreview ? <img src={imagenPreview} alt="preview" /> : <span>Sin imagen</span>}
                <input type="file" accept="image/*" onChange={manejarImagen} hidden />
              </label>
            </div>

            <div className="form-campo form-campo-flex">
              <label>Nombre *</label>
              <input value={form.nombre} onChange={(e) => actualizar("nombre", e.target.value)} required />

              <label>Código (opcional, se autogenera)</label>
              <input value={form.codigo} onChange={(e) => actualizar("codigo", e.target.value)} />
            </div>
          </div>

          <div className="form-campo">
            <label>Descripción</label>
            <textarea
              rows={2}
              value={form.descripcion}
              onChange={(e) => actualizar("descripcion", e.target.value)}
            />
          </div>

          <div className="form-fila">
            <div className="form-campo">
              <label>Categoría</label>
              <input
                list="lista-categorias"
                value={form.categoria}
                onChange={(e) => actualizar("categoria", e.target.value)}
                placeholder="Ej: Frenos, Suspensión, Motor..."
              />
              <datalist id="lista-categorias">
                {categorias.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div className="form-campo">
              <label>Moneda base *</label>
              <select value={form.moneda_base} onChange={(e) => actualizar("moneda_base", e.target.value)}>
                {MONEDAS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-campo">
              <label>Stock inicial</label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => actualizar("stock", e.target.value)}
              />
            </div>
          </div>

          <div className="form-fila">
            <div className="form-campo">
              <label>Precio de compra ({form.moneda_base}) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.precio_compra}
                onChange={(e) => actualizar("precio_compra", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="selector-modo-ganancia">
            <button
              type="button"
              className={form.modoGanancia === "porcentaje" ? "activo" : ""}
              onClick={() => actualizar("modoGanancia", "porcentaje")}
            >
              % Ganancia automático
            </button>
            <button
              type="button"
              className={form.modoGanancia === "manual" ? "activo" : ""}
              onClick={() => actualizar("modoGanancia", "manual")}
            >
              Precio de venta manual
            </button>
          </div>

          {form.modoGanancia === "porcentaje" ? (
            <div className="form-fila">
              <div className="form-campo">
                <label>Porcentaje de ganancia (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.porcentaje_ganancia}
                  onChange={(e) => actualizar("porcentaje_ganancia", e.target.value)}
                />
              </div>
              {ventaPreview && (
                <div className="form-campo preview-venta">
                  <label>Precio de venta estimado</label>
                  <span>
                    {ventaPreview} {form.moneda_base}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="form-fila">
              <div className="form-campo">
                <label>Precio de venta ({form.moneda_base})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precio_venta}
                  onChange={(e) => actualizar("precio_venta", e.target.value)}
                />
              </div>
            </div>
          )}

          <details className="precios-manuales-detalle">
            <summary>Precios fijos manuales en otras monedas (opcional)</summary>
            <div className="form-fila">
              <div className="form-campo">
                <label>Precio fijo USD</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.precio_manual_usd}
                  onChange={(e) => actualizar("precio_manual_usd", e.target.value)}
                />
              </div>
              <div className="form-campo">
                <label>Precio fijo COP</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.precio_manual_cop}
                  onChange={(e) => actualizar("precio_manual_cop", e.target.value)}
                />
              </div>
              <div className="form-campo">
                <label>Precio fijo VES</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.precio_manual_ves}
                  onChange={(e) => actualizar("precio_manual_ves", e.target.value)}
                />
              </div>
            </div>
          </details>

          <div className="modal-acciones">
            <button type="button" className="btn-secundario" onClick={onCerrar}>
              Cancelar
            </button>
            <button type="submit" className="btn-primario" disabled={guardando}>
              {guardando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}