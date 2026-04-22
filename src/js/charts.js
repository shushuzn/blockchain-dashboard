let chartInstance = null;
let chartRange = 1;
let activeMetrics = { gas: true, baseFee: true, blobFee: false, util: true };

function setChartRange(days) {
  chartRange = days;
  document.querySelectorAll('.chart-range-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.range) === days);
  });
  renderChart();
}

function toggleMetric(metric) {
  if (metric === 'blobFee' && !CHAINS.find(c => c.id === activeChart)?.hasBlob) return;
  activeMetrics[metric] = !activeMetrics[metric];
  document.querySelectorAll('.metric-toggle').forEach(b => {
    if (b.dataset.metric === metric) b.classList.toggle('active', activeMetrics[metric]);
  });
  renderChart();
}

function getFilteredHistory(chainId) {
  const now = Date.now();
  const cutoff = now - chartRange * 24 * 60 * 60 * 1000;
  return (history[chainId] || []).filter(p => p.t >= cutoff);
}

function renderChart() {
  const container = document.getElementById('chart');
  container.innerHTML = '';

  const chain = CHAINS.find(c => c.id === activeChart);
  const data  = getFilteredHistory(activeChart);

  if (chartInstance) {
    chartInstance.remove();
  }
  
  chartInstance = LightweightCharts.createChart(container, {
    width: container.clientWidth || 600,
    height: 220,
    layout: {
      background: { color: '#111827' },
      textColor: '#6b7280',
      fontSize: 10,
    },
    grid: {
      vertLines: { color: '#1f2937' },
      horzLines: { color: '#1f2937' },
    },
    crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
    timeScale: {
      borderColor: '#1f2937',
      timeVisible: true,
      secondsVisible: false,
    },
    rightPriceScale: { borderColor: '#1f2937' },
  });

  if (activeMetrics.gas) {
    const gasSeries = chartInstance.addLineSeries({
      color: '#10b981', lineWidth: 1.5, title: 'Priority Fee',
      priceFormat: { precision: 3, minMove: 0.001 },
    });
    gasSeries.setData(data.filter(d => d.gas != null).map(d => ({ time: d.t / 1000, value: d.gas })));
  }

  if (activeMetrics.baseFee) {
    const baseFeeSeries = chartInstance.addLineSeries({
      color: '#f59e0b', lineWidth: 1.5, title: 'Base Fee',
      priceFormat: { precision: 3, minMove: 0.001 },
    });
    baseFeeSeries.setData(data.filter(d => d.baseFee != null).map(d => ({ time: d.t / 1000, value: d.baseFee })));
  }

  if (activeMetrics.blobFee && chain?.hasBlob) {
    const blobFeeSeries = chartInstance.addLineSeries({
      color: '#a78bfa', lineWidth: 1.5, title: 'Blob Fee',
      priceFormat: { precision: 5, minMove: 0.00001 },
    });
    blobFeeSeries.setData(data.filter(d => d.blobFee != null).map(d => ({ time: d.t / 1000, value: d.blobFee })));
  }

  if (activeMetrics.util) {
    const utilSeries = chartInstance.addLineSeries({
      color: '#22d3ee', lineWidth: 1.5, title: 'Gas Util %',
      priceFormat: { precision: 1, minMove: 0.1 },
      priceScaleId: 'util',
    });
    chartInstance.priceScale('util').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    utilSeries.setData(data.filter(d => d.util != null).map(d => ({ time: d.t / 1000, value: d.util })));
  }

  chartInstance.timeScale().fitContent();

  const count = data.length;
  const startDate = data.length > 0 ? new Date(data[0].t).toLocaleDateString() : '--';
  const endDate   = data.length > 0 ? new Date(data[data.length-1].t).toLocaleDateString() : '--';
  document.getElementById('chartMeta').textContent = count > 0 ? `${count} pts · ${startDate} → ${endDate}` : 'No data yet';

  const ro = new ResizeObserver(() => {
    if (chartInstance) {
      chartInstance.applyOptions({ width: container.clientWidth });
    }
  });
  ro.observe(container);

  updateStorageBar();
}
