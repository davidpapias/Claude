/* ===================================
   VIRAL AD REPLICATOR - Engine
   =================================== */

(function () {
    'use strict';

    // ── State ──────────────────────────────────────────
    const state = {
        originalImage: null,
        productImage: null,
        template: 'feed',       // feed | story | landscape | portrait
        layout: 'overlay',      // overlay | split-top | split-bottom | minimal
        headline: '',
        subheadline: '',
        ctaText: 'Comprar Ahora',
        bodyText: '',
        badgeText: '-50% HOY',
        primaryColor: '#FF6B35',
        accentColor: '#FFFFFF',
        bgColor: '#000000',
        overlayOpacity: 0.45,
        fontFamily: 'Inter',
        productX: 50,
        productY: 50,
        productScale: 100,
        effects: {
            glow: true,
            badge: true,
            gradient: false,
            border: false
        },
        exportSize: 1080
    };

    // ── Canvas dimensions per template ─────────────────
    const DIMENSIONS = {
        feed:      { w: 1080, h: 1080 },
        story:     { w: 1080, h: 1920 },
        landscape: { w: 1920, h: 1080 },
        portrait:  { w: 1080, h: 1350 }
    };

    // ── DOM References ─────────────────────────────────
    const canvas = document.getElementById('adCanvas');
    const ctx = canvas.getContext('2d');

    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // Upload
    const uploadZone = $('#uploadZone');
    const fileInput = $('#fileInput');
    const originalPreview = $('#originalPreview');
    const uploadContent = $('#uploadContent');

    // Product upload
    const productUploadZone = $('#productUploadZone');
    const productFileInput = $('#productFileInput');
    const productPreview = $('#productPreview');
    const productUploadContent = $('#productUploadContent');

    // Text inputs
    const headlineInput = $('#headline');
    const subheadlineInput = $('#subheadline');
    const ctaTextInput = $('#ctaText');
    const bodyTextInput = $('#bodyText');
    const badgeTextInput = $('#badgeText');

    // Style controls
    const primaryColorInput = $('#primaryColor');
    const accentColorInput = $('#accentColor');
    const bgColorInput = $('#bgColor');
    const overlayOpacityInput = $('#overlayOpacity');
    const fontFamilySelect = $('#fontFamily');

    // Product controls
    const productXInput = $('#productX');
    const productYInput = $('#productY');
    const productScaleInput = $('#productScale');

    // Effect checkboxes
    const effectGlow = $('#effectGlow');
    const effectBadge = $('#effectBadge');
    const effectGradient = $('#effectGradient');
    const effectBorder = $('#effectBorder');

    // ── Init ───────────────────────────────────────────
    function init() {
        bindEvents();
        renderCanvas();
    }

    // ── Event Bindings ─────────────────────────────────
    function bindEvents() {
        // Original image upload
        uploadZone.addEventListener('click', () => fileInput.click());
        uploadZone.addEventListener('dragover', handleDragOver);
        uploadZone.addEventListener('dragleave', handleDragLeave);
        uploadZone.addEventListener('drop', handleDrop);
        fileInput.addEventListener('change', handleFileSelect);

        // Product image upload
        productUploadZone.addEventListener('click', () => productFileInput.click());
        productUploadZone.addEventListener('dragover', handleDragOver);
        productUploadZone.addEventListener('dragleave', handleDragLeave);
        productUploadZone.addEventListener('drop', (e) => handleDrop(e, true));
        productFileInput.addEventListener('change', (e) => handleFileSelect(e, true));

        // Text inputs
        headlineInput.addEventListener('input', (e) => { state.headline = e.target.value; renderCanvas(); });
        subheadlineInput.addEventListener('input', (e) => { state.subheadline = e.target.value; renderCanvas(); });
        ctaTextInput.addEventListener('input', (e) => { state.ctaText = e.target.value; renderCanvas(); });
        bodyTextInput.addEventListener('input', (e) => { state.bodyText = e.target.value; renderCanvas(); });
        badgeTextInput.addEventListener('input', (e) => { state.badgeText = e.target.value; renderCanvas(); });

        // Colors
        primaryColorInput.addEventListener('input', (e) => {
            state.primaryColor = e.target.value;
            $('#primaryHex').textContent = e.target.value;
            renderCanvas();
        });
        accentColorInput.addEventListener('input', (e) => {
            state.accentColor = e.target.value;
            $('#accentHex').textContent = e.target.value;
            renderCanvas();
        });
        bgColorInput.addEventListener('input', (e) => {
            state.bgColor = e.target.value;
            $('#bgHex').textContent = e.target.value;
            renderCanvas();
        });
        overlayOpacityInput.addEventListener('input', (e) => {
            state.overlayOpacity = e.target.value / 100;
            renderCanvas();
        });

        // Font
        fontFamilySelect.addEventListener('change', (e) => {
            state.fontFamily = e.target.value;
            renderCanvas();
        });

        // Product position
        productXInput.addEventListener('input', (e) => { state.productX = parseInt(e.target.value); renderCanvas(); });
        productYInput.addEventListener('input', (e) => { state.productY = parseInt(e.target.value); renderCanvas(); });
        productScaleInput.addEventListener('input', (e) => { state.productScale = parseInt(e.target.value); renderCanvas(); });

        // Effects
        effectGlow.addEventListener('change', (e) => { state.effects.glow = e.target.checked; renderCanvas(); });
        effectBadge.addEventListener('change', (e) => { state.effects.badge = e.target.checked; renderCanvas(); });
        effectGradient.addEventListener('change', (e) => { state.effects.gradient = e.target.checked; renderCanvas(); });
        effectBorder.addEventListener('change', (e) => { state.effects.border = e.target.checked; renderCanvas(); });

        // Template buttons
        $$('.template-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('.template-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.template = btn.dataset.template;
                resizeCanvas();
                renderCanvas();
            });
        });

        // Layout buttons
        $$('.layout-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('.layout-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.layout = btn.dataset.layout;
                renderCanvas();
            });
        });

        // Size buttons
        $$('.size-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('.size-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.exportSize = parseInt(btn.dataset.size);
            });
        });

        // Export
        $('#btnDownloadPNG').addEventListener('click', () => exportAd('png'));
        $('#btnDownloadJPG').addEventListener('click', () => exportAd('jpeg'));

        // Refresh
        $('#btnRefresh').addEventListener('click', () => renderCanvas());

        // Variations
        $('#btnVarColor').addEventListener('click', variationColor);
        $('#btnVarLayout').addEventListener('click', variationLayout);
        $('#btnVarFont').addEventListener('click', variationFont);
        $('#btnVarEffect').addEventListener('click', variationEffect);
    }

    // ── File Handling ──────────────────────────────────
    function handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.style.borderColor = 'var(--accent)';
        e.currentTarget.style.background = 'rgba(255,107,53,0.08)';
    }

    function handleDragLeave(e) {
        e.currentTarget.style.borderColor = '';
        e.currentTarget.style.background = '';
    }

    function handleDrop(e, isProduct) {
        e.preventDefault();
        e.currentTarget.style.borderColor = '';
        e.currentTarget.style.background = '';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            loadImage(file, isProduct === true);
        }
    }

    function handleFileSelect(e, isProduct) {
        const file = e.target.files[0];
        if (file) {
            loadImage(file, isProduct === true);
        }
    }

    function loadImage(file, isProduct) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                if (isProduct) {
                    state.productImage = img;
                    productPreview.src = e.target.result;
                    productPreview.classList.remove('hidden');
                    productUploadContent.classList.add('hidden');
                } else {
                    state.originalImage = img;
                    originalPreview.src = e.target.result;
                    originalPreview.classList.remove('hidden');
                    uploadContent.classList.add('hidden');
                }
                renderCanvas();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // ── Canvas Sizing ──────────────────────────────────
    function resizeCanvas() {
        const dim = DIMENSIONS[state.template];
        canvas.width = dim.w;
        canvas.height = dim.h;
    }

    // ── Main Render ────────────────────────────────────
    function renderCanvas() {
        const W = canvas.width;
        const H = canvas.height;

        // Clear
        ctx.clearRect(0, 0, W, H);

        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, W, H);

        // Show placeholder if nothing loaded
        if (!state.originalImage && !state.productImage && !state.headline && !state.subheadline) {
            renderPlaceholder();
            return;
        }

        switch (state.layout) {
            case 'overlay':
                renderOverlay(W, H);
                break;
            case 'split-top':
                renderSplitTop(W, H);
                break;
            case 'split-bottom':
                renderSplitBottom(W, H);
                break;
            case 'minimal':
                renderMinimal(W, H);
                break;
        }

        // Neon border effect
        if (state.effects.border) {
            renderNeonBorder(W, H);
        }
    }

    // ── Layout: Overlay ────────────────────────────────
    function renderOverlay(W, H) {
        // Draw original image as background (cover)
        if (state.originalImage) {
            drawImageCover(state.originalImage, 0, 0, W, H);
        }

        // Dark overlay
        ctx.fillStyle = hexToRgba(state.bgColor, state.overlayOpacity);
        ctx.fillRect(0, 0, W, H);

        // Gradient effect on top
        if (state.effects.gradient) {
            const grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, hexToRgba(state.primaryColor, 0.3));
            grad.addColorStop(0.5, 'transparent');
            grad.addColorStop(1, hexToRgba(state.primaryColor, 0.4));
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);
        }

        // Product image
        if (state.productImage) {
            drawProduct(W, H, 0, 0, W, H);
        }

        // Text at bottom
        const textY = H * 0.58;
        renderTextBlock(W, H, textY);

        // CTA
        renderCTA(W, H, H * 0.84);

        // Badge
        if (state.effects.badge && state.badgeText) {
            renderBadge(W, H);
        }
    }

    // ── Layout: Split Top (text top, image bottom) ────
    function renderSplitTop(W, H) {
        const splitAt = H * 0.38;

        // Top: colored area with text
        ctx.fillStyle = state.bgColor;
        ctx.fillRect(0, 0, W, splitAt);

        if (state.effects.gradient) {
            const grad = ctx.createLinearGradient(0, 0, W, 0);
            grad.addColorStop(0, hexToRgba(state.primaryColor, 0.2));
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, splitAt);
        }

        // Bottom: image
        if (state.originalImage) {
            drawImageCover(state.originalImage, 0, splitAt, W, H - splitAt);
        } else {
            ctx.fillStyle = '#222240';
            ctx.fillRect(0, splitAt, W, H - splitAt);
        }

        // Overlay on image portion
        ctx.fillStyle = hexToRgba(state.bgColor, state.overlayOpacity * 0.5);
        ctx.fillRect(0, splitAt, W, H - splitAt);

        // Product on image area
        if (state.productImage) {
            drawProduct(W, H - splitAt, 0, splitAt, W, H - splitAt);
        }

        // Text on top section
        renderTextBlock(W, splitAt, splitAt * 0.15, splitAt * 0.85);

        // CTA at the split boundary
        renderCTA(W, H, splitAt - 30);

        // Badge
        if (state.effects.badge && state.badgeText) {
            renderBadge(W, H);
        }
    }

    // ── Layout: Split Bottom (image top, text bottom) ──
    function renderSplitBottom(W, H) {
        const splitAt = H * 0.55;

        // Top: image
        if (state.originalImage) {
            drawImageCover(state.originalImage, 0, 0, W, splitAt);
        } else {
            ctx.fillStyle = '#222240';
            ctx.fillRect(0, 0, W, splitAt);
        }

        ctx.fillStyle = hexToRgba(state.bgColor, state.overlayOpacity * 0.4);
        ctx.fillRect(0, 0, W, splitAt);

        // Product on image area
        if (state.productImage) {
            drawProduct(W, splitAt, 0, 0, W, splitAt);
        }

        // Bottom: colored area with text
        ctx.fillStyle = state.bgColor;
        ctx.fillRect(0, splitAt, W, H - splitAt);

        if (state.effects.gradient) {
            const grad = ctx.createLinearGradient(0, splitAt, 0, H);
            grad.addColorStop(0, hexToRgba(state.primaryColor, 0.15));
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(0, splitAt, W, H - splitAt);
        }

        // Text in bottom section
        const textStart = splitAt + 30;
        renderTextBlock(W, H, textStart, H - splitAt - 80);

        // CTA
        renderCTA(W, H, H * 0.88);

        // Badge
        if (state.effects.badge && state.badgeText) {
            renderBadge(W, H);
        }
    }

    // ── Layout: Minimal ────────────────────────────────
    function renderMinimal(W, H) {
        // Full solid bg
        ctx.fillStyle = state.bgColor;
        ctx.fillRect(0, 0, W, H);

        if (state.effects.gradient) {
            const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
            grad.addColorStop(0, hexToRgba(state.primaryColor, 0.12));
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);
        }

        // Product centered (large)
        if (state.productImage) {
            const maxProductH = H * 0.45;
            const maxProductW = W * 0.6;
            const pAspect = state.productImage.width / state.productImage.height;
            let pW = maxProductW;
            let pH = pW / pAspect;
            if (pH > maxProductH) {
                pH = maxProductH;
                pW = pH * pAspect;
            }
            const scale = state.productScale / 100;
            pW *= scale;
            pH *= scale;
            const pX = (W - pW) / 2 + (state.productX - 50) * (W * 0.006);
            const pY = H * 0.12 + (state.productY - 50) * (H * 0.004);

            // Shadow behind product
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 40;
            ctx.shadowOffsetY = 16;
            ctx.drawImage(state.productImage, pX, pY, pW, pH);
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;
        } else if (state.originalImage) {
            // If no product, show original small/centered
            const maxS = Math.min(W, H) * 0.5;
            const iAspect = state.originalImage.width / state.originalImage.height;
            let iW = maxS;
            let iH = iW / iAspect;
            if (iH > maxS) { iH = maxS; iW = iH * iAspect; }
            ctx.drawImage(state.originalImage, (W - iW) / 2, H * 0.1, iW, iH);
        }

        // Text below product
        const textY = H * 0.58;
        renderTextBlock(W, H, textY);

        // CTA
        renderCTA(W, H, H * 0.84);

        // Badge
        if (state.effects.badge && state.badgeText) {
            renderBadge(W, H);
        }
    }

    // ── Draw Helpers ───────────────────────────────────
    function drawImageCover(img, x, y, w, h) {
        const iAspect = img.width / img.height;
        const cAspect = w / h;
        let sx, sy, sw, sh;

        if (iAspect > cAspect) {
            sh = img.height;
            sw = sh * cAspect;
            sx = (img.width - sw) / 2;
            sy = 0;
        } else {
            sw = img.width;
            sh = sw / cAspect;
            sx = 0;
            sy = (img.height - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    }

    function drawProduct(areaW, areaH, offsetX, offsetY, containerW, containerH) {
        if (!state.productImage) return;

        const maxPW = containerW * 0.45;
        const maxPH = containerH * 0.55;
        const pAspect = state.productImage.width / state.productImage.height;
        let pW = maxPW;
        let pH = pW / pAspect;
        if (pH > maxPH) {
            pH = maxPH;
            pW = pH * pAspect;
        }

        const scale = state.productScale / 100;
        pW *= scale;
        pH *= scale;

        const pX = offsetX + (containerW - pW) * (state.productX / 100);
        const pY = offsetY + (containerH - pH) * (state.productY / 100);

        // Product shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 10;
        ctx.drawImage(state.productImage, pX, pY, pW, pH);
        ctx.restore();
    }

    // ── Text Rendering ─────────────────────────────────
    function renderTextBlock(W, H, startY, maxHeight) {
        const padding = W * 0.07;
        const maxTextW = W - padding * 2;
        let y = startY;

        // Headline
        if (state.headline) {
            const hSize = Math.round(W * 0.065);
            ctx.font = `900 ${hSize}px "${state.fontFamily}", sans-serif`;
            ctx.fillStyle = state.accentColor;
            ctx.textAlign = 'left';

            // Text shadow for readability
            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetY = 2;

            y = wrapText(state.headline, padding, y, maxTextW, hSize * 1.15);
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            y += 10;
        }

        // Subheadline
        if (state.subheadline) {
            const sSize = Math.round(W * 0.038);
            ctx.font = `600 ${sSize}px "${state.fontFamily}", sans-serif`;
            ctx.fillStyle = state.primaryColor;
            ctx.textAlign = 'left';

            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 6;
            y = wrapText(state.subheadline, padding, y, maxTextW, sSize * 1.3);
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            y += 8;
        }

        // Body text
        if (state.bodyText) {
            const bSize = Math.round(W * 0.03);
            ctx.font = `400 ${bSize}px "${state.fontFamily}", sans-serif`;
            ctx.fillStyle = hexToRgba(state.accentColor, 0.75);
            ctx.textAlign = 'left';

            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 4;
            y = wrapText(state.bodyText, padding, y, maxTextW, bSize * 1.4);
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
        }

        return y;
    }

    function wrapText(text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && i > 0) {
                ctx.fillText(line.trim(), x, currentY);
                line = words[i] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line.trim(), x, currentY);
        currentY += lineHeight;
        return currentY;
    }

    // ── CTA Button ─────────────────────────────────────
    function renderCTA(W, H, y) {
        if (!state.ctaText) return;

        const fontSize = Math.round(W * 0.035);
        ctx.font = `800 ${fontSize}px "${state.fontFamily}", sans-serif`;
        const textMetrics = ctx.measureText(state.ctaText);
        const btnW = textMetrics.width + W * 0.08;
        const btnH = fontSize * 2.4;
        const btnX = W * 0.07;
        const btnY = y - btnH / 2;
        const radius = btnH / 2;

        ctx.save();

        // Glow effect
        if (state.effects.glow) {
            ctx.shadowColor = hexToRgba(state.primaryColor, 0.6);
            ctx.shadowBlur = 30;
            ctx.shadowOffsetY = 4;
        }

        // Button shape
        ctx.fillStyle = state.primaryColor;
        roundRect(ctx, btnX, btnY, btnW, btnH, radius);
        ctx.fill();

        ctx.restore();

        // Button text
        ctx.fillStyle = state.accentColor;
        ctx.font = `800 ${fontSize}px "${state.fontFamily}", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(state.ctaText, btnX + btnW / 2, btnY + btnH / 2);
        ctx.textBaseline = 'alphabetic';
    }

    // ── Badge ──────────────────────────────────────────
    function renderBadge(W, H) {
        if (!state.badgeText) return;

        const fontSize = Math.round(W * 0.032);
        ctx.font = `900 ${fontSize}px "${state.fontFamily}", sans-serif`;
        const textMetrics = ctx.measureText(state.badgeText);
        const padX = W * 0.025;
        const padY = fontSize * 0.5;
        const badgeW = textMetrics.width + padX * 2;
        const badgeH = fontSize + padY * 2;
        const badgeX = W - badgeW - W * 0.05;
        const badgeY = W * 0.05;

        ctx.save();

        // Badge glow
        ctx.shadowColor = 'rgba(255,71,87,0.5)';
        ctx.shadowBlur = 20;

        // Badge background
        ctx.fillStyle = '#FF4757';
        roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 8);
        ctx.fill();

        ctx.restore();

        // Badge text
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(state.badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2);
        ctx.textBaseline = 'alphabetic';
    }

    // ── Neon Border ────────────────────────────────────
    function renderNeonBorder(W, H) {
        const borderWidth = W * 0.006;
        ctx.save();
        ctx.strokeStyle = state.primaryColor;
        ctx.lineWidth = borderWidth;
        ctx.shadowColor = hexToRgba(state.primaryColor, 0.7);
        ctx.shadowBlur = 20;

        // Draw multiple passes for glow intensity
        for (let i = 0; i < 3; i++) {
            ctx.strokeRect(
                borderWidth / 2 + i,
                borderWidth / 2 + i,
                W - borderWidth - i * 2,
                H - borderWidth - i * 2
            );
        }
        ctx.restore();
    }

    // ── Utilities ──────────────────────────────────────
    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    // ── Export ──────────────────────────────────────────
    function exportAd(format) {
        // Save current size
        const origW = canvas.width;
        const origH = canvas.height;

        // Render at export size
        const dim = DIMENSIONS[state.template];
        const scale = state.exportSize / dim.w;
        canvas.width = Math.round(dim.w * scale);
        canvas.height = Math.round(dim.h * scale);
        ctx.scale(scale, scale);
        renderCanvas();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Create download
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const quality = format === 'jpeg' ? 0.92 : undefined;
        const ext = format === 'png' ? 'png' : 'jpg';

        canvas.toBlob(function (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `viral-ad-${state.template}-${Date.now()}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Restore canvas to preview size
            canvas.width = origW;
            canvas.height = origH;
            renderCanvas();
        }, mimeType, quality);
    }

    // ── Quick Variations ───────────────────────────────
    function variationColor() {
        const palettes = [
            { primary: '#FF6B35', accent: '#FFFFFF', bg: '#000000' },
            { primary: '#00D68F', accent: '#FFFFFF', bg: '#0A1628' },
            { primary: '#7B61FF', accent: '#FFFFFF', bg: '#0F0A1F' },
            { primary: '#FF4757', accent: '#FFFFFF', bg: '#1A0A0A' },
            { primary: '#FFD93D', accent: '#1A1A2E', bg: '#0A0A0F' },
            { primary: '#00B4D8', accent: '#FFFFFF', bg: '#0A1520' },
            { primary: '#FF006E', accent: '#FFFFFF', bg: '#120018' },
            { primary: '#F77F00', accent: '#FFFFFF', bg: '#1A1000' },
            { primary: '#06D6A0', accent: '#1A1A2E', bg: '#021A14' },
            { primary: '#E63946', accent: '#F1FAEE', bg: '#1D3557' }
        ];

        const current = palettes.findIndex(p => p.primary === state.primaryColor);
        const next = (current + 1) % palettes.length;
        const palette = palettes[next];

        state.primaryColor = palette.primary;
        state.accentColor = palette.accent;
        state.bgColor = palette.bg;

        primaryColorInput.value = palette.primary;
        accentColorInput.value = palette.accent;
        bgColorInput.value = palette.bg;
        $('#primaryHex').textContent = palette.primary;
        $('#accentHex').textContent = palette.accent;
        $('#bgHex').textContent = palette.bg;

        renderCanvas();
    }

    function variationLayout() {
        const layouts = ['overlay', 'split-top', 'split-bottom', 'minimal'];
        const current = layouts.indexOf(state.layout);
        const next = (current + 1) % layouts.length;
        state.layout = layouts[next];

        $$('.layout-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.layout === state.layout);
        });

        renderCanvas();
    }

    function variationFont() {
        const fonts = ['Inter', 'Poppins', 'Montserrat', 'Arial Black', 'Georgia'];
        const current = fonts.indexOf(state.fontFamily);
        const next = (current + 1) % fonts.length;
        state.fontFamily = fonts[next];
        fontFamilySelect.value = state.fontFamily;
        renderCanvas();
    }

    function variationEffect() {
        const effectKeys = ['glow', 'badge', 'gradient', 'border'];
        const randomKey = effectKeys[Math.floor(Math.random() * effectKeys.length)];
        state.effects[randomKey] = !state.effects[randomKey];

        effectGlow.checked = state.effects.glow;
        effectBadge.checked = state.effects.badge;
        effectGradient.checked = state.effects.gradient;
        effectBorder.checked = state.effects.border;

        renderCanvas();
    }

    // ── Placeholder Render ─────────────────────────────
    function renderPlaceholder() {
        const W = canvas.width;
        const H = canvas.height;

        // Grid pattern
        ctx.strokeStyle = 'rgba(255,107,53,0.08)';
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < W; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
            ctx.stroke();
        }
        for (let y = 0; y < H; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }

        // Center text
        ctx.fillStyle = 'rgba(255,107,53,0.3)';
        ctx.font = `700 ${W * 0.04}px "Inter", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('Sube una imagen para empezar', W / 2, H / 2 - 20);

        ctx.fillStyle = 'rgba(144,144,176,0.4)';
        ctx.font = `400 ${W * 0.025}px "Inter", sans-serif`;
        ctx.fillText('o escribe tu copy para previsualizar', W / 2, H / 2 + 20);
    }

    // ── Start ──────────────────────────────────────────
    init();

})();
