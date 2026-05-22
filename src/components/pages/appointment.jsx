/* eslint-disable no-mixed-operators */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import Spinner from "../Spinner";
import { Form, message, Segmented } from "antd";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Code,
  Mail,
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


const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

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

  const handleCloseDetail = () => setShowDetail(false);

  const handleShowDetail = (item) => {
    setSelectedItem(item);
    setShowDetail(true);
    const availability =
      (item?.business?.availability &&
        JSON.parse(item?.business?.availability)) ||
      [];
    setScheduleData(availability);
    // console.log(availability);
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
      {isProcessing ? (
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
                // style={{ maxWidth: "24rem" }}
                className="border border-[#EDF2F6] box_styling bg_white shadow-sm relative rounded-lg flex items-start gap-2 w-full sm:max-w-[25rem] md:max-w-[21rem] lg:max-w-[25rem] xl:max-w-[24rem] h-auto p-2"
              >
                <div className="flex w-full gap-2">
                  <div
                    style={{ backgroundColor: "#BD66FF1A" }}
                    onClick={() => handleShowDetail(item)}
                    className="rounded-lg cursor-pointer flex justify-center items-center h-auto p-1"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text_primary text-center plusJakara_medium">
                        {item?.booking_time_12hour}
                      </span>
                      {/* <span className="text_primary plusJakara_medium">P.M.</span> */}
                    </div>
                  </div>
                  <div className="flex flex-col w-full gap-2">
                    <div
                      className="cursor-pointer"
                      onClick={() => handleShowDetail(item)}
                    >
                      <div className="flex mb-1 justify-between items-center">
                        <div
                          style={{ backgroundColor: "#5CE2C51C" }}
                          className="rounded-lg text-[#06D6A0] py-1 px-2 inter_medium text-xs"
                        >
                          {item?.status}
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center">
                            <img src={locationsmall} alt="" />
                            <span className="plusJakara_medium text-sm text_secondary">
                              1.5 km
                            </span>
                          </div>
                          <span className="text_secondary inter_medium whitespace-nowrap" style={{ fontSize: '11px' }}>
                            {item?.created_at ? moment(item?.created_at).format("MMM DD, YYYY") : "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="flex w-full flex-wrap flex-md-nowrap gap-2">
                        <img
                          src={`${global.IMAGEURL}/${item?.pet?.image}`}
                          style={{
                            width: "64px",
                            height: "64px",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                          alt=""
                        />
                        <div className="flex flex-col">
                          <span className="text-xl text_dark plusJakara_medium">
                            {item?.pet?.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1 items-center">
                              <img src={specie} alt="" />
                              <span className="text-sm text_dark inter_regular">
                                {item?.pet?.species}
                              </span>
                            </div>
                            <div className="flex gap-1 items-center">
                              <img src={breed} alt="" />
                              <span className="text-sm text_dark inter_regular">
                                {item?.pet?.breed}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text_dark text-2xl plusJakara_medium">
                        {item?.deal && (
                          <button
                            style={{ border: "2px solid #8930F9" }}
                            onClick={() => handleShowDeal(item)}
                            className="bg_white text_primary py-1 px-2 me-2 rounded-full text-sm inter_semibold"
                          >
                            View Deal
                          </button>
                        )}
                        ${calculateDiscountedAmount(item)}
                      </span>
                      {item?.service && (
                        <span className="text-xs text_secondary plusJakara_regular italic">
                          ({item?.service?.cost_type})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
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
      {selectedItem && (
        <Modal show={showDetail} onHide={handleCloseDetail} centered>
          <Modal.Header
            style={{ borderBottom: "none" }}
            closeButton
          ></Modal.Header>
          <Modal.Body>
            <Form onFinish={handleUpdate}>
              <div className="flex items-start max-md:flex-col w-full gap-2">
                <img
                  src={`${global.IMAGEURL}/${selectedItem?.business?.logo}`}
                  style={{
                    height: "4rem",
                    width: "4rem",
                    aspectRatio: "4/4",
                    objectFit: "cover",
                    borderRadius: "18px",
                  }}
                  alt=""
                />
                <div className="flex flex-col">
                  <span className="text-3xl text_dark plusJakara_medium">
                    {selectedItem?.business?.name}
                  </span>
                  <span className="text_secondary plusJakara_medium">
                    {selectedItem?.business?.address}
                  </span>
                </div>
              </div>
              <div className="my-2 rounded-lg flex flex-column flex-sm-row align-items-start align-items-sm-center gap-3 p-2 bg-[#E6FBF5]">
                <img
                  src={`${global.IMAGEURL}/${selectedItem?.pet?.image}`}
                  style={{
                    height: "5rem",
                    width: "5rem",
                    aspectRatio: "4/4",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                  alt=""
                />
                <div className="flex flex-col gap-1">
                  <span className="text-2xl text_dark plusJakara_medium">
                    {selectedItem?.pet?.name}
                  </span>
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex items-center gap-1">
                      <img src={specie} alt="" />
                      <span className="text-sm plusJakara_medium text_dark">
                        {selectedItem?.pet?.species}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <img src={breed} alt="" />
                      <span className="text-sm plusJakara_medium text_dark">
                        {selectedItem?.pet?.breed}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <img src={gender} alt="" />
                      <span className="text-sm plusJakara_medium text_dark">
                        {selectedItem?.pet?.gender}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <img src={birthimage} alt="" />
                      <span className="text-sm plusJakara_medium text_dark">
                        {selectedItem?.pet?.dob}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <img src={weight} alt="" />
                      <span className="text-sm plusJakara_medium text_dark">
                        {selectedItem?.pet?.avg_weight
                          ? selectedItem?.pet?.avg_weight + " lbs"
                          : selectedItem?.pet?.weight}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col mb-2 items-start">
                <span className="text_dark plusJakara_medium">Created Date:</span>
                <span className="text_secondary plusJakara_regular text-sm">
                  {selectedItem?.created_at ? moment(selectedItem?.created_at).format("MMM DD, YYYY h:mm A") : "N/A"}
                </span>
              </div>
              <div className="flex flex-col mb-2 items-start">
                <span className="text_dark plusJakara_medium">Name:</span>
                <span className="text_secondary plusJakara_regular">
                  {selectedItem?.name}
                </span>
              </div>
              <div className="flex flex-col mb-2">
                <span className="text_dark plusJakara_medium">Notes:</span>
                <span className="text_secondary text-sm plusJakara_regular">
                  {selectedItem?.note}
                </span>
              </div>
              <div className="flex flex-col mb-2">
                <span className="text_dark plusJakara_medium">Service:</span>
                <div className="d-flex flex-wrap gap-1 align-items-center">
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
              <div className="flex flex-col mb-2">
                <span className="text_dark plusJakara_medium">Subservice:</span>
                <div className="d-flex flex-wrap gap-1 align-items-center">
                  {(selectedItem?.order_type === "deal" &&
                    !selectedItem?.deal?.deal_services) ||
                    selectedItem?.deal?.deal_services === null ? (
                    <span>Not Found</span>
                  ) : (
                    selectedItem?.deal?.deal_services?.map((dealService, i) => (
                      <div key={i}>
                        {dealService?.sub_service &&
                          JSON.parse(dealService?.sub_service).map(
                            (subItem, j) => (
                              <span
                                key={j}
                                className="text_secondary text-sm plusJakara_regular"
                              >
                                {subItem} {j >= 0 && ", "}{" "}
                              </span>
                            ),
                          )}
                      </div>
                    ))
                  )}
                  {selectedItem?.order_type === "service" &&
                    selectedItem?.services?.map((service, i) => (
                      <div key={i}>
                        <span className="text_dark text-sm plusJakara_medium">
                          {i + 1}. {service?.service_name}
                        </span>
                        <div className="ml-2">
                          {service?.sub_service &&
                            JSON.parse(service.sub_service).map(
                              (subService, j) => (
                                <span
                                  key={j}
                                  className="text_secondary text-sm plusJakara_regular"
                                >
                                  {subService}
                                  {j <
                                    JSON.parse(service.sub_service).length -
                                    1 && ", "}
                                </span>
                              ),
                            )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-center mb-2">
                <div className="flex gap-1 items-center">
                  <Phone className="text_dark" size={14} />
                  <span className="text-sm plusJakara_medium text_dark">
                    {selectedItem?.phone}
                  </span>
                </div>
                <div className="flex gap-1 items-center">
                  <Mail className="text_dark" size={14} />
                  <span className="text-sm plusJakara_medium text_dark">
                    {selectedItem?.email}
                  </span>
                </div>
              </div>
              <div className="flex justify-between w-full items-center flex-wrap gap-2 mb-2">
                <div className="flex gap-2 items-center flex-wrap">
                  <button
                    type="button"
                    onClick={() =>
                      selectedItem?.status === "pending" && handleSheduleModal()
                    }
                    className="flex items-center gap-1"
                  >
                    <img src={calendersmall} alt="" />
                    <span className="plusJakara_medium text-sm text_dark">
                      {selectedItem?.booking_date}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      selectedItem?.status === "pending" && handleSheduleModal()
                    }
                    className="flex items-center gap-1"
                  >
                    <img
                      src={clock}
                      style={{ width: "24px", height: "auto" }}
                      alt=""
                    />
                    <span className="plusJakara_medium text-sm text_dark">
                      {selectedItem?.booking_time_12hour}
                    </span>
                  </button>
                  <div className="flex items-center gap-1">
                    <img src={building} alt="" />
                    <span className="plusJakara_medium text-sm text_dark">
                      Office Visit
                    </span>
                  </div>
                </div>
                {selectedItem?.order_type === "service" && (
                  <span className="text-3xl text_dark plusJakara_medium">
                    {/* {typeof selectedItem?.service?.amount === 'string' ? parseFloat(selectedItem?.service?.amount).toFixed(2) : 'N/A'}$ */}
                    ${calculateDiscountedAmount(selectedItem)}
                  </span>
                )}
                {selectedItem?.order_type === "deal" && (
                  <span className="text-3xl text_dark plusJakara_medium">
                    ${calculateDiscountedAmount(selectedItem)}
                  </span>
                )}
              </div>
              <div className="flex gap-2 items-center">
                {renderStatusButtons(selectedItem)}
              </div>
            </Form>
          </Modal.Body>
        </Modal>
      )}
    </main>
  );
};

export default Appointments;
