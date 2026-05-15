/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { Form, Input, Select, TreeSelect, message } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Trash2 } from "react-feather";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../../../api/auth_api";
import { CircularProgress } from "@mui/material";

const reportedByArray = [{ title: "Admin" }, { title: "User" }];
const sourceOptions = [
    { label: "Clinic verified", value: "clinic_verified" },
    { label: "User submitted", value: "user_submitted" },
];
const currencyArray = [{ title: "CAD" }, { title: "USD" }, { title: "GBP" }];
const petsArray = [
    // { title: "All", value: 'all' },
    { title: "Dog", value: 'dog' },
    { title: "Cat", value: 'cat' },
    { title: "Other", value: 'other' }
];
const payArray = [
    { title: "Card", value: 'card' },
    { title: "Clinic", value: 'clinic' },
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

const CreatePetService = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const { state } = useLocation()
    const businessData = state?.businessData || null

    // Main service states
    const [pet, setPet] = useState("dog");
    const [pay, setPay] = useState("card");
    const [reportedBy, setReportedBy] = useState("Admin");
    const [source, setSource] = useState(undefined);
    const [selectedServiceId, setSelectedServiceId] = useState(null);
    const [value, setValue] = useState(null);
    const [valueFilter, setValueFilter] = useState('')
    const [weightPet, setWeightPet] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [parsedSubservicesArray, setParsedSubservicesArray] = useState([]);
    const [servicePet, setServicePet] = useState([]);
    const [isServices, setIsServices] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedServiceExists, setSelectedServiceExists] = useState(true);
    const [cost, setCost] = useState("Exact Cost");
    const [currency, setCurrency] = useState("CAD");
    const [subservices, setSubservices] = useState([]);
    const [businessCategories, setBusinessCategories] = useState([]);
    const [serviceNames, setServiceNames] = useState([]);
    const [count, setCount] = useState("");
    const [hasLoader, setHasLoader] = useState(false)
    const [count2, setCount2] = useState("");
    const [hasLoader2, setHasLoader2] = useState(false)
    const [selectedBusinessId, setSelectedBusinessId] = useState(null);

    // Additional service states
    const [additionalServiceName, setAdditionalServiceName] = useState(null);
    const [selectedAdditionalServiceId, setSelectedAdditionalServiceId] = useState(null);
    const [additionalServicePet, setAdditionalServicePet] = useState([]);
    const [parsedAdditionalSubservicesArray, setParsedAdditionalSubservicesArray] = useState([]);
    const [selectedAdditionalServiceExists, setSelectedAdditionalServiceExists] = useState(true);

    useEffect(() => {
        // const matchedService = businessCategories?.find(item => item?.id === businessData?.id);
        // if (matchedService) {
        //     setSelectedBusinessId(matchedService?.id);
        if (businessData) {
            form.setFieldsValue({
                selectBusiness: businessData?.name + ' (' + businessData?.address + ')',
            });
        }
        // }
    }, [businessCategories, businessData, selectedBusinessId]);

    const handleFetchData = async () => {
        try {
            setLoading(true);
            const body = new FormData();
            body.append('type', 'get_data');
            body.append('table_name', 'services_list');
            body.append('service_type', 'business');
            body.append('limit', 50);
            const res = await apiRequest({ body });
            setLoading(false);
            if (res && res?.data) {
                // console.log('res', res)
                setServiceNames(res.data);
            } else {
                setServiceNames([]);
            }
        } catch (error) {
            setLoading(false);
            console.log(error);
        }
    };

    const handleScroll = (e) => {
        const { target } = e;
        // if (
        //     Math.ceil(target.scrollHeight) - Math.ceil(target.scrollTop) ===
        //     Math.ceil(target.clientHeight)
        // ) {
        //     if (!hasLoader) {
        //         handleFetchData();
        //     }
        // }
    };
    const handleScroll2 = (e) => {
        const { target } = e;
        // if (
        //     Math.ceil(target.scrollHeight) - Math.ceil(target.scrollTop) ===
        //     Math.ceil(target.clientHeight)
        // ) {
        //     if (!hasLoader2) {
        //         return handleFetchBusiness()
        //     }
        // }
    };

    const handleFetchBusiness = async () => {
        try {
            const body = new FormData();
            body.append("type", "get_data");
            body.append("table_name", "businesses");
            body.append("status", '1');
            body.append("limit", 50);
            if (valueFilter && valueFilter !== '') {
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

    const handleBusinessStore = (value) => {
        const searchValue = value?.toLowerCase().trim();
        setCount2('');
        setValueFilter(searchValue);
        handleFetchBusiness(searchValue);
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
            setIsServices(true);
            const exists = subservices.some(
                (subservice) => subservice?.service_id === selectedServiceObject.id
            );
            setSelectedServiceExists(exists);
        } else {
            setIsServices(false);
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

    // console.log(servicePet);
    console.log('selectedServiceId', selectedServiceId)
    // Update main subservices when main service changes
    useEffect(() => {
        const parsedArray =
            subservices
                ?.filter((subservice) => subservice?.service_id === selectedServiceId)
                .map((subservice) => ({
                    ...subservice,
                    data: JSON.parse(subservice?.name || "{}"),
                })) || [];
        setParsedSubservicesArray(parsedArray);
        setServicePet([]); // Ensure no subservices are pre-selected
    }, [subservices, selectedServiceId]);

    // Update additional subservices when additional service changes
    useEffect(() => {
        const parsedArray =
            subservices
                ?.filter((subservice) => subservice?.service_id === selectedAdditionalServiceId)
                .map((subservice) => ({
                    ...subservice,
                    data: JSON.parse(subservice?.name || "{}"),
                })) || [];
        setParsedAdditionalSubservicesArray(parsedArray);
        setAdditionalServicePet([]);
    }, [selectedAdditionalServiceId]);

    const handleCurrency = (title) => {
        setCurrency(title);
    };
    const handleReported = (title) => {
        setReportedBy(title);
    };
    const handleCost = (title) => {
        setCost(title);
    };
    const handlePetType = (title) => {
        setPet(title);
    };
    const handlePayType = (title) => {
        setPay(title);
    };

    useEffect(() => {
        handleFetchDataSubservice();
    }, []);

    useEffect(() => {
        handleFetchData();
    }, []);

    useEffect(() => {
        handleFetchBusiness(count2, valueFilter);
    }, [count2, valueFilter]);

    const handleSubmit = async (values) => {
        // setIsProcessing(true);
        if (!servicePet || servicePet.length === 0) {
            message.error('Please select at least one sub-service');
            setIsProcessing(false);
            return;
        }

        const body = new FormData();
        body.append("type", "add_data");
        body.append("table_name", "services");
        body.append("amount", values?.amountPet);
        body.append("cost_type", cost);
        body.append("service_name", value);
        body.append("sub_service", JSON.stringify(servicePet));
        body.append("weight", weightPet);
        body.append("pet_type", pet);
        body.append("service_id", selectedServiceId);
        body.append("pay_type", pay);
        body.append("currency", currency);
        body.append("description", values?.descriptionPet);
        body.append("business_id", businessData ? businessData?.id : selectedBusinessId);
        body.append("business_created", "admin");
        body.append("source", source || "");

        if (additionalServiceName) {
            body.append("additional_service_name", additionalServiceName);
            if (additionalServicePet.length > 0) {
                body.append("additional_subservice_name", JSON.stringify(additionalServicePet));
            }
        }
        // console.log('body', body)
        // return
        await apiRequest({ body })
            .then(async (res) => {
                setIsProcessing(false);
                if (res) {
                    message.success("Service Added Successfully");
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
                    className="flex items-center justify-center w-[36px] h-[36px] bg_primary rounded-3"
                >
                    <ArrowLeft className="text_white" />
                </button>
                <span className="inter_semibold text-xl md:text-2xl text_dark">
                    Create New Service
                </span>
            </div>
            <Form
                form={form}
                layout="verticle"
                onFinish={handleSubmit}
                className="w-full lg:w-[90%] xl:w-[80%] mx-auto bg_white rounded-3 shadow-md p-[1rem] md:p-[2rem]"
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
                                style={{ cursor: "pointer" }}
                                className={`border cursor-pointer rounded-3 gap-1 px-[1rem] py-2 inter_medium text-sm flex justify-center items-center ${pet === item?.value
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
                                className={`border cursor-pointer rounded-3 gap-1 px-[1rem] py-2 inter_medium text-sm flex justify-center items-center ${pay === item?.value
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
                            {businessData ?
                                <Input
                                    value={`${businessData?.name} (${businessData?.address}) ${businessData?.id}`}
                                    readOnly
                                    size="large"
                                /> :
                                <Select
                                    showSearch
                                    style={{
                                        width: "100%",
                                    }}
                                    size="large"
                                    placeholder="Search business store"
                                    allowClear
                                    value={selectedBusinessId}
                                    onChange={(value) => setSelectedBusinessId(value?.split(' ').pop())}
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
                                </Select>}
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
                                // onPopupScroll={handleScroll}
                                size="large"
                                placeholder="Select Service"
                                allowClear
                                onChange={(value) => handleServiceChange(value)}
                            // notFoundContent={loading ? <CircularProgress size={18} /> : null}
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
                            {isServices ? (
                                selectedServiceExists ? (
                                    parsedSubservicesArray?.map((item, i) => (
                                        <div
                                            key={i}
                                            className="flex flex-wrap gap-2 mb-2 items-center w-100"
                                        >
                                            {Object.keys(item?.data).map((key, j) => (
                                                <button
                                                    key={j}
                                                    type="button"
                                                    style={{ cursor: "pointer" }}
                                                    className={`border cursor-pointer rounded-3 gap-1 px-3 py-2 inter_medium text-sm flex justify-center items-center ${servicePet.includes(item?.data[key])
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
                                                navigate("/service-names/create-subservice", { state: { serviceId: selectedServiceId } });
                                            }}
                                            className="bg_primary text_white px-3 py-2 rounded-3 inter_regular"
                                        >
                                            Add Names
                                        </button>
                                    </div>
                                )
                            ) : (
                                <div className="flex items-center w-full">
                                    <span className="text_dark inter_medium">
                                        Please Select your Service name
                                    </span>
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
                        <Form.Item
                            className="w-full mb-0"
                            name="additionalServiceName"
                        >
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
                                        <div key={i}
                                            className="flex flex-wrap gap-2 mb-2 items-center w-100"
                                        >
                                            {item?.data && Object.keys(item?.data)?.map((key, j) => (
                                                <button
                                                    key={j}
                                                    type="button"
                                                    className={`border cursor-pointer rounded-3 mb-2 gap-1 px-3 py-2 inter_medium text-sm flex justify-center items-center ${additionalServicePet.includes(item?.data[key])
                                                        ? "bg-[#F8F2FD] text_primary"
                                                        : "bg_white text_secondary"
                                                        }`}
                                                    onClick={() => toggleAdditionalCategory(item?.data[key])}
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
                                                navigate("/service-names/create-subservice", { state: { serviceId: selectedAdditionalServiceId } });
                                            }}
                                            className="bg_primary text_white px-3 py-2 rounded-3 inter_regular"
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
                        <Form.Item
                            className="w-full mb-0"
                            name="amountPet"
                        // rules={[
                        //     {
                        //         required: true,
                        //         message: "Please enter the amount",
                        //     },
                        // ]}
                        >
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
                                style={{ cursor: "pointer" }}
                                className={`border cursor-pointer rounded-3 gap-1 px-[1rem] py-2 inter_medium text-sm flex justify-center items-center ${currency === item?.title
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
                                style={{ cursor: "pointer" }}
                                className={`border cursor-pointer rounded-3 gap-1 px-[1rem] py-2 inter_medium text-sm flex justify-center items-center ${cost === item?.title
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
                                className={`border cursor-pointer rounded-3 gap-1 px-[1rem] py-2 inter_medium text-sm flex justify-center items-center ${reportedBy === item?.title
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
                            className="flex justify-center bg_primary py-[12px] px-[1rem] rounded-3 items-center button_shadow"
                        >
                            <span className="inter_semibold text-sm text_white">
                                Create Service
                            </span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="flex justify-center bg_primary cursor-not-allowed py-[12px] px-[4rem] rounded-3 items-center button_shadow"
                            disabled
                        >
                            <CircularProgress size={18} className="text_white" />
                        </button>
                    )}
                </div>
            </Form>
        </main >
    );
};

export default CreatePetService;
