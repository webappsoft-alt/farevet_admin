/* eslint-disable jsx-a11y/img-redundant-alt */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { Image } from "antd";
import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api/auth_api";
import { FaPhone } from "react-icons/fa6";
import { CircularProgress } from "@mui/material";
import moment from "moment";

const ServicesBudget = () => {
  const [lastId, setLastId] = useState(1);
  const [lastId2, setLastId2] = useState(0);
  const [count, setCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [categories, setCategories] = useState([]);

  const robustParse = (value) => {
    if (!value || typeof value !== "string") return null;

    try {
      return JSON.parse(value);
    } catch (e) {
      // Attempt to salvage truncated JSON using Regex
      const result = {};
      let found = false;

      const nameMatch = value.match(/"name":"([^"]*?)"/);
      if (nameMatch) {
        result.name = nameMatch[1];
        found = true;
      }

      const imageMatch = value.match(/"image":"([^"]*?)"/);
      if (imageMatch) {
        result.image = imageMatch[1];
        result.thumb = "";
        found = true;
      } // truncated image might work if thumb fallback fails

      const thumbMatch = value.match(/"thumb":"([^"]*?)"/);
      if (thumbMatch) {
        result.thumb = thumbMatch[1];
        found = true;
      }

      const speciesMatch = value.match(/"species":"([^"]*?)"/);
      if (speciesMatch) {
        result.species = speciesMatch[1];
        found = true;
      }

      const breedMatch = value.match(/"breed":"([^"]*?)"/);
      if (breedMatch) {
        result.breed = breedMatch[1];
        found = true;
      }

      const genderMatch = value.match(/"gender":"([^"]*?)"/);
      if (genderMatch) {
        result.gender = genderMatch[1];
        found = true;
      }

      const weightMatch = value.match(/"weight":"([^"]*?)"/);
      if (weightMatch) {
        result.weight = weightMatch[1];
        found = true;
      }

      const dobMatch = value.match(/"dob":"([^"]*?)"/);
      if (dobMatch) {
        result.dob = dobMatch[1];
        found = true;
      }

      if (found) return result;

      // Handle simple strings like "Dog", "Rabbit"
      if (!value.trim().startsWith("{") && value.trim().length > 0) {
        return { species: value, name: "Unknown" };
      }

      return null;
    }
  };

  const fieldMappings = [
    {
      key: "current_budget",
      title: "What is your current monthly pet budget ($)?",
      prefix: "$",
    },
    { key: "budget_concerns", title: "What are you most concerned about?" },
    {
      key: "upcoming_expenses",
      title: "Any upcoming expenses we should factor in?",
    },
    {
      key: "target_budget",
      title: "What's your target monthly spend on pet care ($)?",
      prefix: "$",
    },
    { key: "insurance", title: "Do you currently have pet insurance?" },
    { key: "address", title: "Where are you located?" },
  ];

  const handleFetchBudget = async () => {
    setIsProcessing(true);
    try {
      const body = new FormData();
      body.append("type", "get_list");
      body.append("table_name", "services_budget");
      body.append("page", lastId);
      const res = await apiRequest({ body });
      if (res && res.data && res.data.length > 0) {
        setCategories(res?.data);
        const totalCount = res?.count || 0;
        const pageCount = Math.ceil(totalCount / 10);
        setCount(pageCount);
      }
      setIsProcessing(false);
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
    }
  };

  // Parse JSON strings to arrays
  const parseJsonField = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        return parsed.join(", ");
      }
      return jsonString;
    } catch (e) {
      return jsonString || "N/A";
    }
  };

  // Pagination handlers
  const handlePrevPage = () => {
    if (lastId > 1) {
      setLastId(lastId - 1);
      setLastId2(lastId2 - 1);
    }
  };

  const handleNextPage = () => {
    if (lastId < count) {
      setLastId(lastId + 1);
      setLastId2(lastId2 + 1);
    }
  };

  useEffect(() => {
    handleFetchBudget();
  }, [lastId]);

  const BudgetCard = ({ budget }) => {
    const petInformation = robustParse(budget?.pet);
    return (
      <div className="col-lg-4 col-md-6 col-sm-12 mb-4">
        <div
          className="card h-100"
          style={{
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            borderRadius: "8px",
          }}
        >
          <div className="card-body p-3">
            {/* User Info Header - Compact */}
            <div
              style={{
                borderBottom: "1px solid #e9ecef",
                paddingBottom: "0.75rem",
                marginBottom: "0.75rem",
              }}
            >
              <div className="d-flex justify-content-between align-items-start">
                <div className="d-flex flex-column">
                  <span
                    className="plusJakara_semibold"
                    style={{ fontSize: "1rem", color: "#343a40" }}
                  >
                    {budget?.user?.name}
                  </span>
                  <span
                    className="plusJakara_regular"
                    style={{ fontSize: "0.75rem", color: "#6c757d" }}
                  >
                    {budget?.user?.email}
                  </span>
                  <span
                    className="plusJakara_semibold d-flex align-items-center"
                    style={{
                      fontSize: "0.75rem",
                      color: "#495057",
                      gap: "0.25rem",
                    }}
                  >
                    <FaPhone size={10} />
                    {budget?.user?.phone || "---"}
                  </span>
                </div>
              </div>
            </div>

            {/* Pet Information */}
            <p className="plusJakara_semibold">Pet Information</p>
            {petInformation ? (
              <>
                <div
                  className="d-flex align-items-center mb-3"
                  style={{ gap: "1rem" }}
                >
                  <div
                    style={{
                      flexShrink: 0,
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "1px solid #dee2e6",
                    }}
                  >
                    <Image
                      src={
                        petInformation?.thumb ||
                        (petInformation?.image
                          ? `${global.IMAGEURL}/${petInformation.image}`
                          : "https://placehold.co/100x100?text=Pet")
                      }
                      alt={petInformation?.name}
                      width={80}
                      height={80}
                      style={{
                        objectFit: "cover",
                      }}
                      preview={{ zIndex: 9999 }}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                  <div className="d-flex flex-column">
                    <span
                      className="plusJakara_semibold"
                      style={{ fontSize: "1.1rem", color: "#343a40" }}
                    >
                      {petInformation?.name || "Unknown Pet"}
                    </span>
                    <span
                      className="plusJakara_regular"
                      style={{ fontSize: "0.85rem", color: "#6c757d" }}
                    >
                      {[petInformation?.species, petInformation?.breed]
                        .filter(Boolean)
                        .join(" • ")}
                    </span>
                    <span
                      className="plusJakara_regular"
                      style={{ fontSize: "0.85rem", color: "#6c757d" }}
                    >
                      {[petInformation?.gender, petInformation?.weight]
                        .filter(Boolean)
                        .join(" • ")}
                    </span>
                    {petInformation?.dob && (
                      <span
                        className="plusJakara_regular"
                        style={{ fontSize: "0.85rem", color: "#6c757d" }}
                      >
                        DOB: {moment(petInformation.dob).format("M/D/YYYY")}
                      </span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div
                className="p-2 mb-3 text-muted"
                style={{ fontSize: "0.85rem", fontStyle: "italic" }}
              >
                Pet information not available.
              </div>
            )}

            <div
              style={{
                maxHeight: "300px",
                borderTop: "1px solid #e9ecef",
                paddingTop: "0.75rem",
                overflowY: "auto",
                paddingRight: "5px",
              }}
            >
              <div className="row">
                {fieldMappings?.map((field) => {
                  let value = budget?.[field.key];

                  // Special handling for JSON fields
                  if (
                    field.key === "budget_concerns" ||
                    field.key === "upcoming_expenses"
                  ) {
                    value = parseJsonField(value);
                  }

                  // Handle budget values with prefix
                  if (
                    (field.key === "current_budget" ||
                      field.key === "target_budget") &&
                    value
                  ) {
                    value = `${field.prefix}${value}`;
                  } else if (
                    !value ||
                    value === "" ||
                    value === null ||
                    value === undefined
                  ) {
                    value = "N/A";
                  }

                  return (
                    <div key={field.key} className="col-12 mb-2">
                      <div className="d-flex flex-column gap-1">
                        <span
                          className="plusJakara_semibold"
                          style={{
                            fontSize: "0.85rem",
                            color: "#495057",
                            marginBottom: "0.125rem",
                          }}
                        >
                          {field.title}
                        </span>
                        <span
                          className="plusJakara_regular"
                          style={{
                            fontSize: "0.75rem",
                            color: "#6c757d",
                            backgroundColor: "#f8f9fa",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "4px",
                            wordBreak: "break-word",
                          }}
                        >
                          {value}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <main
        className="m-auto height_calc"
        style={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          padding: "1rem",
        }}
      >
        <div className="d-flex w-100 mb-4">
          <span
            className="text_dark plusJakara_medium"
            style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)" }}
          >
            Pet Budget Services
          </span>
        </div>

        {isProcessing ? (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ padding: "2rem" }}
          >
            <CircularProgress size={18} />
            <span
              className="plusJakara_regular"
              style={{ marginLeft: "0.5rem", color: "#6c757d" }}
            >
              Loading budget services...
            </span>
          </div>
        ) : (
          <>
            {/* Cards Container - 3 Cards Per Row */}
            <div style={{ flexGrow: 1 }}>
              {categories && categories.length > 0 ? (
                <div className="row">
                  {categories.map((budget) => (
                    <BudgetCard key={budget?.id} budget={budget} />
                  ))}
                </div>
              ) : (
                <div className="text-center" style={{ padding: "2rem" }}>
                  <span
                    className="plusJakara_regular"
                    style={{ color: "#6c757d" }}
                  >
                    No budget services found
                  </span>
                </div>
              )}
            </div>

            {/* Pagination */}
            {count > 1 && (
              <div
                className="d-flex justify-content-center align-items-center"
                style={{ gap: "1rem", marginTop: "1.5rem", padding: "1rem" }}
              >
                <button
                  onClick={handlePrevPage}
                  disabled={lastId === 1}
                  className={`btn plusJakara_medium ${
                    lastId === 1 ? "btn-secondary" : "btn-primary"
                  }`}
                  style={{ opacity: lastId === 1 ? 0.5 : 1 }}
                >
                  Previous
                </button>
                <span
                  className="plusJakara_regular"
                  style={{ color: "#6c757d" }}
                >
                  Page {lastId} of {count}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={lastId === count}
                  className={`btn plusJakara_medium ${
                    lastId === count ? "btn-secondary" : "btn-primary"
                  }`}
                  style={{ opacity: lastId === count ? 0.5 : 1 }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
};

export default ServicesBudget;
