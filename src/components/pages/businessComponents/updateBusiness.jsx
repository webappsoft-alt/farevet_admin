/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import {
  Col,
  Form,
  Input,
  Row,
  Select,
  Switch,
  TreeSelect,
  message,
} from "antd";
import React, { useEffect, useRef, useState } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import TimePicker from "react-time-picker";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import GooglePlacesAutocomplete, {
  geocodeByAddress,
  getLatLng,
} from "react-google-places-autocomplete";
import { Input as InputStrap } from "reactstrap";
import Autocomplete from "react-google-autocomplete";
import {
  ArrowLeft,
  Check,
  MinusCircle,
  Plus,
  PlusCircle,
  Trash2,
  X,
} from "react-feather";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  cameradark,
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
  spotlight32,
  spotlight33,
  spotlight34,
  spotlight35,
  spotlight36,
  spotlight37,
  spotlight38,
  spotlight39,
  spotlight4,
  spotlight5,
  spotlight6,
  spotlight7,
  spotlight8,
  spotlight9,
} from "../../icons/icon";
import { apiRequest } from "../../../api/auth_api";
import Spinner from "../../Spinner";
import moment from "moment";
import {
  CERTIFICATION_OPTIONS,
  CLINIC_TYPE_OPTIONS,
  OWNERSHIP_OPTIONS,
  TRUST_TAG_OPTIONS,
  parseStringList,
  pickTrustTagValue,
} from "./businessOptions";
const Option = Select;

const paymentMethods = [
  { title: "Credit / Debit" },
  { title: "Cash" },
  { title: "Financing" },
];

const business_type = [
  { title: "Standard Clinic", value: "standard" },
  { title: "Mobile Vet Clinic", value: "mobile" },
];

const job_types = [
  "DVM Doctor of Veterinary Medicine",
  "VMD Veterinary Medical Doctor",
  "CVT Certified Veterinary Technician",
  "RVT Registered Veterinary Technician",
  "LVT Licensed Veterinary Technician",
  "BVSc & AH Bachelor of Veterinary Science and Animal Husbandry",
  "BVMS Bachelor of Veterinary Medicine and Surgery",
  "RVN Registered Veterinary Nurse",
];

const categories = [
  { title: "Veterinary" },
  // { title: 'Telehealth' },
  { title: "Grooming" },
  { title: "Animal Shelter" },
  { title: "Pet Funeral" },
  { title: "Pet Shop" },
  { title: "Training" },
  { title: "Boarding" },
  { title: "Pet Day Care" },
  { title: "Pet Photography" },
  { title: "Pet walker" },
];

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
  { title: "Pet Hotel", icon: spotlight32 },
  { title: "End of Life Care", icon: spotlight33 },
  { title: "Pet Food", icon: spotlight34 },
  { title: "Behaviorist", icon: spotlight35 },
  { title: "Pet Euthanasia", icon: spotlight36 },
  { title: "Home Care", icon: spotlight37 },
  { title: "Pet Nutritionists", icon: spotlight38 },
  { title: "Flea and Tick Control", icon: spotlight39 },
];

const initialState = [
  { day: "Monday", checked: false, from: "", to: "" },
  { day: "Tuesday", checked: false, from: "", to: "" },
  { day: "Wednesday", checked: false, from: "", to: "" },
  { day: "Thursday", checked: false, from: "", to: "" },
  { day: "Friday", checked: false, from: "", to: "" },
  { day: "Saturday", checked: false, from: "", to: "" },
  { day: "Sunday", checked: false, from: "", to: "" },
];
const safeJsonParse = (jsonString) => {
  if (!jsonString) return null;
  if (typeof jsonString === "object") return jsonString;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    try {
      const fixedString = jsonString.replace(/\\/g, "");
      return JSON.parse(fixedString);
    } catch (e2) {
      console.error("Error parsing JSON:", e2);
      return null;
    }
  }
};

const UpdateBusiness = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const autocompleteRef = useRef();
  const { businessId } = useParams();
  const { state } = useLocation();
  const [serviceData, setServiceData] = useState(
    () => state?.serviceDetail ?? null,
  );

  useEffect(() => {
    if (
      state?.serviceDetail &&
      businessId &&
      String(state.serviceDetail.id) === String(businessId)
    ) {
      setServiceData(state.serviceDetail);
    }
  }, [state?.serviceDetail, businessId]);

  useEffect(() => {
    if (!businessId) return;
    if (
      state?.serviceDetail &&
      String(state.serviceDetail.id) === String(businessId)
    ) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const body = new FormData();
        body.append("type", "get_data");
        body.append("table_name", "businesses");
        body.append("id", String(businessId));
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
          setServiceData(row);
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
  }, [businessId, state?.serviceDetail, navigate]);
  const [businessFileLogo, setBusinessFileLogo] = useState(null);
  const [phone, setPhone] = useState(serviceData?.phone);
  const [teamFile, setTeamFile] = useState([]);
  const [loadBusinessFileLogo, setLoadBusinessFileLogo] = useState(null);
  const [selectedDays, setSelectedDays] = useState("");
  const [selectedCategories, setSelectedCategories] = useState("");
  const [selectGalleryImage, setSelectGalleryImage] = useState([]);
  const [loadGalleryImage, setLoadGalleryImage] = useState([]);
  const [businessType, setbusinessType] = useState("standard");
  const [selectBusinessImages, setSelectBusinessImages] = useState([]);
  const [loadBusinessImages, setLoadBusinessImages] = useState([]);
  const [selectPayment, setSelectPayment] = useState(["Credit / Debit"]);
  const [portfolioFile, setPortfolioFile] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectSpotlight, setSelectSpotlight] = useState(["Consultation"]);
  const [selectedCerts, setSelectedCerts] = useState([]);
  const [clinicTypeValue, setClinicTypeValue] = useState(undefined);
  const [ownershipValue, setOwnershipValue] = useState(undefined);
  const [trustTagValue, setTrustTagValue] = useState(undefined);
  const [daysOfWeek, setDaysOfWeek] = useState(initialState);
  const [portfolioArray, setPortfolioArray] = useState([
    { image: null, name: "", job_title: "" },
  ]);
  const [teamMembers, setTeamMembers] = useState([
    { image: null, name: "", job_title: "" },
  ]);
  const [multipleBusinesses, setMultipleBusinesses] = useState([
    {
      address: "",
      lat: null,
      lng: null,
      description: "",
      startDate: "",
      endDate: "",
    },
  ]);
  const [locationDetails, setLocationDetails] = useState({
    currentLocation: null,
    latitude: null,
    longitude: null,
  });

  useEffect(() => {
    if (serviceData) {
      const serviceDataImages = safeJsonParse(serviceData?.business_images);
      setLoadBusinessImages(serviceDataImages || []);
      setSelectedCategories(serviceData?.cat_name);
      // Update payment methods
      const pMethods = safeJsonParse(serviceData?.payment_types);
      setSelectPayment(pMethods || ["Credit / Debit"]);

      // Update spotlight
      const spotLight = safeJsonParse(serviceData?.spotlight);
      setSelectSpotlight(spotLight || ["Consultation"]);
      // setLocationDetails(serviceData?.lat && serviceData?.lng)
      setLocationDetails(serviceData?.address);
      // Update gallery images
      const gallery = safeJsonParse(serviceData?.gallery);
      setLoadGalleryImage(gallery || []);
      const timing = safeJsonParse(serviceData?.availability);
      setSelectedDays(timing || "");
      setbusinessType(serviceData?.business_type);
      const updatedTiming =
        timing &&
        timing?.map((day) => {
          const fromTime = moment(day.from, "h:mm A");
          const toTime = moment(day.to, "h:mm A");
          const updatedDay = {
            ...day,
            from: fromTime.format("HH:mm"),
            to: toTime.format("HH:mm"),
          };
          return updatedDay;
        });
      setDaysOfWeek(updatedTiming);
      const mergedDaysOfWeek =
        initialState &&
        initialState?.map((initialDay) => {
          const existingDay =
            updatedTiming &&
            updatedTiming?.find((day) => day.day === initialDay.day);
          return existingDay || initialDay;
        });
      setDaysOfWeek(mergedDaysOfWeek);

      // Update portfolio
      const portfolio = safeJsonParse(serviceData?.portfolio);
      setPortfolioArray(
        portfolio || [{ image: null, name: "", job_title: "" }],
      );
      if (!portfolio || portfolio.length === 0) {
        setPortfolioArray([{}]);
      }

      // Update team members
      const members = safeJsonParse(serviceData?.team_members);
      setTeamMembers(members || [{ image: null, name: "", job_title: "" }]);
      if (!members || members.length === 0) {
        setTeamMembers([{}]);
      }
      const multipleBusiness = safeJsonParse(serviceData?.mobile_vet_detail);
      setMultipleBusinesses(
        multipleBusiness || [{ image: null, name: "", job_title: "" }],
      );
      if (!multipleBusiness || multipleBusiness.length === 0) {
        setMultipleBusinesses([{}]);
      }

      const certsList = parseStringList(
        serviceData?.certifications ??
          serviceData?.certification ??
          serviceData?.certificates,
      );
      setSelectedCerts(certsList);
      const clinicTypeRaw =
        serviceData?.clinic_type ?? serviceData?.type ?? undefined;
      setClinicTypeValue(clinicTypeRaw || undefined);
      const ownershipRaw =
        serviceData?.ownership ?? serviceData?.owner_type ?? undefined;
      setOwnershipValue(ownershipRaw || undefined);
      const trustTag = pickTrustTagValue(serviceData?.trust_tags);
      setTrustTagValue(trustTag);
      form.setFieldsValue({
        certifications: certsList,
        clinic_type: clinicTypeRaw || undefined,
        ownership: ownershipRaw || undefined,
        trust_tags: trustTag,
      });
    }
  }, [serviceData]);
  const handleSwitchChange = (index) => {
    const updatedDaysOfWeek = [...daysOfWeek];
    updatedDaysOfWeek[index].checked = !updatedDaysOfWeek[index].checked;
    setDaysOfWeek(updatedDaysOfWeek);

    const updatedSelectedDays = updatedDaysOfWeek
      .filter((day) => day.checked !== false)
      .map((day) => {
        const fromTime = moment(day.from, "HH:mm").format("h:mm A");
        const toTime = moment(day.to, "HH:mm").format("h:mm A");
        return { ...day, from: fromTime, to: toTime };
      });

    setSelectedDays(updatedSelectedDays.length > 0 ? updatedSelectedDays : "");
  };
  const handleStartTime = (value, index) => {
    const parsedTime = moment(value, "h:mm A"); // Parse the time in AM/PM format
    const formattedValue = parsedTime.isValid()
      ? parsedTime.format("HH:mm")
      : ""; // Format to 24-hour if valid, otherwise set empty string
    const updatedTime = [...daysOfWeek];
    updatedTime[index].from = formattedValue;
    setDaysOfWeek(updatedTime);

    // Update selectedDays
    const updatedSelectedDays = updatedTime
      .filter((day) => day.checked !== false)
      .map((day) => {
        const fromTime = moment(day.from, "HH:mm").format("h:mm A");
        const toTime = moment(day.to, "HH:mm").format("h:mm A");
        return { ...day, from: fromTime, to: toTime };
      });
    setSelectedDays(updatedSelectedDays);
  };

  const handleEndTime = (value, index) => {
    const parsedTime = moment(value, "h:mm A"); // Parse the time in AM/PM format
    const formattedValue = parsedTime.isValid()
      ? parsedTime.format("HH:mm")
      : ""; // Format to 24-hour if valid, otherwise set empty string
    const updatedTime = [...daysOfWeek];
    updatedTime[index].to = formattedValue;
    if (updatedTime[index].from && updatedTime[index].to) {
      const startTime = moment(updatedTime[index].from, "hh:mm A");
      const endTime = moment(updatedTime[index].to, "hh:mm A");
      if (startTime.isSameOrAfter(endTime)) {
        updatedTime[index].to = "";
        message.error("Invalid time. End time must be greater than start time");
        setDaysOfWeek(updatedTime);
        return;
      }
    }
    setDaysOfWeek(updatedTime);

    const updatedSelectedDays = updatedTime
      .filter((day) => day.checked !== false)
      .map((day) => {
        const fromTime = moment(day.from, "HH:mm").format("h:mm A");
        const toTime = moment(day.to, "HH:mm").format("h:mm A");
        return { ...day, from: fromTime, to: toTime };
      });
    setSelectedDays(updatedSelectedDays);
  };

  const handlePortfolioNameChange = (index, name) => {
    const updatedPortfolioArray = [...portfolioArray];
    updatedPortfolioArray[index].name = name;
    setPortfolioArray(updatedPortfolioArray);
  };

  const handlePortfolioTitleChange = (index, job_title) => {
    const updatedPortfolioArray = [...portfolioArray];
    updatedPortfolioArray[index].job_title = job_title;
    setPortfolioArray(updatedPortfolioArray);
  };

  const handleSelect = async (place) => {
    try {
      const results = await geocodeByAddress(place.label);
      const { lat, lng } = await getLatLng(results[0]);

      setLocationDetails({
        currentLocation: place.label,
        latitude: lat,
        longitude: lng,
      });

      // console.log('Successfully got latitude and longitude', { lat, lng });
    } catch (error) {
      console.error("Error fetching latitude and longitude:", error);
    }
  };
  const handleFileChangePortfolio = async (index, id, e) => {
    const files = e.target.files;
    const image = files[0];
    const body = new FormData();
    body.append("type", "upload_data");
    body.append("file", image);

    try {
      const response = await apiRequest({ body });
      const fileURL = URL.createObjectURL(image);
      setPortfolioFile((prevFiles) => ({
        ...prevFiles,
        [id]: { file_name: response?.file_name, fileURL },
      }));
      setPortfolioArray((prevArray) => {
        const newArray = [...prevArray];
        newArray[index] = { ...newArray[index], image: response?.file_name };
        return newArray;
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleAddPortfolioItem = () => {
    setPortfolioArray([
      ...portfolioArray,
      { image: null, name: "", job_title: "" },
    ]);
  };

  const handleNameChange = (index, name) => {
    const updatedTeamMembers = [...teamMembers];
    updatedTeamMembers[index].name = name;
    setTeamMembers(updatedTeamMembers);
  };

  const handleJobTitleChange = (index, job_title) => {
    const updatedTeamMembers = [...teamMembers];
    updatedTeamMembers[index].job_title = job_title;
    setTeamMembers(updatedTeamMembers);
  };

  const handleRemovePortfolioItem = (indexToRemove) => {
    setPortfolioArray((prevPortfolioArray) => {
      const updatedPortfolioArray = [...prevPortfolioArray];
      updatedPortfolioArray.splice(indexToRemove, 1);
      return updatedPortfolioArray;
    });
  };

  const handleRemoveMember = (index) => {
    setTeamMembers((prevTeamMembers) => {
      const updatedMembers = [...prevTeamMembers];
      if (index >= 0 && index < updatedMembers.length) {
        updatedMembers[index] = { image: null, name: "", job_title: "" };
        form.setFieldsValue({
          [`teamFile_${index}`]: "",
          [`teamMemberName${index}`]: "",
          [`teamMemberJobTitle${index}`]: "",
        });
        setTeamFile((prevFiles) => {
          // Remove the file for the specific index
          const updatedFiles = { ...prevFiles };
          delete updatedFiles[`fileInput_0`]; // Remove the entry for the given index
          return updatedFiles;
        });
      }
      return updatedMembers;
    });
  };

  const handleFileChangeTeam = async (index, id, e) => {
    const image = e.target.files[0];
    const body = new FormData();
    body.append("type", "upload_data");
    body.append("file", image);
    try {
      const response = await apiRequest({ body });
      const fileURL = URL.createObjectURL(image);
      setTeamFile((prevFiles) => ({
        ...prevFiles,
        [id]: { file_name: response?.file_name, fileURL },
      }));
      setTeamMembers((prevMembers) => {
        const newMembers = [...prevMembers];
        newMembers[index] = {
          ...newMembers[index],
          image: response?.file_name,
        };
        return newMembers;
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleAddTeamMember = () => {
    setTeamMembers([...teamMembers, { image: null, name: "", job_title: "" }]);
  };

  const handleDeleteTeamMember = (index) => {
    const updatedTeamMembers = [...teamMembers];
    updatedTeamMembers.splice(index, 1);
    setTeamMembers(updatedTeamMembers);
  };

  const toggleSpotlight = (title) => {
    if (selectSpotlight.includes(title)) {
      setSelectSpotlight(
        selectSpotlight.filter((selectedTitle) => selectedTitle !== title),
      );
    } else if (selectSpotlight.length < 8) {
      setSelectSpotlight([...selectSpotlight, title]);
    } else {
      message.error("You can only select up to 8 spotlights.");
    }
  };

  const toggleCategory = (title) => {
    if (selectPayment.includes(title)) {
      setSelectPayment(selectPayment.filter((id) => id !== title));
    } else {
      setSelectPayment([...selectPayment, title]);
    }
  };

  const handleBusinessLogo = async (e, id) => {
    const file = e.target.files[0];
    const updatedFileName = file?.name;
    const body = new FormData();
    body.append("type", "upload_data");
    body.append("file", new Blob([file], { type: file.type }), updatedFileName);
    try {
      const response = await apiRequest({ body });
      const fileURL = URL.createObjectURL(file);
      setBusinessFileLogo({ file_name: response.file_name, fileURL });
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    if (businessFileLogo) {
      setLoadBusinessFileLogo(businessFileLogo?.file_name);
    }
  }, [businessFileLogo]);

  const handleBusinessImages = async (e) => {
    const selectedImages = Array.from(e.target.files);
    if (selectedImages?.length > 0) {
      setSelectBusinessImages([...selectBusinessImages, ...selectedImages]);
      const body = new FormData();
      body.append("type", "upload_data");
      selectedImages.forEach((image) => {
        body.append("file", image);
      });
      await apiRequest({ body })
        .then((result) => {
          // console.log(result);
          const imageName = result?.file_name;
          setLoadBusinessImages((prevImages) => [...prevImages, imageName]);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
  const handleRemoveBusinessImages = (index) => {
    const updatedFiles = [...selectBusinessImages];
    const updatedFiles2 = [...loadBusinessImages];
    updatedFiles.splice(index, 1);
    updatedFiles2.splice(index, 1);
    setSelectBusinessImages(updatedFiles);
    setLoadBusinessImages(updatedFiles2);
  };

  const handleGalleryImage = async (e) => {
    const selectedImages = Array.from(e.target.files);
    if (selectedImages?.length > 0) {
      setSelectGalleryImage([...selectGalleryImage, ...selectedImages]);
      const body = new FormData();
      body.append("type", "upload_data");
      selectedImages.forEach((image) => {
        body.append("file", image);
      });
      await apiRequest({ body })
        .then((result) => {
          // console.log(result);
          const imageName = result?.file_name;
          setLoadGalleryImage((prevImages) => [...prevImages, imageName]);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  const handleBusinessUpdate = (index, updatedBusiness) => {
    setMultipleBusinesses((prevBusinesses) =>
      prevBusinesses.map((business, i) =>
        i === index ? updatedBusiness : business,
      ),
    );
  };

  const addBusiness = () => {
    setMultipleBusinesses((prevBusinesses) => [
      ...prevBusinesses,
      {
        address: "",
        lat: "",
        lng: "",
        description: "",
        startDate: "",
        endDate: "",
      },
    ]);
  };

  const removeBusiness = (index) => {
    setMultipleBusinesses((prevBusinesses) =>
      prevBusinesses.filter((_, i) => i !== index),
    );
  };

  const handleRemoveGallery = (index) => {
    const updatedFiles = [...selectGalleryImage];
    const updatedFiles2 = [...loadGalleryImage];
    updatedFiles.splice(index, 1);
    updatedFiles2.splice(index, 1);
    setSelectGalleryImage(updatedFiles);
    setLoadGalleryImage(updatedFiles2);
  };

  const handlePhoneChange = (value) => {
    setPhone(value);
  };
  const handleSubmit = async (values) => {
    const portfolio = [];
    portfolioArray.forEach((item) => {
      if (item.image && item.job_title && item.name) {
        portfolio.push(item);
      }
    });
    const teamMember = [];
    teamMembers.forEach((item) => {
      if (item.image && item.job_title && item.name) {
        teamMember.push(item);
      }
    });

    setIsProcessing(true);
    const body = new FormData();
    body.append("type", "update_data");
    body.append("id", String(serviceData?.id ?? businessId ?? ""));
    body.append("table_name", "businesses");
    body.append("name", values?.businessName);
    body.append("bio", values?.businessBio);
    body.append("eligibility_criteria", values?.eligibility_criteria);
    body.append("website_link", values?.websiteLink);
    body.append("business_type", businessType);
    body.append(
      "mobile_vet_detail",
      businessType === "mobile"
        ? multipleBusinesses.length > 0
          ? JSON.stringify(multipleBusinesses)
          : ""
        : "",
    );
    body.append(
      "address",
      businessType === "standard"
        ? locationDetails?.currentLocation
          ? locationDetails?.currentLocation
          : serviceData?.address
        : multipleBusinesses[0]?.address,
    );
    body.append(
      "lat",
      businessType === "standard"
        ? locationDetails?.latitude
          ? locationDetails?.latitude
          : serviceData?.lat
        : multipleBusinesses[0]?.lat,
    );
    body.append(
      "lng",
      businessType === "standard"
        ? locationDetails?.longitude
          ? locationDetails?.longitude
          : serviceData?.lng
        : multipleBusinesses[0]?.lng,
    );
    body.append("phone", phone);
    body.append("cat_name", selectedCategories);
    body.append(
      "business_images",
      loadBusinessImages.length > 0 ? JSON.stringify(loadBusinessImages) : "",
    );
    body.append("spotlight", JSON.stringify(selectSpotlight));
    body.append(
      "gallery",
      loadGalleryImage.length > 0 ? JSON.stringify(loadGalleryImage) : "",
    );
    body.append(
      "portfolio",
      portfolio.length > 0 ? JSON.stringify(portfolio) : "",
    );
    body.append("business_created", "admin");
    body.append("status", "1");
    body.append(
      "logo",
      loadBusinessFileLogo ? loadBusinessFileLogo : serviceData?.logo,
    );
    body.append(
      "team_members",
      teamMember.length > 0 ? JSON.stringify(teamMember) : "",
    );
    body.append("payment_types", JSON.stringify(selectPayment));
    body.append(
      "availability",
      selectedDays ? JSON.stringify(selectedDays || "") : "",
    );
    body.append(
      "certifications",
      selectedCerts.length > 0 ? JSON.stringify(selectedCerts) : "",
    );
    body.append("clinic_type", clinicTypeValue || "");
    body.append("ownership", ownershipValue || "");
    body.append("trust_tags", trustTagValue || "");
    await apiRequest({ body })
      .then(async (res) => {
        setIsProcessing(false);
        if (res?.result === true) {
          message.success("Business updated successfully.");
          form.resetFields();
          navigate("/business");
        } else {
          message.error("Creation failed...");
        }
      })
      .catch((error) => {
        console.error(error);
        setIsProcessing(false);
      });
  };

  return (
    <main className="container m-auto min-h-screen py-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => {
            navigate(-1);
          }}
          className="flex items-center justify-center w-[36px] h-[36px] bg_primary rounded-lg"
        >
          <ArrowLeft className="text_white" />
        </button>
        <span className="inter_semibold text-xl md:text-2xl text_dark">
          Update Business
        </span>
      </div>
      <Form
        form={form}
        initialValues={{
          businessName: serviceData?.name || "",
          businessBio: serviceData?.bio || "",
          eligibility_criteria: serviceData?.eligibility_criteria || "",
          phone: serviceData?.phone || "",
          // address2: serviceData?.address2 || '',
          selectCategory: serviceData?.cat_name || "",
          websiteLink: serviceData?.website_link || "",
          businessCreatedBy: serviceData?.business_created || "",
          businessLogo: serviceData?.logo || null,
        }}
        layout="verticle"
        onFinish={handleSubmit}
        className="w-full lg:w-[90%] xl:w-[80%] mx-auto bg_white rounded-lg shadow-md p-[1rem] md:p-[2rem]"
      >
        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Business Type
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            {business_type.map((item, i) => (
              <button
                key={i}
                type="button"
                style={{ cursor: "pointer" }}
                className={`border cursor-pointer rounded-3 gap-1 px-[1rem] py-2 inter_medium text-sm flex justify-center items-center ${
                  businessType === item?.value
                    ? "bg-[#F8F2FD] text_primary"
                    : "bg_white text_secondary"
                }`}
                onClick={() => setbusinessType(item?.value)}
              >
                {item?.title}
              </button>
            ))}
          </div>
        </div>
        {businessType === "mobile" &&
          multipleBusinesses.map((business, index) => (
            <div
              key={index}
              className="flex gap-3 mb-5 w-full max-md:flex-col justify-start"
            >
              <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
                {index === 0 && <>Select Addresses</>}
              </span>
              <div key={index} className="w-full md:w-[70%]">
                {/* Address Autocomplete */}
                <Col span={24} className="mb-3">
                  <Autocomplete
                    apiKey="AIzaSyBYV5W31rEUeTVj2Ws_qJuhMX7IudkRlHw"
                    className="w-full border rounded-lg inter_medium ps-3 py-[10px]"
                    ref={autocompleteRef}
                    options={{
                      types: ["address"],
                    }}
                    defaultValue={business?.address}
                    placeholder="Select Address"
                    onPlaceSelected={(place) => {
                      const address = place.formatted_address;
                      const latitude = place.geometry.location.lat();
                      const longitude = place.geometry.location.lng();
                      // Update the business object for the current index
                      const updatedBusiness = {
                        ...business,
                        address,
                        lat: latitude,
                        lng: longitude,
                      };
                      handleBusinessUpdate(index, updatedBusiness);
                    }}
                  />
                </Col>

                {/* Description */}
                <Col span={24} className="mb-3">
                  <InputStrap
                    placeholder="Description"
                    size="large"
                    required
                    type="text"
                    className="w-full"
                    value={business.description}
                    onChange={(e) => {
                      const updatedBusiness = {
                        ...business,
                        description: e.target.value,
                      };
                      handleBusinessUpdate(index, updatedBusiness);
                    }}
                  />
                </Col>
                {/* Start and End Dates */}
                <Row gutter={16} className="flex items-center">
                  <Col span={10}>
                    <InputStrap
                      type="date"
                      required
                      value={business.startDate}
                      onChange={(e) => {
                        const updatedBusiness = {
                          ...business,
                          startDate: e.target.value,
                        };
                        handleBusinessUpdate(index, updatedBusiness);
                      }}
                    />
                  </Col>
                  <Col span={10}>
                    <InputStrap
                      type="date"
                      required
                      min={business.startDate}
                      value={business.endDate}
                      onChange={(e) => {
                        const updatedBusiness = {
                          ...business,
                          endDate: e.target.value,
                        };
                        handleBusinessUpdate(index, updatedBusiness);
                      }}
                    />
                  </Col>
                  <Col span={4}>
                    {index <= 0 ? (
                      <div className="flex gap-1">
                        <button type="button" onClick={addBusiness}>
                          <PlusCircle className="text_primary" />
                        </button>
                        {/* <button type='button' onClick={() => removeBusiness(index)}>
                                                <MinusCircle className='text_secondary' />
                                            </button> */}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => removeBusiness(index)}
                      >
                        <Trash2
                          style={{ color: "#FF6F61" }}
                          className="text-[#FF6F61]"
                        />
                      </button>
                    )}
                  </Col>
                </Row>
              </div>
            </div>
          ))}
        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Upload Business Logo
          </span>
          <div className="w-full md:w-[70%]">
            <Form.Item
              key="businessLogo"
              name="businessLogo"
              className="rounded-lg w-fit text-center"
            >
              <div>
                <label htmlFor="fileInput" className="cursor-pointer">
                  {businessFileLogo ? (
                    <img
                      src={businessFileLogo?.fileURL}
                      alt="Preview"
                      style={{ width: "120px", height: "120px" }}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div
                      style={{ width: "120px", height: "100px" }}
                      className="rounded-lg flex justify-center items-center"
                    >
                      {serviceData?.logo ? (
                        <img
                          src={`${global.IMAGEURL}/${serviceData?.logo}`}
                          alt=""
                          className="rounded-full object-cover"
                          style={{ width: "120px", height: "120px" }}
                        />
                      ) : (
                        <img src={cameradark} alt="Camera Icon" />
                      )}
                    </div>
                  )}
                </label>
                <Input
                  size="large"
                  type="file"
                  id="fileInput"
                  className="visually-hidden"
                  onChange={handleBusinessLogo}
                />
              </div>
            </Form.Item>
          </div>
        </div>
        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Upload Business Images
          </span>
          <div className="w-full md:w-[70%]">
            <Form.Item
              key="business_images"
              name="business_images"
              className="rounded-lg w-fit text-center"
            >
              <div className="flex gap-3 items-center flex-wrap">
                <label htmlFor="fileInput2" className="cursor-pointer">
                  <div
                    style={{ width: "120px", height: "100px" }}
                    className="border rounded-lg flex justify-center items-center"
                  >
                    <img src={cameradark} alt="Camera Icon" />
                  </div>
                </label>
                {loadBusinessImages.map((imageName, index) => (
                  <div key={index} className="relative">
                    <div className="bg-overlay"></div>
                    <button
                      type="button"
                      style={{ left: 0 }}
                      className="absolute right-0 text_white p-1 rounded-full transition-opacity"
                      onClick={() => handleRemoveBusinessImages(index)}
                    >
                      <X />
                    </button>
                    <img
                      style={{ width: "120px", height: "100px" }}
                      src={`${global.IMAGEURL}/${imageName}`}
                      alt={`Existing-${index}`}
                      className="rounded-lg object-cover mx-auto"
                    />
                  </div>
                ))}
              </div>
              <Input
                size="large"
                type="file"
                id="fileInput2"
                className="visually-hidden"
                onChange={handleBusinessImages}
                multiple
              />
            </Form.Item>
          </div>
        </div>
        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Business Name
          </span>
          <div className="w-full md:w-[70%]">
            <Form.Item
              name="businessName"
              className="rounded-lg w-full"
              rules={[
                {
                  min: 4,
                },
                {
                  required: true,
                  message: "Please enter your business name",
                },
              ]}
            >
              <Input type="text" size="large" />
            </Form.Item>
          </div>
        </div>
        {businessType === "standard" && (
          <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
            <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
              Address
            </span>
            <div className="w-full md:w-[70%]">
              {/* <GooglePlacesAutocomplete
                            apiKey='AIzaSyD4qhOSy-gRNAwJ1l3952qY2K4sMTIGOHQ'
                            selectProps={{
                                onChange: handleSelect,
                                defaultInputValue: serviceData?.address
                            }}
                        /> */}
              <Autocomplete
                className="w-full border rounded-lg inter_medium ps-3 py-[10px]"
                apiKey="AIzaSyBYV5W31rEUeTVj2Ws_qJuhMX7IudkRlHw"
                defaultValue={serviceData?.address}
                ref={autocompleteRef}
                options={{
                  types: ["address"],
                }}
                onPlaceSelected={(place) => {
                  setLocationDetails({
                    currentLocation: place?.formatted_address,
                    latitude: place?.geometry?.location.lat(),
                    longitude: place?.geometry?.location.lng(),
                  });
                }}
              />
            </div>
          </div>
        )}
        {/* <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
                    <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
                        Address 2
                    </span>
                    <div className='w-full md:w-[70%]'>
                        <Form.Item
                            name='address2'
                            className="rounded-lg w-full"
                        >
                            <Input type='text' size='large' />
                        </Form.Item>
                    </div>
                </div> */}
        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Business Bio
          </span>
          <div className="w-full md:w-[70%]">
            <Form.Item
              name="businessBio"
              className="rounded-lg w-full"
              rules={[
                {
                  min: 10,
                },
                {
                  required: true,
                  message: "Please enter your Business bio",
                },
              ]}
            >
              <Input.TextArea rows={2} size="large" />
            </Form.Item>
          </div>
        </div>
        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Eligibility Criteria
          </span>
          <div className="w-full md:w-[70%]">
            <Form.Item
              name="eligibility_criteria"
              className="rounded-lg w-full"
              // rules={[
              //     {
              //         min: 10
              //     },
              //     {
              //         required: true,
              //         message: 'Please enter your Business bio',
              //     },
              // ]}
            >
              <Input.TextArea rows={2} size="large" />
            </Form.Item>
          </div>
        </div>
        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Phone Number
          </span>
          <div className="w-full md:w-[70%]">
            <Form.Item
              name="phone"
              className="rounded-lg w-full"
              rules={[
                {
                  required: true,
                  message: "Please enter your phone number",
                },
              ]}
            >
              <PhoneInput
                inputStyle={{ width: "100%" }}
                placeholder="Mobile Number"
                country={"us"}
                value={phone}
                onChange={handlePhoneChange}
              />
            </Form.Item>
          </div>
        </div>
        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Website Link
          </span>
          <div className="w-full md:w-[70%]">
            <Form.Item
              name="websiteLink"
              className="rounded-lg w-full"
              rules={[
                {
                  required: true,
                  message: "Please enter your website link",
                },
              ]}
            >
              <Input type="text" size="large" />
            </Form.Item>
          </div>
        </div>
        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Select Category
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            <Form.Item
              className="w-full mb-0"
              name="selectCategory"
              rules={[
                {
                  required: true,
                  message: "Please Select your Category",
                },
              ]}
            >
              <Select
                showSearch
                style={{
                  width: "100%",
                }}
                size="large"
                placeholder="Select Category"
                allowClear
                onChange={(value) => setSelectedCategories(value)}
              >
                {categories?.map((item) => (
                  <Select.Option key={item?.title} value={item?.title}>
                    {item?.title}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>
        </div>
        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Certifications
          </span>
          <div className="w-full md:w-[70%]">
            <Form.Item name="certifications" className="rounded-lg w-full mb-0">
              <Select
                mode="multiple"
                allowClear
                showSearch
                size="large"
                style={{ width: "100%" }}
                placeholder="Select certifications"
                value={selectedCerts}
                onChange={(vals) => setSelectedCerts(vals || [])}
                options={CERTIFICATION_OPTIONS.map((c) => ({
                  label: c,
                  value: c,
                }))}
                maxTagCount="responsive"
                optionFilterProp="label"
              />
            </Form.Item>
          </div>
        </div>
        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Clinic Type
          </span>
          <div className="w-full md:w-[70%]">
            <Form.Item name="clinic_type" className="rounded-lg w-full mb-0">
              <Select
                allowClear
                size="large"
                style={{ width: "100%" }}
                placeholder="Select clinic type"
                value={clinicTypeValue}
                onChange={(v) => setClinicTypeValue(v)}
                options={CLINIC_TYPE_OPTIONS.map((c) => ({
                  label: c,
                  value: c,
                }))}
              />
            </Form.Item>
          </div>
        </div>
        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Ownership
          </span>
          <div className="w-full md:w-[70%]">
            <Form.Item name="ownership" className="rounded-lg w-full mb-0">
              <Select
                allowClear
                size="large"
                style={{ width: "100%" }}
                placeholder="Select ownership"
                value={ownershipValue}
                onChange={(v) => setOwnershipValue(v)}
                options={OWNERSHIP_OPTIONS.map((c) => ({
                  label: c,
                  value: c,
                }))}
              />
            </Form.Item>
          </div>
        </div>
        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Trust tag
          </span>
          <div className="w-full md:w-[70%]">
            <Form.Item name="trust_tags" className="rounded-lg w-full mb-0">
              <Select
                allowClear
                size="large"
                style={{ width: "100%" }}
                placeholder="Select trust tag"
                value={trustTagValue}
                onChange={(v) => setTrustTagValue(v)}
                options={TRUST_TAG_OPTIONS.map((t) => ({
                  label: t,
                  value: t,
                }))}
              />
            </Form.Item>
          </div>
        </div>
        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Choose Payment method
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            {paymentMethods.map((item, i) => (
              <button
                key={i}
                type="button"
                className={`border cursor-pointer rounded-full gap-1 px-[1rem] py-2 inter_medium text-sm flex justify-center items-center ${selectPayment.includes(item?.title) ? "bg-[#F8F2FD] text_primary" : "bg_white text_secondary"}`}
                onClick={() => toggleCategory(item?.title)}
              >
                {selectPayment.includes(item?.title) && (
                  <Check className="text_primary" size={16} />
                )}
                {item?.title}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Spotlight
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            {spotlightArray.map((item, i) => (
              <button
                key={i}
                type="button"
                className={`border cursor-pointer rounded-full gap-1 px-[1rem] py-2 inter_medium text-sm flex justify-center items-center ${selectSpotlight.includes(item?.title) ? "bg-[#F8F2FD] text_primary" : "bg_white text_secondary"}`}
                onClick={() => toggleSpotlight(item?.title)}
              >
                {selectSpotlight.includes(item?.title) && (
                  <Check className="text_primary" size={16} />
                )}
                <span className="flex items-center gap-1">
                  <img
                    src={
                      spotlightArray.find((spot) => spot?.title === item?.title)
                        ?.icon
                    }
                    style={{ height: "20px", width: "auto" }}
                    className="w-4 h-4 object-cover"
                    alt=""
                  />
                  {item?.title}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Hours of Operations
          </span>
          <div className="flex items-center flex-col gap-4 w-full md:w-[70%]">
            {daysOfWeek.map((day, index) => (
              <div
                key={index}
                className="flex justify-between max-md:flex-col gap-4 md:items-center w-full"
              >
                <div className="flex justify-between items-center w-full">
                  <button
                    type="button"
                    style={{ minWidth: "8.5rem" }}
                    className={`border cursor-pointer rounded-full gap-1 px-3 py-2 inter_medium text-sm flex items-center ${day.checked ? "bg-[#F8F2FD] text_primary" : "bg_white text_secondary"}`}
                    onClick={() => handleSwitchChange(index)}
                  >
                    {day.checked && (
                      <Check className="text_primary" size={16} />
                    )}
                    {day.day}
                  </button>
                </div>
                {day.checked && (
                  <div className="w-full flex-wrap flex-md-nowrap gap-2 flex items-center">
                    <div>
                      <InputStrap
                        required
                        type="time"
                        onChange={(e) => handleStartTime(e.target.value, index)} // Pass value directly
                        value={day?.from}
                        id="time"
                      />
                    </div>
                    <span className="manrope_semibold text-[#344054]">TO</span>
                    <div>
                      <InputStrap
                        required
                        type="time"
                        onChange={(e) => handleEndTime(e.target.value, index)} // Pass value directly
                        value={day?.to}
                      />
                    </div>
                  </div>
                )}
                {!day.checked && (
                  <div className="w-full flex-wrap flex-md-nowrap gap-2 flex items-center">
                    <div>
                      <InputStrap disabled type="time" id="time" />
                    </div>
                    <span className="manrope_semibold text-[#344054]">TO</span>
                    <div>
                      <InputStrap disabled type="time" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Gallary
          </span>
          <div className="w-full md:w-[70%] relative">
            <div className="flex gap-3 items-center flex-wrap">
              <label htmlFor="fileInput8" className="cursor-pointer">
                <div
                  style={{ width: "120px", height: "100px" }}
                  className="border rounded-lg flex justify-center items-center"
                >
                  <img src={cameradark} alt="Camera Icon" />
                </div>
              </label>
              {loadGalleryImage.map((imageName, index) => (
                <div key={index} className="relative">
                  <div className="bg-overlay"></div>
                  <button
                    type="button"
                    className="absolute right-0 text_white p-1 rounded-full transition-opacity"
                    onClick={() => handleRemoveGallery(index)}
                  >
                    <X />
                  </button>
                  <img
                    src={`${global.IMAGEURL}/${imageName}`}
                    alt={`Existing-${index}`}
                    style={{ width: "120px", height: "100px" }}
                    className=" rounded-lg object-cover mx-auto"
                  />
                </div>
              ))}
            </div>
            <Input
              size="large"
              type="file"
              id="fileInput8"
              className="visually-hidden"
              onChange={handleGalleryImage}
              multiple
            />
          </div>
        </div>
        <hr className="text-[#9aa1a7] my-4" />
        {portfolioArray?.map((portfolioItem, index) => {
          return (
            <div key={index}>
              <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
                <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
                  Portfolio Image
                </span>
                <div className="w-full md:w-[70%] relative">
                  <label
                    htmlFor={`fileInput-${index}`}
                    className="cursor-pointer"
                  >
                    {portfolioFile && portfolioFile[`fileInput-${index}`] ? (
                      <div>
                        <img
                          style={{ width: "120px", height: "100px" }}
                          src={portfolioFile[`fileInput-${index}`]?.fileURL}
                          alt=""
                          className="rounded-lg object-cover mx-auto"
                        />
                      </div>
                    ) : portfolioItem?.image ? (
                      <img
                        style={{
                          width: "120px",
                          height: "100px",
                          borderRadius: "20px",
                        }}
                        src={`${global.IMAGEURL}/${portfolioItem?.image}`}
                        alt="Camera Icon"
                      />
                    ) : (
                      <div
                        style={{ width: "120px", height: "100px" }}
                        className="border  flex justify-center items-center rounded-lg object-cover mx-auto"
                      >
                        <img src={cameradark} alt="Camera Icon" />
                      </div>
                    )}
                  </label>
                  <Input
                    size="large"
                    type="file"
                    id={`fileInput-${index}`}
                    className="visually-hidden"
                    onChange={(e) =>
                      handleFileChangePortfolio(index, `fileInput-${index}`, e)
                    }
                  />
                </div>
              </div>
              <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
                <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
                  Portfolio Name
                </span>
                <div className="w-full md:w-[70%]">
                  <InputStrap
                    className="popins_regular"
                    type="text"
                    style={{ boxShadow: "none" }}
                    placeholder="Name"
                    value={portfolioItem?.name}
                    onChange={(e) =>
                      handlePortfolioNameChange(index, e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
                <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
                  Portfolio Title
                </span>
                <div className="w-full md:w-[70%]">
                  {selectedCategories === "Veterinary" ? (
                    <Select
                      showSearch
                      style={{
                        width: "100%",
                      }}
                      size="large"
                      placeholder="Select Job title"
                      allowClear
                      value={portfolioItem?.job_title}
                      onChange={(value) =>
                        handlePortfolioTitleChange(index, value)
                      }
                    >
                      {job_types?.map((item, i) => (
                        <Select.Option key={i} value={item}>
                          <span className="w-full">{item}</span>
                        </Select.Option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      placeholder="Job Title"
                      size="large"
                      value={portfolioItem?.job_title}
                      type="text"
                      onChange={(e) =>
                        handlePortfolioTitleChange(index, e.target.value)
                      }
                    />
                  )}
                </div>
              </div>
              {portfolioArray.length > 1 && (
                <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
                  <span className="inter_medium text-sm text_dark w-full md:w-[30%]"></span>
                  <div className="w-full md:w-[70%]">
                    <button
                      type="button"
                      style={{ backgroundColor: "red" }}
                      className="bg-red-500 rounded-lg text_white inter_semibold px-3 py-2"
                      onClick={() => handleRemovePortfolioItem(index)}
                    >
                      Delete Portfolio
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {/* <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
                    <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
                    </span>
                    <div className="w-full md:w-[70%]">
                        <button
                            type='button'
                            className='bg_primary rounded-lg text_white inter_semibold px-3 py-2'
                            onClick={handleAddPortfolioItem}
                        >
                            Add More Portfolio
                        </button>
                    </div>
                </div> */}
        {teamMembers.map((teamMember, index) => (
          <div
            key={index}
            className="flex gap-3 mb-4 w-full max-md:flex-col justify-start"
          >
            <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
              {index === 0 && <>Team Members</>}
            </span>
            <div key={index} className="w-full md:w-[70%]">
              <Row gutter={16} className="flex items-center w-full">
                <Col xs={4} md={2}>
                  <label
                    htmlFor={`fileInput_${index}`}
                    className="cursor-pointer"
                  >
                    {teamFile && teamFile[`fileInput_${index}`] ? (
                      <div>
                        <img
                          style={{ width: "2.5rem", height: "2.5rem" }}
                          src={teamFile[`fileInput_${index}`]?.fileURL}
                          alt=""
                          className="rounded-full aspect-square object-cover"
                        />
                      </div>
                    ) : teamMember?.image ? (
                      <div>
                        <img
                          style={{ width: "2.5rem", height: "2.5rem" }}
                          className="rounded-full aspect-square object-cover"
                          src={`${global.IMAGEURL}/${teamMember?.image}`}
                          alt="Camera Icon"
                        />
                      </div>
                    ) : (
                      <div
                        style={{ width: "2.5rem", height: "2.5rem" }}
                        className="border rounded-full flex items-center justify-center object-cover"
                      >
                        <img src={cameradark} alt="Camera Icon" />
                      </div>
                    )}
                  </label>
                  <Input
                    size="large"
                    type="file"
                    id={`fileInput_${index}`}
                    className="visually-hidden"
                    onChange={(e) =>
                      handleFileChangeTeam(index, `fileInput_${index}`, e)
                    }
                  />
                </Col>
                <Col span={9}>
                  <InputStrap
                    className="popins_regular"
                    type="text"
                    style={{ boxShadow: "none" }}
                    placeholder="Name"
                    value={teamMember?.name}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                  />
                </Col>
                <Col span={10}>
                  <Select
                    showSearch
                    style={{
                      width: "100%",
                    }}
                    size="large"
                    placeholder="Select Job title"
                    allowClear
                    value={teamMember?.job_title}
                    onChange={(value) => handleJobTitleChange(index, value)}
                  >
                    {job_types?.map((item, i) => (
                      <Select.Option key={i} value={item}>
                        <span className="w-full">{item}</span>
                      </Select.Option>
                    ))}
                  </Select>
                  {/* <InputStrap
                                        className='popins_regular'
                                        type="text"
                                        required
                                        style={{ boxShadow: 'none' }}
                                        placeholder="Name"
                                        value={teamMember?.job_title}
                                        onChange={(e) => handleJobTitleChange(index, e.target.value)}

                                    /> */}
                </Col>
                <Col span={3}>
                  {index <= 0 ? (
                    <>
                      <button type="button" onClick={handleAddTeamMember}>
                        <PlusCircle className="text_primary" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(index)}
                      >
                        <MinusCircle className="text_secondary" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDeleteTeamMember(index)}
                    >
                      <Trash2
                        style={{ color: "#FF6F61" }}
                        className="text-[#FF6F61]"
                      />
                    </button>
                  )}
                </Col>
              </Row>
            </div>
          </div>
        ))}
        <div className="flex justify-end w-full my-3">
          {!isProcessing ? (
            <button
              type="submit"
              className="flex justify-center bg_primary py-[12px] px-[1rem] rounded-lg items-center button_shadow"
            >
              <span className="inter_semibold text-sm text_white">
                Update Business
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="flex justify-center bg_primary py-[12px] px-[4rem] rounded-lg items-center button_shadow"
              disabled
            >
              <Spinner size={18} className="text_white" />
            </button>
          )}
        </div>
      </Form>
    </main>
  );
};

export default UpdateBusiness;
