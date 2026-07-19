import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// ── CONFIG ────────────────────────────────────────────────────
const GH_OWNER       = 'ttom795';
const GH_REPO        = 'ttom795.github.io';
const GH_PATH        = 'data/stocks.json';
const ADMIN_PASSWORD = 'dungeon123';
const STARTING_GOLD  = 1000;

const DEFAULT_DATA = {
  stocks: [
    { id: 'DRAG', name: 'Dragonfire Exports',  desc: 'Premier dragon-scale commodities',    color: '#ff6b35' },
    { id: 'ELVN', name: 'Elven Moonwine Co.',   desc: 'Finest elvish vintages since Year 1', color: '#a8e6cf' },
    { id: 'DRKF', name: 'Darkforge Armaments',  desc: 'Dwarven weapons & siege equipment',   color: '#c9a96e' },
    { id: 'MYST', name: 'Mystara Scroll Works', desc: 'Enchanted scrolls & arcane supplies', color: '#b388ff' },
    { id: 'GILD', name: 'Thieves Guild Ltd.',   desc: "Diversified 'acquisition' services",  color: '#ffd54f' },
    { id: 'NECR', name: 'NecroTech Solutions',  desc: 'Undead labour & dark consultancy',    color: '#80cbc4' },
  ],
  prices: {},
};

// ── Styles ────────────────────────────────────────────────────
const S = {
  card:  { background: 'var(--surface,#111118)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1.5rem' },
  label: { fontFamily: 'DM Mono,monospace', fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent,#6c63ff)', display: 'block', marginBottom: 6 },
  input: { background: '#18181f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e8e8f0', padding: '8px 12px', fontFamily: 'DM Mono,monospace', fontSize: '0.85rem', width: '100%', outline: 'none', boxSizing: 'border-box' },
  mono:  { fontFamily: 'DM Mono,monospace' },
  up:    { color: '#4ade80', fontFamily: 'DM Mono,monospace', fontSize: '0.8rem' },
  down:  { color: '#f87171', fontFamily: 'DM Mono,monospace', fontSize: '0.8rem' },
  btn: (v = 'primary', disabled = false) => ({
    fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.06em',
    textTransform: 'uppercase', border: 'none', borderRadius: 8, padding: '9px 18px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: v === 'primary' ? 'var(--accent,#6c63ff)' : v === 'danger' ? '#7f1d1d' : v === 'sell' ? '#14532d' : v === 'push' ? '#166534' : 'rgba(255,255,255,0.06)',
    color: '#fff', opacity: disabled ? 0.5 : 1, transition: 'opacity 0.15s',
  }),
  tab: (active) => ({
    fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em',
    textTransform: 'uppercase', border: 'none',
    borderBottom: active ? '2px solid var(--accent,#6c63ff)' : '2px solid transparent',
    background: 'transparent', color: active ? 'var(--accent,#6c63ff)' : 'rgba(232,232,240,0.4)',
    padding: '10px 20px', cursor: 'pointer',
  }),
  msg: (ok) => ({
    background: ok ? 'rgba(74,222,128,0.07)' : 'rgba(248,113,113,0.07)',
    border: `1px solid ${ok ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
    borderRadius: 8, padding: '10px 16px', fontFamily: 'DM Mono,monospace', fontSize: '0.82rem',
    color: ok ? '#4ade80' : '#f87171',
  }),
  pending: { background: 'rgba(250,204,21,0.07)', border: '1px solid rgba(250,204,21,0.25)', borderRadius: 8, padding: '10px 16px', fontFamily: 'DM Mono,monospace', fontSize: '0.82rem', color: '#fbbf24' },
  saving:  { background: 'rgba(108,99,255,0.07)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 8, padding: '10px 16px', fontFamily: 'DM Mono,monospace', fontSize: '0.82rem', color: '#a78bfa' },
};

// ── Helpers ───────────────────────────────────────────────────
function getDeviceId() {
  let id = localStorage.getItem('dnd_device_id');
  if (!id) { id = 'user_' + Math.random().toString(36).slice(2, 10); localStorage.setItem('dnd_device_id', id); }
  return id;
}
const fmt = (n) => Number(n).toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (cur, prev) => (!prev ? 0 : ((cur - prev) / prev) * 100);
const currentPrice = (prices, id) => { const h = prices[id]; return h?.length ? h[h.length - 1].price : null; };
const prevPrice    = (prices, id) => { const h = prices[id]; return h?.length > 1 ? h[h.length - 2].price : null; };
const portfolioValue = (prices, u) => !u ? 0 : u.gold + Object.entries(u.holdings || {}).reduce((sum, [id, q]) => { const p = currentPrice(prices, id); return sum + (p ? p * q : 0); }, 0);

// ── GitHub API ────────────────────────────────────────────────
async function ghReadPublic() {
  const res = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}`, {
    headers: { Accept: 'application/vnd.github.v3+json' },
  });
  if (res.status === 404) return { data: DEFAULT_DATA, sha: null };
  if (!res.ok) throw new Error(`GitHub read failed (${res.status})`);
  const json = await res.json();
  return { data: JSON.parse(atob(json.content.replace(/\n/g, ''))), sha: json.sha };
}

async function ghReadAuth(token) {
  const res = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}`, {
    headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' },
  });
  if (res.status === 404) return { data: DEFAULT_DATA, sha: null };
  if (!res.ok) throw new Error(`GitHub read failed (${res.status})`);
  const json = await res.json();
  return { data: JSON.parse(atob(json.content.replace(/\n/g, ''))), sha: json.sha };
}

async function ghWrite(token, data, sha) {
  const body = {
    message: 'Update stock data',
    content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))),
    ...(sha ? { sha } : {}),
  };
  const res = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}`, {
    method: 'PUT',
    headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message || `GitHub write failed (${res.status})`); }
  return (await res.json()).content.sha;
}

// ── Chart tooltip ─────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0e0e18', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '8px 14px', fontSize: 12, fontFamily: 'DM Mono,monospace' }}>
      <div style={{ color: '#888', marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#e8e8f0' }}>◈ {fmt(payload[0].value)} ฿</div>
    </div>
  );
}

// ── AdminLogin ────────────────────────────────────────────────
function AdminLogin({ adminPw, setAdminPw, authErr, onUnlock }) {
  return (
    <div style={{ ...S.card, maxWidth: 360, margin: '3rem auto', textAlign: 'center' }}>
      <span style={S.label}>Admin Access</span>
      <h3 style={{ marginBottom: '1rem' }}>Password Required</h3>
      <input type="password" style={{ ...S.input, textAlign: 'center', marginBottom: '0.75rem' }}
        placeholder="Admin password…" value={adminPw}
        onChange={e => setAdminPw(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onUnlock()} />
      {authErr && <p style={{ color: '#f87171', fontSize: '0.8rem', ...S.mono, marginBottom: '0.5rem' }}>{authErr}</p>}
      <button style={{ ...S.btn(), width: '100%' }} onClick={onUnlock}>Unlock</button>
    </div>
  );
}

// ── AdminPanel ────────────────────────────────────────────────
function AdminPanel({ stocks, prices, saving, adminMsg, ghToken, setGhToken,
                      draftStocks, draftPrices, setDraftStocks, setDraftPrices,
                      newPrices, setNewPrices, dayLabel, setDayLabel,
                      newStock, setNewStock, hasDraft, onPushToGitHub,
                      onStagePrices, onAddStock, onRemoveStock }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {adminMsg.text && <div style={S.msg(adminMsg.ok)}>{adminMsg.text}</div>}
      {saving        && <div style={S.saving}>⟳ Pushing to GitHub…</div>}
      {hasDraft      && !saving && <div style={S.pending}>⚠ You have unpushed changes — scroll to the bottom to push to GitHub.</div>}

      {/* Token */}
      <div style={S.card}>
        <span style={S.label}>GitHub Personal Access Token</span>
        <p style={{ fontSize: '0.82rem', color: 'rgba(232,232,240,0.4)', marginBottom: '0.75rem', ...S.mono }}>
          Enter each session — never saved. Create at GitHub → Settings → Developer settings → Fine-grained tokens → Contents: Read &amp; Write.
        </p>
        <input type="password" style={S.input} placeholder="ghp_xxxxxxxxxxxx…"
          value={ghToken} onChange={e => setGhToken(e.target.value)} />
      </div>

      {/* Stage prices */}
      <div style={S.card}>
        <span style={S.label}>Stage New Day Prices</span>
        <p style={{ fontSize: '0.82rem', color: 'rgba(232,232,240,0.4)', marginBottom: '0.75rem', ...S.mono }}>
          Prices are staged locally and only go live when you push to GitHub at the bottom.
        </p>
        <input style={{ ...S.input, marginBottom: '1rem' }} placeholder='Day label e.g. "Day 4" or "Session 3"'
          value={dayLabel} onChange={e => setDayLabel(e.target.value)} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          {draftStocks.map(s => (
            <div key={s.id}>
              <label style={{ ...S.label, color: s.color }}>{s.id} — {s.name}</label>
              <input style={S.input} type="number" min="0.01" step="0.01"
                placeholder={currentPrice(draftPrices, s.id) ? `Current: ${fmt(currentPrice(draftPrices, s.id))} ฿` : 'Set price…'}
                value={newPrices[s.id] || ''}
                onChange={e => setNewPrices(p => ({ ...p, [s.id]: e.target.value }))} />
            </div>
          ))}
        </div>
        <button style={S.btn()} onClick={onStagePrices}>Stage Prices</button>
      </div>

      {/* Preview staged prices */}
      {Object.keys(draftPrices).length > 0 && (
        <div style={S.card}>
          <span style={S.label}>Staged Price History (local preview)</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '0.75rem' }}>
            {draftStocks.map(s => {
              const hist = draftPrices[s.id] || [];
              if (!hist.length) return null;
              const latest = hist[hist.length - 1];
              return (
                <div key={s.id} style={{ padding: '10px 14px', background: '#18181f', borderRadius: 8 }}>
                  <span style={{ ...S.mono, color: s.color, fontWeight: 700, fontSize: '0.85rem' }}>{s.id}</span>
                  <span style={{ ...S.mono, fontSize: '0.8rem', color: 'rgba(232,232,240,0.5)', marginLeft: 8 }}>{hist.length} day{hist.length !== 1 ? 's' : ''}</span>
                  <div style={{ ...S.mono, fontSize: '0.9rem', marginTop: 4 }}>{fmt(latest.price)} ฿ <span style={{ color: 'rgba(232,232,240,0.35)', fontSize: '0.75rem' }}>({latest.day})</span></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add stock */}
      <div style={S.card}>
        <span style={S.label}>Add New Stock</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div>
            <label style={S.label}>Ticker</label>
            <input style={S.input} placeholder="NAME" maxLength={6}
              value={newStock.id} onChange={e => setNewStock(s => ({ ...s, id: e.target.value.toUpperCase() }))} />
          </div>
          <div>
            <label style={S.label}>Company Name</label>
            <input style={S.input} placeholder="Full name"
              value={newStock.name} onChange={e => setNewStock(s => ({ ...s, name: e.target.value }))} />
          </div>
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={S.label}>Description</label>
          <input style={S.input} placeholder="Brief description…"
            value={newStock.desc} onChange={e => setNewStock(s => ({ ...s, desc: e.target.value }))} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={S.label}>Chart Colour</label>
          <input type="color" value={newStock.color} onChange={e => setNewStock(s => ({ ...s, color: e.target.value }))}
            style={{ width: '100%', height: 38, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#18181f', cursor: 'pointer' }} />
        </div>
        <button style={S.btn()} onClick={onAddStock}>Stage New Stock</button>
      </div>

      {/* Manage stocks */}
      <div style={S.card}>
        <span style={S.label}>Manage Stocks</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {draftStocks.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#18181f', borderRadius: 8 }}>
              <div>
                <span style={{ ...S.mono, color: s.color, fontWeight: 700, marginRight: 12 }}>{s.id}</span>
                <span style={{ fontSize: '0.9rem' }}>{s.name}</span>
              </div>
              <button style={S.btn('danger')} onClick={() => onRemoveStock(s.id)}>Remove</button>
            </div>
          ))}
        </div>
      </div>



      {/* ── Push to GitHub ── */}
      <div style={{ ...S.card, border: '1px solid rgba(74,222,128,0.2)', background: 'rgba(74,222,128,0.04)' }}>
        <span style={{ ...S.label, color: '#4ade80' }}>Push to GitHub</span>
        <p style={{ fontSize: '0.82rem', color: 'rgba(232,232,240,0.4)', marginBottom: '1rem', ...S.mono }}>
          This writes all staged changes (prices, stocks, users) to the repo. Make sure your token is entered above.
        </p>
        <button
          style={{ ...S.btn('push', saving || !hasDraft), width: '100%', padding: '14px', fontSize: '0.85rem' }}
          onClick={onPushToGitHub}
          disabled={saving || !hasDraft}
        >
          {saving ? '⟳ Pushing…' : hasDraft ? '↑ Push All Changes to GitHub' : '✓ Everything is up to date'}
        </button>
      </div>
    </div>
  );
}

// ── MarketView ────────────────────────────────────────────────
function MarketView({ stocks, prices, users, deviceId, saving, tradeMsg, tradeQty, setTradeQty, chartStock, setChartStock, onTrade }) {
  const me = users[deviceId];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {tradeMsg.text && <div style={S.msg(tradeMsg.ok)}>{tradeMsg.text}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '1rem' }}>
        {stocks.map(s => {
          const cp    = currentPrice(prices, s.id);
          const pp    = prevPrice(prices, s.id);
          const chg   = cp && pp ? pct(cp, pp) : null;
          const hist  = prices[s.id] || [];
          const owned = me?.holdings?.[s.id] || 0;
          return (
            <div key={s.id} style={{ ...S.card, borderColor: chartStock === s.id ? s.color : 'rgba(255,255,255,0.08)', transition: 'border-color 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: s.color }}>{s.id}</div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(232,232,240,0.7)', marginTop: 2 }}>{s.name}</div>
                  <div style={{ ...S.mono, fontSize: '0.68rem', color: 'rgba(232,232,240,0.28)', marginTop: 2 }}>{s.desc}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: 12 }}>
                  {cp ? <>
                    <div style={{ ...S.mono, fontWeight: 700, fontSize: '1.1rem' }}>{fmt(cp)} ฿</div>
                    {chg !== null && <div style={chg >= 0 ? S.up : S.down}>{chg >= 0 ? '▲' : '▼'} {Math.abs(chg).toFixed(2)}%</div>}
                  </> : <div style={{ color: 'rgba(232,232,240,0.22)', ...S.mono, fontSize: '0.78rem' }}>No price yet</div>}
                </div>
              </div>

              {hist.length > 1 && (
                <div style={{ marginBottom: '0.75rem', cursor: 'pointer' }} onClick={() => setChartStock(chartStock === s.id ? null : s.id)}>
                  <ResponsiveContainer width="100%" height={55}>
                    <LineChart data={hist}>
                      <Line type="monotone" dataKey="price" stroke={s.color} dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div style={{ textAlign: 'center', ...S.mono, fontSize: '0.6rem', color: 'rgba(232,232,240,0.2)', marginTop: 2 }}>
                    {chartStock === s.id ? '▲ collapse' : '▼ full chart'}
                  </div>
                </div>
              )}

              {chartStock === s.id && hist.length > 1 && (
                <div style={{ marginBottom: '1rem' }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={hist} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <XAxis dataKey="day" tick={{ fill: 'rgba(232,232,240,0.3)', fontSize: 10, fontFamily: 'DM Mono,monospace' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(232,232,240,0.3)', fontSize: 10, fontFamily: 'DM Mono,monospace' }} axisLine={false} tickLine={false} width={52} tickFormatter={fmt} />
                      <Tooltip content={<ChartTooltip />} />
                      <Line type="monotone" dataKey="price" stroke={s.color} dot={{ fill: s.color, r: 3 }} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {cp && me && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input type="number" min="1" step="1" placeholder="Qty"
                    value={tradeQty[s.id] || ''}
                    onChange={e => setTradeQty(q => ({ ...q, [s.id]: e.target.value }))}
                    style={{ ...S.input, width: 68, textAlign: 'center', padding: '7px 8px' }} />
                  <button style={{ ...S.btn('primary'), flex: 1, padding: '8px 0' }} onClick={() => onTrade(s.id, 'buy')}>Buy</button>
                  <button style={{ ...S.btn('sell'),    flex: 1, padding: '8px 0' }} onClick={() => onTrade(s.id, 'sell')}>Sell</button>
                  {owned > 0 && <span style={{ ...S.mono, fontSize: '0.7rem', color: 'rgba(232,232,240,0.35)', whiteSpace: 'nowrap' }}>×{owned}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── PortfolioView ─────────────────────────────────────────────
function PortfolioView({ stocks, prices, users, deviceId }) {
  const me = users[deviceId];
  if (!me) return null;
  const totalVal = portfolioValue(prices, me);
  const holdings = Object.entries(me.holdings || {}).filter(([, q]) => q > 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1rem' }}>
        {[
          { label: 'Beri on Hand',    value: `${fmt(me.gold)} ฿`,  color: '#ffd54f' },
          { label: 'Portfolio Value', value: `${fmt(totalVal)} ฿`, color: '#4ade80' },
          { label: 'Holdings',        value: holdings.length,        color: 'var(--accent,#6c63ff)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ ...S.card, textAlign: 'center' }}>
            <span style={S.label}>{label}</span>
            <div style={{ ...S.mono, fontWeight: 700, fontSize: '1.2rem', color }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <span style={S.label}>Your Holdings</span>
        {!holdings.length ? (
          <p style={{ color: 'rgba(232,232,240,0.3)', ...S.mono, fontSize: '0.85rem' }}>No holdings yet. Head to the market!</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', ...S.mono, fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Stock', 'Qty', 'Price', 'Value', 'Chg'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: 'rgba(232,232,240,0.3)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holdings.map(([id, qty]) => {
                const stock = stocks.find(s => s.id === id);
                const cp = currentPrice(prices, id), pp = prevPrice(prices, id);
                const val = cp ? cp * qty : 0, chg = cp && pp ? pct(cp, pp) : null;
                return (
                  <tr key={id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px', color: stock?.color || '#fff', fontWeight: 700 }}>{id}</td>
                    <td style={{ padding: '10px' }}>{qty}</td>
                    <td style={{ padding: '10px' }}>{cp ? `${fmt(cp)} ฿` : '—'}</td>
                    <td style={{ padding: '10px', color: '#ffd54f' }}>{fmt(val)} ฿</td>
                    <td style={{ padding: '10px', ...(chg === null ? {} : chg >= 0 ? S.up : S.down) }}>
                      {chg === null ? '—' : `${chg >= 0 ? '▲' : '▼'} ${Math.abs(chg).toFixed(2)}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {holdings.length > 0 && (
        <div style={S.card}>
          <span style={S.label}>Price History — Your Stocks</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            {holdings.map(([id]) => {
              const stock = stocks.find(s => s.id === id), hist = prices[id] || [];
              if (hist.length < 2) return null;
              return (
                <div key={id}>
                  <div style={{ ...S.mono, fontSize: '0.72rem', color: stock?.color, marginBottom: 6, fontWeight: 700 }}>{id} — {stock?.name}</div>
                  <ResponsiveContainer width="100%" height={130}>
                    <LineChart data={hist} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <XAxis dataKey="day" tick={{ fill: 'rgba(232,232,240,0.3)', fontSize: 9, fontFamily: 'DM Mono,monospace' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(232,232,240,0.3)', fontSize: 9, fontFamily: 'DM Mono,monospace' }} axisLine={false} tickLine={false} width={48} tickFormatter={fmt} />
                      <Tooltip content={<ChartTooltip />} />
                      <Line type="monotone" dataKey="price" stroke={stock?.color || '#6c63ff'} dot={{ fill: stock?.color, r: 2 }} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function StockSimulator() {
  const deviceId = getDeviceId();

  // Live state (from GitHub)
  const [stocks,  setStocks]  = useState(DEFAULT_DATA.stocks);
  const [prices,  setPrices]  = useState({});
  // User state - local only, never sent to GitHub
  const [users,   setUsers]   = useState({});

  // Draft state (local admin edits, not yet pushed)
  const [draftStocks, setDraftStocks] = useState(null); // null = not yet loaded
  const [draftPrices, setDraftPrices] = useState(null);
  const [hasDraft,    setHasDraft]    = useState(false);

  const [view,      setView]      = useState('market');
  const [loading,   setLoading]   = useState(true);
  const [loadErr,   setLoadErr]   = useState('');
  const [saving,    setSaving]    = useState(false);

  const [nameSet,   setNameSet]   = useState(false);
  const [userName,  setUserName]  = useState('');

  const [adminAuth, setAdminAuth] = useState(false);
  const [adminPw,   setAdminPw]   = useState('');
  const [authErr,   setAuthErr]   = useState('');
  const [ghToken,   setGhToken]   = useState('');
  const [adminMsg,  setAdminMsg]  = useState({ text: '', ok: true });

  const [newPrices, setNewPrices] = useState({});
  const [dayLabel,  setDayLabel]  = useState('');
  const [newStock,  setNewStock]  = useState({ id: '', name: '', desc: '', color: '#6c63ff' });

  const [tradeQty,   setTradeQty]   = useState({});
  const [tradeMsg,   setTradeMsg]   = useState({ text: '', ok: true });
  const [chartStock, setChartStock] = useState(null);

  // ── Load ───────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true); setLoadErr('');
    try {
      const { data } = await ghReadPublic();
      const m = { ...DEFAULT_DATA, ...data };
      const s = m.stocks || DEFAULT_DATA.stocks;
      const p = m.prices || {};
      setStocks(s); setPrices(p); // users intentionally not loaded from GitHub
      // Initialise drafts from live data (only on first load)
      setDraftStocks(ds => ds === null ? s : ds);
      setDraftPrices(dp => dp === null ? p : dp);
    } catch (e) { setLoadErr(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Check localStorage for existing user
  useEffect(() => {
    if (loading) return;
    const local = localStorage.getItem('dnd_user_' + deviceId);
    if (local) {
      const parsed = JSON.parse(local);
      if (!users[deviceId]) setUsers(u => ({ ...u, [deviceId]: parsed }));
      setNameSet(true);
    } else if (users[deviceId]) {
      setNameSet(true);
    }
  }, [loading]);

  // ── Register ───────────────────────────────────────────────
  const registerUser = () => {
    if (!userName.trim()) return;
    const newUser = { name: userName.trim(), gold: STARTING_GOLD, holdings: {} };
    localStorage.setItem('dnd_user_' + deviceId, JSON.stringify(newUser));
    setUsers(u => ({ ...u, [deviceId]: newUser }));
    setNameSet(true);
  };

  // ── Trade — local-first, background GitHub sync if token present ──
  const onTrade = async (stockId, type) => {
    const qty = parseInt(tradeQty[stockId] || 1);
    if (!qty || qty <= 0) return setTradeMsg({ text: 'Enter a valid quantity.', ok: false });
    const price = currentPrice(prices, stockId);
    if (!price) return setTradeMsg({ text: 'No price set yet.', ok: false });
    const user = users[deviceId];
    const holdings = { ...user.holdings };
    let gold = user.gold;
    if (type === 'buy') {
      const cost = price * qty;
      if (gold < cost) return setTradeMsg({ text: `Not enough gold! Need ${fmt(cost)} ฿.`, ok: false });
      gold -= cost; holdings[stockId] = (holdings[stockId] || 0) + qty;
      setTradeMsg({ text: `Bought ${qty}× ${stockId} for ${fmt(cost)} ฿`, ok: true });
    } else {
      const owned = holdings[stockId] || 0;
      if (owned < qty) return setTradeMsg({ text: `You only own ${owned} shares.`, ok: false });
      const proceeds = price * qty;
      gold += proceeds; holdings[stockId] = owned - qty;
      if (!holdings[stockId]) delete holdings[stockId];
      setTradeMsg({ text: `Sold ${qty}× ${stockId} for ${fmt(proceeds)} ฿`, ok: true });
    }
    const updatedUser  = { ...user, gold, holdings };
    const updatedUsers = { ...users, [deviceId]: updatedUser };

    // Save locally only — admin push will sync to GitHub
    localStorage.setItem('dnd_user_' + deviceId, JSON.stringify(updatedUser));
    setUsers(updatedUsers);
    setTimeout(() => setTradeMsg({ text: '', ok: true }), 4000);
  };

  // ── Admin flash ────────────────────────────────────────────
  const flash = (text, ok = true) => { setAdminMsg({ text, ok }); setTimeout(() => setAdminMsg({ text: '', ok: true }), 4000); };

  // ── Stage prices (local only) ──────────────────────────────
  const onStagePrices = () => {
    if (!dayLabel.trim()) return flash('Enter a day label.', false);
    const updated = { ...draftPrices };
    let changed = 0;
    for (const [id, val] of Object.entries(newPrices)) {
      const p = parseFloat(val); if (!p || p <= 0) continue;
      updated[id] = [...(updated[id] || []), { day: dayLabel.trim(), price: p }]; changed++;
    }
    if (!changed) return flash('No valid prices entered.', false);
    setDraftPrices(updated);
    setHasDraft(true);
    setNewPrices({}); setDayLabel('');
    flash(`✓ Staged ${changed} price(s) for "${dayLabel}" — push when ready`);
  };

  // ── Add stock (local only) ─────────────────────────────────
  const onAddStock = () => {
    const id = newStock.id.trim().toUpperCase();
    if (!id || !newStock.name.trim()) return flash('Ticker and name required.', false);
    if (draftStocks.find(s => s.id === id)) return flash('Ticker already exists.', false);
    setDraftStocks(ss => [...ss, { id, name: newStock.name.trim(), desc: newStock.desc.trim(), color: newStock.color }]);
    setHasDraft(true);
    setNewStock({ id: '', name: '', desc: '', color: '#6c63ff' });
    flash(`✓ Staged new stock ${id} — push when ready`);
  };

  // ── Remove stock (local only) ──────────────────────────────
  const onRemoveStock = (id) => {
    setDraftStocks(ss => ss.filter(s => s.id !== id));
    setHasDraft(true);
    flash(`✓ Staged removal of ${id} — push when ready`);
  };

  // ── Push all drafts to GitHub ──────────────────────────────
  const onPushToGitHub = async () => {
    if (!ghToken) return flash('Enter your GitHub token above first.', false);
    if (!hasDraft) return flash('Nothing to push.', false);
    setSaving(true);
    try {
      const { sha } = await ghReadAuth(ghToken);
      await ghWrite(ghToken, { stocks: draftStocks, prices: draftPrices }, sha);
      setStocks(draftStocks); setPrices(draftPrices);
      setHasDraft(false);
      flash('✓ Successfully pushed to GitHub! Changes are now live.');
    } catch (e) { flash(e.message, false); }
    finally { setSaving(false); }
  };

  const onUnlock = () => {
    if (adminPw === ADMIN_PASSWORD) { setAdminAuth(true); setAuthErr(''); }
    else setAuthErr('Wrong password.');
  };

  const me = users[deviceId];

  // ── Screens ────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(232,232,240,0.3)', ...S.mono }}>
      Loading market data…
    </div>
  );

  if (loadErr) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...S.card, maxWidth: 400, textAlign: 'center' }}>
        <p style={{ color: '#f87171', ...S.mono, marginBottom: '1rem' }}>{loadErr}</p>
        <button style={S.btn()} onClick={loadData}>Retry</button>
      </div>
    </div>
  );

  if (!nameSet) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...S.card, maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚔️</div>
        <h2 style={{ marginBottom: '0.5rem' }}>Welcome, Adventurer</h2>
        <p style={{ color: 'rgba(232,232,240,0.4)', fontSize: '0.88rem', marginBottom: '1.5rem', ...S.mono }}>
          You start with {fmt(STARTING_GOLD)} gold pieces.
        </p>
        <input style={{ ...S.input, textAlign: 'center', marginBottom: '1rem', fontSize: '1rem' }}
          placeholder="Enter your name…" value={userName}
          onChange={e => setUserName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && registerUser()} />
        <button style={{ ...S.btn(), width: '100%', padding: '12px' }} onClick={registerUser}>
          Enter the Market
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ color: 'var(--text,#e8e8f0)', fontFamily: 'Syne,sans-serif', padding: '2rem 0' }}>
      <div style={{ marginBottom: '2rem' }}>
        <span style={S.label}>DnD Campaign</span>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>Stock Exchange</h1>
          {me && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', ...S.mono, fontSize: '0.82rem' }}>
              <span style={{ color: 'rgba(232,232,240,0.4)' }}>⚔ {me.name}</span>
              <span style={{ color: '#ffd54f', fontWeight: 700 }}>{fmt(me.gold)} ฿</span>
              <button style={{ ...S.btn('ghost'), fontSize: '0.65rem', padding: '4px 10px', border: '1px solid rgba(255,255,255,0.1)' }} onClick={loadData}>↻</button>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginTop: '1.5rem' }}>
          <button style={S.tab(view === 'market')}    onClick={() => setView('market')}>Market</button>
          <button style={S.tab(view === 'portfolio')} onClick={() => setView('portfolio')}>Portfolio</button>
          <button style={S.tab(view === 'admin')}     onClick={() => setView('admin')}>Admin</button>
        </div>
      </div>

      {view === 'market' && (
        <MarketView stocks={stocks} prices={prices} users={users} deviceId={deviceId}
          saving={saving} tradeMsg={tradeMsg} tradeQty={tradeQty} setTradeQty={setTradeQty}
          chartStock={chartStock} setChartStock={setChartStock} onTrade={onTrade} />
      )}
      {view === 'portfolio' && (
        <PortfolioView stocks={stocks} prices={prices} users={users} deviceId={deviceId} />
      )}
      {view === 'admin' && (!adminAuth
        ? <AdminLogin adminPw={adminPw} setAdminPw={setAdminPw} authErr={authErr} onUnlock={onUnlock} />
        : <AdminPanel
            stocks={stocks} prices={prices} saving={saving}
            adminMsg={adminMsg} ghToken={ghToken} setGhToken={setGhToken}
            draftStocks={draftStocks || stocks} draftPrices={draftPrices || prices}
            setDraftStocks={setDraftStocks} setDraftPrices={setDraftPrices}
            newPrices={newPrices} setNewPrices={setNewPrices}
            dayLabel={dayLabel} setDayLabel={setDayLabel}
            newStock={newStock} setNewStock={setNewStock}
            hasDraft={hasDraft}
            onFlash={flash} onStagePrices={onStagePrices} onAddStock={onAddStock}
            onRemoveStock={onRemoveStock} onPushToGitHub={onPushToGitHub} />
      )}
    </div>
  );
}
