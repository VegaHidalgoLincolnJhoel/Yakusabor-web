// Navbar: cambia estilos y logos al hacer scroll.
const navbar = document.getElementById('mainNavbar');
const navLogo = document.getElementById('navLogo');
const registerImage = document.querySelector('.nav-register-image');

function updateNavbarOnScroll() {
    const isScrolled = window.scrollY > 10;
    navbar.classList.toggle('navbar-scrolled', isScrolled);
    navLogo.src = isScrolled ? navLogo.dataset.logoScroll : navLogo.dataset.logoDefault;
    registerImage.src = isScrolled ? registerImage.dataset.registerScroll : registerImage.dataset.registerDefault;
}

window.addEventListener('scroll', updateNavbarOnScroll);
updateNavbarOnScroll();
