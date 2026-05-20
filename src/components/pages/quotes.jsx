/* eslint-disable jsx-a11y/img-redundant-alt */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { Modal, Select, message, Image } from "antd";
import { useEffect, useState } from "react";
import { FaPhone } from "react-icons/fa6";
import { apiRequest } from "../../api/auth_api";
import { CircularProgress } from "@mui/material";
import moment from "moment";

import { Send } from "react-feather";
import { messageicon } from "../icons/icon";
const { Option } = Select;

const Quotes = () => {
  const [lastId, setLastId] = useState(1);
  const [lastId2, setLastId2] = useState(0);
  const [count, setCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subAdmins, setSubAdmins] = useState([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const fieldMappings = [
    { key: "procedure_of", title: "What procedure does your pet need?" },
    { key: "reason", title: "Why?" },
    {
      key: "amount",
      title: "How much did your current vet quote you for this procedure?",
      prefix: "$",
    },
    {
      key: "medication",
      title: "Does this quote include medication and follow-up care?",
    },
    { key: "address", title: "Where is your current vet located?" },
    {
      key: "distance",
      title: "Are you willing to travel for a lower-cost option?",
    },
    { key: "duration", title: "How soon do you need this procedure?" },
    {
      key: "negotiate",
      title:
        "Would you like us to negotiate with your current vet to match a lower price?",
    },
    {
      key: "budget_procedure",
      title: "What is your budget for this procedure?",
    },
    {
      key: "pet_insurance",
      title: "Does your pet have insurance? Which Provider?",
    },
    { key: "life_threatening", title: "Is this a life-threatening emergency?" },
    {
      key: "emergency_vet",
      title: "Would you like to be connected with an emergency vet?",
    },
    {
      key: "receive_quote",
      title: "How would you like to receive your updated quote?",
    },
    { key: "vet_bill", title: "Vet Bills" },
  ];

  const statusOptions = [
    { value: "in_review", label: "In Review", color: "#ffc107", icon: "🔄" },
    { value: "need_file", label: "Needs File", color: "#dc3545", icon: "🔴" },
    { value: "completed", label: "Completed", color: "#28a745", icon: "🟢" },
    { value: "un_assign", label: "Unassigned", color: "#6c757d", icon: "⚪" },
  ];

  const userData = JSON.parse(
    window.localStorage.getItem("login_farevet_formData"),
  );
  console.log(userData, "user_type");

  const isSubAdmin = userData?.admin_type === "sub_admin";

  const handleFetchSubAdmins = async () => {
    try {
      const body = new FormData();
      body.append("type", "get_list");
      body.append("table_name", "admin");
      const res = await apiRequest({ body });
      if (res && res.data && res.data.length > 0) {
        const subAdminUsers = res?.data?.filter(
          (user) => user.admin_type === "sub_admin",
        );
        setSubAdmins(subAdminUsers);
      }
    } catch (error) {
      console.error("Error fetching sub-admins:", error);
    }
  };

  const handleFetchBusiness = async () => {
    setIsProcessing(true);
    try {
      const body = new FormData();
      body.append("type", "get_list");
      body.append("table_name", "quotes");
      body.append("page", lastId);
      if (isSubAdmin) {
        body.append("sub_admin_id", userData?.user_id);
      }
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

  // Handle Assign Button Click (Only for Main Admin)
  const handleAssignClick = (quote) => {
    setSelectedQuote(quote);
    setAssignModalOpen(true);
  };

  // Handle Status Change Button Click (Only for Sub Admin)
  const handleStatusChangeClick = (quote) => {
    setSelectedQuote(quote);
    setStatusModalOpen(true);
  };

  // Handle Sub-Admin Assignment (Only for Main Admin)
  const handleAssignSubAdmin = async (subAdminId) => {
    setAssignLoading(true);
    try {
      const body = new FormData();
      body.append("type", "update_data");
      body.append("table_name", "quotes");
      body.append("sub_admin_id", subAdminId);
      body.append("id", selectedQuote?.id);

      const res = await apiRequest({ body });
      if (res) {
        message.success("Quote assigned to sub-admin successfully");
        setAssignModalOpen(false);
        setSelectedQuote(null);
        handleFetchBusiness();
      } else {
        message.error("Assignment failed");
      }
    } catch (error) {
      console.error("Error assigning sub-admin:", error);
      message.error("Assignment failed");
    } finally {
      setAssignLoading(false);
    }
  };

  // Handle Quote Status Update (Only for Sub Admin)
  const handleStatusUpdate = async (newStatus) => {
    setStatusLoading(true);
    try {
      const body = new FormData();
      body.append("type", "update_data");
      body.append("table_name", "quotes");
      body.append("quote_status", newStatus);
      body.append("id", selectedQuote?.id);

      const res = await apiRequest({ body });
      if (res) {
        message.success("Quote status updated successfully");
        setStatusModalOpen(false);
        setSelectedQuote(null);
        handleFetchBusiness();
      } else {
        message.error("Status update failed");
      }
    } catch (error) {
      console.error("Error updating quote status:", error);
      message.error("Status update failed");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleMessageClick = (quote) => {
    setSelectedQuote(quote);
    setMessageModalOpen(true);
    setMessageText("");
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      message.error("Please enter a message");
      return;
    }

    setSendingMessage(true);
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      const body = new FormData();
      body.append("type", "sendmsg");
      body.append("msg", messageText);
      body.append("current_time", currentTime);
      body.append("user_id", 0);
      body.append(
        "to_chat_id",
        selectedQuote?.user?.id || selectedQuote?.user_id,
      );
      body.append("msg_type", "text");

      const res = await apiRequest({ body });
      if (res) {
        message.success("Message sent successfully");
        setMessageModalOpen(false);
        setMessageText("");
      } else {
        message.error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      message.error("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  // Get status display info
  const getStatusInfo = (status) => {
    const statusInfo = statusOptions.find((option) => option.value === status);
    return statusInfo || { label: "Unknown", color: "#6c757d", icon: "❓" };
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
    if (!isSubAdmin) {
      handleFetchSubAdmins();
    }
  }, [lastId]);

  const safeParse = (value) => {
    if (!value || typeof value !== "string") return value;

    try {
      return JSON.parse(value);
    } catch (e) {
      //   console.error("Pet JSON parse failed:", value);
      return null;
    }
  };

  const QuoteCard = ({ quote }) => {
    console.log("quote :>> ", quote);
    const statusInfo = getStatusInfo(quote?.quote_status);
    const petInformation = safeParse(quote?.pet);
    const subCategories = safeParse(quote?.sub_categories);
    const subCategoriesList = Array.isArray(subCategories) ? subCategories : [];

    return (
      <div className="col-lg-4 col-md-6 col-sm-12 mb-4">
        <div
          className="card h-100 quote-card-hover"
          style={{
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            border: "1px solid #e9ecef",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <div className="card-body p-3 d-flex flex-column h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span
                className="plusJakara_semibold"
                style={{ fontSize: "0.75rem", color: "#6c757d", letterSpacing: "0.5px" }}
              >
                SUBMISSION ID: #{quote?.id}
              </span>
              <span
                className="plusJakara_regular"
                style={{ fontSize: "0.725rem", color: "#adb5bd" }}
              >
                {moment(quote?.created_at).format("MMM DD, YYYY h:mm A")}
              </span>
            </div>

            {/* User Info Header - Compact & Responsive */}
            <div
              style={{
                borderBottom: "1px solid #f1f3f5",
                paddingBottom: "0.75rem",
                marginBottom: "0.75rem",
              }}
            >
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                <div className="d-flex flex-column gap-1" style={{ minWidth: "120px", flex: 1 }}>
                  <span
                    className="plusJakara_semibold"
                    style={{ fontSize: "0.95rem", color: "#212529", lineHeight: "1.2" }}
                  >
                    {quote?.user?.name}
                  </span>
                  <span
                    className="plusJakara_regular text-muted"
                    style={{ fontSize: "0.725rem", wordBreak: "break-all" }}
                  >
                    {quote?.user?.email}
                  </span>
                  {quote?.user?.phone && (
                    <span
                      className="plusJakara_semibold d-flex align-items-center text-secondary"
                      style={{
                        fontSize: "0.725rem",
                        gap: "0.3rem",
                      }}
                    >
                      <FaPhone size={9} style={{ color: "#0d6efd" }} />
                      {quote?.user?.phone}
                    </span>
                  )}
                </div>
                <div
                  className="d-flex align-items-center"
                  style={{ gap: "0.75rem", flexShrink: 0 }}
                >
                  <img
                    src={messageicon}
                    alt="chat icon"
                    style={{
                      width: "18px",
                      height: "18px",
                      cursor: "pointer",
                      filter:
                        "invert(42%) sepia(0%) saturate(1352%) hue-rotate(149deg) brightness(93%) contrast(89%)",
                      transition: "transform 0.2s ease",
                    }}
                    onClick={() => handleMessageClick(quote)}
                    onMouseEnter={(e) => e.target.style.transform = "scale(1.15)"}
                    onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                  />
                  <div
                    className="d-flex flex-column align-items-end"
                    style={{ gap: "0.3rem" }}
                  >
                    {/* Status Badge */}
                    <span
                      className="badge rounded-pill plusJakara_medium d-flex align-items-center"
                      style={{
                        backgroundColor: statusInfo.color,
                        fontSize: "0.65rem",
                        padding: "0.2rem 0.45rem",
                        gap: "0.25rem",
                      }}
                    >
                      {statusInfo.label}
                    </span>

                    {isSubAdmin ? (
                      <button
                        onClick={() => handleStatusChangeClick(quote)}
                        className="btn btn-warning btn-sm plusJakara_medium"
                        style={{
                          fontSize: "0.65rem",
                          padding: "0.15rem 0.4rem",
                          borderRadius: "4px",
                        }}
                      >
                        Change Status
                      </button>
                    ) : // Main Admin sees Assign button
                      quote?.sub_admin_id !== "0" ? (
                        <span
                          className="badge rounded-pill plusJakara_medium"
                          style={{
                            backgroundColor: "#28a745",
                            fontSize: "0.65rem",
                            padding: "0.2rem 0.45rem",
                          }}
                        >
                          Assigned
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAssignClick(quote)}
                          className="btn btn-primary btn-sm plusJakara_medium"
                          style={{
                            fontSize: "0.65rem",
                            padding: "0.15rem 0.4rem",
                            borderRadius: "4px",
                          }}
                        >
                          Assign
                        </button>
                      )}
                  </div>
                </div>
              </div>
            </div>

            {/* Pet details - Compact & Responsive */}
            <p
              className="plusJakara_semibold mb-1"
              style={{ fontSize: "0.75rem", color: "#8c96a3", letterSpacing: "0.5px" }}
            >
              PET INFORMATION
            </p>
            {petInformation ? (
              <div
                className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center mb-3 p-2"
                style={{
                  gap: "0.75rem",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  border: "1px solid #e9ecef",
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "2px solid #fff",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
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
                    width={52}
                    height={52}
                    style={{
                      objectFit: "cover",
                    }}
                    preview={{ zIndex: 9999 }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
                <div className="d-flex flex-column gap-1 w-100">
                  <span
                    className="plusJakara_semibold"
                    style={{ fontSize: "0.85rem", color: "#212529" }}
                  >
                    {petInformation?.name || "Unknown Pet"}
                  </span>
                  <div className="d-flex flex-wrap gap-1">
                    {[
                      petInformation?.species,
                      petInformation?.breed,
                      petInformation?.gender,
                      petInformation?.weight,
                    ]
                      .filter(Boolean)
                      .map((val, i) => (
                        <span
                          key={i}
                          className="badge bg-white text-dark border plusJakara_regular"
                          style={{
                            fontSize: "0.65rem",
                            fontWeight: "normal",
                            padding: "0.15rem 0.3rem",
                          }}
                        >
                          {val}
                        </span>
                      ))}
                  </div>
                  {petInformation?.dob && (
                    <span
                      className="plusJakara_regular text-muted"
                      style={{ fontSize: "0.7rem" }}
                    >
                      DOB: {moment(petInformation.dob).format("MMM DD, YYYY")}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div
                className="p-2 mb-3 text-muted"
                style={{ fontSize: "0.75rem", fontStyle: "italic" }}
              >
                Pet information not available.
              </div>
            )}

            {/* Service Specifications (Sub Categories) - Compact & 100% Responsive Grid */}
            {subCategoriesList && subCategoriesList.length > 0 && (
              <div className="mb-3">
                <p
                  className="plusJakara_semibold mb-1"
                  style={{ fontSize: "0.75rem", color: "#8c96a3", letterSpacing: "0.5px" }}
                >
                  SERVICE SPECIFICATIONS
                </p>
                <div className="row g-2">
                  {subCategoriesList.map((item, idx) => (
                    <div key={idx} className="col-12 col-sm-6">
                      <div
                        style={{
                          backgroundColor: "#f8f9fa",
                          border: "1px solid #e9ecef",
                          borderRadius: "6px",
                          padding: "0.4rem 0.6rem",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          height: "100%",
                        }}
                      >
                        <span
                          className="plusJakara_regular text-uppercase text-truncate"
                          style={{
                            fontSize: "0.6rem",
                            color: "#8c96a3",
                            letterSpacing: "0.5px",
                            marginBottom: "0.1rem",
                          }}
                          title={item.category_service_group}
                        >
                          {item.category_service_group}
                        </span>
                        <span
                          className="plusJakara_semibold text-truncate"
                          style={{
                            fontSize: "0.75rem",
                            color: "#212529",
                          }}
                          title={item.selected}
                        >
                          {item.selected}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scrollable Questions and Answers - Compact Scroll */}
            <div
              className="custom-scrollbar mt-1"
              style={{
                maxHeight: "220px",
                borderTop: "1px solid #f1f3f5",
                paddingTop: "0.75rem",
                overflowY: "auto",
                paddingRight: "5px",
              }}
            >
              <div className="row">
                {fieldMappings?.map((field) => {
                  let value = quote?.[field.key];

                  if (field.key === "amount" && value) {
                    value = `${value}`;
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
                          className="plusJakara_medium"
                          style={{
                            fontSize: "0.75rem",
                            color: "#495057",
                            lineHeight: "1.2",
                          }}
                        >
                          {field.title}
                        </span>

                        {field.key === "vet_bill" && value !== "N/A" ? (
                          (() => {
                            try {
                              const parsed = JSON.parse(value);
                              // Handle both array of strings and object with image property
                              const images = Array.isArray(parsed)
                                ? parsed
                                : parsed?.image
                                  ? [parsed.image]
                                  : [];

                              if (images.length > 0) {
                                return (
                                  <div className="d-flex flex-wrap gap-2">
                                    {images.map((img, index) => {
                                      // Determine base URL, preferring quote.url if available
                                      const baseUrl =
                                        quote?.url || global.IMAGEURL || "";
                                      const imageUrl = baseUrl.endsWith("/")
                                        ? `${baseUrl}${img}`
                                        : `${baseUrl}/${img}`;

                                      return (
                                        <div
                                          key={index}
                                          style={{
                                            border: "1px solid #dee2e6",
                                            borderRadius: "4px",
                                            overflow: "hidden",
                                            display: "inline-block",
                                          }}
                                        >
                                          <Image
                                            src={imageUrl}
                                            alt={`vet bill ${index + 1}`}
                                            height={120}
                                            style={{
                                              objectFit: "cover",
                                            }}
                                            preview={{ zIndex: 9999 }}
                                            onError={(e) => {
                                              e.target.style.display = "none";
                                            }}
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              }
                              return (
                                <span
                                  className="text-muted"
                                  style={{ fontSize: "0.725rem" }}
                                >
                                  No image available
                                </span>
                              );
                            } catch (err) {
                              return (
                                <span
                                  className="text-danger"
                                  style={{ fontSize: "0.725rem" }}
                                >
                                  Invalid Image Data
                                </span>
                              );
                            }
                          })()
                        ) : (
                          <span
                            className="plusJakara_regular"
                            style={{
                              fontSize: "0.725rem",
                              color: value === "N/A" ? "#adb5bd" : "#495057",
                              backgroundColor: "#f8f9fa",
                              padding: "0.35rem 0.55rem",
                              borderRadius: "6px",
                              border: "1px solid #e9ecef",
                              wordBreak: "break-word",
                            }}
                          >
                            {value}
                          </span>
                        )}
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
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #b3b3b3;
        }
        .quote-card-hover {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .quote-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.08) !important;
        }
      `}} />
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
            Quotes{" "}
            {isSubAdmin && (
              <span style={{ fontSize: "1rem", color: "#6c757d" }}>
                (Sub Admin)
              </span>
            )}
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
              Loading quotes...
            </span>
          </div>
        ) : (
          <>
            {/* Cards Container - 3 Cards Per Row */}
            <div style={{ flexGrow: 1 }}>
              {categories && categories.length > 0 ? (
                <div className="row">
                  {categories.map((quote) => (
                    <QuoteCard key={quote?.id} quote={quote} />
                  ))}
                </div>
              ) : (
                <div className="text-center" style={{ padding: "2rem" }}>
                  <span
                    className="plusJakara_regular"
                    style={{ color: "#6c757d" }}
                  >
                    No quotes found
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
                  className={`btn plusJakara_medium ${lastId === 1 ? "btn-secondary" : "btn-primary"
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
                  className={`btn plusJakara_medium ${lastId === count ? "btn-secondary" : "btn-primary"
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

      {!isSubAdmin && (
        <Modal
          open={assignModalOpen}
          onCancel={() => {
            setAssignModalOpen(false);
            setSelectedQuote(null);
          }}
          footer={null}
          centered
        >
          <div>
            <h5 className="plusJakara_semibold mb-4">Select Sub-Admin:</h5>
            <div className="d-flex flex-column" style={{ gap: "0.75rem" }}>
              {subAdmins?.length > 0 ? (
                subAdmins?.map((subAdmin) => (
                  <div
                    key={subAdmin?.id}
                    className="border rounded p-3"
                    style={{
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                      backgroundColor: "#fff",
                    }}
                    onClick={() => handleAssignSubAdmin(subAdmin?.id)}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "#f8f9fa")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "#fff")
                    }
                  >
                    <div className="d-flex flex-column">
                      <span className="plusJakara_semibold">
                        {subAdmin?.name || "Sub Admin"}
                      </span>
                      <span
                        className="plusJakara_regular"
                        style={{ fontSize: "0.875rem", color: "#6c757d" }}
                      >
                        {subAdmin?.email}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center" style={{ padding: "1rem" }}>
                  <span
                    className="plusJakara_regular"
                    style={{ color: "#6c757d" }}
                  >
                    No Sub-Admins found
                  </span>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Change Status Modal (Only for Sub Admin) */}
      {isSubAdmin && (
        <Modal
          open={statusModalOpen}
          onCancel={() => {
            setStatusModalOpen(false);
            setSelectedQuote(null);
          }}
          footer={null}
          centered
        >
          <div>
            <h5 className="plusJakara_semibold mb-4">Change Quote Status:</h5>
            <div className="d-flex flex-column" style={{ gap: "0.75rem" }}>
              {statusOptions.map((status) => (
                <div
                  key={status.value}
                  className="border rounded p-3 d-flex align-items-center"
                  style={{
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                    backgroundColor:
                      selectedQuote?.quote_status === status.value
                        ? "#e3f2fd"
                        : "#fff",
                    borderColor:
                      selectedQuote?.quote_status === status.value
                        ? status.color
                        : "#dee2e6",
                  }}
                  onClick={() => handleStatusUpdate(status.value)}
                  onMouseEnter={(e) => {
                    if (selectedQuote?.quote_status !== status.value) {
                      e.target.style.backgroundColor = "#f8f9fa";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedQuote?.quote_status !== status.value) {
                      e.target.style.backgroundColor = "#fff";
                    }
                  }}
                >
                  <span style={{ fontSize: "1.2rem", marginRight: "0.75rem" }}>
                    {status.icon}
                  </span>
                  <div className="d-flex flex-column">
                    <span
                      className="plusJakara_semibold"
                      style={{ color: status.color }}
                    >
                      {status.label}
                    </span>
                    <span
                      className="plusJakara_regular"
                      style={{ fontSize: "0.8rem", color: "#6c757d" }}
                    >
                      {status.value === "in_review" &&
                        "Claimed but not completed"}
                      {status.value === "need_file" &&
                        "No vet bill uploaded yet"}
                      {status.value === "completed" &&
                        "Quote has been sent to user"}
                      {status.value === "un_assign" &&
                        "No one is working on it yet"}
                    </span>
                  </div>
                  {selectedQuote?.quote_status === status.value && (
                    <span className="ms-auto" style={{ color: status.color }}>
                      ✓
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Message Modal */}
      <Modal
        open={messageModalOpen}
        onCancel={() => {
          setMessageModalOpen(false);
          setSelectedQuote(null);
        }}
        zIndex={9999}
        footer={[
          <button
            key="cancel"
            className="btn btn-secondary btn-sm me-2"
            onClick={() => setMessageModalOpen(false)}
          >
            Cancel
          </button>,
          <button
            key="send"
            className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1"
            onClick={handleSendMessage}
            disabled={sendingMessage}
          >
            {sendingMessage ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <Send size={14} />
            )}
            Send Message
          </button>,
        ]}
        centered
        title={
          <span className="plusJakara_semibold">
            Send message to {selectedQuote?.user?.name || "User"}
          </span>
        }
      >
        <div className="py-2">
          <textarea
            className="form-control plusJakara_regular"
            rows={4}
            placeholder="Type your message here..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            style={{ fontSize: "0.9rem" }}
          />
        </div>
      </Modal>
    </>
  );
};

export default Quotes;
