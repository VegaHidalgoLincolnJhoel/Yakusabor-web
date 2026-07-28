// ==========================================
// LÓGICA DE SESIÓN Y FORMULARIOS (LOGIN/REGISTRO)
// ==========================================
// authHeaders(), resolveApiBaseUrl(), API_BASE_URL vienen de api-config.js
// clearSession() también viene de api-config.js
document.addEventListener("DOMContentLoaded", () => {
    const publicHomePath = "../../Principal/HTML/index.html";

    const clearSession = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("rol");
        localStorage.removeItem("nombre");
    };

    const setupPublicSessionUI = () => {
        const navSessionButton = document.querySelector(".nav-register-btn");
        if (!navSessionButton) return;

        const token = localStorage.getItem("token");
        const nombre = localStorage.getItem("nombre");
        const label = navSessionButton.querySelector("span");

        if (!token) {
            if (label) label.textContent = "Inicia Sesión";
            navSessionButton.setAttribute("data-bs-toggle", "modal");
            navSessionButton.setAttribute("data-bs-target", "#registroModal");
            return;
        }

        if (label) {
            label.textContent = nombre
                ? `${nombre} | Cerrar sesión`
                : "Cerrar sesión";
        }

        navSessionButton.removeAttribute("data-bs-toggle");
        navSessionButton.removeAttribute("data-bs-target");
        navSessionButton.setAttribute("aria-label", "Cerrar sesión");
        navSessionButton.addEventListener("click", (event) => {
            event.preventDefault();
            clearSession();
            window.location.href = publicHomePath;
        });
    };

    const switchModal = (fromModalId, toModalId) => {
        if (typeof bootstrap === "undefined") return;

        const fromModalElement = document.getElementById(fromModalId);
        const toModalElement = document.getElementById(toModalId);

        if (!fromModalElement || !toModalElement) return;

        const fromModal = bootstrap.Modal.getOrCreateInstance(fromModalElement);
        const toModal = bootstrap.Modal.getOrCreateInstance(toModalElement);

        const handleHidden = () => {
            fromModalElement.removeEventListener("hidden.bs.modal", handleHidden);
            toModal.show();
        };

        fromModalElement.addEventListener("hidden.bs.modal", handleHidden);
        fromModal.hide();
    };

    const linkToRegister = document.getElementById("linkToRegister");
    if (linkToRegister) {
        linkToRegister.addEventListener("click", (event) => {
            event.preventDefault();
            switchModal("registroModal", "crearCuentaModal");
        });
    }

    const linkToLogin = document.getElementById("linkToLogin");
    if (linkToLogin) {
        linkToLogin.addEventListener("click", (event) => {
            event.preventDefault();
            switchModal("crearCuentaModal", "registroModal");
        });
    }

    const loginForm =
        document.getElementById("loginForm") ||
        document.getElementById("exampleInputEmail1")?.closest("form");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = document.getElementById("exampleInputEmail1").value;
            const password = document.getElementById("exampleInputPassword1").value;

            try {
                // AQUÍ NO VA authHeaders() PORQUE ES EL LOGIN PÚBLICO
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email: email, password: password }),
                });

                if (response.ok) {
                    const data = await response.json();

                    localStorage.setItem("token", data.token);
                    localStorage.setItem("rol", data.rol);
                    localStorage.setItem("nombre", data.nombre);
                    setupPublicSessionUI();

                    alert(`¡Bienvenido/a, ${data.nombre}!`);
                    const rolAsignado = data.rol ? data.rol.trim().toLowerCase() : "";
                    console.log("Rol recibido desde el backend:", rolAsignado);

                    if (rolAsignado === "cliente" || rolAsignado.includes("cliente")) {
                        window.location.href = "../../Principal/HTML/index.html";
                    } else {
                        window.location.href = "../../Dashboard/HTML/Dashboard.html";
                    }
                } else {
                    alert(
                        "Correo o contraseña incorrectos. Por favor, intenta de nuevo.",
                    );
                }
            } catch (error) {
                console.error("Error de conexión:", error);
                alert(
                    "No se pudo conectar con el servidor. Verifica que el backend esté encendido.",
                );
            }
        });
    }

    const registerForm = document.getElementById("registerForm");

    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const nombre = document.getElementById("regNombre").value;
            const email = document.getElementById("regEmail").value;
            const password = document.getElementById("regPassword").value;
            const confirmPassword =
                document.getElementById("regConfirmPassword").value;

            if (password !== confirmPassword) {
                alert("Las contraseñas no coinciden. Inténtalo de nuevo.");
                return;
            }

            try {
                // AQUÍ TAMPOCO VA authHeaders() PORQUE ES EL REGISTRO PÚBLICO
                const response = await fetch(
                    `${API_BASE_URL}/auth/registro`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            nombre: nombre,
                            email: email,
                            password: password,
                        }),
                    },
                );

                if (response.ok) {
                    alert("¡Cuenta creada con éxito! Ahora puedes iniciar sesión.");
                    registerForm.reset();
                    switchModal("crearCuentaModal", "registroModal");
                } else {
                    const errorData = await response.text();
                    alert(`Error al registrarse: ${errorData}`);
                }
            } catch (error) {
                console.error("Error de conexión:", error);
                alert("No se pudo conectar con el servidor para el registro.");
            }
        });
    }

    // Inicializar UI al cargar la página
    setupPublicSessionUI();
});
