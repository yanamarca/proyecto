/* =========================
   AVANCES DE OBRA
   Pegar al final de js/main.js (o cargar como js/avances.js)
========================= */
document.addEventListener("DOMContentLoaded", () => {
    const seccion = document.getElementById("avances");
    if (!seccion) return;

    const tabs = seccion.querySelectorAll(".avance-tab");
    const paneles = seccion.querySelectorAll(".avance-panel");

    /* ---------- PESTAÑAS ---------- */
    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            tabs.forEach((t) => t.classList.remove("activo"));
            paneles.forEach((p) => p.classList.remove("activo"));

            tab.classList.add("activo");
            const panel = document.getElementById(tab.dataset.target);
            panel.classList.add("activo");

            // Siempre vuelve a la primera foto al cambiar de pestaña
            const track = panel.querySelector(".avance-track");
            track.style.scrollBehavior = "auto";
            track.scrollLeft = 0;
            track.style.scrollBehavior = "";
            panel.dispatchEvent(new Event("avance:mostrado"));
        });
    });

    /* ---------- CARRUSELES ---------- */
    paneles.forEach((panel) => {
        const track = panel.querySelector(".avance-track");
        const slides = track.querySelectorAll(".avance-slide");
        const prev = panel.querySelector(".prev");
        const next = panel.querySelector(".next");
        const dotsBox = panel.querySelector(".avance-dots");
        const contador = panel.querySelector(".avance-contador");

        // Crear puntos
        slides.forEach((_, i) => {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.className = "avance-dot";
            dot.setAttribute("aria-label", "Ir a la foto " + (i + 1));
            dot.addEventListener("click", () => irA(i));
            dotsBox.appendChild(dot);
        });
        const dots = dotsBox.querySelectorAll(".avance-dot");

        const indiceActual = () =>
            Math.round(track.scrollLeft / (track.clientWidth || 1));

        function irA(i) {
            const destino = Math.max(0, Math.min(i, slides.length - 1));
            track.scrollTo({ left: destino * track.clientWidth });
        }

        function actualizar() {
            const i = indiceActual();
            dots.forEach((d, n) => d.classList.toggle("activo", n === i));
            contador.textContent = (i + 1) + " / " + slides.length;
        }

        prev.addEventListener("click", () => {
            // Si está en la primera, salta a la última
            const i = indiceActual();
            irA(i === 0 ? slides.length - 1 : i - 1);
        });
        next.addEventListener("click", () => {
            const i = indiceActual();
            irA(i === slides.length - 1 ? 0 : i + 1);
        });

        track.addEventListener("scroll", actualizar, { passive: true });
        panel.addEventListener("avance:mostrado", actualizar);
        window.addEventListener("resize", actualizar);
        actualizar();
    });

    /* ---------- LIGHTBOX ---------- */
    const lightbox = document.getElementById("avance-lightbox");
    const lightboxImg = lightbox.querySelector("img");
    const cerrar = lightbox.querySelector(".avance-lightbox-cerrar");

    seccion.querySelectorAll(".avance-slide img").forEach((img) => {
        img.addEventListener("click", () => {
            lightboxImg.src = img.currentSrc || img.src;
            lightboxImg.alt = img.alt;
            lightbox.classList.add("abierto");
        });
    });

    const cerrarLightbox = () => lightbox.classList.remove("abierto");
    cerrar.addEventListener("click", cerrarLightbox);
    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) cerrarLightbox();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") cerrarLightbox();
    });
});