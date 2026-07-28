// Navbar: cambia estilos y logos al hacer scroll con verificaciones seguras
const navbar = document.getElementById('mainNavbar');
const navLogo = document.getElementById('navLogo');
const registerImage = document.querySelector('.nav-register-image');

function updateNavbarOnScroll() {
    const isScrolled = window.scrollY > 10;
    if (navbar) {
        navbar.classList.toggle('navbar-scrolled', isScrolled);
    }
    if (navLogo && navLogo.dataset && navLogo.dataset.logoScroll && navLogo.dataset.logoDefault) {
        navLogo.src = isScrolled ? navLogo.dataset.logoScroll : navLogo.dataset.logoDefault;
    }
    if (registerImage && registerImage.dataset && registerImage.dataset.registerScroll && registerImage.dataset.registerDefault) {
        registerImage.src = isScrolled ? registerImage.dataset.registerScroll : registerImage.dataset.registerDefault;
    }
}

window.addEventListener('scroll', updateNavbarOnScroll);
updateNavbarOnScroll();
