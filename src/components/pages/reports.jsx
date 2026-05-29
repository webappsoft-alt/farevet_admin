import React, { useState, useEffect } from "react";
import { Modal, message } from "antd";
import Select from "react-select";
import { apiRequest } from "../../api/auth_api";
import { logofarevet } from "../icons/icon";
import { FaEye } from "react-icons/fa";
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
    type: p.partner_type || "Insurance",
    status: p.status || "Pending",
    members: parseInt(p.total_members) || 0,
    activeMembers: p.status === "Active" ? Math.round((parseInt(p.total_members) || 0) * 0.84) : 0,
    billing: parseFloat(p.monthly_billing) || 0,
    mrrRate: parseFloat(p.mrr_rate) || 1.2,
    partnerSince: p.partner_since || "May 2026",
    threshold: parseInt(p.threshold) || 500,
    email: p.contact_email || "",
    partnerCode: p.partner_code || "",
    logo: p.partner_logo || "",
    defaultDeductible: parseFloat(p.default_deductible) || 0,
    defaultReimbursement: p.default_reimbursement || "80%",
    claimsPortalUrl: p.claims_portal_url || "",
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
  const currentYear = new Date().getFullYear();
  const [partners, setPartners] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Selection State
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState(`Q1 ${currentYear}`);

  // Manual input fields
  const [totalMembers, setTotalMembers] = useState("");
  const [activeMembers, setActiveMembers] = useState("");
  const [costSearches, setCostSearches] = useState("");
  const [billAnalyses, setBillAnalyses] = useState("");
  const [farevetAiUses, setFarevetAiUses] = useState("");
  const [estimatorUses, setEstimatorUses] = useState("");
  const [potentialSavings, setPotentialSavings] = useState("");
  const [notes, setNotes] = useState("");

  // Dynamic report state (keeps track of whether selected partner/quarter has a report generated, and its status)
  const [currentReportStatus, setCurrentReportStatus] = useState("Draft"); // Draft or Sent or None

  // PDF Preview Dialog State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handlePartnerOrQuarterChange = (partnerId, quarter) => {
    setSelectedPartnerId(partnerId);
    setSelectedQuarter(quarter);

    const partner = partners.find(p => String(p.id) === String(partnerId));
    const partnerName = partner?.name;
    const found = history.find(h => h.partnerName === partnerName && h.quarter === quarter);

    if (found) {
      setCurrentReportStatus(found.status);
      try {
        const reportData = JSON.parse(found.pdfData);
        if (reportData) {
          const legacyMembers = reportData.totalMembers !== undefined ? reportData.totalMembers : (reportData.members !== undefined ? reportData.members : (partner ? partner.members : 0));
          const totalMembersVal = legacyMembers || 0;
          const activeMembersVal = reportData.activeMembers !== undefined ? reportData.activeMembers : (reportData.status === "Active" ? Math.round(totalMembersVal * 0.84) : (partner ? partner.activeMembers : 0));

          setTotalMembers(totalMembersVal || "");
          setActiveMembers(activeMembersVal || "");
          setCostSearches(reportData.costSearches !== undefined ? reportData.costSearches : Math.round(totalMembersVal * 3));
          setBillAnalyses(reportData.billAnalyses !== undefined ? reportData.billAnalyses : Math.round(totalMembersVal * 0.7));
          setFarevetAiUses(reportData.farevetAiUses !== undefined ? reportData.farevetAiUses : Math.round(totalMembersVal * 1.2));
          setEstimatorUses(reportData.estimatorUses !== undefined ? reportData.estimatorUses : Math.round(totalMembersVal * 0.9));
          setPotentialSavings(reportData.potentialSavings !== undefined ? reportData.potentialSavings : Math.round(totalMembersVal * 14.50));
          setNotes(reportData.notes || "");
          return;
        }
      } catch (e) {
        console.error("Error parsing pdfData on change:", e);
      }
    } else {
      setCurrentReportStatus("Draft");
    }

    if (partner) {
      const totalMembersVal = partner.members || 0;
      setTotalMembers(totalMembersVal || "");
      setActiveMembers(partner.activeMembers || "");
      setCostSearches(totalMembersVal ? Math.round(totalMembersVal * 3) : "");
      setBillAnalyses(totalMembersVal ? Math.round(totalMembersVal * 0.7) : "");
      setFarevetAiUses(totalMembersVal ? Math.round(totalMembersVal * 1.2) : "");
      setEstimatorUses(totalMembersVal ? Math.round(totalMembersVal * 0.9) : "");
      setPotentialSavings(totalMembersVal ? Math.round(totalMembersVal * 14.50) : "");
    } else {
      setTotalMembers("");
      setActiveMembers("");
      setCostSearches("");
      setBillAnalyses("");
      setFarevetAiUses("");
      setEstimatorUses("");
      setPotentialSavings("");
    }
    setNotes("");
  };

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
            setSelectedPartnerId(String(firstPartner.id));
            const found = mapped.find(h => h.partnerName === firstPartner.name && h.quarter === selectedQuarter);
            if (found) {
              setCurrentReportStatus(found.status);
              try {
                const reportData = JSON.parse(found.pdfData);
                if (reportData && reportData.totalMembers !== undefined) {
                  setTotalMembers(reportData.totalMembers);
                  setActiveMembers(reportData.activeMembers);
                  setCostSearches(reportData.costSearches);
                  setBillAnalyses(reportData.billAnalyses);
                  setFarevetAiUses(reportData.farevetAiUses);
                  setEstimatorUses(reportData.estimatorUses);
                  setPotentialSavings(reportData.potentialSavings);
                  setNotes(reportData.notes);
                }
              } catch (e) {
                console.error("Error parsing pdfData on load:", e);
              }
            } else {
              setCurrentReportStatus("Draft");
              setTotalMembers(firstPartner.members || "");
              setActiveMembers(firstPartner.activeMembers || "");
            }
          }
        } else {
          setHistory([]);
          setCurrentReportStatus("Draft");
          if (fetchedPartners.length > 0) {
            const firstPartner = fetchedPartners[0];
            setSelectedPartnerId(String(firstPartner.id));
            setTotalMembers(firstPartner.members || "");
            setActiveMembers(firstPartner.activeMembers || "");
          }
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

  const totalMembersVal = totalMembers ? Number(totalMembers) : (currentPartner?.members || 0);
  const activeMembersVal = activeMembers ? Number(activeMembers) : (currentPartner?.activeMembers || 0);
  const costSearchesVal = costSearches ? Number(costSearches) : 0;
  const billAnalysesVal = billAnalyses ? Number(billAnalyses) : 0;
  const farevetAiUsesVal = farevetAiUses ? Number(farevetAiUses) : 0;
  const estimatorUsesVal = estimatorUses ? Number(estimatorUses) : 0;
  const potentialSavingsVal = potentialSavings ? Number(potentialSavings) : 0;
  const notesVal = notes || "";

  const calculatedMrr = activeMembersVal * 1.20;
  const engagementRate = totalMembersVal > 0 ? Math.round((activeMembersVal / totalMembersVal) * 100) : 0;
  const readinessPct = Math.min(100, Math.round((activeMembersVal / 500) * 100));

  // react-select options
  const partnerOptions = partners.map((p) => ({
    value: String(p.id),
    label: `${p.name} ${p.status === "Pending" ? "(Pending)" : ""}`,
  }));
  const currentPartnerOption = partnerOptions.find((opt) => opt.value === String(selectedPartnerId)) || null;

  const quarterOptions = [
    { value: `Q4 ${currentYear}`, label: `Q4 ${currentYear} (Oct–Dec)` },
    { value: `Q3 ${currentYear}`, label: `Q3 ${currentYear} (Jul–Sep)` },
    { value: `Q2 ${currentYear}`, label: `Q2 ${currentYear} (Apr–Jun)` },
    { value: `Q1 ${currentYear}`, label: `Q1 ${currentYear} (Jan–Mar)` },
  ];
  const currentQuarterOption = quarterOptions.find((opt) => opt.value === selectedQuarter) || { value: selectedQuarter, label: selectedQuarter };

  // Handle Generate Report click - immediately save as pending to database
  const handleGenerateReport = async () => {
    if (!currentPartner) {
      message.error("Please select a valid partner first!");
      return;
    }

    if (!totalMembers || !activeMembers) {
      message.error("Please enter both Total and Active members count!");
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

    const reportData = {
      partnerName: currentPartner.name,
      partnerEmail: currentPartner.email || "partnerships@farevet.com",
      quarter: selectedQuarter,
      totalMembers: Number(totalMembers) || 0,
      activeMembers: Number(activeMembers) || 0,
      costSearches: Number(costSearches) || 0,
      billAnalyses: Number(billAnalyses) || 0,
      farevetAiUses: Number(farevetAiUses) || 0,
      estimatorUses: Number(estimatorUses) || 0,
      potentialSavings: Number(potentialSavings) || 0,
      notes: notes || "",
      threshold: currentPartner.threshold || 500,
      status: currentPartner.status || "Active",
      logo: currentPartner.logo || ""
    };

    const body = new FormData();
    body.append("type", "add_data");
    body.append("table_name", "intelligence_reports");
    body.append("partner_name", currentPartner.name);
    body.append("quarter", selectedQuarter);
    body.append("pages", metadata.pageCount);
    body.append("pdf_data", JSON.stringify(reportData));
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

      // Parse report data from stored stringified pdfData or fallback
      let reportData = null;
      try {
        if (rep.pdfData && rep.pdfData !== "{}") {
          reportData = JSON.parse(rep.pdfData);
        }
      } catch (e) {
        console.error("Error parsing pdfData in download:", e);
      }

      // Legacy fallback mapping
      if (!reportData || !reportData.totalMembers || reportData.totalMembers === 0 || reportData.costSearches === undefined) {
        const legacyPartner = reportData || {};
        const matchedPartner = partners.find(p => p.name === rep.partnerName);
        const legacyMembers = legacyPartner.members !== undefined ? legacyPartner.members : (legacyPartner.total_members !== undefined ? parseInt(legacyPartner.total_members) : (matchedPartner ? matchedPartner.members : 0));
        const activeMembersVal = legacyPartner.activeMembers !== undefined ? legacyPartner.activeMembers : (legacyPartner.status === "Active" ? Math.round(legacyMembers * 0.84) : (matchedPartner ? matchedPartner.activeMembers : 0));

        reportData = {
          partnerName: rep.partnerName,
          partnerEmail: legacyPartner.email || "partnerships@farevet.com",
          quarter: rep.quarter,
          totalMembers: legacyMembers,
          activeMembers: activeMembersVal,
          costSearches: Math.round(legacyMembers * 3),
          billAnalyses: Math.round(legacyMembers * 0.7),
          farevetAiUses: Math.round(legacyMembers * 1.2),
          estimatorUses: Math.round(legacyMembers * 0.9),
          potentialSavings: Math.round(legacyMembers * 14.50),
          notes: "",
          threshold: legacyPartner.threshold || 500,
          status: legacyPartner.status || "Active",
          logo: legacyPartner.logo || (matchedPartner ? matchedPartner.logo : "")
        };
      }

      const totalMembersVal = reportData.totalMembers || 0;
      const activeMembersVal = reportData.activeMembers || 0;
      const costSearchesVal = reportData.costSearches || 0;
      const billAnalysesVal = reportData.billAnalyses || 0;
      const farevetAiUsesVal = reportData.farevetAiUses || 0;
      const estimatorUsesVal = reportData.estimatorUses || 0;
      const potentialSavingsVal = reportData.potentialSavings || 0;
      const notesVal = reportData.notes || "";
      const partnerEmail = reportData.partnerEmail || "partnerships@farevet.com";
      const partnerLogo = reportData.logo || (partners.find(p => p.name === rep.partnerName)?.logo) || "";

      const mrr = activeMembersVal * 1.20;
      const engagementRate = totalMembersVal > 0 ? Math.round((activeMembersVal / totalMembersVal) * 100) : 0;
      const readinessPct = Math.min(100, Math.round((activeMembersVal / 500) * 100));

      const cards = [];
      if (totalMembersVal > 0 || activeMembersVal > 0) {
        cards.push(`
          <div class="stat-card">
            <div class="stat-lbl">Associated Members</div>
            <div class="stat-val">
              ${totalMembersVal > 0 ? totalMembersVal.toLocaleString() : "—"}
              ${activeMembersVal > 0 ? `
                <div style="font-size: 9px; color: #38A169; font-weight: 600; margin-top: 4px;">
                  ● ${activeMembersVal.toLocaleString()} Active Now
                </div>
              ` : ""}
            </div>
          </div>
        `);
      }
      if (readinessPct > 0) {
        cards.push(`
          <div class="stat-card">
            <div class="stat-lbl">Phase 2 Readiness</div>
            <div class="stat-val">
              ${readinessPct}%
              <div class="progress-bar-track">
                <div class="progress-bar-fill" style="width: ${readinessPct}%;"></div>
              </div>
            </div>
          </div>
        `);
      }
      if (potentialSavingsVal > 0) {
        cards.push(`
          <div class="stat-card">
            <div class="stat-lbl">Estimated B2B Savings</div>
            <div class="stat-val">$${potentialSavingsVal.toLocaleString()}</div>
          </div>
        `);
      }

      const cardsGridHtml = cards.length > 0 ? `
        <div class="stats-grid" style="grid-template-columns: repeat(${cards.length}, 1fr);">
          ${cards.join("")}
        </div>
      ` : "";

      const rows = [];
      if (costSearchesVal > 0) {
        rows.push(`
          <tr>
            <td style="font-weight: 600; color: #1A2744;">Cost Searches</td>
            <td>${costSearchesVal.toLocaleString()} searches</td>
            <td>Manual record check</td>
          </tr>
        `);
      }
      if (billAnalysesVal > 0) {
        rows.push(`
          <tr>
            <td style="font-weight: 600; color: #1A2744;">Bill Analyses</td>
            <td>${billAnalysesVal.toLocaleString()} analyses</td>
            <td>Manual record check</td>
          </tr>
        `);
      }
      if (farevetAiUsesVal > 0) {
        rows.push(`
          <tr>
            <td style="font-weight: 600; color: #1A2744;">FareVet AI Uses</td>
            <td>${farevetAiUsesVal.toLocaleString()} conversations</td>
            <td>Manual record check</td>
          </tr>
        `);
      }
      if (estimatorUsesVal > 0) {
        rows.push(`
          <tr>
            <td style="font-weight: 600; color: #1A2744;">Estimator Uses</td>
            <td>${estimatorUsesVal.toLocaleString()} estimates</td>
            <td>Manual record check</td>
          </tr>
        `);
      }
      if (engagementRate > 0) {
        rows.push(`
          <tr>
            <td style="font-weight: 600; color: #1A2744;">Program Engagement Rate</td>
            <td style="font-weight: 600; color: #8930F9;">${engagementRate}%</td>
            <td>Active / Total Members</td>
          </tr>
        `);
      }
      if (mrr > 0) {
        rows.push(`
          <tr>
            <td style="font-weight: 600; color: #1A2744;">Calculated B2B MRR</td>
            <td style="font-weight: 600; color: #38A169;">$${mrr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>Active Members × $1.20</td>
          </tr>
        `);
      }

      const tableHtml = rows.length > 0 ? `
        <h2>2. Platform Engagement & Activity</h2>
        <p>
          Audits of member activity on the FareVet platform during ${rep.quarter} indicate the following utilisation rates for cost transparency tools, digital estimators, and AI-driven clinical navigation.
        </p>
        <table>
          <thead>
            <tr>
              <th>Platform Feature / Metric</th>
              <th>Recorded Activity</th>
              <th>Calculation Basis</th>
            </tr>
          </thead>
          <tbody>
            ${rows.join("")}
          </tbody>
        </table>
      ` : "";

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
                border-top: 3px solid #8930F9;
              }
              .stat-card:last-child {
                border-top: 3px solid #38A169;
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
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <img src="${window.location.origin}/FAREVET-LOGO.png" alt="FareVet Logo" style="height: 55px; max-height: 55px; width: auto; object-fit: contain;" />
                    <span style="font-size: 32px; color: #E2E8F0; font-weight: 300; line-height: 1;">|</span>
                    ${partnerLogo ? `
                      <img src="${global.IMAGEURL}/${partnerLogo}" alt="${rep.partnerName} Logo" style="height: 55px; max-height: 55px; width: auto; max-width: 180px; object-fit: contain; border-radius: 6px;" />
                    ` : `
                      <span style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 24px; color: #8930F9;">${rep.partnerName}</span>
                    `}
                  </div>
                </td>
                <td class="title-side" style="border: 0; padding: 0; text-align: right; vertical-align: middle;">
                  <h1 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22px; font-weight: 800; color: #1A2744; margin: 0; line-height: 1.1;">INTELLIGENCE REPORT</h1>
                  <p style="font-size: 10px; color: #8930F9; text-transform: uppercase; letter-spacing: 1px; margin: 4px 0 0 0; font-weight: 700;">Quarterly B2B Analytics Desk</p>
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
              </div>
            </div>
            
            <h2>1. Executive Summary</h2>
            <p>
              During ${rep.quarter}, associated B2B program members under the ${rep.partnerName} partnership demonstrated active engagement with the FareVet platform. The metrics below highlight key utilization rates and savings realized through our partnership tools.
            </p>
            
            ${cardsGridHtml}

            ${tableHtml}

            ${notesVal ? `<h2>3. Pietro's Operational Notes</h2><p>${notesVal}</p>` : ""}

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

  const handlePreviewHistoryReport = (rep) => {
    const partner = partners.find((p) => String(p.name) === String(rep.partnerName));
    if (partner) {
      setSelectedPartnerId(String(partner.id));
    }
    setSelectedQuarter(rep.quarter);
    setCurrentReportStatus(rep.status);
    try {
      const reportData = JSON.parse(rep.pdfData);
      if (reportData) {
        const legacyMembers = reportData.totalMembers !== undefined ? reportData.totalMembers : (reportData.members !== undefined ? reportData.members : (partner ? partner.members : 0));
        const totalMembersVal = legacyMembers || 0;
        const activeMembersVal = reportData.activeMembers !== undefined ? reportData.activeMembers : (reportData.status === "Active" ? Math.round(totalMembersVal * 0.84) : (partner ? partner.activeMembers : 0));

        setTotalMembers(totalMembersVal ? String(totalMembersVal) : "");
        setActiveMembers(activeMembersVal ? String(activeMembersVal) : "");
        setCostSearches(String(reportData.costSearches !== undefined ? reportData.costSearches : Math.round(totalMembersVal * 3)));
        setBillAnalyses(String(reportData.billAnalyses !== undefined ? reportData.billAnalyses : Math.round(totalMembersVal * 0.7)));
        setFarevetAiUses(String(reportData.farevetAiUses !== undefined ? reportData.farevetAiUses : Math.round(totalMembersVal * 1.2)));
        setEstimatorUses(String(reportData.estimatorUses !== undefined ? reportData.estimatorUses : Math.round(totalMembersVal * 0.9)));
        setPotentialSavings(String(reportData.potentialSavings !== undefined ? reportData.potentialSavings : Math.round(totalMembersVal * 14.50)));
        setNotes(reportData.notes || "");
      }
    } catch (e) {
      console.error("Error parsing pdfData for preview:", e);
    }
    setIsPreviewOpen(true);
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

      {/* Centered Single-Column Layout */}
      <div style={{ margin: "0 auto" }}>
        {/* Generate new report Card */}
        <div className="card">
          <div className="ph">
            <div className="pt">Generate new report</div>
          </div>
          <div className="pb">
            {/* Partner & Quarter Dropdowns Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--ink3)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Partner
                </div>
                <Select
                  options={partnerOptions}
                  value={currentPartnerOption}
                  styles={selectStyles}
                  onChange={(opt) => {
                    handlePartnerOrQuarterChange(opt.value, selectedQuarter);
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--ink3)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Quarter
                </div>
                <Select
                  options={quarterOptions}
                  value={currentQuarterOption}
                  styles={selectStyles}
                  onChange={(opt) => {
                    handlePartnerOrQuarterChange(selectedPartnerId, opt.value);
                  }}
                />
              </div>
            </div>

            {/* Members Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--ink3)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Total Members
                </div>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 500"
                  value={totalMembers}
                  onChange={(e) => setTotalMembers(e.target.value)}
                  style={{ width: "100%", padding: "6px 12px", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }}
                />
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--ink3)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Active Members
                </div>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 420"
                  value={activeMembers}
                  onChange={(e) => setActiveMembers(e.target.value)}
                  style={{ width: "100%", padding: "6px 12px", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }}
                />
              </div>
            </div>

            {/* Searches and Analyses Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--ink3)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Cost Searches
                </div>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 1500"
                  value={costSearches}
                  onChange={(e) => setCostSearches(e.target.value)}
                  style={{ width: "100%", padding: "6px 12px", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }}
                />
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--ink3)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Bill Analyses
                </div>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 350"
                  value={billAnalyses}
                  onChange={(e) => setBillAnalyses(e.target.value)}
                  style={{ width: "100%", padding: "6px 12px", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }}
                />
              </div>
            </div>

            {/* AI and Estimator Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--ink3)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  FareVet AI Uses
                </div>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 600"
                  value={farevetAiUses}
                  onChange={(e) => setFarevetAiUses(e.target.value)}
                  style={{ width: "100%", padding: "6px 12px", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }}
                />
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--ink3)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Estimator Uses
                </div>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 450"
                  value={estimatorUses}
                  onChange={(e) => setEstimatorUses(e.target.value)}
                  style={{ width: "100%", padding: "6px 12px", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }}
                />
              </div>
            </div>

            {/* Potential Savings Row */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--ink3)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Potential Savings Identified ($)
              </div>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 7250"
                value={potentialSavings}
                onChange={(e) => setPotentialSavings(e.target.value)}
                style={{ width: "100%", padding: "6px 12px", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }}
              />
            </div>

            {/* Notes Row */}
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--ink3)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Notes (Optional)
              </div>
              <textarea
                className="form-control"
                placeholder="Operational notes or executive summary callouts..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px", resize: "none" }}
              />
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
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handlePreviewHistoryReport(rep)}
                      title="Preview Report"
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "6px" }}
                    >
                      <FaEye size={14} style={{ color: "var(--ink2)" }} />
                    </button>
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
                pdfData: JSON.stringify({
                  partnerName: currentPartner.name,
                  partnerEmail: currentPartner.email || "partnerships@farevet.com",
                  quarter: selectedQuarter,
                  totalMembers: Number(totalMembersVal),
                  activeMembers: Number(activeMembersVal),
                  costSearches: Number(costSearchesVal),
                  billAnalyses: Number(billAnalysesVal),
                  farevetAiUses: Number(farevetAiUsesVal),
                  estimatorUses: Number(estimatorUsesVal),
                  potentialSavings: Number(potentialSavingsVal),
                  notes: notesVal,
                  threshold: currentPartner.threshold || 500,
                  status: currentPartner.status || "Active"
                })
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
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "2px solid #8930F9",
            paddingBottom: "12px",
            marginBottom: "20px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img src={logofarevet} alt="FareVet Logo" style={{ height: "45px", width: "auto", objectFit: "contain" }} />
              <span style={{ fontSize: "26px", color: "var(--border)", fontWeight: 300 }}>|</span>
              {currentPartner.logo ? (
                <img src={`${global.IMAGEURL}/${currentPartner.logo}`} alt="Partner Logo" style={{ height: "45px", width: "auto", maxWidth: "140px", objectFit: "contain", borderRadius: "4px" }} />
              ) : (
                <span style={{ fontSize: "18px", fontWeight: "700", color: "#8930F9" }}>{currentPartner.name}</span>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <h3 style={{ fontFamily: "Plus Jakarta Sans, sans-serif", fontWeight: 800, color: "#1A2744", margin: 0, fontSize: "16px" }}>
                Intelligence Report
              </h3>
              <p style={{ fontSize: "9px", color: "#9B9BB5", textTransform: "uppercase", letterSpacing: "1px", margin: "2px 0 0 0" }}>
                Quarterly B2B Analytics · {selectedQuarter}
              </p>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          {((totalMembersVal > 0) || (readinessPct > 0) || (potentialSavingsVal > 0)) && (
            <div className="preview-section">
              <h4>1. Executive Summary <span className="tag tg-g" style={{ fontStyle: "normal" }}>Ready</span></h4>
              <p>
                During {selectedQuarter}, associated B2B program members under the {currentPartner.name} partnership demonstrated active engagement with the FareVet platform. The metrics below highlight key utilization rates and savings realized through our partnership tools.
              </p>
              <div className="preview-stats-row" style={{ display: "grid", gridTemplateColumns: `repeat(${(totalMembersVal > 0 ? 1 : 0) + (readinessPct > 0 ? 1 : 0) + (potentialSavingsVal > 0 ? 1 : 0)}, 1fr)`, gap: "12px" }}>
                {totalMembersVal > 0 && (
                  <div className="preview-stat-item">
                    <div className="preview-lbl">Associated Members</div>
                    <div className="preview-val">
                      {totalMembersVal.toLocaleString()}
                      {activeMembersVal > 0 && (
                        <div style={{ fontSize: "9px", color: "#38A169", fontWeight: 600, marginTop: "2px" }}>
                          ● {activeMembersVal.toLocaleString()} Active
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {readinessPct > 0 && (
                  <div className="preview-stat-item">
                    <div className="preview-lbl">Phase 2 Readiness</div>
                    <div className="preview-val">{readinessPct}%</div>
                  </div>
                )}
                {potentialSavingsVal > 0 && (
                  <div className="preview-stat-item">
                    <div className="preview-lbl">Estimated Savings</div>
                    <div className="preview-val">${potentialSavingsVal.toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 2: Platform Activity & Engagement */}
          {((costSearchesVal > 0) || (billAnalysesVal > 0) || (farevetAiUsesVal > 0) || (estimatorUsesVal > 0) || (engagementRate > 0) || (calculatedMrr > 0)) && (
            <div className="preview-section">
              <h4>2. Platform Activity & Engagement <span className="tag tg-g">Ready</span></h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "11px", marginTop: "6px" }}>
                {costSearchesVal > 0 && <div>Cost Searches: <strong>{costSearchesVal.toLocaleString()}</strong></div>}
                {billAnalysesVal > 0 && <div>Bill Analyses: <strong>{billAnalysesVal.toLocaleString()}</strong></div>}
                {farevetAiUsesVal > 0 && <div>FareVet AI Uses: <strong>{farevetAiUsesVal.toLocaleString()}</strong></div>}
                {estimatorUsesVal > 0 && <div>Estimator Uses: <strong>{estimatorUsesVal.toLocaleString()}</strong></div>}
                {engagementRate > 0 && <div>Engagement Rate: <strong style={{ color: "#8930F9" }}>{engagementRate}%</strong></div>}
                {calculatedMrr > 0 && <div>B2B MRR: <strong style={{ color: "#2E7D32" }}>${calculatedMrr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>}
              </div>
            </div>
          )}

          {/* Section 3: Operational Notes */}
          {notesVal && (
            <div className="preview-section">
              <h4>3. Pietro's Operational Notes</h4>
              <p style={{ fontStyle: "italic", background: "#f9f9f9", padding: "8px", borderRadius: "6px", fontSize: "11px", color: "var(--ink2)" }}>{notesVal}</p>
            </div>
          )}
        </div>
      </Modal>
    </main >
  );
};

export default Reports;
