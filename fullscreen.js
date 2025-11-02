// Înlocuiește funcția isIOS() cu această versiune îmbunătățită
function isIOS() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /iPad|iPhone|iPod/.test(userAgent) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// Funcții simplificate pentru fullscreen (folosesc API-ul modern cu fallback)
function enterFullscreen(element) {
    if (element.requestFullscreen) {
        return element.requestFullscreen();
    }
    // Fallback pentru browsere vechi în ordine de prioritate
    return Promise.resolve(
        element.webkitRequestFullscreen?.() ||
        element.webkitEnterFullscreen?.() ||
        element.webkitEnterFullScreen?.() ||
        element.mozRequestFullScreen?.() ||
        element.msRequestFullscreen?.()
    ).catch(() => Promise.reject('Fullscreen nu este suportat'));
}

function exitFullscreen() {
    if (document.exitFullscreen) {
        return document.exitFullscreen();
    }
    // Fallback pentru browsere vechi
    return Promise.resolve(
        document.webkitExitFullscreen?.() ||
        document.webkitCancelFullScreen?.() ||
        document.mozCancelFullScreen?.() ||
        document.msExitFullscreen?.()
    ).catch(() => Promise.reject('Ieșirea din fullscreen nu este suportată'));
}

// Funcție centralizată pentru gestionarea overlay-ului
function updateOverlayVisibility(hide = false) {
    const carouselWrapper = document.querySelector('.carousel-wrapper');
    const overlay = carouselWrapper?.querySelector('.carousel-overlay');
    if (overlay) {
        overlay.style.display = hide ? 'none' : '';
        overlay.style.visibility = hide ? 'hidden' : '';
        overlay.style.position = '';
        overlay.style.left = '';
        overlay.style.top = '';
        overlay.style.zIndex = '';
    }
}

// Funcție pentru ascunderea header-ului și footer-ului pe mobil
function hideMobileElements() {
    const header = document.querySelector('.site-header');
    const footer = document.querySelector('footer');
    const mobileFooter = document.querySelector('.mobile-footer');

    if (header) {
        header.style.display = 'none';
        header.style.visibility = 'hidden';
        header.style.position = 'absolute';
        header.style.left = '-9999px';
        header.style.top = '-9999px';
        header.style.zIndex = '-1';
    }

    if (footer) {
        footer.style.display = 'none';
        footer.style.visibility = 'hidden';
        footer.style.position = 'absolute';
        footer.style.left = '-9999px';
        footer.style.top = '-9999px';
        footer.style.zIndex = '-1';
    }

    if (mobileFooter) {
        mobileFooter.style.display = 'none';
        mobileFooter.style.visibility = 'hidden';
        mobileFooter.style.position = 'absolute';
        mobileFooter.style.left = '-9999px';
        mobileFooter.style.top = '-9999px';
        mobileFooter.style.zIndex = '-1';
    }

}

// Funcție pentru restaurarea header-ului și footer-ului pe mobil
function showMobileElements() {
    const header = document.querySelector('.site-header');
    const footer = document.querySelector('footer');
    const mobileFooter = document.querySelector('.mobile-footer');

    if (header) {
        header.style.display = '';
        header.style.visibility = '';
        header.style.position = '';
        header.style.left = '';
        header.style.top = '';
        header.style.zIndex = '';
    }

    if (footer) {
        footer.style.display = '';
        footer.style.visibility = '';
        footer.style.position = '';
        footer.style.left = '';
        footer.style.top = '';
        footer.style.zIndex = '';
    }

    if (mobileFooter) {
        mobileFooter.style.display = '';
        mobileFooter.style.visibility = '';
        mobileFooter.style.position = '';
        mobileFooter.style.left = '';
        mobileFooter.style.top = '';
        mobileFooter.style.zIndex = '';
    }

}

// Funcția principală de toggle fullscreen pentru carusel
function toggleFullscreen() {
    const carouselWrapper = document.querySelector('.carousel-wrapper');
    if (!carouselWrapper) {
        return;
        return;
    }

    // Verificăm dacă suntem deja în fullscreen (orice metodă)
    const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.webkitCurrentFullScreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement ||
        carouselWrapper.classList.contains('carousel-fullscreen')
    );


    if (isCurrentlyFullscreen) {
        // Ieșim din fullscreen
        if (carouselWrapper.classList.contains('carousel-fullscreen')) {
            carouselWrapper.classList.remove('carousel-fullscreen');
            document.body.classList.remove('carousel-fullscreen-active');

            // Pe mobil, restaurăm header-ul și footer-ul
            if (window.innerWidth <= 1024) {
                showMobileElements();
            }

            updateOverlayVisibility(false); // Restaurăm overlay-ul
        } else {
            exitFullscreen().catch(console.error);
        }
    } else {
        // Intrăm în fullscreen
        if (isIOS()) {
            // Pe iOS încercăm API-ul, apoi fallback la CSS
            const requestFullscreen =
                carouselWrapper.requestFullscreen ||
                carouselWrapper.webkitRequestFullscreen ||
                carouselWrapper.webkitEnterFullscreen ||
                carouselWrapper.webkitEnterFullScreen;

            if (requestFullscreen) {
                requestFullscreen.call(carouselWrapper).catch(() => {
                    // Fallback la CSS dacă API-ul nu funcționează
                    carouselWrapper.classList.add('carousel-fullscreen');
                    document.body.classList.add('carousel-fullscreen-active');

                    // Pe mobil, ascundem imediat header-ul și footer-ul
                    if (window.innerWidth <= 1024) {
                        hideMobileElements();
                    }

                    updateOverlayVisibility(true);
                });
            } else {
                // Direct CSS dacă nu avem nicio metodă API
                carouselWrapper.classList.add('carousel-fullscreen');
                document.body.classList.add('carousel-fullscreen-active');

                // Pe mobil, ascundem imediat header-ul și footer-ul
                if (window.innerWidth <= 1024) {
                    hideMobileElements();
                }

                updateOverlayVisibility(true);
            }
        } else {
            // Pe alte browsere folosim API-ul standard
            enterFullscreen(carouselWrapper).catch(() => {
                // Fallback la CSS dacă API-ul nu funcționează
                carouselWrapper.classList.add('carousel-fullscreen');
                document.body.classList.add('carousel-fullscreen-active');

                // Pe mobil, ascundem imediat header-ul și footer-ul
                if (window.innerWidth <= 1024) {
                    hideMobileElements();
                }

                updateOverlayVisibility(true);
            });
        }
    }
}

// Gesturi pentru ieșirea din fullscreen pe iOS
if (isIOS()) {
    document.addEventListener('touchstart', function(e) {
        if (e.touches.length === 2) { // Pinch cu două degete
            const carouselWrapper = document.querySelector('.carousel-wrapper');
            if (carouselWrapper?.classList.contains('carousel-fullscreen')) {
                carouselWrapper.classList.remove('carousel-fullscreen');
                document.body.classList.remove('carousel-fullscreen-active');

                // Pe mobil, restaurăm header-ul și footer-ul
                if (window.innerWidth <= 1024) {
                    showMobileElements();
                }

                updateOverlayVisibility(false);
                console.log('Ieșit din fullscreen via pinch');
            } else {
                exitFullscreen().catch(console.error);
            }
        }
    }, { passive: true });
}

// Gestionăm schimbările de fullscreen pe toate browserele
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('MSFullscreenChange', handleFullscreenChange);

// Funcție pentru gestionarea schimbărilor de fullscreen
function handleFullscreenChange() {
    const carouselWrapper = document.querySelector('.carousel-wrapper');
    const isFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.webkitCurrentFullScreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement ||
        (carouselWrapper && carouselWrapper.classList.contains('carousel-fullscreen'))
    );

    // Pe mobil, ascundem manual header-ul și footer-ul când intrăm în fullscreen
    if (isFullscreen && window.innerWidth <= 1024) {
        const header = document.querySelector('.site-header');
        const footer = document.querySelector('footer');
        const mobileFooter = document.querySelector('.mobile-footer');

        if (header) {
            header.style.display = 'none';
            header.style.visibility = 'hidden';
            header.style.position = 'absolute';
            header.style.left = '-9999px';
            header.style.top = '-9999px';
            header.style.zIndex = '-1';
        }

        if (footer) {
            footer.style.display = 'none';
            footer.style.visibility = 'hidden';
            footer.style.position = 'absolute';
            footer.style.left = '-9999px';
            footer.style.top = '-9999px';
            footer.style.zIndex = '-1';
        }

        if (mobileFooter) {
            mobileFooter.style.display = 'none';
            mobileFooter.style.visibility = 'hidden';
            mobileFooter.style.position = 'absolute';
            mobileFooter.style.left = '-9999px';
            mobileFooter.style.top = '-9999px';
            mobileFooter.style.zIndex = '-1';
        }

        }

    // Gestionăm overlay-ul și clasa body în funcție de stare
    updateOverlayVisibility(isFullscreen);

    if (isFullscreen) {
        document.body.classList.add('carousel-fullscreen-active');
    } else {
        document.body.classList.remove('carousel-fullscreen-active');

        // Pe mobil, restaurăm header-ul și footer-ul când ieșim din fullscreen
        if (window.innerWidth <= 1024) {
            const header = document.querySelector('.site-header');
            const footer = document.querySelector('footer');
            const mobileFooter = document.querySelector('.mobile-footer');

            if (header) {
                header.style.display = '';
                header.style.visibility = '';
                header.style.position = '';
                header.style.left = '';
                header.style.top = '';
                header.style.zIndex = '';
            }

            if (footer) {
                footer.style.display = '';
                footer.style.visibility = '';
                footer.style.position = '';
                footer.style.left = '';
                footer.style.top = '';
                footer.style.zIndex = '';
            }

            if (mobileFooter) {
                mobileFooter.style.display = '';
                mobileFooter.style.visibility = '';
                mobileFooter.style.position = '';
                mobileFooter.style.left = '';
                mobileFooter.style.top = '';
                mobileFooter.style.zIndex = '';
            }

                }
    }

}

// Stilurile CSS pentru fullscreen (mai eficiente)
if (!document.querySelector('#carousel-fullscreen-style')) {
    const style = document.createElement('style');
    style.id = 'carousel-fullscreen-style';
    style.textContent = `
        .carousel-fullscreen {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 999999 !important;
            background: white !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            overflow: hidden !important;
        }

        .carousel-fullscreen .carousel {
            width: 100% !important;
            height: calc(100% - 60px) !important; /* Reducem înălțimea pentru a face loc pentru dots */
            position: relative !important;
        }

        .carousel-fullscreen .carousel-slide {
            width: 100vw !important;
            height: calc(100vh - 60px) !important; /* Ajustăm înălțimea pentru a face loc pentru dots */
            object-fit: contain !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
        }

        /* Stiluri pentru dots în modul fullscreen */
        .carousel-fullscreen .carousel-dots-fullscreen {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            display: flex !important;
            justify-content: center !important;
            z-index: 2147483648 !important;
            padding: 15px 0 !important;
            background-color: rgba(0, 0, 0, 0.5) !important;
            backdrop-filter: blur(5px) !important;
        }

        .carousel-fullscreen .carousel-dots-fullscreen .carousel-dot {
            width: 10px !important;
            height: 10px !important;
            border-radius: 50% !important;
            background-color: rgba(255, 255, 255, 0.5) !important;
            margin: 0 6px !important;
            cursor: pointer !important;
            border: 2px solid transparent !important;
            padding: 0 !important;
            transition: all 0.3s ease !important;
        }

        .carousel-fullscreen .carousel-dots-fullscreen .carousel-dot:hover,
        .carousel-fullscreen .carousel-dots-fullscreen .carousel-dot.active {
            background-color: #fff !important;
            transform: scale(1.2);
        }

        body.carousel-fullscreen-active {
            overflow: hidden !important;
            position: fixed !important;
            width: 100% !important;
            height: 100% !important;
        }

        @media screen and (max-width: 1024px) {
            .carousel-fullscreen {
                z-index: 2147483647 !important; /* Valoare maximă posibilă pentru z-index */
            }

            /* Forțăm ascunderea header-ului și footer-ului pe mobil în fullscreen */
            .carousel-fullscreen ~ header,
            .carousel-fullscreen ~ footer,
            .carousel-fullscreen ~ .mobile-footer,
            .carousel-fullscreen ~ .site-header {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                position: absolute !important;
                left: -9999px !important;
                top: -9999px !important;
                z-index: -1 !important;
            }

                  }
    `;
    document.head.appendChild(style);
}