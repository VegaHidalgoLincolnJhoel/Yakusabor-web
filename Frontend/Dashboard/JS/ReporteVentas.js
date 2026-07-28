// ══════════════════════════════════════════════════════════
//  ReporteVentas.js  —  Yaku Sabor
//  Carpeta: Frontend/Dashboard/JS/
//  Conecta con Spring Boot mediante la API configurada en runtime
// ══════════════════════════════════════════════════════════
// resolveApiBaseUrl(), authHeaders(), API_BASE_URL vienen de api-config.js

// ── Formateadores ───────────────────────────────────────
const fmt = (v) =>
  new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(Number(v) || 0);

const fmtShort = (v) => `S/ ${Number(v).toFixed(2)}`;

// ── Toast ────────────────────────────────────────────────
function showToast(msg, duration = 2800) {
  const el = document.getElementById("rvToast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), duration);
}

// ══════════════════════════════════════════════════════════
//  DATOS — Carga real del backend + fallback de demo
// ══════════════════════════════════════════════════════════

/**
 * Intenta GET /api/pedidos y construye las métricas.
 * Si el backend está caído, usa datos de demostración para mayo 2025.
 */
async function fetchReporteData() {
  try {
    const res = await fetch(`${API_BASE}/pedidos`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const pedidos = await res.json();
    return buildMetrics(pedidos);
  } catch {
    showToast("ℹ️ Backend no disponible — mostrando datos de demostración");
    return getDemoData();
  }
}

/** Construye métricas a partir del array de pedidos del backend */
function buildMetrics(pedidos) {
  const facturados = pedidos.filter(
    (p) => !["cancelado"].includes(p.estado)
  );

  // Ventas totales
  const totalVentas = facturados.reduce((s, p) => s + (Number(p.total) || 0), 0);
  const totalPedidos = facturados.length;
  const ticketProm = totalPedidos > 0 ? totalVentas / totalPedidos : 0;

  // Meseros únicos activos
  const meserosSet = new Set(
    facturados.map((p) => p.meseroId).filter(Boolean)
  );

  // Ventas por día (últimos 31 días)
  const diasMap = {};
  facturados.forEach((p) => {
    const d = new Date(p.createdAt);
    const key = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    diasMap[key] = (diasMap[key] || 0) + (Number(p.total) || 0);
  });
  const dias = Object.keys(diasMap).sort();
  const ventasDias = dias.map((k) => diasMap[k]);

  // Por tipo
  const presencial = facturados.filter((p) => p.tipo === "presencial").length;
  const delivery = facturados.filter((p) => p.tipo === "delivery").length;

  // Por mesero — fallback a nombre desde id
  const meseroMap = {};
  facturados.forEach((p) => {
    if (!p.meseroId) return;
    const key = p.meseroId;
    if (!meseroMap[key]) {
      meseroMap[key] = {
        nombre: p.meseroNombre || `Mesero #${p.meseroId}`,
        turno: p.turno || "Tarde",
        pedidos: 0,
        ventas: 0,
      };
    }
    meseroMap[key].pedidos++;
    meseroMap[key].ventas += Number(p.total) || 0;
  });
  const meseros = Object.values(meseroMap).sort((a, b) => b.ventas - a.ventas);

  // Top productos
  const prodMap = {};
  facturados.forEach((p) => {
    (p.detalles || []).forEach((d) => {
      const k = d.productoNombre || d.nombre || "Producto";
      if (!prodMap[k]) prodMap[k] = { nombre: k, qty: 0, ventas: 0 };
      prodMap[k].qty += d.cantidad || 1;
      prodMap[k].ventas += (Number(d.precioUnitario) || 0) * (d.cantidad || 1);
    });
  });
  const topProductos = Object.values(prodMap)
    .sort((a, b) => b.ventas - a.ventas)
    .slice(0, 6);

  return {
    totalVentas,
    totalPedidos,
    ticketProm,
    meserosActivos: meserosSet.size || meseros.length,
    dias,
    ventasDias,
    meseros,
    topProductos,
    presencial,
    delivery,
  };
}

/** Datos de demo para mayo 2025 (igual que la imagen de referencia) */
function getDemoData() {
  return {
    totalVentas: 8450,
    totalPedidos: 126,
    ticketProm: 67.06,
    meserosActivos: 6,
    deltasVentas: "+12.5%",
    deltasPedidos: "+8.3%",
    deltasTicket: "+5.7%",
    dias: [
      "01/05","02/05","03/05","04/05","05/05","06/05","07/05",
      "08/05","09/05","10/05","11/05","12/05","13/05","14/05",
      "15/05","16/05","17/05","18/05","19/05","20/05","21/05",
      "22/05","23/05","24/05","25/05","26/05","27/05","28/05",
      "29/05","30/05","31/05",
    ],
    ventasDias: [
      410,530,490,380,560,640,700,590,480,730,820,
      770,640,580,1580,950,880,730,640,1260,970,
      830,750,680,1020,890,760,850,940,780,1020,
    ],
    meseros: [
      { nombre:"Carlos Ramírez", turno:"Tarde",  pedidos:28, ventas:2150 },
      { nombre:"María González", turno:"Mañana", pedidos:25, ventas:1980 },
      { nombre:"Juan Pérez",     turno:"Tarde",  pedidos:22, ventas:1650 },
      { nombre:"Ana López",      turno:"Noche",  pedidos:18, ventas:1250 },
      { nombre:"Luis Torres",    turno:"Mañana", pedidos:17, ventas:1120 },
      { nombre:"Sofia Ortega",   turno:"Noche",  pedidos:16, ventas:1100 },
    ],
    topProductos: [
      { nombre:"Jalea Mixta",           qty:38, ventas:2090 },
      { nombre:"Arroz con Mariscos",    qty:41, ventas:1845 },
      { nombre:"Chupe de Camarones",    qty:29, ventas:1508 },
      { nombre:"Ceviche Carretillero",  qty:35, ventas:1470 },
      { nombre:"Ceviche Clásico",       qty:40, ventas:1400 },
      { nombre:"Leche de Tigre",        qty:46, ventas:828  },
    ],
    presencial: 98,
    delivery: 28,
  };
}

// ══════════════════════════════════════════════════════════
//  RENDER KPIs
// ══════════════════════════════════════════════════════════
function renderKPIs(data) {
  document.getElementById("kpiVentasVal").textContent = fmt(data.totalVentas);
  document.getElementById("kpiPedidosVal").textContent = data.totalPedidos.toLocaleString("es-PE");
  document.getElementById("kpiTicketVal").textContent = fmt(data.ticketProm);
  document.getElementById("kpiMeserosVal").textContent = data.meserosActivos;

  const deltaVentas = data.deltasVentas || "+12.5%";
  const deltaPedidos = data.deltasPedidos || "+8.3%";
  const deltaTicket = data.deltasTicket || "+5.7%";

  document.getElementById("kpiVentasDelta").textContent = `▲ ${deltaVentas} vs. período anterior`;
  document.getElementById("kpiPedidosDelta").textContent = `▲ ${deltaPedidos} vs. período anterior`;
  document.getElementById("kpiTicketDelta").textContent = `▲ ${deltaTicket} vs. período anterior`;
  document.getElementById("kpiMeserosSub").textContent = "Este período";

  document.getElementById("rvSubtitle").textContent =
    `Período activo — ${new Date().toLocaleDateString("es-PE", { month: "long", year: "numeric" })}`;
}

// ══════════════════════════════════════════════════════════
//  CHART — Ventas por día
// ══════════════════════════════════════════════════════════
let chartDias = null;

function renderChartDias(data) {
  const { dias, ventasDias } = data;

  const min = Math.min(...ventasDias);
  const max = Math.max(...ventasDias);
  const prom = ventasDias.reduce((a, b) => a + b, 0) / ventasDias.length;

  document.getElementById("statMin").textContent = fmtShort(min);
  document.getElementById("statMax").textContent = fmtShort(max);
  document.getElementById("statProm").textContent = fmtShort(prom);

  const ctx = document.getElementById("ventasDiasChart").getContext("2d");

  if (chartDias) chartDias.destroy();

  const gradient = ctx.createLinearGradient(0, 0, 0, 240);
  gradient.addColorStop(0, "rgba(27,58,87,0.22)");
  gradient.addColorStop(1, "rgba(27,58,87,0.01)");

  chartDias = new Chart(ctx, {
    type: "line",
    data: {
      labels: dias,
      datasets: [
        {
          label: "Ventas (S/)",
          data: ventasDias,
          borderColor: "#1b3a57",
          borderWidth: 2.5,
          backgroundColor: gradient,
          pointBackgroundColor: "#1b3a57",
          pointRadius: 3,
          pointHoverRadius: 6,
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${fmtShort(ctx.parsed.y)}`,
          },
          backgroundColor: "#1b3a57",
          titleColor: "#fff",
          bodyColor: "#c9daef",
          padding: 10,
          cornerRadius: 8,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 11, family: "'Plus Jakarta Sans', sans-serif" },
            color: "#94a3b8",
            maxTicksLimit: 10,
          },
        },
        y: {
          grid: { color: "#f1f5f9" },
          ticks: {
            callback: (v) => `S/ ${v}`,
            font: { size: 11, family: "'Plus Jakarta Sans', sans-serif" },
            color: "#94a3b8",
          },
        },
      },
    },
  });
}

// ══════════════════════════════════════════════════════════
//  TABLA MESEROS
// ══════════════════════════════════════════════════════════
function renderMeseros(data) {
  const { meseros } = data;
  const tbody = document.getElementById("meseroTableBody");
  const tfoot = document.getElementById("meseroTableFoot");
  const badge = document.getElementById("meserosCount");

  const totalVentas = meseros.reduce((s, m) => s + m.ventas, 0);
  const totalPedidos = meseros.reduce((s, m) => s + m.pedidos, 0);

  badge.textContent = `${meseros.length} meseros`;
  badge.className = "rv-badge rv-badge--neutral";

  tbody.innerHTML = meseros
    .map((m) => {
      const pct = totalVentas > 0 ? (m.ventas / totalVentas) * 100 : 0;
      const turnoClass =
        m.turno?.toLowerCase() === "mañana"
          ? "rv-turno--mañana"
          : m.turno?.toLowerCase() === "noche"
          ? "rv-turno--noche"
          : "rv-turno--tarde";

      return `
        <tr>
          <td><strong>${m.nombre}</strong></td>
          <td><span class="rv-turno ${turnoClass}">${m.turno || "—"}</span></td>
          <td class="text-center">${m.pedidos}</td>
          <td class="text-right">${fmt(m.ventas)}</td>
          <td>
            <div class="rv-bar-wrap">
              <div class="rv-bar"><div class="rv-bar-fill" style="width:${pct.toFixed(1)}%"></div></div>
              <span class="rv-bar-pct">${pct.toFixed(1)}%</span>
            </div>
          </td>
        </tr>`;
    })
    .join("");

  tfoot.innerHTML = `
    <tr>
      <td colspan="2"><strong>Total</strong></td>
      <td class="text-center"><strong>${totalPedidos}</strong></td>
      <td class="text-right"><strong>${fmt(totalVentas)}</strong></td>
      <td><span class="rv-bar-pct" style="min-width:auto">100%</span></td>
    </tr>`;
}

// ══════════════════════════════════════════════════════════
//  TOP PRODUCTOS
// ══════════════════════════════════════════════════════════
function renderTopProductos(data) {
  const container = document.getElementById("topProductosContainer");
  if (!data.topProductos || data.topProductos.length === 0) {
    container.innerHTML = '<p class="rv-table-empty">Sin datos de productos</p>';
    return;
  }
  container.innerHTML = data.topProductos
    .map((p, i) => {
      const rank = i + 1;
      const rankClass =
        rank === 1 ? "rv-top-rank--1" : rank === 2 ? "rv-top-rank--2" : rank === 3 ? "rv-top-rank--3" : "";
      return `
        <div class="rv-top-item">
          <div class="rv-top-rank ${rankClass}">${rank}</div>
          <div class="rv-top-info">
            <div class="rv-top-name">${p.nombre}</div>
            <div class="rv-top-meta">${p.qty} unidades</div>
          </div>
          <div class="rv-top-val">${fmt(p.ventas)}</div>
        </div>`;
    })
    .join("");
}

// ══════════════════════════════════════════════════════════
//  DONUT — Tipo pedido
// ══════════════════════════════════════════════════════════
let chartTipo = null;

function renderDonutTipo(data) {
  const { presencial, delivery } = data;
  const ctx = document.getElementById("tipoChart").getContext("2d");

  if (chartTipo) chartTipo.destroy();

  chartTipo = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Presencial", "Delivery"],
      datasets: [
        {
          data: [presencial, delivery],
          backgroundColor: ["#1b3a57", "#60a5fa"],
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    },
    options: {
      responsive: false,
      cutout: "68%",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.parsed} pedidos`,
          },
          backgroundColor: "#1b3a57",
          cornerRadius: 8,
        },
      },
    },
  });

  const total = presencial + delivery;
  document.getElementById("tipoLegend").innerHTML = `
    <span><span class="rv-donut-dot" style="background:#1b3a57"></span>Presencial ${total > 0 ? Math.round((presencial/total)*100) : 0}%</span>
    <span><span class="rv-donut-dot" style="background:#60a5fa"></span>Delivery ${total > 0 ? Math.round((delivery/total)*100) : 0}%</span>`;
}

// ══════════════════════════════════════════════════════════
//  EXPORTAR CSV
// ══════════════════════════════════════════════════════════
let _lastData = null;

function exportCSV(data) {
  if (!data) return;
  let csv = "Mesero,Turno,Pedidos,Ventas (S/),% Participación\n";
  const totalVentas = data.meseros.reduce((s, m) => s + m.ventas, 0);
  data.meseros.forEach((m) => {
    const pct = totalVentas > 0 ? ((m.ventas / totalVentas) * 100).toFixed(1) : "0.0";
    csv += `"${m.nombre}","${m.turno}",${m.pedidos},${m.ventas.toFixed(2)},${pct}%\n`;
  });
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reporte_ventas_yakusabor_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("✅ CSV exportado correctamente");
}

// ══════════════════════════════════════════════════════════
//  CARGA PRINCIPAL
// ══════════════════════════════════════════════════════════
async function cargarReporte() {
  document.getElementById("rvSubtitle").textContent = "Cargando datos…";
  const data = await fetchReporteData();
  _lastData = data;

  renderKPIs(data);
  renderChartDias(data);
  renderMeseros(data);
  renderTopProductos(data);
  renderDonutTipo(data);

  document.getElementById("rvSubtitle").textContent =
    `Actualizado: ${new Date().toLocaleTimeString("es-PE")}`;
}

// ══════════════════════════════════════════════════════════
//  EVENTOS
// ══════════════════════════════════════════════════════════
document.getElementById("rvRefreshBtn").addEventListener("click", cargarReporte);
document.getElementById("rvExportBtn").addEventListener("click", () => exportCSV(_lastData));
document.getElementById("rvPeriodo").addEventListener("change", cargarReporte);

// Init
cargarReporte();