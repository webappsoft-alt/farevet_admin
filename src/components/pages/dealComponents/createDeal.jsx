/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import Spinner from "../../Spinner";
import { Form, Input, Select, message } from "antd";
import React, { useEffect, useState } from "react";
import { ArrowLeft } from "react-feather";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../../api/auth_api";
import { cameradark } from "../../icons/icon";
import debounce from "debounce";

const petsArray = [
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

const CreateDeal = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [selectedFile, setSelectedFile] = useState(null);
  const [pet, setPet] = useState("dog");
  const [pay, setPay] = useState("card");
  const [dealType, setDealType] = useState("clinic");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [valueFilter, setValueFilter] = useState("");
  const [loadselectedFile, setLoadselectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [servicesOfDeals, setServicesOfDeals] = useState([]);
  const [businessCategories, setBusinessCategories] = useState([]);
  const [count, setCount] = useState("");
  const [hasLoader, setHasLoader] = useState(false);
  const [businessDetail, setBusinessDetail] = useState(null);
  const [count2, setCount2] = useState("");
  const [hasLoader2, setHasLoader2] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [bookNow, setBookNow] = useState("yes");

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

  useEffect(() => {
    const matchBusiness = businessCategories?.find(
      (item) => item?.id === selectedBusinessId,
    );
    if (matchBusiness) {
      setBusinessDetail(matchBusiness);
    }
  }, [businessCategories, selectedBusinessId, businessDetail]);

  const handlePetType = (title) => {
    setPet(title);
    setCount2("");
    handleFetchServices(selectedBusinessId);
  };

  const handlePayType = (title) => {
    setPay(title);
  };

  const handleDealType = (title) => {
    setDealType(title);
    form.resetFields();
  };

  const handleFetchServices = debounce(async (businessId) => {
    try {
      const body = new FormData();
      body.append("type", "get_data");
      body.append("table_name", "services");
      body.append("business_id", businessId);
      body.append("last_id", count2);
      const res = await apiRequest({ body });
      if (!res?.data) {
        setHasLoader2(true);
      }
      if (res && res?.data) {
        const filteredServices = res?.data?.filter(
          (service) => service?.pet_type === pet,
        );
        setCount2(res?.data?.[res?.data?.length - 1]?.id);
        if (!count2) {
          setServicesOfDeals(filteredServices);
        } else {
          setServicesOfDeals([...servicesOfDeals, ...filteredServices]);
        }
      } else if (res?.data.length === 0 && count2) {
        setServicesOfDeals(servicesOfDeals);
      } else {
        setServicesOfDeals([]);
      }
      setIsProcessing(false);
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
    }
  }, 300);

  const handleScroll2 = (e) => {
    const { target } = e;
    if (
      Math.ceil(target.scrollHeight) - Math.ceil(target.scrollTop) ===
      Math.ceil(target.clientHeight)
    ) {
      if (!hasLoader2) {
        return handleFetchServices(selectedBusinessId);
      }
    }
  };

  useEffect(() => {
    handleFetchBusiness(count, valueFilter);
  }, [count, valueFilter]);

  // useEffect(() => {
  //     if (selectedBusinessId) {
  //         handleFetchServices();
  //     }
  // }, [selectedBusinessId]);

  const handleBusinessStore = (value) => {
    const searchValue = value?.toLowerCase().trim();
    setCount2("");
    setValueFilter(searchValue);
    handleFetchBusiness(searchValue);
  };

  const handleFileChange3 = async (e, id) => {
    const file = e.target.files[0];
    const updatedFileName = file?.name;
    const body = new FormData();
    body.append("type", "upload_data");
    body.append("file", new Blob([file], { type: file.type }), updatedFileName);
    try {
      const response = await apiRequest({ body });
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
    setIsProcessing(true);
    const formattedExpiryDate = values?.expiryDate
      ? new Date(values.expiryDate).toISOString().split("T")[0]
      : "";
    const body = new FormData();
    body.append("type", "add_data");
    body.append("table_name", "deals");
    body.append("discount", values?.discountDeal);
    body.append("promo_code", values?.promoCode);
    body.append("deal_type", dealType);
    if (selectedCategory) {
      body.append("category", selectedCategory);
    }
    if (dealType === "clinic") {
      body.append("book_now", bookNow);
      body.append("pet_type", pet);
      body.append("pay_type", pay);
      body.append("lat", businessDetail?.lat);
      body.append("lng", businessDetail?.lng);
      body.append("services", JSON.stringify(selectedServices));
      body.append("business_id", selectedBusinessId);
    } else {
      body.append("business_name", values?.businessName);
      body.append("website_link", values?.websiteLink);
      body.append("button_text", values?.button_text);
    }

    body.append("image", loadselectedFile);
    body.append("expiry_date", formattedExpiryDate);
    body.append("description", values?.descriptionPet);
    body.append("business_created", "admin");

    try {
      const res = await apiRequest({ body });
      if (res) {
        message.success("Deal Created Successfully");
        navigate("/deals");
        form.resetFields();
      } else {
        message.error("Creation failed...");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
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
          Create New Deal
        </span>
      </div>
      <Form
        layout="verticle"
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
                    value={selectedBusinessId}
                    onChange={(value) => {
                      setSelectedBusinessId(value?.split(" ").pop());
                      handleFetchServices(value?.split(" ").pop());
                    }}
                    onSearch={(value) => handleBusinessStore(value)}
                  >
                    {businessCategories?.map((item) => (
                      <Select.Option
                        key={item?.id}
                        onChange={() => setSelectedBusinessId(item?.id)}
                        value={`${item?.name} (${item?.address}) ${item?.id}`}
                      >
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
                  name="businessName"
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
                  name="websiteLink"
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
            Discount
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            <Form.Item className="w-full mb-0" name="discountDeal">
              <Input type="number" size="large" />
            </Form.Item>
          </div>
        </div>

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

export default CreateDeal;
