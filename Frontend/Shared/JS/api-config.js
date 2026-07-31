(function (global) {
    function resolveApiBaseUrl() {
        const override = global.__API_BASE_URL__ || localStorage.getItem("apiBaseUrl");
        if (override) {
            return override.replace(/\/$/, "");
        }

        const { origin, hostname, protocol } = global.location;

        if (hostname.endsWith(".app.github.dev") || hostname.endsWith(".githubpreview.dev")) {
            return origin
                .replace(/-(\d+)\.app\.github\.dev$/, "-8080.app.github.dev")
                .replace(/-(\d+)\.githubpreview\.dev$/, "-8080.githubpreview.dev") + "/api";
        }

        // Si se ejecuta en Vercel o cualquier dominio remoto que no sea localhost
        if (hostname.endsWith(".vercel.app") || (!hostname.includes("localhost") && !hostname.includes("127.0.0.1"))) {
            return "https://yakusabor-web.onrender.com/api";
        }

        return `${protocol}//${hostname}:8080/api`;
    }

    function authHeaders() {
        const token = localStorage.getItem("token");
        return {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        };
    }

    function clearSession() {
        localStorage.removeItem("token");
        localStorage.removeItem("rol");
        localStorage.removeItem("nombre");
    }

    global.API_BASE_URL = resolveApiBaseUrl();
    global.resolveApiBaseUrl = resolveApiBaseUrl;
    global.authHeaders = authHeaders;
    global.clearSession = clearSession;
})(window);