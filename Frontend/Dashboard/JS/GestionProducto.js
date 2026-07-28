// ══════════════════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════════════════
// resolveApiBaseUrl(), authHeaders(), API_BASE_URL vienen de api-config.js

const API_PRODUCTOS   = `${API_BASE_URL}/productos`;
const API_CATEGORIAS  = `${API_BASE_URL}/categorias`;
const PAGE_SIZE       = 10;
 
const esc = v => String(v ?? "")
  .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
  .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
 
const fmt = v => new Intl.NumberFormat("es-PE",{style:"currency",currency:"PEN",minimumFractionDigits:2}).format(Number(v)||0);
 
const getCatName = p => p?.categoria?.nombre || "Sin categoría";
 
// ── Estado ─────────────────────────────────────────────
let allProducts  = [];
let categorias   = [];
let currentPage  = 1;
let deleteTarget = null;
 
// ── Referencias DOM ────────────────────────────────────
const tbodyEl       = document.getElementById("productsTableBody");
const statusEl      = document.getElementById("statusBar");
const searchEl      = document.getElementById("searchInput");
const filterCatEl   = document.getElementById("filterCategoria");
const paginationBar = document.getElementById("paginationBar");
const paginationInfo= document.getElementById("paginationInfo");
const paginationBtns= document.getElementById("paginationBtns");
 
const modalProd     = new bootstrap.Modal(document.getElementById("modalProducto"));
const modalDel      = new bootstrap.Modal(document.getElementById("modalEliminar"));
 
const modalIdEl     = document.getElementById("modalProductoId");
const modalNomEl    = document.getElementById("inputNombre");
const modalDescEl   = document.getElementById("inputDescripcion");
const modalCatEl    = document.getElementById("inputCategoria");
const modalPrecioEl = document.getElementById("inputPrecio");
const modalErrorEl  = document.getElementById("modalError");
const modalTitleEl  = document.getElementById("modalProductoLabel");
const btnGuardar    = document.getElementById("btnGuardarProducto");
 
// ══════════════════════════════════════════════════════
// CARGA CATEGORÍAS (para filtro y modal)
// ══════════════════════════════════════════════════════
async function cargarCategorias() {
  document.getElementById("loadingCatSpinner").style.display = "block";
  try {
    // Intentar endpoint dedicado; si no existe, extraer de productos cargados
    const res = await fetch(API_CATEGORIAS, { headers: authHeaders() });
    if (res.ok) {
      categorias = await res.json();
    } else {
      throw new Error("no endpoint");
    }
  } catch {
    // Fallback: construir desde los productos
    const nombres = [...new Set(allProducts.map(p => getCatName(p)))].filter(n => n !== "Sin categoría").sort();
    categorias = nombres.map((nombre, i) => ({ id: null, nombre }));
  }
  document.getElementById("loadingCatSpinner").style.display = "none";
  poblarSelectCategorias();
}
 
function poblarSelectCategorias() {
  // Filtro toolbar
  filterCatEl.innerHTML = '<option value="">Todas las categorías</option>';
  categorias.forEach(c => {
    filterCatEl.innerHTML += `<option value="${esc(c.nombre)}">${esc(c.nombre)}</option>`;
  });
 
  // Modal select
  modalCatEl.innerHTML = '<option value="" disabled selected>Selecciona una categoría…</option>';
  categorias.forEach(c => {
    const val = c.id ? c.id : c.nombre;
    const key = c.id ? "data-id" : "data-nombre";
    modalCatEl.innerHTML += `<option value="${esc(c.nombre)}" ${key}="${esc(String(val))}">${esc(c.nombre)}</option>`;
  });
}
 
// ══════════════════════════════════════════════════════
// CARGA PRODUCTOS
// ══════════════════════════════════════════════════════
function setStatus(msg, error = false) {
  statusEl.innerHTML = `<span style="color:${error?"#c0392b":"#6b7b8a"}">${msg}</span>`;
}
 
async function loadProducts() {
  tbodyEl.innerHTML = `<tr><td colspan="6" class="table-placeholder"><span class="spinner-inline"></span> Cargando productos…</td></tr>`;
  paginationBar.style.display = "none";
  try {
    const res = await fetch(API_PRODUCTOS, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    allProducts = await res.json();
    await cargarCategorias();
    currentPage = 1;
    renderTable();
    setStatus(`${allProducts.length} producto${allProducts.length !== 1 ? "s" : ""} cargados.`);
  } catch (err) {
    tbodyEl.innerHTML = `<tr><td colspan="6" class="table-placeholder" style="color:#c0392b">No se pudo conectar con el backend. Verifica que el servidor esté encendido.</td></tr>`;
    setStatus("Error al cargar productos.", true);
  }
}
 
// ══════════════════════════════════════════════════════
// RENDER TABLA + FILTROS + PAGINACIÓN
// ══════════════════════════════════════════════════════
function filteredProducts() {
  const q    = searchEl.value.toLowerCase().trim();
  const cat  = filterCatEl.value;
 
  return allProducts.filter(p => {
    const matchQ    = !q || p.nombre?.toLowerCase().includes(q) || getCatName(p).toLowerCase().includes(q);
    const matchCat  = !cat  || getCatName(p) === cat;
    return matchQ && matchCat;
  });
}
 
function renderTable() {
  const filtered = filteredProducts();
  const total    = filtered.length;
  const pages    = Math.ceil(total / PAGE_SIZE) || 1;
  currentPage    = Math.min(currentPage, pages);
 
  const from  = (currentPage - 1) * PAGE_SIZE;
  const slice = filtered.slice(from, from + PAGE_SIZE);
 
  if (!slice.length) {
    tbodyEl.innerHTML = `<tr><td colspan="5" class="table-placeholder">No hay productos que coincidan con los filtros.</td></tr>`;
    paginationBar.style.display = "none";
    return;
  }
 
  tbodyEl.innerHTML = slice.map((p, i) => {
    return `
      <tr data-id="${p.id}">
        <td style="color:#8fa3b0;font-size:.8rem">${from + i + 1}</td>
        <td style="font-weight:600">${esc(p.nombre || "Sin nombre")}</td>
        <td><span class="badge-cat">${esc(getCatName(p))}</span></td>
        <td style="font-weight:700;color:var(--navy)">${fmt(p.precio)}</td>
        <td style="text-align:center">
          <button class="btn-icon btn-icon-edit js-edit" data-id="${p.id}" title="Editar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon btn-icon-del js-del" data-id="${p.id}" data-nombre="${esc(p.nombre)}" title="Eliminar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          </button>
        </td>
      </tr>`;
  }).join("");
 
  // Paginación
  if (total > PAGE_SIZE) {
    paginationBar.style.display = "flex";
    paginationInfo.textContent  = `Mostrando ${from+1}–${Math.min(from+PAGE_SIZE,total)} de ${total}`;
    let btns = `<button ${currentPage===1?"disabled":""} id="prevBtn">‹ Ant.</button>`;
    for (let pg = 1; pg <= pages; pg++) {
      btns += `<button class="${pg===currentPage?"active":""}" data-pg="${pg}">${pg}</button>`;
    }
    btns += `<button ${currentPage===pages?"disabled":""} id="nextBtn">Sig. ›</button>`;
    paginationBtns.innerHTML = btns;
  } else {
    paginationBar.style.display = "none";
  }
}
 
// ══════════════════════════════════════════════════════
// MODAL — ABRIR (crear / editar)
// ══════════════════════════════════════════════════════
function abrirModalCrear() {
  modalTitleEl.textContent = "Nuevo Producto";
  modalIdEl.value          = "";
  modalNomEl.value         = "";
  modalDescEl.value        = "";
  modalPrecioEl.value      = "";
  modalCatEl.selectedIndex = 0;
  ocultarErrorModal();
  modalProd.show();
}
 
function abrirModalEditar(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
 
  modalTitleEl.textContent = "Editar Producto";
  modalIdEl.value          = p.id;
  modalNomEl.value         = p.nombre || "";
  modalDescEl.value        = p.descripcion || "";
  modalPrecioEl.value      = p.precio ?? "";
 
  // Seleccionar categoría
  const catNombre = getCatName(p);
  [...modalCatEl.options].forEach(opt => {
    opt.selected = opt.value === catNombre;
  });
 
  ocultarErrorModal();
  modalProd.show();
}
 
function ocultarErrorModal() {
  modalErrorEl.style.display = "none";
  modalErrorEl.textContent   = "";
}
 
function mostrarErrorModal(msg) {
  modalErrorEl.textContent   = msg;
  modalErrorEl.style.display = "block";
}
 
// ══════════════════════════════════════════════════════
// GUARDAR (crear o editar)
// ══════════════════════════════════════════════════════
btnGuardar.addEventListener("click", async () => {
  ocultarErrorModal();
 
  const nombre    = modalNomEl.value.trim();
  const precio    = parseFloat(modalPrecioEl.value);
  const catNombre = modalCatEl.value;
 
  if (!nombre)         return mostrarErrorModal("El nombre es obligatorio.");
  if (isNaN(precio) || precio < 0) return mostrarErrorModal("Ingresa un precio válido.");
  if (!catNombre)      return mostrarErrorModal("Selecciona una categoría.");
 
  // Construir payload — siempre por nombre de categoría para que el backend lo resuelva
  const payload = {
    nombre,
    descripcion : modalDescEl.value.trim(),
    precio,
    categoriaNombre: catNombre
  };
 
  const id      = modalIdEl.value;
  const isEdit  = Boolean(id);
  const url     = isEdit ? `${API_PRODUCTOS}/${id}` : API_PRODUCTOS;
  const method  = isEdit ? "PUT" : "POST";
 
  btnGuardar.disabled    = true;
  btnGuardar.textContent = "Guardando…";
 
  try {
    const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `Error ${res.status}`);
    }
    modalProd.hide();
    await loadProducts();
    setStatus(`Producto "${nombre}" ${isEdit?"actualizado":"creado"} correctamente.`);
  } catch (err) {
    mostrarErrorModal(err.message || "No se pudo guardar el producto.");
  } finally {
    btnGuardar.disabled    = false;
    btnGuardar.textContent = "Guardar producto";
  }
});
 
// ══════════════════════════════════════════════════════
// ELIMINAR
// ══════════════════════════════════════════════════════
document.getElementById("btnConfirmarEliminar").addEventListener("click", async () => {
  if (!deleteTarget) return;
  const { id, nombre } = deleteTarget;
 
  const btn = document.getElementById("btnConfirmarEliminar");
  btn.disabled    = true;
  btn.textContent = "Eliminando…";
 
  try {
    const res = await fetch(`${API_PRODUCTOS}/${id}`, { method: "DELETE", headers: authHeaders() });
    if (!res.ok) throw new Error(await res.text() || `Error ${res.status}`);
    modalDel.hide();
    await loadProducts();
    setStatus(`Producto "${nombre}" eliminado correctamente.`);
  } catch (err) {
    alert("No se pudo eliminar: " + err.message);
  } finally {
    btn.disabled    = false;
    btn.textContent = "Sí, eliminar";
    deleteTarget    = null;
  }
});
 
// ══════════════════════════════════════════════════════
// DELEGACIÓN DE EVENTOS — tabla
// ══════════════════════════════════════════════════════
tbodyEl.addEventListener("click", e => {
  const editBtn   = e.target.closest(".js-edit");
  const delBtn    = e.target.closest(".js-del");
 
  if (editBtn) {
    abrirModalEditar(parseInt(editBtn.dataset.id));
  } else if (delBtn) {
    deleteTarget = { id: parseInt(delBtn.dataset.id), nombre: delBtn.dataset.nombre };
    document.getElementById("eliminarNombre").textContent = delBtn.dataset.nombre;
    modalDel.show();
  }
});
 
// ══════════════════════════════════════════════════════
// DELEGACIÓN — paginación
// ══════════════════════════════════════════════════════
paginationBtns.addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn || btn.disabled) return;
  if (btn.id === "prevBtn") { currentPage--; renderTable(); }
  else if (btn.id === "nextBtn") { currentPage++; renderTable(); }
  else if (btn.dataset.pg) { currentPage = parseInt(btn.dataset.pg); renderTable(); }
});
 
// ══════════════════════════════════════════════════════
// EVENTOS GLOBALES
// ══════════════════════════════════════════════════════
document.getElementById("btnNuevoProducto").addEventListener("click", abrirModalCrear);
document.getElementById("btnReload").addEventListener("click", loadProducts);
searchEl.addEventListener("input",    () => { currentPage = 1; renderTable(); });
filterCatEl.addEventListener("change",() => { currentPage = 1; renderTable(); });
 
// ══════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════
loadProducts();