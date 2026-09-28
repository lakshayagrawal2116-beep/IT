// ============================================
// IT Service Desk Dashboard — Main JavaScript
// ============================================

// Chart.js default config
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.pointStyleWidth = 12;
Chart.defaults.plugins.legend.labels.padding = 16;
Chart.defaults.animation.duration = 1200;
Chart.defaults.animation.easing = 'easeOutQuart';

// Color palettes
const COLORS = {
    blue:   { bg: 'rgba(99,102,241,0.75)',  border: '#6366f1',  light: 'rgba(99,102,241,0.12)' },
    green:  { bg: 'rgba(16,185,129,0.75)',   border: '#10b981',  light: 'rgba(16,185,129,0.12)' },
    amber:  { bg: 'rgba(245,158,11,0.75)',   border: '#f59e0b',  light: 'rgba(245,158,11,0.12)' },
    purple: { bg: 'rgba(168,85,247,0.75)',   border: '#a855f7',  light: 'rgba(168,85,247,0.12)' },
    teal:   { bg: 'rgba(20,184,166,0.75)',   border: '#14b8a6',  light: 'rgba(20,184,166,0.12)' },
    rose:   { bg: 'rgba(244,63,94,0.75)',    border: '#f43f5e',  light: 'rgba(244,63,94,0.12)' },
    sky:    { bg: 'rgba(56,189,248,0.75)',   border: '#38bdf8',  light: 'rgba(56,189,248,0.12)' },
    indigo: { bg: 'rgba(129,140,248,0.75)',  border: '#818cf8',  light: 'rgba(129,140,248,0.12)' },
};

const CHART_PALETTE = [
    COLORS.blue.bg, COLORS.purple.bg, COLORS.teal.bg, 
    COLORS.amber.bg, COLORS.rose.bg, COLORS.green.bg,
    COLORS.sky.bg, COLORS.indigo.bg
];

const CHART_BORDERS = [
    COLORS.blue.border, COLORS.purple.border, COLORS.teal.border,
    COLORS.amber.border, COLORS.rose.border, COLORS.green.border,
    COLORS.sky.border, COLORS.indigo.border
];

// Set header date
document.getElementById('headerDate').textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

// Animated counter
function animateValue(elementId, endValue, suffix = '', decimals = 0) {
    const el = document.getElementById(elementId);
    const startValue = 0;
    const duration = 1500;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = startValue + (endValue - startValue) * eased;

        if (decimals > 0) {
            el.textContent = current.toFixed(decimals) + suffix;
        } else {
            el.textContent = Math.round(current).toLocaleString() + suffix;
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    requestAnimationFrame(update);
}

// Grid line style for charts
const GRID_STYLE = {
    color: 'rgba(148, 163, 184, 0.08)',
    drawBorder: false,
};

const TICK_STYLE = {
    color: '#64748b',
    font: { size: 11 }
};

// ==========================================
// Load and process CSV
// ==========================================

Papa.parse('./cleaned_data.csv', {
    download: true,
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: function(results) {
        const data = results.data;
        buildDashboard(data);
        // Hide loader
        setTimeout(() => {
            document.getElementById('loadingOverlay').classList.add('hidden');
        }, 400);
    },
    error: function(err) {
        console.error('CSV Parse Error:', err);
        document.getElementById('loadingOverlay').innerHTML = 
            '<div class="loader"><p style="color:#f43f5e;">Error loading data. Make sure cleaned_data.csv exists in the data folder.</p></div>';
    }
});

function buildDashboard(data) {
    // ==========================================
    // KPI Calculations
    // ==========================================
    const totalTickets = data.length;
    const resolvedTickets = data.filter(d => d.Is_Resolved === true || d.Is_Resolved === 'True').length;
    const resolvedRate = ((resolvedTickets / totalTickets) * 100);

    const resolutionHours = data
        .map(d => parseFloat(d.Resolution_Hours))
        .filter(v => !isNaN(v) && v > 0);
    const avgResolution = resolutionHours.reduce((a, b) => a + b, 0) / resolutionHours.length;

    const satisfactionScores = data
        .map(d => parseFloat(d.Satisfaction_Score))
        .filter(v => !isNaN(v));
    const avgSatisfaction = satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length;

    const slaTrue = data.filter(d => d.SLA_Met === true || d.SLA_Met === 'True').length;
    const slaFalse = data.filter(d => d.SLA_Met === false || d.SLA_Met === 'False').length;
    const slaTotal = slaTrue + slaFalse;
    const slaRate = slaTotal > 0 ? ((slaTrue / slaTotal) * 100) : 0;

    const openTickets = data.filter(d => d.Status === 'Open').length;

    // Animate KPIs
    animateValue('totalTickets', totalTickets);
    animateValue('resolvedRate', resolvedRate, '%', 1);
    animateValue('avgResolution', avgResolution, 'h', 1);
    animateValue('avgSatisfaction', avgSatisfaction, '/5', 2);
    animateValue('slaRate', slaRate, '%', 1);
    animateValue('openTickets', openTickets);

    // ==========================================
    // 1. Ticket Volume Trend (Line + Area)
    // ==========================================
    const monthCounts = {};
    data.forEach(d => {
        const m = d.Month;
        if (m) monthCounts[m] = (monthCounts[m] || 0) + 1;
    });

    const sortedMonths = Object.keys(monthCounts).sort();
    const monthValues = sortedMonths.map(m => monthCounts[m]);

    const trendCtx = document.getElementById('trendChart').getContext('2d');
    const trendGradient = trendCtx.createLinearGradient(0, 0, 0, 320);
    trendGradient.addColorStop(0, 'rgba(99,102,241,0.3)');
    trendGradient.addColorStop(1, 'rgba(99,102,241,0.0)');

    new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: sortedMonths.map(m => {
                const [y, mo] = m.split('-');
                const monthNames = ['', 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                return monthNames[parseInt(mo)] + ' ' + y.slice(2);
            }),
            datasets: [{
                label: 'Tickets',
                data: monthValues,
                borderColor: COLORS.blue.border,
                backgroundColor: trendGradient,
                borderWidth: 2.5,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: COLORS.blue.border,
                pointBorderColor: '#111827',
                pointBorderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(17,24,39,0.95)',
                    borderColor: 'rgba(99,102,241,0.3)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    titleFont: { weight: '600' }
                }
            },
            scales: {
                x: {
                    grid: GRID_STYLE,
                    ticks: { ...TICK_STYLE, maxRotation: 45, autoSkip: true, maxTicksLimit: 20 }
                },
                y: {
                    grid: GRID_STYLE,
                    ticks: TICK_STYLE,
                    beginAtZero: true
                }
            }
        }
    });

    // ==========================================
    // 2. Status Doughnut
    // ==========================================
    const statusCounts = {};
    data.forEach(d => {
        const s = d.Status;
        if (s) statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    const statusLabels = Object.keys(statusCounts);
    const statusValues = statusLabels.map(l => statusCounts[l]);
    const statusColors = [COLORS.green.bg, COLORS.amber.bg, COLORS.rose.bg];
    const statusBorders = [COLORS.green.border, COLORS.amber.border, COLORS.rose.border];

    new Chart(document.getElementById('statusChart'), {
        type: 'doughnut',
        data: {
            labels: statusLabels,
            datasets: [{
                data: statusValues,
                backgroundColor: statusColors,
                borderColor: statusBorders,
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 20 }
                },
                tooltip: {
                    backgroundColor: 'rgba(17,24,39,0.95)',
                    borderColor: 'rgba(99,102,241,0.3)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(ctx) {
                            const pct = ((ctx.parsed / totalTickets) * 100).toFixed(1);
                            return ` ${ctx.label}: ${ctx.parsed.toLocaleString()} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });

    // ==========================================
    // 3. Category Bar Chart
    // ==========================================
    const catCounts = {};
    data.forEach(d => {
        const c = d.Category;
        if (c) catCounts[c] = (catCounts[c] || 0) + 1;
    });

    const catLabels = Object.keys(catCounts).sort((a, b) => catCounts[b] - catCounts[a]);
    const catValues = catLabels.map(l => catCounts[l]);

    new Chart(document.getElementById('categoryChart'), {
        type: 'bar',
        data: {
            labels: catLabels,
            datasets: [{
                label: 'Tickets',
                data: catValues,
                backgroundColor: CHART_PALETTE.slice(0, catLabels.length),
                borderColor: CHART_BORDERS.slice(0, catLabels.length),
                borderWidth: 1.5,
                borderRadius: 6,
                barThickness: 36,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(17,24,39,0.95)',
                    borderColor: 'rgba(99,102,241,0.3)',
                    borderWidth: 1,
                    cornerRadius: 8,
                }
            },
            scales: {
                x: { grid: GRID_STYLE, ticks: TICK_STYLE, beginAtZero: true },
                y: { grid: { display: false }, ticks: { ...TICK_STYLE, font: { size: 12, weight: '500' } } }
            }
        }
    });

    // ==========================================
    // 4. Priority Bar Chart
    // ==========================================
    const priorOrder = ['Critical', 'High', 'Medium', 'Low'];
    const priorCounts = {};
    data.forEach(d => {
        const p = d.Priority;
        if (p) priorCounts[p] = (priorCounts[p] || 0) + 1;
    });

    const priorLabels = priorOrder.filter(p => priorCounts[p]);
    const priorValues = priorLabels.map(l => priorCounts[l]);
    const priorColors = [COLORS.rose.bg, COLORS.amber.bg, COLORS.blue.bg, COLORS.teal.bg];
    const priorBorders = [COLORS.rose.border, COLORS.amber.border, COLORS.blue.border, COLORS.teal.border];

    new Chart(document.getElementById('priorityChart'), {
        type: 'bar',
        data: {
            labels: priorLabels,
            datasets: [{
                label: 'Tickets',
                data: priorValues,
                backgroundColor: priorColors,
                borderColor: priorBorders,
                borderWidth: 1.5,
                borderRadius: 8,
                barThickness: 48,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(17,24,39,0.95)',
                    borderColor: 'rgba(99,102,241,0.3)',
                    borderWidth: 1,
                    cornerRadius: 8,
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { ...TICK_STYLE, font: { size: 12, weight: '600' } } },
                y: { grid: GRID_STYLE, ticks: TICK_STYLE, beginAtZero: true }
            }
        }
    });

    // ==========================================
    // 5. Channel Doughnut
    // ==========================================
    const chanCounts = {};
    data.forEach(d => {
        const c = d.Channel;
        if (c) chanCounts[c] = (chanCounts[c] || 0) + 1;
    });

    const chanLabels = Object.keys(chanCounts);
    const chanValues = chanLabels.map(l => chanCounts[l]);

    new Chart(document.getElementById('channelChart'), {
        type: 'doughnut',
        data: {
            labels: chanLabels,
            datasets: [{
                data: chanValues,
                backgroundColor: [COLORS.blue.bg, COLORS.purple.bg, COLORS.teal.bg, COLORS.amber.bg],
                borderColor: [COLORS.blue.border, COLORS.purple.border, COLORS.teal.border, COLORS.amber.border],
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 20 }
                },
                tooltip: {
                    backgroundColor: 'rgba(17,24,39,0.95)',
                    borderColor: 'rgba(99,102,241,0.3)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(ctx) {
                            const pct = ((ctx.parsed / totalTickets) * 100).toFixed(1);
                            return ` ${ctx.label}: ${ctx.parsed.toLocaleString()} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });

    // ==========================================
    // 6. Avg Resolution Hours by Priority
    // ==========================================
    const resByPriority = {};
    data.forEach(d => {
        const p = d.Priority;
        const h = parseFloat(d.Resolution_Hours);
        if (p && !isNaN(h) && h > 0) {
            if (!resByPriority[p]) resByPriority[p] = [];
            resByPriority[p].push(h);
        }
    });

    const resPriorLabels = priorOrder.filter(p => resByPriority[p]);
    const resPriorValues = resPriorLabels.map(l => {
        const arr = resByPriority[l];
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    });

    // SLA threshold line data
    const slaThresholds = { 'Critical': 4, 'High': 8, 'Medium': 24, 'Low': 48 };
    const slaLineValues = resPriorLabels.map(l => slaThresholds[l]);

    new Chart(document.getElementById('resolutionByPriorityChart'), {
        type: 'bar',
        data: {
            labels: resPriorLabels,
            datasets: [
                {
                    label: 'Avg Resolution (hrs)',
                    data: resPriorValues.map(v => v.toFixed(2)),
                    backgroundColor: [
                        'rgba(244,63,94,0.65)', 'rgba(245,158,11,0.65)',
                        'rgba(99,102,241,0.65)', 'rgba(20,184,166,0.65)'
                    ],
                    borderColor: [COLORS.rose.border, COLORS.amber.border, COLORS.blue.border, COLORS.teal.border],
                    borderWidth: 1.5,
                    borderRadius: 8,
                    barThickness: 48,
                },
                {
                    label: 'SLA Threshold (hrs)',
                    data: slaLineValues,
                    type: 'line',
                    borderColor: '#f43f5e',
                    borderWidth: 2,
                    borderDash: [6, 4],
                    pointBackgroundColor: '#f43f5e',
                    pointRadius: 5,
                    fill: false,
                    tension: 0,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { padding: 16 }
                },
                tooltip: {
                    backgroundColor: 'rgba(17,24,39,0.95)',
                    borderColor: 'rgba(99,102,241,0.3)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(ctx) {
                            return ` ${ctx.dataset.label}: ${parseFloat(ctx.parsed.y).toFixed(2)} hrs`;
                        }
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { ...TICK_STYLE, font: { size: 12, weight: '600' } } },
                y: { grid: GRID_STYLE, ticks: TICK_STYLE, beginAtZero: true, title: { display: true, text: 'Hours', color: '#64748b' } }
            }
        }
    });

    // ==========================================
    // 7. SLA Compliance by Priority (Stacked Bar)
    // ==========================================
    const slaByPriority = {};
    data.forEach(d => {
        const p = d.Priority;
        const sla = d.SLA_Met;
        if (p && (sla === true || sla === 'True' || sla === false || sla === 'False')) {
            if (!slaByPriority[p]) slaByPriority[p] = { met: 0, breached: 0 };
            if (sla === true || sla === 'True') {
                slaByPriority[p].met++;
            } else {
                slaByPriority[p].breached++;
            }
        }
    });

    const slaPriorLabels = priorOrder.filter(p => slaByPriority[p]);
    const slaMetValues = slaPriorLabels.map(l => slaByPriority[l].met);
    const slaBreachedValues = slaPriorLabels.map(l => slaByPriority[l].breached);

    new Chart(document.getElementById('slaChart'), {
        type: 'bar',
        data: {
            labels: slaPriorLabels,
            datasets: [
                {
                    label: 'SLA Met',
                    data: slaMetValues,
                    backgroundColor: COLORS.green.bg,
                    borderColor: COLORS.green.border,
                    borderWidth: 1.5,
                    borderRadius: 6,
                },
                {
                    label: 'SLA Breached',
                    data: slaBreachedValues,
                    backgroundColor: COLORS.rose.bg,
                    borderColor: COLORS.rose.border,
                    borderWidth: 1.5,
                    borderRadius: 6,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { padding: 16 }
                },
                tooltip: {
                    backgroundColor: 'rgba(17,24,39,0.95)',
                    borderColor: 'rgba(99,102,241,0.3)',
                    borderWidth: 1,
                    cornerRadius: 8,
                }
            },
            scales: {
                x: { stacked: true, grid: { display: false }, ticks: { ...TICK_STYLE, font: { size: 12, weight: '600' } } },
                y: { stacked: true, grid: GRID_STYLE, ticks: TICK_STYLE, beginAtZero: true }
            }
        }
    });

    // ==========================================
    // 8. Satisfaction Score Distribution
    // ==========================================
    const satBuckets = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    satisfactionScores.forEach(s => {
        const bucket = Math.round(s).toString();
        if (satBuckets.hasOwnProperty(bucket)) satBuckets[bucket]++;
    });

    const satLabels = ['1 ★', '2 ★★', '3 ★★★', '4 ★★★★', '5 ★★★★★'];
    const satValues = ['1','2','3','4','5'].map(k => satBuckets[k]);
    const satColors = [
        'rgba(244,63,94,0.7)', 'rgba(245,158,11,0.7)', 'rgba(234,179,8,0.7)',
        'rgba(34,197,94,0.7)', 'rgba(16,185,129,0.7)'
    ];
    const satBorderColors = ['#f43f5e', '#f59e0b', '#eab308', '#22c55e', '#10b981'];

    new Chart(document.getElementById('satisfactionChart'), {
        type: 'bar',
        data: {
            labels: satLabels,
            datasets: [{
                label: 'Responses',
                data: satValues,
                backgroundColor: satColors,
                borderColor: satBorderColors,
                borderWidth: 1.5,
                borderRadius: 8,
                barThickness: 36,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(17,24,39,0.95)',
                    borderColor: 'rgba(99,102,241,0.3)',
                    borderWidth: 1,
                    cornerRadius: 8,
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { ...TICK_STYLE, font: { size: 11, weight: '500' } } },
                y: { grid: GRID_STYLE, ticks: TICK_STYLE, beginAtZero: true }
            }
        }
    });

    // ==========================================
    // 9. Top 10 Products
    // ==========================================
    const prodCounts = {};
    data.forEach(d => {
        const p = d.Product;
        if (p) prodCounts[p] = (prodCounts[p] || 0) + 1;
    });

    const sortedProducts = Object.entries(prodCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const prodLabels = sortedProducts.map(e => e[0]);
    const prodValues = sortedProducts.map(e => e[1]);

    const prodCtx = document.getElementById('productChart').getContext('2d');
    const prodGradient = prodCtx.createLinearGradient(0, 0, 400, 0);
    prodGradient.addColorStop(0, 'rgba(168,85,247,0.7)');
    prodGradient.addColorStop(1, 'rgba(99,102,241,0.7)');

    new Chart(prodCtx, {
        type: 'bar',
        data: {
            labels: prodLabels,
            datasets: [{
                label: 'Tickets',
                data: prodValues,
                backgroundColor: prodGradient,
                borderColor: 'rgba(168,85,247,0.9)',
                borderWidth: 1,
                borderRadius: 6,
                barThickness: 20,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(17,24,39,0.95)',
                    borderColor: 'rgba(99,102,241,0.3)',
                    borderWidth: 1,
                    cornerRadius: 8,
                }
            },
            scales: {
                x: { grid: GRID_STYLE, ticks: TICK_STYLE, beginAtZero: true },
                y: { grid: { display: false }, ticks: { ...TICK_STYLE, font: { size: 11 } } }
            }
        }
    });

    // ==========================================
    // 10. Day of Week Bar
    // ==========================================
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayCounts = {};
    data.forEach(d => {
        const day = d.Day;
        if (day) dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    const dayLabels = dayOrder.filter(d => dayCounts[d]);
    const dayValues = dayLabels.map(d => dayCounts[d]);
    const dayColors = dayLabels.map((d, i) => {
        if (d === 'Saturday' || d === 'Sunday') return 'rgba(244,63,94,0.6)';
        return `rgba(99,102,241,${0.4 + i * 0.08})`;
    });

    new Chart(document.getElementById('dayChart'), {
        type: 'bar',
        data: {
            labels: dayLabels.map(d => d.slice(0, 3)),
            datasets: [{
                label: 'Tickets',
                data: dayValues,
                backgroundColor: dayColors,
                borderColor: dayLabels.map(d => (d === 'Saturday' || d === 'Sunday') ? '#f43f5e' : '#6366f1'),
                borderWidth: 1.5,
                borderRadius: 8,
                barThickness: 36,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(17,24,39,0.95)',
                    borderColor: 'rgba(99,102,241,0.3)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: {
                        title: function(tooltipItems) {
                            return dayLabels[tooltipItems[0].dataIndex];
                        }
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { ...TICK_STYLE, font: { size: 12, weight: '600' } } },
                y: { grid: GRID_STYLE, ticks: TICK_STYLE, beginAtZero: true }
            }
        }
    });

    // ==========================================
    // 11. Satisfaction Heatmap (Category × Priority)
    // ==========================================
    const categories = [...new Set(data.map(d => d.Category))].filter(Boolean).sort();
    const priorities = priorOrder;

    const heatmapData = {};
    data.forEach(d => {
        const cat = d.Category;
        const pri = d.Priority;
        const sat = parseFloat(d.Satisfaction_Score);
        if (cat && pri && !isNaN(sat)) {
            const key = `${cat}|${pri}`;
            if (!heatmapData[key]) heatmapData[key] = [];
            heatmapData[key].push(sat);
        }
    });

    // Build datasets: one bar group per priority
    const heatmapDatasets = priorities.map((pri, idx) => {
        const values = categories.map(cat => {
            const key = `${cat}|${pri}`;
            const arr = heatmapData[key];
            if (!arr || arr.length === 0) return 0;
            return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
        });
        return {
            label: pri,
            data: values,
            backgroundColor: [COLORS.rose.bg, COLORS.amber.bg, COLORS.blue.bg, COLORS.teal.bg][idx],
            borderColor: [COLORS.rose.border, COLORS.amber.border, COLORS.blue.border, COLORS.teal.border][idx],
            borderWidth: 1.5,
            borderRadius: 4,
        };
    });

    new Chart(document.getElementById('heatmapChart'), {
        type: 'bar',
        data: {
            labels: categories,
            datasets: heatmapDatasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { padding: 16 }
                },
                tooltip: {
                    backgroundColor: 'rgba(17,24,39,0.95)',
                    borderColor: 'rgba(99,102,241,0.3)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(ctx) {
                            return ` ${ctx.dataset.label}: ${ctx.parsed.y} avg rating`;
                        }
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { ...TICK_STYLE, font: { size: 11, weight: '500' } } },
                y: {
                    grid: GRID_STYLE,
                    ticks: TICK_STYLE,
                    beginAtZero: true,
                    max: 5,
                    title: { display: true, text: 'Avg Satisfaction', color: '#64748b' }
                }
            }
        }
    });
}
