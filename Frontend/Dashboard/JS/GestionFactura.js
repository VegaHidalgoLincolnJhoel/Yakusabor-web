// ── Config ─────────────────────────────────────────────────
        function resolveApiBaseUrl() {
            const override = window.__API_BASE_URL__ || localStorage.getItem("apiBaseUrl");
            if (override) return override.replace(/\/$/, "");

            const { origin, hostname, protocol } = window.location;
            if (hostname.endsWith(".app.github.dev") || hostname.endsWith(".githubpreview.dev")) {
                return origin.replace(/-(\d+)\.app\.github\.dev$/, "-8080.app.github.dev")
                              .replace(/-(\d+)\.githubpreview\.dev$/, "-8080.githubpreview.dev") + "/api";
            }
            return `${protocol}//${hostname}:8080/api`;
        }

        const API = resolveApiBaseUrl();

        function authHeaders() {
            const token = localStorage.getItem("token");
            return {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            };
        }

        const fmt = v => `S/ ${Number(v || 0).toFixed(2)}`;
        const IGV_RATE = 0.18; // Tasa de IGV vigente en Perú

        // ── Referencias DOM ────────────────────────────────────────
        const selectMesa         = document.getElementById("selectMesa");
        const detalleBody        = document.getElementById("detalleBody");
        const cuentaTotal        = document.getElementById("cuentaTotal");
        const btnGenerarFactura  = document.getElementById("btnGenerarFactura");
        const cuentaEstado       = document.getElementById("cuentaEstado");
        const modalFacturaEl     = document.getElementById("modalFactura");
        const modalFactura       = new bootstrap.Modal(modalFacturaEl);
        const modalDetalleBody   = document.getElementById("modalDetalleBody");
        const modalSubtotal      = document.getElementById("modalSubtotal");
        const modalIgv           = document.getElementById("modalIgv");
        const modalCuentaTotal   = document.getElementById("modalCuentaTotal");
        const btnConfirmarFactura = document.getElementById("btnConfirmarFactura");
        const camposBoleta       = document.querySelectorAll(".campos-boleta");
        const camposFactura      = document.querySelectorAll(".campos-factura");

        let ultimaCuenta = { pedidos: [], total: 0, mesaCodigo: "" };

        function mostrarEstado(msg, tipo = "info") {
            cuentaEstado.className = `alert alert-${tipo} py-2 mt-3`;
            cuentaEstado.textContent = msg;
            cuentaEstado.style.display = "block";
        }
        function ocultarEstado() {
            cuentaEstado.style.display = "none";
        }

        function generarNumeroComprobante() {
            const serie = document.getElementById("tipoFactura").checked ? "F001" : "B001";
            const correlativo = String(Math.floor(1000 + Math.random() * 9000));
            return `${serie}-${correlativo}`;
        }

        // ── Muestra solo los campos necesarios según Boleta o Factura ─
        function actualizarCamposPorTipo() {
            const esFactura = document.getElementById("tipoFactura").checked;

            camposBoleta.forEach(el => el.classList.toggle("activo", !esFactura));
            camposFactura.forEach(el => el.classList.toggle("activo", esFactura));

            const fRuc = document.getElementById("fRuc");
            const fRazonSocial = document.getElementById("fRazonSocial");
            const fDireccionFiscal = document.getElementById("fDireccionFiscal");
            fRuc.classList.remove("is-invalid");
            fRazonSocial.classList.remove("is-invalid");
            fDireccionFiscal.classList.remove("is-invalid");
        }

        // ── Limpia los datos del cliente al cambiar de mesa/factura ──
        function limpiarCamposCliente() {
            document.getElementById("fTelefono").value = "";
            document.getElementById("fDni").value = "";
            document.getElementById("fNombreBoleta").value = "";
            document.getElementById("fRuc").value = "";
            document.getElementById("fRazonSocial").value = "";
            document.getElementById("fDireccionFiscal").value = "";
            document.getElementById("fHabilitacion").value = "";
            document.getElementById("fRuc").classList.remove("is-invalid");
            document.getElementById("fRazonSocial").classList.remove("is-invalid");
            document.getElementById("fDireccionFiscal").classList.remove("is-invalid");
            document.getElementById("tipoBoleta").checked = true;
            actualizarCamposPorTipo();
        }

        // ── Cargar mesas ocupadas en el select ──────────────────────
        async function cargarMesasOcupadas() {
            selectMesa.innerHTML = '<option value="">Cargando mesas…</option>';
            btnGenerarFactura.disabled = true;
            try {
                const res = await fetch(`${API}/mesas/estado`, { headers: authHeaders() });
                if (!res.ok) throw new Error(`Error ${res.status}`);
                const mesas = await res.json();
                const ocupadas = mesas.filter(m => (m.estado || "").toLowerCase() === "ocupada");

                if (ocupadas.length === 0) {
                    selectMesa.innerHTML = '<option value="">No hay mesas ocupadas</option>';
                    return;
                }

                selectMesa.innerHTML = '<option value="">Selecciona una mesa…</option>' +
                    ocupadas.map(m => `<option value="${m.id}">Mesa ${m.codigo}</option>`).join("");
            } catch (err) {
                selectMesa.innerHTML = '<option value="">Error al cargar mesas</option>';
                mostrarEstado(`No se pudo conectar con el backend: ${err.message}`, "danger");
            }
        }

        // ── Cargar la cuenta consolidada de la mesa seleccionada ────
        // silencioso = true: se usa para auto-refresco (no borra el formulario del
        // modal ni parpadea la tabla con "Cargando…"), solo actualiza datos y estado.
        async function cargarCuenta(mesaId, silencioso = false) {
            if (!silencioso) {
                ocultarEstado();
                limpiarCamposCliente(); // evita que queden datos de la mesa anterior
                detalleBody.innerHTML = `
                    <tr><td colspan="4" class="text-center text-muted py-4">Cargando cuenta…</td></tr>`;
                btnGenerarFactura.disabled = true;
                delete btnGenerarFactura.dataset.mesaId;
            }

            try {
                const res = await fetch(`${API}/mesas/${mesaId}/cuenta`, { headers: authHeaders() });
                if (!res.ok) {
                    const msg = await res.text();
                    throw new Error(msg || `Error ${res.status}`);
                }

                const cuenta = await res.json();
                const { pedidos, total } = cuenta;
                const filas = pedidos.flatMap(p => p.detalles || []);

                ultimaCuenta = {
                    pedidos, total,
                    mesaCodigo: selectMesa.options[selectMesa.selectedIndex].textContent.trim()
                };

                if (filas.length === 0) {
                    detalleBody.innerHTML = `
                        <tr><td colspan="4" class="text-center text-muted py-4">
                            Esta mesa no tiene productos pendientes de cobro.
                        </td></tr>`;
                    cuentaTotal.textContent = fmt(0);
                    return;
                }

                detalleBody.innerHTML = filas.map(d => `
                    <tr>
                        <td>${d.cantidad}</td>
                        <td>${d.productoNombre}</td>
                        <td>${fmt(d.precioUnitario)}</td>
                        <td>${fmt(d.precioUnitario * d.cantidad)}</td>
                    </tr>`).join("");

                cuentaTotal.textContent = fmt(total);

                // ── La factura se habilita cuando ya no queda NADA pendiente de resolver ──
                // ★ FIX: antes se exigía que TODOS los platos, incluidos los "rechazados",
                // tuvieran estadoDetalle === "entregado". Como un plato rechazado nunca pasa
                // a "entregado", bastaba con que se rechazara un solo plato para dejar el
                // botón "Generar Factura" deshabilitado para siempre en esa mesa.
                // Ahora solo miramos los platos que aún NO están resueltos (ni entregados
                // ni rechazados); si no queda ninguno pendiente, se habilita la factura.
                const pendientes = filas.filter(
                    d => d.estadoDetalle !== "entregado" && d.estadoDetalle !== "rechazado"
                );
                const todoResuelto = filas.length > 0 && pendientes.length === 0;

                if (todoResuelto) {
                    btnGenerarFactura.disabled = false;
                    btnGenerarFactura.dataset.mesaId = mesaId;
                } else {
                    btnGenerarFactura.disabled = true;
                    mostrarEstado(
                        "Aún hay platos pendientes de entrega. La factura se habilita cuando todo el pedido haya sido entregado o rechazado.",
                        "warning"
                    );
                }

            } catch (err) {
                if (silencioso) {
                    // No pisamos lo que ya se ve en pantalla por un fallo puntual del auto-refresco.
                    console.warn("Auto-refresco de cuenta falló:", err.message);
                    return;
                }
                detalleBody.innerHTML = `
                    <tr><td colspan="4" class="text-center text-danger py-4">${err.message}</td></tr>`;
                cuentaTotal.textContent = fmt(0);
                mostrarEstado(err.message, "warning");
            }
        }

        // ── Rellenar el modal con los datos de la cuenta actual ─────
        function prepararModalFactura() {
            const filas = ultimaCuenta.pedidos.flatMap(p => p.detalles || []);

            modalDetalleBody.innerHTML = filas.length
                ? filas.map(d => `
                    <tr>
                        <td>${d.cantidad}</td>
                        <td>${d.productoNombre}</td>
                        <td>${fmt(d.precioUnitario)}</td>
                        <td>${(IGV_RATE * 100).toFixed(0)}%</td>
                        <td>${fmt(d.precioUnitario * d.cantidad)}</td>
                    </tr>`).join("")
                : `<tr><td colspan="5" class="text-center text-muted py-3">Sin productos</td></tr>`;

            // El total ya incluye IGV (precios finales al público) → se descompone.
            const total = Number(ultimaCuenta.total || 0);
            const subtotal = total / (1 + IGV_RATE);
            const igv = total - subtotal;

            modalSubtotal.textContent = fmt(subtotal);
            modalIgv.textContent = fmt(igv);
            modalCuentaTotal.textContent = fmt(total);

            document.getElementById("fFecha").value = new Date().toISOString().slice(0, 10);
            document.getElementById("fNumeroComprobante").value = generarNumeroComprobante();
            actualizarCamposPorTipo();
        }

        document.querySelectorAll('input[name="tipoComprobante"]').forEach(el => {
            el.addEventListener("change", () => {
                document.getElementById("fNumeroComprobante").value = generarNumeroComprobante();
                actualizarCamposPorTipo();
            });
        });

        // ── Construir e imprimir el comprobante con el formato final ─
        function imprimirComprobante(datosCliente) {
            const filas = ultimaCuenta.pedidos.flatMap(p => p.detalles || []);
            const esFactura = datosCliente.tipo === "factura";
            const tipo = esFactura ? "FACTURA" : "BOLETA DE VENTA";

            const total = Number(ultimaCuenta.total || 0);
            const subtotal = total / (1 + IGV_RATE);
            const igv = total - subtotal;

            const filasHtml = filas.map(d => `
                <tr>
                    <td>${d.cantidad}</td>
                    <td>${d.productoNombre}</td>
                    <td>${fmt(d.precioUnitario)}</td>
                    <td>${fmt(d.precioUnitario * d.cantidad)}</td>
                </tr>`).join("");

            // Boleta (persona natural): solo nombre + DNI. Factura: RUC + razón social.
            const lineaCliente = esFactura
                ? `<p>RUC: ${datosCliente.ruc || "-"}</p><p>Razón social: ${datosCliente.razonSocial || "-"}</p><p>Dirección fiscal: ${datosCliente.direccionFiscal || "-"}</p>`
                : `<p>Cliente: ${datosCliente.nombreCliente || "Sin nombre"}</p><p>DNI/Cédula: ${datosCliente.dni || "xx"}</p>`;

            const cuerpo = (etiquetaCopia) => `
                <div style="font-family:Arial, sans-serif; max-width:480px; margin:0 auto 24px;">
                    <h2 style="margin:0;color:#1b3a57;">Yaku</h2>
                    <div style="font-weight:600;color:#1b3a57;">Sabor Restaurante</div>
                    <hr>
                    <p><strong>${tipo}</strong> — N° ${datosCliente.numeroComprobante}</p>
                    <p>Fecha: ${datosCliente.fecha} &nbsp; | &nbsp; Mesa: ${ultimaCuenta.mesaCodigo}</p>
                    ${datosCliente.telefono ? `<p>Teléfono: ${datosCliente.telefono}</p>` : ""}
                    ${lineaCliente}
                    ${datosCliente.habilitacion ? `<p>Habilitación N°: ${datosCliente.habilitacion}</p>` : ""}
                    <table style="width:100%;border-collapse:collapse;font-size:.85rem;" border="1" cellpadding="6">
                        <thead>
                            <tr><th>Cant.</th><th>Descripción</th><th>P. unit.</th><th>Subtotal</th></tr>
                        </thead>
                        <tbody>${filasHtml}</tbody>
                        <tfoot>
                            <tr><th colspan="3" style="text-align:right;">Valor de venta</th><th>${fmt(subtotal)}</th></tr>
                            <tr><th colspan="3" style="text-align:right;">IGV (18%)</th><th>${fmt(igv)}</th></tr>
                            <tr><th colspan="3" style="text-align:right;">Total</th><th>${fmt(total)}</th></tr>
                        </tfoot>
                    </table>
                    <p style="margin-top:12px;font-size:.8rem;color:#666;">${etiquetaCopia}</p>
                </div>`;

            document.getElementById("printArea").innerHTML =
                cuerpo("Original — Cliente") +
                `<div class="print-copia">${cuerpo("Copia — Archivo tributario")}</div>`;

            window.print();
        }

        // ── Eventos ──────────────────────────────────────────────────
        selectMesa.addEventListener("change", () => {
            const mesaId = selectMesa.value;
            if (mesaId) {
                cargarCuenta(mesaId);
            } else {
                ocultarEstado();
                limpiarCamposCliente();
                delete btnGenerarFactura.dataset.mesaId;
                detalleBody.innerHTML = `
                    <tr><td colspan="4" class="text-center text-muted py-4">
                        Selecciona una mesa para ver su cuenta.
                    </td></tr>`;
                cuentaTotal.textContent = fmt(0);
                btnGenerarFactura.disabled = true;
            }
        });

        document.getElementById("btnRefrescarMesas").addEventListener("click", async () => {
            await cargarMesasOcupadas();
            // ★ FIX: si ya había una mesa seleccionada, hay que volver a pedir SU cuenta,
            // porque el <select> no dispara "change" al re-seleccionar el mismo valor,
            // y por eso el botón "Generar Factura" quedaba congelado con el estado viejo
            // aunque en cocina ya se marcara el plato como "entregado".
            if (selectMesa.value) {
                await cargarCuenta(selectMesa.value);
            }
        });

        // ★ FIX: auto-refresco silencioso de la cuenta de la mesa seleccionada, igual
        // que hace GestionCocina.js con los pedidos. Así el botón "Generar Factura" se
        // habilita solo apenas cocina marca el último plato como "entregado", sin que
        // el usuario tenga que tocar nada. Se omite mientras el modal está abierto para
        // no pisar los datos que el cajero está llenando (RUC, DNI, etc.).
        setInterval(() => {
            const modalAbierto = modalFacturaEl.classList.contains("show");
            if (selectMesa.value && !modalAbierto) {
                cargarCuenta(selectMesa.value, /* silencioso */ true);
            }
        }, 15000);

        modalFacturaEl.addEventListener("show.bs.modal", prepararModalFactura);

        btnConfirmarFactura.addEventListener("click", async () => {
            const mesaId = btnGenerarFactura.dataset.mesaId;
            if (!mesaId) return;

            const esFactura = document.getElementById("tipoFactura").checked;
            const fRuc = document.getElementById("fRuc");
            const fRazonSocial = document.getElementById("fRazonSocial");
            const fDireccionFiscal = document.getElementById("fDireccionFiscal");

            // ── Validación: solo lo requerido según el tipo de comprobante ──
            fRuc.classList.remove("is-invalid");
            fRazonSocial.classList.remove("is-invalid");
            fDireccionFiscal.classList.remove("is-invalid");

            if (esFactura) {
                const rucValido = /^\d{11}$/.test(fRuc.value.trim());
                const razonValida = fRazonSocial.value.trim().length > 0;
                const direccionValida = fDireccionFiscal.value.trim().length > 0;

                if (!rucValido) fRuc.classList.add("is-invalid");
                if (!razonValida) fRazonSocial.classList.add("is-invalid");
                if (!direccionValida) fDireccionFiscal.classList.add("is-invalid");

                if (!rucValido || !razonValida || !direccionValida) {
                    mostrarEstado(
                        "Para una factura, el RUC (11 dígitos), la razón social y la dirección fiscal son obligatorios.",
                        "warning"
                    );
                    return;
                }
            }

            const datosCliente = {
                tipo: esFactura ? "factura" : "boleta",
                numeroComprobante: document.getElementById("fNumeroComprobante").value,
                fecha: document.getElementById("fFecha").value,
                telefono: document.getElementById("fTelefono").value.trim(),
                ruc: fRuc.value.trim(),
                razonSocial: fRazonSocial.value.trim(),
                direccionFiscal: fDireccionFiscal.value.trim(),
                dni: document.getElementById("fDni").value.trim() || "xx",
                nombreCliente: document.getElementById("fNombreBoleta").value.trim() || "Sin nombre",
                habilitacion: document.getElementById("fHabilitacion").value.trim()
            };

            btnConfirmarFactura.disabled = true;
            btnConfirmarFactura.textContent = "Procesando…";

            try {
                const res = await fetch(`${API}/facturas`, {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify({
                        mesaId: parseInt(mesaId),
                        tipoComprobante: datosCliente.tipo,
                        numeroComprobante: datosCliente.numeroComprobante,
                        telefono: datosCliente.telefono,
                        ruc: datosCliente.ruc,
                        razonSocial: datosCliente.razonSocial,
                        direccionFiscal: datosCliente.direccionFiscal,
                        dni: datosCliente.dni,
                        nombreCliente: datosCliente.nombreCliente
                    })
                });

                if (!res.ok) {
                    const msg = await res.text();
                    throw new Error(msg || `Error ${res.status}`);
                }

                modalFactura.hide();
                mostrarEstado("✅ Factura generada. La mesa quedó libre.", "success");
                imprimirComprobante(datosCliente);
                await cargarMesasOcupadas();

                detalleBody.innerHTML = `
                    <tr><td colspan="4" class="text-center text-muted py-4">
                        Selecciona una mesa para ver su cuenta.
                    </td></tr>`;
                cuentaTotal.textContent = fmt(0);

            } catch (err) {
                mostrarEstado(`Error al generar la factura: ${err.message}`, "danger");
            } finally {
                btnConfirmarFactura.textContent = "Confirmar cobro y generar factura";
                btnConfirmarFactura.disabled = false;
            }
        });

        cargarMesasOcupadas();