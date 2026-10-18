// 1. Menú para celulares
const botonMenu = document.getElementById("menu-btn");
const menu = document.getElementById("menu");

botonMenu.addEventListener("click", function() {
    menu.classList.toggle("activo");
});

// 2. Filtro de búsqueda
const buscador = document.getElementById("filtro");
const tarjetas = document.querySelectorAll(".tarjeta");

buscador.addEventListener("keyup", function() {
    const texto = buscador.value.toLowerCase();
    
    tarjetas.forEach(function(tarjeta) {
        const contenido = tarjeta.textContent.toLowerCase();
        if (contenido.includes(texto)) {
            tarjeta.style.display = "block";
        } else {
            tarjeta.style.display = "none";
        }
    });
});