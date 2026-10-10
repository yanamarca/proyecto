document.addEventListener("DOMContentLoaded", () => {

    // --- MENÚ HAMBURGUESA (MÓVIL) ---
    const menuButton = document.getElementById("menu-button");
    const navMenu = document.querySelector(".nav");
    const enlacesNav = navMenu ? navMenu.querySelectorAll("a") : [];

    if (menuButton && navMenu) {
        menuButton.addEventListener("click", () => {
            navMenu.classList.toggle("nav-abierto");
            document.body.style.overflow = navMenu.classList.contains("nav-abierto") ? "hidden" : "";
        });

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

        // 1. Variables para el movimiento y escala del mapa
        let isDragging = false;
        let startX, startY;
        let translateX = 0, translateY = 0;
        let scale = 0.65; // Zoom inicial mejorado
        let didMove = false;

        function actualizarTransform() {
            mapa.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        }

        // Posición inicial centrada un poco más abajo
        translateX = (viewport.clientWidth - (1200 * scale)) / 2;
        actualizarTransform();

        // Soporte Touch & Mouse para arrastrar el mapa
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

        // NUEVO: Zoom con la rueda del ratón
        viewport.addEventListener("wheel", (e) => {
            e.preventDefault();
            const zoomAmount = e.deltaY > 0 ? 0.9 : 1.1; // Si baja rueda, aleja. Si sube, acerca.
            scale *= zoomAmount;

            // Límites de zoom
            scale = Math.max(0.4, Math.min(scale, 3.5));
            actualizarTransform();
        }, { passive: false });

        // 2. Clics en los lotes y asginación de colores
        const lotesPaths = document.querySelectorAll("svg .lote");
        let loteActivoAnterior = null;

        lotesPaths.forEach((path) => {
            const numeroLote = path.id;
            const datos = lotes[numeroLote];

            if (!datos) return;

            // PINTAR EN EL MAPA SI ESTÁ VENDIDO O RESERVADO
            if (datos.estado === "Reservado") {
                path.classList.add("lote-reservado");
            } else if (datos.estado === "Vendido") {
                path.classList.add("lote-vendido");
            }

            path.addEventListener("click", () => {
                if (didMove) return;

                if (loteActivoAnterior) loteActivoAnterior.classList.remove("activo");
                path.classList.add("activo");
                loteActivoAnterior = path;

                document.getElementById("estado-inicial").style.display = "none";
                document.getElementById("datos-lote").style.display = "block";

                tarjetaInfo.classList.add("mostrar-modal");
                overlayModal.classList.add("mostrar-modal");

                // Estos datos SIEMPRE se muestran (Título, Área y Perímetro)
                document.getElementById("lote-titulo").textContent = `Lote ${datos.numero} - Mz. ${datos.manzana}`;
                document.getElementById("lote-area").textContent = datos.area;
                document.getElementById("lote-perimetro").textContent = datos.perimetro;

                // Medidas
                document.getElementById("medida-frente").textContent = datos.medidas.frente;
                document.getElementById("medida-izquierda").textContent = datos.medidas.izquierda;
                document.getElementById("medida-fondo").textContent = datos.medidas.fondo;
                document.getElementById("medida-derecha").textContent = datos.medidas.derecha;

                const precio = Number(datos.precioLista);
                document.getElementById("lote-precio").textContent = `S/ ${precio.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;

                const etiqueta = document.getElementById("lote-estado-etiqueta");
                etiqueta.textContent = datos.estado;
                etiqueta.className = "estado-etiqueta " + datos.estado.toLowerCase();

                // LÓGICA PARA OCULTAR INFO SI ESTÁ VENDIDO/RESERVADO
                const btnWsp = document.getElementById("boton-whatsapp");
                const divMedidas = document.querySelector(".medidas");
                const tituloMedidas = document.querySelector(".subtitulo-medidas");
                const divPrecio = document.querySelector(".precio");

                let msjNoDisponible = document.getElementById("mensaje-no-disponible");
                if (!msjNoDisponible) {
                    msjNoDisponible = document.createElement("div");
                    msjNoDisponible.id = "mensaje-no-disponible";
                    msjNoDisponible.style.textAlign = "center";
                    msjNoDisponible.style.padding = "20px";
                    msjNoDisponible.style.borderRadius = "12px";
                    msjNoDisponible.style.marginTop = "25px";
                    document.getElementById("datos-lote").insertBefore(msjNoDisponible, btnWsp);
                }

                if (datos.estado === "Reservado" || datos.estado === "Vendido") {
                    // Ocultamos botón, precio y medidas
                    btnWsp.style.display = "none";
                    divMedidas.style.display = "none";
                    tituloMedidas.style.display = "none";
                    divPrecio.style.display = "none";

                    // Mostramos el mensaje (Corregido para que no oculte el título del lote)
                    msjNoDisponible.style.display = "block";
                    msjNoDisponible.innerHTML = `
                        <span style="font-size:16px; font-weight:bold; display:block; margin-bottom:5px;">
                            Estado: ${datos.estado}
                        </span>
                        <span style="font-size:14px; font-weight:normal;">
                            La información de precio y medidas está oculta porque este lote ya no se encuentra disponible.
                        </span>`;

                    if (datos.estado === "Vendido") {
                        msjNoDisponible.style.background = "#e0e4e2";
                        msjNoDisponible.style.color = "#526158";
                    } else {
                        msjNoDisponible.style.background = "#fdf0ed";
                        msjNoDisponible.style.color = "#e74c3c";
                    }

                } else {
                    // Si está disponible, mostramos todo normal
                    btnWsp.style.display = "flex";
                    divMedidas.style.display = "grid";
                    tituloMedidas.style.display = "block";
                    divPrecio.style.display = "block";
                    msjNoDisponible.style.display = "none";

                    const mensaje = `¡Hola! Me interesa información para reservar el Lote ${datos.numero} de la Manzana ${datos.manzana} en Alameda de Yanamarca.`;
                    btnWsp.href = `https://wa.me/51968760846?text=${encodeURIComponent(mensaje)}`;
                }
            });
        });

        // ========================================
        // 3. SELECTOR DE MANZANAS (ZOOM AUTOMÁTICO)
        // ========================================

        const botonesManzana = document.querySelectorAll(".manzana-btn");

        function enfocarManzana(manzana) {
            const lotesManzana = document.querySelectorAll(`svg .lote[data-manzana="${manzana}"]`);
            if (!lotesManzana.length) return;

            const svg = mapa.querySelector("svg");
            if (!svg) return;

            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

            lotesManzana.forEach(path => {
                const bbox = path.getBBox();
                minX = Math.min(minX, bbox.x);
                minY = Math.min(minY, bbox.y);
                maxX = Math.max(maxX, bbox.x + bbox.width);
                maxY = Math.max(maxY, bbox.y + bbox.height);
            });

            const centroX = (minX + maxX) / 2;
            const centroY = (minY + maxY) / 2;
            const ancho = maxX - minX;
            const alto = maxY - minY;

            const viewBox = svg.viewBox.baseVal;
            const svgWidth = viewBox.width;

            const viewportWidth = viewport.clientWidth;
            const viewportHeight = viewport.clientHeight;

            const escalaBase = 1200 / svgWidth;
            const margen = 120;

            const escalaX = (viewportWidth - margen) / (ancho * escalaBase);
            const escalaY = (viewportHeight - margen) / (alto * escalaBase);

            scale = Math.min(escalaX, escalaY);
            scale = Math.max(0.65, Math.min(scale, 2.5));

            translateX = (viewportWidth / 2) - (centroX * escalaBase * scale);
            translateY = (viewportHeight / 2) - (centroY * escalaBase * scale);

            actualizarTransform();
        }

        botonesManzana.forEach(boton => {
            boton.addEventListener("click", () => {
                botonesManzana.forEach(b => b.classList.remove("activo"));
                boton.classList.add("activo");

                const manzanaSeleccionada = boton.getAttribute("data-manzana");

                mapa.classList.remove("manzana-A-seleccionada", "manzana-B-seleccionada", "manzana-C-seleccionada");
                mapa.classList.add("manzana-" + manzanaSeleccionada + "-seleccionada");

                if (window.innerWidth <= 768) {
                    document.querySelector(".lotes-explorador").classList.add("manzana-seleccionada");
                    document.getElementById("btn-volver-plano-general").classList.add("visible");
                }

                enfocarManzana(manzanaSeleccionada);
            });
        });

        document.getElementById("btn-volver-plano-general").addEventListener("click", () => {
            document.querySelector(".lotes-explorador").classList.remove("manzana-seleccionada");
            document.getElementById("btn-volver-plano-general").classList.remove("visible");
            if (typeof cerrarModalLote === "function") cerrarModalLote();
        });


        // ========================================
        // 4. FUNCIONES DEL MODAL Y PANTALLA COMPLETA
        // ========================================

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

        document.getElementById("cerrar-lote").addEventListener("click", cerrarModalLote);
        overlayModal.addEventListener("click", cerrarModalLote);

        // 👇👇👇 AGREGA ESTE BLOQUE NUEVO AQUÍ 👇👇👇
        // Cerrar tarjeta al tocar cualquier parte fuera del lote o de la tarjeta
        document.addEventListener("pointerdown", (e) => {
            // Si la tarjeta está visible...
            if (tarjetaInfo.classList.contains("mostrar-modal")) {
                // ...y el toque NO fue dentro de la tarjeta blanca
                // ...y el toque NO fue en otro lote dibujado en el mapa
                if (!tarjetaInfo.contains(e.target) && !e.target.closest('.lote')) {
                    cerrarModalLote();
                }
            }
        });

        // CORRECCIÓN PANTALLA COMPLETA
        function centrarMapaCompleto() {
            const vWidth = viewport.clientWidth;
            const mapaWidth = 1200;

            // Ya no encogemos el alto a la fuerza, solo ajustamos el ancho a la pantalla
            scale = (vWidth / mapaWidth) * (window.innerWidth <= 768 ? 1.5 : 1.1);
            if (scale > 2) scale = 2;

            translateX = (vWidth - (mapaWidth * scale)) / 2;
            translateY = 50; // Inicia un poco desde arriba

            actualizarTransform();
        }

        document.getElementById("btn-abrir-pantalla-completa").addEventListener("click", () => {
            document.body.classList.add("modo-fullscreen");
            setTimeout(centrarMapaCompleto, 80);
        });

        document.getElementById("btn-volver-normal").addEventListener("click", () => {
            document.body.classList.remove("modo-fullscreen");
            scale = 0.65;
            translateX = (viewport.clientWidth - (1200 * scale)) / 2;
            translateY = 0;
            actualizarTransform();
            cerrarModalLote();

            const minimapaWrapper = document.getElementById("minimapa-wrapper");
            if (minimapaWrapper) minimapaWrapper.classList.remove("abierto");
        });

        const btnToggleMinimapa = document.getElementById("btn-toggle-minimapa");
        if (btnToggleMinimapa) {
            btnToggleMinimapa.addEventListener("click", (e) => {
                e.stopPropagation();
                document.getElementById("minimapa-wrapper").classList.toggle("abierto");
            });
        }
    }
});