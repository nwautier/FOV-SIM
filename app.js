/**
 * IMAG Stage & Screen Simulator - Version 2.0
 */

// --- Constants & Conversions ---
const M_TO_FT = 3.28084;
const FT_TO_M = 0.3048;
const IN_TO_M = 0.0254;
const M_TO_IN = 39.3701;
const FT_TO_IN = 12;

// --- Application State ---
const state = {
    // Units
    screenUnit: 'm',     // 'm' | 'ft'
    personUnit: 'imp',   // 'imp' | 'm'
    distanceUnit: 'ft',  // 'ft' | 'm'

    // Core dimensions in SI (meters) internally
    screenWidthM: 3.0,
    screenHeightM: 4.0,
    personHeightM: 1.7526, // 5 ft 9 in = 69 in * 0.0254 = 1.7526m
    distanceM: 91.44,      // 300 ft = 300 * 0.3048 = 91.44m

    // Shot framing: 'close-up' | 'head-shoulders' | 'waist-up' | 'head-toe'
    shotType: 'head-shoulders',

    // Presentation Text / Lower Third
    lockTextSize: true,            // Suggest text size based on distance (1" per 10')
    textLetterHeightInches: 30.0,  // 30 inches for 300ft default
    fontFamily: 'Helvetica, Arial, sans-serif',
    fontStyle: 'normal'            // 'normal' | 'bold' | 'condensed' | 'bold-condensed'
};

// --- DOM Elements ---
const DOM = {};

function initDOM() {
    DOM.canvas = document.getElementById('stage-canvas');
    DOM.ctx = DOM.canvas.getContext('2d');

    // Toggles
    DOM.screenUnitToggle = document.getElementById('screen-unit-toggle');
    DOM.personUnitToggle = document.getElementById('person-unit-toggle');
    DOM.distanceUnitToggle = document.getElementById('distance-unit-toggle');

    // Inputs
    DOM.screenWidth = document.getElementById('screen-width');
    DOM.screenHeight = document.getElementById('screen-height');
    DOM.screenWidthUnit = document.getElementById('screen-width-unit');
    DOM.screenHeightUnit = document.getElementById('screen-height-unit');

    DOM.personImpFields = document.getElementById('person-imp-fields');
    DOM.personMetricFields = document.getElementById('person-metric-fields');
    DOM.personFt = document.getElementById('person-ft');
    DOM.personIn = document.getElementById('person-in');
    DOM.personM = document.getElementById('person-m');

    DOM.distanceSlider = document.getElementById('distance-slider');
    DOM.distanceNum = document.getElementById('distance-num');
    DOM.distanceUnit = document.getElementById('distance-unit');

    // Lower Third Inputs
    DOM.lockTextSize = document.getElementById('lock-text-size');
    DOM.textHeightSlider = document.getElementById('text-height-slider');
    DOM.textHeightNum = document.getElementById('text-height-num');
    DOM.fontFamilySelect = document.getElementById('font-family-select');
    DOM.fontStyleSelect = document.getElementById('font-style-select');

    DOM.resetViewBtn = document.getElementById('reset-view-btn');

    // Metrics
    DOM.metricScreenDims = document.getElementById('metric-screen-dims');
    DOM.metricScreenDimsImp = document.getElementById('metric-screen-dims-imp');
    DOM.metricAspectRatio = document.getElementById('metric-aspect-ratio');
    DOM.metricAspectType = document.getElementById('metric-aspect-type');
    DOM.metricPersonHeight = document.getElementById('metric-person-height');
    DOM.metricPersonHeightM = document.getElementById('metric-person-height-m');
    DOM.metricDistance = document.getElementById('metric-distance');
    DOM.metricDistanceM = document.getElementById('metric-distance-m');
    DOM.metricMagnification = document.getElementById('metric-magnification');
    DOM.metricFov = document.getElementById('metric-fov');
    DOM.metricPersonFov = document.getElementById('metric-person-fov');

    DOM.metricTextHeight = document.getElementById('metric-text-height');
    DOM.metricTextHeightPt = document.getElementById('metric-text-height-pt');
    DOM.metricReadability = document.getElementById('metric-readability');
    DOM.metricReadabilityRatio = document.getElementById('metric-readability-ratio');
}

// --- Initialization ---
window.addEventListener('DOMContentLoaded', () => {
    initDOM();
    setupEventListeners();
    resizeCanvas();
    updateUIFromState();
    render();
});

window.addEventListener('resize', () => {
    resizeCanvas();
    render();
});

function resizeCanvas() {
    const rect = DOM.canvas.parentElement.getBoundingClientRect();
    DOM.canvas.width = rect.width * window.devicePixelRatio;
    DOM.canvas.height = rect.height * window.devicePixelRatio;
}

// --- Event Listeners & Handlers ---
function setupEventListeners() {
    // Screen unit toggle
    DOM.screenUnitToggle.addEventListener('click', (e) => {
        if (!e.target.classList.contains('unit-btn')) return;
        const newUnit = e.target.dataset.unit;
        if (newUnit === state.screenUnit) return;

        state.screenUnit = newUnit;
        updateToggleButtons(DOM.screenUnitToggle, newUnit);
        updateScreenInputValues();
        updateUIFromState();
        render();
    });

    // Person unit toggle
    DOM.personUnitToggle.addEventListener('click', (e) => {
        if (!e.target.classList.contains('unit-btn')) return;
        const newUnit = e.target.dataset.unit;
        if (newUnit === state.personUnit) return;

        state.personUnit = newUnit;
        updateToggleButtons(DOM.personUnitToggle, newUnit);
        if (newUnit === 'imp') {
            DOM.personImpFields.classList.remove('hidden');
            DOM.personMetricFields.classList.add('hidden');
        } else {
            DOM.personImpFields.classList.add('hidden');
            DOM.personMetricFields.classList.remove('hidden');
        }
        updatePersonInputValues();
        updateUIFromState();
        render();
    });

    // Distance unit toggle
    DOM.distanceUnitToggle.addEventListener('click', (e) => {
        if (!e.target.classList.contains('unit-btn')) return;
        const newUnit = e.target.dataset.unit;
        if (newUnit === state.distanceUnit) return;

        state.distanceUnit = newUnit;
        updateToggleButtons(DOM.distanceUnitToggle, newUnit);
        updateDistanceInputValues();
        updateUIFromState();
        render();
    });

    // Inputs: Screen Dimensions
    DOM.screenWidth.addEventListener('input', () => {
        const val = parseFloat(DOM.screenWidth.value) || 0.5;
        state.screenWidthM = state.screenUnit === 'm' ? val : val * FT_TO_M;
        updateUIFromState();
        render();
    });

    DOM.screenHeight.addEventListener('input', () => {
        const val = parseFloat(DOM.screenHeight.value) || 0.5;
        state.screenHeightM = state.screenUnit === 'm' ? val : val * FT_TO_M;
        updateUIFromState();
        render();
    });

    // Inputs: Person Height
    DOM.personFt.addEventListener('input', updatePersonHeightFromInputs);
    DOM.personIn.addEventListener('input', updatePersonHeightFromInputs);
    DOM.personM.addEventListener('input', updatePersonHeightFromInputs);

    function updatePersonHeightFromInputs() {
        if (state.personUnit === 'imp') {
            const ft = parseFloat(DOM.personFt.value) || 0;
            const inches = parseFloat(DOM.personIn.value) || 0;
            state.personHeightM = (ft * 12 + inches) * IN_TO_M;
        } else {
            const m = parseFloat(DOM.personM.value) || 0.5;
            state.personHeightM = m;
        }
        updateUIFromState();
        render();
    }

    // Inputs: Audience Distance
    DOM.distanceSlider.addEventListener('input', () => {
        const val = parseFloat(DOM.distanceSlider.value);
        DOM.distanceNum.value = val;
        state.distanceM = state.distanceUnit === 'ft' ? val * FT_TO_M : val;
        handleDistanceChange();
    });

    DOM.distanceNum.addEventListener('input', () => {
        const val = parseFloat(DOM.distanceNum.value) || 10;
        DOM.distanceSlider.value = val;
        state.distanceM = state.distanceUnit === 'ft' ? val * FT_TO_M : val;
        handleDistanceChange();
    });

    function handleDistanceChange() {
        if (state.lockTextSize) {
            const distFt = state.distanceM * M_TO_FT;
            state.textLetterHeightInches = Math.max(0.5, distFt / 10.0);
            DOM.textHeightSlider.value = state.textLetterHeightInches.toFixed(1);
            DOM.textHeightNum.value = state.textLetterHeightInches.toFixed(1);
        }
        updateUIFromState();
        render();
    }

    // Inputs: Shot Type Radio Buttons
    document.querySelectorAll('input[name="shot-type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                state.shotType = e.target.value;
                render();
            }
        });
    });

    // Inputs: Lower Third Controls
    DOM.lockTextSize.addEventListener('change', (e) => {
        state.lockTextSize = e.target.checked;
        if (state.lockTextSize) {
            const distFt = state.distanceM * M_TO_FT;
            state.textLetterHeightInches = Math.max(0.5, distFt / 10.0);
            DOM.textHeightSlider.value = state.textLetterHeightInches.toFixed(1);
            DOM.textHeightNum.value = state.textLetterHeightInches.toFixed(1);
        }
        updateUIFromState();
        render();
    });

    DOM.textHeightSlider.addEventListener('input', () => {
        const val = parseFloat(DOM.textHeightSlider.value);
        DOM.textHeightNum.value = val;
        state.textLetterHeightInches = val;
        updateUIFromState();
        render();
    });

    DOM.textHeightNum.addEventListener('input', () => {
        const val = parseFloat(DOM.textHeightNum.value) || 0.5;
        DOM.textHeightSlider.value = val;
        state.textLetterHeightInches = val;
        updateUIFromState();
        render();
    });

    DOM.fontFamilySelect.addEventListener('change', (e) => {
        state.fontFamily = e.target.value;
        render();
    });

    DOM.fontStyleSelect.addEventListener('change', (e) => {
        state.fontStyle = e.target.value;
        render();
    });

    // Reset View
    DOM.resetViewBtn.addEventListener('click', () => {
        state.screenUnit = 'm';
        state.personUnit = 'imp';
        state.distanceUnit = 'ft';
        state.screenWidthM = 3.0;
        state.screenHeightM = 4.0;
        state.personHeightM = 1.7526;
        state.distanceM = 91.44;
        state.shotType = 'head-shoulders';
        state.lockTextSize = true;
        state.textLetterHeightInches = 30.0;
        state.fontFamily = 'Helvetica, Arial, sans-serif';
        state.fontStyle = 'normal';

        updateToggleButtons(DOM.screenUnitToggle, 'm');
        updateToggleButtons(DOM.personUnitToggle, 'imp');
        updateToggleButtons(DOM.distanceUnitToggle, 'ft');

        DOM.personImpFields.classList.remove('hidden');
        DOM.personMetricFields.classList.add('hidden');

        document.querySelector('input[name="shot-type"][value="head-shoulders"]').checked = true;
        DOM.lockTextSize.checked = true;
        DOM.textHeightSlider.value = 30;
        DOM.textHeightNum.value = 30;
        DOM.fontFamilySelect.value = 'Helvetica, Arial, sans-serif';
        DOM.fontStyleSelect.value = 'normal';

        updateScreenInputValues();
        updatePersonInputValues();
        updateDistanceInputValues();
        updateUIFromState();
        render();
    });
}

function updateToggleButtons(container, activeUnit) {
    container.querySelectorAll('.unit-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.unit === activeUnit);
    });
}

function updateScreenInputValues() {
    if (state.screenUnit === 'm') {
        DOM.screenWidth.value = state.screenWidthM.toFixed(2);
        DOM.screenHeight.value = state.screenHeightM.toFixed(2);
        DOM.screenWidthUnit.textContent = 'm';
        DOM.screenHeightUnit.textContent = 'm';
        DOM.screenWidth.step = '0.1';
        DOM.screenHeight.step = '0.1';
    } else {
        DOM.screenWidth.value = (state.screenWidthM * M_TO_FT).toFixed(1);
        DOM.screenHeight.value = (state.screenHeightM * M_TO_FT).toFixed(1);
        DOM.screenWidthUnit.textContent = 'ft';
        DOM.screenHeightUnit.textContent = 'ft';
        DOM.screenWidth.step = '0.5';
        DOM.screenHeight.step = '0.5';
    }
}

function updatePersonInputValues() {
    if (state.personUnit === 'imp') {
        const totalInches = Math.round(state.personHeightM / IN_TO_M);
        const ft = Math.floor(totalInches / 12);
        const inches = totalInches % 12;
        DOM.personFt.value = ft;
        DOM.personIn.value = inches;
    } else {
        DOM.personM.value = state.personHeightM.toFixed(2);
    }
}

function updateDistanceInputValues() {
    if (state.distanceUnit === 'ft') {
        const distFt = Math.round(state.distanceM * M_TO_FT);
        DOM.distanceSlider.min = '10';
        DOM.distanceSlider.max = '500';
        DOM.distanceSlider.value = distFt;
        DOM.distanceNum.value = distFt;
        DOM.distanceUnit.textContent = 'ft';
    } else {
        const distM = Math.round(state.distanceM);
        DOM.distanceSlider.min = '3';
        DOM.distanceSlider.max = '150';
        DOM.distanceSlider.value = distM;
        DOM.distanceNum.value = distM;
        DOM.distanceUnit.textContent = 'm';
    }
}

// --- Metrics Calculation & UI Refresh ---
function updateUIFromState() {
    // Screen Dims
    const wM = state.screenWidthM;
    const hM = state.screenHeightM;
    const wFt = wM * M_TO_FT;
    const hFt = hM * M_TO_FT;

    DOM.metricScreenDims.textContent = `${wM.toFixed(2)} m × ${hM.toFixed(2)} m`;
    DOM.metricScreenDimsImp.textContent = `${wFt.toFixed(1)} ft × ${hFt.toFixed(1)} ft`;

    // Aspect Ratio
    const ratio = wM / hM;
    let aspectStr = '';
    if (Math.abs(ratio - 16/9) < 0.05) aspectStr = '16 : 9';
    else if (Math.abs(ratio - 4/3) < 0.05) aspectStr = '4 : 3';
    else aspectStr = `${wM.toFixed(1)} : ${hM.toFixed(1)}`;

    DOM.metricAspectRatio.textContent = `${aspectStr} (${ratio.toFixed(2)})`;
    DOM.metricAspectType.textContent = ratio > 1.05 ? 'Widescreen Screen' : (ratio < 0.95 ? 'Portrait Screen' : 'Square Screen');

    // Person Height
    const totalInches = Math.round(state.personHeightM / IN_TO_M);
    const pFt = Math.floor(totalInches / 12);
    const pIn = totalInches % 12;
    DOM.metricPersonHeight.textContent = `${pFt}' ${pIn}"`;
    DOM.metricPersonHeightM.textContent = `${state.personHeightM.toFixed(2)} m`;

    // Audience Distance
    const dFt = state.distanceM * M_TO_FT;
    DOM.metricDistance.textContent = `${Math.round(dFt)} ft`;
    DOM.metricDistanceM.textContent = `${state.distanceM.toFixed(1)} m`;

    // Magnification
    let shotFraction = 1.0;
    if (state.shotType === 'waist-up') shotFraction = 0.5;
    else if (state.shotType === 'head-shoulders') shotFraction = 0.25;
    else if (state.shotType === 'close-up') shotFraction = 0.12;

    const imagePersonScaleRatio = (state.screenHeightM / (state.personHeightM * shotFraction));
    DOM.metricMagnification.textContent = `${imagePersonScaleRatio.toFixed(1)}× Subject Scale`;

    // Angular size (FOV)
    const screenFovRad = 2 * Math.atan(state.screenHeightM / (2 * state.distanceM));
    const screenFovDeg = screenFovRad * (180 / Math.PI);

    const personFovRad = 2 * Math.atan(state.personHeightM / (2 * state.distanceM));
    const personFovDeg = personFovRad * (180 / Math.PI);

    DOM.metricFov.textContent = `${screenFovDeg.toFixed(2)}° (Screen)`;
    DOM.metricPersonFov.textContent = `Stage Person: ${personFovDeg.toFixed(2)}°`;

    // Text Height & Readability Metrics
    const letterInches = state.textLetterHeightInches;
    const letterCm = letterInches * 2.54;
    const physicalPoints = letterInches * 72; // 1 inch = 72 pt physical

    DOM.metricTextHeight.textContent = `${letterInches.toFixed(1)} in (${letterCm.toFixed(1)} cm)`;
    DOM.metricTextHeightPt.textContent = `${Math.round(physicalPoints)} pt (Physical Scale)`;

    // Readability ratio based on 1 in per 10 ft rule
    const recommendedInches = dFt / 10.0;
    const readabilityRatio = letterInches / recommendedInches;

    if (readabilityRatio >= 0.95) {
        DOM.metricReadability.textContent = 'Optimal / Recommended';
        DOM.metricReadabilityRatio.textContent = `${readabilityRatio.toFixed(1)}× target height (${recommendedInches.toFixed(1)}" rec)`;
    } else if (readabilityRatio >= 0.7) {
        DOM.metricReadability.textContent = 'Legible (Fair)';
        DOM.metricReadabilityRatio.textContent = `${(readabilityRatio * 100).toFixed(0)}% of recommended height`;
    } else {
        DOM.metricReadability.textContent = 'Too Small to Read';
        DOM.metricReadabilityRatio.textContent = `Needs ~${recommendedInches.toFixed(1)}" for ${Math.round(dFt)} ft distance`;
    }
}

// --- Canvas Rendering Engine ---
function render() {
    const { canvas, ctx } = DOM;
    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#080d1a';
    ctx.fillRect(0, 0, width, height);

    // Draw background grid/stage floor perspective lines
    drawEnvironment(ctx, width, height);

    // Calculate perspective scaling based on distance
    const baselineDistance = 25.0; // meters (~80ft)
    const perspectiveScale = Math.max(0.08, Math.min(3.0, baselineDistance / state.distanceM));

    // Base pixel scale
    const pxPerMeter = (height * 0.28) * perspectiveScale;

    // Center baseline for stage floor
    const stageY = height * 0.75;
    const centerX = width * 0.5;

    // Dimensions in canvas pixels
    const gapM = 1.5;
    const personWidthM = state.personHeightM * 0.35;

    const personCanvasH = state.personHeightM * pxPerMeter;
    const screenCanvasW = state.screenWidthM * pxPerMeter;
    const screenCanvasH = state.screenHeightM * pxPerMeter;

    const totalWidthPx = screenCanvasW + (gapM * pxPerMeter) + (personWidthM * pxPerMeter);
    const startX = centerX - (totalWidthPx / 2);

    // Screen position
    const screenX = startX;
    const screenY = stageY - screenCanvasH;

    // Person on stage position
    const personX = startX + screenCanvasW + (gapM * pxPerMeter) + (personWidthM * pxPerMeter / 2);
    const personY = stageY;

    // Render IMAG Screen Frame & Content
    drawImagScreen(ctx, screenX, screenY, screenCanvasW, screenCanvasH, pxPerMeter);

    // Render Person on Stage
    drawHumanoid(ctx, personX, personY, personCanvasH, false, 'stage');

    // Render Dimension Callouts & Distance Indicator
    drawLabelsAndCallouts(ctx, screenX, screenY, screenCanvasW, screenCanvasH, personX, personY, personCanvasH, width, height);
}

function drawEnvironment(ctx, width, height) {
    const stageY = height * 0.75;

    // Stage platform
    const gradient = ctx.createLinearGradient(0, stageY, 0, height);
    gradient.addColorStop(0, '#1e293b');
    gradient.addColorStop(1, '#0f172a');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, stageY, width, height - stageY);

    // Stage front edge line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2 * window.devicePixelRatio;
    ctx.beginPath();
    ctx.moveTo(0, stageY);
    ctx.lineTo(width, stageY);
    ctx.stroke();

    // Perspective grid lines on floor
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1 * window.devicePixelRatio;
    const vLines = 12;
    for (let i = 0; i <= vLines; i++) {
        const x = (width / vLines) * i;
        ctx.beginPath();
        ctx.moveTo(x, stageY);
        ctx.lineTo(width / 2 + (x - width / 2) * 1.8, height);
        ctx.stroke();
    }
}

function drawImagScreen(ctx, x, y, w, h, pxPerMeter) {
    ctx.save();

    // Screen bezel / border
    const bezel = Math.max(3, 6 * window.devicePixelRatio);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - bezel, y - bezel, w + bezel * 2, h + bezel * 2);

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5 * window.devicePixelRatio;
    ctx.strokeRect(x - bezel, y - bezel, w + bezel * 2, h + bezel * 2);

    // Screen display area clip
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    // Screen background (Glow / LED pixel grid effect)
    const bgGradient = ctx.createRadialGradient(x + w / 2, y + h / 2, 5, x + w / 2, y + h / 2, Math.max(w, h));
    bgGradient.addColorStop(0, '#1e1b4b');
    bgGradient.addColorStop(1, '#020617');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(x, y, w, h);

    // Shot framing logic
    let shotFraction = 0.30;
    if (state.shotType === 'close-up') shotFraction = 0.15;
    else if (state.shotType === 'head-shoulders') shotFraction = 0.30;
    else if (state.shotType === 'waist-up') shotFraction = 0.55;
    else if (state.shotType === 'head-toe') shotFraction = 1.05;

    const topMargin = h * 0.05;
    const targetShotHeightPx = h - (topMargin * 2);

    const screenPersonFullH = targetShotHeightPx / shotFraction;
    const screenPersonX = x + (w / 2);
    const screenPersonY = y + topMargin + screenPersonFullH;

    // Draw magnified figure inside screen
    drawHumanoid(ctx, screenPersonX, screenPersonY, screenPersonFullH, true, 'screen');

    // --- Render Lower Third Overlay ---
    drawLowerThird(ctx, x, y, w, h, pxPerMeter);

    // Screen raster / Scanlines overlay effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let lineY = y; lineY < y + h; lineY += 4 * window.devicePixelRatio) {
        ctx.fillRect(x, lineY, w, 1.5 * window.devicePixelRatio);
    }

    ctx.restore();

    // Screen frame glow / border highlight
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1 * window.devicePixelRatio;
    ctx.strokeRect(x, y, w, h);
}

function drawLowerThird(ctx, x, y, w, h, pxPerMeter) {
    // Physical letter height in meters
    const letterHeightMeters = state.textLetterHeightInches * IN_TO_M;
    const textPx = letterHeightMeters * pxPerMeter;

    if (textPx < 1) return; // Unrendered if too small

    ctx.save();

    // Center in the lower vertical third of the screen
    const lowerThirdCenterY = y + h * (5 / 6);
    const textString = "Mr. Presenter";

    // Configure Font
    let fontStylePrefix = '';
    if (state.fontStyle === 'bold' || state.fontStyle === 'bold-condensed') fontStylePrefix += 'bold ';

    let fontStretch = '';
    if (state.fontStyle === 'condensed' || state.fontStyle === 'bold-condensed') {
        fontStylePrefix += 'condensed ';
    }

    ctx.font = `${fontStylePrefix}${Math.max(6, textPx)}px ${state.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textMetrics = ctx.measureText(textString);
    const textWidthPx = textMetrics.width;

    // Semi-transparent red banner background
    const bannerPaddingX = Math.max(12, textPx * 0.8);
    const bannerPaddingY = Math.max(6, textPx * 0.4);
    const bannerW = Math.min(w * 0.95, textWidthPx + bannerPaddingX * 2);
    const bannerH = Math.max(textPx + bannerPaddingY * 2, h * 0.12);

    const bannerX = x + (w - bannerW) / 2;
    const bannerY = lowerThirdCenterY - bannerH / 2;

    // Render Red Banner
    ctx.fillStyle = 'rgba(220, 38, 38, 0.82)'; // Semi-transparent red
    ctx.fillRect(bannerX, bannerY, bannerW, bannerH);

    // Banner border highlight
    ctx.strokeStyle = 'rgba(254, 202, 202, 0.6)';
    ctx.lineWidth = Math.max(1, 1.5 * window.devicePixelRatio);
    ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);

    // Render Black Text
    ctx.fillStyle = '#000000';
    ctx.fillText(textString, x + w / 2, lowerThirdCenterY);

    ctx.restore();
}

/**
 * Draws a stylized, proportional humanoid figure.
 */
function drawHumanoid(ctx, centerX, feetY, totalHeight, isImagScreen, label) {
    if (totalHeight <= 2) return;

    ctx.save();

    const headH = totalHeight * 0.13;
    const headW = headH * 0.78;
    const shoulderW = headH * 2.2;
    const waistW = headH * 1.4;
    const hipsW = headH * 1.6;

    const headTopY = feetY - totalHeight;
    const headCenterY = headTopY + headH / 2;

    const neckY = headTopY + headH;
    const shoulderY = neckY + totalHeight * 0.04;
    const waistY = shoulderY + totalHeight * 0.24;
    const hipsY = shoulderY + totalHeight * 0.36;

    // Color theme
    const skinColor = isImagScreen ? '#f87171' : '#cbd5e1';
    const shirtColor = isImagScreen ? '#38bdf8' : '#3b82f6';
    const pantsColor = isImagScreen ? '#1e293b' : '#1e293b';

    if (isImagScreen) {
        ctx.shadowColor = 'rgba(56, 189, 248, 0.5)';
        ctx.shadowBlur = 10 * window.devicePixelRatio;
    }

    // Legs / Pants
    ctx.fillStyle = pantsColor;
    ctx.beginPath();
    ctx.moveTo(centerX - hipsW * 0.35, hipsY);
    ctx.lineTo(centerX - hipsW * 0.4, feetY);
    ctx.lineTo(centerX - hipsW * 0.05, feetY);
    ctx.lineTo(centerX - hipsW * 0.05, hipsY);
    ctx.moveTo(centerX + hipsW * 0.05, hipsY);
    ctx.lineTo(centerX + hipsW * 0.05, feetY);
    ctx.lineTo(centerX + hipsW * 0.4, feetY);
    ctx.lineTo(centerX + hipsW * 0.35, hipsY);
    ctx.fill();

    // Torso / Shirt
    ctx.fillStyle = shirtColor;
    ctx.beginPath();
    ctx.moveTo(centerX - shoulderW / 2, shoulderY);
    ctx.lineTo(centerX + shoulderW / 2, shoulderY);
    ctx.lineTo(centerX + waistW / 2, waistY);
    ctx.lineTo(centerX + hipsW / 2, hipsY);
    ctx.lineTo(centerX - hipsW / 2, hipsY);
    ctx.lineTo(centerX - waistW / 2, waistY);
    ctx.closePath();
    ctx.fill();

    // Arms
    const armW = headH * 0.35;
    ctx.fillRect(centerX - shoulderW / 2 - armW * 0.8, shoulderY, armW, totalHeight * 0.34);
    ctx.fillRect(centerX + shoulderW / 2 - armW * 0.2, shoulderY, armW, totalHeight * 0.34);

    // Hands
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(centerX - shoulderW / 2 - armW * 0.3, shoulderY + totalHeight * 0.35, armW * 0.5, 0, Math.PI * 2);
    ctx.arc(centerX + shoulderW / 2 + armW * 0.3, shoulderY + totalHeight * 0.35, armW * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Neck
    ctx.fillRect(centerX - headW * 0.25, neckY, headW * 0.5, shoulderY - neckY);

    // Head & Face
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.ellipse(centerX, headCenterY, headW / 2, headH / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(centerX, headCenterY - headH * 0.1, headW * 0.52, Math.PI, Math.PI * 2);
    ctx.fill();

    // Simple facial features
    if (headH > 12 * window.devicePixelRatio) {
        ctx.fillStyle = '#0f172a';
        const eyeY = headCenterY - headH * 0.05;
        const eyeOffset = headW * 0.2;
        ctx.beginPath();
        ctx.arc(centerX - eyeOffset, eyeY, headW * 0.08, 0, Math.PI * 2);
        ctx.arc(centerX + eyeOffset, eyeY, headW * 0.08, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = Math.max(1, 1.5 * window.devicePixelRatio);
        ctx.beginPath();
        ctx.arc(centerX, headCenterY + headH * 0.12, headW * 0.18, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
    }

    ctx.restore();
}

function drawLabelsAndCallouts(ctx, screenX, screenY, screenW, screenH, personX, personY, personH, canvasW, canvasH) {
    ctx.save();
    ctx.font = `${Math.max(10, 12 * window.devicePixelRatio)}px -apple-system, sans-serif`;
    ctx.textAlign = 'center';

    // Label: IMAG Screen
    ctx.fillStyle = '#60a5fa';
    ctx.fillText('IMAG Screen', screenX + screenW / 2, screenY - 10 * window.devicePixelRatio);

    // Label: Stage Person
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('Person on Stage', personX, personY - personH - 10 * window.devicePixelRatio);

    // Distance HUD Banner at Bottom
    const hudY = canvasH - 36 * window.devicePixelRatio;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, hudY, canvasW, 36 * window.devicePixelRatio);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1 * window.devicePixelRatio;
    ctx.beginPath();
    ctx.moveTo(0, hudY);
    ctx.lineTo(canvasW, hudY);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = `${Math.max(11, 13 * window.devicePixelRatio)}px -apple-system, sans-serif`;
    const distFt = (state.distanceM * M_TO_FT).toFixed(0);
    const distM = state.distanceM.toFixed(1);
    const shotTitle = getShotTitle(state.shotType);

    ctx.fillText(`Simulated Viewer Distance: ${distFt} ft (${distM} m)   |   Screen Framing: ${shotTitle}`, canvasW / 2, hudY + 22 * window.devicePixelRatio);

    ctx.restore();
}

function getShotTitle(shot) {
    switch(shot) {
        case 'close-up': return 'Extreme Close-Up';
        case 'head-shoulders': return 'Head & Shoulders';
        case 'waist-up': return 'Waist-Up';
        case 'head-toe': return 'Head-To-Toe';
        default: return 'Head & Shoulders';
    }
}
