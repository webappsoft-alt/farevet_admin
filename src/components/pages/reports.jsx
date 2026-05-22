import React, { useState, useEffect } from "react";
import { Modal, message } from "antd";
import Select from "react-select";
import { apiRequest } from "../../api/auth_api";
import { logofarevet } from "../icons/icon";
import "./reports.scss";
import Spinner from "../Spinner";

// Helper to parse database representations (0/1, true/false) into strict boolean values
const parseDbBoolean = (val) => {
  if (val === 1 || val === "1" || val === true || String(val).toLowerCase() === "true") {
    return true;
  }
  return false;
};

// Map database columns to local state keys
const mapApiPartnerToReact = (p) => {
  return {
    id: parseInt(p.id),
    name: p.partner_name || "",
    type: p.partner_type || "Pet Insurance",
    status: p.status || "Pending",
    members: parseInt(p.total_members) || 0,
    activeMembers: p.status === "Active" ? Math.round((parseInt(p.total_members) || 0) * 0.84) : 0,
    billing: parseFloat(p.monthly_billing) || 0,
    mrrRate: parseFloat(p.mrr_rate) || 1.2,
    partnerSince: p.partner_since || "May 2026",
    threshold: parseInt(p.threshold) || 500,
    email: p.contact_email || "",
    features: {
      costSearch: parseDbBoolean(p.feature_cost_search),
      billExplainer: parseDbBoolean(p.feature_bill_explainer),
      farevetAi: parseDbBoolean(p.feature_farevet_ai),
      medComparison: parseDbBoolean(p.feature_medication_comp),
      insuranceSavings: parseDbBoolean(p.feature_insurance_savings),
    }
  };
};

const mapApiHistoryToReact = (h) => {
  return {
    id: parseInt(h.id),
    partnerName: h.partner_name || "",
    quarter: h.quarter || "",
    sentDate: h.sent_date || "",
    pages: parseInt(h.pages) || 8,
    status: h.status || "Sent",
    pdfData: h.pdf_data || "{}"
  };
};

const selectStyles = {
  control: (baseStyles, state) => ({
    ...baseStyles,
    borderColor: state.isFocused ? "#8930F9" : "#E8E8F0",
    boxShadow: state.isFocused ? "0 0 0 1px #8930F9" : "none",
    borderRadius: "8px",
    padding: "3px 0",
    fontSize: "12px",
    fontFamily: "'Inter', sans-serif",
    fontWeight: "500",
    color: "#1A1A2E",
    background: "#FFFFFF",
    minHeight: "38px",
    "&:hover": {
      borderColor: state.isFocused ? "#8930F9" : "#9B9BB5",
    }
  }),
  option: (baseStyles, state) => ({
    ...baseStyles,
    backgroundColor: state.isSelected
      ? "#8930F9"
      : (state.isFocused ? "#F3E8FF" : "transparent"),
    color: state.isSelected ? "#FFFFFF" : "#1A1A2E",
    fontSize: "12px",
    fontFamily: "'Inter', sans-serif",
    cursor: "pointer",
    "&:active": {
      backgroundColor: "#8930F9",
    }
  }),
  singleValue: (baseStyles) => ({
    ...baseStyles,
    color: "#1A1A2E",
  }),
};

const Reports = () => {
  const [partners, setPartners] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Selection State
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState("Q1 2026");

  // Dynamic report state (keeps track of whether selected partner/quarter has a report generated, and its status)
  const [currentReportStatus, setCurrentReportStatus] = useState("Draft"); // Draft or Sent or None

  // PDF Preview Dialog State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fetchHistory = async () => {
    const body = new FormData();
    body.append("type", "get_list");
    body.append("table_name", "intelligence_reports");
    try {
      const res = await apiRequest({ body });
      if (res && res.data && res.data.length > 0) {
        const mapped = res.data.map(mapApiHistoryToReact);
        setHistory(mapped);
      } else {
        setHistory([]);
      }
    } catch (e) {
      console.error("API error loading reports history:", e);
    }
  };

  // Load partners and report history in parallel
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      // 1. Fetch Partners
      const partnerBody = new FormData();
      partnerBody.append("type", "get_list");
      partnerBody.append("table_name", "partner");

      let fetchedPartners = [];
      try {
        const res = await apiRequest({ body: partnerBody });
        if (res && res.data && res.data.length > 0) {
          fetchedPartners = res.data.map(mapApiPartnerToReact);
          setPartners(fetchedPartners);
          setSelectedPartnerId(String(fetchedPartners[0].id));
        }
      } catch (e) {
        console.error("API error loading B2B partners:", e);
        message.error("Failed to load B2B partners from database");
      }

      // 2. Fetch History
      const historyBody = new FormData();
      historyBody.append("type", "get_list");
      historyBody.append("table_name", "intelligence_reports");
      try {
        const res = await apiRequest({ body: historyBody });
        if (res && res.data && res.data.length > 0) {
          const mapped = res.data.map(mapApiHistoryToReact);
          setHistory(mapped);

          // Sync active status for first selected partner
          if (fetchedPartners.length > 0) {
            const firstPartner = fetchedPartners[0];
            const found = mapped.find(h => h.partnerName === firstPartner.name && h.quarter === selectedQuarter);
            setCurrentReportStatus(found ? found.status : "Draft");
          }
        } else {
          setHistory([]);
          setCurrentReportStatus("Draft");
        }
      } catch (e) {
        console.error("API error loading reports history:", e);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Find currently selected partner object
  const currentPartner = partners.find((p) => String(p.id) === String(selectedPartnerId)) || partners[0] || null;

  // Dynamically compute report metadata based on selected partner
  const getPartnerMetadata = (partner) => {
    if (!partner) return { readiness: "0%", anomalies: "Ready", pageCount: 8 };

    // Anomaly Alerts
    let anomalies = "Ready";
    if (partner.name === "Trupanion") anomalies = "2 flagged";
    else if (partner.name === "Pawp") anomalies = "1 flagged";

    // Readiness
    const threshold = partner.threshold || 500;
    const members = partner.members || 0;
    const pct = Math.min(100, Math.round((members / threshold) * 100));

    // Page count based on membership
    const pageCount = partner.members > 200 ? 12 : 8;

    return {
      readiness: `${pct}%`,
      anomalies,
      pageCount,
    };
  };

  const metadata = getPartnerMetadata(currentPartner);

  // react-select options
  const partnerOptions = partners.map((p) => ({
    value: String(p.id),
    label: `${p.name} ${p.status === "Pending" ? "(Pending)" : ""}`,
  }));
  const currentPartnerOption = partnerOptions.find((opt) => opt.value === String(selectedPartnerId)) || null;

  const quarterOptions = [
    { value: "Q1 2026", label: "Q1 2026 (Jan–Mar)" },
    { value: "Q4 2025", label: "Q4 2025 (Oct–Dec)" },
    { value: "Q3 2025", label: "Q3 2025 (Jul–Sep)" },
  ];
  const currentQuarterOption = quarterOptions.find((opt) => opt.value === selectedQuarter) || quarterOptions[0];

  // Handle Generate Report click - immediately save as pending to database
  const handleGenerateReport = async () => {
    if (!currentPartner) {
      message.error("Please select a valid partner first!");
      return;
    }

    // Check if this report is already in history
    const existingReport = history.find(
      (h) => h.partnerName === currentPartner.name && h.quarter === selectedQuarter
    );

    if (existingReport) {
      if (existingReport.status === "pending") {
        setCurrentReportStatus("pending");
        message.info("PDF report is already generated as pending in history.");
        return;
      }
      message.warning(`A report for ${currentPartner.name} ${selectedQuarter} is already in history (${existingReport.status}).`);
      return;
    }

    const date = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const sentDateStr = `${months[date.getMonth()]} ${date.getDate()}`;

    const body = new FormData();
    body.append("type", "add_data");
    body.append("table_name", "intelligence_reports");
    body.append("partner_name", currentPartner.name);
    body.append("quarter", selectedQuarter);
    body.append("pages", metadata.pageCount);
    body.append("pdf_data", JSON.stringify(currentPartner)); // pdf_Data > data store in stringify of partner
    body.append("sent_date", sentDateStr);
    body.append("status", "pending"); // pending by default

    try {
      const res = await apiRequest({ body });
      if (res && res.result) {
        message.success(`PDF report draft successfully compiled and saved as pending in history!`);
        fetchHistory();
        setCurrentReportStatus("pending");
      } else {
        message.error("Failed to generate report in database");
      }
    } catch (e) {
      console.error("API error generating B2B report:", e);
      message.error("Failed to generate B2B report");
    }
  };

  // Handle Send Report click - updates pending report to sent
  const handleSendReport = async () => {
    if (!currentPartner) {
      message.error("Please select a B2B partner first!");
      return;
    }

    // Find the pending report in history
    const pendingReport = history.find(
      (h) => h.partnerName === currentPartner.name && h.quarter === selectedQuarter && h.status === "pending"
    );

    if (!pendingReport) {
      message.error("Please generate the PDF report draft first!");
      return;
    }

    const date = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const sentDateStr = `${months[date.getMonth()]} ${date.getDate()}`;

    const body = new FormData();
    body.append("type", "update_data");
    body.append("table_name", "intelligence_reports");
    body.append("id", pendingReport.id);
    body.append("sent_date", sentDateStr);
    body.append("status", "sent"); // update from pending to sent!

    try {
      const res = await apiRequest({ body });
      if (res && res.result) {
        message.success(`Quarterly intelligence report successfully sent to B2B contact at ${currentPartner.email}!`);
        fetchHistory();
        setCurrentReportStatus("sent");
      } else {
        message.error("Failed to update report status in database");
      }
    } catch (e) {
      console.error("API error sending B2B report:", e);
      message.error("Failed to send B2B report");
    }
  };

  // Handle Download PDF natively using iframe printing preloaded with CSS styles
  const handleDownloadReport = (rep) => {
    message.loading(`Generating B2B PDF document for ${rep.partnerName} ${rep.quarter}...`, 1);

    setTimeout(() => {
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;

      // Calculate B2B partner data dynamically from stored stringified pdfData or active fallback
      let partner = null;
      try {
        if (rep.pdfData && rep.pdfData !== "{}") {
          partner = JSON.parse(rep.pdfData);
        }
      } catch (e) {
        console.error("Error parsing pdfData in download:", e);
      }

      if (partner) {
        partner = {
          name: partner.name || partner.partnerName || rep.partnerName,
          members: partner.members !== undefined ? partner.members : (partner.total_members !== undefined ? parseInt(partner.total_members) : 0),
          email: partner.email || partner.contact_email || "partnerships@farevet.com",
          threshold: partner.threshold !== undefined ? partner.threshold : 500,
          status: partner.status || "Active"
        };
      } else {
        partner = partners.find(p => p.name === rep.partnerName) || currentPartner || {
          name: rep.partnerName,
          members: 0,
          email: "partnerships@farevet.com",
          threshold: 500,
          status: "Active"
        };
      }

      const threshold = partner.threshold || 500;
      let membersCount = partner.members || 0;
      let activeCount = partner.status === "Active" ? Math.round(membersCount * 0.84) : 0;

      let anomalyAlerts = "All partner network veterinary facilities operate within normal pricing tolerances. Rate compliance stands at 100%.";
      if (partner.name === "Trupanion") {
        anomalyAlerts = "⚠️ Outliers Flagged: 2 veterinary facilities in Seattle/Tacoma area reported rate spikes exceeding +30% for dental and surgical outpatient services.";
      } else if (partner.name === "Pawp") {
        anomalyAlerts = "⚠️ Outliers Flagged: 1 clinical facility in Southern Florida was flagged for charging diagnostic fees 50% above regional average.";
      }

      let totalSavings = Math.round(membersCount * 14.50);
      let readinessPct = Math.min(100, Math.round((membersCount / threshold) * 100));
      let partnerEmail = partner.email || "partnerships@farevet.com";

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>FareVet_B2B_Report_${rep.partnerName}_${rep.quarter.replace(" ", "_")}</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@700;800&display=swap" rel="stylesheet">
            <style>
              body {
                font-family: 'Inter', sans-serif;
                color: #2D3748;
                padding: 45px;
                font-size: 12px;
                line-height: 1.6;
                background: #ffffff;
              }
              .header-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 25px;
                border-bottom: 3px solid #8930F9;
                padding-bottom: 15px;
              }
              .logo-side {
                text-align: left;
                vertical-align: middle;
                padding-bottom: 15px;
              }
              .title-side {
                text-align: right;
                vertical-align: middle;
                padding-bottom: 15px;
              }
              .title-side h1 {
                font-family: 'Plus Jakarta Sans', sans-serif;
                font-size: 22px;
                font-weight: 800;
                color: #1A2744;
                margin: 0;
              }
              .title-side p {
                font-size: 10px;
                color: #8930F9;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin: 4px 0 0 0;
                font-weight: 700;
              }
              .meta-box {
                background: #F7FAFC;
                border: 1px solid #E2E8F0;
                border-radius: 8px;
                padding: 14px 18px;
                margin-bottom: 25px;
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
              }
              .meta-item {
                font-size: 11px;
              }
              .meta-lbl {
                color: #718096;
                font-weight: 600;
                text-transform: uppercase;
                font-size: 8px;
                letter-spacing: 0.5px;
              }
              .meta-val {
                color: #1A2744;
                font-weight: 600;
                font-size: 12px;
                margin-top: 2px;
              }
              h2 {
                font-family: 'Plus Jakarta Sans', sans-serif;
                font-size: 14px;
                font-weight: 700;
                color: #1A2744;
                margin-top: 25px;
                margin-bottom: 10px;
                border-bottom: 1px dashed #E2E8F0;
                padding-bottom: 6px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .stats-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 15px;
                margin: 15px 0 25px 0;
              }
              .stat-card {
                background: #ffffff;
                border: 1px solid #E2E8F0;
                border-radius: 8px;
                padding: 15px 12px;
                text-align: center;
                box-shadow: 0 1px 3px rgba(0,0,0,0.02);
              }
              .stat-lbl {
                font-size: 9px;
                color: #718096;
                text-transform: uppercase;
                font-weight: 600;
                letter-spacing: 0.5px;
                margin-bottom: 4px;
              }
              .stat-val {
                font-family: 'Plus Jakarta Sans', sans-serif;
                font-size: 20px;
                font-weight: 700;
                color: #1A2744;
              }
              .progress-bar-track {
                background: #E2E8F0;
                height: 8px;
                border-radius: 4px;
                width: 100%;
                margin-top: 8px;
                overflow: hidden;
              }
              .progress-bar-fill {
                background: linear-gradient(90deg, #8930F9 0%, #6F20D3 100%);
                height: 100%;
                width: ${readinessPct}%;
                border-radius: 4px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
              }
              th {
                background: #EDF2F7;
                border-bottom: 2px solid #E2E8F0;
                padding: 10px;
                text-align: left;
                font-size: 10px;
                font-weight: 700;
                color: #4A5568;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              td {
                padding: 10px;
                border-bottom: 1px solid #E2E8F0;
                font-size: 11px;
                color: #2D3748;
              }
              tr:nth-child(even) {
                background: #F7FAFC;
              }
              .text-green { color: #38A169; font-weight: 700; }
              .text-red {
                color: #E53E3E;
                font-weight: 600;
                background: #FFF5F5;
                border: 1px solid #FED7D7;
                border-radius: 6px;
                padding: 10px 14px;
                margin-top: 8px;
              }
              .alert-green {
                color: #2F855A;
                background: #F0FFF4;
                border: 1px solid #C6F6D5;
                border-radius: 6px;
                padding: 10px 14px;
                margin-top: 8px;
              }
              .signature-section {
                margin-top: 50px;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                padding-top: 20px;
              }
              .signature-box {
                font-size: 10px;
              }
              .signature-line {
                border-bottom: 1px solid #A0AEC0;
                height: 45px;
                margin-bottom: 6px;
              }
              .signature-title {
                color: #718096;
                text-transform: uppercase;
                font-weight: 600;
                letter-spacing: 0.5px;
              }
              .footer-stamp {
                margin-top: 50px;
                border-top: 1px solid #E2E8F0;
                padding-top: 15px;
                text-align: center;
                font-size: 9px;
                color: #A0AEC0;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
            </style>
          </head>
          <body>
            <!-- Professional Official Logo & Title Header -->
            <table class="header-table">
              <tr>
                <td class="logo-side" style="border: 0; padding: 0; vertical-align: middle;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${logofarevet}" alt="FareVet Logo" style="height: 38px; width: auto; object-fit: contain;" />
                    <div style="display: flex; flex-direction: column;">
                      <span style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 21px; color: #1A2744; line-height: 1.1;">FareVet</span>
                      <span style="font-family: 'Inter', sans-serif; font-weight: 600; font-size: 8px; color: #9B9BB5; letter-spacing: 1.8px; text-transform: uppercase; margin-top: 2px;">B2B Operations</span>
                    </div>
                  </div>
                </td>
                <td class="title-side" style="border: 0; padding: 0;">
                  <h1>INTELLIGENCE REPORT</h1>
                  <p>Quarterly B2B Analytics Desk</p>
                </td>
              </tr>
            </table>

            <!-- Dynamic Metadata Information Card -->
            <div class="meta-box">
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div class="meta-item">
                  <div class="meta-lbl">Client Account</div>
                  <div class="meta-val">${rep.partnerName} Corporation</div>
                </div>
                <div class="meta-item">
                  <div class="meta-lbl">Account Contact</div>
                  <div class="meta-val">${partnerEmail}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-lbl">Document Security</div>
                  <div class="meta-val" style="color: #E53E3E;">STRICTLY CONFIDENTIAL - B2B ONLY</div>
                </div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div class="meta-item">
                  <div class="meta-lbl">Reporting Period</div>
                  <div class="meta-val">${rep.quarter}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-lbl">Generation Date</div>
                  <div class="meta-val">${new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-lbl">Readiness Tier</div>
                  <div class="meta-val" style="color: #8930F9;">Tier 2 · Integration Ready</div>
                </div>
              </div>
            </div>
            
            <h2>1. Executive Summary</h2>
            <p>
              During ${rep.quarter}, associated B2B program members under the ${rep.partnerName} partnership demonstrated strong engagement with the FareVet cost comparison engine. Strategic analytics over the past 90 days show a significant increase in search traffic within regional hubs. Utilizing cost-transparency tools has empowered members to shift their clinic selections toward vetted, high-value practitioners.
            </p>
            
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-lbl">Associated Members</div>
                <div class="stat-val">
                  ${membersCount > 0 ? membersCount : "—"}
                  <div style="font-size: 9px; color: #38A169; font-weight: 600; margin-top: 4px;">
                    ● ${activeCount} Active Now
                  </div>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-lbl">Phase 2 Readiness</div>
                <div class="stat-val">
                  ${readinessPct}%
                  <div class="progress-bar-track">
                    <div class="progress-bar-fill"></div>
                  </div>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-lbl">Estimated B2B Savings</div>
                <div class="stat-val">$${totalSavings > 0 ? totalSavings.toLocaleString() : "0"}</div>
              </div>
            </div>

            <h2>2. Regional Price Variance & Optimization</h2>
            <p>
              Audits of typical veterinary procedure receipts reveal significant cost discrepancies within regional provider networks (averaging up to 45% price dispersion for identical medical items). Standardizing selections via FareVet ensures immediate cost optimization.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Procedure / Treatment Code</th>
                  <th>Average Network Cost</th>
                  <th>FareVet Fair-Price Limit</th>
                  <th>Net Savings Delta</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-weight: 600; color: #1A2744;">Dental Cleaning (Routine)</td>
                  <td>$680.00</td>
                  <td>$420.00</td>
                  <td class="text-green">-$260.00 (-38.2%)</td>
                </tr>
                <tr>
                  <td style="font-weight: 600; color: #1A2744;">X-Ray & Diagnostic Imaging</td>
                  <td>$410.00</td>
                  <td>$290.00</td>
                  <td class="text-green">-$120.00 (-29.2%)</td>
                </tr>
                <tr>
                  <td style="font-weight: 600; color: #1A2744;">Spay / Neuter Surgery</td>
                  <td>$540.00</td>
                  <td>$350.00</td>
                  <td class="text-green">-$190.00 (-35.1%)</td>
                </tr>
              </tbody>
            </table>

            <h2>3. Rate Compliance & Anomaly Flags</h2>
            <div class="${rep.partnerName === "Trupanion" || rep.partnerName === "Pawp" ? "text-red" : "alert-green"}">
              ${anomalyAlerts}
            </div>

            <h2>4. Partnership Authorizations</h2>
            <p>
              Current B2B integration settings allow all members full access to FareVet Cost Search, Savings Metrics, and the AI Vet Assistant. 
            </p>

            <!-- Official Sign-off Signature blocks -->
            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-title">Authorized By: Pietro</div>
                <div style="color: #718096; font-size: 9px; margin-top: 2px;">FareVet Operations Manager</div>
              </div>
              <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-title">Received By: B2B partner representative</div>
                <div style="color: #718096; font-size: 9px; margin-top: 2px;">Corporate Accounts Director</div>
              </div>
            </div>

            <!-- Footer Stamps and Security levels -->
            <div class="footer-stamp">
              FareVet B2B Analytics · SECURE PAPERLESS INTELLIGENCE · POWERED BY FAREVET INC.
            </div>

            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      doc.close();

      // Clean up the iframe after a short delay
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1500);

      message.success(`PDF print-to-file dialog launched for ${rep.partnerName} ${rep.quarter}!`);
    }, 1000);
  };

  // Handle Resend simulation and update database sent_date
  const handleResendReport = async (rep) => {
    const date = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const sentDateStr = `${months[date.getMonth()]} ${date.getDate()}`;

    const body = new FormData();
    body.append("type", "update_data");
    body.append("table_name", "intelligence_reports");
    body.append("id", rep.id);
    body.append("sent_date", sentDateStr);
    body.append("status", "resent");

    try {
      const res = await apiRequest({ body });
      if (res && res.result) {
        message.success(`Resending ${rep.quarter} report directly to B2B contact... Done!`);
        fetchHistory();
        if (rep.partnerName === currentPartner?.name && rep.quarter === selectedQuarter) {
          setCurrentReportStatus("resent");
        }
      } else {
        message.error("Failed to update resent date in database");
      }
    } catch (e) {
      console.error("API error resending B2B report:", e);
      message.error("Failed to update resent date in database");
    }
  };

  // Handle Send Now (for pending reports inside history list)
  const handleSendNowReport = async (rep) => {
    const date = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const sentDateStr = `${months[date.getMonth()]} ${date.getDate()}`;

    const body = new FormData();
    body.append("type", "update_data");
    body.append("table_name", "intelligence_reports");
    body.append("id", rep.id);
    body.append("sent_date", sentDateStr);
    body.append("status", "sent"); // update to sent!

    try {
      const res = await apiRequest({ body });
      if (res && res.result) {
        message.success("Quarterly intelligence report successfully sent to B2B contact!");
        fetchHistory();
        if (rep.partnerName === currentPartner?.name && rep.quarter === selectedQuarter) {
          setCurrentReportStatus("sent");
        }
      } else {
        message.error("Failed to send report");
      }
    } catch (e) {
      console.error("API error sending report from history:", e);
      message.error("Failed to send report");
    }
  };

  if (loading) {
    return (
      <main className="reports-page" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "16px" }}>
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ padding: "2rem" }}
        >
          <Spinner size={18} />
          <span
            className="plusJakara_regular"
            style={{ marginLeft: "0.5rem", color: "#6c757d" }}
          >
            Loading B2B reports and partners...
          </span>
        </div>
      </main>
    );
  }

  if (partners.length === 0) {
    return (
      <main className="reports-page">
        {/* Top Page Header */}
        <div className="page-hdr">
          <div>
            <div className="page-title">Intelligence Reports</div>
            <div className="page-sub">Generate and send quarterly data reports to partners.</div>
          </div>
        </div>

        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFFFF",
          border: "1px dashed var(--border)",
          borderRadius: "12px",
          padding: "80px 40px",
          textAlign: "center",
          marginTop: "20px"
        }}>
          <div style={{ fontSize: "18px", fontWeight: "700", color: "var(--ink)", marginBottom: "8px" }}>
            No B2B Partners Found
          </div>
          <div style={{ fontSize: "13px", color: "var(--ink3)", maxWidth: "420px", lineHeight: "1.6" }}>
            To generate and view quarterly B2B intelligence reports, please create B2B partner accounts first in the B2B Partners management panel.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="reports-page">
      {/* Top Page Header */}
      <div className="page-hdr">
        <div>
          <div className="page-title">Intelligence Reports</div>
          <div className="page-sub">Generate and send quarterly data reports to partners.</div>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="two-col">
        {/* Left Column: Generate Form & History */}
        <div>
          {/* Generate new report Card */}
          <div className="card">
            <div className="ph">
              <div className="pt">Generate new report</div>
            </div>
            <div className="pb">
              {/* Partner Dropdown */}
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--ink3)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Partner
                </div>
                <Select
                  options={partnerOptions}
                  value={currentPartnerOption}
                  styles={selectStyles}
                  onChange={(opt) => {
                    setSelectedPartnerId(opt.value);
                    // Check if already in history
                    const partnerName = partners.find(p => String(p.id) === String(opt.value))?.name;
                    const found = history.find(h => h.partnerName === partnerName && h.quarter === selectedQuarter);
                    setCurrentReportStatus(found ? found.status : "Draft");
                  }}
                />
              </div>

              {/* Quarter Dropdown */}
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--ink3)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Quarter
                </div>
                <Select
                  options={quarterOptions}
                  value={currentQuarterOption}
                  styles={selectStyles}
                  onChange={(opt) => {
                    setSelectedQuarter(opt.value);
                    // Check if already in history
                    const found = history.find(h => h.partnerName === currentPartner.name && h.quarter === opt.value);
                    setCurrentReportStatus(found ? found.status : "Draft");
                  }}
                />
              </div>

              <div style={{ fontSize: "11px", color: "var(--ink3)", marginBottom: "14px", lineHeight: "1.6" }}>
                Report will include: regional price trends · member engagement · top procedures · anomaly alerts · Phase 2 readiness score
              </div>

              <button
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={handleGenerateReport}
              >
                Generate PDF report
              </button>
            </div>
          </div>

          {/* Report History Card */}
          <div className="card">
            <div className="ph">
              <div className="pt">Report history</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {history.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--ink3)" }}>
                  No reports sent yet
                </div>
              ) : (
                history.map((rep) => (
                  <div key={rep.id} className="report-card" style={{ margin: "10px 16px" }}>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--ink)" }}>
                        {rep.partnerName} · {rep.quarter}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--ink3)" }}>
                        Sent {rep.sentDate} · {rep.pages} pages · <span style={{ textTransform: "capitalize", fontWeight: "600", color: rep.status === "resent" ? "#8930F9" : (rep.status === "sent" ? "#2E7D32" : "#ED6C02") }}>{rep.status}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDownloadReport(rep)}
                      >
                        Download
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          if (rep.status === "pending") {
                            handleSendNowReport(rep);
                          } else {
                            handleResendReport(rep);
                          }
                        }}
                        style={{
                          backgroundColor: rep.status === "pending" ? "#2E7D32" : "#8930F9",
                          borderColor: rep.status === "pending" ? "#2E7D32" : "#8930F9"
                        }}
                      >
                        {rep.status === "pending" ? "Send Now" : "Resend"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Report Preview */}
        <div>
          <div className="card" id="reportPreview">
            <div className="ph">
              <div className="pt">
                Report preview — {currentPartner.name} {selectedQuarter}
              </div>
              <span className={`tag ${(currentReportStatus === "sent" || currentReportStatus === "resent") ? "tg-g" : "tg-a"}`}>
                {currentReportStatus === "sent" ? "Sent" : (currentReportStatus === "resent" ? "Resent" : "Draft")}
              </span>
            </div>

            <div className="pb">
              <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--ink3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
                Contents
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {/* Contents Rows */}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <span>1. Executive summary</span>
                  <span className="tag tg-g">Ready</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <span>2. Regional price trends</span>
                  <span className="tag tg-g">Ready</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <span>3. Member engagement</span>
                  <span className="tag tg-g">Ready</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <span>4. Top 10 procedures</span>
                  <span className="tag tg-g">Ready</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <span>5. Anomaly alerts</span>
                  <span className={`tag ${metadata.anomalies === "Ready" ? "tg-g" : "tg-a"}`}>
                    {metadata.anomalies}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "8px 0" }}>
                  <span>6. Phase 2 readiness</span>
                  <span className="tag tg-a">{metadata.readiness}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                <button
                  className="btn btn-ghost"
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={() => setIsPreviewOpen(true)}
                >
                  Preview
                </button>
                <button
                  className="btn btn-green"
                  disabled={currentReportStatus === "sent" || currentReportStatus === "resent"}
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={handleSendReport}
                >
                  {currentReportStatus === "sent" ? "Sent ✓" : (currentReportStatus === "resent" ? "Resent ✓" : `Send to ${currentPartner.name}`)}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Immersive PDF Preview Modal */}
      <Modal
        title={`PDF Document Preview: ${currentPartner.name} B2B Intelligence (${selectedQuarter})`}
        open={isPreviewOpen}
        zIndex={9999}
        onCancel={() => setIsPreviewOpen(false)}
        footer={[
          <button key="close" className="btn btn-ghost btn-sm" style={{ marginRight: "8px" }} onClick={() => setIsPreviewOpen(false)}>
            Close Preview
          </button>,
          <button
            key="download"
            className="btn btn-primary btn-sm"
            style={{ marginRight: "8px" }}
            onClick={() => {
              handleDownloadReport({
                partnerName: currentPartner.name,
                quarter: selectedQuarter,
                pages: metadata.pageCount,
              });
            }}
          >
            Download PDF
          </button>,
          <button
            key="send"
            className="btn btn-green btn-sm"
            disabled={currentReportStatus === "sent" || currentReportStatus === "resent"}
            onClick={() => {
              handleSendReport();
              setIsPreviewOpen(false);
            }}
          >
            {currentReportStatus === "sent" ? "Already Sent" : (currentReportStatus === "resent" ? "Already Resent" : "Send Report")}
          </button>
        ]}
        className="premium-preview-overlay"
        centered
        width={650}
      >
        <div style={{
          maxHeight: "60vh",
          overflowY: "auto",
          padding: "16px 8px",
          fontFamily: "Inter, sans-serif"
        }}>
          {/* Header section in PDF mockup */}
          <div style={{
            textAlign: "center",
            borderBottom: "2px solid #8930F9",
            paddingBottom: "12px",
            marginBottom: "20px"
          }}>
            <h2 style={{ fontFamily: "Plus Jakarta Sans, sans-serif", fontWeight: 800, color: "#1A2744", margin: 0 }}>
              FareVet Intelligence Report
            </h2>
            <p style={{ fontSize: "11px", color: "#9B9BB5", textTransform: "uppercase", letterSpacing: "1px", margin: "4px 0 0 0" }}>
              Quarterly B2B Analytics · {selectedQuarter} · {currentPartner.name} Partnership
            </p>
          </div>

          {/* Section 1: Executive Summary */}
          <div className="preview-section">
            <h4>1. Executive Summary <span className="tag tg-g" style={{ fontStyle: "normal" }}>Ready</span></h4>
            <p>
              During {selectedQuarter}, members associated with the {currentPartner.name} program demonstrated strong engagement on the FareVet platform. Over the past 90 days, search volume in major metropolitan regions increased. Cost transparency analysis reveals key shifts in consumer choice toward vetted, high-value vet clinics.
            </p>
            <div className="preview-stats-row">
              <div className="preview-stat-item">
                <div className="preview-lbl">Associated Members</div>
                <div className="preview-val">{currentPartner.members}</div>
              </div>
              <div className="preview-stat-item">
                <div className="preview-lbl">Phase 2 Readiness</div>
                <div className="preview-val">{metadata.readiness}</div>
              </div>
              <div className="preview-stat-item">
                <div className="preview-lbl">Estimated Savings</div>
                <div className="preview-val">${Math.round(currentPartner.members * 14.50)}</div>
              </div>
            </div>
          </div>

          {/* Section 2: Regional Price Trends */}
          <div className="preview-section">
            <h4>2. Regional Price Trends <span className="tag tg-g">Ready</span></h4>
            <p>
              Analysis of service transactions and user queries in major regional clusters highlights a variance of up to 45% in standard procedures (e.g. Dental Cleaning, Cruciate Repair) between adjacent veterinary facilities.
            </p>
            <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse", marginTop: "8px" }}>
              <thead>
                <tr style={{ background: "#F4F5F7", borderBottom: "1px solid #E8E8F0" }}>
                  <th style={{ padding: "6px", textAlign: "left" }}>Procedure</th>
                  <th style={{ padding: "6px", textAlign: "right" }}>Average Cost</th>
                  <th style={{ padding: "6px", textAlign: "right" }}>Fair Price Max</th>
                  <th style={{ padding: "6px", textAlign: "right" }}>Savings Delta</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #E8E8F0" }}>
                  <td style={{ padding: "6px" }}>Dental Cleaning</td>
                  <td style={{ padding: "6px", textAlign: "right" }}>$680</td>
                  <td style={{ padding: "6px", textAlign: "right" }}>$420</td>
                  <td style={{ padding: "6px", textTransform: "bold", color: "var(--green)", textAlign: "right" }}>-$260</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #E8E8F0" }}>
                  <td style={{ padding: "6px" }}>X-Ray & Imaging</td>
                  <td style={{ padding: "6px", textAlign: "right" }}>$410</td>
                  <td style={{ padding: "6px", textAlign: "right" }}>$290</td>
                  <td style={{ padding: "6px", textTransform: "bold", color: "var(--green)", textAlign: "right" }}>-$120</td>
                </tr>
                <tr>
                  <td style={{ padding: "6px" }}>Spay / Neuter Surgery</td>
                  <td style={{ padding: "6px", textAlign: "right" }}>$540</td>
                  <td style={{ padding: "6px", textAlign: "right" }}>$350</td>
                  <td style={{ padding: "6px", textTransform: "bold", color: "var(--green)", textAlign: "right" }}>-$190</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 3: Anomaly Alerts */}
          <div className="preview-section">
            <h4>3. Anomaly Alerts & Compliance <span className={`tag ${metadata.anomalies === "Ready" ? "tg-g" : "tg-a"}`}>{metadata.anomalies}</span></h4>
            {currentPartner.name === "Trupanion" ? (
              <p style={{ color: "#E74C3C", fontWeight: 500 }}>
                ⚠️ 2 clinics in the Pacific Northwest have reported billing spikes exceeding 30% for routine outpatient surgeries. FareVet has automatically flagged these listings in our system.
              </p>
            ) : currentPartner.name === "Pawp" ? (
              <p style={{ color: "#E74C3C", fontWeight: 500 }}>
                ⚠️ 1 clinic in Southern Florida was flagged for charging diagnostic fees exceeding regional averages by 50%. Outlier investigation is currently in review.
              </p>
            ) : (
              <p>
                No abnormal price surges or billing compliance outliers were recorded among partner member clinics in this quarter. Excellent rate stability.
              </p>
            )}
          </div>
        </div>
      </Modal>
    </main>
  );
};

export default Reports;
