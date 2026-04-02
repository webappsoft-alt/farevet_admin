/* eslint-disable no-unused-vars */
import { CircularProgress } from "@mui/material";
import { Form, Input, Select, message, Rate } from "antd";
import React, { useEffect, useState } from "react";
import { ArrowLeft } from "react-feather";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../../../api/auth_api";
import { cameradark } from "../../icons/icon";

const coverExistingArray = [
  { title: "Yes", value: "yes" },
  { title: "No", value: "no" },
];

const UpdatePetInsurance = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { state } = useLocation();
  const insuranceData = state?.insuranceDetail || null;
  const [selectedFile, setSelectedFile] = useState(null);
  const [pet, setPet] = useState("dog");
  const [coverExisting, setCoverExisting] = useState("no");
  const [loadselectedFile, setLoadselectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [initialValues, setInitialValues] = useState({
    providerName: insuranceData?.provider_name || "",
    rating: insuranceData?.rating ? parseFloat(insuranceData.rating) : 0,
    // cost: insuranceData?.cost || "",
    highlight: insuranceData?.highlight || "",
    coverage: insuranceData?.coverage || "",
    deductible: insuranceData?.deductible || "",
    ageLimit: insuranceData?.age_limit || "",
    file: insuranceData?.logo || "",
    websiteLink: insuranceData?.website_link || "",
    coverExisting: insuranceData?.cover_existing || "",
    header_text: insuranceData?.header_text || "",
    membership_benefits: insuranceData?.membership_benefits || "",
    pricing_premium: insuranceData?.pricing_premium || "",
    legal_information: insuranceData?.legal_information || "",
    discount_disclaimer: insuranceData?.discount_disclaimer || "",
  });

  useEffect(() => {
    if (insuranceData) {
      setPet(insuranceData?.pet_type || "dog");
    }
  }, [insuranceData]);

  const handleCoverExisting = (title) => {
    setCoverExisting(title);
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
    const body = new FormData();
    body.append("type", "update_data");
    body.append("table_name", "pet_insurance");
    body.append("id", insuranceData?.id);
    body.append(
      "logo",
      loadselectedFile ? loadselectedFile : insuranceData?.logo,
    );
    body.append("rating", values?.rating || "");
    // body.append("cost", values?.cost || "");
    body.append("coverage", values?.coverage || "");
    body.append("deductible", values?.deductible || "");
    body.append("highlight", values?.highlight || "");
    body.append("age_limit", values?.ageLimit || "");
    body.append("cover_existing", values?.coverExisting || "");
    body.append("provider_name", values?.providerName || "");
    body.append("website_link", values?.websiteLink || "");
    body.append("header_text", values?.header_text || "");
    body.append("membership_benefits", values?.membership_benefits || "");
    body.append("pricing_premium", values?.pricing_premium || "");
    body.append("legal_information", values?.legal_information || "");
    body.append("discount_disclaimer", values?.discount_disclaimer || "");

    try {
      const res = await apiRequest({ body });
      if (res) {
        message.success("Pet Insurance Updated Successfully");
        navigate("/pet-insurance");
        form.resetFields();
      } else {
        message.error("Update failed...");
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
            navigate("/pet-insurance");
          }}
          className="flex items-center justify-center w-[36px] h-[36px] bg_primary rounded-lg"
        >
          <ArrowLeft className="text_white" />
        </button>
        <span className="inter_semibold text-xl md:text-2xl text_dark">
          Update Pet Insurance
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
            Provider Name
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            <Form.Item className="w-full mb-0" name="providerName">
              <Input size="large" />
            </Form.Item>
          </div>
        </div>

        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Header Text
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            <Form.Item className="w-full mb-0" name="header_text">
              <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
            </Form.Item>
          </div>
        </div>

        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Website Link
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            <Form.Item className="w-full mb-0" name="websiteLink">
              <Input size="large" />
            </Form.Item>
          </div>
        </div>

        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Upload Logo
          </span>
          <div className="w-full md:w-[70%]">
            <Form.Item name="file" className="rounded-lg w-fit text-center">
              <div>
                <label htmlFor="fileInput" className="cursor-pointer">
                  {selectedFile ? (
                    <img
                      style={{ height: "100px", width: "120px" }}
                      src={selectedFile?.fileURL}
                      alt="Preview"
                      className="rounded-lg object-cover"
                    />
                  ) : insuranceData?.logo ? (
                    <img
                      style={{ height: "100px", width: "120px" }}
                      src={insuranceData?.url + insuranceData.logo}
                      alt="Current Logo"
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
            Rating
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            <Form.Item className="w-full mb-0" name="rating">
              <Rate allowHalf allowClear={false} />
            </Form.Item>
          </div>
        </div>

        {/* <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Cost
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            <Form.Item className="w-full mb-0" name="cost">
              <Input size="large" />
            </Form.Item>
          </div>
        </div> */}
        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Highlight
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            <Form.Item className="w-full mb-0" name="highlight">
              <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
            </Form.Item>
          </div>
        </div>

        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Coverage
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            <Form.Item className="w-full mb-0" name="coverage">
              <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
            </Form.Item>
          </div>
        </div>

        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Deductible
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            <Form.Item className="w-full mb-0" name="deductible">
              <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
            </Form.Item>
          </div>
        </div>

        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Age Limit
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            <Form.Item className="w-full mb-0" name="ageLimit">
              <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
            </Form.Item>
          </div>
        </div>

        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Pre-Existing Conditions
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            <Form.Item className="w-full mb-0" name="coverExisting">
              <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
            </Form.Item>
          </div>
        </div>

        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            FareVet Member Benefits
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            <Form.Item className="w-full mb-0" name="membership_benefits">
              <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
            </Form.Item>
          </div>
        </div>

        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Pricing & Premiums
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            <Form.Item className="w-full mb-0" name="pricing_premium">
              <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
            </Form.Item>
          </div>
        </div>

        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Legal & Underwriting Information
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            <Form.Item className="w-full mb-0" name="legal_information">
              <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
            </Form.Item>
          </div>
        </div>

        <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
          <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
            Discount Disclaimers
          </span>
          <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
            <Form.Item className="w-full mb-0" name="discount_disclaimer">
              <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
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
                Update Pet Insurance
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

export default UpdatePetInsurance;
