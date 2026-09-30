document.addEventListener("DOMContentLoaded", () => {

    // --- MENÚ HAMBURGUESA (MÓVIL) ---
    const menuButton = document.getElementById("menu-button");
    const navMenu = document.querySelector(".nav");
    const enlacesNav = navMenu ? navMenu.querySelectorAll("a") : [];

    if (menuButton && navMenu) {
        // Abrir y cerrar al hacer clic en el botón hamburguesa
        menuButton.addEventListener("click", () => {
            navMenu.classList.toggle("nav-abierto");
            document.body.style.overflow = navMenu.classList.contains("nav-abierto") ? "hidden" : "";
        });

        // Cerrar menú automáticamente al hacer clic en cualquier enlace
        enlacesNav.forEach(enlace => {
            enlace.addEventListener("click", () => {
                navMenu.classList.remove("nav-abierto");
                document.body.style.overflow = "";
            });
        });
    }

    // --- LÓGICA PARA LAS PESTAÑAS (TABS) DE SERVICIOS ---
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("activo"));
            tabContents.forEach(c => c.classList.remove("activo"));
            btn.classList.add("activo");
            const targetId = btn.getAttribute("data-target");
            document.getElementById(targetId).classList.add("activo");
        });
    });

    // --- CARGA DEL MAPA SVG ---
    const contenedor = document.getElementById("mapa-container");

    fetch("assets/plano/alameda-yanamarca-mapa-web.svg")
        .then(respuesta => respuesta.text())
        .then(svg => {
            contenedor.innerHTML = svg;
            iniciarMapaInteractivo();
        })
        .catch(error => console.error("Error al cargar el mapa:", error));


    function iniciarMapaInteractivo() {
        const viewport = document.getElementById("viewport");
        const mapa = document.getElementById("mapa-container");
        const tarjetaInfo = document.getElementById("info-lote");
        const overlayModal = document.getElementById("overlay-modal");

        // 1. Variables para el movimiento
        let isDragging = false;
        let startX, startY;
        let translateX = 0, translateY = 0;
        let scale = 0.50;
        let didMove = false;

        function actualizarTransform() {
            mapa.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        }

        actualizarTransform();

        // Soporte Touch & Mouse sin bloquear el scroll de la página salvo que se arrastre el mapa
        viewport.addEventListener("pointerdown", (e) => {
            isDragging = true;
            didMove = false;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
        });

        window.addEventListener("pointermove", (e) => {
            if (!isDragging) return;
            const newX = e.clientX - startX;
            const newY = e.clientY - startY;
            if (Math.abs(newX - translateX) > 4 || Math.abs(newY - translateY) > 4) {
                didMove = true;
            }
            translateX = newX;
            translateY = newY;
            actualizarTransform();
        });

        window.addEventListener("pointerup", () => {
            isDragging = false;
        });

        // 2. Asignación de datos a los lotes
        const mapaLotes = {};
        const asignarLotes = (geometrias, manzana, inicio = 1) => {
            geometrias.forEach((geom, indice) => {
                mapaLotes[`lot-geom-${String(geom).padStart(3, "0")}`] =
                    `${manzana}-${String(inicio + indice).padStart(2, "0")}`;
            });
        };

        asignarLotes([88, 4, 3, 2, 1, 5, 6, 7, 8, 9, 10, 11, 12, 89, 13, 14, 15, 16, 91, 94, 66, 67, 68, 69, 70, 95, 93, 27, 92, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 90], "A");
        asignarLotes([49, 61, 58, 59, 60, 42, 43, 44, 45, 46, 47, 48, 50, 51, 87, 52, 53, 54, 55, 56, 57, 62, 63, 64, 65, 86, 28, 41], "B");
        asignarLotes([73, 72, 71, 85, 84, 74, 40, 39, 38, 37, 36, 75, 35, 34, 33, 32, 31, 76, 77, 78, 79, 80, 82, 81, 83, 30, 29], "C");

        // 3. Clics en los lotes
        const lotesPaths = document.querySelectorAll("#lotes-web path");
        let loteActivoAnterior = null;

        lotesPaths.forEach((path) => {
            const idGeometria = path.id;
            const numeroLote = mapaLotes[idGeometria];
            const datos = lotes[numeroLote];

            if (datos) {
                path.classList.add("manzana-" + datos.manzana);
                const bbox = path.getBBox();
                const centroX = bbox.x + (bbox.width / 2);
                const centroY = bbox.y + (bbox.height / 2);

                const textoSVG = document.createElementNS("http://www.w3.org/2000/svg", "text");
                textoSVG.setAttribute("x", centroX);
                textoSVG.setAttribute("y", centroY);
                textoSVG.setAttribute("class", "etiqueta-lote");
                textoSVG.textContent = datos.numero;
                path.parentNode.appendChild(textoSVG);
            }

            path.addEventListener("click", () => {
                if (didMove) return;
                if (!datos) return;

                if (loteActivoAnterior) loteActivoAnterior.classList.remove("activo");
                path.classList.add("activo");
                loteActivoAnterior = path;

                document.getElementById("estado-inicial").style.display = "none";
                document.getElementById("datos-lote").style.display = "block";

                tarjetaInfo.classList.add("mostrar-modal");
                overlayModal.classList.add("mostrar-modal");

                document.getElementById("lote-titulo").textContent = `Lote ${datos.numero} - Mz. ${datos.manzana}`;
                document.getElementById("lote-area").textContent = datos.area;
                document.getElementById("lote-perimetro").textContent = datos.perimetro;
                document.getElementById("medida-frente").textContent = datos.medidas.frente;
                document.getElementById("medida-izquierda").textContent = datos.medidas.izquierda;
                document.getElementById("medida-fondo").textContent = datos.medidas.fondo;
                document.getElementById("medida-derecha").textContent = datos.medidas.derecha;

                const precio = Number(datos.precioLista);
                document.getElementById("lote-precio").textContent = `S/ ${precio.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;

                const etiqueta = document.getElementById("lote-estado-etiqueta");
                etiqueta.textContent = datos.estado;
                etiqueta.className = "estado-etiqueta " + datos.estado.toLowerCase();

                const btnWsp = document.getElementById("boton-whatsapp");
                if (datos.estado === "Reservado") {
                    btnWsp.style.display = "none";
                } else {
                    btnWsp.style.display = "flex";
                    const mensaje = `¡Hola! Me interesa información para reservar el Lote ${datos.numero} de la Manzana ${datos.manzana} en Alameda de Yanamarca.`;
                    btnWsp.href = `https://wa.me/51968760846?text=${encodeURIComponent(mensaje)}`;
                }
            });
        });

        // 4. Cerrar detalles
        function cerrarModalLote() {
            document.getElementById("estado-inicial").style.display = "block";
            document.getElementById("datos-lote").style.display = "none";
            tarjetaInfo.classList.remove("mostrar-modal");
            overlayModal.classList.remove("mostrar-modal");

            if (loteActivoAnterior) {
                loteActivoAnterior.classList.remove("activo");
                loteActivoAnterior = null;
            }
        }

        document.getElementById("cerrar-lote").addEventListener("click", cerrarModalLote);
        overlayModal.addEventListener("click", cerrarModalLote);

        // 5. Función para centrar y encuadrar todo el plano
        function centrarMapaCompleto() {
            const vWidth = viewport.clientWidth;
            const vHeight = viewport.clientHeight;
            const mapaWidth = 1200; // Ancho base de tu mapa
            const mapaHeight = 900; // Alto aproximado del mapa

            // Calcular factor de escala para que entre completo
            scale = Math.min(vWidth / mapaWidth, vHeight / mapaHeight) *
                (window.innerWidth <= 768 ? 0.92 : 0.78);
            if (scale > 1.2) scale = 1;

            translateX = (vWidth - (mapaWidth * scale)) / 2;
            translateY = (vHeight - (mapaHeight * scale)) / 2 + (window.innerWidth <= 768 ? 30 : 0);

            actualizarTransform();
        }

        // 6. Pantalla completa y Toggle de Minimapa
        const btnAbrirFullscreen = document.getElementById("btn-abrir-pantalla-completa");
        const btnCerrarFullscreen = document.getElementById("btn-volver-normal");
        const minimapaWrapper = document.getElementById("minimapa-wrapper");
        const btnToggleMinimapa = document.getElementById("btn-toggle-minimapa");

        btnAbrirFullscreen.addEventListener("click", () => {
            document.body.classList.add("modo-fullscreen");
            setTimeout(centrarMapaCompleto, 80);
        });

        btnCerrarFullscreen.addEventListener("click", () => {
            document.body.classList.remove("modo-fullscreen");
            scale = 1;
            translateX = 0;
            translateY = 0;
            actualizarTransform();
            cerrarModalLote();
            if (minimapaWrapper) minimapaWrapper.classList.remove("abierto");
        });

        if (btnToggleMinimapa && minimapaWrapper) {
            btnToggleMinimapa.addEventListener("click", (e) => {
                e.stopPropagation();
                minimapaWrapper.classList.toggle("abierto");
            });
        }
    }

});