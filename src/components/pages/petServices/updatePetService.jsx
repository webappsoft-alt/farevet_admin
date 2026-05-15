/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { CircularProgress } from "@mui/material";
import { Form, Input, Select, TreeSelect, message } from "antd";
import { useEffect, useState } from "react";
import { ArrowLeft } from "react-feather";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../../../api/auth_api";

const currencyArray = [{ title: "CAD" }, { title: "USD" }, { title: "GBP" }];
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

const reportedByArray = [{ title: "Admin" }, { title: "User" }];
const sourceOptions = [
  { label: "Clinic verified", value: "clinic_verified" },
  { label: "User submitted", value: "user_submitted" },
];

const costOfPet = [
  { title: "Exact Cost" },
  { title: "Average Cost" },
  { title: "Estimated Cost" },
  { title: "Per min" },
  { title: "Per Hour" },
  { title: "day" },
  { title: "Night" },
];

const weightData = [
  { value: "All", title: "All" },
  { value: "Small ( 20 > lbs)", title: "Small ( 20 > lbs)" },
  { value: "Medium ( 21-40 lbs)", title: "Medium ( 21-40 lbs)" },
  { value: "Large ( 41-90 lbs)", title: "Large ( 41-90 lbs)" },
  { value: "Extra Large ( 90+ lbs)", title: "Extra Large ( 90+ lbs)" },
];

const UpdatePetService = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { state } = useLocation();
  const serviceData = state?.serviceData || null;

  // Main service states
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [value, setValue] = useState(null);
  const [servicePet, setServicePet] = useState([]);
  const [parsedSubservicesArray, setParsedSubservicesArray] = useState([]);
  const [selectedServiceExists, setSelectedServiceExists] = useState(true);

  // Additional service states
  const [additionalServiceName, setAdditionalServiceName] = useState(null);
  const [selectedAdditionalServiceId, setSelectedAdditionalServiceId] =
    useState(null);
  const [additionalServicePet, setAdditionalServicePet] = useState([]);
  const [
    parsedAdditionalSubservicesArray,
    setParsedAdditionalSubservicesArray,
  ] = useState([]);
  const [selectedAdditionalServiceExists, setSelectedAdditionalServiceExists] =
    useState(true);

  // Other states
  const [valueFilter, setValueFilter] = useState("");
  const [reportedBy, setReportedBy] = useState("Admin");
  const [source, setSource] = useState(undefined);
  const [weightPet, setWeightPet] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cost, setCost] = useState("");
  const [pet, setPet] = useState("");
  const [pay, setPay] = useState("");
  const [currency, setCurrency] = useState("");
  const [subservices, setSubservices] = useState([]);
  const [count, setCount] = useState("");
  const [hasLoader, setHasLoader] = useState(false);
  const [count2, setCount2] = useState("");
  const [hasLoader2, setHasLoader2] = useState(false);
  const [businessCategories, setBusinessCategories] = useState([]);
  const [serviceNames, setServiceNames] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState(null);

  const [initialValues, setInitialValues] = useState({
    amountPet: serviceData?.amount || "",
    descriptionPet: serviceData?.description || "",
    servicesNames: serviceData?.service_name || "",
    weightOfPet: serviceData?.weight || "",
    selectBusiness:
      serviceData?.business?.name + " (" + serviceData?.business?.address + ")",
    additionalServiceName: serviceData?.additional_service_name || "",
    source: serviceData?.source || undefined,
  });

  const handleFetchData = async () => {
    try {
      const body = new FormData();
      body.append("type", "get_data");
      body.append("table_name", "services_list");
      body.append("service_type", "business");
      body.append("limit", 50);
      const res = await apiRequest({ body });
      if (res && res?.data) {
        setServiceNames(res.data);
      } else {
        setServiceNames([]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleBusinessStore = (value) => {
    const searchValue = value?.toLowerCase().trim();
    setCount2("");
    setValueFilter(searchValue);
    handleFetchBusiness(searchValue);
  };

  const handleScroll = (e) => {
    const { target } = e;
    if (
      Math.ceil(target.scrollHeight) - Math.ceil(target.scrollTop) ===
      Math.ceil(target.clientHeight)
    ) {
      if (!hasLoader) {
        return handleFetchData();
      }
    }
  };

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

  const handleFetchDataSubservice = async () => {
    let allServiceName = [];
    let currentPage = 1;
    try {
      while (true) {
        const body = new FormData();
        body.append("type", "get_list");
        body.append("table_name", "sub_services_list");
        body.append("page", currentPage);
        const res = await apiRequest({ body });
        if (res && res?.data && res?.data?.length > 0) {
          allServiceName = allServiceName.concat(res?.data);
          currentPage++;
        } else {
          break;
        }
      }
      setSubservices(allServiceName);
    } catch (error) {
      console.log(error);
    }
  };

  // Main service change handler
  const handleServiceChange = (selectedServiceName) => {
    setValue(selectedServiceName);
    const selectedServiceObject = serviceNames.find(
      (item) => item?.name === selectedServiceName
    );
    if (selectedServiceObject) {
      setSelectedServiceId(selectedServiceObject.id);
      const exists = subservices.some(
        (subservice) => subservice?.service_id === selectedServiceObject.id
      );
      setSelectedServiceExists(exists);
    } else {
      setSelectedServiceExists(true);
    }
  };

  // Additional service change handler
  const handleAdditionalServiceChange = (selectedServiceName) => {
    setAdditionalServiceName(selectedServiceName);
    const selectedServiceObject = serviceNames.find(
      (item) => item?.name === selectedServiceName
    );
    if (selectedServiceObject) {
      setSelectedAdditionalServiceId(selectedServiceObject.id);
      const exists = subservices.some(
        (subservice) => subservice?.service_id === selectedServiceObject.id
      );
      setSelectedAdditionalServiceExists(exists);
    } else {
      setSelectedAdditionalServiceExists(true);
    }
  };

  // Main service category toggle
  const toggleCategory = (nameID) => {
    setServicePet((prevServicePet) => {
      if (prevServicePet.includes(nameID)) {
        return prevServicePet.filter((id) => id !== nameID);
      } else {
        return [...prevServicePet, nameID];
      }
    });
  };

  // Additional service category toggle
  const toggleAdditionalCategory = (nameID) => {
    setAdditionalServicePet((prevAdditionalServicePet) => {
      if (prevAdditionalServicePet.includes(nameID)) {
        return prevAdditionalServicePet.filter((id) => id !== nameID);
      } else {
        return [...prevAdditionalServicePet, nameID];
      }
    });
  };

  useEffect(() => {
    const parsedArray =
      subservices
        ?.filter((subservice) => subservice?.service_id === selectedServiceId)
        .map((subservice) => ({
          ...subservice,
          data: JSON.parse(subservice?.name || "{}"),
        })) || [];
    setParsedSubservicesArray(parsedArray);

    // Don't reset servicePet when it's initial load with serviceData
    if (
      !serviceData ||
      (serviceData && selectedServiceId !== getInitialServiceId())
    ) {
      setServicePet([]);
    }
  }, [selectedServiceId]);

  useEffect(() => {
    const parsedArray =
      subservices
        ?.filter(
          (subservice) => subservice?.service_id === selectedAdditionalServiceId
        )
        .map((subservice) => ({
          ...subservice,
          data: JSON.parse(subservice?.name || "{}"),
        })) || [];
    setParsedAdditionalSubservicesArray(parsedArray);

    // Don't reset additionalServicePet when it's initial load with serviceData
    if (
      !serviceData ||
      (serviceData &&
        selectedAdditionalServiceId !== getInitialAdditionalServiceId())
    ) {
      setAdditionalServicePet([]);
    }
  }, [selectedAdditionalServiceId]);

  // Helper function to get initial service ID
  const getInitialServiceId = () => {
    if (!serviceData?.service_name || !serviceNames.length) return null;
    const initialServiceObject = serviceNames.find(
      (item) => item?.name === serviceData.service_name
    );
    return initialServiceObject?.id || null;
  };

  // Helper function to get initial additional service ID
  const getInitialAdditionalServiceId = () => {
    if (!serviceData?.additional_service_name || !serviceNames.length)
      return null;
    const initialServiceObject = serviceNames.find(
      (item) => item?.name === serviceData.additional_service_name
    );
    return initialServiceObject?.id || null;
  };

  useEffect(() => {
    if (serviceData && serviceNames.length > 0 && subservices.length > 0) {
      try {
        // Set initial main service
        if (serviceData?.service_name) {
          setValue(serviceData.service_name);
          const initialServiceObject = serviceNames.find(
            (item) => item?.name === serviceData.service_name
          );
          if (initialServiceObject) {
            setSelectedServiceId(initialServiceObject.id);
          }
        }

        // Set initial additional service
        if (serviceData?.additional_service_name) {
          setAdditionalServiceName(serviceData.additional_service_name);
          const initialAdditionalServiceObject = serviceNames.find(
            (item) => item?.name === serviceData.additional_service_name
          );
          if (initialAdditionalServiceObject) {
            setSelectedAdditionalServiceId(initialAdditionalServiceObject.id);
          }
        }

        // Set other initial values
        const parsedName = JSON.parse(serviceData?.sub_service || "[]");
        setServicePet(parsedName);
        setCost(serviceData?.cost_type);
        setPet(serviceData?.pet_type);
        setPay(serviceData?.pay_type);
        setCurrency(serviceData?.currency);
        setWeightPet(serviceData?.weight);
        if (serviceData?.source) {
          setSource(serviceData.source);
        }

        if (serviceData?.additional_subservice_name) {
          const parsedAdditionalName = JSON.parse(
            serviceData?.additional_subservice_name || "[]"
          );
          setAdditionalServicePet(parsedAdditionalName);
        }
      } catch (error) {
        console.error("Error parsing serviceData:", error);
      }
    }
  }, [serviceData, serviceNames, subservices]);

  const handleReported = (title) => {
    setReportedBy(title);
  };

  const handleCurrency = (title) => {
    setCurrency(title);
  };
  const handleCost = (title) => {
    setCost(title);
  };

  const handlePayType = (title) => {
    setPay(title);
  };

  const handlePetType = (title) => {
    setPet(title);
  };

  useEffect(() => {
    handleFetchData();
    handleFetchDataSubservice();
  }, []);

  useEffect(() => {
    handleFetchBusiness(count2, valueFilter);
  }, [count2, valueFilter]);

  const handleSubmit = async (values) => {
    setIsProcessing(true);
    if (!servicePet || servicePet.length === 0) {
      message.error("Please select at least one sub-service");
      setIsProcessing(false);
      return;
    }

    const body = new FormData();
    body.append("type", "update_data");
    body.append("table_name", "services");
    body.append("id", serviceData?.id);
    body.append("amount", values?.amountPet);
    body.append("cost_type", cost);
    body.append("service_name", value ? value : serviceData?.service_name);
    body.append("sub_service", JSON.stringify(servicePet));
    body.append("weight", weightPet);
    body.append("pet_type", pet);
    body.append("pay_type", pay);
    body.append("currency", currency);
    body.append("description", values?.descriptionPet);
    body.append(
      "business_id",
      selectedBusinessId ? selectedBusinessId : serviceData?.business_id
    );
    body.append("business_created", "admin");
    body.append("source", source || "");

    if (additionalServiceName) {
      body.append("additional_service_name", additionalServiceName);
      if (additionalServicePet.length > 0) {
        body.append(
          "additional_subservice_name",
          JSON.stringify(additionalServicePet)
        );
      }
    }

    await apiRequest({ body })
      .then(async (res) => {
        setIsProcessing(false);
        if (res?.result === true) {
          message.success("Service Updated Successfully");
          navigate(-1);
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
            navigate(-1);
          }}
          className="flex items-center justify-center w-[36px] h-[36px] bg_primary rounded-lg"
        >
          <ArrowLeft className="text_white" />
        </button>
        <span className="inter_semibold text-xl md:text-2xl text_dark">
          Update Service
        </span>
      </div>
      <Form
        form={form}
        layout="verticle"
        onFinish={handleSubmit}
        initialValues={initialValues}
        className="w-full lg:w-[90%] xl:w-[80%] mx-auto bg_white rounded-lg shadow-md p-[1rem] md:p-[2rem]"
      >
        <hr className="text-[#EDF2F6] my-4" />
        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Type of Pet
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            {petsArray.map((item, i) => (
              <button
                key={i}
                type="button"
                className={`border cursor-pointer rounded-lg gap-1 px-[1rem] py-2 inter_medium text-sm flex justify-center items-center ${
                  pet === item?.value
                    ? "bg-[#F8F2FD] text_primary"
                    : "bg_white text_secondary"
                }`}
                onClick={() => handlePetType(item?.value)}
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
                style={{ cursor: "pointer" }}
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
                onChange={(value) =>
                  setSelectedBusinessId(value?.split(" ").pop())
                }
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
            Service Names
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            <Form.Item
              className="w-full mb-0"
              name="servicesNames"
              rules={[
                {
                  required: true,
                  message: "Please Select service name",
                },
              ]}
            >
              <Select
                showSearch
                style={{
                  width: "100%",
                }}
                size="large"
                placeholder="Select Service"
                allowClear
                onChange={(value) => handleServiceChange(value)}
              >
                {serviceNames?.map((item) => (
                  <Select.Option key={item?.id} value={item?.name}>
                    {item?.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>
        </div>
        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Subservice
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            <Form.Item className="w-full mb-0" name="subService">
              {selectedServiceExists ? (
                parsedSubservicesArray?.map((item, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap gap-2 mb-2 items-center w-100"
                  >
                    {item?.data &&
                      Object.keys(item?.data)?.map((key, j) => (
                        <button
                          key={j}
                          type="button"
                          className={`border cursor-pointer rounded-lg mb-2 gap-1 px-3 py-2 inter_medium text-sm flex justify-center items-center ${
                            servicePet.includes(item?.data[key])
                              ? "bg-[#F8F2FD] text_primary"
                              : "bg_white text_secondary"
                          }`}
                          onClick={() => toggleCategory(item?.data[key])}
                        >
                          {item?.data[key]}
                        </button>
                      ))}
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-between flex-wrap w-full">
                  <span className="text_dark inter_medium">
                    No sub-services found for the selected service
                  </span>
                  <button
                    onClick={() => {
                      navigate("/service-names/create-subservice", {
                        state: { serviceId: selectedServiceId },
                      });
                    }}
                    className="bg_primary text_white px-3 py-2 rounded-lg inter_regular"
                  >
                    Add Names
                  </button>
                </div>
              )}
            </Form.Item>
          </div>
        </div>

        {/* Additional Service Name Section */}
        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Additional Service Name (Optional)
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            <Form.Item className="w-full mb-0" name="additionalServiceName">
              <Select
                showSearch
                style={{
                  width: "100%",
                }}
                size="large"
                placeholder="Select Additional Service"
                allowClear
                onChange={(value) => handleAdditionalServiceChange(value)}
              >
                {serviceNames?.map((item) => (
                  <Select.Option key={item?.id} value={item?.name}>
                    {item?.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>
        </div>

        {/* Additional Subservices Section */}
        {additionalServiceName && (
          <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
            <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
              Additional Subservices (Optional)
            </span>
            <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
              <Form.Item className="w-full mb-0" name="additionalSubService">
                {selectedAdditionalServiceExists ? (
                  parsedAdditionalSubservicesArray?.map((item, i) => (
                    <div
                      key={i}
                      className="flex flex-wrap gap-2 mb-2 items-center w-100"
                    >
                      {item?.data &&
                        Object.keys(item?.data)?.map((key, j) => (
                          <button
                            key={j}
                            type="button"
                            className={`border cursor-pointer rounded-lg mb-2 gap-1 px-3 py-2 inter_medium text-sm flex justify-center items-center ${
                              additionalServicePet.includes(item?.data[key])
                                ? "bg-[#F8F2FD] text_primary"
                                : "bg_white text_secondary"
                            }`}
                            onClick={() =>
                              toggleAdditionalCategory(item?.data[key])
                            }
                          >
                            {item?.data[key]}
                          </button>
                        ))}
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-between flex-wrap w-full">
                    <span className="text_dark inter_medium">
                      No sub-services found for the selected additional service
                    </span>
                    <button
                      onClick={() => {
                        navigate("/service-names/create-subservice", {
                          state: { serviceId: selectedAdditionalServiceId },
                        });
                      }}
                      className="bg_primary text_white px-3 py-2 rounded-lg inter_regular"
                    >
                      Add Names
                    </button>
                  </div>
                )}
              </Form.Item>
            </div>
          </div>
        )}

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
        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Amount
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            <Form.Item className="w-full mb-0" name="amountPet">
              <Input type="number" rows={2} size="large" />
            </Form.Item>
          </div>
        </div>
        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Currency
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            {currencyArray.map((item, i) => (
              <button
                key={i}
                type="button"
                className={`border cursor-pointer rounded-lg gap-1 px-[1rem] py-2 inter_medium text-sm flex justify-center items-center ${
                  currency === item?.title
                    ? "bg-[#F8F2FD] text_primary"
                    : "bg_white text_secondary"
                }`}
                onClick={() => handleCurrency(item?.title)}
              >
                {item?.title}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Cost
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            {costOfPet.map((item, i) => (
              <button
                key={i}
                type="button"
                className={`border cursor-pointer rounded-lg gap-1 px-[1rem] py-2 inter_medium text-sm flex justify-center items-center ${
                  cost === item?.title
                    ? "bg-[#F8F2FD] text_primary"
                    : "bg_white text_secondary"
                }`}
                onClick={() => handleCost(item?.title)}
              >
                {item?.title}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Weight(LBS)
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            <Form.Item
              className="w-full mb-0"
              name="weightOfPet"
              rules={[
                {
                  required: true,
                  message: "Please Select weight",
                },
              ]}
            >
              <TreeSelect
                showSearch
                style={{
                  width: "100%",
                }}
                value={weightPet}
                size="large"
                placeholder="Select pet weight"
                allowClear
                treeDefaultExpandAll
                onChange={(e) => {
                  setWeightPet(e);
                }}
                treeData={weightData}
              />
            </Form.Item>
          </div>
        </div>
        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Source
          </span>
          <div className="w-full md:w-[70%]">
            <Form.Item name="source" className="rounded-lg w-full mb-0">
              <Select
                allowClear
                size="large"
                style={{ width: "100%" }}
                placeholder="Select source"
                value={source}
                onChange={(v) => setSource(v)}
                options={sourceOptions}
                optionLabelProp="label"
              />
            </Form.Item>
          </div>
        </div>
        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Service Reported By
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            {reportedByArray.map((item, i) => (
              <button
                key={i}
                type="button"
                style={{ cursor: "pointer" }}
                className={`border cursor-pointer rounded-3 gap-1 px-[1rem] py-2 inter_medium text-sm flex justify-center items-center ${
                  reportedBy === item?.title
                    ? "bg-[#F8F2FD] text_primary"
                    : "bg_white text_secondary"
                }`}
                onClick={() => handleReported(item?.title)}
              >
                {item?.title}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end w-full my-3">
          {!isProcessing ? (
            <button
              type="submit"
              className="flex justify-center bg_primary py-[12px] px-[1rem] rounded-lg items-center button_shadow"
            >
              <span className="inter_semibold text-sm text_white">
                Update Service
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="flex justify-center bg_primary cursor-not-allowed py-[12px] px-[4rem] rounded-lg items-center button_shadow"
              disabled
            >
              <CircularProgress size={18} className="text_white" />
            </button>
          )}
        </div>
      </Form>
    </main>
  );
};

export default UpdatePetService;
