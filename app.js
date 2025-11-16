// Adjust if you change backend port/path
const API_BASE = "http://localhost:8000";

let currentMode = "daily"; // "daily" or "all"

async function fetchSpreads() {
  const statusEl = document.getElementById("status");
  const totalPnlEl = document.getElementById("total-pnl");
  const summaryTitleEl = document.getElementById("summary-title");
  const tbody = document.querySelector("#spreads-table tbody");

  statusEl.textContent = "Loading...";
  tbody.innerHTML = "";
  totalPnlEl.textContent = "0.00";
  totalPnlEl.classList.remove("pnl-positive", "pnl-negative");

  const endpoint =
    currentMode === "daily" ? "/api/daily-spreads" : "/api/all-spreads";

  try {
    const res = await fetch(API_BASE + endpoint);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();

    const spreads = data.spreads || [];
    const total =
      currentMode === "daily"
        ? data.total_daily_pnl ?? 0
        : data.total_pnl ?? 0;

    summaryTitleEl.textContent =
      currentMode === "daily" ? "Last 24h" : "All history";

    if (spreads.length === 0) {
      statusEl.textContent = "No spreads found for this view.";
      totalPnlEl.textContent = total.toFixed(2);
      return;
    }

    statusEl.textContent = "";
    totalPnlEl.textContent = total.toFixed(2);
    if (total > 0) {
      totalPnlEl.classList.add("pnl-positive");
    } else if (total < 0) {
      totalPnlEl.classList.add("pnl-negative");
    }

    spreads
      .slice()
      .sort((a, b) => (a.trade_time || "").localeCompare(b.trade_time || ""))
      .forEach((s) => {
        const tr = document.createElement("tr");

        const pnlClass =
          s.realized_pnl > 0
            ? "pnl-positive"
            : s.realized_pnl < 0
            ? "pnl-negative"
            : "";

        const shortDelta =
          s.short_delta === null || s.short_delta === undefined
            ? ""
            : Number(s.short_delta).toFixed(3);

        tr.innerHTML = `
          <td>${s.trade_time || ""}</td>
          <td>${s.underlying || ""}</td>
          <td>${s.expiry || ""}</td>
          <td>${s.type || ""}</td>
          <td>${s.short_strike ?? ""}</td>
          <td>${s.long_strike ?? ""}</td>
          <td>${s.qty ?? ""}</td>
          <td>${(s.credit ?? 0).toFixed(2)}</td>
          <td>${(s.debit ?? 0).toFixed(2)}</td>
          <td class="${pnlClass}">${(s.realized_pnl ?? 0).toFixed(2)}</td>
          <td>${shortDelta}</td>
        `;

        tbody.appendChild(tr);
      });
  } catch (err) {
    console.error(err);
    statusEl.textContent =
      "Error talking to backend. Make sure uvicorn is running on localhost:8000.";
  }
}

document.getElementById("btn-daily").addEventListener("click", () => {
  currentMode = "daily";
  fetchSpreads();
});

document.getElementById("btn-all").addEventListener("click", () => {
  currentMode = "all";
  fetchSpreads();
});

document.getElementById("btn-refresh").addEventListener("click", () => {
  fetchSpreads();
});

// Initial load
fetchSpreads();
