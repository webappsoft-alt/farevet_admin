import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Spinner from "../Spinner";
import { message, Modal } from "antd";
import { Link } from "react-router-dom";
import { ArrowLeft } from "react-feather";
import ReactPaginate from "react-paginate";
import "./educationArticles.scss";
import { apiRequest } from "../../api/auth_api";
import ProductTableNoData from "../DataTable/NoDataComponent";
import { arrowleft2, arrowright2 } from "../icons/icon";

const TABLE_NAME = "medications_category";
const PAGE_SIZE = 10;

/** API field key for the label is `name`. */
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

function apiOk(res) {
  if (res == null) return false;
  if (res.result === false) return false;
  if (res.result === true) return true;
  if (res.result) return true;
  return !!res.success;
}

const MedicationCategories = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formName, setFormName] = useState("");
  const [saving, setSaving] = useState(false);
  const [listPage, setListPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const categoryInputRef = useRef(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const body = new FormData();
      body.append("type", "get_list");
      body.append("table_name", TABLE_NAME);
      body.append("page", String(listPage));
      const res = await apiRequest({ body });
      if (res && Array.isArray(res.data)) {
        setRows(res.data.map(normalizeCategoryRow));
        setTotalCount(Number(res.count) || res.data.length || 0);
      } else if (res?.data && typeof res.data === "object") {
        const arr = Array.isArray(res.data) ? res.data : [];
        setRows(arr.map(normalizeCategoryRow));
        setTotalCount(Number(res.count) || arr.length || 0);
      } else {
        setRows([]);
        setTotalCount(0);
      }
    } catch (e) {
      console.error(e);
      message.error("Could not load medication categories.");
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [listPage]);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const sortedRows = useMemo(
    () =>
      [...rows]
        .filter((r) => r.name)
        .sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
        ),
    [rows],
  );

  const pageCount = Math.max(1, Math.ceil((totalCount || 0) / PAGE_SIZE));

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

  const openAdd = () => {
    setEditingId(null);
    setFormName("");
    setFormOpen(true);
  };

  const openEdit = useCallback((row) => {
    setEditingId(row.id);
    setFormName(row.name);
    setFormOpen(true);
  }, []);

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const duplicateCategoryExists = useMemo(() => {
    const name = formName.trim().toLowerCase();
    if (!name) return false;
    return rows.some(
      (r) =>
        String(r?.id) !== String(editingId ?? "") &&
        String(r?.name || "")
          .trim()
          .toLowerCase() === name,
    );
  }, [rows, formName, editingId]);

  useEffect(() => {
    if (!formOpen) return;
    const t = setTimeout(() => {
      categoryInputRef.current?.focus?.();
      categoryInputRef.current?.select?.();
    }, 0);
    return () => clearTimeout(t);
  }, [formOpen, editingId]);

  const saveCategory = async () => {
    const name = formName.trim();
    if (!name) {
      message.warning("Please enter a category name.");
      return;
    }
    if (duplicateCategoryExists) {
      message.warning("This category name already exists.");
      return;
    }
    setSaving(true);
    try {
      const isEdit = editingId != null;
      const body = new FormData();
      body.append("type", isEdit ? "update_data" : "add_data");
      body.append("table_name", TABLE_NAME);
      body.append("name", name);
      if (isEdit) {
        body.append("id", String(editingId));
      }
      const res = await apiRequest({ body });
      if (apiOk(res)) {
        message.success(isEdit ? "Category updated." : "Category added.");
        closeForm();
        await fetchCategories();
      } else {
        message.error(res?.message || "Save failed.");
      }
    } catch (e) {
      console.error(e);
      message.error("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = useCallback(
    (row) => {
      Modal.confirm({
        title: "Delete this category?",
        content: (
          <span
            style={{
              fontSize: 14,
              color: "#4a4a68",
            }}
          >
            {row.name}
          </span>
        ),
        okText: "Delete",
        cancelText: "Cancel",
        centered: true,
        width: 460,
        okButtonProps: {
          style: {
            borderRadius: 7,
            padding: "0 16px",
            height: 34,
            fontSize: 12,
            fontWeight: 600,
            background: "#e74c3c",
            borderColor: "#e74c3c",
            boxShadow: "none",
          },
        },
        cancelButtonProps: {
          style: {
            borderRadius: 7,
            padding: "0 16px",
            height: 34,
            fontSize: 12,
            fontWeight: 600,
            color: "#4a4a68",
            borderColor: "#e8e8f0",
            boxShadow: "none",
          },
        },
        onOk: async () => {
          try {
            const body = new FormData();
            body.append("type", "delete_data");
            body.append("table_name", TABLE_NAME);
            body.append("id", String(row.id));
            const res = await apiRequest({ body });
            if (apiOk(res)) {
              message.success("Category deleted.");
              await fetchCategories();
            } else {
              message.error(res?.message || "Delete failed.");
            }
          } catch (e) {
            console.error(e);
            message.error("Delete failed.");
          }
        },
      });
    },
    [fetchCategories],
  );

  const modalLabelStyle = {
    fontSize: 10,
    fontWeight: 700,
    color: "#9b9bb5",
    textTransform: "uppercase",
    letterSpacing: "0.45px",
    marginBottom: 6,
  };

  const modalInputStyle = {
    width: "100%",
    border: "1px solid #e8e8f0",
    borderRadius: 7,
    padding: "7px 10px",
    fontFamily: "Inter, sans-serif",
    fontSize: 12,
    color: "#1a1a2e",
    background: "#f9f9fb",
    outline: "none",
    transition: "border-color 0.15s, background 0.15s",
  };

  return (
    <div className="education-articles-panel">
      <div className="edu-page-hdr">
        <div>
          <div className="edu-page-title">Medication categories</div>
          <div className="edu-page-sub">
            Categories for the medication.

          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link
            to="/medication"
            className="edu-btn edu-btn-ghost"
            style={{ textDecoration: "none" }}
          >
            <ArrowLeft size={15} style={{ marginRight: 6 }} />
            Medication database
          </Link>
          <button
            type="button"
            className="edu-btn edu-btn-primary"
            onClick={openAdd}
          >
            Add category
          </button>
        </div>
      </div>

      <div className="edu-card">
        <div className="edu-ph">
          <div className="edu-pt">Medication categories list</div>
        </div>
        <div>
          <table className="edu-tbl">
            <thead>
              <tr>
                <th style={{ width: 70 }}>#</th>
                <th>Category name</th>
                <th style={{ width: 180 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", padding: 28 }}>
                    <Spinner size={28} />
                  </td>
                </tr>
              ) : sortedRows.length > 0 ? (
                sortedRows.map((row, idx) => (
                  <tr key={String(row.id)}>
                    <td>{(listPage - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="edu-bold">{row.name || "—"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="edu-btn edu-btn-ghost edu-btn-sm"
                          onClick={() => openEdit(row)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="edu-btn edu-btn-red edu-btn-sm"
                          onClick={() => deleteCategory(row)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", padding: 22 }}>
                    <ProductTableNoData title="No categories found." subtitle="There is nothing to show yet." />
                  </td>
                </tr>
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

      <Modal
        title={editingId != null ? "Edit category" : "Add category"}
        open={formOpen}
        onCancel={closeForm}
        destroyOnClose
        centered
        zIndex={9999}
        footer={null}
        width={440}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={modalLabelStyle}>Category name *</div>
            <input
              ref={categoryInputRef}
              style={modalInputStyle}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Pain & inflammation"
              maxLength={120}
              autoFocus
            />
            {duplicateCategoryExists ? (
              <div style={{ marginTop: 6, fontSize: 11, color: "#e74c3c" }}>
                Category name already exists.
              </div>
            ) : null}
          </div>
          <div
            style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
          >
            <button
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                padding: "7px 14px",
                borderRadius: 7,
                fontFamily: "Inter, sans-serif",
                fontSize: 11,
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                border: "1px solid #e8e8f0",
                background: "transparent",
                color: "#4a4a68",
                opacity: saving ? 0.65 : 1,
              }}
              onClick={closeForm}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                padding: "7px 14px",
                borderRadius: 7,
                fontFamily: "Inter, sans-serif",
                fontSize: 11,
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                border: "none",
                background: "#8930f9",
                color: "#fff",
                opacity: saving || duplicateCategoryExists ? 0.75 : 1,
              }}
              onClick={() => void saveCategory()}
              disabled={saving || duplicateCategoryExists}
            >
              {saving ? <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Spinner size="sm" /> <span>Saving...</span></span> : "Save"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MedicationCategories;
