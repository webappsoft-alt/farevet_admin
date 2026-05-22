/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import Spinner from "../../Spinner";
import { message } from "antd";
import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import {
  ArrowLeft,
  Check,
  Clock,
  Edit2,
  Globe,
  MapPin,
  Phone,
  Plus,
  Star,
  Trash2,
} from "react-feather";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Autoplay, FreeMode, Navigation, Pagination } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";
import { apiRequest } from "../../../api/auth_api";
import { avatar2 } from "../../icons/icon";
import { parseStringList } from "./businessOptions";
import "./previewBusiness.scss";
import {
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
  const { id: routeBusinessId } = useParams();
  const { state } = useLocation();
  const [businessDetail, setBusinessDetail] = useState(
    () => state?.businessStore ?? null,
  );

  useEffect(() => {
    if (
      state?.businessStore &&
      routeBusinessId &&
      String(state.businessStore.id) === String(routeBusinessId)
    ) {
      setBusinessDetail(state.businessStore);
    }
  }, [state?.businessStore, routeBusinessId]);

  useEffect(() => {
    if (!routeBusinessId) return;
    if (
      state?.businessStore &&
      String(state.businessStore.id) === String(routeBusinessId)
    ) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const body = new FormData();
        body.append("type", "get_data");
        body.append("table_name", "businesses");
        body.append("id", String(routeBusinessId));
        const res = await apiRequest({ body });
        let row = null;
        if (Array.isArray(res?.data) && res.data.length > 0) {
          row = res.data[0];
        } else if (
          res?.data &&
          typeof res.data === "object" &&
          !Array.isArray(res.data)
        ) {
          row = res.data;
        } else if (Array.isArray(res) && res.length > 0) {
          row = res[0];
        } else if (res && typeof res === "object" && !Array.isArray(res)) {
          row = res;
        }
        if (cancelled) return;
        if (row) {
          setBusinessDetail(row);
        } else {
          message.error("Business not found.");
          navigate("/business");
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          message.error("Could not load business.");
          navigate("/business");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [routeBusinessId, state?.businessStore, navigate]);
  const [inputValue, setInputValue] = useState("");
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

  const certifications = parseStringList(
    businessDetail?.certifications ??
      businessDetail?.certification ??
      businessDetail?.certificates,
  );
  const clinicTypeValue =
    businessDetail?.clinic_type || businessDetail?.type || "";
  const ownershipValue =
    businessDetail?.ownership || businessDetail?.owner_type || "";
  const ratingValue = parseFloat(
    businessDetail?.rating?.rating ?? businessDetail?.rating ?? 0,
  );
  const ratingStars =
    Number.isFinite(ratingValue) && ratingValue > 0
      ? Math.min(5, Math.round(ratingValue))
      : 0;

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
    <main className="business-preview">
      <div className="bp-topbar">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bp-back"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="bp-title">Business Detail</span>
        </div>
        <button
          onClick={() => handleUpdate(businessDetail)}
          type="button"
          className="bp-edit-btn"
        >
          <Edit2 size={14} />
          Edit Business
        </button>
      </div>

      {vetImages && vetImages.length > 0 ? (
        <div className="bp-hero">
          <Swiper
            spaceBetween={10}
            navigation={true}
            freeMode={true}
            modules={[Navigation, Autoplay, FreeMode, Pagination]}
            className="mySwiper"
            autoplay={{ delay: 2500, disableOnInteraction: true }}
            slidesPerView={"auto"}
          >
            {vetImages.map((image, index) => (
              <SwiperSlide key={index} className="bg_img w-full">
                <img src={`${global.IMAGEURL}/${image}`} alt="" />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      ) : (
        <div className="bp-hero-empty">No business images uploaded</div>
      )}

      <div className="bp-layout">
        <div>
          {/* Profile header */}
          <section className="bp-card bp-header-card">
            <div className="bp-header-top">
              <img
                src={
                  businessDetail?.logo
                    ? `${global.IMAGEURL}/${businessDetail?.logo}`
                    : avatar2
                }
                className="bp-logo"
                alt=""
              />
              <div className="bp-header-text">
                <span className="bp-business-name">
                  {businessDetail?.name || "—"}
                </span>
                {businessDetail?.bio ? (
                  <span className="bp-business-bio">{businessDetail?.bio}</span>
                ) : null}
                <div className="bp-rating-row">
                  <span className="bp-stars" aria-hidden>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star
                        key={i}
                        size={15}
                        strokeWidth={0}
                        fill={i < ratingStars ? "#EFD01D" : "#cbd5e1"}
                      />
                    ))}
                  </span>
                  <span className="bp-rating-value">
                    {Number.isFinite(ratingValue) && ratingValue > 0
                      ? `${ratingValue.toFixed(1)} / 5`
                      : "No reviews yet"}
                  </span>
                </div>
              </div>
            </div>

            {(clinicTypeValue ||
              ownershipValue ||
              certifications.length > 0 ||
              businessDetail?.business_type) && (
              <div className="bp-chip-row">
                {businessDetail?.business_type ? (
                  <span className="bp-chip is-primary">
                    {businessDetail?.business_type === "mobile"
                      ? "Mobile Vet Clinic"
                      : "Standard Clinic"}
                  </span>
                ) : null}
                {clinicTypeValue ? (
                  <span className="bp-chip is-clinic">{clinicTypeValue}</span>
                ) : null}
                {ownershipValue ? (
                  <span className="bp-chip is-ownership">{ownershipValue}</span>
                ) : null}
                {certifications.map((c) => (
                  <span key={c} className="bp-chip is-cert">
                    {c}
                  </span>
                ))}
              </div>
            )}

            <div className="bp-actions-row">
              <button
                type="button"
                onClick={handleWebsite}
                className="bp-action-btn"
                disabled={!businessDetail?.website_link}
              >
                <Globe />
                <span>Website</span>
              </button>
              <a
                href={`tel:${businessDetail?.phone}`}
                className="bp-action-btn"
              >
                <Phone />
                <span>Phone</span>
              </a>
              <button
                type="button"
                onClick={handleShowTiming}
                className="bp-action-btn"
              >
                <Clock />
                <span>Hours</span>
              </button>
            </div>
          </section>

          {/* About / eligibility */}
          {(businessDetail?.eligibility_criteria ||
            businessDetail?.address) && (
            <section className="bp-card">
              {businessDetail?.business_type === "standard" &&
              businessDetail?.address ? (
                <>
                  <h3 className="bp-section-title">Address</h3>
                  <div
                    className="bp-address-row"
                    onClick={handleMapClick}
                    role="button"
                    tabIndex={0}
                  >
                    <MapPin size={18} />
                    <span>{businessDetail.address}</span>
                  </div>
                </>
              ) : null}
              {businessDetail?.eligibility_criteria ? (
                <>
                  <h3
                    className="bp-section-title"
                    style={{ marginTop: businessDetail?.address ? 18 : 0 }}
                  >
                    Eligibility Criteria
                  </h3>
                  <p
                    style={{
                      color: "#4b5563",
                      fontSize: 13.5,
                      lineHeight: 1.55,
                      margin: 0,
                    }}
                  >
                    {businessDetail.eligibility_criteria}
                  </p>
                </>
              ) : null}
            </section>
          )}

          {/* Mobile clinic addresses */}
          {businessDetail?.business_type === "mobile" && (
            <section className="bp-card">
              <h3 className="bp-section-title">Clinic Addresses</h3>
              {!multipleBusinesses || multipleBusinesses.length === 0 ? (
                <div className="bp-empty">No address found</div>
              ) : (
                <div className="bp-clinic-grid">
                  {multipleBusinesses.map((item, i) => (
                    <div key={i} className="bp-clinic-card">
                      <div>
                        <div className="bp-clinic-label">Address</div>
                        <button
                          type="button"
                          onClick={() => handleMapClick2(item?.lat, item?.lng)}
                          className="bp-clinic-link"
                        >
                          <MapPin size={14} />
                          <span className="bp-clinic-value">
                            {item?.address || "—"}
                          </span>
                        </button>
                      </div>
                      {item?.description ? (
                        <div>
                          <div className="bp-clinic-label">Description</div>
                          <div className="bp-clinic-value">
                            {item?.description}
                          </div>
                        </div>
                      ) : null}
                      <div className="bp-clinic-dates">
                        <div>
                          <div className="bp-clinic-label">Start Date</div>
                          <div className="bp-clinic-value">
                            {item?.startDate || "—"}
                          </div>
                        </div>
                        <div>
                          <div className="bp-clinic-label">End Date</div>
                          <div className="bp-clinic-value">
                            {item?.endDate || "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Spotlight */}
          {spotLights && spotLights.length > 0 ? (
            <section className="bp-card bp-spotlight-row">
              <h3 className="bp-section-title">Spotlight</h3>
              <div className="bp-chip-row">
                {spotLights.map((spotlight, index) => {
                  const icon = spotlightArray.find(
                    (spot) => spot?.title === spotlight,
                  )?.icon;
                  return (
                    <span key={index} className="bp-chip is-primary">
                      {icon ? <img src={icon} alt="" /> : null}
                      {spotlight}
                    </span>
                  );
                })}
              </div>
            </section>
          ) : null}

          {/* Gallery */}
          {galleryImages && galleryImages.length > 0 ? (
            <section className="bp-card">
              <h3 className="bp-section-title">Vet Gallery</h3>
              <div className="bp-gallery">
                {galleryImages.map((image, i) => (
                  <img
                    key={i}
                    src={`${global.IMAGEURL}/${image}`}
                    alt=""
                  />
                ))}
              </div>
            </section>
          ) : null}

          {/* Portfolio */}
          {portfolios.length > 0 && businessDetail?.portfolio !== "[{}]" && (
            <section className="bp-card">
              <h3 className="bp-section-title">Vet Portfolio</h3>
              {portfolios.slice(0, 1).map((portfolio, i) => (
                <div key={i} className="bp-people-row">
                  <div className="bp-person">
                    <img
                      src={portfolio?.image}
                      className="bp-person-avatar"
                      alt=""
                    />
                    <div className="bp-person-text">
                      <span className="bp-person-name">{portfolio?.name}</span>
                      <span className="bp-person-role">
                        {portfolio?.job_title}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleShowPortfolio}
                    className="bp-view-all"
                  >
                    View all
                  </button>
                </div>
              ))}
            </section>
          )}

          {/* Team members */}
          {teamMembers.length > 0 &&
            businessDetail?.team_members !== "[{}]" && (
              <section className="bp-card">
                <h3 className="bp-section-title">Team Members</h3>
                {teamMembers.slice(0, 1).map((member, i) => (
                  <div key={i} className="bp-people-row">
                    <div className="bp-person">
                      <img
                        src={member?.image}
                        className="bp-person-avatar"
                        alt=""
                      />
                      <div className="bp-person-text">
                        <span className="bp-person-name">{member?.name}</span>
                        <span className="bp-person-role">
                          {member?.job_title}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleShow}
                      className="bp-view-all"
                    >
                      View all
                    </button>
                  </div>
                ))}
              </section>
            )}

          {/* Services */}
          <section className="bp-card">
            <div className="bp-services-head">
              <h3 className="bp-section-title" style={{ margin: 0 }}>
                Services
              </h3>
              <button
                type="button"
                onClick={() => {
                  navigate("/services/create-service", {
                    state: { businessData: businessDetail },
                  });
                }}
                className="bp-add-service"
              >
                <Plus size={14} />
                Create service
              </button>
            </div>
            {isProcessing ? (
              <div className="flex w-full justify-center items-center my-3">
                <Spinner
                  className="text_primary"
                  size={28}
                  thickness={3}
                />
              </div>
            ) : !services || services.length === 0 ? (
              <div className="bp-empty">No service found</div>
            ) : (
              <div className="bp-services-list">
                {services.map((item, i) => (
                  <div key={i} className="bp-service">
                    <div
                      className="bp-service-head"
                      onClick={() => handleBusinessClick(item)}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="bp-service-name">
                          {item?.service_name}
                        </span>
                        <span className="bp-service-sub">
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
                      <div className="flex flex-col items-end shrink-0">
                        <span className="bp-service-price">{item?.amount}</span>
                        <span className="bp-service-cost-type">
                          {item?.cost_type}
                        </span>
                      </div>
                    </div>
                    {item?.description ? (
                      <p className="bp-service-desc">{item?.description}</p>
                    ) : null}
                    <div className="bp-service-foot">
                      <button
                        type="button"
                        className="bp-service-delete"
                        onClick={() => handleDeleteService(item?.id)}
                        aria-label="Delete service"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside>
          {paymentMethods && paymentMethods.length > 0 ? (
            <section className="bp-card">
              <h3 className="bp-section-title">Payment Methods</h3>
              <div className="bp-chip-row">
                {paymentMethods.map((method, index) => (
                  <span key={index} className="bp-chip is-primary">
                    <Check size={12} />
                    {method}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          <section className="bp-card">
            <h3 className="bp-section-title">Quick info</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {businessDetail?.phone ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Phone size={15} color="#7b3ff2" />
                  <span style={{ fontSize: 13, color: "#374151" }}>
                    {businessDetail.phone}
                  </span>
                </div>
              ) : null}
              {businessDetail?.website_link ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Globe size={15} color="#7b3ff2" />
                  <span
                    style={{
                      fontSize: 13,
                      color: "#374151",
                      wordBreak: "break-all",
                    }}
                  >
                    {businessDetail.website_link}
                  </span>
                </div>
              ) : null}
              {availability && availability.length > 0 ? (
                <button
                  type="button"
                  onClick={handleShowTiming}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    color: "#374151",
                    fontSize: 13,
                    textAlign: "left",
                  }}
                >
                  <Clock size={15} color="#7b3ff2" />
                  <span>View opening hours</span>
                </button>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
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
