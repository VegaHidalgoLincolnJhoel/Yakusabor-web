/**
 * nav.js — Yaku Sabor
 * Navbar: transparente sobre el hero → blanco sólido al hacer scroll.
 * En páginas sin hero, arranca en estado sólido directamente.
 */

const navbar       = document.getElementById('mainNavbar');
const navLogo      = document.getElementById('navLogo');
const registerImg  = document.querySelector('.nav-register-image');

// Detecta si la página tiene hero banner
const hasHero = document.querySelector('.banner') !== null;

function updateNavbar() {
    if (!navbar) return;

    // Sin hero → siempre visible (estado scrolled desde el inicio)
    const scrolled = !hasHero || window.scrollY > 60;

    navbar.classList.toggle('scrolled', scrolled);

    // Logo: versión oscura cuando navbar es blanca
    if (navLogo && navLogo.dataset.logoScroll && navLogo.dataset.logoDefault) {
        navLogo.src = scrolled ? navLogo.dataset.logoScroll : navLogo.dataset.logoDefault;
    }

    // Imagen de registro
    if (registerImg && registerImg.dataset.registerScroll && registerImg.dataset.registerDefault) {
        registerImg.src = scrolled ? registerImg.dataset.registerScroll : registerImg.dataset.registerDefault;
    }
}

window.addEventListener('scroll', updateNavbar, { passive: true });
updateNavbar(); // Ejecutar inmediatamente al cargar

