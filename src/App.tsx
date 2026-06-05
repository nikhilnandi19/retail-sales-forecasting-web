import { useState } from 'react'
import Overview from './pages/Overview'
import ForecastResults from './pages/ForecastResults'
import ModelPerformance from './pages/ModelPerformance'

const TABS = ['Overview', 'Forecast Results', 'Model Performance']

export default function App() {
  const [tab, setTab] = useState(0)

  return (
    <div className="min-h-screen bg-background font-sans text-on-surface flex flex-col">

      {/* ── Atmospheric background blobs ─────────────────────── */}
      <div
        className="bg-blob bg-primary-container animate-blob"
        style={{ top: '-192px', left: '-192px', width: '800px', height: '800px' }}
      />
      <div
        className="bg-blob bg-secondary animate-blob"
        style={{ top: '50%', right: '-96px', width: '700px', height: '700px', animationDelay: '-5s' }}
      />
      <div
        className="bg-blob bg-tertiary-container animate-blob"
        style={{ bottom: '-96px', left: '33%', width: '400px', height: '400px', animationDelay: '-10s' }}
      />

      {/* ── Sticky navigation ────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/40 backdrop-blur-3xl border-b border-white/40 shadow-sm">
        <div className="flex justify-between items-center w-full px-10 py-4 max-w-[1440px] mx-auto">
          {/* Left: brand + tabs */}
          <div className="flex items-center gap-8">
            <span className="text-[18px] font-bold leading-6 text-on-surface select-none">
              Retail Sales Forecasting
            </span>
            <div className="hidden md:flex gap-6 items-center">
              {TABS.map((name, i) => (
                <button
                  key={name}
                  onClick={() => setTab(i)}
                  className={[
                    'pb-1 text-[11px] font-bold tracking-[0.05em] uppercase transition-all duration-150',
                    tab === i
                      ? 'text-primary border-b-2 border-primary/60 bg-primary/5 px-3 -mx-3 rounded-t-lg backdrop-blur-sm'
                      : 'text-on-surface-variant hover:text-primary',
                  ].join(' ')}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Right: icon buttons + avatar */}
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-surface-container/50 transition-all duration-200">
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 22 }}>settings</span>
            </button>
            <button className="p-2 rounded-full hover:bg-surface-container/50 transition-all duration-200">
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 22 }}>help</span>
            </button>
            <div className="w-10 h-10 rounded-full border border-outline-variant bg-secondary-container flex items-center justify-center select-none">
              <span className="text-xs font-bold text-secondary">NN</span>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Page content ─────────────────────────────────────── */}
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-10 py-8">
        {tab === 0 && <Overview />}
        {tab === 1 && <ForecastResults />}
        {tab === 2 && <ModelPerformance />}
      </main>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="bg-surface border-t border-on-secondary-fixed/5 mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-10 py-8 max-w-[1440px] mx-auto">
          <div className="flex flex-col gap-1 mb-6 md:mb-0 text-center md:text-left">
            <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant">
              Databricks-powered analytics | 2026
            </span>
            <p className="text-sm text-secondary/60">High-Fidelity Sales Predictive Interface</p>
          </div>
          <div className="flex gap-10">
            {['Documentation', 'Privacy Policy', 'Contact Support'].map((link) => (
              <a
                key={link}
                href="#"
                className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant hover:text-secondary transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>

      {/* ── FAB ──────────────────────────────────────────────── */}
      <button
        className="fixed bottom-10 right-10 w-16 h-16 bg-primary-container text-on-primary rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-[60] group"
        style={{ boxShadow: '0 10px 30px rgba(231,109,87,0.4)' }}
        onClick={() => setTab(1)}
        title="New Forecast"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>add_chart</span>
        <span className="absolute right-20 bg-on-surface text-surface text-xs font-bold py-2 px-4 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          New Forecast
        </span>
      </button>
    </div>
  )
}
