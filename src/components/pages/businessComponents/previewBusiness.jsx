/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { CircularProgress } from "@mui/material";
import { Form, message } from "antd";
import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { ArrowLeft, Check, Plus, Trash2 } from "react-feather";
import { useLocation, useNavigate } from "react-router-dom";
import { Autoplay, FreeMode, Navigation, Pagination } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";
import { apiRequest } from "../../../api/auth_api";
import {
  clock2,
  googlemap,
  internet,
  phone2,
  spotlight1,
  spotlight10,
  spotlight11,
  spotlight12,
  spotlight13,
  spotlight14,
  spotlight15,
  spotlight16,
  spotlight17,
  spotlight18,
  spotlight19,
  spotlight2,
  spotlight20,
  spotlight21,
  spotlight22,
  spotlight23,
  spotlight24,
  spotlight25,
  spotlight26,
  spotlight27,
  spotlight28,
  spotlight29,
  spotlight3,
  spotlight30,
  spotlight31,
  spotlight4,
  spotlight5,
  spotlight6,
  spotlight7,
  spotlight8,
  spotlight9,
} from "../../icons/icon";
import "../../styles/swiper.css";

const spotlightArray = [
  { title: "Consultation", icon: spotlight1 },
  { title: "Grooming", icon: spotlight2 },
  { title: "Vaccination", icon: spotlight3 },
  { title: "Radiological Control", icon: spotlight4 },
  { title: "Laboratory Diagnostics", icon: spotlight5 },
  { title: "Ultrasound Investigation", icon: spotlight6 },
  { title: "Dermatology", icon: spotlight7 },
  { title: "Spaying and Neutering", icon: spotlight8 },
  { title: "Surgery", icon: spotlight9 },
  { title: "Microchip Implant", icon: spotlight10 },
  { title: "Dentistry", icon: spotlight11 },
  { title: "Cardiology", icon: spotlight12 },
  { title: "Medicated Baths", icon: spotlight13 },
  { title: "Emergency Care", icon: spotlight14 },
  { title: "Insurance", icon: spotlight15 },
  {
    title: "Domestic and International Health Certificates",
    icon: spotlight16,
  },
  { title: "Animal Shelter", icon: spotlight17 },
  { title: "Donation", icon: spotlight18 },
  { title: "Pet Adoption", icon: spotlight19 },
  { title: "Pet Friendly", icon: spotlight20 },
  { title: "Pet Funeral", icon: spotlight21 },
  { title: "Pet Cremation", icon: spotlight22 },
  { title: "Telehealth", icon: spotlight23 },
  { title: "Dog Walker", icon: spotlight24 },
  { title: "Canine Training", icon: spotlight25 },
  { title: "Service", icon: spotlight26 },
  { title: "Pet Medication", icon: spotlight27 },
  { title: "Exotic Pet", icon: spotlight28 },
  { title: "Mobile Pet Service", icon: spotlight29 },
  { title: "Payment Plan", icon: spotlight30 },
  { title: "Locally Owned", icon: spotlight31 },
];

const PreviewBusiness = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const { state } = useLocation();
  const businessDetail = state?.businessStore || null;
  const [vetImages, setVetImages] = useState([]);
  const [services, setServices] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [spotLights, setSpotLights] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [multipleBusinesses, setMultipleBusinesses] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [show, setShow] = useState(false);
  const [count, setCount] = useState("");
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [showTiming, setShowTiming] = useState(false);
  const [today, setToday] = useState("");
  const handleCloseTiming = () => setShowTiming(false);
  const handleShowTiming = () => setShowTiming(true);
  const handleClosePortfolio = () => setShowPortfolio(false);
  const handleShowPortfolio = () => setShowPortfolio(true);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleSubmit = (e) => {};

  useEffect(() => {
    handleFetchDataService();
  }, [count]);

  const handleFetchDataService = async () => {
    setIsProcessing(true);
    try {
      const body = new FormData();
      body.append("type", "get_data");
      body.append("table_name", "services");
      body.append("business_id", businessDetail?.id);
      body.append("limit", 100);
      const res = await apiRequest({ body });
      if (res && res?.data) {
        setServices(res?.data);
        // const lastServiceId = res?.data?.[res?.data?.length - 1]?.id;
        // const filteredServices = res.data?.filter(newService => !services.find(oldService => oldService?.id === newService?.id));
        // setServices(prevServices => {
        //     if (!count || res.data.length >= 10) {
        //         return filteredServices;
        //     } else {
        //         return [...prevServices, ...filteredServices];
        //     }
        // });
        // if (res.data.length >= 10) {
        //     setCount(lastServiceId);
        // }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBusinessClick = (service) => {
    navigate(`/services/update-service/${service?.id}`, {
      state: { serviceData: service },
    });
  };

  const handleDeleteService = async (id) => {
    const body = new FormData();
    body.append("type", "delete_data");
    body.append("table_name", "services");
    body.append("id", id);
    await apiRequest({ body })
      .then(async (res) => {
        if (res) {
          message.success("Service Deleted Successfully");
          handleFetchDataService();
          navigate("/business");
        } else {
          console.error("deletion failed...");
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const safeJSONParse = (jsonString) => {
    if (!jsonString) return [];
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn("JSON parse failing cleanly:", error);
      try {
        // Handle double-escaped strings if present
        return JSON.parse(jsonString.replace(/\\"/g, '"'));
      } catch (e2) {
        return [];
      }
    }
  };

  useEffect(() => {
    if (businessDetail) {
      setInputValue(businessDetail?.website_link || "");

      const businessDetailImages = safeJSONParse(
        businessDetail?.business_images,
      );
      setVetImages(
        Array.isArray(businessDetailImages) ? businessDetailImages : [],
      );

      const pMethods = safeJSONParse(businessDetail?.payment_types);
      setPaymentMethods(Array.isArray(pMethods) ? pMethods : []);

      const spotLight = safeJSONParse(businessDetail?.spotlight);
      setSpotLights(Array.isArray(spotLight) ? spotLight : []);

      const gallery = safeJSONParse(businessDetail?.gallery);
      setGalleryImages(Array.isArray(gallery) ? gallery : []);

      const timing = safeJSONParse(businessDetail?.availability);
      setAvailability(Array.isArray(timing) ? timing : []);

      const portfolio = safeJSONParse(businessDetail?.portfolio);
      const businessDetaildPortfolio = Array.isArray(portfolio)
        ? portfolio.map((item) => ({
            image: global.IMAGEURL + "/" + item?.image,
            name: item?.name,
            job_title: item?.job_title,
          }))
        : [];
      setPortfolios(businessDetaildPortfolio);

      const multipleBusinessesRaw = safeJSONParse(
        businessDetail?.mobile_vet_detail,
      );
      const multipleBusiness = Array.isArray(multipleBusinessesRaw)
        ? multipleBusinessesRaw.map((item) => ({
            address: item?.address,
            lat: item?.lat,
            lng: item?.lng,
            description: item?.description,
            startDate: item?.startDate,
            endDate: item?.endDate,
          }))
        : [];
      setMultipleBusinesses(multipleBusiness);

      const members = safeJSONParse(businessDetail?.team_members);
      const businessDetaildMembers = Array.isArray(members)
        ? members.map((item) => ({
            image: global.IMAGEURL + "/" + item?.image,
            name: item?.name,
            job_title: item?.job_title,
          }))
        : [];
      setTeamMembers(businessDetaildMembers);
    }
  }, [businessDetail]);

  useEffect(() => {
    const currentDay = new Date()
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();
    setToday(currentDay);
  }, []);

  const handleWebsite = () => {
    const websiteLink = businessDetail?.website_link;
    if (
      websiteLink &&
      !websiteLink.startsWith("http://") &&
      !websiteLink.startsWith("https://")
    ) {
      window.open(`http://${websiteLink}`, "_blank");
    } else {
      window.open(websiteLink, "_blank");
    }
  };

  const handleMapClick = () => {
    const lat = parseFloat(businessDetail?.lat);
    const lng = parseFloat(businessDetail?.lng);

    if (!isNaN(lat) && !isNaN(lng)) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
    } else {
      console.error("Invalid latitude or longitude");
    }
  };

  const handleMapClick2 = (lat, lng) => {
    console.log(lat, lng);
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (!isNaN(latitude) && !isNaN(longitude)) {
      window.open(
        `https://www.google.com/maps?q=${latitude},${longitude}`,
        "_blank",
      );
    } else {
      console.error("Invalid latitude or longitude");
    }
  };

  const handleUpdate = () => {
    navigate(`/business/update-business/${businessDetail?.id}`, {
      state: { serviceDetail: businessDetail },
    });
  };

  return (
    <main className="container m-auto min-h-screen py-4">
      <div className="flex justify-between flex-wrap gap-3 items-center mb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              navigate(-1);
            }}
            className="flex items-center justify-center w-[36px] h-[36px] bg_primary rounded-lg"
          >
            <ArrowLeft className="text_white" />
          </button>
          <span className="inter_semibold text-xl md:text-2xl text_dark">
            Business Detail
          </span>
        </div>
        <button
          onClick={() => handleUpdate(businessDetail)}
          type="button"
          className="flex justify-center bg_primary py-[12px] px-[1rem] rounded-lg items-center button_shadow"
        >
          <span className="inter_semibold text-sm text_white">
            Edit Business
          </span>
        </button>
      </div>
      <Form
        layout="verticle"
        onFinish={handleSubmit}
        className="w-full lg:w-[90%] xl:w-[80%] m-auto bg_white rounded-lg shadow-md p-[1rem] md:p-[2rem]"
      >
        <div className="w-full items_swiper overflow-hidden mb-4">
          <Swiper
            spaceBetween={10}
            navigation={true}
            freeMode={true}
            modules={[Navigation, Autoplay, FreeMode, Pagination]}
            className="mySwiper"
            autoplay={{
              delay: 2000,
              disableOnInteraction: true,
            }}
            slidesPerView={"auto"}
          >
            {vetImages &&
              vetImages?.map((image, index) => (
                <SwiperSlide key={index} className="bg_img w-full">
                  <img
                    src={`${global.IMAGEURL}/${image}`}
                    style={{ height: "25rem" }}
                    className="object-cover object-center w-full rounded-4"
                    alt=""
                  />
                </SwiperSlide>
              ))}
          </Swiper>
        </div>
        <h1 className="inter_semibold text-3xl text_dark">
          {businessDetail?.name}
        </h1>
        <h6 className="text_secondary text-xl md:text-2xl inter_regular mb-3">
          {businessDetail?.bio}
        </h6>
        <h6 className="text_dark text-xl md:text-2xl inter_semibold mb-0">
          Eligibility Criteria
        </h6>
        <span className="text_secondary text-lg inter_regular">
          {businessDetail?.eligibility_criteria || "No Criteria"}
        </span>
        <div className="flex flex-wrap items-center gap-3 my-3">
          <button
            onClick={handleWebsite}
            className="border no-underline rounded-lg flex justify-center items-center gap-2"
            style={{ width: "7rem", height: "3rem" }}
          >
            <img src={internet} alt="" />
            <span className="inter_medium text_secondary">Website</span>
          </button>
          <a
            href={`tel:${businessDetail?.phone}`}
            className="border no-underline rounded-lg flex justify-center items-center gap-2"
            style={{ width: "7rem", height: "3rem" }}
          >
            <img src={phone2} alt="" />
            <span className="inter_medium text_secondary">Phone</span>
          </a>
          <button
            onClick={handleShowTiming}
            className="border rounded-lg flex justify-center items-center gap-2"
            style={{ width: "7rem", height: "3rem" }}
          >
            <img src={clock2} alt="" />
            <span className="inter_medium text_secondary">Hours</span>
          </button>
        </div>
        {businessDetail?.business_type === "standard" && (
          <div
            className="flex items-center gap-3 mb-4"
            onClick={handleMapClick}
          >
            <img src={googlemap} className="cursor-pointer" alt="" />
            <span className="text_secondary text-lg md:text-xl inter_regular cursor-pointer">
              {businessDetail.address}
            </span>
          </div>
        )}
        <h1 className="text_dark text-xl inter_semibold">Business Type</h1>
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <button
            type="button"
            className={`border cursor-pointer rounded-3 gap-1 px-[1rem] py-2 inter_medium text-sm flex justify-center items-center bg-[#F8F2FD] text_primary`}
          >
            {businessDetail?.business_type === "mobile"
              ? "Mobile Vet Clinic"
              : "Standard Clinic"}
          </button>
        </div>
        {businessDetail?.business_type === "mobile" && (
          <>
            <h1 className="text_dark text-xl inter_semibold">
              Clinic Addresses
            </h1>
            <div className="flex flex-wrap gap-2 mb-4 items-center">
              <div className="d-flex flex-wrap gap-3 mb-4 justify-content-center justify-content-lg-start">
                {multipleBusinesses === 0 ||
                !businessDetail?.mobile_vet_detail ? (
                  <div className="d-flex w-full justify-content-center">
                    <span className="inter_regular text-lg text_black">
                      No Address Found
                    </span>
                  </div>
                ) : (
                  multipleBusinesses?.map((item, i) => (
                    <div
                      key={i}
                      className="border border-[#EDF2F6] box_styling no-underline bg_white shadow-sm rounded-lg gap-3 flex flex-col items-start p-3"
                    >
                      <div className="flex flex-col gap-1 w-full">
                        <h5 className="text_dark text-lg mb-0 inter_medium">
                          Address
                        </h5>
                        <button
                          onClick={() => handleMapClick2(item?.lat, item?.lng)}
                          className="flex justify-start items-start gap-1"
                        >
                          <img
                            src={googlemap}
                            className="cursor-pointer"
                            style={{ width: "24px", height: "auto" }}
                            alt=""
                          />
                          <span className="text_dark text-start inter_regular">
                            {item?.address}
                          </span>
                        </button>
                      </div>
                      <div className="flex flex-col gap-1 w-full">
                        <h5 className="text_dark text-lg mb-0 inter_medium">
                          Description
                        </h5>
                        <span className="text_dark inter_regular">
                          {item?.description}
                        </span>
                      </div>
                      <div className="flex justify-between items-center w-full">
                        <div className="flex flex-col gap-1 w-full">
                          <h5 className="text_dark text-lg mb-0 inter_medium">
                            Start Date
                          </h5>
                          <span className="text_dark inter_regular">
                            {item?.startDate}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 w-full">
                          <h5 className="text_dark text-lg mb-0 inter_medium">
                            End Date
                          </h5>
                          <span className="text_dark inter_regular">
                            {item?.endDate}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
        <h1 className="text_dark text-xl inter_semibold">
          Available Payment Methods
        </h1>
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          {paymentMethods &&
            paymentMethods?.map((method, index) => (
              <button
                key={index}
                type="button"
                className={`border cursor-pointer rounded-3 gap-1 px-[1rem] py-2 inter_medium text-sm flex justify-center items-center bg-[#F8F2FD] text_primary`}
              >
                <Check className="text_primary" size={16} />
                {method}
              </button>
            ))}
        </div>
        <h1 className="text_dark text-xl inter_semibold">Spotlight</h1>
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          {spotLights &&
            spotLights?.map((spotlight, index) => (
              <button
                key={index}
                type="button"
                className={`border cursor-pointer rounded-3 gap-1 px-3 py-2 text-sm flex justify-center items-center bg-[#F8F2FD] text_primary`}
              >
                <div className="flex items-center gap-1">
                  <img
                    src={
                      spotlightArray.find((spot) => spot?.title === spotlight)
                        ?.icon
                    }
                    style={{ height: "20px", width: "auto" }}
                    className="w-4 h-4 object-cover"
                    alt=""
                  />
                  {spotlight}
                </div>
              </button>
            ))}
        </div>
        {galleryImages && (
          <>
            <h1 className="text_dark text-xl inter_semibold mb-3">
              Vet Gallary
            </h1>
            <div className="flex gap-3 items-center mb-4 flex-wrap">
              {galleryImages.length > 0 &&
                galleryImages?.map((image, i) => (
                  <img
                    style={{ width: "7rem", height: "5rem" }}
                    key={i}
                    src={`${global.IMAGEURL}/${image}`}
                    className="rounded-lg object-cover"
                    alt=""
                  />
                ))}
            </div>
          </>
        )}
        {portfolios.length > 0 && businessDetail?.portfolio !== "[{}]" && (
          <>
            <h1 className="text_dark text-xl inter_semibold mb-3">
              Vet Portfolio
            </h1>
            {portfolios?.slice(0, 1).map((portfolio, i) => (
              <div key={i} className="flex gap-3 mb-4">
                <img
                  style={{ width: "7rem", height: "5rem" }}
                  src={portfolio?.image}
                  className="rounded-lg object-cover"
                  alt=""
                />
                <div className="flex flex-col gap-1">
                  <span className="inter_medium text-xl text_dark">
                    {portfolio?.name}
                  </span>
                  <span className="inter_medium text_secondary">
                    {portfolio?.job_title}
                  </span>
                  <button
                    onClick={handleShowPortfolio}
                    className="inter_medium rounded-3 w-fit px-5 py-2 bg-[#F8F2FD] text_primary"
                  >
                    View All
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
        {teamMembers.length > 0 && businessDetail?.team_members !== "[{}]" && (
          <>
            <h1 className="text_dark text-xl inter_semibold mb-3">
              Team Members
            </h1>
            {teamMembers.slice(0, 1).map((member, i) => (
              <div key={i} className="flex gap-3 mb-4">
                <img
                  src={member?.image}
                  style={{ width: "6rem", height: "5rem" }}
                  className="rounded-lg object-cover"
                  alt=""
                />
                <div className="flex flex-col gap-1">
                  <span className="inter_medium text-xl text_dark">
                    {member?.name}
                  </span>
                  <span className="inter_medium text_secondary">
                    {member?.job_title}
                  </span>
                  <button
                    onClick={handleShow}
                    className="inter_medium rounded-3 px-5 w-fit py-2 bg-[#F8F2FD] text_primary"
                  >
                    View All
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
        <div className="flex w-full justify-between my-4 items-center flex-wrap">
          <h1 className="text_dark text-xl inter_semibold">Services</h1>
          <button
            onClick={() => {
              navigate("/services/create-service", {
                state: { businessData: businessDetail },
              });
            }}
            className="flex justify-center bg_primary p-2 rounded-lg items-center gap-2 button_shadow"
          >
            <Plus size={18} className="hidden md:block text_white" />
            <span className="inter_semibold max-md:text-xs text-sm text_white">
              Create service
            </span>
          </button>
        </div>
        {isProcessing ? (
          <div className="flex w-full justify-center items-center my-5">
            <CircularProgress
              className="text_primary"
              size={30}
              thickness={3}
            />
          </div>
        ) : (
          <div className="d-flex flex-wrap gap-3 mb-4 justify-content-center justify-content-lg-start">
            {!services || services?.length === 0 ? (
              <div className="my-5 flex justify-center items-center w-full">
                <span className="text_dark inter_medium">No Service Found</span>
              </div>
            ) : (
              services?.map((item, i) => (
                <div
                  key={i}
                  className="border border-[#EDF2F6] box_styling no-underline bg_white shadow-sm rounded-lg gap-1 flex flex-col items-start w-full h-auto p-2"
                >
                  <div
                    onClick={() => handleBusinessClick(item)}
                    className="cursor-pointer w-full"
                  >
                    <div className="flex w-full gap-2 justify-between">
                      <div className="flex flex-col flex-wrap w-full">
                        <span className="text_dark plusJakara_bold">
                          {item?.service_name}
                        </span>
                        <span className="text_dark text-sm plusJakara_regular">
                          {item && item.sub_service
                            ? (() => {
                                const parsedSubService = safeJSONParse(
                                  item?.sub_service,
                                );
                                return Array.isArray(parsedSubService)
                                  ? parsedSubService.map(
                                      (subService, index) => (
                                        <React.Fragment key={index}>
                                          {index > 0 && ", "}
                                          {subService}
                                        </React.Fragment>
                                      ),
                                    )
                                  : parsedSubService;
                              })()
                            : ""}
                        </span>
                      </div>
                      <div className="d-flex flex-column w-full flex-wrap align-items-end">
                        <span className="text-xl text_dark plusJakara_bold">
                          {item?.amount}
                        </span>
                        <span className="text_dark text-sm plusJakara_regular">
                          {item?.cost_type}
                        </span>
                      </div>
                    </div>
                    <div className="flex w-full flex-wrap justify-start my-2">
                      <span className="text-sm plusJakara_regular text_dark">
                        {item?.description}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end w-full">
                    <button
                      className=""
                      onClick={() => {
                        handleDeleteService(item?.id);
                      }}
                    >
                      <Trash2 style={{ color: "red" }} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Form>
      <Modal show={showPortfolio} onHide={handleClosePortfolio} centered>
        <Modal.Header closeButton>
          <span className="text-2xl plusJakara_medium text_dark">
            Vet Portfolio
          </span>
        </Modal.Header>
        <Modal.Body>
          {portfolios.length > 0 &&
            portfolios.map((portfolio, i) => (
              <div
                key={i}
                className="flex justify-start items-center my-2 gap-4"
              >
                <img
                  style={{ width: "3rem", height: "3rem" }}
                  src={`${portfolio?.image}`}
                  className="object-cover rounded-3"
                  alt=""
                />
                <div className="flex flex-col">
                  <h5 className="text_dark plusJakara_medium">
                    {portfolio?.name}
                  </h5>
                  <span className="text-xs text_secondary plusJakara_medium">
                    {portfolio?.job_title}
                  </span>
                </div>
              </div>
            ))}
        </Modal.Body>
      </Modal>
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <span className="text-2xl plusJakara_medium text_dark">
            Team Members
          </span>
        </Modal.Header>
        <Modal.Body>
          {teamMembers.length > 0 &&
            teamMembers.map((member, i) => (
              <div
                key={i}
                className="flex justify-start items-center my-2 gap-4"
              >
                <img
                  src={`${member?.image}`}
                  style={{ width: "3rem", height: "3rem" }}
                  className="object-cover rounded-3"
                  alt=""
                />
                <div className="flex flex-col">
                  <h5 className="text_dark plusJakara_medium">
                    {member?.name}
                  </h5>
                  <span className="text-xs text_secondary plusJakara_medium">
                    {member?.job_title}
                  </span>
                </div>
              </div>
            ))}
        </Modal.Body>
      </Modal>
      <Modal show={showTiming} onHide={handleCloseTiming} centered>
        <Modal.Header closeButton>
          <span className="text-2xl plusJakara_medium text_dark">
            Opening Timings
          </span>
        </Modal.Header>
        <Modal.Body>
          {availability.length > 0 &&
            availability?.map((time, i) => (
              <div
                key={i}
                className="flex justify-between items-center w-full gap-2 my-2"
              >
                <span
                  style={{ width: "25%" }}
                  className="text_dark text-xl plusJakara_medium"
                >
                  {time?.day}
                </span>
                <span
                  style={{ width: "25%" }}
                  className="text_dark text-xl plusJakara_regular"
                >
                  {time?.from}
                </span>
                <span
                  style={{ width: "25%" }}
                  className="text_dark text-xl plusJakara_regular"
                >
                  {time?.to}
                </span>
                <span
                  style={{ width: "25%" }}
                  className="text_dark text-xl plusJakara_regular"
                >
                  {time?.day?.toLowerCase() === today ? (
                    <span
                      style={{ color: "green" }}
                      className="text-green-500 plusJakara_medium"
                    >
                      Open now
                    </span>
                  ) : (
                    <span
                      style={{ color: "red" }}
                      className="text-red-500 plusJakara_medium"
                    >
                      Closed now
                    </span>
                  )}
                </span>
              </div>
            ))}
        </Modal.Body>
      </Modal>
    </main>
  );
};

export default PreviewBusiness;
