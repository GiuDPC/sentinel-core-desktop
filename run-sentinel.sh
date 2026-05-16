#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# run-sentinel.sh — Lanzador para Sentinel Core en Linux
# ═══════════════════════════════════════════════════════════════
# Resuelve el error "Could not create default EGL display"
# que ocurre en algunas GPUs (AMD, Intel) con WebKitGTK.
#
# USO:
#   chmod +x run-sentinel.sh
#   ./run-sentinel.sh
#
# También podés pasar argumentos:
#   ./run-sentinel.sh --help      # Muestra esta ayuda
#   ./run-sentinel.sh --gpu       # Intenta con aceleración GPU (default: software)
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

APPIMAGE="Sentinel.AppImage"
HELP=false
USE_GPU=false

# ─── Parsear argumentos ───
for arg in "$@"; do
    case "$arg" in
        --help|-h)
            HELP=true
            ;;
        --gpu)
            USE_GPU=true
            ;;
        *)
            echo "❌ Argumento desconocido: $arg"
            echo "   Usá --help para ver las opciones."
            exit 1
            ;;
    esac
done

if $HELP; then
    echo ""
    echo "╔══════════════════════════════════════════════╗"
    echo "║   Sentinel Core — Lanzador para Linux       ║"
    echo "╚══════════════════════════════════════════════╝"
    echo ""
    echo "USO:"
    echo "  ./run-sentinel.sh [--gpu]"
    echo ""
    echo "OPCIONES:"
    echo "  --gpu   Intenta con aceleración GPU (no recomendado si"
    echo "          tiró el error EGL_BAD_PARAMETER antes)"
    echo "  --help  Muestra esta ayuda"
    echo ""
    echo "SIN --gpu (default): Fuerza software rendering"
    echo "  - WEBKIT_DISABLE_COMPOSITING_MODE=1"
    echo "  - LIBGL_ALWAYS_SOFTWARE=1"
    echo "  - GALLIUM_DRIVER=llvmpipe"
    echo "  - GDK_BACKEND=x11"
    echo ""
    echo "¿Sigue sin funcionar?"
    echo "  https://github.com/GiuDPC/sentinel-core-desktop/issues"
    echo ""
    exit 0
fi

# ─── Verificar que el AppImage existe ───
if [ ! -f "$APPIMAGE" ]; then
    echo "❌ No se encuentra $APPIMAGE en el directorio actual."
    echo "   Descargalo desde: https://github.com/GiuDPC/sentinel-core-desktop/releases"
    exit 1
fi

# ─── Dar permisos de ejecución ───
if [ ! -x "$APPIMAGE" ]; then
    echo "🔧 Dando permisos de ejecución a $APPIMAGE..."
    chmod +x "$APPIMAGE"
fi

# ─── Configurar variables de entorno ───
if $USE_GPU; then
    echo "🚀 Iniciando con aceleración GPU (modo --gpu)..."
else
    echo "🚀 Iniciando con software rendering (compatible)..."
    echo "   Si querés aceleración GPU, usá: ./run-sentinel.sh --gpu"
    echo ""

    # ─── Fuerza software rendering en Mesa/AMD/Intel ───
    export LIBGL_ALWAYS_SOFTWARE=1
    export GALLIUM_DRIVER=llvmpipe

    # ─── Desactiva compositing de WebKit (EGL fallback) ───
    export WEBKIT_DISABLE_COMPOSITING_MODE=1

    # ─── Desactiva DMA-BUF (causa común de EGL_BAD_PARAMETER en GPUs viejas) ───
    export WEBKIT_DISABLE_DMABUF=1

    # ─── Fuerza backend X11 (Wayland a veces da problemas con AppImages) ───
    export GDK_BACKEND=x11
fi

# ─── Ejecutar ───
echo "════════════════════════════════════════════════"
echo "  Sentinel Core — Versión 1.0.0"
echo "════════════════════════════════════════════════"
echo ""

"$(dirname "$0")/$APPIMAGE"
