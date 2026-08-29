import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
const SECONDARY = "#00A878";

/** Display order for feature breakdown — backend zero-fills; we merge API + defaults. */
const FEATURE_USAGE_CATALOG = [
  { feature: "cost_search", label: "Cost Search" },
  { feature: "visit_estimator", label: "Pre-Visit Estimator" },
  { feature: "bill_explainer", label: "Bill Explainer" },
  { feature: "deals", label: "Deals" },
  { feature: "farevet_ai", label: "FareVet AI" },
  { feature: "medications", label: "Medications page" },
  { feature: "concierge", label: "FareVet Concierge" },
  { feature: "insurance_calculator", label: "Insurance calculator" },
];

/** Primary intelligence views — each maps to one feature filter (Overview = all). */
const INTELLIGENCE_VIEWS = [
  { id: "overview", label: "Overview", feature: "" },
  { id: "cost_search", label: "Cost Search", feature: "cost_search" },
  { id: "farevet_ai", label: "FareVet AI", feature: "farevet_ai" },
  {
    id: "insurance_calculator",
    label: "Insurance",
    feature: "insurance_calculator",
  },
  { id: "visit_estimator", label: "Estimator", feature: "visit_estimator" },
  { id: "medications", label: "Medications", feature: "medications" },
  { id: "concierge", label: "Concierge", feature: "concierge" },
  { id: "bill_explainer", label: "Bill Explainer", feature: "bill_explainer" },
];

const VIEW_DESCRIPTIONS = {
  overview: "Cross-feature summary — compare usage and platform activity.",
  cost_search: "What services users search for, by city, pet type, and weight.",
  farevet_ai: "Symptoms users ask FareVet AI about, by city and pet type.",
  insurance_calculator:
    "Who has pet insurance, which providers they use, and budgets.",
  visit_estimator:
    "Pre-visit cost estimates — symptom demand, categories, and typical ranges.",
  medications:
    "Medication lookups — top drugs searched or viewed, categories, cities, and action types.",
  concierge:
    "Concierge quote activity. Full request details live in Quotes admin.",
  bill_explainer:
    "Uploaded bills — final cost, savings identified, and where users are looking to reduce costs.",
};

function resolveIntelligenceView(viewId) {
  return (
    INTELLIGENCE_VIEWS.find((view) => view.id === viewId) ?? INTELLIGENCE_VIEWS[0]
  );
}

function normalizeFeatureUsage(apiRows) {
  const rows = Array.isArray(apiRows) ? apiRows : [];
  const byKey = {};

  rows.forEach((row) => {
    const key = String(row?.feature || "")
      .toLowerCase()
      .trim();
    if (key) byKey[key] = row;
  });

  const merged = FEATURE_USAGE_CATALOG.map((def) => {
    const fromApi = byKey[def.feature];
    if (fromApi) delete byKey[def.feature];
    return {
      feature: def.feature,
      label: fromApi?.label || def.label,
      uses: Number(fromApi?.uses) || 0,
      unique_users: Number(fromApi?.unique_users) || 0,
    };
  });

  Object.keys(byKey)
    .sort()
    .forEach((key) => {
      const row = byKey[key];
      merged.push({
        feature: key,
        label: row?.label || key,
        uses: Number(row?.uses) || 0,
        unique_users: Number(row?.unique_users) || 0,
      });
    });

  return merged;
}

const ACCOUNT_TYPE_OPTIONS = [
  { value: "", label: "All account types" },
  { value: "premium", label: "Premium" },
  { value: "free", label: "Free" },
  { value: "member", label: "Members" },
];

const ACCOUNT_TYPE_SEGMENTS = [
  { key: "premium", label: "Premium", color: PRIMARY },
  { key: "free", label: "Free", color: "#378ADD" },
  { key: "member", label: "Members", color: "#E8A020" },
];

function normalizeAccountTypeKey(value) {
  const t = String(value || "").toLowerCase().trim();
  if (t === "members") return "member";
  if (t === "premium" || t === "free" || t === "member") return t;
  return "";
}

function parseSharePercent(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n > 0 && n <= 1) return Math.round(n * 1000) / 10;
  return Math.round(n * 10) / 10;
}

/** Prefer `platform_account_breakdown`; fallback `by_account_type` (activity + share). */
function buildPlatformAccountBreakdown(platformRows, byAccountTypeRows) {
  const merged = { premium: { activity: 0, share: null }, free: { activity: 0, share: null }, member: { activity: 0, share: null } };

  const applyRow = (key, activityRaw, shareRaw) => {
    if (!key || !Object.prototype.hasOwnProperty.call(merged, key)) return;
    merged[key].activity += Number(activityRaw) || 0;
    const share = parseSharePercent(shareRaw);
    if (share != null) merged[key].share = share;
  };

  if (Array.isArray(platformRows) && platformRows.length) {
    platformRows.forEach((row) => {
      const key = normalizeAccountTypeKey(
        row?.account_type ?? row?.type ?? row?.label,
      );
      applyRow(
        key,
        row?.activity ?? row?.count ?? row?.total_activities,
        row?.share ?? row?.share_pct ?? row?.percentage ?? row?.pct,
      );
    });
  } else if (Array.isArray(byAccountTypeRows)) {
    byAccountTypeRows.forEach((row) => {
      const key = normalizeAccountTypeKey(row?.account_type);
      applyRow(
        key,
        row?.activity ?? row?.count,
        row?.share ?? row?.share_pct ?? row?.percentage,
      );
    });
  }

  const total = merged.premium.activity + merged.free.activity + merged.member.activity;
  const segments = ACCOUNT_TYPE_SEGMENTS.map((seg) => {
    const row = merged[seg.key];
    const activity = row.activity;
    let share = row.share;
    if (share == null && total > 0) {
      share = Math.round((activity / total) * 1000) / 10;
    }
    if (share == null) share = 0;
    return {
      ...seg,
      count: activity,
      activity,
      pct: share,
    };
  });

  return { total, segments };
}

const EMPTY_REPORT_SLICES = {
  billMetrics: {},
  billByCity: [],
  estimatorMetrics: {},
  estimatorBySymptom: [],
  totals: {},
  insuranceTotals: {},
  featureUsage: [],
  topSymptoms: [],
  topServices: [],
  byPetType: [],
  topBreeds: [],
  byCity: [],
  dailyTrend: [],
  costSearchByCity: [],
  serviceSearchTrends: [],
  aiSymptomsByCity: [],
  insuranceBreakdown: [],
  insuranceByProvider: [],
  budgetsByCity: [],
  byAccountType: [],
  platformAccountBreakdown: [],
  medicationsMetrics: {},
  topMedications: [],
  medicationsByCategory: [],
  medicationsByCity: [],
  medicationsByAction: [],
};

function getPresetDateRange(preset) {
  const to = moment().format("YYYY-MM-DD");
  switch (preset) {
    case "7":
      return {
        from: moment().subtract(7, "days").format("YYYY-MM-DD"),
        to,
      };
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
  accountType,
  partnerId,
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
  if (accountType) payload.account_type = accountType;
  if (partnerId) payload.partner_id = partnerId;
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

function chartCountStepSize(maxValue) {
  if (maxValue <= 5) return 1;
  const rough = maxValue / 5;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / magnitude;
  let niceNormalized = 10;
  if (normalized <= 1) niceNormalized = 1;
  else if (normalized <= 2) niceNormalized = 2;
  else if (normalized <= 5) niceNormalized = 5;
  return niceNormalized * magnitude;
}

function formatSharePct(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  const rounded = Math.round(n * 10) / 10;
  return `${rounded % 1 === 0 ? Math.round(rounded) : rounded}%`;
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

function formatEstimateRange(low, high) {
  const lo = Number(low);
  const hi = Number(high);
  if (!Number.isFinite(lo) && !Number.isFinite(hi)) return "—";
  if (!Number.isFinite(lo)) return formatCurrency(hi, 2);
  if (!Number.isFinite(hi)) return formatCurrency(lo, 2);
  return `${formatCurrency(lo, 2)} – ${formatCurrency(hi, 2)}`;
}

function pickFeatureUsageRow(rows, featureKey) {
  return rows.find((row) => row.feature === featureKey) ?? null;
}

function formatDayLabel(day) {
  const parsed = moment(day, "YYYY-MM-DD", true);
  return parsed.isValid() ? parsed.format("MMM D") : day;
}

function formatPetType(value) {
  const t = String(value || "").toLowerCase();
  if (t === "dog") return "Dog";
  if (t === "cat") return "Cat";
  if (!t) return "—";
  return value;
}

function resolveInsuranceProvider(row) {
  return row?.insurance_provider ?? row?.provider ?? "";
}

function formatCityState(city, state) {
  const c = String(city || "").trim();
  const s = String(state || "").trim();
  if (c && s) return `${c}, ${s}`;
  return c || s || "—";
}

const MEDICATION_ACTION_LABELS = {
  medications_searched: "Medication searched",
  medication_viewed: "Medication viewed",
  medications_browsed: "Medications browsed",
};

function formatMedicationAction(action) {
  const key = String(action || "").toLowerCase().trim();
  if (MEDICATION_ACTION_LABELS[key]) return MEDICATION_ACTION_LABELS[key];
  if (!key) return "—";
  return key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function searchVolume(row) {
  return Number(row?.searches ?? row?.queries ?? row?.count) || 0;
}

function normalizeServiceSearchRow(row) {
  if (!row) return null;
  const serviceName = row.service_name ?? row.service;
  if (!serviceName && !row.service_category && !row.city) return null;
  return {
    service_name: serviceName || "—",
    service_category: row.service_category ?? row.category ?? "",
    pet_type: row.pet_type,
    pet_weight: row.pet_weight ?? row.weight ?? row.weight_lb,
    city: row.city,
    state: row.state,
    searches: row.searches ?? row.count,
    searches_7d: row.searches_7d,
    searches_30d: row.searches_30d,
    searches_90d: row.searches_90d,
    searches_year: row.searches_year,
  };
}

function pickServiceSearchRows(slices) {
  const trends = (slices.serviceSearchTrends || [])
    .map(normalizeServiceSearchRow)
    .filter(Boolean);
  if (trends.length) return sortBySearchVolume(trends);

  const top = (slices.topServices || [])
    .map(normalizeServiceSearchRow)
    .filter(Boolean);
  if (top.length) return sortBySearchVolume(top);

  return sortBySearchVolume(
    (slices.costSearchByCity || [])
      .map(normalizeServiceSearchRow)
      .filter(Boolean),
  );
}

function sortBySearchVolume(rows) {
  return [...rows].sort((a, b) => searchVolume(b) - searchVolume(a));
}

function formatWeight(row) {
  const raw = row?.pet_weight ?? row?.weight ?? row?.weight_lb ?? row?.pet_weight_lb;
  if (raw == null || raw === "") return "—";
  const n = Number(raw);
  if (Number.isFinite(n)) return `${n} lb`;
  const s = String(raw).trim();
  if (/lb/i.test(s)) return s;
  return `${s} lb`;
}

function dateRangeLabel(preset) {
  switch (preset) {
    case "7":
      return "last 7 days";
    case "90":
      return "last 90 days";
    case "year":
      return "this year";
    case "all":
      return "all time";
    case "30":
    default:
      return "last 30 days";
  }
}

function searchesColumnLabel(preset) {
  return `Searches (${dateRangeLabel(preset)})`;
}

function serviceTrendSummary(row) {
  const service = row.service_name || "Service";
  const pet = formatPetType(row.pet_type);
  const weight = formatWeight(row);
  const place = formatCityState(row.city, row.state);
  const count = formatCount(searchVolume(row));
  const weightPart = weight !== "—" ? `, ${weight}` : "";
  return `${service} · ${pet}${weightPart} · ${place} — ${count} searches`;
}

function rowHasMultiPeriodCounts(rows) {
  return rows.some(
    (row) =>
      row?.searches_7d != null ||
      row?.searches_30d != null ||
      row?.searches_90d != null ||
      row?.searches_year != null,
  );
}

function useDebouncedValue(value, delayMs = 500) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

function sliceReport(report) {
  if (!report?.result) return EMPTY_REPORT_SLICES;
  return {
    billMetrics: report.bill_metrics ?? {},
    billByCity: Array.isArray(report.bill_by_city) ? report.bill_by_city : [],
    estimatorMetrics: report.estimator_metrics ?? {},
    estimatorBySymptom: Array.isArray(report.estimator_by_symptom)
      ? report.estimator_by_symptom
      : [],
    totals: report.totals ?? {},
    insuranceTotals: report.insurance_totals ?? {},
    featureUsage: Array.isArray(report.feature_usage)
      ? report.feature_usage
      : [],
    topSymptoms: Array.isArray(report.top_symptoms) ? report.top_symptoms : [],
    topServices: Array.isArray(report.top_services) ? report.top_services : [],
    byPetType: Array.isArray(report.by_pet_type) ? report.by_pet_type : [],
    topBreeds: Array.isArray(report.top_breeds) ? report.top_breeds : [],
    byCity: Array.isArray(report.by_city) ? report.by_city : [],
    dailyTrend: Array.isArray(report.daily_trend) ? report.daily_trend : [],
    costSearchByCity: Array.isArray(report.cost_search_by_city)
      ? report.cost_search_by_city
      : [],
    serviceSearchTrends: Array.isArray(report.service_search_trends)
      ? report.service_search_trends
      : [],
    aiSymptomsByCity: Array.isArray(report.ai_symptoms_by_city)
      ? report.ai_symptoms_by_city
      : [],
    insuranceBreakdown: Array.isArray(report.insurance_breakdown)
      ? report.insurance_breakdown
      : [],
    insuranceByProvider: Array.isArray(report.insurance_by_provider)
      ? report.insurance_by_provider
      : [],
    budgetsByCity: Array.isArray(report.budgets_by_city)
      ? report.budgets_by_city
      : [],
    byAccountType: Array.isArray(report.by_account_type)
      ? report.by_account_type
      : [],
    platformAccountBreakdown: Array.isArray(report.platform_account_breakdown)
      ? report.platform_account_breakdown
      : [],
    medicationsMetrics: report.medications_metrics ?? {},
    topMedications: Array.isArray(report.top_medications)
      ? report.top_medications
      : [],
    medicationsByCategory: Array.isArray(report.medications_by_category)
      ? report.medications_by_category
      : [],
    medicationsByCity: Array.isArray(report.medications_by_city)
      ? report.medications_by_city
      : [],
    medicationsByAction: Array.isArray(report.medications_by_action)
      ? report.medications_by_action
      : [],
  };
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

function QuestionSection({ number, title, children }) {
  return (
    <section className="fi-question-section">
      <h2 className="fi-question-heading">
        <span className="fi-question-badge">Q{number}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function TableCard({ title, colSpan, headers, rows, renderRow }) {
  return (
    <div className="fi-card fi-card--spaced">
      {title ? <div className="fi-card-title">{title}</div> : null}
      <div className="fi-table-wrap">
        <table className="fi-table">
          {headers ? (
            <thead>
              <tr>
                {headers.map((h) => (
                  <th key={h.key} className={h.alignRight ? "fi-r" : undefined}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
          ) : null}
          <tbody>
            {rows.length ? rows.map(renderRow) : <EmptyRow colSpan={colSpan} />}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FeatureUsageCard({ row }) {
  if (!row) {
    return (
      <div className="fi-card fi-card--spaced fi-feature-usage-card">
        <div className="fi-card-title">Product usage</div>
        <p className="fi-muted fi-chart-empty">No usage data for this feature.</p>
      </div>
    );
  }
  return (
    <div className="fi-card fi-card--spaced fi-feature-usage-card">
      <div className="fi-card-title">Product usage — {row.label || row.feature}</div>
      <div className="fi-metric-row fi-metric-row--compact">
        <div className="fi-metric-card">
          <div className="fi-metric-label">Uses</div>
          <div className="fi-metric-value fi-metric-value--sm">
            {formatCount(row.uses)}
          </div>
        </div>
        <div className="fi-metric-card">
          <div className="fi-metric-label">Unique users</div>
          <div className="fi-metric-value fi-metric-value--sm">
            {formatCount(row.unique_users)}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ label, exportLabel, onExport, exporting }) {
  return (
    <div className="fi-section-hdr">
      <p className="fi-section-label">{label}</p>
      {exportLabel && onExport ? (
        <button
          type="button"
          className="fi-export-btn fi-export-btn--sm"
          onClick={onExport}
          disabled={exporting}
        >
          {exporting ? (
            <Spinner size={14} color="inherit" />
          ) : (
            <HiOutlineArrowDownTray size={14} aria-hidden />
          )}
          {exportLabel}
        </button>
      ) : null}
    </div>
  );
}

function ServiceSearchTrendTable({
  rows,
  dateRange,
  showTrendGoalNote = false,
  dense = false,
}) {
  const multiPeriod = rowHasMultiPeriodCounts(rows);
  const searchesLabel = multiPeriod
    ? "Searches (period)"
    : searchesColumnLabel(dateRange);
  const tableClass = dense ? "fi-table fi-table--dense" : "fi-table";
  const colSpan = multiPeriod ? 12 : 7;

  return (
    <>
      {showTrendGoalNote ? (
        <p className="fi-trend-goal">
          <strong>Trend goal:</strong> e.g.{" "}
          <em>Rabies vaccine · Dog · 20 lb · NYC — 20 searches in the last 30 days</em>
          , so we can spot what people search for by city, pet, and weight over time.
        </p>
      ) : null}
      <div className="fi-table-wrap">
        <table className={tableClass}>
          <thead>
            <tr>
              <th>Service</th>
              <th>Category</th>
              <th>Pet type</th>
              <th>Pet weight</th>
              <th>City</th>
              <th>State</th>
              {multiPeriod ? (
                <>
                  <th className="fi-r">7d</th>
                  <th className="fi-r">30d</th>
                  <th className="fi-r">90d</th>
                  <th className="fi-r">Year</th>
                </>
              ) : null}
              <th className="fi-r">{searchesLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, idx) => (
                <tr
                  key={`svc-trend-${idx}-${row.service_name}-${row.city}-${row.state}-${row.pet_type}-${row.pet_weight}`}
                  title={serviceTrendSummary(row)}
                >
                  <td>{row.service_name || "—"}</td>
                  <td className="fi-muted">{row.service_category || "—"}</td>
                  <td className="fi-muted">{formatPetType(row.pet_type)}</td>
                  <td className="fi-muted">{formatWeight(row)}</td>
                  <td>{row.city || "—"}</td>
                  <td className="fi-muted">{row.state || "—"}</td>
                  {multiPeriod ? (
                    <>
                      <td className="fi-r fi-muted">
                        {formatCount(row.searches_7d)}
                      </td>
                      <td className="fi-r fi-muted">
                        {formatCount(row.searches_30d)}
                      </td>
                      <td className="fi-r fi-muted">
                        {formatCount(row.searches_90d)}
                      </td>
                      <td className="fi-r fi-muted">
                        {formatCount(row.searches_year)}
                      </td>
                    </>
                  ) : null}
                  <td className="fi-r fi-count-val">
                    {formatCount(searchVolume(row))}
                  </td>
                </tr>
              ))
            ) : (
              <EmptyRow colSpan={colSpan} />
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

const FarevetIntelligence = () => {
  const [dateRange, setDateRange] = useState("30");
  const [activeView, setActiveView] = useState("overview");
  const [accountType, setAccountType] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [petType, setPetType] = useState("all");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [symptom, setSymptom] = useState("");
  const [partners, setPartners] = useState([]);
  const debouncedCity = useDebouncedValue(city);
  const debouncedState = useDebouncedValue(state);
  const debouncedSymptom = useDebouncedValue(symptom);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportingTrends, setExportingTrends] = useState(false);
  const [exportingFeature, setExportingFeature] = useState(null);

  const intelligenceView = useMemo(
    () => resolveIntelligenceView(activeView),
    [activeView],
  );

  const filterFields = useMemo(
    () =>
      buildFilterPayload({
        dateRange,
        feature: intelligenceView.feature,
        accountType,
        partnerId,
        petType,
        city: debouncedCity,
        state: debouncedState,
        symptom:
          activeView === "farevet_ai" || activeView === "overview"
            ? debouncedSymptom
            : "",
      }),
    [
      dateRange,
      intelligenceView.feature,
      activeView,
      accountType,
      partnerId,
      petType,
      debouncedCity,
      debouncedState,
      debouncedSymptom,
    ],
  );

  const showOverview = activeView === "overview";
  const showCost = activeView === "cost_search";
  const showFarevetAi = activeView === "farevet_ai";
  const showInsurance = activeView === "insurance_calculator";
  const showEstimator = activeView === "visit_estimator";
  const showMedications = activeView === "medications";
  const showConcierge = activeView === "concierge";
  const showBillExplainer = activeView === "bill_explainer";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const body = new FormData();
      body.append("type", "get_list");
      body.append("table_name", "partner");
      const res = await apiRequest({ body });
      if (cancelled || !res?.data?.length) return;
      setPartners(
        res.data.map((p) => ({
          id: String(p.id),
          name: p.partner_name || `Partner #${p.id}`,
        })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const data = useMemo(() => sliceReport(report), [report]);

  const featureUsageRows = useMemo(
    () => normalizeFeatureUsage(data.featureUsage),
    [data.featureUsage],
  );

  const featureUsesTotal = useMemo(
    () =>
      featureUsageRows.reduce(
        (sum, row) => sum + (Number(row?.uses) || 0),
        0,
      ),
    [featureUsageRows],
  );

  const petTypeStats = useMemo(() => {
    let dog = 0;
    let cat = 0;
    data.byPetType.forEach((row) => {
      const t = String(row?.pet_type || "").toLowerCase();
      const count = Number(row?.count) || 0;
      if (t === "dog") dog += count;
      else if (t === "cat") cat += count;
    });
    const total = dog + cat;
    const dogPct = total ? Math.round((dog / total) * 100) : 0;
    const catPct = total ? Math.round((cat / total) * 100) : 0;
    return { dog, cat, dogPct, catPct, total };
  }, [data.byPetType]);

  const accountTypeBreakdown = useMemo(
    () =>
      buildPlatformAccountBreakdown(
        data.platformAccountBreakdown,
        data.byAccountType,
      ),
    [data.platformAccountBreakdown, data.byAccountType],
  );

  const serviceSearchRows = useMemo(
    () => pickServiceSearchRows(data),
    [data],
  );

  const overviewServiceRows = useMemo(
    () => serviceSearchRows.slice(0, 25),
    [serviceSearchRows],
  );

  /** `top_symptoms` has no city. Geo breakdown is in `ai_symptoms_by_city`. */
  const overviewSymptoms = useMemo(() => {
    if (data.aiSymptomsByCity.length) {
      return sortBySearchVolume(data.aiSymptomsByCity).slice(0, 15);
    }
    return data.topSymptoms.map((row) => ({
      ai_symptom: row.symptom,
      symptom: row.symptom,
      pet_type: row.pet_type,
      city: row.city,
      state: row.state,
      queries: row.count,
    }));
  }, [data.aiSymptomsByCity, data.topSymptoms]);

  const cityChartData = useMemo(
    () => ({
      labels: data.byCity.map(
        (row) =>
          `${row?.city || "Unknown"}${row?.state ? `, ${row.state}` : ""}`,
      ),
      datasets: [
        {
          data: data.byCity.map((row) => Number(row?.count) || 0),
          backgroundColor: PRIMARY,
          borderRadius: 5,
        },
      ],
    }),
    [data.byCity],
  );

  const petChartData = useMemo(
    () => ({
      labels: ["Dogs", "Cats"],
      datasets: [
        {
          data: [petTypeStats.dog, petTypeStats.cat],
          backgroundColor: [PRIMARY, SECONDARY],
          borderWidth: 0,
        },
      ],
    }),
    [petTypeStats.cat, petTypeStats.dog],
  );

  const accountChartData = useMemo(
    () => ({
      labels: accountTypeBreakdown.segments.map((seg) => seg.label),
      datasets: [
        {
          data: accountTypeBreakdown.segments.map((seg) => seg.count),
          backgroundColor: accountTypeBreakdown.segments.map((seg) => seg.color),
          borderWidth: 0,
        },
      ],
    }),
    [accountTypeBreakdown],
  );

  const featureChartData = useMemo(
    () => ({
      labels: featureUsageRows.map((row) => row.label || row.feature),
      datasets: [
        {
          data: featureUsageRows.map((row) => Number(row?.uses) || 0),
          backgroundColor: PRIMARY,
          borderRadius: 5,
        },
      ],
    }),
    [featureUsageRows],
  );

  const featureBarOptions = useMemo(
    () => ({
      ...barOptions(true),
      scales: {
        x: {
          grid: { color: GRID_COLOR },
          min: 0,
          suggestedMax: featureUsesTotal > 0 ? undefined : 10,
        },
        y: { grid: { display: false } },
      },
    }),
    [featureUsesTotal],
  );

  const insuranceProviderChartData = useMemo(() => {
    const top = [...data.insuranceByProvider]
      .sort((a, b) => (Number(b?.users) || 0) - (Number(a?.users) || 0))
      .slice(0, 8);
    return {
      labels: top.map((row) => row.insurance_provider || "—"),
      datasets: [
        {
          label: "Users",
          data: top.map((row) => Number(row?.users) || 0),
          backgroundColor: PRIMARY,
          borderRadius: 5,
        },
      ],
    };
  }, [data.insuranceByProvider]);

  const insuranceProviderBarOptions = useMemo(() => {
    const maxUsers = data.insuranceByProvider.reduce(
      (max, row) => Math.max(max, Number(row?.users) || 0),
      0,
    );
    const axisMax =
      maxUsers <= 1 ? 5 : Math.ceil(maxUsers * 1.1 / chartCountStepSize(maxUsers)) * chartCountStepSize(maxUsers);
    const stepSize = chartCountStepSize(axisMax);
    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const users = context.parsed?.x ?? 0;
              return `${formatCount(users)} user${users === 1 ? "" : "s"}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: GRID_COLOR },
          min: 0,
          max: axisMax,
          beginAtZero: true,
          title: {
            display: true,
            text: "Users",
            font: { size: 11 },
            color: "#64748b",
          },
          ticks: {
            stepSize,
            precision: 0,
            callback: (value) =>
              Number.isInteger(Number(value)) ? formatCount(value) : undefined,
          },
        },
        y: { grid: { display: false } },
      },
    };
  }, [data.insuranceByProvider]);

  const hasInsuranceProviderUsers = useMemo(
    () =>
      data.insuranceByProvider.some((row) => Number(row?.users) > 0),
    [data.insuranceByProvider],
  );

  const billExplainerUsage = useMemo(
    () => pickFeatureUsageRow(featureUsageRows, "bill_explainer"),
    [featureUsageRows],
  );

  const estimatorUsage = useMemo(
    () => pickFeatureUsageRow(featureUsageRows, "visit_estimator"),
    [featureUsageRows],
  );

  const medicationsUsage = useMemo(
    () => pickFeatureUsageRow(featureUsageRows, "medications"),
    [featureUsageRows],
  );

  const medicationLookups = useMemo(() => {
    const fromMetrics = Number(data.medicationsMetrics.medication_lookups);
    if (Number.isFinite(fromMetrics) && fromMetrics > 0) return fromMetrics;
    const fromUsage = Number(medicationsUsage?.uses);
    if (Number.isFinite(fromUsage) && fromUsage > 0) return fromUsage;
    return Number(data.totals.total_activities) || 0;
  }, [data.medicationsMetrics, data.totals, medicationsUsage]);

  const medicationUniqueUsers = useMemo(() => {
    const fromMetrics = Number(data.medicationsMetrics.unique_users);
    if (Number.isFinite(fromMetrics) && fromMetrics > 0) return fromMetrics;
    const fromUsage = Number(medicationsUsage?.unique_users);
    if (Number.isFinite(fromUsage) && fromUsage > 0) return fromUsage;
    return Number(data.totals.unique_users) || 0;
  }, [data.medicationsMetrics, data.totals, medicationsUsage]);

  const topMedicationsChartData = useMemo(() => {
    const top = [...data.topMedications]
      .sort((a, b) => (Number(b?.count) || 0) - (Number(a?.count) || 0))
      .slice(0, 10);
    return {
      labels: top.map((row) => row.medication_name || "—"),
      datasets: [
        {
          label: "Lookups",
          data: top.map((row) => Number(row?.count) || 0),
          backgroundColor: PRIMARY,
          borderRadius: 5,
        },
      ],
    };
  }, [data.topMedications]);

  const medicationsByCategoryChartData = useMemo(() => {
    const rows = [...data.medicationsByCategory].sort(
      (a, b) => (Number(b?.count) || 0) - (Number(a?.count) || 0),
    );
    return {
      labels: rows.map((row) => row.category || "—"),
      datasets: [
        {
          data: rows.map((row) => Number(row?.count) || 0),
          backgroundColor: [PRIMARY, SECONDARY, "#378ADD", "#E8A020", "#ED5D67", "#94A3B8"],
          borderWidth: 0,
        },
      ],
    };
  }, [data.medicationsByCategory]);

  const medicationsByActionChartData = useMemo(() => {
    const rows = [...data.medicationsByAction].sort(
      (a, b) => (Number(b?.count) || 0) - (Number(a?.count) || 0),
    );
    return {
      labels: rows.map((row) => formatMedicationAction(row.action)),
      datasets: [
        {
          data: rows.map((row) => Number(row?.count) || 0),
          backgroundColor: [PRIMARY, SECONDARY, "#378ADD", "#E8A020"],
          borderWidth: 0,
        },
      ],
    };
  }, [data.medicationsByAction]);

  const medicationsByCityChartData = useMemo(() => {
    const top = [...data.medicationsByCity]
      .sort((a, b) => (Number(b?.count) || 0) - (Number(a?.count) || 0))
      .slice(0, 12);
    return {
      labels: top.map((row) =>
        `${formatCityState(row?.city, row?.state)} · ${formatPetType(row?.pet_type)}`,
      ),
      datasets: [
        {
          label: "Lookups",
          data: top.map((row) => Number(row?.count) || 0),
          backgroundColor: PRIMARY,
          borderRadius: 5,
        },
      ],
    };
  }, [data.medicationsByCity]);

  const hasMedicationsByCategory = useMemo(
    () => data.medicationsByCategory.some((row) => Number(row?.count) > 0),
    [data.medicationsByCategory],
  );

  const hasMedicationsByAction = useMemo(
    () => data.medicationsByAction.some((row) => Number(row?.count) > 0),
    [data.medicationsByAction],
  );

  const billsAnalyzed = Number(data.billMetrics.bills_analyzed) || 0;
  const estimatesRun = Number(data.estimatorMetrics.estimates_run) || 0;

  const billByCityChartData = useMemo(
    () => ({
      labels: data.billByCity.map((row) =>
        formatCityState(row?.city, row?.state),
      ),
      datasets: [
        {
          label: "Bills",
          data: data.billByCity.map((row) => Number(row?.count) || 0),
          backgroundColor: PRIMARY,
          borderRadius: 5,
        },
      ],
    }),
    [data.billByCity],
  );

  const billSavingsByCityChartData = useMemo(
    () => ({
      labels: data.billByCity.map((row) =>
        formatCityState(row?.city, row?.state),
      ),
      datasets: [
        {
          label: "Total savings",
          data: data.billByCity.map((row) => Number(row?.total_savings) || 0),
          backgroundColor: SECONDARY,
          borderRadius: 5,
        },
      ],
    }),
    [data.billByCity],
  );

  const trendChartData = useMemo(
    () => ({
      labels: data.dailyTrend.map((row) => formatDayLabel(row?.day)),
      datasets: [
        {
          label: "Daily activity",
          data: data.dailyTrend.map((row) => Number(row?.count) || 0),
          borderColor: PRIMARY,
          backgroundColor: "rgba(127, 63, 232, 0.08)",
          tension: 0.3,
          pointRadius: 3,
          fill: true,
        },
      ],
    }),
    [data.dailyTrend],
  );

  const handleFeatureExportCsv = async (featureKey, filenamePrefix) => {
    setExportingFeature(featureKey);
    try {
      const exportFields = {
        ...filterFields,
        type: "admin_intelligence_export",
        feature: featureKey,
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
      link.download = `${filenamePrefix}-${stamp}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success("CSV export started");
    } catch (e) {
      message.error("CSV export failed");
    } finally {
      setExportingFeature(null);
    }
  };

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

  const handleExportTrendsCsv = async () => {
    setExportingTrends(true);
    try {
      const exportFields = {
        ...filterFields,
        type: "admin_intelligence_trends_export",
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
      link.download = `farevet-service-trends-${stamp}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success("Trend CSV export started");
    } catch (e) {
      message.error("Trend CSV export failed");
    } finally {
      setExportingTrends(false);
    }
  };

  const insuranceTotalCards = [
    {
      label: "Users with insurance",
      value: formatCount(data.insuranceTotals.users_with_insurance),
    },
    {
      label: "Avg budget (insured)",
      value: formatCurrency(data.insuranceTotals.avg_budget, 2),
    },
    {
      label: "Insurance data points",
      value: formatCount(data.insuranceTotals.data_points),
    },
  ].filter((card) => card.value !== "—");

  return (
    <div className="farevet-intelligence-page">
      <div className="fi-page-hdr">
        <h1 className="fi-page-title">Intelligence</h1>
        <div className="fi-page-actions">
          <button
            type="button"
            className="fi-export-btn"
            onClick={handleExportTrendsCsv}
            disabled={exportingTrends || loading}
          >
            {exportingTrends ? (
              <Spinner size={16} color="inherit" />
            ) : (
              <HiOutlineArrowDownTray size={16} aria-hidden />
            )}
            Trend CSV
          </button>
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
      </div>

      <div className="fi-view-tabs" role="tablist" aria-label="Intelligence feature">
        {INTELLIGENCE_VIEWS.map((view) => (
          <button
            key={view.id}
            type="button"
            role="tab"
            aria-selected={activeView === view.id}
            className={`fi-view-tab${activeView === view.id ? " fi-view-tab--active" : ""}`}
            onClick={() => setActiveView(view.id)}
          >
            {view.label}
          </button>
        ))}
      </div>
      <p className="fi-view-desc">{VIEW_DESCRIPTIONS[activeView]}</p>

      <div className="fi-filters">
        <select
          className="fi-filter-select"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          aria-label="Date range"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="year">This year</option>
          <option value="all">All time</option>
        </select>
        <select
          className="fi-filter-select"
          value={accountType}
          onChange={(e) => setAccountType(e.target.value)}
          aria-label="Account type"
        >
          {ACCOUNT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className="fi-filter-select"
          value={partnerId}
          onChange={(e) => setPartnerId(e.target.value)}
          aria-label="Partner"
        >
          <option value="">All partners</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
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
        {(showOverview || showFarevetAi) && (
          <input
            type="text"
            className="fi-filter-select fi-filter-input"
            placeholder="Symptom"
            value={symptom}
            onChange={(e) => setSymptom(e.target.value)}
            aria-label="Symptom"
          />
        )}
      </div>

      {loading ? (
        <div className="fi-loading">
          <Spinner size={48} />
        </div>
      ) : (
        <>
          {showOverview && (
            <div className="fi-metric-row fi-metric-row--wide">
              <div className="fi-metric-card">
                <div className="fi-metric-label">Total activities</div>
                <div className="fi-metric-value">
                  {formatCount(data.totals.total_activities)}
                </div>
              </div>
              <div className="fi-metric-card">
                <div className="fi-metric-label">Unique users</div>
                <div className="fi-metric-value">
                  {formatCount(data.totals.unique_users)}
                </div>
              </div>
            </div>
          )}

          {(showCost ||
            showFarevetAi ||
            showConcierge ||
            showInsurance) && (
            <div className="fi-metric-row fi-metric-row--wide">
              <div className="fi-metric-card">
                <div className="fi-metric-label">Total activities</div>
                <div className="fi-metric-value">
                  {formatCount(data.totals.total_activities)}
                </div>
              </div>
              <div className="fi-metric-card">
                <div className="fi-metric-label">Unique users</div>
                <div className="fi-metric-value">
                  {formatCount(data.totals.unique_users)}
                </div>
              </div>
            </div>
          )}

          {showCost && (
            <>
              <p className="fi-section-label">Cost Search</p>
              <QuestionSection
                number={1}
                title="What services are users searching for, by city?"
              >
                <div className="fi-card fi-card--spaced">
                  <ServiceSearchTrendTable
                    rows={serviceSearchRows}
                    dateRange={dateRange}
                    showTrendGoalNote
                  />
                </div>
              </QuestionSection>
              <div className="fi-grid-2">
                <div className="fi-card">
                  <div className="fi-card-title">
                    Top services searched
                    <span className="fi-card-title-hint">
                      Trends by city, pet &amp; weight
                    </span>
                  </div>
                  <ServiceSearchTrendTable
                    rows={overviewServiceRows}
                    dateRange={dateRange}
                    dense
                  />
                </div>
                <div className="fi-card">
                  <div className="fi-card-title">Activity by city</div>
                  <div className="fi-chart-wrap fi-chart-wrap--220">
                    {data.byCity.length ? (
                      <Bar data={cityChartData} options={barOptions(false)} />
                    ) : (
                      <p className="fi-muted fi-chart-empty">No city data</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {showFarevetAi && (
            <>
              <p className="fi-section-label">FareVet AI</p>
              <QuestionSection
                number={2}
                title="What symptoms is FareVet AI asked about, by city?"
              >
                <TableCard
                  colSpan={5}
                  headers={[
                    { key: "symptom", label: "AI symptom" },
                    { key: "pet", label: "Pet type" },
                    { key: "city", label: "City" },
                    { key: "queries", label: "Queries", alignRight: true },
                    { key: "budget", label: "Avg budget", alignRight: true },
                  ]}
                  rows={data.aiSymptomsByCity}
                  renderRow={(row, idx) => (
                    <tr key={`q2-${idx}-${row.ai_symptom}-${row.city}`}>
                      <td>{row.ai_symptom || "—"}</td>
                      <td>{formatPetType(row.pet_type)}</td>
                      <td>{row.city || "—"}</td>
                      <td className="fi-r fi-count-val">
                        {formatCount(row.queries ?? row.count)}
                      </td>
                      <td className="fi-r fi-muted">
                        {formatCurrency(row.avg_budget, 2)}
                      </td>
                    </tr>
                  )}
                />
              </QuestionSection>
              <div className="fi-card fi-card--spaced">
                <div className="fi-card-title">
                  Top searched symptoms
                  <span className="fi-card-title-hint">By city &amp; pet type</span>
                </div>
                <div className="fi-table-wrap">
                  <table className="fi-table fi-table--dense">
                    <thead>
                      <tr>
                        <th>Symptom</th>
                        <th>Pet</th>
                        <th>Location</th>
                        <th className="fi-r">Searches</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overviewSymptoms.length ? (
                        overviewSymptoms.map((row, idx) => {
                          const label = row.ai_symptom || row.symptom;
                          return (
                            <tr
                              key={`sym-${idx}-${label}-${row.city}-${row.pet_type}`}
                            >
                              <td>{label || "—"}</td>
                              <td className="fi-muted">
                                {formatPetType(row.pet_type)}
                              </td>
                              <td className="fi-muted">
                                {formatCityState(row.city, row.state)}
                              </td>
                              <td className="fi-r fi-count-val">
                                {formatCount(searchVolume(row))}
                              </td>
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
            </>
          )}

          {showInsurance && (
            <>
              <p className="fi-section-label">Insurance</p>
              <QuestionSection
                number={3}
                title="Who has pet insurance, and what are they budgeting?"
              >
            {insuranceTotalCards.length > 0 && (
              <div className="fi-metric-row fi-metric-row--wide fi-metric-row--compact">
                {insuranceTotalCards.map((card) => (
                  <div className="fi-metric-card" key={card.label}>
                    <div className="fi-metric-label">{card.label}</div>
                    <div className="fi-metric-value fi-metric-value--sm">
                      {card.value}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="fi-grid-2">
              <div className="fi-card">
                <div className="fi-card-title">Insurance by company</div>
                <p className="fi-card-caption">
                  Number of users who selected each insurer
                </p>
                <div className="fi-chart-wrap fi-chart-wrap--220">
                  {data.insuranceByProvider.length &&
                  hasInsuranceProviderUsers ? (
                    <Bar
                      data={insuranceProviderChartData}
                      options={insuranceProviderBarOptions}
                    />
                  ) : (
                    <p className="fi-muted fi-chart-empty">
                      No insured users in this period
                    </p>
                  )}
                </div>
              </div>
              <div className="fi-card">
                <div className="fi-card-title">
                  Users by insurance provider
                </div>
                <div className="fi-table-wrap">
                  <table className="fi-table fi-table--dense">
                    <thead>
                      <tr>
                        <th>Provider</th>
                        <th className="fi-r">Users</th>
                        <th className="fi-r">Pets</th>
                        <th className="fi-r">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.insuranceByProvider.length ? (
                        data.insuranceByProvider.map((row, idx) => (
                          <tr
                            key={`ins-prov-${idx}-${row.insurance_provider}`}
                            title={`${row.insurance_provider} — ${formatCount(row.users)} users`}
                          >
                            <td className="fi-count-val">
                              {row.insurance_provider || "—"}
                            </td>
                            <td className="fi-r fi-count-val">
                              {formatCount(row.users)}
                            </td>
                            <td className="fi-r fi-muted">
                              {formatCount(row.pets)}
                            </td>
                            <td className="fi-r fi-muted">
                              {formatSharePct(row.share_pct)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <EmptyRow colSpan={4} />
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <p className="fi-trend-goal fi-trend-goal--compact">
              Share is per provider vs all insured users in the filter window. A
              user with pets on two providers may appear under both companies.
            </p>
            <p className="fi-trend-goal fi-trend-goal--compact">
              City and avg budget may be empty for pet-only events until the user
              runs Cost Search or AI with location and budget. Pet create still
              records provider and pet type.
            </p>
            <TableCard
              colSpan={5}
              headers={[
                { key: "provider", label: "Provider" },
                { key: "city", label: "City" },
                { key: "pet", label: "Pet type" },
                {
                  key: "users",
                  label: "Users w/ insurance",
                  alignRight: true,
                },
                { key: "budget", label: "Avg budget", alignRight: true },
              ]}
              rows={data.insuranceBreakdown}
              renderRow={(row, idx) => (
                <tr
                  key={`q3-${idx}-${resolveInsuranceProvider(row)}-${row.city}-${row.pet_type}`}
                >
                  <td>{resolveInsuranceProvider(row) || "—"}</td>
                  <td>{row.city || "—"}</td>
                  <td>{formatPetType(row.pet_type)}</td>
                  <td className="fi-r fi-count-val">
                    {formatCount(row.users_with_insurance)}
                  </td>
                  <td className="fi-r fi-muted">
                    {formatCurrency(row.avg_budget, 2)}
                  </td>
                </tr>
              )}
            />
              </QuestionSection>
            </>
          )}

          {showEstimator && (
            <>
              <SectionHeader
                label="Pre-Visit Estimator"
                exportLabel="Export Estimator CSV"
                exporting={exportingFeature === "visit_estimator"}
                onExport={() =>
                  handleFeatureExportCsv(
                    "visit_estimator",
                    "farevet-estimator",
                  )
                }
              />
              <div className="fi-metric-row fi-metric-row--wide">
                <div className="fi-metric-card">
                  <div className="fi-metric-label">Estimates run</div>
                  <div className="fi-metric-value">
                    {formatCount(data.estimatorMetrics.estimates_run)}
                  </div>
                </div>
                <div className="fi-metric-card">
                  <div className="fi-metric-label">Avg expected visit cost</div>
                  <div className="fi-metric-value">
                    {formatEstimateRange(
                      data.estimatorMetrics.avg_estimated_low,
                      data.estimatorMetrics.avg_estimated_high,
                    )}
                  </div>
                </div>
                <div className="fi-metric-card">
                  <div className="fi-metric-label">Avg estimated low</div>
                  <div className="fi-metric-value fi-metric-value--sm">
                    {formatCurrency(data.estimatorMetrics.avg_estimated_low, 2)}
                  </div>
                </div>
                <div className="fi-metric-card">
                  <div className="fi-metric-label">Avg estimated high</div>
                  <div className="fi-metric-value fi-metric-value--sm">
                    {formatCurrency(
                      data.estimatorMetrics.avg_estimated_high,
                      2,
                    )}
                  </div>
                </div>
              </div>
              {estimatesRun === 0 ? (
                <p className="fi-empty-banner">
                  No estimates yet in this period.
                </p>
              ) : null}
              <TableCard
                title="Estimates by symptom & category"
                colSpan={6}
                headers={[
                  { key: "symptom", label: "Symptom" },
                  { key: "category", label: "Category" },
                  { key: "count", label: "# estimates", alignRight: true },
                  { key: "range", label: "Typical range", alignRight: true },
                  { key: "low", label: "Avg low", alignRight: true },
                  { key: "high", label: "Avg high", alignRight: true },
                ]}
                rows={data.estimatorBySymptom}
                renderRow={(row, idx) => (
                  <tr
                    key={`est-${idx}-${row.symptom}-${row.service_category}`}
                  >
                    <td>{row.symptom || "—"}</td>
                    <td className="fi-muted">{row.service_category || "—"}</td>
                    <td className="fi-r fi-count-val">
                      {formatCount(row.count)}
                    </td>
                    <td className="fi-r fi-count-val">
                      {formatEstimateRange(
                        row.avg_estimated_low,
                        row.avg_estimated_high,
                      )}
                    </td>
                    <td className="fi-r fi-muted">
                      {formatCurrency(row.avg_estimated_low, 2)}
                    </td>
                    <td className="fi-r fi-muted">
                      {formatCurrency(row.avg_estimated_high, 2)}
                    </td>
                  </tr>
                )}
              />
              {data.estimatorBySymptom.length === 0 && estimatesRun > 0 ? (
                <p className="fi-trend-goal fi-trend-goal--compact">
                  No symptom data — estimates may predate logging fix.
                </p>
              ) : null}
              <FeatureUsageCard row={estimatorUsage} />
              <div className="fi-card fi-card--spaced">
                <div className="fi-card-title">Estimates by pet type</div>
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
                        style={{ background: SECONDARY }}
                      />
                      Cats {petTypeStats.catPct}%
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {showMedications && (
            <>
              <SectionHeader
                label="Medications"
                exportLabel="Export Medications CSV"
                exporting={exportingFeature === "medications"}
                onExport={() =>
                  handleFeatureExportCsv("medications", "farevet-medications")
                }
              />
              <div className="fi-metric-row fi-metric-row--wide">
                <div className="fi-metric-card">
                  <div className="fi-metric-label">Medication lookups</div>
                  <div className="fi-metric-value">
                    {formatCount(medicationLookups)}
                  </div>
                </div>
                <div className="fi-metric-card">
                  <div className="fi-metric-label">Unique users</div>
                  <div className="fi-metric-value">
                    {formatCount(medicationUniqueUsers)}
                  </div>
                </div>
              </div>
              {medicationLookups === 0 ? (
                <p className="fi-empty-banner">
                  No medication activity yet in this period.
                </p>
              ) : null}
              <div className="fi-grid-2">
                <div className="fi-card">
                  <div className="fi-card-title">Top medications</div>
                  <p className="fi-card-caption">
                    Most searched or viewed medications
                  </p>
                  <div className="fi-chart-wrap fi-chart-wrap--220">
                    {data.topMedications.length ? (
                      <Bar
                        data={topMedicationsChartData}
                        options={barOptions(true)}
                      />
                    ) : (
                      <p className="fi-muted fi-chart-empty">
                        No medication lookup data
                      </p>
                    )}
                  </div>
                </div>
                <TableCard
                  title="Top medications"
                  colSpan={2}
                  headers={[
                    { key: "name", label: "Medication" },
                    { key: "count", label: "Lookups", alignRight: true },
                  ]}
                  rows={data.topMedications}
                  renderRow={(row, idx) => (
                    <tr key={`med-top-${idx}-${row.medication_name}`}>
                      <td>{row.medication_name || "—"}</td>
                      <td className="fi-r fi-count-val">
                        {formatCount(row.count)}
                      </td>
                    </tr>
                  )}
                />
              </div>
              <div className="fi-grid-2">
                <div className="fi-card">
                  <div className="fi-card-title">By category</div>
                  <div className="fi-chart-wrap fi-chart-wrap--220">
                    {hasMedicationsByCategory ? (
                      <Doughnut
                        data={medicationsByCategoryChartData}
                        options={doughnutOptions}
                      />
                    ) : (
                      <p className="fi-muted fi-chart-empty">
                        No category breakdown
                      </p>
                    )}
                  </div>
                </div>
                <TableCard
                  title="Lookups by category"
                  colSpan={2}
                  headers={[
                    { key: "category", label: "Category" },
                    { key: "count", label: "Lookups", alignRight: true },
                  ]}
                  rows={data.medicationsByCategory}
                  renderRow={(row, idx) => (
                    <tr key={`med-cat-${idx}-${row.category}`}>
                      <td>{row.category || "—"}</td>
                      <td className="fi-r fi-count-val">
                        {formatCount(row.count)}
                      </td>
                    </tr>
                  )}
                />
              </div>
              <div className="fi-grid-2">
                <div className="fi-card">
                  <div className="fi-card-title">Search vs view split</div>
                  <p className="fi-card-caption">
                    How users interact with the medications feature
                  </p>
                  <div className="fi-chart-wrap fi-chart-wrap--220">
                    {hasMedicationsByAction ? (
                      <Doughnut
                        data={medicationsByActionChartData}
                        options={doughnutOptions}
                      />
                    ) : (
                      <p className="fi-muted fi-chart-empty">
                        No action breakdown
                      </p>
                    )}
                  </div>
                </div>
                <TableCard
                  title="By action type"
                  colSpan={2}
                  headers={[
                    { key: "action", label: "Action" },
                    { key: "count", label: "Count", alignRight: true },
                  ]}
                  rows={data.medicationsByAction}
                  renderRow={(row, idx) => (
                    <tr key={`med-act-${idx}-${row.action}`}>
                      <td>{formatMedicationAction(row.action)}</td>
                      <td className="fi-r fi-count-val">
                        {formatCount(row.count)}
                      </td>
                    </tr>
                  )}
                />
              </div>
              <div className="fi-card fi-card--spaced">
                <div className="fi-card-title">Lookups by city</div>
                <div className="fi-chart-wrap fi-chart-wrap--220">
                  {data.medicationsByCity.length ? (
                    <Bar
                      data={medicationsByCityChartData}
                      options={barOptions(true)}
                    />
                  ) : (
                    <p className="fi-muted fi-chart-empty">
                      No city data — users may be missing location on medication events.
                    </p>
                  )}
                </div>
              </div>
              <TableCard
                title="Medication activity by city"
                colSpan={4}
                headers={[
                  { key: "city", label: "City" },
                  { key: "state", label: "State" },
                  { key: "pet", label: "Pet type" },
                  { key: "count", label: "Lookups", alignRight: true },
                ]}
                rows={data.medicationsByCity}
                renderRow={(row, idx) => (
                  <tr key={`med-city-${idx}-${row.city}-${row.state}-${row.pet_type}`}>
                    <td>{row.city || "—"}</td>
                    <td className="fi-muted">{row.state || "—"}</td>
                    <td>{formatPetType(row.pet_type)}</td>
                    <td className="fi-r fi-count-val">
                      {formatCount(row.count)}
                    </td>
                  </tr>
                )}
              />
              <FeatureUsageCard row={medicationsUsage} />
              <div className="fi-card fi-card--spaced">
                <div className="fi-card-title">Daily activity trend</div>
                <div className="fi-chart-wrap fi-chart-wrap--220">
                  {data.dailyTrend.length ? (
                    <Line data={trendChartData} options={lineTrendOptions} />
                  ) : (
                    <p className="fi-muted fi-chart-empty">No trend data</p>
                  )}
                </div>
              </div>
            </>
          )}

          {showBillExplainer && (
            <>
              <SectionHeader
                label="Bill Explainer"
                exportLabel="Export Bill CSV"
                exporting={exportingFeature === "bill_explainer"}
                onExport={() =>
                  handleFeatureExportCsv("bill_explainer", "farevet-bill-explainer")
                }
              />
              <div className="fi-metric-row fi-metric-row--wide">
                <div className="fi-metric-card">
                  <div className="fi-metric-label">Bills analyzed</div>
                  <div className="fi-metric-value">
                    {formatCount(data.billMetrics.bills_analyzed)}
                  </div>
                </div>
                <div className="fi-metric-card">
                  <div className="fi-metric-label">Average bill</div>
                  <div className="fi-metric-value">
                    {formatCurrency(data.billMetrics.avg_bill_amount, 2)}
                  </div>
                </div>
                <div className="fi-metric-card">
                  <div className="fi-metric-label">Total savings identified</div>
                  <div className="fi-metric-value fi-metric-value--green">
                    {formatCurrency(
                      data.billMetrics.total_savings_identified,
                      2,
                    )}
                  </div>
                </div>
                <div className="fi-metric-card">
                  <div className="fi-metric-label">Avg savings per bill</div>
                  <div className="fi-metric-value fi-metric-value--green">
                    {formatCurrency(data.billMetrics.avg_savings, 2)}
                  </div>
                </div>
              </div>
              {billsAnalyzed === 0 ? (
                <p className="fi-empty-banner">
                  No bill analyses yet in this period.
                </p>
              ) : null}
              <div className="fi-grid-2">
                <div className="fi-card">
                  <div className="fi-card-title">Bills by region (volume)</div>
                  <div className="fi-chart-wrap fi-chart-wrap--220">
                    {data.billByCity.length ? (
                      <Bar
                        data={billByCityChartData}
                        options={barOptions(false)}
                      />
                    ) : (
                      <p className="fi-muted fi-chart-empty">
                        No geo data — users may be missing city/state on bills.
                      </p>
                    )}
                  </div>
                </div>
                <div className="fi-card">
                  <div className="fi-card-title">
                    Savings by region
                  </div>
                  <div className="fi-chart-wrap fi-chart-wrap--220">
                    {data.billByCity.length ? (
                      <Bar
                        data={billSavingsByCityChartData}
                        options={barOptions(false)}
                      />
                    ) : (
                      <p className="fi-muted fi-chart-empty">
                        No geo data — users may be missing city/state on bills.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <TableCard
                title="Bills by region"
                colSpan={5}
                headers={[
                  { key: "city", label: "City" },
                  { key: "state", label: "State" },
                  { key: "count", label: "# bills", alignRight: true },
                  { key: "avg", label: "Avg bill", alignRight: true },
                  { key: "savings", label: "Total savings", alignRight: true },
                ]}
                rows={data.billByCity}
                renderRow={(row, idx) => (
                  <tr key={`bill-city-${idx}-${row.city}-${row.state}`}>
                    <td>{row.city || "—"}</td>
                    <td className="fi-muted">{row.state || "—"}</td>
                    <td className="fi-r fi-count-val">
                      {formatCount(row.count)}
                    </td>
                    <td className="fi-r fi-count-val">
                      {formatCurrency(row.avg_bill_amount, 2)}
                    </td>
                    <td className="fi-r fi-muted">
                      {formatCurrency(row.total_savings, 2)}
                    </td>
                  </tr>
                )}
              />
              <FeatureUsageCard row={billExplainerUsage} />
              <div className="fi-grid-2">
                <TableCard
                  title="Top symptoms (all features)"
                  colSpan={2}
                  headers={[
                    { key: "symptom", label: "Symptom" },
                    { key: "count", label: "Count", alignRight: true },
                  ]}
                  rows={data.topSymptoms}
                  renderRow={(row, idx) => (
                    <tr key={`bill-sym-${idx}-${row.symptom}`}>
                      <td>{row.symptom || "—"}</td>
                      <td className="fi-r fi-count-val">
                        {formatCount(row.count)}
                      </td>
                    </tr>
                  )}
                />
                <TableCard
                  title="Top breeds — bill & savings"
                  colSpan={5}
                  headers={[
                    { key: "breed", label: "Breed" },
                    { key: "pet", label: "Pet type" },
                    { key: "count", label: "Activity", alignRight: true },
                    { key: "bill", label: "Avg bill", alignRight: true },
                    { key: "savings", label: "Avg savings", alignRight: true },
                  ]}
                  rows={data.topBreeds}
                  renderRow={(row, idx) => (
                    <tr key={`bill-breed-${idx}-${row.pet_breed}`}>
                      <td>{row.pet_breed || "—"}</td>
                      <td>{formatPetType(row.pet_type)}</td>
                      <td className="fi-r fi-count-val">
                        {formatCount(row.count)}
                      </td>
                      <td className="fi-r fi-muted">
                        {formatCurrency(row.avg_bill, 2)}
                      </td>
                      <td className="fi-r fi-muted">
                        {formatCurrency(row.avg_savings, 2)}
                      </td>
                    </tr>
                  )}
                />
              </div>
              <div className="fi-card fi-card--spaced">
                <div className="fi-card-title">
                  General activity by city
                  <span className="fi-card-title-hint">All features</span>
                </div>
                <div className="fi-chart-wrap fi-chart-wrap--220">
                  {data.byCity.length ? (
                    <Bar data={cityChartData} options={barOptions(false)} />
                  ) : (
                    <p className="fi-muted fi-chart-empty">No city data</p>
                  )}
                </div>
              </div>
            </>
          )}

          {showConcierge && (
            <>
              <p className="fi-section-label">FareVet Concierge</p>
              <div className="fi-card fi-card--spaced">
                <div className="fi-card-title">Concierge quote requests</div>
                <p className="fi-card-caption">
                  Individual quote submissions (procedure, budget, vet location,
                  status) are managed in the Quotes admin page. Activity counts
                  above reflect concierge feature usage for the selected
                  filters.
                </p>
                <Link className="fi-card-title-link" to="/quotes">
                  Open Quotes admin →
                </Link>
              </div>
              <div className="fi-card">
                <div className="fi-card-title">Daily activity trend</div>
                <div className="fi-chart-wrap fi-chart-wrap--220">
                  {data.dailyTrend.length ? (
                    <Line data={trendChartData} options={lineTrendOptions} />
                  ) : (
                    <p className="fi-muted fi-chart-empty">No trend data</p>
                  )}
                </div>
              </div>
            </>
          )}

          {showOverview && (
            <>
          <p className="fi-section-label">Platform overview</p>

          <div className="fi-grid-2">
            <div className="fi-card">
              <div className="fi-card-title">Premium, free &amp; members</div>
              <div className="fi-chart-wrap fi-chart-wrap--180">
                {accountTypeBreakdown.total ? (
                  <Doughnut
                    data={accountChartData}
                    options={doughnutOptions}
                  />
                ) : (
                  <p className="fi-muted fi-chart-empty">
                    No activity for current filters
                  </p>
                )}
              </div>
              <div className="fi-table-wrap fi-account-type-table">
                <table className="fi-table fi-table--dense">
                  <thead>
                    <tr>
                      <th>Account type</th>
                      <th className="fi-r">Activity</th>
                      <th className="fi-r">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountTypeBreakdown.segments.map((seg) => (
                      <tr key={seg.key}>
                        <td>
                          <span className="fi-legend-item">
                            <span
                              className="fi-legend-dot"
                              style={{ background: seg.color }}
                            />
                            {seg.label}
                          </span>
                        </td>
                        <td className="fi-r fi-count-val">
                          {formatCount(seg.activity)}
                        </td>
                        <td className="fi-r fi-muted">
                          {seg.pct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

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
                      style={{ background: SECONDARY }}
                    />
                    Cats {petTypeStats.catPct}%
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="fi-grid-2">
            <div className="fi-card">
              <div className="fi-card-title">Feature usage breakdown</div>
              <div className="fi-chart-wrap fi-chart-wrap--280">
                <Bar data={featureChartData} options={featureBarOptions} />
              </div>
            </div>

            <div className="fi-card">
              <div className="fi-card-title">Feature usage detail</div>
              <div className="fi-table-wrap">
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
                    {featureUsageRows.map((row) => {
                      const uses = Number(row?.uses) || 0;
                      const pct = featureUsesTotal
                        ? `${Math.round((uses / featureUsesTotal) * 100)}%`
                        : "0%";
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
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="fi-card">
            <div className="fi-card-title">Daily activity trend</div>
            <div className="fi-chart-wrap fi-chart-wrap--220">
              {data.dailyTrend.length ? (
                <Line data={trendChartData} options={lineTrendOptions} />
              ) : (
                <p className="fi-muted fi-chart-empty">No trend data</p>
              )}
            </div>
          </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default FarevetIntelligence;
