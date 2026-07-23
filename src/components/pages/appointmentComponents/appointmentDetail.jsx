/* eslint-disable no-mixed-operators */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import Spinner from "../../Spinner";
import { Form, message } from "antd";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Mail, Phone, Clock as ClockIcon, Send, Edit2, Check, X, MessageSquare } from "react-feather";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../../../api/auth_api";
import {
  birthimage,
  breed,
  building,
  calendersmall,
  clock,
  gender,
  specie,
  weight,
} from "../../icons/icon";

import EditAppointmentModal from "./editAppointmentModal";
import ChatMessageList from "../messages/chatMessageList";
import { Modal } from "react-bootstrap";

const safeParseSchedule = (value) => {
  if (!value) return [];
  try {
    let parsed = value;
    if (typeof parsed === "string") {
      parsed = parsed.replace(/\\"/g, '"');
      parsed = JSON.parse(parsed);
    }
    if (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const AppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [selectedItem, setSelectedItem] = useState(state?.selectedItem || null);

  const [isProcessing2, setIsProcessing2] = useState(false);
  const [orderStatus, setOrderStatus] = useState("");
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);

  // ---------- Edit Modal State ----------
  const [showEditModal, setShowEditModal] = useState(false);

  // ---------- Admin Note ----------
  const [adminNote, setAdminNote] = useState("");
  const [editingNote, setEditingNote] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);

  // ---------- Send Message ----------
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatUserDetail, setChatUserDetail] = useState(null);

  const userData = JSON.parse(window.localStorage.getItem("login_farevet_formData"));

  useEffect(() => {
    if (!selectedItem) {
      message.error("Appointment details not found.");
      navigate("/appointments");
    }
  }, [selectedItem, navigate]);

  // ---- Handlers: Send Message ----
  const handleShowChatModal = () => {
    setChatUserDetail({
      sender_id: selectedItem?.user?.id || selectedItem?.user_id,
      sender_name: selectedItem?.user?.name || selectedItem?.business?.name || 'User',
      sender_email: selectedItem?.user?.email || selectedItem?.business?.email,
      sender_img: selectedItem?.user?.image ? `${global.IMAGEURL}/${selectedItem?.user?.image}` : ""
    });
    setShowChatModal(true);
  };

  const calculateDiscountedAmount = (item) => {
    const orderType = item?.order_type;
    let cost = 0;
    if (orderType === "deal") {
      const dealServices = item?.deal?.deal_services || [];
      const totalCost = dealServices?.reduce((acc, service) => {
        const serviceCost = parseFloat(service?.amount) || 0;
        return acc + serviceCost;
      }, 0);
      const discount = parseFloat(item?.deal?.discount) || 0;
      cost = totalCost * (1 - discount / 100);
    } else if (orderType === "service") {
      const totalCost = item?.services?.reduce((acc, service) => {
        const serviceCost = parseFloat(service?.amount) || 0;
        return acc + serviceCost;
      }, 0);
      cost = totalCost;
    }
    return cost?.toFixed(2);
  };

  const handleUpdate = async (status) => {
    const parsedSchedule = safeParseSchedule(selectedItem?.schedule);

    if (status === "processing" && selectedItem?.status === "pending") {
      if (parsedSchedule && parsedSchedule.length > 0 && selectedSlotIndex === null) {
        message.error("Please select a date and time to approve");
        return;
      }
    }

    setOrderStatus(status);
    setIsProcessing2(true);
    const body = new FormData();
    body.append("type", "update_data");
    body.append("table_name", "orders");
    body.append("status", status);
    body.append("id", selectedItem?.id);

    if (status === "processing" && selectedSlotIndex !== null && parsedSchedule[selectedSlotIndex]) {
      const selectedTime = parsedSchedule[selectedSlotIndex].time;
      const time24 = moment(selectedTime, ["h:mm A"]).format("HH:mm:ss");
      body.append("booking_date", parsedSchedule[selectedSlotIndex].date);
      body.append("booking_time_12hour", selectedTime);
      body.append("booking_time", time24);
    }

    await apiRequest({ body })
      .then(async (res) => {
        setIsProcessing2(false);
        if (res?.result === true) {
          navigate("/appointments", { state: { defaultTab: status } });
        } else {
          message.error("Update failed...");
        }
      })
      .catch((error) => {
        console.error(error);
        setIsProcessing2(false);
      });
  };

  const renderStatusButtons = () => {
    if (selectedItem?.status === "pending") {
      return (
        <>
          <button
            type="button"
            onClick={() => handleUpdate("processing")}
            disabled={isProcessing2}
            style={{ backgroundColor: "#06D6A0", padding: "12px" }}
            className="w-1/2 rounded-lg text_white flex items-center justify-center bg-[#06D6A0]"
          >
            {isProcessing2 && orderStatus === "processing" ? (
              <Spinner color="inherit" size={18} />
            ) : (
              "Approve"
            )}
          </button>
          <button
            type="button"
            onClick={() => handleUpdate("cancelled")}
            disabled={isProcessing2}
            style={{ backgroundColor: "#FF6F61", padding: "12px" }}
            className="w-1/2 rounded-lg text_white flex items-center justify-center bg-[#FF6F61]"
          >
            {isProcessing2 && orderStatus === "cancelled" ? (
              <Spinner color="inherit" size={18} />
            ) : (
              "Decline"
            )}
          </button>
        </>
      );
    } else if (selectedItem?.status === "processing") {
      return (
        <button
          type="button"
          onClick={() => handleUpdate("completed")}
          disabled={isProcessing2}
          style={{ backgroundColor: "#5A67D8", padding: "12px" }}
          className="w-full rounded-lg text_white flex items-center justify-center bg-[#5A67D8]"
        >
          {isProcessing2 && orderStatus === "completed" ? (
            <Spinner color="inherit" size={18} />
          ) : (
            "Complete"
          )}
        </button>
      );
    } else {
      return (
        <button
          type="button"
          style={{ backgroundColor: "#f4f4f4", padding: "12px" }}
          className="w-full rounded-lg text_secondary flex items-center justify-center"
          disabled
        >
          Appointment {selectedItem?.status}
        </button>
      );
    }
  };

  if (!selectedItem) return null;

  return (
    <main className="container m-auto min-h-screen py-4 px-3">
      <div className="flex justify-between flex-wrap gap-3 items-center mb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-[36px] h-[36px] bg_primary rounded-lg"
          >
            <ArrowLeft className="text_white" />
          </button>
          <span className="inter_semibold text-xl md:text-2xl text_dark">
            Appointment Detail
          </span>
        </div>
      </div>

      <Form className="w-full lg:w-[90%] xl:w-[80%] m-auto bg_white rounded-xl shadow-md p-4 md:p-6">
        <div className="flex flex-col gap-4">
          {/* Header Profile Section */}
          <div className="bg-white rounded-2xl border border-[#E8E8F0] p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4">
              <img
                src={`${global.IMAGEURL}/${selectedItem?.business?.logo}`}
                className="h-16 w-16 object-cover rounded-2xl border-2 border-[#E8E8F0] shadow-sm"
                alt=""
              />
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-[#1A1A2E] leading-tight">
                  {selectedItem?.business?.name}
                </span>
                <span className="text-sm font-medium text-[#9B9BB5]">
                  {selectedItem?.business?.address}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center justify-center w-[34px] h-[34px] rounded-full bg-[#F5F5FA] border border-[#EBEBF5] hover:bg-[#E2E2EA] transition-colors shadow-sm"
                  title="Edit Appointment"
                >
                  <Edit2 size={14} className="text-[#6B6B8A]" />
                </button>
                <button
                  type="button"
                  onClick={handleShowChatModal}
                  className={`flex items-center justify-center w-[34px] h-[34px] rounded-full border transition-colors shadow-sm bg-[#F3EEFF] border-[#D8B4FE] text-[#8930F9] hover:bg-[#EDE9FE]`}
                  title="Send message"
                >
                  <MessageSquare size={14} />
                </button>
                <div
                  className={`px-4 py-1.5 rounded-full text-sm font-bold capitalize ${selectedItem?.status === "pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : selectedItem?.status === "processing"
                      ? "bg-blue-100 text-blue-700"
                      : selectedItem?.status === "completed"
                        ? "bg-[#5CE2C51C] text-[#06D6A0]"
                        : "bg-red-100 text-red-700"
                    }`}
                >
                  {selectedItem?.status}
                </div>
                {(selectedItem?.rescheduled === "1" || selectedItem?.rescheduled === 1) && (
                  <div className="px-4 py-1.5 rounded-full text-sm font-bold uppercase bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]">
                    Rescheduled
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pet Info Card */}
          <div className="bg-[#F9F9FB] rounded-2xl p-4 border border-[#F0F0F5] flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <img
              src={`${global.IMAGEURL}/${selectedItem?.pet?.image}`}
              className="h-20 w-20 object-cover rounded-full border-4 border-white shadow-sm"
              alt=""
            />
            <div className="flex flex-col gap-2">
              <span className="text-2xl font-bold text-[#1A1A2E]">
                {selectedItem?.pet?.name}
              </span>
              <div className="flex flex-wrap gap-x-4 gap-y-2 items-center text-sm font-medium text-[#4A4A68]">
                <div className="flex items-center gap-1.5">
                  <img src={specie} className="w-4 h-4" alt="" />
                  <span>{selectedItem?.pet?.species}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <img src={breed} className="w-4 h-4" alt="" />
                  <span>{selectedItem?.pet?.breed}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <img src={gender} className="w-4 h-4" alt="" />
                  <span>{selectedItem?.pet?.gender}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <img src={birthimage} className="w-4 h-4" alt="" />
                  <span>{selectedItem?.pet?.dob}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <img src={weight} className="w-4 h-4" alt="" />
                  <span>
                    {selectedItem?.pet?.avg_weight
                      ? selectedItem?.pet?.avg_weight + " lbs"
                      : selectedItem?.pet?.weight}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Section for Details & Services */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column: Client Details */}
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-2xl border border-[#E8E8F0] p-4 shadow-sm flex flex-col gap-3">
                <h4 className="text-[10px] font-bold text-[#9B9BB5] uppercase tracking-wider mb-1">
                  Client Details
                </h4>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-[#9B9BB5] font-medium">Name</span>
                  <span className="text-sm font-bold text-[#1A1A2E]">
                    {selectedItem?.name}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-[#9B9BB5] font-medium">
                    Created On
                  </span>
                  <span className="text-sm font-bold text-[#1A1A2E]">
                    {selectedItem?.created_at
                      ? moment(selectedItem?.created_at).format("MMM DD, YYYY h:mm A")
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5">
                    <Phone className="text-[#8930F9] w-4 h-4" />
                    <span className="text-sm font-bold text-[#1A1A2E]">
                      {selectedItem?.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="text-[#8930F9] w-4 h-4" />
                    <span className="text-sm font-bold text-[#1A1A2E] truncate">
                      {selectedItem?.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Client Note */}
              <div className="bg-white rounded-2xl border border-[#E8E8F0] p-4 shadow-sm flex flex-col gap-2">
                <h4 className="text-[10px] font-bold text-[#9B9BB5] uppercase tracking-wider mb-1">
                  Client Note
                </h4>
                <span className="text-sm font-medium text-[#4A4A68] italic">
                  {selectedItem?.note || "No notes provided."}
                </span>
              </div>

              {/* ── Note for Client ── */}cd farvetunderscoreadmin

              <div className="bg-white rounded-2xl border border-[#E8E8F0] p-4 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-[10px] font-bold text-[#9B9BB5] uppercase tracking-wider">
                    Admin Note
                  </h4>
                </div>
                <span className="text-sm font-medium text-[#4A4A68] italic">
                  {selectedItem?.admin_note || "No note for client yet."}
                </span>
              </div>
            </div>

            {/* Right Column: Services */}
            <div className="bg-white rounded-2xl border border-[#E8E8F0] p-4 shadow-sm flex flex-col gap-3">
              <h4 className="text-[10px] font-bold text-[#9B9BB5] uppercase tracking-wider mb-1">
                Services Requested
              </h4>

              <div className="flex flex-col gap-2">
                <span className="text-xs text-[#9B9BB5] font-medium">Main Service</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedItem?.order_type === "deal" &&
                    selectedItem?.deal?.deal_services?.map((item, i) => (
                      <span
                        key={i}
                        className="text_secondary text-sm plusJakara_regular"
                      >
                        {item?.service_name} {i >= 0 && ", "}{" "}
                      </span>
                    ))}
                  {selectedItem?.order_type === "service" &&
                    selectedItem?.services?.map((item, i) => (
                      <span
                        key={i}
                        className="text_secondary text-sm plusJakara_regular"
                      >
                        {item?.service_name} {i >= 0 && ", "}{" "}
                      </span>
                    ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <span className="text-xs text-[#9B9BB5] font-medium">Subservices</span>
                <div className="flex flex-col gap-2">
                  {(selectedItem?.order_type === "deal" &&
                    !selectedItem?.deal?.deal_services) ||
                    selectedItem?.deal?.deal_services === null ? (
                    <span>Not Found</span>
                  ) : (
                    selectedItem?.deal?.deal_services?.map((dealService, i) => (
                      <div key={i} className="flex flex-col">
                        {dealService?.sub_service &&
                          JSON.parse(dealService?.sub_service).map((subItem, j) => (
                            <span
                              key={j}
                              className="text-sm font-medium text-[#4A4A68] bg-[#F0F0F5] px-2 py-1 rounded-md mb-1 w-max"
                            >
                              {subItem}
                            </span>
                          ))}
                      </div>
                    ))
                  )}
                  {selectedItem?.order_type === "service" &&
                    selectedItem?.services?.map((service, i) => (
                      <div key={i} className="flex flex-col gap-1 mb-2">
                        <span className="text-sm font-bold text-[#1A1A2E]">
                          {i + 1}. {service?.service_name}
                        </span>
                        <div className="flex flex-wrap gap-1.5 ml-2">
                          {service?.sub_service &&
                            JSON.parse(service.sub_service).map((subService, j) => (
                              <span
                                key={j}
                                className="text-xs font-medium text-[#4A4A68] bg-[#F0F0F5] px-2 py-1 rounded-md"
                              >
                                {subService}
                              </span>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Schedule & Price Section (with inline edit) ── */}
          <div className="bg-white rounded-2xl border border-[#E8E8F0] p-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex flex-col gap-3 w-full flex-1">
              {(() => {
                const parsedSchedule = safeParseSchedule(selectedItem?.schedule);
                if (parsedSchedule && parsedSchedule.length > 0) {
                  if (selectedItem?.status === "pending") {
                    return (
                      <div className="flex flex-col gap-2 w-full">
                        <span className="text_dark plusJakara_medium text-sm">
                          Select a schedule to approve:
                        </span>
                        {parsedSchedule.map((slot, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedSlotIndex(idx)}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedSlotIndex === idx
                              ? "border-[#06D6A0] bg-[#E6FBF5]"
                              : "border-[#E8E8F0] hover:border-[#06D6A0]/50"
                              }`}
                          >
                            <div
                              className={`flex items-center justify-center w-5 h-5 rounded-full border ${selectedSlotIndex === idx
                                ? "border-[#06D6A0] bg-[#06D6A0]"
                                : "border-[#d3d3d3]"
                                }`}
                            >
                              {selectedSlotIndex === idx && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <img src={calendersmall} alt="" />
                                <span className="plusJakara_medium text-sm text_dark">
                                  {slot.date}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <img
                                  src={clock}
                                  style={{ width: "24px", height: "auto" }}
                                  alt=""
                                />
                                <span className="plusJakara_medium text-sm text_dark">
                                  {slot.time}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  } else if (selectedItem?.status === "cancelled") {
                    return <div className="flex gap-4 items-center flex-wrap"></div>;
                  } else {
                    return (
                      <div className="flex gap-4 items-center flex-wrap">
                        {/* Date display */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-[#9B9BB5] uppercase tracking-wider">Date</span>
                          <div className="flex items-center gap-2 bg-[#F9F9FB] px-3 py-2 rounded-xl border border-[#E8E8F0] group">
                            <img src={calendersmall} alt="" />
                            <span className="plusJakara_medium text-sm text_dark">
                              {selectedItem?.booking_date || parsedSchedule[0]?.date}
                            </span>
                          </div>
                        </div>
                        {/* Time display */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-[#9B9BB5] uppercase tracking-wider">Time</span>
                          <div className="flex items-center gap-2 bg-[#F9F9FB] px-3 py-2 rounded-xl border border-[#E8E8F0] group">
                            <img src={clock} style={{ width: "24px", height: "auto" }} alt="" />
                            <span className="plusJakara_medium text-sm text_dark">
                              {selectedItem?.booking_time_12hour || parsedSchedule[0]?.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                } else {
                  return (
                    <div className="flex gap-4 items-center flex-wrap">
                      {/* Date display */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-[#9B9BB5] uppercase tracking-wider">Date</span>
                        <div className="flex items-center gap-2 bg-[#F9F9FB] px-3 py-2 rounded-xl border border-[#E8E8F0] group">
                          <img src={calendersmall} alt="" />
                          <span className="plusJakara_medium text-sm text_dark">
                            {selectedItem?.booking_date}
                          </span>
                        </div>
                      </div>
                      {/* Time display */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-[#9B9BB5] uppercase tracking-wider">Time</span>
                        <div className="flex items-center gap-2 bg-[#F9F9FB] px-3 py-2 rounded-xl border border-[#E8E8F0] group">
                          <img src={clock} style={{ width: "24px", height: "auto" }} alt="" />
                          <span className="plusJakara_medium text-sm text_dark">
                            {selectedItem?.booking_time_12hour}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
              })()}
              {selectedItem?.status !== "cancelled" && <div className="flex items-center gap-1 mt-1">
                <img src={building} alt="" />
                <span className="plusJakara_medium text-sm text_dark">
                  Office Visit
                </span>
              </div>}
            </div>

            <div className="flex flex-col items-end shrink-0">
              <span className="text-[10px] font-bold text-[#9B9BB5] uppercase tracking-wider mb-1">
                Total Amount
              </span>
              <div className="flex items-center gap-2">
                {selectedItem?.order_type === "deal" && (
                  <span className="bg-[#BD66FF1A] text_primary px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                    Deal
                  </span>
                )}
                <span className="text-4xl font-extrabold text-[#1A1A2E]">
                  ${calculateDiscountedAmount(selectedItem)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 items-center mt-2">
            {renderStatusButtons()}
          </div>
        </div>
      </Form>
      <EditAppointmentModal
        show={showEditModal}
        handleClose={() => setShowEditModal(false)}
        selectedItem={selectedItem}
        onSuccess={(updated) => {
          setSelectedItem({ ...selectedItem, ...updated });
        }}
      />

      <Modal show={showChatModal} onHide={() => setShowChatModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <div className="flex justify-start">
            <span className="text_dark text-xl plusJakara_medium">
              Chat with {chatUserDetail?.sender_name}
            </span>
          </div>
        </Modal.Header>
        <Modal.Body style={{ height: '600px', padding: 0 }}>
          {chatUserDetail && (
            <ChatMessageList
              chatDetail={chatUserDetail}
              setShowChat={setShowChatModal}
              setCheckMsg={() => { }}
              checkMsg={false}
              setReload={() => { }}
              activeId={chatUserDetail?.sender_id}
            />
          )}
        </Modal.Body>
      </Modal>
    </main>
  );
};

export default AppointmentDetail;
