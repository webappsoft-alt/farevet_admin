import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { HiOutlineArrowDownTray } from "react-icons/hi2";
import { message } from "antd";
import moment from "moment";
import axiosInstance from "../../api/axiosInstance";
import { apiRequest } from "../../api/auth_api";
import Spinner from "../Spinner";
import "./farevetIntelligence.scss";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

const GRID_COLOR = "rgba(128, 128, 128, 0.12)";
const PRIMARY = "#7F3FE8";

const FEATURE_OPTIONS = [
  { value: "", label: "All features" },
  { value: "cost_search", label: "Cost Search" },
  { value: "visit_estimator", label: "Pre-Visit Estimator" },
  { value: "bill_explainer", label: "Bill Explainer" },
  { value: "farevet_ai", label: "FareVet AI" },
  { value: "medications", label: "Medications page" },
  { value: "concierge", label: "FareVet Concierge" },
  { value: "insurance_calculator", label: "Insurance calculator" },
];

function getPresetDateRange(preset) {
  const to = moment().format("YYYY-MM-DD");
  switch (preset) {
    case "90":
      return {
        from: moment().subtract(90, "days").format("YYYY-MM-DD"),
        to,
      };
    case "year":
      return {
        from: moment().startOf("year").format("YYYY-MM-DD"),
        to,
      };
    case "all":
      return { from: "", to: "" };
    case "30":
    default:
      return {
        from: moment().subtract(30, "days").format("YYYY-MM-DD"),
        to,
      };
  }
}

function buildFilterPayload({
  dateRange,
  feature,
  petType,
  city,
  state,
  symptom,
}) {
  const { from, to } = getPresetDateRange(dateRange);
  const payload = { type: "admin_intelligence" };
  if (from) payload.from = from;
  if (to) payload.to = to;
  if (feature) payload.feature = feature;
  if (petType && petType !== "all") payload.pet_type = petType;
  const cityTrim = city?.trim();
  const stateTrim = state?.trim();
  const symptomTrim = symptom?.trim();
  if (cityTrim) payload.city = cityTrim;
  if (stateTrim) payload.state = stateTrim;
  if (symptomTrim) payload.symptom = symptomTrim;
  return payload;
}

function filtersToFormData(fields) {
  const body = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      body.append(key, value);
    }
  });
  return body;
}

function filtersToSearchParams(fields) {
  const params = new URLSearchParams();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  return params;
}

function formatCount(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString();
}

function formatCurrency(value, fractionDigits = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(n);
}

function formatDayLabel(day) {
  const parsed = moment(day, "YYYY-MM-DD", true);
  return parsed.isValid() ? parsed.format("MMM D") : day;
}

function useDebouncedValue(value, delayMs = 500) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

const barOptions = (horizontal = false) => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: horizontal ? "y" : "x",
  plugins: { legend: { display: false } },
  scales: horizontal
    ? {
        x: { grid: { color: GRID_COLOR } },
        y: { grid: { display: false } },
      }
    : {
        x: { grid: { display: false } },
        y: { grid: { color: GRID_COLOR } },
      },
});

const lineTrendOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { grid: { color: GRID_COLOR } },
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "65%",
  plugins: { legend: { display: false } },
};

function EmptyRow({ colSpan, text = "No data for current filters" }) {
  return (
    <tr>
      <td colSpan={colSpan} className="fi-muted" style={{ padding: "16px 0" }}>
        {text}
      </td>
    </tr>
  );
}

const FarevetIntelligence = () => {
  const [dateRange, setDateRange] = useState("30");
  const [feature, setFeature] = useState("");
  const [petType, setPetType] = useState("all");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [symptom, setSymptom] = useState("");
  const debouncedCity = useDebouncedValue(city);
  const debouncedState = useDebouncedValue(state);
  const debouncedSymptom = useDebouncedValue(symptom);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const filterFields = useMemo(
    () =>
      buildFilterPayload({
        dateRange,
        feature,
        petType,
        city: debouncedCity,
        state: debouncedState,
        symptom: debouncedSymptom,
      }),
    [dateRange, feature, petType, debouncedCity, debouncedState, debouncedSymptom],
  );

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const body = filtersToFormData(filterFields);
      const res = await apiRequest({ body });
      if (res?.result === true) {
        setReport(res);
      } else {
        setReport(null);
        message.error(res?.message || "Failed to load intelligence report");
      }
    } catch (e) {
      setReport(null);
      message.error("Failed to load intelligence report");
    } finally {
      setLoading(false);
    }
  }, [filterFields]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const billMetrics = report?.bill_metrics || {};
  const totals = report?.totals || {};
  const featureUsage = report?.feature_usage || [];
  const topSymptoms = report?.top_symptoms || [];
  const topServices = report?.top_services || [];
  const byPetType = report?.by_pet_type || [];
  const topBreeds = report?.top_breeds || [];
  const byCity = report?.by_city || [];
  const dailyTrend = report?.daily_trend || [];

  const featureUsesTotal = useMemo(
    () =>
      featureUsage.reduce(
        (sum, row) => sum + (Number(row?.uses) || 0),
        0,
      ),
    [featureUsage],
  );

  const petTypeStats = useMemo(() => {
    let dog = 0;
    let cat = 0;
    byPetType.forEach((row) => {
      const t = String(row?.pet_type || "").toLowerCase();
      const count = Number(row?.count) || 0;
      if (t === "dog") dog += count;
      else if (t === "cat") cat += count;
    });
    const total = dog + cat;
    const dogPct = total ? Math.round((dog / total) * 100) : 0;
    const catPct = total ? Math.round((cat / total) * 100) : 0;
    return { dog, cat, dogPct, catPct, total };
  }, [byPetType]);

  const cityChartData = useMemo(
    () => ({
      labels: byCity.map(
        (row) =>
          `${row?.city || "Unknown"}${row?.state ? `, ${row.state}` : ""}`,
      ),
      datasets: [
        {
          data: byCity.map((row) => Number(row?.count) || 0),
          backgroundColor: PRIMARY,
          borderRadius: 5,
        },
      ],
    }),
    [byCity],
  );

  const petChartData = useMemo(
    () => ({
      labels: ["Dogs", "Cats"],
      datasets: [
        {
          data: [petTypeStats.dog, petTypeStats.cat],
          backgroundColor: [PRIMARY, "#00A878"],
          borderWidth: 0,
        },
      ],
    }),
    [petTypeStats.cat, petTypeStats.dog],
  );

  const featureChartData = useMemo(
    () => ({
      labels: featureUsage.map((row) => row?.label || row?.feature || ""),
      datasets: [
        {
          data: featureUsage.map((row) => Number(row?.uses) || 0),
          backgroundColor: PRIMARY,
          borderRadius: 5,
        },
      ],
    }),
    [featureUsage],
  );

  const trendChartData = useMemo(
    () => ({
      labels: dailyTrend.map((row) => formatDayLabel(row?.day)),
      datasets: [
        {
          label: "Daily activity",
          data: dailyTrend.map((row) => Number(row?.count) || 0),
          borderColor: PRIMARY,
          backgroundColor: "rgba(127, 63, 232, 0.08)",
          tension: 0.3,
          pointRadius: 3,
          fill: true,
        },
      ],
    }),
    [dailyTrend],
  );

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const exportFields = {
        ...filterFields,
        type: "admin_intelligence_export",
      };
      const params = filtersToSearchParams(exportFields);
      const res = await axiosInstance.get(`?${params.toString()}`, {
        responseType: "blob",
      });
      const blob = res.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const stamp = moment().format("YYYY-MM-DD");
      link.download = `farevet-intelligence-${stamp}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success("CSV export started");
    } catch (e) {
      message.error("CSV export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="farevet-intelligence-page">
      <div className="fi-page-hdr">
        <h1 className="fi-page-title">Intelligence</h1>
        <button
          type="button"
          className="fi-export-btn"
          onClick={handleExportCsv}
          disabled={exporting || loading}
        >
          {exporting ? (
            <Spinner size={16} color="inherit" />
          ) : (
            <HiOutlineArrowDownTray size={16} aria-hidden />
          )}
          Export CSV
        </button>
      </div>

      <div className="fi-filters">
        <select
          className="fi-filter-select"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          aria-label="Date range"
        >
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="year">This year</option>
          <option value="all">All time</option>
        </select>
        <select
          className="fi-filter-select"
          value={feature}
          onChange={(e) => setFeature(e.target.value)}
          aria-label="Feature"
        >
          {FEATURE_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className="fi-filter-select"
          value={petType}
          onChange={(e) => setPetType(e.target.value)}
          aria-label="Pet type"
        >
          <option value="all">All pet types</option>
          <option value="dog">Dog</option>
          <option value="cat">Cat</option>
        </select>
        <input
          type="text"
          className="fi-filter-select fi-filter-input"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          aria-label="City"
        />
        <input
          type="text"
          className="fi-filter-select fi-filter-input"
          placeholder="State (e.g. NY)"
          value={state}
          onChange={(e) => setState(e.target.value)}
          aria-label="State"
          maxLength={8}
        />
        <input
          type="text"
          className="fi-filter-select fi-filter-input"
          placeholder="Symptom"
          value={symptom}
          onChange={(e) => setSymptom(e.target.value)}
          aria-label="Symptom"
        />
      </div>

      {loading ? (
        <div className="fi-loading">
          <Spinner size={48} />
        </div>
      ) : (
        <>
          <div className="fi-metric-row fi-metric-row--wide">
            <div className="fi-metric-card">
              <div className="fi-metric-label">Average bill amount</div>
              <div className="fi-metric-value">
                {formatCurrency(billMetrics.avg_bill_amount, 2)}
              </div>
            </div>
            <div className="fi-metric-card">
              <div className="fi-metric-label">Bills analyzed</div>
              <div className="fi-metric-value">
                {formatCount(billMetrics.bills_analyzed)}
              </div>
            </div>
            <div className="fi-metric-card">
              <div className="fi-metric-label">Savings identified</div>
              <div className="fi-metric-value fi-metric-value--green">
                {formatCurrency(billMetrics.total_savings_identified)}
              </div>
            </div>
            <div className="fi-metric-card">
              <div className="fi-metric-label">Total activities</div>
              <div className="fi-metric-value">
                {formatCount(totals.total_activities)}
              </div>
            </div>
            <div className="fi-metric-card">
              <div className="fi-metric-label">Unique users</div>
              <div className="fi-metric-value">
                {formatCount(totals.unique_users)}
              </div>
            </div>
          </div>

          <div className="fi-grid-2">
            <div className="fi-card">
              <div className="fi-card-title">Top searched symptoms</div>
              <table className="fi-table">
                <thead>
                  <tr>
                    <th>Symptom</th>
                    <th className="fi-r">Searches</th>
                  </tr>
                </thead>
                <tbody>
                  {topSymptoms.length ? (
                    topSymptoms.map((row) => (
                      <tr key={row.symptom}>
                        <td>{row.symptom}</td>
                        <td className="fi-r fi-count-val">
                          {formatCount(row.count)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <EmptyRow colSpan={2} />
                  )}
                </tbody>
              </table>
            </div>

            <div className="fi-card">
              <div className="fi-card-title">Top services searched</div>
              <table className="fi-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th className="fi-r">Category</th>
                    <th className="fi-r">Searches</th>
                  </tr>
                </thead>
                <tbody>
                  {topServices.length ? (
                    topServices.map((row) => (
                      <tr
                        key={`${row.service_name}-${row.service_category}`}
                      >
                        <td>{row.service_name}</td>
                        <td className="fi-r fi-muted">
                          {row.service_category || "—"}
                        </td>
                        <td className="fi-r fi-count-val">
                          {formatCount(row.count)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <EmptyRow colSpan={3} />
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="fi-card fi-card--spaced">
            <div className="fi-card-title">Activity by city</div>
            <div className="fi-chart-wrap fi-chart-wrap--220">
              {byCity.length ? (
                <Bar data={cityChartData} options={barOptions(false)} />
              ) : (
                <p className="fi-muted fi-chart-empty">No city data</p>
              )}
            </div>
          </div>

          <div className="fi-grid-2">
            <div className="fi-card">
              <div className="fi-card-title">Activity by pet type</div>
              <div className="fi-chart-wrap fi-chart-wrap--180">
                {petTypeStats.total ? (
                  <Doughnut data={petChartData} options={doughnutOptions} />
                ) : (
                  <p className="fi-muted fi-chart-empty">No pet type data</p>
                )}
              </div>
              {petTypeStats.total > 0 && (
                <div className="fi-legend fi-legend--center">
                  <span className="fi-legend-item">
                    <span
                      className="fi-legend-dot"
                      style={{ background: PRIMARY }}
                    />
                    Dogs {petTypeStats.dogPct}%
                  </span>
                  <span className="fi-legend-item">
                    <span
                      className="fi-legend-dot"
                      style={{ background: "#00A878" }}
                    />
                    Cats {petTypeStats.catPct}%
                  </span>
                </div>
              )}
            </div>

            <div className="fi-card">
              <div className="fi-card-title">Top breeds by activity</div>
              <table className="fi-table">
                <tbody>
                  {topBreeds.length ? (
                    topBreeds.map((row) => (
                      <tr key={row.pet_breed}>
                        <td>{row.pet_breed}</td>
                        <td className="fi-r fi-count-val">
                          {formatCount(row.count)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <EmptyRow colSpan={2} />
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="fi-grid-2">
            <div className="fi-card">
              <div className="fi-card-title">Feature usage breakdown</div>
              <div className="fi-chart-wrap fi-chart-wrap--240">
                {featureUsage.length ? (
                  <Bar data={featureChartData} options={barOptions(true)} />
                ) : (
                  <p className="fi-muted fi-chart-empty">No feature usage data</p>
                )}
              </div>
            </div>

            <div className="fi-card">
              <div className="fi-card-title">Feature usage detail</div>
              <table className="fi-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th className="fi-r">Uses</th>
                    <th className="fi-r">Unique users</th>
                    <th className="fi-r">% of total</th>
                  </tr>
                </thead>
                <tbody>
                  {featureUsage.length ? (
                    featureUsage.map((row) => {
                      const uses = Number(row?.uses) || 0;
                      const pct = featureUsesTotal
                        ? `${Math.round((uses / featureUsesTotal) * 100)}%`
                        : "—";
                      return (
                        <tr key={row.feature}>
                          <td>{row.label || row.feature}</td>
                          <td className="fi-r fi-count-val">
                            {formatCount(uses)}
                          </td>
                          <td className="fi-r fi-muted">
                            {formatCount(row.unique_users)}
                          </td>
                          <td className="fi-r fi-muted">{pct}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <EmptyRow colSpan={4} />
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="fi-card">
            <div className="fi-card-title">Daily activity trend</div>
            <div className="fi-chart-wrap fi-chart-wrap--220">
              {dailyTrend.length ? (
                <Line data={trendChartData} options={lineTrendOptions} />
              ) : (
                <p className="fi-muted fi-chart-empty">No trend data</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FarevetIntelligence;
