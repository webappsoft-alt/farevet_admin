/* eslint-disable no-mixed-operators */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import Spinner from "../Spinner";
import { Form, message, Segmented } from "antd";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Code,
  Mail,
  MessageSquare,
  Edit2,
  Phone,
  PhoneCall,
} from "react-feather";
import { IoLocationOutline } from "react-icons/io5";
import { MdDiscount, MdPets } from "react-icons/md";
import { Autoplay, FreeMode, Navigation, Pagination } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "../styles/swiper.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { Input } from "reactstrap";
import { apiRequest } from "../../api/auth_api";
import { MapPin, Tag } from "lucide-react";

import {
  birthimage,
  breed,
  building,
  calendersmall,
  clock,
  gender,
  locationsmall,
  specie,
  weight,
} from "../icons/icon";

import EditAppointmentModal from "./appointmentComponents/editAppointmentModal";
import ChatMessageList from "./messages/chatMessageList";


const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function SkeletonCard() {
  return (
    <div className="bg-white border border-[#F0F0F5] rounded-[20px] p-3 w-full sm:max-w-[25rem] md:max-w-[21rem] lg:max-w-[25rem] xl:max-w-[24rem] ">
      <div className="flex justify-between items-center mb-4">
        <div className="h-[22px] w-[72px] bg-gray-100 rounded-full" />
        <div className="flex flex-col items-end gap-1.5">
          <div className="h-[11px] w-[55px] bg-gray-100 rounded" />
          <div className="h-[11px] w-[80px] bg-gray-100 rounded" />
        </div>
      </div>
      <div className="flex items-center gap-4 mb-5">
        <div className="w-[58px] h-[58px] rounded-[14px] bg-gray-100 shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-4 w-[55%] bg-gray-100 rounded" />
          <div className="h-3 w-[75%] bg-gray-100 rounded" />
        </div>
      </div>
      <div className="flex justify-between items-center pt-3.5 border-t border-[#F0F0F5]">
        <div className="h-6 w-[60px] bg-gray-100 rounded" />
        <div className="h-[30px] w-[80px] bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}

const STATUS_STYLES = {
  pending: { pill: "bg-[#FFF3D6] text-[#B56F00]", dot: "bg-[#F5A623]", bar: "bg-[#F5A623]" },
  processing: { pill: "bg-[#EDE9FE] text-[#5B21B6]", dot: "bg-[#7C3AED] animate-pulse", bar: "bg-[#7C3AED]" },
  completed: { pill: "bg-[#DCFCE7] text-[#15803D]", dot: "bg-[#22C55E]", bar: "bg-[#06D6A0]" },
  cancelled: { pill: "bg-[#FEE2E2] text-[#B91C1C]", dot: "bg-[#EF4444]", bar: "bg-[#EF4444]" },
};

const PET_EMOJI = { Dog: "🐕", Cat: "🐈", Bird: "🦜", Rabbit: "🐰" };

const Appointments = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOption, setSelectedOption] = useState("all");
  const [selectShedule, setSelectShedule] = useState("date");
  const [showDetail, setShowDetail] = useState(false);
  const [showDeal, setShowDeal] = useState(false);
  const [showCalender, setShowCalender] = useState(false);
  const [showSheduleModal, setShowSheduleModal] = useState(false);
  const [time, setTime] = useState("");
  const [scheduleData, setScheduleData] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [date, setDate] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessing2, setIsProcessing2] = useState(false);
  const [isProcessing3, setIsProcessing3] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [orderStatus, setOrderStatus] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [totalPages, setTotalPages] = useState(null);
  const [totalDataCount, setTotalDataCount] = useState(0);

  const [showChatModal, setShowChatModal] = useState(false);
  const [chatUserDetail, setChatUserDetail] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.defaultTab) {
      setSelectedOption(location.state.defaultTab);
      // Clear state so it doesn't persist on subsequent refreshes
      navigate(".", { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleShowDetail = (item) => {
    navigate(`/appointments/${item.id}`, { state: { selectedItem: item } });
  };

  const handleShowChatModal = (item) => {
    setChatUserDetail({ 
      sender_id: item?.user?.id || item?.user_id, 
      sender_name: item?.user?.name || item?.business?.name || 'User', 
      sender_email: item?.user?.email || item?.business?.email,
      sender_img: item?.user?.image ? `${global.IMAGEURL}/${item?.user?.image}` : ""
    });
    setShowChatModal(true);
  };

  useEffect(() => {
    setTime(selectedItem?.booking_time_12hour);
    setDate(selectedItem?.booking_date);
    if (selectedItem) {
      const currentDate = selectedItem?.booking_date;
      const dayName = daysOfWeek[new Date(currentDate)?.getDay()];
      // console.log(dayName);
      const dayInfo = scheduleData.find((slot) => slot?.day === dayName);
      if (dayInfo) {
        const slots = generateSlots(dayInfo?.from, dayInfo?.to);
        setTimeSlots(slots);
      }
    }
  }, [selectedItem, scheduleData]);

  const handleCloseDeal = () => setShowDeal(false);

  const handleShowDeal = (item) => {
    setSelectedDeal(item);
    setShowDeal(true);
  };

  const handleSheduleModal = () => {
    setShowDetail(false);
    setShowSheduleModal(true);
  };

  const handleCalenderShow = () => {
    setSelectShedule("date");
    setShowTimePicker(false);
    setShowCalender(true);
  };

  const handleTimePickerShow = () => {
    setSelectShedule("time");
    setShowCalender(false);
    setShowTimePicker(true);
  };

  const handleTimeChange = (event) => {
    const selectedTime = event.target.value;
    const formattedTime = moment(selectedTime, "HH:mm").format("h:mm A");
    setTime(formattedTime);
  };

  const handleFetchData = async (page) => {
    setIsProcessing(true);
    const body = new FormData();
    body.append("type", "get_list");
    body.append("table_name", "orders");
    // body.append("business_created", "admin");
    body.append("page", page);
    await apiRequest({ body })
      .then(async (res) => {
        setIsProcessing(false);
        if (res) {
          const filteredCategories =
            selectedOption === "all"
              ? res?.data || []
              : res?.data.filter((item) => item?.status === selectedOption) ||
              [];
          setCategories(filteredCategories);
          setTotalDataCount(filteredCategories?.length || 0);
          setTotalPages(Math.ceil(res?.count / 10));
        } else {
          console.error("Creation failed...");
        }
      })
      .catch((error) => {
        console.error(error);
        setIsProcessing(false);
      })
      .finally(() => {
        setIsProcessing(false);
      });
  };

  const handlePageClick = (page) => {
    setCurrentPage(page);
    handleFetchData(page);
  };
  useEffect(() => {
    handleFetchData(currentPage);
  }, [currentPage, selectedOption]);

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

  useEffect(() => {
    calculateDiscountedAmount(selectedItem);
  }, [selectedItem]);

  const handleSubmit = async (e) => {
    setIsProcessing3(true);
    const body = new FormData();
    body.append("type", "update_data");
    body.append("table_name", "orders");
    body.append("booking_time_12hour", time);
    body.append("booking_date", date);
    body.append("rescheduled", 1);
    body.append("id", selectedItem?.id);
    await apiRequest({ body })
      .then(async (res) => {
        setIsProcessing3(false);
        if (res?.result === true) {
          setShowSheduleModal(false);
          handleFetchData(currentPage);
        } else {
          message.error("Creation failed...");
        }
      })
      .catch((error) => {
        console.error(error);
        setIsProcessing3(false);
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

  const handleUpdate = async (status) => {
    setOrderStatus(status);
    setIsProcessing2(true);
    const body = new FormData();
    body.append("type", "update_data");
    body.append("table_name", "orders");
    body.append("status", status);
    body.append("id", selectedItem?.id);
    await apiRequest({ body })
      .then(async (res) => {
        setIsProcessing2(false);
        if (res?.result === true) {
          setShowDetail(false);
          handleFetchData(currentPage);
        } else {
          message.error("Creation failed...");
        }
      })
      .catch((error) => {
        console.error(error);
        setIsProcessing2(false);
      });
  };

  const generateSlots = (from, to) => {
    const slots = [];
    let currentTime = moment(from, "hh:mm A");
    const endTime = moment(to, "hh:mm A");
    while (currentTime < endTime) {
      if (currentTime.format("hh:mm A") !== endTime.format("hh:mm A")) {
        slots.push(currentTime.format("hh:mm A"));
      }
      currentTime.add(30, "minutes");
    }
    return slots;
  };

  const checkIsDayExist = (day) => {
    const selectedDate = new Date(day?.target?.value);
    const selectedDateString = selectedDate?.toISOString().split("T")[0];
    if (selectedDateString < date) {
      message.error("You can't select a date in the past.");
      setDate("");
      return;
    }
    setDate(day?.target?.value);
    const dateObject = new Date(day?.target?.value);
    const dayName = daysOfWeek[dateObject.getDay()];
    const dayInfo = scheduleData.find((slot) => slot?.day === dayName);
    if (dayInfo) {
      const slots = generateSlots(dayInfo.from, dayInfo.to);
      setTimeSlots(slots);
    } else {
      if (date && selectedItem) {
        const currentDate = selectedItem?.booking_date;
        const dayName = daysOfWeek[new Date(currentDate)?.getDay()];
        const dayInfo = scheduleData.find((slot) => slot?.day === dayName);
        if (dayInfo) {
          const slots = generateSlots(dayInfo.from, dayInfo.to);
          setTimeSlots(slots);
        }
      }
      message.error(
        "The store is closed on the selected date. Kindly select another date or update availability",
      );
    }
  };

  const renderStatusButtons = () => {
    if (selectedItem?.status === "pending") {
      return (
        <>
          <button
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
          style={{ backgroundColor: "#f4f4f4", padding: "12px" }}
          className="w-full rounded-lg text_secondary flex items-center justify-center"
          disabled
        >
          Appointment {selectedItem?.status}
          {/* {isProcessing2 && orderStatus === 'completed' ? <Spinner color="inherit" size={18} /> : 'Complete'} */}
        </button>
      );
    }
  };

  return (
    <main className="container m-auto height_calc flex-grow flex flex-col p-3">
      <div className="flex w-full items-center flex-wrap">
        <span className="text_dark plusJakara_medium text-2xl md:text-3xl">
          Appointments
        </span>
      </div>
      <div className="w-full my-4 overflow-x-auto pb-2">
        <div className="min-w-max">
          <Segmented
            options={[
              { label: "All", value: "all" },
              { label: "Pending", value: "pending" },
              { label: "Processing", value: "processing" },
              { label: "Completed", value: "completed" },
              { label: "Cancelled", value: "cancelled" },
            ]}
            value={selectedOption}
            onChange={(value) => setSelectedOption(value)}
            size="large"
          />
        </div>
      </div>
      {/* {isProcessing ? (
        <div className="flex w-full justify-center items-center my-5">
          <Spinner className="text_primary" size={30} thickness={3} />
        </div>
      ) : (
        <div className="d-flex flex-wrap gap-3 mb-4 justify-content-center justify-content-lg-start">
          {!categories || categories?.length === 0 ? (
            <div className="my-5 flex justify-center items-center w-full">
              <span className="text_dark inter_medium">
                No Appointment Found
              </span>
            </div>
          ) : (
            categories?.map((item, i) => (
              <div
                key={i}
                onClick={() => handleShowDetail(item)}
                className="group bg-white border border-[#F0F0F5] hover:border-[#8930F9]/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 rounded-[20px] flex flex-col w-full sm:max-w-[25rem] md:max-w-[21rem] lg:max-w-[25rem] xl:max-w-[24rem] p-5 cursor-pointer"
              >
               
                <div className="flex justify-between items-start mb-4">
                  <span
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase ${item?.status === "pending" ? "bg-[#FFF8EC] text-[#F5A623]" :
                      item?.status === "processing" ? "bg-[#F3E8FF] text-[#8930F9]" :
                        item?.status === "completed" ? "bg-[#E6FBF5] text-[#06D6A0]" :
                          "bg-[#FFF0F0] text-[#FF4D4F]"
                      }`}
                  >
                    {item?.status}
                  </span>
                  <div className="flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-1 opacity-60">
                      <img src={locationsmall} className="w-3 h-3" alt="" />
                      <span className="text-[11px] font-medium text-[#4A4A68]">1.5 km</span>
                    </div>
                    <span className="text-[11px] font-medium text-[#9B9BB5]">
                      {item?.created_at ? moment(item?.created_at).format("MMM DD, YYYY") : "N/A"}
                    </span>
                  </div>
                </div>

                
                <div className="flex items-center gap-4 mb-5">
                  {item?.status === "processing" ? (
                    <div className="w-[60px] h-[60px] shrink-0 rounded-[14px] bg-[#F9F9FB] border border-[#F0F0F5] flex flex-col items-center justify-center">
                      <span className="text-[#8930F9] font-bold text-sm">
                        {item?.booking_time_12hour?.split(' ')[0]}
                      </span>
                      <span className="text-[#8930F9] font-semibold text-[10px] opacity-70">
                        {item?.booking_time_12hour?.split(' ')[1]}
                      </span>
                    </div>
                  ) : (
                    <img
                      src={`${global.IMAGEURL}/${item?.pet?.image}`}
                      className="w-[60px] h-[60px] shrink-0 rounded-[14px] object-cover border border-[#F0F0F5]"
                      alt=""
                    />
                  )}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[17px] font-bold text-[#1A1A2E] truncate mb-1">
                      {item?.pet?.name || item?.business?.name || "Client"}
                    </span>
                    <div className="flex items-center gap-2.5 opacity-70">
                      <div className="flex items-center gap-1">
                        <img src={specie} className="w-3.5 h-3.5" alt="" />
                        <span className="text-xs font-medium text-[#4A4A68] truncate max-w-[80px]">
                          {item?.pet?.species || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <img src={breed} className="w-3.5 h-3.5" alt="" />
                        <span className="text-xs font-medium text-[#4A4A68] truncate max-w-[80px]">
                          {item?.pet?.breed || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                
                <div className="mt-auto flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    <span className="text-[22px] font-bold text-[#1A1A2E]">
                      ${calculateDiscountedAmount(item)}
                    </span>
                    {item?.service && (
                      <span className="text-[11px] font-medium text-[#9B9BB5]">
                        {item?.service?.cost_type}
                      </span>
                    )}
                  </div>
                  {item?.deal && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShowDeal(item);
                      }}
                      className="bg-white border border-[#E8E8F0] hover:border-[#8930F9] text-[#4A4A68] hover:text-[#8930F9] transition-colors py-1.5 px-3 rounded-lg text-xs font-semibold"
                    >
                      View Deal
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )} */}

      {isProcessing ? (
        <div className="d-flex flex-wrap gap-3 mb-4 justify-content-center justify-content-lg-start">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="d-flex flex-wrap gap-3 mb-4 justify-content-center justify-content-lg-start">
          {!categories || categories?.length === 0 ? (
            <div className="my-12 flex flex-col items-center justify-center w-full gap-3 text-[#9B9BB5]">
              <span className="text-4xl opacity-40">📅</span>
              <span className="text-[15px] font-medium inter_medium">No Appointment Found</span>
            </div>
          ) : (
            categories?.map((item, i) => {
              const cfg = STATUS_STYLES[item?.status] || STATUS_STYLES.pending;
              const timeParts = item?.booking_time_12hour?.split(" ") || [];
              const emoji = PET_EMOJI[item?.pet?.species] || "🐾";

              return (
                <div
                  key={i}
                  onClick={() => handleShowDetail(item)}
                  className="
              group relative overflow-hidden
              bg-white border border-[#F0F0F5]
              hover:border-[#D1D1E0] hover:shadow-[0_12px_32px_rgba(0,0,0,0.07)]
              transition-all duration-200 ease-out
              rounded-[20px] flex flex-col
              w-full sm:max-w-[25rem] md:max-w-[21rem] lg:max-w-[25rem] xl:max-w-[24rem]
              p-3 cursor-pointer hover:-translate-y-[3px]
            "
                >
                  {/* Accent bar — appears on hover, color matches status */}
                  <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-[20px] ${cfg.bar} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />

                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col gap-2 items-start">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${cfg.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {item?.status}
                      </span>
                      {(item?.rescheduled === "1" || item?.rescheduled === 1) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]">
                          Rescheduled
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditItem(item);
                            setShowEditModal(true);
                          }}
                          className="flex items-center justify-center w-[26px] h-[26px] rounded-full bg-[#F5F5FA] border border-[#EBEBF5] hover:bg-[#E2E2EA] transition-colors"
                          title="Edit Appointment"
                        >
                          <Edit2 size={12} className="text-[#6B6B8A]" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowChatModal(item);
                          }}
                          className="flex items-center justify-center w-[26px] h-[26px] rounded-full bg-[#F3EEFF] border border-[#D8B4FE] hover:bg-[#EDE9FE] transition-colors"
                          title="Send message"
                        >
                          <MessageSquare size={12} className="text-[#8930F9]" />
                        </button>
                        <div className="flex items-center gap-1 text-[#9B9BB5] ml-1">
                          <MapPin size={11} strokeWidth={2} />
                          <span className="text-[11px] font-medium">1.5 km</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-[#B0B0C8] mt-0.5">
                        {item?.created_at ? moment(item?.created_at).format("MMM DD, YYYY") : "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex items-center gap-4 mb-5">
                    {item?.status === "processing" ? (
                      <div className="w-[58px] h-[58px] shrink-0 rounded-[14px] bg-[#EDE9FE] border border-[#C4B5FD] flex flex-col items-center justify-center">
                        <span className="text-[#5B21B6] font-extrabold text-sm leading-none">
                          {timeParts[0]}
                        </span>
                        <span className="text-[#7C3AED] font-semibold text-[10px] opacity-80 mt-0.5">
                          {timeParts[1]}
                        </span>
                      </div>
                    ) : item?.pet?.image ? (
                      <img
                        src={`${global.IMAGEURL}/${item?.pet?.image}`}
                        className="w-[58px] h-[58px] shrink-0 rounded-[14px] object-cover border border-[#F0F0F5]"
                        alt=""
                      />
                    ) : (
                      <div className="w-[58px] h-[58px] shrink-0 rounded-[14px] bg-[#F5F5FA] border border-[#EBEBF5] flex items-center justify-center text-[26px]">
                        {emoji}
                      </div>
                    )}

                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-[16px] font-bold text-[#1A1A2E] truncate mb-1.5">
                        {item?.pet?.name || item?.business?.name || "Client"}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {item?.pet?.species && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6B6B8A] bg-[#F5F5FA] border border-[#EBEBF5] px-2 py-0.5 rounded-[6px] truncate max-w-[90px]">
                            🐾 {item?.pet?.species}
                          </span>
                        )}
                        {item?.pet?.breed && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6B6B8A] bg-[#F5F5FA] border border-[#EBEBF5] px-2 py-0.5 rounded-[6px] truncate max-w-[90px]">
                            🏷 {item?.pet?.breed}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Admin message preview */}
                  {item?.admin_note && (
                    <div className="mt-2.5 flex items-start gap-1.5 bg-[#F3EEFF] border border-[#D8B4FE] rounded-xl px-2.5 py-2">
                      <MessageSquare size={11} className="text-[#8930F9] shrink-0 mt-0.5" />
                      <span className="text-[11px] font-medium text-[#5B21B6] leading-snug line-clamp-1">
                        {item?.admin_note}
                      </span>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-auto flex justify-between items-center pt-3.5 border-t border-[#F0F0F5]">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[22px] font-extrabold text-[#1A1A2E]">
                        ${calculateDiscountedAmount(item)}
                      </span>
                      {item?.service && (
                        <span className="text-[11px] font-medium text-[#B0B0C8]">
                          {item?.service?.cost_type}
                        </span>
                      )}
                    </div>

                    {item?.deal && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowDeal(item);
                        }}
                        className="flex items-center gap-1.5 text-[12px] font-semibold text-[#5B21B6] bg-[#EDE9FE] hover:bg-[#DDD6FE] border border-[#C4B5FD] py-1.5 px-3.5 rounded-xl transition-colors duration-150"
                      >
                        <Tag size={12} strokeWidth={2.5} />
                        View Deal
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <EditAppointmentModal
        show={showEditModal}
        handleClose={() => setShowEditModal(false)}
        selectedItem={editItem}
        onSuccess={() => {
          handleFetchData(currentPage);
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
              setCheckMsg={() => {}} 
              checkMsg={false} 
              setReload={() => {}} 
              activeId={chatUserDetail?.sender_id} 
            />
          )}
        </Modal.Body>
      </Modal>

      <div className="mt-auto">
        <div className="flex justify-between items-center border shadow-sm bg_white rounded-lg w-full py-2 px-3">
          <span className="text_secondary inter_medium text">{`Total showing ${totalDataCount}`}</span>
          <div className="flex">
            <button
              className={`px-3 py-1 text-sm border rounded-l-md ${currentPage === 1 ? "bg_white text_dark cursor-not-allowed" : ""
                }`}
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              <ArrowLeft size={16} className="text_secondary" />
            </button>
            <div className="flex">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page, i) => (
                  <button
                    key={i}
                    className={`px-3 py-1 text-sm border ${currentPage === page
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
              className={`px-3 py-1 text-sm border rounded-r-md ${currentPage >= totalPages ? "cursor-not-allowed" : ""
                }`}
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
            >
              <ArrowRight size={16} className="text_secondary" />
            </button>
          </div>
        </div>
      </div>
      {selectedDeal && (
        <Modal show={showDeal} onHide={handleCloseDeal} centered>
          <Modal.Header closeButton>
            <h3 className="inter_medium mb-0 text-2xl text_black">Deal Info</h3>
          </Modal.Header>
          <Modal.Body>
            <div className="flex my-2 flex-col gap-2 w-full">
              <div className="flex items-center gap-4">
                <div
                  className="rounded-full text_primary p-2"
                  style={{ backgroundColor: "#e5cfff" }}
                >
                  <Calendar size={18} className="" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text_black mb-0 inter_semibold">
                    Validate Until:
                  </span>
                  <span className="text_dark text-sm inter_medium">
                    {selectedDeal?.deal?.expiry_date}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div
                  className="rounded-full text_primary p-2"
                  style={{ backgroundColor: "#e5cfff" }}
                >
                  <MdDiscount size={18} className="" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text_black mb-0 inter_semibold">
                    Discount:
                  </span>
                  <span className="text_dark text-sm inter_medium">
                    {selectedDeal?.deal?.discount} %
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div
                  className="rounded-full text_primary p-2"
                  style={{ backgroundColor: "#cfdcff", color: "#405fb3" }}
                >
                  <Code size={18} className="" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text_black mb-0 inter_semibold">
                    Promo Code:
                  </span>
                  <span className="text_dark text-sm inter_medium">
                    {selectedDeal?.deal?.promo_code}{" "}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col mb-2 items-start">
              <h6 className="text_black inter_semibold">Note</h6>
              <span className="text_dark inter_regular">
                {selectedDeal?.deal?.description}
              </span>
            </div>
            <div className="flex flex-col items-start">
              <h6 className="text_black inter_semibold">
                Services that are includes:
              </h6>
              <div className="flex items-center flex-wrap gap-2">
                {selectedDeal?.deal?.deal_services.map((service, index) => (
                  <div
                    key={index}
                    className="border px-2 py-1 rounded-full bg_white"
                  >
                    <span className="text_black">{service?.service_name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col my-3 items-start">
              <h6 className="text_black inter_semibold">Store Details:</h6>
              <div className="flex my-3 flex-col gap-2 w-full">
                <div className="flex items-center gap-4">
                  <div
                    className="rounded-full text_primary p-2"
                    style={{ backgroundColor: "#cfdcff", color: "#405fb3" }}
                  >
                    <MdPets size={18} className="" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text_dark inter_medium">
                      {selectedDeal?.business?.name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div
                    className="rounded-full text_white p-2 text-[#e7e74d]"
                    style={{ backgroundColor: "#e7e74d" }}
                  >
                    <IoLocationOutline size={18} className="" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text_dark inter_medium">
                      {selectedDeal?.business?.address}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg_primary text_white p-2">
                    <PhoneCall className="" size={18} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text_dark inter_medium">
                      {selectedDeal?.business?.phone}{" "}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Modal.Body>
        </Modal>
      )}

      <Modal
        show={showSheduleModal}
        onHide={() => setShowSheduleModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <div className="flex justify-start">
            <span className="text_dark text-2xl plusJakara_medium">
              Reschedule
            </span>
          </div>
        </Modal.Header>
        <Modal.Body>
          <Form layout="verticle" onFinish={handleSubmit}>
            <div className="flex gap-2 items-center mb-2">
              <button
                type="button"
                onClick={handleCalenderShow}
                style={{
                  backgroundColor:
                    selectShedule === "date" ? "#06d6a0" : "#f6f6f6",
                  color: selectShedule === "date" ? "#fff" : "#d3d3d3",
                }}
                className={`w-1/2 rounded-lg inter_semibold flex items-center justify-center p-2`}
              >
                Date
              </button>
              <button
                type="button"
                onClick={handleTimePickerShow}
                style={{
                  backgroundColor:
                    selectShedule === "time" ? "#06d6a0" : "#f6f6f6",
                  color: selectShedule === "time" ? "#fff" : "#d3d3d3",
                }}
                className={`w-1/2 rounded-lg inter_semibold flex items-center justify-center p-2`}
              >
                Time
              </button>
            </div>
            <div className="mb-2">
              {showTimePicker ? (
                <div className="w-full items_swiper overflow-hidden my-4">
                  <Swiper
                    spaceBetween={10}
                    freeMode={true}
                    modules={[Navigation, Autoplay, FreeMode, Pagination]}
                    className="mySwiper"
                    slidesPerView={"auto"}
                  >
                    {timeSlots?.map((item, i) => (
                      <SwiperSlide
                        key={i}
                        onClick={() => setTime(item)}
                        style={{ width: "80px", cursor: "pointer" }}
                        className={`py-2 text-center rounded-2 border ${time === item ? "bg_primary text_white" : "text_primary bg_white"} `}
                      >
                        {item}
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              ) : (
                <div
                  className="my-4 flex flex-nowrap scrolbar2 px-2 gap-2"
                  style={{ overflowX: "auto" }}
                >
                  <Input
                    required
                    type="date"
                    value={date}
                    onChange={(value) => checkIsDayExist(value)}
                  />
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isProcessing3}
              style={{ padding: "12px" }}
              className="flex justify-center items-center bg_primary inter_medium text_white w-full rounded-lg"
            >
              {isProcessing3 ? (
                <Spinner size={18} color="inherit" />
              ) : (
                "Reschedule"
              )}
            </button>
          </Form>
        </Modal.Body>
      </Modal>
    </main>
  );
};

export default Appointments;
