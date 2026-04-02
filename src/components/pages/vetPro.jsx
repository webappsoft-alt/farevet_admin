/* eslint-disable jsx-a11y/img-redundant-alt */
/* eslint-disable react-hooks/exhaustive-deps */
import { CircularProgress } from "@mui/material";
import { Form, Input, Modal, message, DatePicker, Row, Col } from "antd";
import React, { useEffect, useState } from "react";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { apiRequest } from "../../api/auth_api";
import ProductTable from "../DataTable/productTable";
import { avatar2, cameradark, edit2, trash } from "../icons/icon";
import dayjs from "dayjs";

const VetPro = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastId, setLastId] = useState(1);
  const [vetPros, setVetPros] = useState([]);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [lastId2, setLastId2] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadselectedFile, setLoadselectedFile] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedVetPro, setSelectedVetPro] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [userEmails, setUserEmails] = useState([]);
  const [fetchingEmails, setFetchingEmails] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [form] = Form.useForm();

  const fetchEmails = async (search = "") => {
    setFetchingEmails(true);
    const body = new FormData();
    body.append("type", "get_data");
    body.append("table_name", "users");
    body.append("search", search);
    try {
      const res = await apiRequest({ body });
      if (res && res.data && Array.isArray(res.data)) {
        setUserEmails(
          res.data
            .filter((user) => user.email)
            .map((user) => ({
              label: String(user.email),
              value: String(user.email),
            })),
        );
      } else {
        setUserEmails([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setFetchingEmails(false);
    }
  };

  useEffect(() => {
    if (modalOpen) {
      fetchEmails("");
      if (!isEditMode) {
        form.setFieldsValue({
          vetPro_startDate: dayjs(),
          vetPro_endDate: dayjs(),
        });
      }
    }
  }, [modalOpen, isEditMode, form]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingLogo(true);
    const updatedFileName = file?.name;
    const body = new FormData();
    body.append("type", "upload_data");
    body.append("file", new Blob([file], { type: file.type }), updatedFileName);

    try {
      const response = await apiRequest({ body });
      const fileURL = URL.createObjectURL(file);
      setSelectedFile({ file_name: response.file_name, fileURL });
      setLoadselectedFile(response.file_name);
    } catch (error) {
      console.error(error);
      message.error("Image upload failed");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  useEffect(() => {
    if (selectedVetPro) {
      form.setFieldsValue({
        vetPro_email: {
          label: selectedVetPro?.vetPro_email,
          value: selectedVetPro?.vetPro_email,
        },
        vetPro_startDate: selectedVetPro?.vetPro_startDate
          ? dayjs(selectedVetPro.vetPro_startDate)
          : null,
        vetPro_endDate: selectedVetPro?.vetPro_endDate
          ? dayjs(selectedVetPro.vetPro_endDate)
          : null,
      });
      setLoadselectedFile(selectedVetPro?.vetPro_logo);
      form.setFieldsValue({
        vetPro_status: {
          label:
            String(selectedVetPro?.vetPro_status) === "1"
              ? "Active"
              : "Inactive",
          value: String(selectedVetPro?.vetPro_status || "1"),
        },
      });
      setIsEditMode(true);
    } else {
      // Form reset is handled by the useEffect above for new mode
    }
  }, [selectedVetPro, form]);

  const handleSubmit = async (values) => {
    setIsProcessing(true);
    const body = new FormData();
    body.append("type", "add_data");
    body.append("table_name", "users");
    body.append(
      "vetPro_email",
      values?.vetPro_email?.value || values?.vetPro_email,
    );
    body.append("vetPro_password", values?.vetPro_password);
    body.append(
      "vetPro_startDate",
      values?.vetPro_startDate
        ? values.vetPro_startDate.format("YYYY-MM-DD")
        : "",
    );
    body.append(
      "vetPro_endDate",
      values?.vetPro_endDate ? values.vetPro_endDate.format("YYYY-MM-DD") : "",
    );
    body.append("vetPro_logo", loadselectedFile);
    body.append(
      "vetPro_status",
      values?.vetPro_status?.value || values?.vetPro_status || "1",
    );
    body.append("widget_code", "1");

    try {
      const res = await apiRequest({ body });
      if (res?.result === true) {
        message.success("Vet Pro Added Successfully");
        form.resetFields();
        handleFetchVetPros();
        setModalOpen(false);
      } else {
        message.error(res?.message || "Creation failed...");
      }
    } catch (error) {
      console.error(error);
      message.error("Something went wrong!");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdate = async (values) => {
    setIsProcessing(true);
    const body = new FormData();
    body.append("type", "update_data");
    body.append("table_name", "users");
    body.append("id", selectedVetPro?.id);
    body.append(
      "vetPro_email",
      values?.vetPro_email?.value || values?.vetPro_email,
    );
    body.append(
      "vetPro_startDate",
      values?.vetPro_startDate
        ? values.vetPro_startDate.format("YYYY-MM-DD")
        : "",
    );
    body.append(
      "vetPro_endDate",
      values?.vetPro_endDate ? values.vetPro_endDate.format("YYYY-MM-DD") : "",
    );
    body.append("vetPro_logo", loadselectedFile);
    body.append(
      "vetPro_status",
      values?.vetPro_status?.value || values?.vetPro_status || "1",
    );
    body.append("widget_code", selectedVetPro?.widget_code || "1");
    if (values?.vetPro_password) {
      body.append("vetPro_password", values.vetPro_password);
    }

    try {
      const res = await apiRequest({ body });
      if (res?.result === true) {
        message.success("Vet Pro Updated Successfully");
        form.resetFields();
        setModalOpen(false);
        handleFetchVetPros();
        setSelectedVetPro(null);
        setIsEditMode(false);
      } else {
        message.error(res?.message || "Update failed...");
      }
    } catch (error) {
      console.error(error);
      message.error("Something went wrong!");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFetchVetPros = async () => {
    setLoading(true);
    try {
      const body = new FormData();
      body.append("type", "get_list");
      body.append("table_name", "users");
      body.append("vetPro_email", "1");
      body.append("page", lastId);
      const res = await apiRequest({ body });
      if (res?.data?.length > 0) {
        setVetPros(res.data);
        const totalCount = res?.count || 0;
        const pageCount = Math.ceil(totalCount / 10);
        setCount(pageCount);
      } else {
        setVetPros([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchVetPros();
  }, [lastId]);

  const handleDelete = async (row) => {
    Modal.confirm({
      title: "Are you sure you want to deactivate this Vet Pro?",
      content: "This will set the subscription status to Inactive.",
      okText: "Yes, Deactivate",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        const body = new FormData();
        body.append("type", "update_data");
        body.append("table_name", "users");
        body.append("id", row?.id);
        body.append("vetPro_status", "0");
        body.append("widget_code", row?.widget_code || "1");
        try {
          const res = await apiRequest({ body });
          if (res?.result === true) {
            message.success("Vet Pro Deactivated Successfully");
            handleFetchVetPros();
          } else {
            message.error(res?.message || "Deactivation failed...");
          }
        } catch (error) {
          console.error(error);
        }
      },
    });
  };

  const columns = [
    {
      name: "Logo",
      sortable: true,
      cell: (row) => {
        return (
          <div className="flex w-full gap-2 items-center">
            <img
              onClick={() =>
                setSelectedImage(`${global.IMAGEURL}/${row?.vetPro_logo}`)
              }
              alt=""
              style={{
                width: "35px",
                cursor: "pointer",
                borderRadius: "50%",
                height: "35px",
                objectFit: "cover",
              }}
              src={`${global.IMAGEURL + "/" + row?.vetPro_logo}`}
              onError={(e) => {
                e.target.src = avatar2;
              }}
            />
          </div>
        );
      },
    },
    {
      name: "Email",
      sortable: true,
      selector: (row) => row?.vetPro_email,
    },
    {
      name: "Start Date",
      sortable: true,
      selector: (row) => row?.vetPro_startDate,
    },
    {
      name: "End Date",
      sortable: true,
      selector: (row) => row?.vetPro_endDate,
    },
    {
      name: "Subscription",
      sortable: true,
      cell: (row) => (
        <span
          className={`px-3 py-1 rounded-full text-xs plusJakara_bold ${
            String(row?.vetPro_status) === "1"
              ? "bg-green-100 text-green-600"
              : "bg-red-100 text-red-600"
          }`}
        >
          {String(row?.vetPro_status) === "1" ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      name: "Action",
      allowoverflow: true,
      cell: (row) => (
        <div className="flex gap-1">
          <button
            className="bg-[#ED5D67] flex justify-center rounded-3 items-center"
            style={{
              width: "24px",
              height: "24px",
              backgroundColor: "#ED5D67",
            }}
            onClick={() => handleDelete(row)}
          >
            <img style={{ width: "14px", height: "auto" }} src={trash} alt="" />
          </button>
          <button
            className="bg-[#54A6FF] flex justify-center rounded-3 items-center"
            style={{
              width: "24px",
              height: "24px",
              backgroundColor: "#54A6FF",
            }}
            onClick={() => {
              setSelectedVetPro(row);
              setModalOpen(true);
            }}
          >
            <img style={{ width: "14px", height: "auto" }} src={edit2} alt="" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div>
        <main
          className="lg:container p-4 mx-auto"
          style={{ minHeight: "90vh" }}
        >
          <div className="flex justify-between mb-4 gap-2 items-center w-full">
            <h4 className="plusJakara_bold mb-0">Vet Pro</h4>
            <button
              onClick={() => {
                setIsEditMode(false);
                setSelectedVetPro(null);
                setLoadselectedFile(null);
                setSelectedFile(null);
                setModalOpen(true);
              }}
              className="bg_primary text_white px-3 py-2 rounded-3 plusJakara_medium"
            >
              Add
            </button>
          </div>
          <div className="mt-3">
            {loading ? (
              <main className="my-5 d-flex w-100 justify-content-center align-items-center">
                <CircularProgress size={24} className="text_dark" />
              </main>
            ) : !vetPros || vetPros.length === 0 ? (
              <main className="my-5 d-flex w-100 justify-content-center align-items-center">
                <span className="text_secondary plusJakara_medium">
                  No Vet Pro Found
                </span>
              </main>
            ) : (
              <ProductTable
                count={count}
                loading={loading}
                setCurrentPage={setLastId2}
                currentPage={lastId2}
                columns={columns}
                data={vetPros}
                setLastId={setLastId}
              />
            )}
          </div>
        </main>
      </div>

      <Modal
        open={modalOpen}
        onCancel={() => {
          if (isProcessing || isUploadingLogo) return;
          setModalOpen(false);
          form.resetFields();
          setIsEditMode(false);
          setSelectedVetPro(null);
          setLoadselectedFile(null);
          setSelectedFile(null);
        }}
        footer={null}
        width={700}
        maskClosable={false}
        closable={!isProcessing && !isUploadingLogo}
        zIndex={9999}
        centered
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={isEditMode ? handleUpdate : handleSubmit}
        >
          <h5 className="plusJakara_medium mb-4 text-[#252C32]">
            {isEditMode ? "Edit Vet Pro" : "Add Vet Pro"}
          </h5>

          <Row gutter={[16, 16]}>
            <Col span={24}>
              <div className="flex gap-3 w-full flex-col justify-start">
                <span className="inter_medium text-sm text_dark w-full">
                  Vet Pro Logo
                </span>
                <div className="w-full">
                  <Form.Item name="vetPro_logo" className="mb-0">
                    <div className="flex items-center gap-6">
                      <label
                        htmlFor="logoInput"
                        className="cursor-pointer relative group"
                      >
                        <div
                          style={{
                            height: "110px",
                            width: "110px",
                            border: "2px dashed #d9d9d9",
                            backgroundColor: "#f5f5f5",
                            borderRadius: "50%",
                          }}
                          className="flex justify-center items-center overflow-hidden hover:border-[#54A6FF] transition-all relative"
                        >
                          {isUploadingLogo ? (
                            <div className="flex flex-col items-center justify-center gap-1">
                              <img
                                src={cameradark}
                                alt="Camera Icon"
                                className="w-5 h-5 opacity-20"
                              />
                              <CircularProgress size={18} color="inherit" />
                            </div>
                          ) : selectedFile || loadselectedFile ? (
                            <>
                              <img
                                src={
                                  selectedFile
                                    ? selectedFile.fileURL
                                    : `${global.IMAGEURL}/${loadselectedFile}`
                                }
                                alt="Vet Pro Logo"
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.target.src = avatar2;
                                }}
                              />
                              {/* Hover Overlay - Only when image exists */}
                              <div className="absolute inset-0 bg-black bg-opacity-30 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] text_white plusJakara_bold">
                                  EDIT
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <img
                                src={cameradark}
                                alt="Camera Icon"
                                className="w-6 h-6 opacity-40"
                              />
                            </div>
                          )}
                        </div>

                        {/* Floating Edit Icon */}
                        {/* <div className="absolute bottom-1 right-1 bg-[#54A6FF] rounded-full p-1 border-2 border-white shadow-sm">
                          <img
                            src={cameradark}
                            alt=""
                            className="w-3 h-3 brightness-200"
                          />
                        </div> */}
                      </label>
                    </div>

                    <Input
                      size="large"
                      type="file"
                      id="logoInput"
                      className="visually-hidden"
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                  </Form.Item>
                </div>
              </div>
            </Col>
          </Row>

          <Row gutter={[16, 16]} className="mt-4">
            <Col xs={24} md={12}>
              <div>
                <span className="plusJakara_medium">Vet Pro Email</span>
                <Form.Item
                  name="vetPro_email"
                  rules={[
                    {
                      required: true,
                      message: "Please select or enter user email",
                    },
                  ]}
                >
                  <CreatableSelect
                    options={userEmails}
                    isLoading={fetchingEmails}
                    placeholder="Select or type Vet Pro Email"
                    classNamePrefix="react-select"
                    isClearable
                    isSearchable
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: "40px",
                        borderRadius: "8px",
                        borderColor: "#d9d9d9",
                      }),
                    }}
                  />
                </Form.Item>
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div>
                <span className="plusJakara_medium">
                  {isEditMode ? "New Password (Optional)" : "Vet Pro Password"}
                </span>
                <Form.Item
                  name="vetPro_password"
                  rules={[
                    {
                      required: !isEditMode,
                      message: "Please enter the password",
                    },
                    {
                      min: 8,
                      message: "Password must be at least 8 characters",
                    },
                  ]}
                >
                  <Input.Password
                    size="large"
                    placeholder={
                      isEditMode
                        ? "Leave blank to keep current"
                        : "Vet Pro Password"
                    }
                    style={{ borderRadius: "8px" }}
                  />
                </Form.Item>
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div>
                <span className="plusJakara_medium">Vet Pro Start Date</span>
                <Form.Item
                  name="vetPro_startDate"
                  rules={[
                    { required: true, message: "Please select start date" },
                  ]}
                >
                  <DatePicker
                    size="large"
                    className="w-full"
                    placeholder="Vet Pro Start Date"
                    style={{ borderRadius: "8px" }}
                  />
                </Form.Item>
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div>
                <span className="plusJakara_medium">Vet Pro End Date</span>
                <Form.Item
                  name="vetPro_endDate"
                  rules={[
                    { required: true, message: "Please select end date" },
                  ]}
                >
                  <DatePicker
                    size="large"
                    className="w-full"
                    placeholder="Vet Pro End Date"
                    style={{ borderRadius: "8px" }}
                  />
                </Form.Item>
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div>
                <span className="plusJakara_medium">Subscription Status</span>
                <Form.Item
                  name="vetPro_status"
                  initialValue={{ label: "Active", value: "1" }}
                  rules={[{ required: true, message: "Please select status" }]}
                >
                  <Select
                    placeholder="Select Status"
                    classNamePrefix="react-select"
                    options={[
                      { label: "Active", value: "1" },
                      { label: "Inactive", value: "0" },
                    ]}
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: "40px",
                        borderRadius: "8px",
                        borderColor: "#d9d9d9",
                      }),
                    }}
                  />
                </Form.Item>
              </div>
            </Col>
          </Row>

          <div className="flex w-full mt-6 justify-end">
            <button
              type="submit"
              disabled={isProcessing || isUploadingLogo}
              className="px-4 py-2 text_white rounded-3 bg_dark plusJakara_medium disabled:opacity-50"
            >
              {isProcessing ? (
                <CircularProgress color="inherit" size={16} />
              ) : isEditMode ? (
                "Update"
              ) : (
                "Add Vet Pro"
              )}
            </button>
          </div>
        </Form>
      </Modal>

      <Modal
        open={showImagePreview}
        onCancel={() => setShowImagePreview(false)}
        centered
        footer={null}
      >
        <img
          src={selectedImage}
          alt="Preview"
          className="w-full"
          style={{ maxHeight: "30rem", objectFit: "contain" }}
        />
      </Modal>
    </>
  );
};

export default VetPro;
