
const PRODUCTS_API_URL = `${API_BASE_URL}/productos`;
const ORDERS_API_URL = `${API_BASE_URL}/pedidos`;
const categoryConfig = {
    piqueos: {
        title: "Piqueos & Entradas",
        description: "Entradas ligeras para abrir el apetito."
    },
    sandwiches: {
        title: "Sándwiches",
        description: "Opciones rápidas y sabrosas para cualquier momento."
    },
    fondos: {
        title: "Platos de Fondo",
        description: "Nuestros platos principales con sazón marina y criolla."
    },
    postres: {
        title: "Postres",
        description: "Dulces para cerrar tu experiencia con broche de oro."
    },
    bebidas: {
        title: "Bebidas",
        description: "Refrescos y bebidas para acompañar tu pedido."
    }
};
const menuData = {};

const cart = new Map();
const formatter = new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2
});

// Elementos del DOM
const menuModalElement = document.getElementById("menuModal");
const menuItemsContainer = document.getElementById("menuItems");
const cartItemsContainer = document.getElementById("cartItems");
const cartTotalElement = document.getElementById("cartTotal");
const menuModalLabel = document.getElementById("menuModalLabel");
const menuModalDescription = document.getElementById("menuModalDescription");
const submitOrderButton = document.getElementById("submitOrderButton");
const menuStatusElement = document.getElementById("menuStatus");

const menuModal = menuModalElement ? new bootstrap.Modal(menuModalElement) : null;
const categoryButtons = document.querySelectorAll(".categoria-btn");

// --- FUNCIONES DE UTILIDAD Y CARGA ---

const normalizeText = (value) =>
    String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();

const resetMenuData = () => {
    Object.keys(menuData).forEach((key) => delete menuData[key]);
    Object.entries(categoryConfig).forEach(([key, config]) => {
        menuData[key] = {
            ...config,
            items: []
        };
    });
};

const mapCategoryKey = (categoryName) => {
    const normalizedCategory = normalizeText(categoryName);
    if (normalizedCategory.includes("piqueo") || normalizedCategory.includes("entrada")) return "piqueos";
    if (normalizedCategory.includes("sandwich")) return "sandwiches";
    if (normalizedCategory.includes("fondo") || normalizedCategory.includes("plato")) return "fondos";
    if (normalizedCategory.includes("postre")) return "postres";
    if (normalizedCategory.includes("bebida")) return "bebidas";
    return "";
};

const updateCategoryButtonsUI = () => {
    categoryButtons.forEach((button) => {
        const categoryKey = button.dataset.category;
        const category = menuData[categoryKey];
        const hasItems = Boolean(category && category.items.length > 0);
        const labelElement = button.querySelector("span");

        button.disabled = !hasItems;
        button.classList.toggle("disabled", !hasItems);

        if (labelElement && category) {
            labelElement.textContent = category.title;
        }
    });
};

const setMenuStatus = (message, isError = false) => {
    if (!menuStatusElement) return;
    menuStatusElement.textContent = message;
    menuStatusElement.classList.toggle("text-danger", isError);
};

const calculateCartTotal = () =>
    Array.from(cart.values()).reduce(
        (sum, item) => sum + item.price * (item.quantity || 1),
        0
    );

const readErrorMessage = async (response) => {
    const fallbackMessage = "No se pudo registrar el pedido.";
    try {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
            const data = await response.json();
            return data.mensaje || data.message || data.detail || data.title || fallbackMessage;
        }
        return (await response.text()) || fallbackMessage;
    } catch {
        return fallbackMessage;
    }
};

const mapProductsToMenuData = (products) => {
    resetMenuData();
    products
        .filter((product) => product && product.disponible)
        .forEach((product) => {
            const categoryName = product.categoria && product.categoria.nombre;
            const categoryKey = mapCategoryKey(categoryName);
            if (!categoryKey || !menuData[categoryKey]) return;

            menuData[categoryKey].items.push({
                id: product.id,
                name: product.nombre,
                description: product.descripcion || "",
                price: Number(product.precio) || 0
            });
        });
};

const loadMenuData = async () => {
    try {
        const response = await fetch(PRODUCTS_API_URL, {
            method: "GET",
            headers: authHeaders() // <--- INTEGRADO AQUÍ (opcional para GET, pero buena práctica)
        });
        if (!response.ok) throw new Error(`Error ${response.status}`);
        const products = await response.json();
        mapProductsToMenuData(products);
        updateCategoryButtonsUI();
        setMenuStatus("Menú actualizado.");
    } catch (error) {
        console.error("Error al cargar productos:", error);
        resetMenuData();
        updateCategoryButtonsUI();
        setMenuStatus("No se pudo cargar el menú.", true);
    }
};

const updateCartUI = () => {
    cartItemsContainer.innerHTML = "";
    if (cart.size === 0) {
        cartItemsContainer.innerHTML = '<li class="text-muted">Aún no agregas platos.</li>';
    } else {
        cart.forEach((item) => {
            const listItem = document.createElement("li");
            listItem.className = "d-flex justify-content-between align-items-center mb-2";
            listItem.innerHTML = `
                <span>${item.name} <span class="badge bg-secondary">×${item.quantity}</span></span>
                <strong class="menu-price">${formatter.format(item.price * item.quantity)}</strong>
            `;
            cartItemsContainer.appendChild(listItem);
        });
    }
    cartTotalElement.textContent = formatter.format(calculateCartTotal());
};

const renderMenuItems = (categoryKey) => {
    const category = menuData[categoryKey];
    if (!category || category.items.length === 0) return;

    menuModalLabel.textContent = category.title;
    menuModalDescription.textContent = category.description;
    menuItemsContainer.innerHTML = "";

    category.items.forEach((item) => {
        const wrapper = document.createElement("div");
        wrapper.className = "menu-item d-flex justify-content-between align-items-center";

        const enCarrito = cart.has(item.id);
        const cantidad  = enCarrito ? cart.get(item.id).quantity : 0;

        wrapper.innerHTML = `
            <div class="me-3">
                <h6 class="mb-0">${item.name}</h6>
                <small class="text-muted">${item.description}</small>
            </div>
            <div class="d-flex align-items-center gap-2 flex-shrink-0">
                <span class="menu-price">${formatter.format(item.price)}</span>
                <div class="input-group input-group-sm" style="width:110px;">
                    <button class="btn btn-outline-secondary btn-qty" data-action="menos" data-item-id="${item.id}" type="button">−</button>
                    <span class="input-group-text justify-content-center qty-display" style="min-width:36px;">
                        ${cantidad}
                    </span>
                    <button class="btn btn-outline-primary btn-qty" data-action="mas" data-item-id="${item.id}" type="button">+</button>
                </div>
            </div>
        `;

        // Delegar eventos en los botones +/−
        wrapper.querySelectorAll(".btn-qty").forEach(btn => {
            btn.addEventListener("click", () => {
                const action  = btn.dataset.action;
                const current = cart.has(item.id) ? cart.get(item.id).quantity : 0;
                const next    = action === "mas" ? current + 1 : Math.max(0, current - 1);

                if (next === 0) {
                    cart.delete(item.id);
                } else {
                    cart.set(item.id, { ...item, quantity: next });
                }

                // Actualiza el display sin rerenderizar todo el modal
                wrapper.querySelector(".qty-display").textContent = next;
                updateCartUI();
            });
        });

        menuItemsContainer.appendChild(wrapper);
    });
    menuModal.show();
};

categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const categoryKey = button.dataset.category;
        renderMenuItems(categoryKey);
    });
});

// ==========================================
// LÓGICA DE CHECKOUT (INTEGRADA)
// ==========================================
const checkoutModalElement = document.getElementById("checkoutModal");
const checkoutModal = checkoutModalElement ? new bootstrap.Modal(checkoutModalElement) : null;

const radioPresencial = document.getElementById("tipoPresencial");
const radioDelivery = document.getElementById("tipoDelivery");
const seccionPresencial = document.getElementById("seccionPresencial");
const seccionDelivery = document.getElementById("seccionDelivery");
const confirmCheckoutBtn = document.getElementById("confirmCheckoutBtn");

// Mostrar/Ocultar campos según el tipo de pedido
if (radioPresencial && radioDelivery) {
    radioPresencial.addEventListener("change", () => {
        seccionPresencial.classList.remove("d-none");
        seccionDelivery.classList.add("d-none");
    });

    radioDelivery.addEventListener("change", () => {
        seccionDelivery.classList.remove("d-none");
        seccionPresencial.classList.add("d-none");
    });
}

// Abrir el modal de Checkout desde el carrito
if (submitOrderButton) {
    submitOrderButton.addEventListener("click", async() => {
        if (cart.size === 0) {
            alert("Agrega al menos un plato al carrito antes de enviar el pedido.");
            return;
        }
        
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Por favor, inicia sesión para realizar un pedido.");
            return;
        }
        await cargarMesasEnSelect(); 
        
        if (checkoutModal) checkoutModal.show();
    });
}

// Confirmar y enviar el pedido a Spring Boot
if (confirmCheckoutBtn) {
    confirmCheckoutBtn.addEventListener("click", async () => {
        const tipo = radioPresencial.checked ? "presencial" : "delivery";
        let mesaId = null;
        let direccion = null;

        if (tipo === "presencial") {
            const mesaInput = document.getElementById("numeroMesa");
            mesaId = mesaInput ? mesaInput.value : null;
            if (!mesaId) {
                alert("Por favor, selecciona tu número de mesa.");
                return;
            }
        } else {
            const dirInput = document.getElementById("direccionDelivery");
            direccion = dirInput ? dirInput.value.trim() : null;
            if (!direccion) {
                alert("Por favor, ingresa una dirección para el delivery.");
                return;
            }
        }

        const payload = {
            tipoPedido: tipo,
            mesaId: mesaId ? parseInt(mesaId) : null,
            direccion: direccion,
            items: Array.from(cart.values()).map((item) => ({
                productoId: item.id,
                cantidad: item.quantity || 1,
                precioUnitario: item.price
            })),
            total: calculateCartTotal()
        };

        confirmCheckoutBtn.disabled = true;
        confirmCheckoutBtn.textContent = "Registrando...";

        try {
            const response = await fetch(ORDERS_API_URL, {
                method: "POST",
                headers: authHeaders(), // <--- INTEGRADO AQUÍ (El token se inyecta para proteger el POST)
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(await readErrorMessage(response));
            }

            const pedidoRegistrado = await response.json();
            const numeroPedido = pedidoRegistrado.id ? ` #${pedidoRegistrado.id}` : "";

            alert(`¡Pedido${numeroPedido} registrado con éxito! Tu orden llegará a la cocina en breve.`);
            if (checkoutModal) checkoutModal.hide();

            cart.clear();
            updateCartUI();

            const mesaInput = document.getElementById("numeroMesa");
            const dirInput = document.getElementById("direccionDelivery");
            if (mesaInput) mesaInput.value = "";
            if (dirInput) dirInput.value = "";
        } catch (error) {
            console.error("Error al registrar pedido:", error);
            alert(error.message || "No se pudo registrar el pedido. Verifica que el backend esté encendido.");
        } finally {
            confirmCheckoutBtn.disabled = false;
            confirmCheckoutBtn.textContent = "Confirmar Pedido";
        }
    });
}
// ── Cargar mesas libres desde la API ──────────────────────────────────────
const MESAS_API_URL = `${API_BASE_URL}/mesas/estado`;

async function cargarMesasEnSelect() {
  const select = document.getElementById("numeroMesa");
  if (!select) return;

  select.innerHTML = '<option value="" disabled selected>Cargando mesas…</option>';

  try {
    const response = await fetch(MESAS_API_URL, {
      method: "GET",
      headers: authHeaders()
    });
    if (!response.ok) throw new Error(`Error ${response.status}`);

    const mesas = await response.json();
    const libres = mesas.filter(m => m.libre);

    if (libres.length === 0) {
      select.innerHTML = '<option value="" disabled selected>No hay mesas disponibles</option>';
      return;
    }

    select.innerHTML = '<option value="" disabled selected>Selecciona tu mesa…</option>';
    libres.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.id;
      // Capitaliza la ubicación: "interior" → "Interior"
      const ubicacion = m.ubicacion
        ? m.ubicacion.charAt(0).toUpperCase() + m.ubicacion.slice(1)
        : "";
      opt.textContent = `Mesa ${m.codigo}${ubicacion ? ` (${ubicacion})` : ""}`;
      select.appendChild(opt);
    });
  } catch (error) {
    console.error("Error al cargar mesas:", error);
    select.innerHTML = '<option value="" disabled selected>Error al cargar mesas</option>';
  }
}
// Inicialización
updateCartUI();
resetMenuData();
updateCategoryButtonsUI();
loadMenuData();