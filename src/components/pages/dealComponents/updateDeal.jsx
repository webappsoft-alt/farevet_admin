/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/img-redundant-alt */
/* eslint-disable no-unused-vars */
import { Form, Input, Select, message } from "antd";
import React, { useEffect, useState } from "react";
import { ArrowLeft } from "react-feather";
import { useLocation, useNavigate } from "react-router-dom";
import { cameradark } from "../../icons/icon";
import { apiRequest } from "../../../api/auth_api";
import Spinner from "../../Spinner";

const petsArray = [
  // { title: "All", value: 'all' },
  { title: "Dog", value: "dog" },
  { title: "Cat", value: "cat" },
  { title: "Other", value: "other" },
];

const payArray = [
  { title: "Card", value: "card" },
  { title: "Clinic", value: "clinic" },
];

const dealTypeArray = [
  { title: "Clinic", value: "clinic" },
  { title: "Other", value: "other" },
];

const categoryArray = [
  { title: "Pet Insurance", value: "pet-insurance" },
  { title: "Veterinary services", value: "veterinary-services" },
  { title: "Pet Care Financing", value: "pet-care-financing" },
  { title: "Grooming & Spa Services", value: "grooming-spa" },
  { title: "Pet Food & Treats", value: "pet-food-treats" },
  { title: "Pet Toys & Accessories", value: "pet-toys-accessories" },
  { title: "Training & Behavior Services", value: "training-behavior" },
  { title: "Pet Boarding & Daycare", value: "pet-boarding-daycare" },
  { title: "Pet Health & Supplements", value: "pet-health-supplements" },
  { title: "Pet Tech & Smart Devices", value: "pet-tech-devices" },
  { title: "Adoption & Rescue Support", value: "adoption-rescue" },
];

const UpdateDeal = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { state } = useLocation();
  const dealData = state?.dealDetail || null;
  const [dealType, setDealType] = useState("clinic");
  const [businessDetail, setBusinessDetail] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loadselectedFile, setLoadselectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [servicesOfDeals, setServicesOfDeals] = useState([]);
  const [businessCategories, setBusinessCategories] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState(null);
  const [count, setCount] = useState("");
  const [pet, setPet] = useState("");
  const [pay, setPay] = useState("");
  const [valueFilter, setValueFilter] = useState("");
  const [hasLoader, setHasLoader] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [count2, setCount2] = useState("");
  const [hasLoader2, setHasLoader2] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [bookNow, setBookNow] = useState("yes");
  const [initialValues, setInitialValues] = useState({
    discountDeal: dealData?.discount || "",
    dealCost: dealData?.cost || "",
    business_name: dealData?.business_name || "",
    website_link: dealData?.website_link || "",
    descriptionPet: dealData?.description || "",
    selectCategory: dealData?.category || "",
    promoCode: dealData?.promo_code || "",
    expiryDate: dealData?.expiry_date || "",
    selectBusiness:
      dealData?.business?.name + " (" + dealData?.business?.address + ")",
    selectServices: dealData?.deal_services?.map((item, i) => item?.id) || null,
    file: dealData?.image,
    button_text: dealData?.button_text || "",
  });

  const hasDiscountOrCostValue = (discount, cost) => {
    const hasDiscount =
      discount !== undefined &&
      discount !== null &&
      String(discount).trim() !== "";
    const hasCost =
      cost !== undefined && cost !== null && String(cost).trim() !== "";
    return hasDiscount || hasCost;
  };

  const handlePetType = (title) => {
    setPet(title);
    setCount2("");
    setHasLoader2(false);
    setServicesOfDeals([]);
    if (selectedBusinessId) {
      handleFetchServices(selectedBusinessId, title, "");
    }
  };

  const handlePayType = (title) => {
    setPay(title);
  };

  useEffect(() => {
    if (dealData) {
      setBookNow(dealData?.book_now);
      setSelectedServices(
        dealData?.deal_services?.map((item, i) => item?.id) || null,
      );
      setPet(dealData?.pet_type);
      setSelectedCategory(dealData?.category);
      setPay(dealData?.pay_type);
      setDealType(dealData?.deal_type);
      if (dealData?.business_id) {
        setSelectedBusinessId(String(dealData.business_id));
      }
      setInitialValues((prev) => ({
        ...prev,
        discountDeal: dealData?.discount || "",
        dealCost: dealData?.cost || "",
        business_name: dealData?.business_name || "",
        website_link: dealData?.website_link || "",
        descriptionPet: dealData?.description || "",
        selectCategory: dealData?.category || "",
        promoCode: dealData?.promo_code || "",
        expiryDate: dealData?.expiry_date || "",
        button_text: dealData?.button_text || "",
      }));
      form.setFieldsValue({
        discountDeal: dealData?.discount || "",
        dealCost: dealData?.cost || "",
      });
    }
  }, [dealData]);

  useEffect(() => {
    const matchBusiness = businessCategories?.find(
      (item) => String(item?.id) === String(selectedBusinessId),
    );
    if (matchBusiness) {
      setBusinessDetail(matchBusiness);
    }
  }, [businessCategories, selectedBusinessId, businessDetail]);

  const handleFetchBusiness = async () => {
    try {
      const body = new FormData();
      body.append("type", "get_data");
      body.append("table_name", "businesses");
      body.append("status", "1");
      body.append("limit", 50);
      if (valueFilter && valueFilter !== "") {
        body.append("search", valueFilter);
      }
      const res = await apiRequest({ body });
      if (res && res.data) {
        setBusinessCategories(res.data);
      } else {
        setBusinessCategories([]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleDealType = (title) => {
    setDealType(title);
    form.resetFields();
    setSelectedBusinessId(null);
    setServicesOfDeals([]);
    setSelectedServices([]);
    setCount2("");
    setHasLoader2(false);
  };

  const matchesPetType = (servicePetType, selectedPet) => {
    const servicePet = String(servicePetType || "")
      .toLowerCase()
      .trim();
    const selected = String(selectedPet || "")
      .toLowerCase()
      .trim();
    if (!selected) return true;
    if (!servicePet) return true;
    if (servicePet === "all" || servicePet === "both") return true;
    return servicePet === selected;
  };

  const handleFetchServices = async (
    businessId,
    petType = pet,
    lastId = "",
  ) => {
    if (!businessId) {
      setServicesOfDeals([]);
      return;
    }
    try {
      const body = new FormData();
      body.append("type", "get_data");
      body.append("table_name", "services");
      body.append("business_id", String(businessId));
      body.append("limit", "200");
      if (lastId) {
        body.append("last_id", String(lastId));
      }
      const res = await apiRequest({ body });
      const rows = Array.isArray(res?.data) ? res.data : [];
      if (!rows.length) {
        setHasLoader2(true);
        if (!lastId) setServicesOfDeals([]);
        return;
      }
      const filteredServices = rows.filter((service) =>
        matchesPetType(service?.pet_type, petType),
      );
      const nextLastId = rows[rows.length - 1]?.id || "";
      setCount2(nextLastId);
      if (rows.length < 10) {
        setHasLoader2(true);
      }
      if (!lastId) {
        setServicesOfDeals(filteredServices);
      } else {
        setServicesOfDeals((prev) => [...prev, ...filteredServices]);
      }
    } catch (error) {
      console.error(error);
      if (!lastId) setServicesOfDeals([]);
    }
  };

  const handleScroll2 = (e) => {
    const { target } = e;
    if (
      Math.ceil(target.scrollHeight) - Math.ceil(target.scrollTop) ===
      Math.ceil(target.clientHeight)
    ) {
      if (!hasLoader2 && selectedBusinessId && count2) {
        handleFetchServices(selectedBusinessId, pet, count2);
      }
    }
  };
  useEffect(() => {
    handleFetchBusiness(count, valueFilter);
  }, [count, valueFilter]);

  useEffect(() => {
    if (dealData?.business_id && dealData?.deal_type === "clinic") {
      handleFetchServices(
        String(dealData.business_id),
        dealData?.pet_type || pet,
        "",
      );
    }
  }, [dealData?.business_id]);

  const handleBusinessStore = (value) => {
    const searchValue = value?.toLowerCase().trim();
    setCount("");
    setValueFilter(searchValue);
    handleFetchBusiness("", searchValue);
  };

  const handleFileChange3 = async (e, id) => {
    const file = e.target.files[0];
    const updatedFileName = file?.name;
    const body = new FormData();
    body.append("type", "upload_data");
    body.append("file", new Blob([file], { type: file.type }), updatedFileName);
    try {
      const response = await apiRequest({ body });
      // console.log(response);
      const fileURL = URL.createObjectURL(file);
      setSelectedFile({ file_name: response.file_name, fileURL });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (selectedFile) {
      setLoadselectedFile(selectedFile?.file_name);
    }
  }, [selectedFile]);

  const handleSubmit = async (values) => {
    if (
      dealType === "other" &&
      !hasDiscountOrCostValue(values?.discountDeal, values?.dealCost)
    ) {
      message.error("Enter a discount or a cost for Other deals");
      return;
    }

    setIsProcessing(true);
    const formattedExpiryDate = values?.expiryDate
      ? new Date(values?.expiryDate).toISOString().split("T")[0]
      : "";
    const body = new FormData();
    body.append("type", "update_data");
    body.append("table_name", "deals");
    body.append("id", dealData?.id);
    body.append(
      "discount",
      values?.discountDeal !== undefined && values?.discountDeal !== null
        ? String(values.discountDeal).trim()
        : "",
    );
    body.append("deal_type", dealType);
    if (selectedCategory) {
      body.append("category", selectedCategory);
    }
    body.append("promo_code", values?.promoCode || "");
    if (dealType === "clinic") {
      body.append("book_now", bookNow);
      body.append("pet_type", pet);
      body.append("pay_type", pay);
      body.append(
        "lat",
        businessDetail?.lat ? businessDetail?.lat : dealData?.lat,
      );
      body.append(
        "lng",
        businessDetail?.lng ? businessDetail?.lng : dealData?.lng,
      );
      body.append(
        "services",
        selectedServices
          ? JSON.stringify(selectedServices)
          : dealData?.deal_services?.map((item, i) => item?.id) || null,
      );
      body.append(
        "business_id",
        selectedBusinessId ? selectedBusinessId : dealData?.business_id,
      );
      body.append("cost", "");
    } else {
      body.append("business_name", values?.business_name);
      body.append("website_link", values?.website_link);
      body.append("button_text", values?.button_text);
      body.append(
        "cost",
        values?.dealCost !== undefined && values?.dealCost !== null
          ? String(values.dealCost).trim()
          : "",
      );
    }
    body.append("image", loadselectedFile ? loadselectedFile : dealData?.image);
    body.append("expiry_date", formattedExpiryDate);
    body.append("description", values?.descriptionPet);
    body.append("business_created", "admin");
    await apiRequest({ body })
      .then(async (res) => {
        setIsProcessing(false);
        if (res) {
          // console.log(res, "ress");
          message.success("Deal Updated Successfully");
          navigate("/deals");
          form.resetFields();
        } else {
          message.error("Creation failed...");
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
  return (
    <main className="container m-auto min-h-screen py-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => {
            navigate("/deals");
          }}
          className="flex items-center justify-center w-[36px] h-[36px] bg_primary rounded-lg"
        >
          <ArrowLeft className="text_white" />
        </button>
        <span className="inter_semibold text-xl md:text-2xl text_dark">
          Update Deal
        </span>
      </div>
      <Form
        layout="verticle"
        initialValues={initialValues}
        onFinish={handleSubmit}
        form={form}
        className="w-full lg:w-[90%] xl:w-[80%] mx-auto bg_white rounded-lg shadow-md p-[1rem] md:p-[2rem]"
      >
        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Deal Type
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            {dealTypeArray.map((item, i) => (
              <button
                key={i}
                type="button"
                className={`border cursor-pointer rounded-3 gap-1 px-[1rem] py-2 inter_medium text-sm flex justify-center items-center ${
                  dealType === item?.value
                    ? "bg-[#F8F2FD] text_primary"
                    : "bg_white text_secondary"
                }`}
                onClick={() => handleDealType(item?.value)}
              >
                {item?.title}
              </button>
            ))}
          </div>
        </div>

        {dealType === "clinic" ? (
          <>
            <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
              <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
                Select your business
              </span>
              <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
                <Form.Item
                  className="w-full mb-0"
                  name="selectBusiness"
                  rules={[
                    {
                      required: true,
                      message: "Please Select your business",
                    },
                  ]}
                >
                  <Select
                    showSearch
                    style={{
                      width: "100%",
                    }}
                    size="large"
                    placeholder="Search business store"
                    allowClear
                    optionFilterProp="children"
                    value={selectedBusinessId || undefined}
                    onChange={(value) => {
                      const businessId = value ? String(value) : null;
                      setSelectedBusinessId(businessId);
                      setSelectedServices([]);
                      setServicesOfDeals([]);
                      setCount2("");
                      setHasLoader2(false);
                      form.setFieldsValue({ selectServices: undefined });
                      if (businessId) {
                        handleFetchServices(businessId, pet, "");
                      }
                    }}
                    onSearch={(value) => handleBusinessStore(value)}
                    onClear={() => {
                      setSelectedBusinessId(null);
                      setServicesOfDeals([]);
                      setSelectedServices([]);
                      setCount2("");
                    }}
                  >
                    {businessCategories?.map((item) => (
                      <Select.Option key={item?.id} value={String(item?.id)}>
                        {item?.name} ({item?.address})
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
            </div>

            <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
              <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
                Type of Pet
              </span>
              <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
                {petsArray.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`border cursor-pointer rounded-3 gap-1 px-[1rem] py-2 inter_medium text-sm flex justify-center items-center ${
                      pet === item?.value
                        ? "bg-[#F8F2FD] text_primary"
                        : "bg_white text_secondary"
                    }`}
                    onClick={() => {
                      handlePetType(item?.value);
                    }}
                  >
                    {item?.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
              <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
                Pay Type
              </span>
              <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
                {payArray.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`border cursor-pointer rounded-3 gap-1 px-[1rem] py-2 inter_medium text-sm flex justify-center items-center ${
                      pay === item?.value
                        ? "bg-[#F8F2FD] text_primary"
                        : "bg_white text_secondary"
                    }`}
                    onClick={() => handlePayType(item?.value)}
                  >
                    {item?.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
              <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
                Select your Services
              </span>
              <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
                <Form.Item
                  className="w-full mb-0"
                  name="selectServices"
                  rules={[
                    {
                      required: true,
                      message: "Please Select your services",
                    },
                  ]}
                >
                  <Select
                    showSearch
                    style={{
                      width: "100%",
                    }}
                    mode="multiple"
                    size="large"
                    placeholder="Select Services"
                    onPopupScroll={handleScroll2}
                    allowClear
                    onChange={(value) => setSelectedServices(value)}
                  >
                    {servicesOfDeals?.map((item) => (
                      <Select.Option key={item?.id} value={item?.id}>
                        {item?.service_name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
            </div>
            <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
              <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
                Are you want to add Book Now?
              </span>
              <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
                <button
                  type="button"
                  className={`border cursor-pointer rounded-lg gap-1 px-[1rem] py-2 inter_medium text-sm flex justify-center items-center ${bookNow === "yes" ? "bg-[#F8F2FD] text_primary" : "bg_white text_secondary"}`}
                  onClick={() => setBookNow("yes")}
                >
                  Yes{" "}
                </button>
                <button
                  type="button"
                  className={`border cursor-pointer rounded-lg gap-1 px-[1rem] py-2 inter_medium text-sm flex justify-center items-center ${bookNow === "no" ? "bg-[#F8F2FD] text_primary" : "bg_white text_secondary"}`}
                  onClick={() => setBookNow("no")}
                >
                  No
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
              <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
                Business Name
              </span>
              <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
                <Form.Item
                  className="w-full mb-0"
                  name="business_name"
                  rules={[
                    {
                      required: true,
                      message: "Please enter business name",
                    },
                  ]}
                >
                  <Input size="large" placeholder="Enter business name" />
                </Form.Item>
              </div>
            </div>

            <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
              <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
                Website Link
              </span>
              <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
                <Form.Item
                  className="w-full mb-0"
                  name="website_link"
                  rules={[
                    {
                      required: true,
                      message: "Please enter website link",
                    },
                  ]}
                >
                  <Input size="large" placeholder="Enter website link" />
                </Form.Item>
              </div>
            </div>

            <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
              <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
                Button Text
              </span>
              <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
                <Form.Item
                  className="w-full mb-0"
                  name="button_text"
                  rules={[
                    {
                      required: true,
                      message: "Please enter button text",
                    },
                  ]}
                >
                  <Input size="large" placeholder="Enter button text" />
                </Form.Item>
              </div>
            </div>
          </>
        )}

        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Upload Image
          </span>
          <div className="w-full md:w-[70%]">
            <Form.Item
              name="file"
              className="rounded-lg w-fit text-center"
              rules={[
                {
                  required: true,
                  message: "Please upload a file",
                },
              ]}
            >
              <div>
                <label htmlFor="fileInput" className="cursor-pointer">
                  {selectedFile ? (
                    <img
                      style={{ height: "100px", width: "120px" }}
                      src={selectedFile?.fileURL}
                      alt="Preview"
                      className="rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      style={{ height: "100px", width: "120px" }}
                      className="border rounded-lg flex justify-center items-center"
                    >
                      <img src={cameradark} alt="Camera Icon" />
                    </div>
                  )}
                </label>
                <Input
                  size="large"
                  type="file"
                  id="fileInput"
                  className="visually-hidden"
                  onChange={handleFileChange3}
                />
              </div>
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
                  message: "Please select a category",
                },
              ]}
            >
              <Select
                style={{
                  width: "100%",
                }}
                size="large"
                placeholder="Select Category"
                onChange={(value) => setSelectedCategory(value)}
              >
                {categoryArray.map((item) => (
                  <Select.Option key={item.value} value={item.value}>
                    {item.title}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>
        </div>

        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Discount {dealType === "other" ? "(optional)" : ""}
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            <Form.Item
              className="w-full mb-0"
              name="discountDeal"
              dependencies={dealType === "other" ? ["dealCost"] : undefined}
              rules={
                dealType === "other"
                  ? [
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (
                            hasDiscountOrCostValue(
                              value,
                              getFieldValue("dealCost"),
                            )
                          ) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error("Enter a discount (%) or a cost ($)"),
                          );
                        },
                      }),
                    ]
                  : []
              }
              extra={
                dealType === "other"
                  ? "Provide a discount %, a cost $, or both"
                  : undefined
              }
            >
              <Input
                type="number"
                min={0}
                size="large"
                placeholder={
                  dealType === "other" ? "e.g. 20 (% off)" : "Discount %"
                }
                addonAfter={dealType === "other" ? "%" : undefined}
              />
            </Form.Item>
          </div>
        </div>

        {dealType === "other" ? (
          <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
            <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
              Cost (optional)
            </span>
            <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
              <Form.Item
                className="w-full mb-0"
                name="dealCost"
                dependencies={["discountDeal"]}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (
                        hasDiscountOrCostValue(
                          getFieldValue("discountDeal"),
                          value,
                        )
                      ) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("Enter a discount (%) or a cost ($)"),
                      );
                    },
                  }),
                ]}
                extra="Use when the deal is a fixed price instead of (or with) a % discount"
              >
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  size="large"
                  placeholder="e.g. 1.00"
                  addonBefore="$"
                />
              </Form.Item>
            </div>
          </div>
        ) : null}

        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Promo Code
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            <Form.Item
              className="w-full mb-0"
              name="promoCode"
              rules={
                dealType === "clinic"
                  ? [
                      {
                        required: true,
                        message: "Please enter the Promo code",
                      },
                    ]
                  : []
              }
            >
              <Input type="text" size="large" />
            </Form.Item>
          </div>
        </div>

        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Expiry Date
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            <Form.Item
              className="w-full mb-0"
              name="expiryDate"
              rules={
                dealType === "clinic"
                  ? [
                      {
                        required: true,
                        message: "Please enter the Expiry date",
                      },
                    ]
                  : []
              }
            >
              <Input type="date" rows={2} size="large" />
            </Form.Item>
          </div>
        </div>

        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Description
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            <Form.Item
              className="w-full mb-0"
              name="descriptionPet"
              rules={[
                {
                  required: true,
                  message: "Please enter your description",
                },
              ]}
            >
              <Input.TextArea rows={2} size="large" />
            </Form.Item>
          </div>
        </div>

        <div className="flex justify-end w-full my-3">
          {!isProcessing ? (
            <button
              type="submit"
              className="flex justify-center bg_primary py-[12px] px-[1rem] rounded-lg items-center button_shadow"
            >
              <span className="inter_semibold text-sm text_white">
                Create Deal
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="flex justify-center bg_primary cursor-not-allowed py-[12px] px-[4rem] rounded-lg items-center button_shadow"
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

export default UpdateDeal;
