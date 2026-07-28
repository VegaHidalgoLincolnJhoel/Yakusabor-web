// ══════════════════════════════════════════════════════════
//  GestionCocina.js  —  Yaku Sabor
//  Carpeta: Frontend/Dashboard/JS/
//
//  CAMBIOS CLAVE:
//  - Al hacer clic en "Entregado" o "Rechazar", el plato
//    desaparece de la pantalla inmediatamente (optimistic UI).
//  - Si todos los platos de una mesa son entregados/rechazados,
//    la tarjeta de esa mesa también desaparece.
// ══════════════════════════════════════════════════════════
// resolveApiBaseUrl(), authHeaders(), API_BASE_URL vienen de api-config.js

const PEDIDOS_URL = `${API_BASE_URL}/pedidos`;

const mesasContainer = document.getElementById("mesasContainer");
const sinPedidos     = document.getElementById("sinPedidos");
const ultimaAct      = document.getElementById("ultimaActualizacion");

let actualizando = false;

// ── Helpers ────────────────────────────────────────────────────────────────

function etiquetaEstado(estado) {
  const mapa = {
    pendiente:      "Pendiente",
    en_preparacion: "Preparando",
    listo:          "Listo ✓",
    entregado:      "Entregado",
    rechazado:      "Rechazado",
  };
  return mapa[estado] || estado;
}

function claseBadge(estado) {
  return `estado-badge estado-${estado}`;
}

// ══════════════════════════════════════════════════════════
//  ESTADO LOCAL — copia mutable de los pedidos
// ══════════════════════════════════════════════════════════
let pedidosActivos = []; // Array de objetos { pedido, detalle }[] por grupo

// ── Carga de datos ──────────────────────────────────────────────────────────

async function cargarPedidos(silencioso = false) {
  if (actualizando) return;
  actualizando = true;

  if (!silencioso) {
    mesasContainer.innerHTML = `<div class="text-center text-muted py-4">Cargando pedidos...</div>`;
  }

  try {
    const res = await fetch(PEDIDOS_URL, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const todos = await res.json();

    // Guardar en estado local y renderizar
    pedidosActivos = todos;
    renderCocina(pedidosActivos);
    ultimaAct.textContent = `Última actualización: ${new Date().toLocaleTimeString("es-PE")}`;
  } catch (err) {
    mesasContainer.innerHTML = `
      <div class="alert alert-danger">
        No se pudo conectar con el backend. ${err.message}
      </div>`;
  } finally {
    actualizando = false;
  }
}

// ══════════════════════════════════════════════════════════
//  RENDERIZADO
// ══════════════════════════════════════════════════════════

function renderCocina(pedidos) {
  // Solo pedidos no terminados globalmente
  const activos = pedidos.filter(
    (p) => !["cancelado", "facturado"].includes(p.estado)
  );

  // Agrupar detalles por mesa/delivery (solo los no-entregados y no-rechazados)
  const grupos = {};
  activos.forEach((pedido) => {
    const key = pedido.mesaCodigo
      ? `Mesa ${pedido.mesaCodigo}`
      : pedido.direccionDelivery
        ? `🛵 Delivery`
        : `Pedido #${pedido.id}`;

    if (!grupos[key]) grupos[key] = [];

    (pedido.detalles || []).forEach((detalle) => {
      // ★ FILTRO CLAVE: no mostrar platos entregados ni rechazados
      if (detalle.estadoDetalle === "entregado" || detalle.estadoDetalle === "rechazado") return;
      grupos[key].push({ pedido, detalle });
    });
  });

  // Eliminar grupos vacíos (todos los platos ya terminados)
  const gruposValidos = Object.entries(grupos).filter(([, filas]) => filas.length > 0);

  if (gruposValidos.length === 0) {
    mesasContainer.innerHTML = "";
    sinPedidos.style.display = "block";
    return;
  }
  sinPedidos.style.display = "none";

  mesasContainer.innerHTML = gruposValidos
    .map(([mesaLabel, filas]) => {
      const totalItems = filas.reduce((s, f) => s + f.detalle.cantidad, 0);
      const todoListo  = filas.every((f) =>
        f.detalle.estadoDetalle === "listo"
      );

      const filaHTML = filas.map(({ pedido, detalle }) => `
        <tr data-detalle-id="${detalle.detalleId}" data-pedido-id="${pedido.id}">
          <td>${detalle.productoNombre}</td>
          <td class="text-center">${detalle.cantidad}</td>
          <td class="text-center">
            <span class="${claseBadge(detalle.estadoDetalle || "pendiente")}">
              ${etiquetaEstado(detalle.estadoDetalle || "pendiente")}
            </span>
          </td>
          <td>
            <div class="kitchen-actions">
              <button class="btn btn-warning btn-accion"
                data-detalle-id="${detalle.detalleId}"
                data-pedido-id="${pedido.id}"
                data-estado="en_preparacion"
                ${detalle.estadoDetalle === "en_preparacion" ? "disabled" : ""}>
                Preparar
              </button>
              <button class="btn btn-success btn-accion"
                data-detalle-id="${detalle.detalleId}"
                data-pedido-id="${pedido.id}"
                data-estado="listo"
                ${detalle.estadoDetalle === "listo" ? "disabled" : ""}>
                Listo
              </button>
              <button class="btn btn-primary btn-accion btn-entregado"
                data-detalle-id="${detalle.detalleId}"
                data-pedido-id="${pedido.id}"
                data-estado="entregado">
                Entregado
              </button>
              <button class="btn btn-danger btn-accion btn-rechazar"
                data-detalle-id="${detalle.detalleId}"
                data-pedido-id="${pedido.id}"
                data-estado="rechazado">
                Rechazar
              </button>
            </div>
          </td>
        </tr>
      `).join("");

      return `
        <div class="mesa-card" data-mesa-label="${mesaLabel}">
          <div class="mesa-card-title">
            🪑 ${mesaLabel}
            <span class="badge ${todoListo ? "bg-success" : "bg-warning text-dark"}">
              ${todoListo ? "Todo listo ✓" : `${totalItems} item${totalItems !== 1 ? "s" : ""} pendientes`}
            </span>
          </div>
          <div class="table-responsive">
            <table class="table table-sm table-hover kitchen-table">
              <thead class="table-dark">
                <tr>
                  <th>Plato</th>
                  <th class="text-center">Cantidad</th>
                  <th class="text-center">Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>${filaHTML}</tbody>
            </table>
          </div>
        </div>
      `;
    })
    .join("");
}

// ══════════════════════════════════════════════════════════
//  ★ EVENTOS — Desaparece al Entregar o Rechazar
// ══════════════════════════════════════════════════════════

mesasContainer.addEventListener("click", async (e) => {
  const btn = e.target.closest(".btn-accion");
  if (!btn || btn.disabled) return;

  const { detalleId, pedidoId, estado } = btn.dataset;
  const esTerminal = estado === "entregado" || estado === "rechazado";

  btn.disabled = true;
  const textoOriginal = btn.textContent;
  btn.textContent = "...";

  try {
    const res = await fetch(
      `${PEDIDOS_URL}/${pedidoId}/detalles/${detalleId}/estado`,
      {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ estado }),
      }
    );
    if (!res.ok) throw new Error(await res.text());

    if (esTerminal) {
      // ★ Remover la fila inmediatamente sin recargar todo
      const fila = mesasContainer.querySelector(
        `tr[data-detalle-id="${detalleId}"][data-pedido-id="${pedidoId}"]`
      );
      if (fila) {
        fila.style.transition = "opacity .3s ease, transform .3s ease";
        fila.style.opacity = "0";
        fila.style.transform = "translateX(20px)";
        await new Promise(r => setTimeout(r, 310));
        fila.remove();

        // Si la tabla quedó vacía → animar y remover la tarjeta de mesa completa
        const tbody = mesasContainer.querySelector(
          `.mesa-card[data-mesa-label] tbody`
        );
        // Buscar la tarjeta padre de la fila eliminada
        const card = mesasContainer.querySelector(
          `tbody:empty`
        )?.closest(".mesa-card");

        if (card) {
          card.style.transition = "opacity .4s ease";
          card.style.opacity = "0";
          await new Promise(r => setTimeout(r, 420));
          card.remove();
        }

        // Si ya no quedan tarjetas
        if (mesasContainer.querySelectorAll(".mesa-card").length === 0) {
          mesasContainer.innerHTML = "";
          sinPedidos.style.display = "block";
        }
      }

      // Actualizar estado local también
      actualizarEstadoLocalDetalle(Number(pedidoId), Number(detalleId), estado);

    } else {
      // Para estados no terminales (preparar / listo), solo recargar silenciosamente
      await cargarPedidos(true);
    }

  } catch (err) {
    alert("Error al actualizar: " + err.message);
    btn.disabled = false;
    btn.textContent = textoOriginal;
  }
});

/** Actualiza el estado en el array local sin recargar del server */
function actualizarEstadoLocalDetalle(pedidoId, detalleId, nuevoEstado) {
  pedidosActivos.forEach(p => {
    if (p.id !== pedidoId) return;
    (p.detalles || []).forEach(d => {
      if (d.detalleId === detalleId) d.estadoDetalle = nuevoEstado;
    });
  });
}

// ── Botón Refresh ────────────────────────────────────────────────────────────
document.getElementById("btnRefresh")
  .addEventListener("click", () => cargarPedidos());

// ── Inicialización ───────────────────────────────────────────────────────────
cargarPedidos();
setInterval(() => cargarPedidos(true), 15000);


// ══════════════════════════════════════════════════════════
//  MODAL ESTADO PLATILLOS (sin cambios respecto al original)
// ══════════════════════════════════════════════════════════
const API_PRODUCTOS = `${API_BASE_URL}/productos`;

const modalPlatillosEl = document.getElementById("modalPlatillos");
const modalPlatillos   = new bootstrap.Modal(modalPlatillosEl);

const catTabsEl      = document.getElementById("catTabs");
const catPanelsEl    = document.getElementById("catPanels");
const platStatusEl   = document.getElementById("platillosStatus");
const availCounterEl = document.getElementById("availCounter");

function authHeadersModal() {
  return authHeaders();
}

const esc = v => String(v ?? "")
  .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
  .replace(/"/g,"&quot;").replace(/'/g,"&#39;");

function setPlatStatus(msg, error = false) {
  platStatusEl.innerHTML = `<span style="color:${error ? "#c0392b" : "#6b7b8a"}">${msg}</span>`;
}

let platillosData = [];
let categoriasMap = {};

document.getElementById("btnEstadoPlatillos").addEventListener("click", () => {
  modalPlatillos.show();
  cargarPlatillos();
});

async function cargarPlatillos() {
  catTabsEl.innerHTML   = `<div class="modal-empty"><span class="spinner-sm"></span> Cargando platillos…</div>`;
  catPanelsEl.innerHTML = "";
  availCounterEl.style.display = "none";
  setPlatStatus("");

  try {
    const res = await fetch(API_PRODUCTOS, { headers: authHeadersModal() });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    platillosData = await res.json();
    agruparPorCategoria();
    renderModalContenido();
  } catch (err) {
    catTabsEl.innerHTML = `<div class="modal-empty" style="color:#c0392b">No se pudo cargar el menú.</div>`;
    setPlatStatus("Error al cargar platillos.", true);
  }
}

function agruparPorCategoria() {
  categoriasMap = {};
  platillosData.forEach(p => {
    const cat = p.categoria?.nombre || "Sin categoría";
    if (!categoriasMap[cat]) categoriasMap[cat] = [];
    categoriasMap[cat].push(p);
  });
  Object.keys(categoriasMap).forEach(k => {
    categoriasMap[k].sort((a,b) => (a.nombre||"").localeCompare(b.nombre||"", "es"));
  });
}

function renderModalContenido() {
  const cats = Object.keys(categoriasMap).sort((a,b) => a.localeCompare(b,"es"));
  if (!cats.length) {
    catTabsEl.innerHTML = `<div class="modal-empty">No hay productos registrados.</div>`;
    catPanelsEl.innerHTML = "";
    return;
  }

  catTabsEl.innerHTML = cats.map((cat, i) =>
    `<button class="cat-tab${i===0?" active":""}" data-cat="${esc(cat)}">${esc(cat)}</button>`
  ).join("");

  catPanelsEl.innerHTML = cats.map((cat, i) => `
    <div class="cat-panel${i===0?" active":""}" data-cat-panel="${esc(cat)}">
      ${renderTablaPlatillos(categoriasMap[cat])}
    </div>
  `).join("");

  actualizarContador();
}

function renderTablaPlatillos(items) {
  if (!items.length) return `<div class="modal-empty">Sin productos en esta categoría.</div>`;
  return `
    <table class="platillos-table">
      <thead><tr><th>Producto</th><th style="text-align:right">Precio</th><th>Disponible</th></tr></thead>
      <tbody>
        ${items.map(p => `
          <tr>
            <td>${esc(p.nombre)}</td>
            <td style="text-align:right;font-weight:600">S/ ${Number(p.precio||0).toFixed(2)}</td>
            <td>
              <label class="avail-switch">
                <input type="checkbox" class="js-avail-check" data-id="${p.id}" ${p.disponible ? "checked" : ""} />
                <span class="js-avail-label ${p.disponible ? "avail-label-on" : "avail-label-off"}">
                  ${p.disponible ? "Disponible" : "No disponible"}
                </span>
              </label>
            </td>
          </tr>`).join("")}
      </tbody>
    </table>`;
}

function actualizarContador() {
  const activos = platillosData.filter(p => Boolean(p.disponible)).length;
  availCounterEl.style.display = "block";
  availCounterEl.innerHTML = `<strong>${activos}</strong> de <strong>${platillosData.length}</strong> productos disponibles`;
}

catTabsEl.addEventListener("click", e => {
  const tab = e.target.closest(".cat-tab");
  if (!tab) return;
  const cat = tab.dataset.cat;
  catTabsEl.querySelectorAll(".cat-tab").forEach(t => t.classList.remove("active"));
  catPanelsEl.querySelectorAll(".cat-panel").forEach(p => p.classList.remove("active"));
  tab.classList.add("active");
  catPanelsEl.querySelector(`[data-cat-panel="${CSS.escape(cat)}"]`)?.classList.add("active");
});

catPanelsEl.addEventListener("change", async e => {
  const check = e.target.closest(".js-avail-check");
  if (!check) return;

  const id       = parseInt(check.dataset.id);
  const newValue = check.checked;
  const label    = check.parentElement.querySelector(".js-avail-label");

  check.disabled = true;
  label.textContent = "Guardando…";
  label.className   = "js-avail-label";

  try {
    const res = await fetch(`${API_PRODUCTOS}/${id}/disponibilidad`, {
      method: "PUT",
      headers: authHeadersModal(),
      body: JSON.stringify({ disponible: newValue })
    });
    if (!res.ok) throw new Error(await res.text() || `Error ${res.status}`);

    const idx = platillosData.findIndex(p => p.id === id);
    if (idx !== -1) platillosData[idx].disponible = newValue;

    label.textContent = newValue ? "Disponible" : "No disponible";
    label.className   = `${newValue ? "avail-label-on" : "avail-label-off"} js-avail-label`;
    actualizarContador();
    setPlatStatus(`"${platillosData.find(p=>p.id===id)?.nombre || id}" actualizado.`);
  } catch (err) {
    check.checked     = !newValue;
    label.textContent = !newValue ? "Disponible" : "No disponible";
    label.className   = `${!newValue ? "avail-label-on" : "avail-label-off"} js-avail-label`;
    setPlatStatus(`Error: ${err.message}`, true);
  } finally {
    check.disabled = false;
  }
});

modalPlatillosEl.addEventListener("show.bs.modal", () => cargarPlatillos());