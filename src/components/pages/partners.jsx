import { useState, useEffect } from "react";
import { Search, Plus, Copy } from "react-feather";
import { Modal, Input, Select, message } from "antd";
import { apiRequest } from "../../api/auth_api";
import "./partners.scss";
import Spinner from "../Spinner";

const { Option } = Select;

// Convert "Oct 2025" to "2025-10"
const parsePartnerSinceToMonth = (str) => {
  if (!str) return "";
  const parts = str.trim().split(" ");
  if (parts.length !== 2) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mIndex = months.indexOf(parts[0]);
  if (mIndex === -1) return "";
  const year = parts[1];
  const month = String(mIndex + 1).padStart(2, "0");
  return `${year}-${month}`;
};

// Convert "2025-10" to "Oct 2025"
const formatMonthToPartnerSince = (str) => {
  if (!str) return "May 2026";
  const parts = str.trim().split("-");
  if (parts.length !== 2) return str; // return as-is if already formatted
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mIndex = parseInt(parts[1]) - 1;
  const monthName = months[mIndex] || "May";
  const year = parts[0];
  return `${monthName} ${year}`;
};

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

const generateSecure6DigitCode = (existingPartners = []) => {
  const existingCodes = new Set(
    existingPartners.map((p) => p.partnerCode).filter(Boolean)
  );
  let code = "";
  for (let attempt = 0; attempt < 100; attempt++) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    const num = (array[0] % 900000) + 100000;
    code = String(num);
    if (!existingCodes.has(code)) {
      break;
    }
  }
  return code;
};

const Partners = () => {
  const [partners, setPartners] = useState([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const copySignupUrl = (code) => {
    if (!code) return;
    const url = `https://farevet-web.vercel.app/auth/signup?partner=${code}`;
    navigator.clipboard.writeText(url)
      .then(() => {
        message.success("Signup link copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        message.error("Failed to copy link");
      });
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("Insurance");
  const [formStatus, setFormStatus] = useState("Active");
  const [formEmail, setFormEmail] = useState("");
  const [formMembers, setFormMembers] = useState(0);
  const [formBilling, setFormBilling] = useState(0);
  const [formRate, setFormRate] = useState(1.2);
  const [formPartnerSince, setFormPartnerSince] = useState("");
  const [formPartnerCode, setFormPartnerCode] = useState("");
  const [formDefaultDeductible, setFormDefaultDeductible] = useState(0);
  const [formDefaultReimbursement, setFormDefaultReimbursement] = useState("80%");
  const [formClaimsPortalUrl, setFormClaimsPortalUrl] = useState("");
  const [formLogo, setFormLogo] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [formFeatures, setFormFeatures] = useState({
    costSearch: false,
    billExplainer: false,
    farevetAi: false,
    medComparison: false,
    insuranceSavings: false,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch B2B Partners from Database
  const fetchPartners = async () => {
    setLoading(true);
    const body = new FormData();
    body.append("type", "get_list");
    body.append("table_name", "partner");
    try {
      const res = await apiRequest({ body });
      if (res && res.data && res.data.length > 0) {
        const mapped = res.data.map(mapApiPartnerToReact);
        setPartners(mapped);
        setSelectedPartnerId((prev) => {
          return mapped.some((p) => p.id === prev) ? prev : mapped[0].id;
        });
      } else {
        setPartners([]);
      }
    } catch (e) {
      console.error("API error fetching partners:", e);
      message.error("Failed to load partners from database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  // Find currently selected partner
  const selectedPartner = partners.find((p) => p.id === selectedPartnerId) || partners[0] || null;

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLogoUploading(true);
    const updatedFileName = file.name;
    const body = new FormData();
    body.append("type", "upload_data");
    body.append("file", new Blob([file], { type: file.type }), updatedFileName);

    try {
      const response = await apiRequest({ body });
      if (response && response.file_name) {
        setFormLogo(response.file_name);
        setLogoPreview(URL.createObjectURL(file));
        message.success("Logo uploaded successfully");
      } else {
        message.error("Failed to upload logo file");
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      message.error("Error uploading logo file");
    } finally {
      setLogoUploading(false);
    }
  };

  // Toggle single feature toggle and sync to database
  const handleToggleFeature = async (partnerId, featureKey) => {
    const target = partners.find((p) => p.id === partnerId);
    if (!target) return;

    const updatedFeatures = {
      ...target.features,
      [featureKey]: !target.features[featureKey],
    };

    const body = new FormData();
    body.append("type", "update_data");
    body.append("table_name", "partner");
    body.append("id", partnerId);
    body.append("partner_name", target.name);
    body.append("partner_type", target.type);
    body.append("status", target.status);
    body.append("contact_email", target.email);
    body.append("total_members", target.members);
    body.append("mrr_rate", target.mrrRate);
    body.append("monthly_billing", target.billing);
    body.append("partner_since", parsePartnerSinceToMonth(target.partnerSince) || "2026-05");
    body.append("partner_code", target.partnerCode || "");
    body.append("partner_logo", target.logo || "");
    body.append("default_deductible", target.defaultDeductible || 0);
    body.append("default_reimbursement", target.defaultReimbursement || "80%");
    body.append("claims_portal_url", target.claimsPortalUrl || "");
    body.append("feature_cost_search", updatedFeatures.costSearch ? 1 : 0);
    body.append("feature_bill_explainer", updatedFeatures.billExplainer ? 1 : 0);
    body.append("feature_farevet_ai", updatedFeatures.farevetAi ? 1 : 0);
    body.append("feature_medication_comp", updatedFeatures.medComparison ? 1 : 0);
    body.append("feature_insurance_savings", updatedFeatures.insuranceSavings ? 1 : 0);

    try {
      const res = await apiRequest({ body });
      if (res) {
        message.success("Partner feature toggle updated in database");
        fetchPartners();
      } else {
        message.error("Failed to update feature toggle");
      }
    } catch (error) {
      console.error("API error updating toggle:", error);
      message.error("Failed to sync feature toggle to database");
    }
  };

  // Open modal in Add mode
  const handleOpenAddModal = () => {
    setEditMode(false);
    setEditingPartnerId(null);
    setFormName("");
    setFormType("Insurance");
    setFormStatus("Active");
    setFormEmail("");
    setFormMembers(0);
    setFormBilling(0);
    setFormRate(1.2);
    setFormPartnerCode(generateSecure6DigitCode(partners));
    setFormDefaultDeductible(0);
    setFormDefaultReimbursement("80%");
    setFormClaimsPortalUrl("");
    setFormLogo("");
    setLogoPreview("");

    // Set realistic default date (YYYY-MM-DD to YYYY-MM conversion/fallback)
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    setFormPartnerSince(`${year}-${month}`);

    setFormFeatures({
      costSearch: true,
      billExplainer: true,
      farevetAi: false,
      medComparison: false,
      insuranceSavings: false,
    });
    setIsModalOpen(true);
  };

  // Open modal in Edit mode
  const handleOpenEditModal = (partner) => {
    setEditMode(true);
    setEditingPartnerId(partner.id);
    setFormName(partner.name);
    setFormType(partner.type);
    setFormStatus(partner.status);
    setFormEmail(partner.email || "");
    setFormMembers(partner.members || 0);
    setFormBilling(partner.billing || 0);
    setFormRate(partner.mrrRate || 1.2);
    setFormPartnerSince(parsePartnerSinceToMonth(partner.partnerSince) || "");
    setFormPartnerCode(partner.partnerCode || generateSecure6DigitCode(partners));
    setFormDefaultDeductible(partner.defaultDeductible || 0);
    setFormDefaultReimbursement(partner.defaultReimbursement || "80%");
    setFormClaimsPortalUrl(partner.claimsPortalUrl || "");
    setFormLogo(partner.logo || "");
    setLogoPreview(partner.logo ? `${global.IMAGEURL}/${partner.logo}` : "");
    setFormFeatures(partner.features || {
      costSearch: false,
      billExplainer: false,
      farevetAi: false,
      medComparison: false,
      insuranceSavings: false,
    });
    setIsModalOpen(true);
  };

  // Handle Save (Create or Update Partner)
  const handleSavePartner = async () => {
    if (!formName.trim()) {
      message.error("Please enter partner name");
      return;
    }
    if (!formEmail.trim() || !formEmail.includes("@")) {
      message.error("Please enter a valid contact email");
      return;
    }

    setSaving(true);
    try {
      const numericMembers = Number(formMembers) || 0;
      const numericRate = Number(formRate) || 1.2;
      const calculatedActive = formStatus === "Active" ? Math.round(numericMembers * 0.84) : 0;
      const calculatedBilling = calculatedActive * numericRate;
      const formattedSince = formatMonthToPartnerSince(formPartnerSince);

      const body = new FormData();
      body.append("table_name", "partner");
      body.append("partner_name", formName.trim());
      body.append("partner_type", formType);
      body.append("status", formStatus);
      body.append("contact_email", formEmail.trim());
      body.append("total_members", numericMembers);
      body.append("mrr_rate", numericRate);
      body.append("monthly_billing", calculatedBilling);
      body.append("partner_since", formattedSince);
      body.append("partner_code", formPartnerCode);
      body.append("partner_logo", formLogo);
      body.append("default_deductible", formType === "Insurance" ? formDefaultDeductible : 0);
      body.append("default_reimbursement", formType === "Insurance" ? formDefaultReimbursement : "80%");
      body.append("claims_portal_url", formType === "Insurance" ? formClaimsPortalUrl.trim() : "");
      body.append("feature_cost_search", formFeatures.costSearch ? 1 : 0);
      body.append("feature_bill_explainer", formFeatures.billExplainer ? 1 : 0);
      body.append("feature_farevet_ai", formFeatures.farevetAi ? 1 : 0);
      body.append("feature_medication_comp", formFeatures.medComparison ? 1 : 0);
      body.append("feature_insurance_savings", formFeatures.insuranceSavings ? 1 : 0);

      if (editMode) {
        body.append("type", "update_data");
        body.append("id", editingPartnerId);
        try {
          const res = await apiRequest({ body });
          if (res?.result) {
            message.success("Partner details updated successfully in database");
            fetchPartners();
            setIsModalOpen(false);
          } else {
            message.error("Failed to update partner details");
          }
        } catch (error) {
          console.error("API error during update:", error);
          message.error("Failed to execute update call");
        }
      } else {
        body.append("type", "add_data");
        // body.append("threshold", 500);
        try {
          const res = await apiRequest({ body });
          if (res?.result) {
            message.success("New partner added successfully to database");
            fetchPartners();
            setIsModalOpen(false);
          } else {
            message.error("Failed to create B2B partner");
          }
        } catch (error) {
          console.error("API error during creation:", error);
          message.error("Failed to execute creation call");
        }
      }
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete B2B Partner from Database
  const handleDeletePartner = async (partnerId) => {
    Modal.confirm({
      title: "Delete Partner Account?",
      content: "Are you sure you want to permanently remove this B2B partner and all associated configurations from database?",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        const body = new FormData();
        body.append("type", "delete_data");
        body.append("table_name", "partner");
        body.append("id", partnerId);
        try {
          const res = await apiRequest({ body });
          if (res) {
            message.success("Partner deleted successfully from database");
            fetchPartners();
          } else {
            message.error("Failed to delete B2B partner");
          }
        } catch (error) {
          console.error("API error deleting partner:", error);
          message.error("Failed to execute deletion call");
        }
      }
    });
  };

  // Filter partners list by search query
  const filteredPartners = partners.filter((p) => {
    const query = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      p.type.toLowerCase().includes(query)
    );
  });

  return (
    <main className="partners-page">
      {/* Top Header */}
      <div className="page-hdr">
        <div>
          <div className="page-title">Partner Management</div>
          <div className="page-sub">Manage all B2B partner accounts and configurations.</div>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={12} style={{ marginRight: "3px" }} />
          Add partner
        </button>
      </div>

      <div className="sidebar-layout">
        {/* Left Column: B2B Partners List */}
        <div className="card">
          <div className="ph">
            <div className="pt">All partners</div>
          </div>

          {/* Search bar */}
          <div className="search-wrapper">
            <Search size={14} style={{ color: "var(--ink3)", alignSelf: "center" }} />
            <input
              type="text"
              className="search-input"
              placeholder="Search partner or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div id="partnerList">
            {loading ? (
              <div style={{ padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                <div
                  className=" justify-content-center align-items-center"
                >
                  <Spinner size={18} />
                  {/* <span
                    className="plusJakara_regular"
                    style={{ marginLeft: "0.5rem", color: "#6c757d" }}
                  >
                    Loading B2B Partners...
                  </span> */}
                </div>
              </div>
            ) : filteredPartners.length === 0 ? (
              <div style={{ padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--ink2)" }}>No Data Found</div>
                <div style={{ fontSize: "12px", color: "var(--ink3)", textAlign: "center" }}>Please add a partner to start.</div>
              </div>
            ) : (
              filteredPartners.map((p) => {
                const isActive = p.id === selectedPartnerId;
                const statusTagClass = p.status === "Active" ? "tag tg-g" : "tag tg-a";
                return (
                  <div
                    key={p.id}
                    className={`inbox-item ${isActive ? "selected" : ""}`}
                    onClick={() => setSelectedPartnerId(p.id)}
                    style={{ display: "flex", alignItems: "center", gap: "12px" }}
                  >
                    {p.logo && (
                      <img
                        src={`${global.IMAGEURL}/${p.logo}`}
                        alt=""
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          objectFit: "cover",
                          border: "1px solid var(--border)",
                          flexShrink: 0
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink)", marginBottom: "3px" }}>
                        {p.name}
                      </div>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <span className={statusTagClass}>{p.status}</span>
                        <span style={{ fontSize: "11px", color: "var(--ink3)" }}>
                          {p.type} {p.status === "Active" ? `· ${p.members} members` : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed View */}
        {selectedPartner ? (
          <div id="partnerDetail">
            <div className="card">
              {/* Card Header */}
              <div className="ph" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {selectedPartner.logo && (
                  <img
                    src={`${global.IMAGEURL}/${selectedPartner.logo}`}
                    alt={`${selectedPartner.name} Logo`}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "6px",
                      objectFit: "cover",
                      border: "1px solid var(--border)"
                    }}
                  />
                )}
                <div className="pt" style={{ fontSize: "15px", flex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>{selectedPartner.name}</span>

                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEditModal(selectedPartner)}>
                    Edit
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: "var(--red)", borderColor: "rgba(230,57,70,0.2)" }}
                    onClick={() => handleDeletePartner(selectedPartner.id)}
                  >
                    Delete
                  </button>
                  <span className={`status ${selectedPartner.status === "Active" ? "s-active" : "s-pending"}`}>
                    {selectedPartner.status}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="pb">
                {/* Partner Signup URL Banner */}
                {selectedPartner.partnerCode && (
                  <div style={{
                    background: "rgba(137, 48, 249, 0.04)",
                    border: "1px solid rgba(137, 48, 249, 0.1)",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    marginBottom: "14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px"
                  }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--ink3)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Partner Signup URL
                      </span>
                      <a
                        href={`https://farevet-web.vercel.app/auth/signup?partner=${selectedPartner.partnerCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="partner-signup-link"
                        style={{
                          fontWeight: "600",
                          color: "var(--primary)",
                          fontSize: "12px",
                          textDecoration: "none",
                          wordBreak: "break-all"
                        }}
                      >
                        https://farevet-web.vercel.app/auth/signup?partner={selectedPartner.partnerCode}
                      </a>
                    </div>
                    <button
                      onClick={() => copySignupUrl(selectedPartner.partnerCode)}
                      className="copy-btn-input"
                      title="Copy Signup URL"
                      type="button"
                      style={{ height: "32px", padding: "0 12px", flexShrink: 0 }}
                    >
                      <Copy size={13} style={{ marginRight: "4px" }} />
                      Copy URL
                    </button>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="stat-grid sg2" style={{ marginBottom: "14px" }}>
                  <div className="stat-card">
                    <div className="stat-lbl">Total members</div>
                    <div className="stat-val">{selectedPartner.members}</div>
                    <div className="stat-delta up">
                      {selectedPartner.status === "Active" ? "↑ +14%" : "—"}
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-lbl">Active this month</div>
                    <div className="stat-val">{selectedPartner.activeMembers}</div>
                    <div className="stat-delta nt">
                      {selectedPartner.members > 0
                        ? `${Math.round((selectedPartner.activeMembers / selectedPartner.members) * 100)}% Engagement`
                        : "—"}
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-lbl">Monthly billing</div>
                    <div className="stat-val">${Math.round(selectedPartner.activeMembers * (selectedPartner.mrrRate || 1.20))}</div>
                    <div className="stat-delta nt">
                      ${selectedPartner?.mrrRate?.toFixed(2)}/active member
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-lbl">Partner since</div>
                    <div className="stat-val" style={{ fontSize: "16px" }}>
                      {selectedPartner.partnerSince}
                    </div>
                    <div className="stat-delta nt">
                      B2B Partner
                    </div>
                  </div>
                </div>

                {/* Phase 2 Progress Bar */}
                <div style={{
                  background: "var(--amberL)",
                  border: "1px solid rgba(243,156,18,0.3)",
                  borderRadius: "10px",
                  padding: "14px",
                  marginBottom: "14px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--ink)" }}>
                      Phase 2 readiness — Intelligence Reports
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--amber)" }}>
                      {selectedPartner.activeMembers} / {selectedPartner.threshold || 500} active members
                    </div>
                  </div>

                  {/* Calculate Progress Bar */}
                  {(() => {
                    const pct = Math.min(100, Math.round((selectedPartner.activeMembers / (selectedPartner.threshold || 500)) * 100));
                    const needed = Math.max(0, (selectedPartner.threshold || 500) - selectedPartner.activeMembers);
                    return (
                      <>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${pct}%`, background: "var(--amber)" }}></div>
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--ink3)", marginTop: "6px" }}>
                          {needed > 0
                            ? `${needed} more active members needed to unlock Phase 2 data partnership conversation`
                            : "Threshold achieved! Unlock Phase 2 Intelligence Reports available now."}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Feature Toggles */}
                <div style={{ marginBottom: "14px" }}>
                  <div style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "var(--ink3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "8px"
                  }}>
                    Feature toggles
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {/* Cost Search Toggle */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                      <span>Cost Search</span>
                      <div
                        className="toggle"
                        style={{ background: selectedPartner.features.costSearch ? "var(--green)" : "var(--border)" }}
                        onClick={() => handleToggleFeature(selectedPartner.id, "costSearch")}
                      >
                        <div className="toggle-thumb" style={{ left: selectedPartner.features.costSearch ? "16px" : "2px" }}></div>
                      </div>
                    </div>

                    {/* Bill Explainer Toggle */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                      <span>Bill Explainer</span>
                      <div
                        className="toggle"
                        style={{ background: selectedPartner.features.billExplainer ? "var(--green)" : "var(--border)" }}
                        onClick={() => handleToggleFeature(selectedPartner.id, "billExplainer")}
                      >
                        <div className="toggle-thumb" style={{ left: selectedPartner.features.billExplainer ? "16px" : "2px" }}></div>
                      </div>
                    </div>

                    {/* FareVet AI Toggle */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                      <span>FareVet AI</span>
                      <div
                        className="toggle"
                        style={{ background: selectedPartner.features.farevetAi ? "var(--green)" : "var(--border)" }}
                        onClick={() => handleToggleFeature(selectedPartner.id, "farevetAi")}
                      >
                        <div className="toggle-thumb" style={{ left: selectedPartner.features.farevetAi ? "16px" : "2px" }}></div>
                      </div>
                    </div>

                    {/* Medication Comparison Toggle */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                      <span>Medication Comparison</span>
                      <div
                        className="toggle"
                        style={{ background: selectedPartner.features.medComparison ? "var(--green)" : "var(--border)" }}
                        onClick={() => handleToggleFeature(selectedPartner.id, "medComparison")}
                      >
                        <div className="toggle-thumb" style={{ left: selectedPartner.features.medComparison ? "16px" : "2px" }}></div>
                      </div>
                    </div>

                    {/* Insurance Savings Calculator Toggle */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                      <span>Insurance Savings Calculator</span>
                      <div
                        className="toggle"
                        style={{ background: selectedPartner.features.insuranceSavings ? "var(--green)" : "var(--border)" }}
                        onClick={() => handleToggleFeature(selectedPartner.id, "insuranceSavings")}
                      >
                        <div className="toggle-thumb" style={{ left: selectedPartner.features.insuranceSavings ? "16px" : "2px" }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Insurance Fields */}
                {selectedPartner.type === "Insurance" && (
                  <div style={{
                    background: "rgba(137, 48, 249, 0.04)",
                    border: "1px solid rgba(137, 48, 249, 0.1)",
                    borderRadius: "10px",
                    padding: "14px",
                    marginTop: "14px",
                    marginBottom: "14px"
                  }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--ink)", marginBottom: "8px" }}>
                      Insurance Default Configurations
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px", marginBottom: "8px" }}>
                      <div>
                        <span style={{ color: "var(--ink3)" }}>Default Deductible: </span>
                        <strong style={{ color: "var(--ink)" }}>${selectedPartner.defaultDeductible || 0}</strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--ink3)" }}>Reimbursement Rate: </span>
                        <strong style={{ color: "var(--ink)" }}>{selectedPartner.defaultReimbursement || "80%"}</strong>
                      </div>
                    </div>
                    {selectedPartner.claimsPortalUrl && (
                      <div style={{ fontSize: "11px", color: "var(--ink3)", wordBreak: "break-all" }}>
                        Claims Portal: <a href={selectedPartner.claimsPortalUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)" }}>{selectedPartner.claimsPortalUrl}</a>
                      </div>
                    )}
                  </div>
                )}

                {/* Contact Email */}
                {selectedPartner.email && (
                  <div style={{ fontSize: "11px", color: "var(--ink3)" }}>
                    Contact: <a href={`mailto:${selectedPartner.email}`} style={{ color: "var(--primary)" }}>{selectedPartner.email}</a>
                  </div>
                )}

              </div>
            </div>
          </div>
        ) : (
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg)",
            border: "1px dashed var(--border)",
            borderRadius: "12px",
            padding: "60px 40px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "16px", fontWeight: "600", color: "var(--ink2)", marginBottom: "6px" }}>
              No B2B Partner Selected
            </div>
            <div style={{ fontSize: "12px", color: "var(--ink3)", maxWidth: "320px", lineHeight: "1.6" }}>
              {partners.length === 0
                ? "No partner accounts found in the database. Use the '+ Add partner' button to create your first partner account."
                : "Please select a B2B partner from the list to manage their features and view reports."}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        title={editMode ? `Edit Partner: ${formName}` : "Add New B2B Partner"}
        open={isModalOpen}
        onCancel={() => !saving && setIsModalOpen(false)}
        onOk={handleSavePartner}
        confirmLoading={saving}
        okButtonProps={{ disabled: saving }}
        cancelButtonProps={{ disabled: saving }}
        okText="Save Partner"
        cancelText="Cancel"
        className="partner-form-modal"
        centered

        zIndex={9999}
        width={800}
      >
        <div style={{ marginTop: "14px" }}>
          {/* Logo Upload Section */}
          <div className="form-row" style={{ marginBottom: "18px" }}>
            <div className="form-group" style={{
              flex: 1,
              display: "flex",
              gap: "16px",
              alignItems: "center",
              background: "#fafafa",
              border: "1px dashed var(--border)",
              borderRadius: "10px",
              padding: "16px",
              margin: 0
            }}>
              <div style={{
                width: "64px",
                height: "64px",
                borderRadius: "12px",
                border: "1px solid var(--border)",
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                position: "relative",
                flexShrink: 0
              }}>
                {logoUploading ? (
                  <Spinner size={20} className="text_dark" />
                ) : logoPreview ? (
                  <img src={logoPreview} alt="Logo Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink2)", marginBottom: "4px" }}>
                  Partner Brand Logo
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <label htmlFor="logo-upload" style={{
                    display: "inline-block",
                    padding: "6px 14px",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    cursor: logoUploading ? "not-allowed" : "pointer",
                    opacity: logoUploading ? 0.6 : 1,
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "var(--ink2)",
                    margin: 0
                  }}>
                    {logoUploading ? "Uploading..." : "Upload Partner Logo"}
                  </label>
                  <span style={{ fontSize: "11px", color: "var(--ink3)" }}>
                    Recommended: Square image (PNG, JPG, SVG)
                  </span>
                </div>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  disabled={logoUploading}
                  onChange={handleLogoChange}
                />
              </div>
            </div>
          </div>

          {/* Partner Name & Code Row */}
          <div className="form-group" style={{ flex: 2 }}>
            <label>Partner Name</label>
            <Input
              placeholder="e.g. Trupanion"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              size="large"
            />
          </div>
          {/* <div className="form-group" style={{ flex: 1 }}>
              <label>signup URL</label>
              <div style={{ display: "flex", gap: "6px" }}>
                <Input
                  value={formPartnerCode ? `https://farevet-web.vercel.app/auth/signup?partner=${formPartnerCode}` : ""}
                  readOnly
                  disabled
                  size="large"
                  style={{ fontWeight: "600", background: "#f5f5f5", color: "#555" }}
                />
                <button
                  type="button"
                  onClick={() => copySignupUrl(formPartnerCode)}
                  className="copy-btn-input"
                  title="Copy Signup URL"
                  disabled={!formPartnerCode}
                >
                  <Copy size={16} />
                </button>
              </div>
            </div> */}

          <div className="form-row">
            {/* Partner Type */}
            <div className="form-group">
              <label>Partner Type</label>
              <Select
                value={formType}
                onChange={(val) => setFormType(val)}
                size="large"
                style={{ width: "100%" }}
              >
                <Option value="Insurance">Insurance</Option>
                <Option value="Telehealth">Telehealth</Option>
                <Option value="Wellness">Wellness</Option>
                <Option value="Retail">Retail</Option>
              </Select>
            </div>

            {/* Partner Status */}
            <div className="form-group">
              <label>Status</label>
              <Select
                value={formStatus}
                onChange={(val) => setFormStatus(val)}
                size="large"
                style={{ width: "100%" }}
              >
                <Option value="Active">Active</Option>
                <Option value="Pending">Pending</Option>
              </Select>
            </div>
          </div>

          {/* Contact Email */}
          <div className="form-group">
            <label>Contact Email</label>
            <Input
              type="email"
              placeholder="e.g. partnerships@trupanion.com"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              size="large"
            />
          </div>

          {/* Conditional Insurance Fields */}
          {formType === "Insurance" && (
            <div style={{
              background: "#fafafa",
              border: "1px solid #e8e8e8",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "14px",
              marginTop: "4px"
            }}>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#555", marginBottom: "8px" }}>
                Insurance Settings
              </div>
              <div className="form-row">
                {/* Default Deductible */}
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Default Deductible ($)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 250"
                    value={formDefaultDeductible}
                    onChange={(e) => setFormDefaultDeductible(Math.max(0, parseFloat(e.target.value) || 0))}
                    size="large"
                  />
                </div>

                {/* Default Reimbursement Rate */}
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Reimbursement Rate</label>
                  <Select
                    value={formDefaultReimbursement}
                    onChange={(val) => setFormDefaultReimbursement(val)}
                    size="large"
                    style={{ width: "100%" }}
                  >
                    <Option value="70%">70%</Option>
                    <Option value="80%">80%</Option>
                    <Option value="90%">90%</Option>
                    <Option value="100%">100%</Option>
                  </Select>
                </div>
              </div>

              {/* Claims Portal URL */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Claims Portal URL</label>
                <Input
                  type="text"
                  placeholder="e.g. https://claims.trupanion.com"
                  value={formClaimsPortalUrl}
                  onChange={(e) => setFormClaimsPortalUrl(e.target.value)}
                  size="large"
                />
              </div>
            </div>
          )}

          <div className="form-row">
            {/* Total Members */}
            <div className="form-group">
              <label>Total Members</label>
              <Input
                type="number"
                disabled={formStatus !== "Active"}
                placeholder="0"
                value={formMembers}
                onChange={(e) => setFormMembers(Math.max(0, parseInt(e.target.value) || 0))}
                size="large"
              />
            </div>

            {/* Rate Per Member */}
            <div className="form-group">
              <label>MRR Rate ($ / member)</label>
              <Input
                type="number"
                step="0.1"
                placeholder="1.20"
                value={formRate}
                onChange={(e) => setFormRate(Math.max(0, parseFloat(e.target.value) || 0))}
                size="large"
              />
            </div>
          </div>

          <div className="form-row">
            {/* Custom Monthly Billing Override (Optional) */}
            <div className="form-group">
              <label>Monthly Billing ($ - Optional)</label>
              <Input
                type="number"
                placeholder={`Auto: $${formMembers * formRate}`}
                value={formBilling || ""}
                onChange={(e) => setFormBilling(Math.max(0, parseFloat(e.target.value) || 0))}
                size="large"
              />
            </div>

            {/* Partner Since Date */}
            <div className="form-group">
              <label>Partner Since</label>
              <Input
                type="month"
                value={formPartnerSince}
                onChange={(e) => setFormPartnerSince(e.target.value)}
                size="large"
              />
            </div>
          </div>

          {/* Initial Feature Toggles Selection */}
          <div className="modal-toggles">
            <label>Initial Feature Toggles</label>

            {/* Cost Search */}
            <div className="modal-toggle-row">
              <span>Cost Search</span>
              <div
                className="toggle"
                style={{ background: formFeatures.costSearch ? "var(--green)" : "var(--border)" }}
                onClick={() => setFormFeatures({ ...formFeatures, costSearch: !formFeatures.costSearch })}
              >
                <div className="toggle-thumb" style={{ left: formFeatures.costSearch ? "16px" : "2px" }}></div>
              </div>
            </div>

            {/* Bill Explainer */}
            <div className="modal-toggle-row">
              <span>Bill Explainer</span>
              <div
                className="toggle"
                style={{ background: formFeatures.billExplainer ? "var(--green)" : "var(--border)" }}
                onClick={() => setFormFeatures({ ...formFeatures, billExplainer: !formFeatures.billExplainer })}
              >
                <div className="toggle-thumb" style={{ left: formFeatures.billExplainer ? "16px" : "2px" }}></div>
              </div>
            </div>

            {/* FareVet AI */}
            <div className="modal-toggle-row">
              <span>FareVet AI</span>
              <div
                className="toggle"
                style={{ background: formFeatures.farevetAi ? "var(--green)" : "var(--border)" }}
                onClick={() => setFormFeatures({ ...formFeatures, farevetAi: !formFeatures.farevetAi })}
              >
                <div className="toggle-thumb" style={{ left: formFeatures.farevetAi ? "16px" : "2px" }}></div>
              </div>
            </div>

            {/* Medication Comparison */}
            <div className="modal-toggle-row">
              <span>Medication Comparison</span>
              <div
                className="toggle"
                style={{ background: formFeatures.medComparison ? "var(--green)" : "var(--border)" }}
                onClick={() => setFormFeatures({ ...formFeatures, medComparison: !formFeatures.medComparison })}
              >
                <div className="toggle-thumb" style={{ left: formFeatures.medComparison ? "16px" : "2px" }}></div>
              </div>
            </div>

            {/* Insurance Savings Calculator */}
            <div className="modal-toggle-row">
              <span>Insurance Savings Calculator</span>
              <div
                className="toggle"
                style={{ background: formFeatures.insuranceSavings ? "var(--green)" : "var(--border)" }}
                onClick={() => setFormFeatures({ ...formFeatures, insuranceSavings: !formFeatures.insuranceSavings })}
              >
                <div className="toggle-thumb" style={{ left: formFeatures.insuranceSavings ? "16px" : "2px" }}></div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </main>
  );
};

export default Partners;
