import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { message, Modal } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Select from "react-select";
import ReactPaginate from "react-paginate";
import "./medicationDatabase.scss";
import { ArrowLeft } from "react-feather";
import { apiRequest } from "../../api/auth_api";
import { Spinner } from "react-bootstrap";
import { arrowleft2, arrowright2, trash } from "../icons/icon";
import ProductTableNoData from "../DataTable/NoDataComponent";

const MEDICATIONS_CATEGORY_TABLE = "medications_category";
const MEDICATIONS_TABLE = "medications";
const PAGE_SIZE = 10;

function categoryNameFromRow(row) {
  const n =
    row?.name ??
    row?.category_name ??
    row?.title ??
    row?.label ??
    "";
  return String(n).trim();
}

function normalizeCategoryRow(row) {
  return {
    id: row?.id,
    name: categoryNameFromRow(row),
    _raw: row,
  };
}

const medSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 36,
    fontSize: 12,
    borderRadius: 7,
    borderColor: state.isFocused ? "#8930f9" : "#e8e8f0",
    background: state.isFocused ? "#fff" : "#f9f9fb",
    boxShadow: state.isFocused ? "0 0 0 1px #8930f9" : "none",
    "&:hover": { borderColor: state.isFocused ? "#8930f9" : "#9b9bb5" },
  }),
  valueContainer: (base) => ({ ...base, padding: "2px 8px" }),
  placeholder: (base) => ({ ...base, color: "#9b9bb5", fontSize: 12 }),
  singleValue: (base) => ({ ...base, color: "#1a1a2e", fontSize: 12 }),
  menu: (base) => ({
    ...base,
    borderRadius: 8,
    border: "1px solid #e8e8f0",
    overflow: "hidden",
    fontSize: 12,
  }),
  menuPortal: (base) => ({ ...base, zIndex: 1100 }),
  option: (base, state) => ({
    ...base,
    fontSize: 12,
    background: state.isSelected
      ? "#8930f9"
      : state.isFocused
        ? "#f3e8ff"
        : "#fff",
    color: state.isSelected ? "#fff" : "#1a1a2e",
  }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "#9b9bb5",
    padding: "0 8px",
  }),
};

function formatMoney(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "—";
  const num = Number(raw);
  return Number.isFinite(num) ? `$${num}` : raw;
}

function prettyPetType(raw) {
  const v = String(raw ?? "").toLowerCase().trim();
  if (v === "dog") return "Dog";
  if (v === "cat") return "Cat";
  if (v === "both") return "Both";
  return "—";
}

function prettyDate(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function prettyDateTime(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function categoryText(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  if (typeof value === "object") {
    const maybe =
      value?.name ?? value?.category_name ?? value?.title ?? value?.label ?? "";
    return String(maybe || "").trim();
  }
  return "";
}

function asCount(...vals) {
  for (const v of vals) {
    if (v == null || v === "") continue;
    const n = Number(String(v).replace(/,/g, ""));
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function asMoney(...vals) {
  for (const v of vals) {
    if (v == null || v === "") continue;
    const n = Number(String(v).replace(/,/g, ""));
    if (Number.isFinite(n)) return n.toFixed(2);
  }
  return null;
}

function pickMedicationCountsPayload(res) {
  if (!res || typeof res !== "object") return null;

  let row = null;
  if (Array.isArray(res.data) && res.data.length > 0) {
    row = res.data[0];
  } else if (
    res.data &&
    typeof res.data === "object" &&
    !Array.isArray(res.data)
  ) {
    row = res.data;
  } else if (res.stats && typeof res.stats === "object") {
    row = Array.isArray(res.stats) ? res.stats[0] : res.stats;
  } else if (res.counts && typeof res.counts === "object") {
    row = res.counts;
  } else if (res.result && typeof res.result === "object") {
    row = res.result;
  } else {
    row = res;
  }

  if (!row || typeof row !== "object" || Array.isArray(row)) return null;

  if (row.medication_counts && typeof row.medication_counts === "object") {
    return row.medication_counts;
  }
  if (row.counts && typeof row.counts === "object") {
    return row.counts;
  }
  if (row.stats && typeof row.stats === "object") {
    return row.stats;
  }

  return row;
}

const EMPTY_STATS = {
  total: null,
  stale: null,
  clicks: null,
  commissions: null,
  clicksLabel: "This month",
  commissionsLabel: "This month",
};


const MedicationDatabase = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showCatalog, setShowCatalog] = useState(true);
  const [petType, setPetType] = useState("dog");
  const [prescription, setPrescription] = useState("yes");
  const [category, setCategory] = useState(null);
  const [medicationName, setMedicationName] = useState("");
  const [genericName, setGenericName] = useState("");
  const [noteText, setNoteText] = useState("");
  const [clinicPrice, setClinicPrice] = useState("");
  const [chewyPrice, setChewyPrice] = useState("");
  const [chewyUrl, setChewyUrl] = useState("");
  const [petMedsPrice, setPetMedsPrice] = useState("");
  const [petMedsUrl, setPetMedsUrl] = useState("");
  const [walmartPrice, setWalmartPrice] = useState("");
  const [costcoPrice, setCostcoPrice] = useState("");
  const [savingMedication, setSavingMedication] = useState(false);
  const [editingMedicationId, setEditingMedicationId] = useState(null);
  const [deletingMedicationId, setDeletingMedicationId] = useState(null);
  const [detailRow, setDetailRow] = useState(null);

  const [medCategories, setMedCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [medications, setMedications] = useState([]);
  const [medicationsLoading, setMedicationsLoading] = useState(false);
  const [listPage, setListPage] = useState(1);
  const [listCount, setListCount] = useState(0);
  const [stats, setStats] = useState(EMPTY_STATS);

  const categorySelectOptions = useMemo(() => {
    return [...medCategories]
      .filter((r) => r.name)
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      )
      .map((r) => ({ label: r.name, value: r.name, id: r.id }));
  }, [medCategories]);

  const fetchMedCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const body = new FormData();
      body.append("type", "get_list");
      body.append("table_name", MEDICATIONS_CATEGORY_TABLE);
      const res = await apiRequest({ body });
      if (res && Array.isArray(res.data)) {
        setMedCategories(res.data.map(normalizeCategoryRow));
      } else if (res?.data && typeof res.data === "object") {
        const arr = Array.isArray(res.data) ? res.data : [];
        setMedCategories(arr.map(normalizeCategoryRow));
      } else {
        setMedCategories([]);
      }
    } catch (e) {
      console.error(e);
      message.error("Could not load medication categories.");
      setMedCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMedCategories();
  }, [fetchMedCategories]);

  const fetchMedications = useCallback(async () => {
    setMedicationsLoading(true);
    try {
      const body = new FormData();
      body.append("type", "get_list");
      body.append("table_name", MEDICATIONS_TABLE);
      body.append("page", String(listPage));
      const res = await apiRequest({ body });
      if (res && Array.isArray(res.data)) {
        setMedications(res.data);
        setListCount(Number(res.count) || res.data.length || 0);
      } else if (res?.data && typeof res.data === "object") {
        const arr = Array.isArray(res.data) ? res.data : [];
        setMedications(arr);
        setListCount(Number(res.count) || arr.length || 0);
      } else {
        setMedications([]);
        setListCount(0);
      }
    } catch (e) {
      console.error(e);
      message.error("Could not load medications.");
      setMedications([]);
      setListCount(0);
    } finally {
      setMedicationsLoading(false);
    }
  }, [listPage]);

  useEffect(() => {
    void fetchMedications();
  }, [fetchMedications]);

  const pageCount = Math.max(1, Math.ceil((listCount || 0) / PAGE_SIZE));

  const handlePagination = (page) => {
    setListPage(page.selected + 1);
  };

  const Previous = () => (
    <Fragment>
      <span>
        <img src={arrowleft2} alt="" />
      </span>
    </Fragment>
  );

  const Next = () => (
    <Fragment>
      <span>
        <img src={arrowright2} alt="" />
      </span>
    </Fragment>
  );

  const CustomPagination = () => (
    <ReactPaginate
      previousLabel={<Previous />}
      nextLabel={<Next />}
      forcePage={Math.max(0, listPage - 1)}
      onPageChange={handlePagination}
      pageCount={pageCount}
      breakLabel="..."
      pageRangeDisplayed={2}
      marginPagesDisplayed={2}
      activeClassName="active"
      pageClassName="page-item"
      breakClassName="page-item"
      nextLinkClassName="page-link"
      pageLinkClassName="page-link"
      breakLinkClassName="page-link"
      previousLinkClassName="page-link"
      nextClassName="page-item next-item"
      previousClassName="page-item prev-item"
      containerClassName="pagination product-table-farevet-pagination react-paginate separated-pagination pagination-sm justify-content-end"
    />
  );

  const fetchMedicationCounts = useCallback(async () => {
    try {
      const body = new FormData();
      body.append("type", "medication_counts");
      const res = await apiRequest({ body });
      const src = pickMedicationCountsPayload(res);
      if (!src) {
        setStats(EMPTY_STATS);
        return;
      }
      setStats({
        total: asCount(
          src?.medications_tracked_count,
          src?.total,
          src?.medications_tracked,
          src?.total_medications,
          src?.total_medicines,
          src?.medicines_tracked,
          src?.count,
          src?.total_count,
          src?.medication_count,
          src?.medications_count,
        ),
        stale: asCount(
          src?.prices_stale_over_21_days_count,
          src?.stale,
          src?.stale_count,
          src?.prices_stale,
          src?.stale_prices,
          src?.stale_medications,
          src?.stale_medications_count,
        ),
        clicks: asCount(
          src?.medication_affiliate_clicks_this_month,
          src?.clicks,
          src?.affiliate_clicks,
          src?.total_clicks,
          src?.click_count,
          src?.clicks_this_month,
          src?.affiliate_clicks_this_month,
        ),
        commissions: asMoney(
          src?.estimated_commission_this_month,
          src?.commissions,
          src?.est_commissions,
          src?.estimated_commissions,
          src?.commission,
          src?.total_commissions,
          src?.commissions_this_month,
        ),
        clicksLabel:
          src?.clicks_label || src?.clicks_period_label || "This month",
        commissionsLabel:
          src?.commissions_label ||
          src?.commissions_period_label ||
          "This month",
      });
    } catch (e) {
      console.error(e);
      setStats(EMPTY_STATS);
    }
  }, []);

  useEffect(() => {
    void fetchMedicationCounts();
  }, [fetchMedicationCounts]);

  const showStaleAlert = Number(stats.stale) === 0;

  const categoryById = useMemo(() => {
    const map = new Map();
    medCategories.forEach((c) => map.set(String(c.id), c.name));
    return map;
  }, [medCategories]);

  const resolveCategoryLabel = useCallback(
    (row) =>
      categoryById.get(String(row?.category_id ?? "")) ||
      categoryText(row?.category_name) ||
      categoryText(row?.category) ||
      "—",
    [categoryById],
  );

  useEffect(() => {
    const q = new URLSearchParams(location.search || "");
    if (q.get("view") === "categories") {
      navigate("/medication/categories", { replace: true });
    }
  }, [location.search, navigate]);

  useEffect(() => {
    if (categorySelectOptions.length === 0) {
      setCategory(null);
      return;
    }
    setCategory((prev) => {
      if (prev && categorySelectOptions.some((o) => o.value === prev.value)) {
        return prev;
      }
      return categorySelectOptions[0];
    });
  }, [categorySelectOptions]);

  const openCreateForm = () => {
    setEditingMedicationId(null);
    setCategory(categorySelectOptions[0] ?? null);
    setPetType("dog");
    setPrescription("yes");
    setMedicationName("");
    setGenericName("");
    setNoteText("");
    setClinicPrice("");
    setChewyPrice("");
    setChewyUrl("");
    setPetMedsPrice("");
    setPetMedsUrl("");
    setWalmartPrice("");
    setCostcoPrice("");
    setShowCatalog(false);
  };

  const openEditForm = (row) => {
    const categoryLabel =
      categoryById.get(String(row?.category_id ?? "")) ||
      categoryText(row?.category_name) ||
      categoryText(row?.category) ||
      "";
    const selectedCat =
      categorySelectOptions.find(
        (opt) => String(opt.id) === String(row?.category_id ?? ""),
      ) ||
      (categoryLabel
        ? {
            id: row?.category_id,
            value: categoryLabel,
            label: categoryLabel,
          }
        : null);

    setEditingMedicationId(row?.id ?? null);
    setMedicationName(String(row?.medication_name ?? ""));
    setGenericName(String(row?.generic_name ?? ""));
    setCategory(selectedCat);
    setPetType(String(row?.pet_type ?? "dog").toLowerCase() || "dog");
    setPrescription(
      String(row?.prescription ?? "yes").toLowerCase() === "no" ? "no" : "yes",
    );
    setNoteText(String(row?.Note ?? row?.note ?? ""));
    setClinicPrice(String(row?.clinic_price ?? ""));
    setChewyPrice(String(row?.chewy_price ?? ""));
    setChewyUrl(String(row?.chewy_url ?? ""));
    setPetMedsPrice(String(row?.petMeds_price ?? ""));
    setPetMedsUrl(String(row?.petMeds_url ?? ""));
    setWalmartPrice(String(row?.walmart_price ?? ""));
    setCostcoPrice(String(row?.costco_price ?? ""));
    setShowCatalog(false);
  };

  const closeForm = () => {
    setShowCatalog(true);
    setEditingMedicationId(null);
  };

  const refreshPrices = () => {
    message.info("Would pull from GoodRx API and Chewy affiliate feed");
  };

  const exportCsv = () => {
    message.info("Export would download a CSV in the full version.");
  };

  const updateStale = () => {
    message.success("Stale price update queued.");
  };

  const deleteMedication = (row) => {
    const id = row?.id;
    if (!id) return;
    Modal.confirm({
      title: "Delete this medication?",
      content: row?.medication_name || "This item will be removed.",
      okText: "Delete",
      cancelText: "Cancel",
      okType: "danger",
      centered: true,
      onOk: async () => {
        setDeletingMedicationId(String(id));
        try {
          const body = new FormData();
          body.append("type", "delete_data");
          body.append("table_name", MEDICATIONS_TABLE);
          body.append("id", String(id));
          const res = await apiRequest({ body });
          if (res?.result === false) {
            message.error(res?.message || "Delete failed.");
            return;
          }
          message.success("Medication deleted.");
          await Promise.all([fetchMedications(), fetchMedicationCounts()]);
        } catch (error) {
          console.error(error);
          message.error("Delete failed.");
        } finally {
          setDeletingMedicationId(null);
        }
      },
    });
  };

  const saveMed = async () => {
    const medName = medicationName.trim();
    if (!medName) {
      message.warning("Please enter medication name.");
      return;
    }
    if (!category || !category.value) {
      message.warning("Please select a category.");
      return;
    }
    try {
      setSavingMedication(true);
      const body = new FormData();
      body.append("type", editingMedicationId ? "update_data" : "add_data");
      body.append("table_name", MEDICATIONS_TABLE);
      if (editingMedicationId) {
        body.append("id", String(editingMedicationId));
      }
      body.append("medication_name", medName);
      body.append("generic_name", genericName.trim());
      body.append("category_id", String(category.id || ""));
      body.append("pet_type", petType);
      body.append("prescription", prescription);
      body.append("Note", noteText.trim());
      body.append("clinic_price", String(clinicPrice).trim());
      body.append("chewy_price", String(chewyPrice).trim());
      body.append("chewy_url", chewyUrl.trim());
      body.append("petMeds_price", String(petMedsPrice).trim());
      body.append("petMeds_url", petMedsUrl.trim());
      body.append("walmart_price", String(walmartPrice).trim());
      body.append("costco_price", String(costcoPrice).trim());

      const res = await apiRequest({ body });
      if (res?.result === false) {
        message.error(res?.message || "Medication save failed.");
        return;
      }
      message.success(
        editingMedicationId
          ? "Medication updated successfully."
          : "Medication saved successfully.",
      );
      await Promise.all([fetchMedications(), fetchMedicationCounts()]);
      closeForm();
    } catch (error) {
      console.error(error);
      message.error("Medication save failed.");
    } finally {
      setSavingMedication(false);
    }
  };

  return (
    <div className="medication-panel">
      <Modal
      zIndex={9999}
        title={
          <span className="med-detail-modal-title">
            Medication details
            {detailRow?.medication_name ? (
              <span className="med-detail-modal-sub">
                {" "}
                — {detailRow.medication_name}
              </span>
            ) : null}
          </span>
        }
        open={!!detailRow}
        onCancel={() => setDetailRow(null)}
        footer={
          <div className="med-detail-modal-footer">
            <button
              type="button"
              className="med-btn med-btn-ghost"
              onClick={() => setDetailRow(null)}
            >
              Close
            </button>
            <button
              type="button"
              className="med-btn med-btn-primary"
              onClick={() => {
                const r = detailRow;
                setDetailRow(null);
                if (r) openEditForm(r);
              }}
            >
              Edit medication
            </button>
          </div>
        }
        width={560}
        centered
        destroyOnClose
        className="med-detail-modal-wrap"
        styles={{ body: { paddingTop: 12 } }}
      >
        {detailRow ? (
          <div className="med-detail-modal-body">
            <section className="med-detail-block">
              <div className="med-detail-section-label">Basics</div>
              <div className="med-detail-grid">
                <div className="med-detail-item">
                  <div className="med-detail-dt">ID</div>
                  <div className="med-detail-dd">{detailRow?.id ?? "—"}</div>
                </div>
                <div className="med-detail-item">
                  <div className="med-detail-dt">Medication name</div>
                  <div className="med-detail-dd med-detail-strong">
                    {detailRow?.medication_name || "—"}
                  </div>
                </div>
                <div className="med-detail-item">
                  <div className="med-detail-dt">Generic name</div>
                  <div className="med-detail-dd">{detailRow?.generic_name || "—"}</div>
                </div>
                <div className="med-detail-item">
                  <div className="med-detail-dt">Category</div>
                  <div className="med-detail-dd">{resolveCategoryLabel(detailRow)}</div>
                </div>
                <div className="med-detail-item">
                  <div className="med-detail-dt">Pet type</div>
                  <div className="med-detail-dd">{prettyPetType(detailRow?.pet_type)}</div>
                </div>
                <div className="med-detail-item">
                  <div className="med-detail-dt">Prescription</div>
                  <div className="med-detail-dd">
                    {String(detailRow?.prescription ?? "")
                      .toLowerCase()
                      .trim() === "no"
                      ? "OTC"
                      : "Rx"}
                  </div>
                </div>
              </div>
            </section>

            <section className="med-detail-block">
              <div className="med-detail-section-label">Pricing</div>
              <div className="med-detail-grid">
                <div className="med-detail-item">
                  <div className="med-detail-dt">Vet / clinic price</div>
                  <div className="med-detail-dd med-price-red">
                    {formatMoney(detailRow?.clinic_price)}
                  </div>
                </div>
                <div className="med-detail-item">
                  <div className="med-detail-dt">Chewy price</div>
                  <div className="med-detail-dd med-price-green">
                    {formatMoney(detailRow?.chewy_price)}
                  </div>
                </div>
                <div className="med-detail-item med-detail-item-full">
                  <div className="med-detail-dt">Chewy URL</div>
                  <div className="med-detail-dd">
                    {detailRow?.chewy_url ? (
                      <a
                        href={detailRow.chewy_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="med-detail-link"
                      >
                        {detailRow.chewy_url}
                      </a>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
                <div className="med-detail-item">
                  <div className="med-detail-dt">PetMeds price</div>
                  <div className="med-detail-dd">{formatMoney(detailRow?.petMeds_price)}</div>
                </div>
                <div className="med-detail-item med-detail-item-full">
                  <div className="med-detail-dt">PetMeds URL</div>
                  <div className="med-detail-dd">
                    {detailRow?.petMeds_url ? (
                      <a
                        href={detailRow.petMeds_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="med-detail-link"
                      >
                        {detailRow.petMeds_url}
                      </a>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
                <div className="med-detail-item">
                  <div className="med-detail-dt">Walmart price</div>
                  <div className="med-detail-dd">{formatMoney(detailRow?.walmart_price)}</div>
                </div>
                <div className="med-detail-item">
                  <div className="med-detail-dt">Costco price</div>
                  <div className="med-detail-dd">{formatMoney(detailRow?.costco_price)}</div>
                </div>
              </div>
            </section>

            <section className="med-detail-block">
              <div className="med-detail-section-label">Record</div>
              <div className="med-detail-grid">
                <div className="med-detail-item">
                  <div className="med-detail-dt">Status</div>
                  <div className="med-detail-dd">
                    <span
                      className={`med-status ${String(detailRow?.status ?? "current").toLowerCase().trim() === "stale" ? "med-s-urgent" : "med-s-active"}`}
                    >
                      {String(detailRow?.status ?? "current").toLowerCase().trim() ===
                      "stale"
                        ? "Stale"
                        : "Current"}
                    </span>
                  </div>
                </div>
                <div className="med-detail-item">
                  <div className="med-detail-dt">Last updated</div>
                  <div className="med-detail-dd">{prettyDateTime(detailRow?.updated_at)}</div>
                </div>
                <div className="med-detail-item">
                  <div className="med-detail-dt">Created</div>
                  <div className="med-detail-dd">{prettyDateTime(detailRow?.created_at)}</div>
                </div>
              </div>
            </section>

            <section className="med-detail-block med-detail-notes-block">
              <div className="med-detail-section-label">Note for users</div>
              <div className="med-detail-notes-scroll med-detail-multiline">
                {String(detailRow?.Note ?? detailRow?.note ?? "").trim() || "—"}
              </div>
            </section>
          </div>
        ) : null}
      </Modal>

      {showCatalog ? (
        <>
          <div className="med-page-hdr">
            <div>
              <div className="med-page-title">Medications</div>
              <div className="med-page-sub">
                Manage the medication , update pharmacy prices, and
                manage affiliate links.
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link
                to="/medication/categories"
                className="med-btn med-btn-ghost"
                style={{ textDecoration: "none" }}
              >
                Categories
              </Link>
              {/* <button
                type="button"
                className="med-btn med-btn-ghost"
                onClick={refreshPrices}
              >
                Refresh all prices
              </button> */}
              <button
                type="button"
                className="med-btn med-btn-primary"
                onClick={openCreateForm}
              >
                + Add medication
              </button>
            </div>
          </div>

          <div className="med-stat-grid">
            <div className="med-stat-card">
              <div className="med-stat-lbl">Medications tracked</div>
              <div className="med-stat-val">{stats.total ?? "—"}</div>
              <div className="med-stat-delta med-nt">
                From stats API
              </div>
            </div>
            <div className="med-stat-card">
              <div className="med-stat-lbl">Prices stale &gt;21d</div>
              <div className="med-stat-val" style={{ color: "var(--med-red)" }}>
                {stats.stale ?? "—"}
              </div>
              <div className="med-stat-delta med-dn">
                {stats.stale == null
                  ? "From stats API"
                  : showStaleAlert
                    ? "Need update"
                    : "Up to date"}
              </div>
            </div>
            <div className="med-stat-card">
              <div className="med-stat-lbl">Affiliate clicks</div>
              <div className="med-stat-val">{stats.clicks ?? "—"}</div>
              <div className="med-stat-delta med-up">{stats.clicksLabel}</div>
            </div>
            <div className="med-stat-card">
              <div className="med-stat-lbl">Est. commissions</div>
              <div className="med-stat-val">
                {stats.commissions == null ? "—" : `$${stats.commissions}`}
              </div>
              <div className="med-stat-delta med-up">
                {stats.commissionsLabel}
              </div>
            </div>
          </div>
          {showStaleAlert ? (
            <div className="med-stale-alert">
              <div className="med-stale-alert-text">
                ⚠️ <strong>{stats.stale}</strong> medications have prices older than
                21 days.
                Update them to keep comparisons accurate.
              </div>
              
            </div>
          ) : null}

          <div className="med-card">
            <div className="med-ph">
              <div className="med-pt">
                Medication — {listCount || medications?.length || 0}
              </div>
              <button
                type="button"
                className="med-btn med-btn-ghost med-btn-sm"
                onClick={exportCsv}
              >
                Export CSV
              </button>
            </div>
            <table className="med-tbl">
              <thead>
                <tr>
                  <th>Medication</th>
                  <th>Category</th>
                  <th>Pet</th>
                  <th>Rx</th>
                  <th>Vet price</th>
                  <th>Chewy</th>
                  <th>Last updated</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {medicationsLoading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: 24 }}>
                      <Spinner size={'sm'} color="inherit" />
                    </td>
                  </tr>
                ) : medications.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: 24 }}>
                      <ProductTableNoData title="No medications found." subtitle="There is nothing to show yet." />
                    </td>
                  </tr>
                ) : (
                  medications.map((row) => {
                    const categoryLabel = resolveCategoryLabel(row);
                    const rx = String(row?.prescription ?? "")
                      .toLowerCase()
                      .trim();
                    const rxText = rx === "yes" ? "Rx" : "OTC";
                    const statusRaw = String(row?.status ?? "current")
                      .toLowerCase()
                      .trim();
                    const isStale = statusRaw === "stale";
                    return (
                  <tr key={row.id}>
                    <td className="med-bold">{row?.medication_name || "—"}</td>
                    <td>{categoryLabel}</td>
                    <td>{prettyPetType(row?.pet_type)}</td>
                    <td>
                      <span
                        className={`med-tag ${rx === "yes" ? "med-tg-a" : "med-tg-b"}`}
                      >
                        {rxText}
                      </span>
                    </td>
                    <td className="med-price-red">{formatMoney(row?.clinic_price)}</td>
                    <td className="med-price-green">{formatMoney(row?.chewy_price)}</td>
                    <td>{prettyDate(row?.updated_at || row?.created_at)}</td>
                    <td>
                      <span
                        className={`med-status ${isStale ? "med-s-urgent" : "med-s-active"}`}
                      >
                        {isStale ? "Stale" : "Current"}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{ display: "flex", gap: 4, flexWrap: "wrap" }}
                      >
                        <button
                          type="button"
                          className="med-btn med-btn-ghost med-btn-sm"
                          onClick={() => setDetailRow(row)}
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          className="med-btn med-btn-ghost med-btn-sm"
                          onClick={() => openEditForm(row)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="bg-[#ED5D67] flex justify-center rounded-3 items-center"
                          style={{
                            width: "24px",
                            height: "24px",
                            backgroundColor: "#ED5D67",
                            opacity:
                              deletingMedicationId === String(row?.id) ? 0.7 : 1,
                          }}
                          onClick={() => deleteMedication(row)}
                          disabled={deletingMedicationId === String(row?.id)}
                          aria-label="Delete medication"
                        >
                          <img
                            style={{ width: "14px", height: "auto" }}
                            src={trash}
                            alt=""
                          />
                        </button>
                        {/* <button
                          type="button"
                          className={`med-btn med-btn-sm ${isStale ? "med-btn-amber" : "med-btn-primary"}`}
                          onClick={() =>
                            message.info("Price editor would open here.")
                          }
                        >
                          Prices
                        </button> */}
                      </div>
                    </td>
                  </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            {pageCount > 1 ? (
              <div style={{ padding: "10px 12px 12px" }}>
                <CustomPagination />
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <div className="med-page-hdr">
            <div>
              <div className="med-page-title">
                {editingMedicationId ? "Edit medication" : "Add new medication"}
              </div>
              <div className="med-page-sub">
                Enter details and pharmacy prices. Leave blank if unavailable.
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link
                to="/medication/categories"
                className="med-btn med-btn-ghost"
                style={{ textDecoration: "none" }}
              >
                Categories
              </Link>
              <button
                type="button"
                className="med-btn med-btn-ghost"
                onClick={closeForm}
              >
                <ArrowLeft size={15} /> Back to medication
              </button>
            </div>
          </div>

          <div className="med-two-col">
            <div className="med-card">
              <div className="med-ph">
                <div className="med-pt">Medication details</div>
              </div>
              <div className="med-pb">
                <div style={{ marginBottom: 12 }}>
                  <div className="med-field-lbl">Brand / display name *</div>
                  <input
                    className="med-finput"
                    value={medicationName}
                    onChange={(e) => setMedicationName(e.target.value)}
                    placeholder="e.g. Carprofen 75mg (30 tabs)"
                  />
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--med-ink3)",
                      marginTop: 3,
                    }}
                  >
                    Include dosage and quantity — this is what users see
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div className="med-field-lbl">
                    Generic / active ingredient
                  </div>
                  <input
                    className="med-finput"
                    value={genericName}
                    onChange={(e) => setGenericName(e.target.value)}
                    placeholder="e.g. Carprofen (same as Rimadyl)"
                  />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <div className="med-field-lbl">Category *</div>
                    <Select
                      instanceId="medication-category"
                      inputId="medication-category-input"
                      options={categorySelectOptions}
                      value={category}
                      onChange={(opt) => setCategory(opt)}
                      placeholder={
                        categorySelectOptions.length
                          ? "Select category"
                          : "Add categories first"
                      }
                      classNamePrefix="med-react-select"
                      isSearchable
                      isDisabled={!categorySelectOptions.length}
                      menuPortalTarget={
                        typeof document !== "undefined" ? document.body : null
                      }
                      menuPosition="fixed"
                      styles={medSelectStyles}
                    />
                    {categoriesLoading ? (
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--med-ink3)",
                          marginTop: 4,
                        }}
                      >
                        Loading categories…
                      </div>
                    ) : null}
                  </div>
                  <div>
                    <div className="med-field-lbl">Pet type *</div>
                    <div className="med-pet-row">
                      {[
                        { id: "dog", label: "Dog" },
                        { id: "cat", label: "Cat" },
                        { id: "both", label: "Both" },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={`med-pet-pill ${petType === p.id ? "is-on" : ""}`}
                          onClick={() => setPetType(p.id)}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div className="med-field-lbl">Prescription *</div>
                  <div className="med-pet-row">
                    {[
                      { id: "yes", label: "Yes" },
                      { id: "no", label: "No" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={`med-pet-pill ${prescription === p.id ? "is-on" : ""}`}
                        onClick={() => setPrescription(p.id)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div className="med-field-lbl">Note shown to users</div>
                  <textarea
                    className="med-finput"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows={3}
                    placeholder="e.g. Human generic widely available — major savings vs vet pricing. Ask for written Rx."
                  />
                </div>
              </div>
            </div>

            <div className="med-card">
              <div className="med-ph">
                <div className="med-pt">Pharmacy prices</div>
                <span className="med-tag med-tg-b">Enter what you know</span>
              </div>
              <div className="med-pb">
                <div className="med-vet-box">
                  <div className="med-vet-box-lbl">
                    Typical vet clinic price
                  </div>
                  <input
                    className="med-finput"
                    type="number"
                    value={clinicPrice}
                    onChange={(e) => setClinicPrice(e.target.value)}
                    placeholder="0.00"
                    style={{ color: "var(--med-red)", fontWeight: 600 }}
                  />
                </div>
                <div className="med-pharm-block">
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "var(--med-green)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: 8,
                    }}
                  >
                    Chewy Pharmacy
                  </div>
                  <div className="med-pharm-grid">
                    <input
                      className="med-finput"
                      type="number"
                      value={chewyPrice}
                      onChange={(e) => setChewyPrice(e.target.value)}
                      placeholder="0.00"
                    />
                    <input
                      className="med-finput"
                      value={chewyUrl}
                      onChange={(e) => setChewyUrl(e.target.value)}
                      placeholder="chewy.com/product-link"
                      style={{ fontSize: 10 }}
                    />
                  </div>
                </div>
                <div className="med-pharm-block">
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "var(--med-blue)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: 8,
                    }}
                  >
                    1800 PetMeds
                  </div>
                  <div className="med-pharm-grid">
                    <input
                      className="med-finput"
                      type="number"
                      value={petMedsPrice}
                      onChange={(e) => setPetMedsPrice(e.target.value)}
                      placeholder="0.00"
                    />
                    <input
                      className="med-finput"
                      value={petMedsUrl}
                      onChange={(e) => setPetMedsUrl(e.target.value)}
                      placeholder="1800petmeds.com/..."
                      style={{ fontSize: 10 }}
                    />
                  </div>
                </div>
                <div className="med-pharm-block" style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "var(--med-amber)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: 8,
                    }}
                  >
                    Walmart Pharmacy
                  </div>
                  <input
                    className="med-finput"
                    type="number"
                    value={walmartPrice}
                    onChange={(e) => setWalmartPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="med-pharm-block" style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "var(--med-ink2)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: 8,
                    }}
                  >
                    Costco Pharmacy
                  </div>
                  <input
                    className="med-finput"
                    type="number"
                    value={costcoPrice}
                    onChange={(e) => setCostcoPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <button
                  type="button"
                  className="med-btn med-btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={saveMed}
                  disabled={savingMedication}
                >
                  {savingMedication
                    ? "Saving..."
                    : editingMedicationId
                      ? "Update"
                      : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default MedicationDatabase;
