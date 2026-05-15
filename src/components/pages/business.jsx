/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { CircularProgress } from "@mui/material";
import { Input, Modal, Select, message } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Plus, Search, Star } from "react-feather";
import { IoClose } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../api/auth_api";
import { HiDuplicate, HiPencil } from "react-icons/hi";
import { avatar2 } from "../icons/icon";
import {
  CERTIFICATION_OPTIONS,
  CLINIC_TYPE_OPTIONS,
  OWNERSHIP_OPTIONS,
} from "./businessComponents/businessOptions";
import "./business.scss";

/**
 * Read a (possibly stringified JSON / CSV) list field on a business row.
 * Backend may return: array, JSON string, or comma-separated text.
 */
function readListField(row, ...keys) {
  for (const k of keys) {
    const v = row?.[k];
    if (v == null || v === "") continue;
    if (Array.isArray(v)) return v.filter(Boolean).map((x) => String(x).trim());
    if (typeof v === "string") {
      const s = v.trim();
      if (!s) continue;
      if (s.startsWith("[")) {
        try {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed)) {
            return parsed.filter(Boolean).map((x) => String(x).trim());
          }
        } catch {
          /* fall through to CSV */
        }
      }
      return s
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function readScalarField(row, ...keys) {
  for (const k of keys) {
    const v = row?.[k];
    if (v == null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return "";
}

const Business = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteDeal, setShowDeleteDeal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalPages, setTotalPages] = useState(null);
  const [selectItem, setSelectItem] = useState(null);
  const [value, setValue] = useState("");
  const [totalDataCount, setTotalDataCount] = useState(0);
  const [categories, setCategories] = useState([]);

  // Filters
  const [certifications, setCertifications] = useState([]);
  const [clinicType, setClinicType] = useState(undefined);
  const [ownership, setOwnership] = useState(undefined);

  const navigate = useNavigate();

  const handleClick = (row) => {
    setSelectItem(row);
    setShowDeleteDeal(true);
  };

  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  const handleChange = (e) => {
    const searchValue = e?.target?.value?.toLowerCase().trim();
    setValue(searchValue);
    setCurrentPage(1);
  };

  const handleFetchData = async (page) => {
    setIsProcessing(true);
    const body = new FormData();
    body.append("type", "get_list");
    body.append("table_name", "businesses");
    body.append("business_created", "admin");
    body.append("page", page);

    if (value && value !== "") {
      body.append("search", value);
    }
    try {
      const res = await apiRequest({ body });
      setIsProcessing(false);
      if (res) {
        setCategories(res?.data || []);
        setTotalDataCount(res?.count || 0);
        setTotalPages(Math.ceil((res?.count || 0) / 10));
      } else {
        console.error("Creation failed...");
      }
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteService = async (row) => {
    const body = new FormData();
    body.append("type", "delete_data");
    body.append("table_name", "businesses");
    body.append("id", row?.id);
    await apiRequest({ body })
      .then(async (res) => {
        if (res) {
          message.success("Business Deleted Successfully");
          handleFetchData(currentPage);
          setShowDeleteDeal(false);
        } else {
          message.error("Deletion failed...");
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  useEffect(() => {
    handleFetchData(currentPage, value);
  }, [currentPage, value]);

  const handleBusinessClick = (business) => {
    navigate(`/business/${business?.id}`, {
      state: { businessStore: business },
    });
  };

  /** Apply client-side filtering on top of the server-fetched list. */
  const filteredBusinesses = useMemo(() => {
    return (categories || []).filter((item) => {
      if (certifications.length) {
        const rowCerts = readListField(
          item,
          "certifications",
          "certification",
          "certificates",
          "tags",
        ).map((c) => c.toLowerCase());
        const allMatch = certifications.every((sel) =>
          rowCerts.includes(String(sel).toLowerCase()),
        );
        if (!allMatch) return false;
      }
      if (clinicType) {
        const rowType = readScalarField(
          item,
          "clinic_type",
          "type",
          "business_type",
        ).toLowerCase();
        if (rowType !== String(clinicType).toLowerCase()) return false;
      }
      if (ownership) {
        const rowOwn = readScalarField(item, "ownership", "owner_type").toLowerCase();
        if (rowOwn !== String(ownership).toLowerCase()) return false;
      }
      return true;
    });
  }, [categories, certifications, clinicType, ownership]);

  const activeFilterCount =
    (certifications.length > 0 ? 1 : 0) +
    (clinicType ? 1 : 0) +
    (ownership ? 1 : 0);

  const clearFilters = () => {
    setCertifications([]);
    setClinicType(undefined);
    setOwnership(undefined);
  };

  return (
    <main className="business-page container m-auto height_calc flex-grow flex flex-col p-3">
      <div className="flex w-full justify-between my-4 items-center flex-wrap gap-3">
        <div className="flex flex-col">
          <span className="text_dark plusJakara_medium text-2xl md:text-3xl">
            Business
          </span>
          <span className="text_secondary inter_regular text-xs md:text-sm">
            Browse, filter, and manage business profiles.
          </span>
        </div>
        <button
          onClick={() => {
            navigate("/business/create-business");
          }}
          className="flex justify-center bg_primary p-2 rounded-3 items-center gap-2 button_shadow"
        >
          <Plus size={18} className="hidden md:block text_white" />
          <span className="inter_semibold max-md:text-xs text-sm text_white">
            Create New Business
          </span>
        </button>
      </div>

      <div className="business-toolbar">
        <Input
          prefix={<Search className="text_secondary" size={16} />}
          className="business-search py-2"
          onChange={handleChange}
          placeholder="Search by name or address"
          type="text"
          size="large"
          allowClear
        />
        {/* <Select
          className="business-select"
          mode="multiple"
          allowClear
          size="large"
          maxTagCount="responsive"
          placeholder="Certifications"
          value={certifications}
          onChange={(vals) => setCertifications(vals || [])}
          options={CERTIFICATION_OPTIONS.map((c) => ({ label: c, value: c }))}
        />
        <Select
          className="business-select"
          allowClear
          size="large"
          placeholder="Clinic Type"
          value={clinicType}
          onChange={(v) => setClinicType(v)}
          options={CLINIC_TYPE_OPTIONS.map((c) => ({ label: c, value: c }))}
        />
        <Select
          className="business-select"
          allowClear
          size="large"
          placeholder="Ownership"
          value={ownership}
          onChange={(v) => setOwnership(v)}
          options={OWNERSHIP_OPTIONS.map((c) => ({ label: c, value: c }))}
        /> */}
      </div>

      {activeFilterCount > 0 ? (
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <span className="text_secondary inter_medium text-xs">
            Showing {filteredBusinesses.length} of {categories.length} on this
            page
            <span className="business-filter-active-count">{activeFilterCount}</span>
          </span>
          <button
            type="button"
            onClick={clearFilters}
            className="text_primary inter_semibold text-xs underline-offset-2 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : null}

      {isProcessing ? (
        <div className="flex w-full justify-center items-center my-5">
          <CircularProgress className="text_primary" size={30} thickness={3} />
        </div>
      ) : (
        <div className="business-grid">
          {filteredBusinesses.length === 0 ? (
            <div className="business-empty">
              <span className="business-empty-title">No businesses match</span>
              <span className="business-empty-sub">
                {activeFilterCount > 0
                  ? "Try removing one of the filters above or clear all to see every business on this page."
                  : "There are no businesses to show. Add your first one to get started."}
              </span>
            </div>
          ) : (
            filteredBusinesses.map((item, i) => {
              const rating = parseFloat(item?.rating?.rating ?? item?.rating ?? 0);
              const filledStars =
                Number.isFinite(rating) && rating > 0
                  ? Math.min(5, Math.round(rating))
                  : 0;

              return (
                <article
                  key={item?.id ?? i}
                  className="business-card"
                  role="button"
                  tabIndex={0}
                  aria-label={`${item?.name || "Business"}${Number.isFinite(rating) && rating > 0 ? `, rating ${rating.toFixed(1)} of 5` : ""}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleBusinessClick(item);
                    }
                  }}
                  onClick={() => handleBusinessClick(item)}
                >
                  <div
                    className="business-card-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      title="Edit"
                      className="business-card-icon-btn"
                      onClick={() =>
                        navigate(`/business/update-business/${item?.id}`, {
                          state: { serviceDetail: item },
                        })
                      }
                    >
                      <HiPencil size={16} className="business-card-icon-svg" />
                    </button>
                    {/* <button
                      type="button"
                      title="Duplicate"
                      className="business-card-icon-btn"
                      onClick={() =>
                        navigate("/business/create-business", {
                          state: { businessData: item },
                        })
                      }
                    >
                      <HiDuplicate size={16} className="business-card-icon-svg" />
                    </button> */}
                    <button
                      type="button"
                      title="Delete"
                      className="business-card-icon-btn is-danger"
                      onClick={() => handleClick(item)}
                    >
                      <IoClose size={16} className="business-card-icon-svg" />
                    </button>
                  </div>

                  <div className="business-card-body">
                    <img
                      src={
                        item?.logo ? `${global.IMAGEURL}/${item?.logo}` : avatar2
                      }
                      className="business-card-logo"
                      alt=""
                    />
                    <div className="business-card-text">
                      <span className="business-card-title">{item?.name}</span>
                      <span className="business-card-address">
                        {item?.address || "—"}
                      </span>
                      <div className="business-card-stars" aria-hidden>
                        {[0, 1, 2, 3, 4].map((idx) => (
                          <Star
                            key={idx}
                            size={16}
                            strokeWidth={0}
                            fill={idx < filledStars ? "#EFD01D" : "#cbd5e1"}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      <div className="business-pagination">
        <div className="flex justify-between items-center border shadow-sm bg_white rounded-3 w-full py-2 px-3 overflow-x-auto">
          <span
            style={{ minWidth: "200px" }}
            className="text_secondary inter_medium text"
          >{`Total showing ${totalDataCount}`}</span>
          <div className="flex">
            <button
              className={`px-3 py-1 text-sm border rounded-l-md ${
                currentPage === 1
                  ? "bg_white text_dark cursor-not-allowed"
                  : ""
              }`}
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              <ArrowLeft size={16} className="text_secondary" />
            </button>
            <div className="flex">
              {Array.from({ length: totalPages || 0 }, (_, i) => i + 1).map(
                (page, i) => (
                  <button
                    key={i}
                    className={`px-3 py-1 text-sm border ${
                      currentPage === page
                        ? "bg_primary text_white cursor-not-allowed"
                        : "bg_white text_dark"
                    }`}
                    disabled={currentPage === page}
                    onClick={() => handlePageClick(page)}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>
            <button
              className={`px-3 py-1 text-sm border rounded-r-md ${
                currentPage >= totalPages ? "cursor-not-allowed" : ""
              }`}
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
            >
              <ArrowRight size={16} className="text_secondary" />
            </button>
          </div>
        </div>
      </div>

      <Modal
        centered
        open={showDeleteDeal}
        onCancel={() => setShowDeleteDeal(false)}
        footer={null}
      >
        <span className="text_dark text-xl plusJakara_medium">
          Are you want to delete this business?
        </span>
        <div className="flex justify-center gap-2 w-full my-3">
          <button
            type="button"
            className="border cursor-pointer rounded-lg gap-1 px-3 py-2 inter_medium text-sm flex justify-center items-center bg_primary text_white"
            onClick={() => handleDeleteService(selectItem)}
          >
            Yes
          </button>
          <button
            type="button"
            className="border cursor-pointer rounded-lg gap-1 px-3 py-2 inter_medium text-sm flex justify-center items-center bg_white text_secondary"
            onClick={() => setShowDeleteDeal(false)}
          >
            No
          </button>
        </div>
      </Modal>
    </main>
  );
};

export default Business;
