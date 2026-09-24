'use client';

import { useEffect, useState, useRef, Fragment, useMemo } from 'react';
import {
  Chart,
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js';

Chart.register(
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale
);

// ─── Section colour palette ───────────────────────────────────
const SECTION_STYLES = {
  'WP2/1': {
    color: 'var(--accent-blue)',
    dim: 'var(--accent-blue-dim)',
    icon: '◼',
    hex: '#7c8a6e',
  },
  'WP2/2': {
    color: 'var(--accent-green)',
    dim: 'var(--accent-green-dim)',
    icon: '🟢',
    hex: '#556a43',
  },
  'WP2/3': {
    color: 'var(--accent-purple)',
    dim: 'var(--accent-purple-dim)',
    icon: '🟤',
    hex: '#a88664',
  },
};

function getSectionStyle(section) {
  return (
    SECTION_STYLES[section] || {
      color: 'var(--accent-amber)',
      dim: 'var(--accent-amber-dim)',
      icon: '🟡',
      hex: '#c9a872',
    }
  );
}

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({ icon, value, label, sub, accentColor, delay }) {
  return (
    <div
      className={`stat-card animate-in animate-delay-${delay}`}
      style={{ '--card-accent': accentColor }}
    >
      <div
        className="stat-icon"
        style={{ background: `${accentColor}22`, color: accentColor }}
      >
        {icon}
      </div>
      <div className="stat-value" style={{ color: accentColor }}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

// ─── Section Overview Card ────────────────────────────────────
function SectionCard({ s, isActive, onClick }) {
  const style = getSectionStyle(s.section);
  return (
    <div
      className={`section-card${isActive ? ' active-section' : ''}`}
      style={{ '--s-color': style.color, '--s-dim': style.dim }}
      onClick={onClick}
    >
      <div className="section-card-header">
        <div className="section-badge">
          {style.icon} {s.section}
        </div>
        <div className="section-rate-badge">{s.paymentRate}%</div>
      </div>
      <div className="section-stats-row">
        <div className="section-mini-stat">
          <div className="section-mini-val" style={{ color: style.color }}>
            {s.totalResidents}
          </div>
          <div className="section-mini-label">Units</div>
        </div>
        <div className="section-mini-stat">
          <div
            className="section-mini-val"
            style={{ color: 'var(--accent-green)' }}
          >
            {s.totalPaid}
          </div>
          <div className="section-mini-label">Paid</div>
        </div>
        <div className="section-mini-stat">
          <div
            className="section-mini-val"
            style={{ color: 'var(--accent-red)' }}
          >
            {s.totalUnpaid}
          </div>
          <div className="section-mini-label">Unpaid</div>
        </div>
        <div className="section-mini-stat">
          <div
            className="section-mini-val"
            style={{ color: 'var(--accent-amber)' }}
          >
            RM {s.totalCollected.toLocaleString()}
          </div>
          <div className="section-mini-label">Collected</div>
        </div>
      </div>
      <div className="section-progress-track">
        <div
          className="section-progress-fill"
          style={{ width: `${s.paymentRate}%` }}
        />
      </div>
      <div className="section-resident-count">
        {s.paymentRate}% payment rate · click to filter grid
      </div>
    </div>
  );
}

// ─── Doughnut Chart ───────────────────────────────────────────
function DoughnutChart({ paid, unpaid }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Paid', 'Unpaid'],
        datasets: [
          {
            data: [paid, unpaid],
            backgroundColor: ['rgba(85,106,67,0.85)', 'rgba(161,95,51,0.6)'],
            borderColor: ['rgba(85,106,67,0.3)', 'rgba(161,95,51,0.3)'],
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        animation: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#6f695d',
              padding: 16,
              font: { family: 'Inter', size: 12 },
              usePointStyle: true,
              pointStyleWidth: 10,
            },
          },
          tooltip: {
            backgroundColor: 'rgba(62, 55, 45, 0.96)',
            borderColor: 'rgba(138, 117, 91, 0.18)',
            borderWidth: 1,
            titleColor: '#f0ede5',
            bodyColor: '#6f695d',
            padding: 12,
            callbacks: {
              label: (ctx) => `  ${ctx.label}: ${ctx.raw} payments`,
            },
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [paid, unpaid]);

  return (
    <div className="chart-container" style={{ maxHeight: 280 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

// ─── Section Doughnut Chart (3 sections) ─────────────────────
function SectionDoughnutChart({ sectionSummary }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !sectionSummary?.length) return;
    if (chartRef.current) chartRef.current.destroy();

    const hexColors = sectionSummary.map(
      (s) => getSectionStyle(s.section).hex
    );

    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: sectionSummary.map((s) => s.section),
        datasets: [
          {
            label: 'Paid',
            data: sectionSummary.map((s) => s.totalPaid),
            backgroundColor: hexColors.map((c) => c + 'cc'),
            borderColor: hexColors.map((c) => c + '44'),
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        animation: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#6f695d',
              padding: 16,
              font: { family: 'Inter', size: 12 },
              usePointStyle: true,
              pointStyleWidth: 10,
            },
          },
          tooltip: {
            backgroundColor: 'rgba(62, 55, 45, 0.96)',
            borderColor: 'rgba(138, 117, 91, 0.18)',
            borderWidth: 1,
            titleColor: '#f0ede5',
            bodyColor: '#6f695d',
            padding: 12,
            callbacks: {
              label: (ctx) =>
                `  ${ctx.label}: ${ctx.raw} paid · RM ${(ctx.raw * 100).toLocaleString()}`,
            },
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [sectionSummary]);

  return (
    <div className="chart-container" style={{ maxHeight: 280 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────
function BarChart({ labels, data }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Collected (RM)',
            data,
            backgroundColor: labels.map(
              (_, i) => `hsla(${40 + i * 8}, 28%, 44%, 0.72)`
            ),
            borderColor: labels.map(
              (_, i) => `hsla(${40 + i * 8}, 28%, 36%, 0.92)`
            ),
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(62, 55, 45, 0.96)',
            borderColor: 'rgba(138, 117, 91, 0.18)',
            borderWidth: 1,
            titleColor: '#f0ede5',
            bodyColor: '#6f695d',
            padding: 12,
            callbacks: {
              label: (ctx) => `  RM ${ctx.raw.toLocaleString()}`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(138, 117, 91, 0.18)' },
            ticks: { color: '#6f695d', font: { family: 'Inter', size: 11 } },
          },
          y: {
            grid: { color: 'rgba(138, 117, 91, 0.18)' },
            ticks: {
              color: '#6f695d',
              font: { family: 'Inter', size: 11 },
              callback: (v) => `RM ${v}`,
            },
            beginAtZero: true,
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [labels, data]);

  return (
    <div className="chart-container" style={{ maxHeight: 260 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

// ─── Payment Cell ─────────────────────────────────────────────
function PaymentCell({ isPaid, month, resident }) {
  return (
    <div
      className={`payment-cell cell-tooltip ${isPaid ? 'paid' : 'unpaid'}`}
      data-tip={
        isPaid
          ? `✓ ${resident} paid ${month}`
          : `✗ ${resident} unpaid ${month}`
      }
    >
      {isPaid ? (
        <div className="cell-dot-paid" />
      ) : (
        <div className="cell-dot-unpaid" />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [activeSection, setActiveSection] = useState('all');
  const [expandedRow, setExpandedRow] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [tunggakan, setTunggakan] = useState([]);
  const [showTunggakan, setShowTunggakan] = useState(false);
  const [tunggakanFilter, setTunggakanFilter] = useState('all');
  const [expandedTunggakan, setExpandedTunggakan] = useState(null);

  useEffect(() => {
    fetch('/payments-data.json')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setSheets(d.sheets);
        setTunggakan(d.tunggakan || []);
        setGeneratedAt(d.generatedAt || null);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="loading-screen">
          <div className="spinner" />
          <div className="loading-text">Loading payment data…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-wrapper" style={{ paddingTop: 40 }}>
        <div className="error-card">
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            Failed to load payments
          </div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!sheets.length) {
    return (
      <div className="dashboard-wrapper" style={{ paddingTop: 40 }}>
        <div className="error-card">No data found in the Excel file.</div>
      </div>
    );
  }

  const sheet = sheets[activeSheet];
  const { stats, months, residents, monthlySummary, sectionSummary } = sheet;

  // Count residents who paid every single month
  const fullYearPayers = residents.filter((r) => r.totalUnpaid === 0).length;
  const fullYearRate = Math.round((fullYearPayers / stats.totalResidents) * 100);

  // Filter residents by section + search + month
  const filteredResidents = residents.filter((r) => {
    const matchSection =
      activeSection === 'all' || r.section === activeSection;
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());

    if (!matchSection || !matchSearch) return false;
    if (filterMonth === 'all') return true;
    if (filterMonth === 'full') return r.totalUnpaid === 0;
    if (filterMonth === 'partial') return r.totalPaid > 0 && r.totalUnpaid > 0;
    if (filterMonth === 'none') return r.totalPaid === 0;
    return r.payments[filterMonth] === true;
  });

  // Group filtered residents by section (for grid headers)
  const groupedResidents = [];
  let lastSection = null;
  let rowNum = 0;
  for (const r of filteredResidents) {
    if (r.section !== lastSection) {
      groupedResidents.push({ type: 'header', section: r.section });
      lastSection = r.section;
    }
    rowNum++;
    groupedResidents.push({ type: 'resident', data: r, rowNum });
  }

  function getSummaryClass(r) {
    const rate = r.totalPaid / (r.totalPaid + r.totalUnpaid);
    if (rate >= 0.8) return 'high';
    if (rate >= 0.4) return 'medium';
    return 'low';
  }

  function getInitials(name) {
    const parts = name.split('_');
    return parts.length > 1
      ? parts[0].slice(0, 2)
      : name.slice(0, 2).toUpperCase();
  }

  const sectionResidentCount = (sec) =>
    residents.filter((r) => r.section === sec).length;

  // ─── Tunggakan computed values ───────────────────────────────
  const TUNGGAKAN_THRESHOLDS = { all: 0, '3': 3, '6': 6, '12': 12 };
  const filteredTunggakan = tunggakan.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      u.name.toLowerCase().includes(q) ||
      (u.residentName || '').toLowerCase().includes(q);
    const threshold = TUNGGAKAN_THRESHOLDS[tunggakanFilter] ?? 0;
    const matchFilter = u.totalUnpaid <= threshold;
    return matchSearch && (tunggakanFilter === 'all' ? true : matchFilter);
  });
  const tunggakanWithArrears = tunggakan.filter((u) => u.totalUnpaid > 0).length;
  const totalOwed = tunggakan.reduce((s, u) => s + u.amountOwed, 0);
  const totalUnpaidMonths = tunggakan.reduce((s, u) => s + u.totalUnpaid, 0);

  return (
    <div className="dashboard-wrapper">
      {/* ─── Header ─── */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="header-logo">🏢</div>
          <div>
            <div className="header-title">Avista Payments Dashboard</div>
            <div className="header-subtitle">
              Resident maintenance fee tracker · RM100 per payment
            </div>
          </div>
        </div>
        <div className="header-badge">
          <div className="badge-dot" style={{ background: 'var(--accent-amber)', boxShadow: '0 0 8px var(--accent-amber)' }} />
          <span>Cached</span>
          {generatedAt && (
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              · Updated {new Date(generatedAt).toLocaleDateString('en-MY', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
          )}
        </div>
      </header>

      {/* ─── Sheet Tabs ─── */}
      <div className="sheet-tabs">
        {sheets.map((s, i) => (
          <button
            key={i}
            className={`sheet-tab ${!showTunggakan && i === activeSheet ? 'active' : ''}`}
            onClick={() => {
              setActiveSheet(i);
              setShowTunggakan(false);
              setSearch('');
              setFilterMonth('all');
              setActiveSection('all');
              setExpandedRow(null);
            }}
          >
            📋 {s.sheetName}
          </button>
        ))}
        <button
          className={`sheet-tab ${showTunggakan ? 'active' : ''}`}
          style={{ '--tab-accent': 'var(--accent-red)' }}
          onClick={() => {
            setShowTunggakan(true);
            setSearch('');
          }}
        >
          ⚠️ Total Tunggakan
        </button>
      </div>


      {/* ─── Tunggakan View ─── */}
      {showTunggakan && (
        <>
          <div className="stats-grid">
            <StatCard
              icon="⚠️"
              value={tunggakanWithArrears}
              label="Units with Arrears"
              sub={`Out of ${tunggakan.length} total units`}
              accentColor="var(--accent-red)"
              delay={1}
            />
            <StatCard
              icon="💸"
              value={`RM ${totalOwed.toLocaleString()}`}
              label="Total Tunggakan"
              sub={`${totalUnpaidMonths} unpaid month-slots`}
              accentColor="var(--accent-amber)"
              delay={2}
            />
            <StatCard
              icon="📅"
              value={totalUnpaidMonths}
              label="Unpaid Month-Slots"
              sub="Across all years 2018–2026"
              accentColor="var(--accent-purple)"
              delay={3}
            />
          </div>

          <div className="grid-card animate-in animate-delay-4">
            <div className="grid-header">
              <div className="card-title" style={{ margin: 0 }}>
                <span className="card-title-icon">⚠️</span>
                Total Tunggakan 2018–2026
              </div>
            </div>

            {/* Search + Filter */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)' }}>
              {/* Month threshold filter */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', alignSelf: 'center' }}>
                  Tunggakan:
                </span>
                {[
                  { key: 'all', label: 'All' },
                  { key: '3',   label: '≤ 3 months' },
                  { key: '6',   label: '≤ 6 months' },
                  { key: '12',  label: '≤ 12 months' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setTunggakanFilter(key)}
                    style={{
                      padding: '4px 14px',
                      borderRadius: 20,
                      border: '1px solid',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      borderColor: tunggakanFilter === key ? 'var(--accent-red)' : 'var(--glass-border)',
                      background: tunggakanFilter === key ? 'rgba(161,95,51,0.18)' : 'transparent',
                      color: tunggakanFilter === key ? 'var(--accent-red)' : 'var(--text-muted)',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="controls-bar">
                <div className="search-box">
                  <span className="search-icon">🔍</span>
                  <input
                    className="search-input"
                    type="text"
                    placeholder="Search unit or resident name…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="results-count">
                  {filteredTunggakan.length} of {tunggakan.length} units
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="grid-scroll-wrapper">
              <table className="payment-table">
                <thead>
                  <tr>
                    <th className="col-name">#&nbsp; Unit No.</th>
                    <th style={{ minWidth: 180 }}>Owner / Resident</th>
                    <th>Jalan</th>
                    <th style={{ textAlign: 'center' }}>Unpaid Months</th>
                    <th style={{ textAlign: 'center' }}>Amount Owed (RM)</th>
                    <th style={{ textAlign: 'center', width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTunggakan.length === 0 ? (
                    <tr className="empty-row">
                      <td colSpan={6}>No units match your search</td>
                    </tr>
                  ) : (
                    filteredTunggakan.map((u, idx) => {
                      const isExpanded = expandedTunggakan === u.name;
                      const hasBreakdown = u.yearlyBreakdown && u.yearlyBreakdown.length > 0;
                      return (
                        <Fragment key={u.name}>
                          <tr
                            className={`resident-row tunggakan-main-row${isExpanded ? ' tunggakan-row-expanded' : ''}`}
                            onClick={() => hasBreakdown && setExpandedTunggakan(isExpanded ? null : u.name)}
                            style={{ cursor: hasBreakdown ? 'pointer' : 'default' }}
                          >
                            <td className="td-name">
                              <div className="resident-name-wrap">
                                <div
                                  className="resident-avatar"
                                  style={{
                                    background: getSectionStyle(u.section).dim,
                                    color: getSectionStyle(u.section).color,
                                    borderColor: getSectionStyle(u.section).color + '44',
                                  }}
                                >
                                  {idx + 1}
                                </div>
                                <div className="resident-name">{u.name}</div>
                              </div>
                            </td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                              {u.residentName || <span style={{ opacity: 0.4 }}>—</span>}
                            </td>
                            <td style={{ color: getSectionStyle(u.section).color, fontWeight: 600 }}>
                              {u.section}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 10px',
                                  borderRadius: 12,
                                  background: u.totalUnpaid > 0 ? 'rgba(161,95,51,0.15)' : 'rgba(85,106,67,0.12)',
                                  color: u.totalUnpaid > 0 ? 'var(--accent-red)' : 'var(--accent-green)',
                                  fontWeight: 700,
                                  fontSize: 13,
                                }}
                              >
                                {u.totalUnpaid}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 700, color: u.totalUnpaid > 0 ? 'var(--accent-amber)' : 'var(--accent-green)', fontSize: 14 }}>
                              RM {u.amountOwed.toLocaleString()}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {hasBreakdown && (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    background: isExpanded ? 'rgba(161,95,51,0.18)' : 'rgba(255,255,255,0.06)',
                                    color: isExpanded ? 'var(--accent-red)' : 'var(--text-muted)',
                                    fontSize: 13,
                                    transition: 'transform 0.25s, background 0.2s',
                                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                  }}
                                >
                                  ▾
                                </span>
                              )}
                            </td>
                          </tr>

                          {/* ── Expanded yearly breakdown ── */}
                          {isExpanded && hasBreakdown && (
                            <tr className="tunggakan-expand-row">
                              <td colSpan={6} style={{ padding: 0 }}>
                                <div className="tunggakan-expand-panel">
                                  <div className="tunggakan-expand-title">
                                    📋 Yearly Breakdown — {u.name}
                                  </div>
                                  <div className="tunggakan-year-grid">
                                    {u.yearlyBreakdown.map((yd) => (
                                      <div key={yd.year} className="tunggakan-year-card">
                                        <div className="tunggakan-year-label">{yd.year}</div>
                                        <div className="tunggakan-year-stats">
                                          <span className="tunggakan-year-unpaid">{yd.unpaid} unpaid</span>
                                          <span className="tunggakan-year-amount">RM {(yd.unpaid * 100).toLocaleString()}</span>
                                        </div>
                                        <div className="tunggakan-month-tags">
                                          {yd.unpaidMonths.map((m) => (
                                            <span key={m} className="tunggakan-month-tag">{m}</span>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ─── Normal year view ─── */}
      {!showTunggakan && (
        <>

      {/* ─── Overall Stats ─── */}
      <div className="stats-grid">
        <StatCard
          icon="🏠"
          value={stats.totalResidents}
          label="Total Units"
          sub={`Across ${stats.totalMonths} months`}
          accentColor="var(--accent-blue)"
          delay={1}
        />
        <StatCard
          icon="🏆"
          value={`${fullYearPayers}/${stats.totalResidents}`}
          label="Full Year Paid"
          sub={`RM ${(fullYearPayers * stats.totalMonths * 100).toLocaleString()} · ${fullYearRate}% of units`}
          accentColor="var(--accent-amber)"
          delay={2}
        />
        <StatCard
          icon="📈"
          value={`${fullYearRate}%`}
          label="Full Year Rate"
          sub={
            fullYearRate >= 80
              ? '🟢 Excellent'
              : fullYearRate >= 50
              ? '🟡 Moderate'
              : '🔴 Needs attention'
          }
          accentColor="var(--accent-purple)"
          delay={3}
        />
      </div>

      {/* ─── Monthly Summary Bar ─── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: 12,
          padding: '12px 20px',
          marginBottom: 16,
          overflowX: 'auto',
          gap: 4,
        }}
      >
        {monthlySummary.map((m) => (
          <div key={m.month} style={{ textAlign: 'center', flex: 1, minWidth: 48 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--accent-green)' }}>{m.paid}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>paid</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{m.month}</div>
            <div style={{ fontSize: 10, color: 'var(--accent-red)', marginTop: 2, opacity: 0.85 }}>{m.unpaid} unpaid</div>
          </div>
        ))}
      </div>

      {/* ─── Section Overview Cards ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
        }}
      >
        <div className="card-title" style={{ margin: 0 }}>
          <span className="card-title-icon">🏘️</span>
          Jalan Breakdown
        </div>

      </div>
      <div className="section-overview animate-in animate-delay-2">
        {sectionSummary.map((s) => {
          const style = getSectionStyle(s.section);
          return (
            <SectionCard
              key={s.section}
              s={s}
              isActive={activeSection === s.section}
              onClick={() => {
                setActiveSection(
                  activeSection === s.section ? 'all' : s.section
                );
                setExpandedRow(null);
              }}
            />
          );
        })}
      </div>




      {/* ─── Payment Grid ─── */}
      <div className="grid-card animate-in animate-delay-4">
        <div className="grid-header">
          <div className="card-title" style={{ margin: 0 }}>
            <span className="card-title-icon">🗂️</span>
            Payment Grid
          </div>
          <div className="legend-row">
            <div className="legend-item">
              <div
                className="legend-dot"
                style={{
                  background: 'var(--accent-green)',
                  boxShadow: '0 0 6px rgba(85,106,67,0.35)',
                }}
              />
              Paid
            </div>
            <div className="legend-item">
              <div
                className="legend-dot"
                style={{ background: 'rgba(161,95,51,0.4)' }}
              />
              Unpaid
            </div>
          </div>
        </div>

        {/* Controls */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--glass-border)',
          }}
        >
          {/* Section filter tabs */}
          <div
            style={{
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Jalan:
            </span>
            <div className="section-filter-tabs">
              <button
                className={`section-filter-tab ${activeSection === 'all' ? 'active' : ''}`}
                style={
                  activeSection === 'all'
                    ? {
                        '--s-color': 'var(--text-secondary)',
                        '--s-dim': 'var(--glass-hover)',
                      }
                    : {}
                }
                onClick={() => {
                  setActiveSection('all');
                  setExpandedRow(null);
                }}
              >
                All Jalan
              </button>
              {sectionSummary.map((s) => {
                const st = getSectionStyle(s.section);
                return (
                  <button
                    key={s.section}
                    className={`section-filter-tab ${activeSection === s.section ? 'active' : ''}`}
                    style={{ '--s-color': st.color, '--s-dim': st.dim }}
                    onClick={() => {
                      setActiveSection(
                        activeSection === s.section ? 'all' : s.section
                      );
                      setExpandedRow(null);
                    }}
                  >
                    {st.icon} {s.section}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search + month filter */}
          <div className="controls-bar">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                type="text"
                placeholder="Search resident name…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setExpandedRow(null);
                }}
              />
            </div>
            <select
              className="filter-select"
              value={filterMonth}
              onChange={(e) => {
                setFilterMonth(e.target.value);
                setExpandedRow(null);
              }}
            >
              <option value="all">All residents</option>
              <option value="full">Fully paid</option>
              <option value="partial">Partial payments</option>
              <option value="none">No payments</option>
              <optgroup label="Filter by Month Paid">
                {months.map((m) => (
                  <option key={m} value={m}>
                    Paid in {m}
                  </option>
                ))}
              </optgroup>
            </select>
            <div className="results-count">
              {filteredResidents.length} of {residents.length} residents
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="grid-scroll-wrapper">
          <table className="payment-table">
            <thead>
              <tr>
                <th className="col-name"># &nbsp; Resident</th>
                {months.map((m) => (
                  <th key={m}>{m}</th>
                ))}
                <th className="col-summary">Summary</th>
              </tr>
            </thead>
            <tbody>
              {groupedResidents.length === 0 ? (
                <tr className="empty-row">
                  <td colSpan={months.length + 2}>
                    No residents match your search
                  </td>
                </tr>
              ) : (
                groupedResidents.map((item, idx) => {
                  if (item.type === 'header') {
                    const st = getSectionStyle(item.section);
                    const secData = sectionSummary.find(
                      (s) => s.section === item.section
                    );
                    return (
                      <tr
                        key={`header-${item.section}`}
                        className="section-header-row"
                        style={{ '--s-color': st.color }}
                      >
                        <td colSpan={months.length + 2}>
                          <div className="section-header-inner">
                            <span className="section-header-label">
                              {st.icon} {item.section}
                            </span>
                            {secData && (
                              <>
                                <span className="section-header-pill">
                                  {sectionResidentCount(item.section)} units
                                </span>
                                <span className="section-header-pill">
                                  {secData.paymentRate}% paid
                                </span>
                                <span className="section-header-pill">
                                  RM {secData.totalCollected.toLocaleString()} collected
                                </span>
                                <div className="section-header-mini-bar">
                                  <div
                                    className="section-header-mini-fill"
                                    style={{ width: `${secData.paymentRate}%` }}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  const r = item.data;
                  const st = getSectionStyle(r.section);
                  return (
                    <Fragment key={r.name}>
                      <tr
                        className="resident-row"
                        onClick={() =>
                          setExpandedRow(
                            expandedRow === r.name ? null : r.name
                          )
                        }
                      >
                        <td className="td-name">
                          <div className="resident-name-wrap">
                            <div
                              className="resident-avatar"
                              style={{
                                background: st.dim,
                                color: st.color,
                                borderColor: st.color + '44',
                              }}
                            >
                              {item.rowNum}
                            </div>
                            <div>
                              <div className="resident-name">{r.name}</div>
                            </div>
                          </div>
                        </td>
                        {months.map((m) => (
                          <td key={m} style={{ padding: 0 }}>
                            <PaymentCell
                              isPaid={r.payments[m]}
                              month={m}
                              resident={r.name}
                            />
                          </td>
                        ))}
                        <td className="td-summary">
                          <div
                            className={`summary-pill ${getSummaryClass(r)}`}
                          >
                            {r.totalPaid}/{months.length}
                          </div>
                        </td>
                      </tr>
                      {expandedRow === r.name && (
                        <tr className="expanded-row">
                          <td colSpan={months.length + 2}>
                            <div className="expanded-content">
                              <div
                                className="expanded-stat"
                                style={{ borderColor: st.color + '44' }}
                              >
                                <div
                                  className="expanded-stat-value"
                                  style={{ color: st.color, fontSize: 14 }}
                                >
                                  {r.residentName || r.name}
                                </div>
                                <div className="expanded-stat-label">
                                  Owner / Resident
                                </div>
                              </div>

                              <div className="expanded-stat">
                                <div
                                  className="expanded-stat-value"
                                  style={{ color: 'var(--accent-green)' }}
                                >
                                  {r.totalPaid}
                                </div>
                                <div className="expanded-stat-label">Paid</div>
                              </div>
                              <div className="expanded-stat">
                                <div
                                  className="expanded-stat-value"
                                  style={{ color: 'var(--accent-red)' }}
                                >
                                  {r.totalUnpaid}
                                </div>
                                <div className="expanded-stat-label">Unpaid</div>
                              </div>
                              <div className="expanded-stat">
                                <div
                                  className="expanded-stat-value"
                                  style={{ color: 'var(--accent-amber)' }}
                                >
                                  RM {r.totalAmount}
                                </div>
                                <div className="expanded-stat-label">
                                  Collected
                                </div>
                              </div>
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: 'var(--text-muted)',
                                    marginBottom: 8,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                  }}
                                >
                                  Month-by-month
                                </div>
                                <div className="expand-months-row">
                                  {months.map((m) => (
                                    <div
                                      key={m}
                                      className={`month-chip ${r.payments[m] ? 'paid' : 'unpaid'}`}
                                    >
                                      {r.payments[m] ? '✓' : '✗'} {m}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>


        </div>
      </>
      )}
    </div>
  );
}
