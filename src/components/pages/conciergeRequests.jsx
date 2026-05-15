import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { message, Modal } from "antd";
import ReactPaginate from "react-paginate";
import { Spinner } from "react-bootstrap";
import { arrowleft2, arrowright2, trash } from "../icons/icon";
import ProductTableNoData from "../DataTable/NoDataComponent";
import { apiRequest } from "../../api/auth_api";
import "./medicationDatabase.scss";
import { useNavigate } from "react-router-dom";

const CONCIERGE_TABLE = "concierge_requests";
const PAGE_SIZE = 10;

function normalizeStatus(value) {
  const raw = String(value ?? "").toLowerCase().trim();
  if (raw === "cancelled") return "canceled";
  if (raw === "complete") return "completed";
  return raw || "pending";
}

function statusPillClass(status) {
  if (status === "completed") return "med-status med-s-active";
  if (status === "canceled") return "med-status med-s-urgent";
  return "med-tag med-tg-b";
}

function prettyText(value) {
  const text = String(value ?? "").trim();
  if (!text) return "—";
  return text
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function prettyDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const ConciergeRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [listPage, setListPage] = useState(1);
  const [listCount, setListCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serverStats, setServerStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search.trim());
      setListPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const body = new FormData();
      body.append("type", "get_list");
      body.append("table_name", CONCIERGE_TABLE);
      body.append("page", String(listPage));
      if (searchDebounced) {
        body.append("search", searchDebounced);
      }
      if (statusFilter !== "all") {
        body.append("status", statusFilter);
      }
      const res = await apiRequest({ body });
      if (res && Array.isArray(res.data)) {
        setRequests(res.data);
        setListCount(Number(res.count) || res.data.length || 0);
      } else if (Array.isArray(res)) {
        setRequests(res);
        setListCount(res.length);
      } else {
        setRequests([]);
        setListCount(0);
      }
    } catch (error) {
      console.error(error);
      setRequests([]);
      setListCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [listPage, searchDebounced, statusFilter]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const body = new FormData();
      body.append("type", "concierge_requests_counts");
      const res = await apiRequest({ body });
      // Be tolerant of slightly different response shapes.
      // Examples we accept:
      //   { total, pending, canceled, completed }
      //   { data: { total, pending, ... } }
      //   { total_requests, pending_requests, canceled_requests, completed_requests }
      const payload = res?.data && typeof res.data === "object" ? res.data : res;
      if (!payload || typeof payload !== "object") {
        setServerStats(null);
        return;
      }
      const pickNum = (...keys) => {
        for (const k of keys) {
          const v = payload?.[k];
          if (v === undefined || v === null || v === "") continue;
          const n = Number(v);
          if (Number.isFinite(n)) return n;
        }
        return null;
      };
      const next = {
        total: pickNum("total", "total_requests", "all", "all_requests"),
        pending: pickNum("pending", "pending_requests"),
        canceled: pickNum(
          "canceled",
          "cancelled",
          "canceled_requests",
          "cancelled_requests",
        ),
        completed: pickNum("completed", "completed_requests"),
      };
      const hasAny = Object.values(next).some((v) => v !== null);
      setServerStats(hasAny ? next : null);
    } catch (error) {
      console.error(error);
      setServerStats(null);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const handleDelete = (row) => {
    if (!row?.id) return;
    Modal.confirm({
      title: "Delete concierge request?",
      content: `Submission ID: ${row?.submission_id || row?.id}`,
      okText: "Delete",
      cancelText: "Cancel",
      okType: "danger",
      centered: true,
      onOk: async () => {
        try {
          setDeletingId(String(row.id));
          const body = new FormData();
          body.append("type", "delete_data");
          body.append("table_name", CONCIERGE_TABLE);
          body.append("id", String(row.id));
          const res = await apiRequest({ body });
          if (res?.result === false) {
            message.error(res?.message || "Delete failed.");
            return;
          }
          message.success("Concierge request deleted.");
          await Promise.all([fetchRequests(), fetchStats()]);
        } catch (error) {
          console.error(error);
          message.error("Delete failed.");
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const stats = useMemo(() => {
    // Client-side fallback derived from the visible page only.
    const counts = {
      total: requests.length,
      pending: 0,
      canceled: 0,
      completed: 0,
    };
    requests.forEach((row) => {
      const status = normalizeStatus(row?.status);
      if (status === "completed") counts.completed += 1;
      else if (status === "canceled") counts.canceled += 1;
      else counts.pending += 1;
    });
    return counts;
  }, [requests]);

  /** Prefer authoritative counts from the server when available, otherwise
   *  fall back to the page-level derived counts. Each card falls back
   *  independently so a missing key on the server doesn't blank the card. */
  const displayStats = useMemo(() => {
    return {
      total: serverStats?.total ?? stats.total,
      pending: serverStats?.pending ?? stats.pending,
      canceled: serverStats?.canceled ?? stats.canceled,
      completed: serverStats?.completed ?? stats.completed,
    };
  }, [serverStats, stats]);

  const renderStatValue = (key, color) => {
    if (isLoadingStats && serverStats === null) {
      return (
        <div
          className="med-stat-val"
          style={{ color, opacity: 0.5 }}
          aria-busy
        >
          …
        </div>
      );
    }
    return (
      <div className="med-stat-val" style={color ? { color } : undefined}>
        {displayStats[key]}
      </div>
    );
  };

  const pageCount = Math.max(1, Math.ceil((listCount || 0) / PAGE_SIZE));

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
      onPageChange={(page) => setListPage(page.selected + 1)}
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

  return (
    <div className="medication-panel">
      <div className="med-page-hdr">
        <div>
          <div className="med-page-title">FareVet Concierge</div>
          <div className="med-page-sub">
            Track concierge submissions and monitor request progress.
          </div>
        </div>
      </div>

      <div className="med-stat-grid">
        <div className="med-stat-card">
          <div className="med-stat-lbl">Total Requests</div>
          {renderStatValue("total")}
          <div className="med-stat-delta med-nt">All concierge submissions</div>
        </div>
        <div className="med-stat-card">
          <div className="med-stat-lbl">Pending Requests</div>
          {renderStatValue("pending", "var(--med-primary)")}
          <div className="med-stat-delta med-nt">Need review</div>
        </div>
        <div className="med-stat-card">
          <div className="med-stat-lbl">Canceled Requests</div>
          {renderStatValue("canceled", "var(--med-red)")}
          <div className="med-stat-delta med-dn">Closed without completion</div>
        </div>
        <div className="med-stat-card">
          <div className="med-stat-lbl">Completed Requests</div>
          {renderStatValue("completed", "var(--med-green)")}
          <div className="med-stat-delta med-up">Successfully delivered</div>
        </div>
      </div>

      <div className="med-card">
        <div className="med-ph">
          <div className="med-pt">FareVet Concierge — {listCount || requests.length || 0}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "nowrap" }}>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search requests..."
              className="med-finput"
              style={{ width: 240 }}
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setListPage(1);
              }}
              className="med-fsel"
              aria-label="Filter by status"
            >
              <option value="all">All status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Canceled</option>
            </select>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="med-tbl" style={{ minWidth: 1080 }}>
            <thead>
              <tr>
                <th>Submission ID</th>
                <th>Pet</th>
                <th>Procedure</th>
                <th>Customer</th>
                <th>Location</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Submitted At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: 24 }}>
                    <Spinner size="sm" color="inherit" />
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: 24 }}>
                    <ProductTableNoData
                      title="No concierge requests found."
                      subtitle="There is nothing to show yet."
                    />
                  </td>
                </tr>
              ) : (
                requests.map((row, index) => {
                  const status = normalizeStatus(row?.status);
                  return (
                    <tr key={row?.id || row?.submission_id || index}>
                      <td className="med-bold">
                        {row?.submission_id || row?.id || "—"}
                      </td>
                      <td>
                        {row?.pet_name || "—"} ({prettyText(row?.species)})
                      </td>
                      <td>
                        <div>{prettyText(row?.procedure_category)}</div>
                        <div style={{ fontSize: 11, color: "var(--med-ink3)" }}>
                          {row?.description || "—"}
                        </div>
                      </td>
                      <td>
                        <div>{row?.customer_name || "—"}</div>
                        <div style={{ fontSize: 11, color: "var(--med-ink3)" }}>
                          {row?.customer_email || "—"}
                        </div>
                      </td>
                      <td>{row?.location || "—"}</td>
                      <td>{prettyText(row?.urgency)}</td>
                      <td>
                        <span className={statusPillClass(status)}>
                          {prettyText(status)}
                        </span>
                      </td>
                      <td>{prettyDate(row?.created_at)}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                          <button
                            type="button"
                            className="med-btn med-btn-ghost med-btn-sm"
                            onClick={() => navigate(`/concierge-requests/${row?.id}`)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="bg-[#ED5D67] flex justify-center rounded-3 items-center"
                            style={{
                              width: "24px",
                              height: "24px",
                              backgroundColor: "#ED5D67",
                              opacity: deletingId === String(row?.id) ? 0.7 : 1,
                            }}
                            onClick={() => handleDelete(row)}
                            disabled={deletingId === String(row?.id)}
                            aria-label="Delete concierge request"
                          >
                            <img
                              style={{ width: "14px", height: "auto" }}
                              src={trash}
                              alt=""
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {pageCount > 1 ? (
          <div style={{ padding: "10px 12px 12px" }}>
            <CustomPagination />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ConciergeRequests;
