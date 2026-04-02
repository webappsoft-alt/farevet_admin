/* eslint-disable jsx-a11y/img-redundant-alt */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { Modal, Image } from "antd";
import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api/auth_api";
import { FaPhone } from "react-icons/fa6";
import { CircularProgress } from "@mui/material";
import moment from "moment";

const FundCampaign = () => {
  const [lastId, setLastId] = useState(1);
  const [lastId2, setLastId2] = useState(0);
  const [count, setCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [categories, setCategories] = useState([]);

  const safeParse = (value) => {
    if (!value || typeof value !== "string") return value;

    try {
      return JSON.parse(value);
    } catch (e) {
      // console.error("Pet JSON parse failed:", value);
      return null;
    }
  };

  const fieldMappings = [
    { key: "reason", title: "Why are you starting this fundraiser?" },
    { key: "price", title: "What's your fundraising goal? (USD)", prefix: "$" },
    { key: "urgency_level", title: "How urgent is this situation?" },
    { key: "platform", title: "Which platforms do you want to share this on?" },
    { key: "name", title: "Your Name (Optional)" },
    // { key: 'publisher', title: 'Publisher' },
    // { key: 'address', title: 'Address' },
    // { key: 'duration', title: 'Duration' },
    // { key: 'procedure_of', title: 'Procedure' },
    // { key: 'life_threatening', title: 'Life Threatening' },
    // { key: 'negotiate', title: 'Negotiate' },
    // { key: 'medication', title: 'Medication' },
    // { key: 'pet_insurance', title: 'Pet Insurance' },
  ];

  const handleFetchBusiness = async () => {
    setIsProcessing(true);
    try {
      const body = new FormData();
      body.append("type", "get_list");
      body.append("table_name", "fund_campaign");
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
    handleFetchBusiness();
  }, [lastId]);

  const FundCampaignCard = ({ campaign }) => {
    const petInformation = safeParse(campaign?.pet);
    const renderImages = () => {
      if (campaign?.images) {
        try {
          const imagesArray = JSON.parse(campaign?.images);
          if (imagesArray.length > 0) {
            return (
              <div className="d-flex flex-wrap gap-2 mb-2">
                {imagesArray.map((imageUrl, index) => (
                  <div
                    key={index}
                    style={{
                      border: "2px solid #dee2e6",
                      borderRadius: "8px",
                      overflow: "hidden",
                      display: "inline-block",
                    }}
                  >
                    <Image
                      src={`${global.IMAGEURL}/${imageUrl}`}
                      alt={`Campaign image ${index + 1}`}
                      width={60}
                      height={60}
                      style={{
                        objectFit: "cover",
                        cursor: "pointer",
                      }}
                      preview={{ zIndex: 9999 }}
                    />
                  </div>
                ))}
              </div>
            );
          }
        } catch (error) {
          console.error("Error parsing images:", error);
        }
      }
      return (
        <div
          className="text-center py-2 mb-2"
          style={{ backgroundColor: "#f8f9fa", borderRadius: "8px" }}
        >
          <span
            className="plusJakara_regular"
            style={{ color: "#6c757d", fontSize: "0.875rem" }}
          >
            No Images Available
          </span>
        </div>
      );
    };

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
            {/* User Info Header */}
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
                    {campaign?.user?.name}
                  </span>
                  <span
                    className="plusJakara_regular"
                    style={{ fontSize: "0.75rem", color: "#6c757d" }}
                  >
                    {campaign?.user?.email}
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
                    {campaign?.user?.phone || "---"}
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

            {/* Images Section */}
            <div
              className="mb-3"
              style={{
                borderTop: "1px solid #e9ecef",
                paddingTop: "0.75rem",
              }}
            >
              <span
                className="plusJakara_semibold"
                style={{
                  fontSize: "0.85rem",
                  color: "#495057",
                  marginBottom: "0.5rem",
                  display: "block",
                }}
              >
                Campaign Images:
              </span>
              {renderImages()}
            </div>

            {/* Campaign Details */}
            <div
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                paddingRight: "5px",
              }}
            >
              <div className="row">
                {fieldMappings?.map((field) => {
                  let value = campaign?.[field.key];

                  // Handle platform array
                  if (field.key === "platform" && value) {
                    try {
                      const platforms = JSON.parse(value);
                      value = Array.isArray(platforms)
                        ? platforms.join(", ")
                        : value;
                    } catch (error) {
                      // Keep original value if parsing fails
                    }
                  }

                  // Handle price prefix
                  if (field.key === "price" && value) {
                    value = `$${value}`;
                  }

                  // Handle empty values
                  if (
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
            Fund Campaign
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
              Loading campaigns...
            </span>
          </div>
        ) : (
          <>
            {/* Cards Container - 3 Cards Per Row */}
            <div style={{ flexGrow: 1 }}>
              {categories && categories.length > 0 ? (
                <div className="row">
                  {categories.map((campaign) => (
                    <FundCampaignCard key={campaign?.id} campaign={campaign} />
                  ))}
                </div>
              ) : (
                <div className="text-center" style={{ padding: "2rem" }}>
                  <span
                    className="plusJakara_regular"
                    style={{ color: "#6c757d" }}
                  >
                    No campaigns found
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

export default FundCampaign;
