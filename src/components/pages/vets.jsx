/* eslint-disable jsx-a11y/img-redundant-alt */
/* eslint-disable react-hooks/exhaustive-deps */
import { CircularProgress } from "@mui/material";
import { Col, Form, Input, Modal, message, Select } from "antd";
import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api/auth_api";
import ProductTable from '../DataTable/productTable';
import { avatar2, cameradark, edit2, trash } from "../icons/icon";

const statusOptions = [
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
];

const Vets = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastId, setLastId] = useState(1);
  const [vets, setVets] = useState([]);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [lastId2, setLastId2] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadselectedFile, setLoadselectedFile] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedVet, setSelectedVet] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form] = Form.useForm();


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

  useEffect(() => {
    if (selectedVet) {
      form.setFieldsValue({
        name: selectedVet?.name,
        file: selectedVet?.image,
        email: selectedVet?.email,
        profession: selectedVet?.profession,
        chat_status: selectedVet?.chat_status,
        video_status: selectedVet?.video_status,
      });
      setIsEditMode(true);
    } else {
      form.resetFields();
      setIsEditMode(false);
    }
  }, [selectedVet, form]);

  const handleSubmit = async (values) => {
    setIsProcessing(true);
    const body = new FormData();
    body.append("type", "add_data");
    body.append("table_name", 'vets');
    body.append("name", values?.name);
    body.append("email", values?.email);
    body.append("password", values?.password);
    body.append("profession", values?.profession);
    body.append("chat_status", values?.chat_status);
    body.append("video_status", values?.video_status);
    body.append("image", loadselectedFile);
    try {
      const res = await apiRequest({ body });
      if (res) {
        message.success("Vet Added Successfully");
        form.resetFields();
        handleFetchVets();
        setModalOpen(false);
      } else {
        message.error("Creation failed...");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImagePreview(true);
  };
  const handleUpdate = async (values) => {
    setIsProcessing(true);
    const body = new FormData();
    body.append("type", "update_data");
    body.append("table_name", 'vets');
    body.append("name", values?.name);
    body.append("email", values?.email);
    body.append("profession", values?.profession);
    body.append("chat_status", values?.chat_status);
    body.append("video_status", values?.video_status);
    body.append("id", selectedVet?.id);
    body.append("image", loadselectedFile ? loadselectedFile : selectedVet?.image);
    try {
      const res = await apiRequest({ body });
      if (res) {
        message.success("Vet Updated Successfully");
        form.resetFields();
        setModalOpen(false);
        handleFetchVets();
        setSelectedVet(null);
        setIsEditMode(false);
      } else {
        message.error("Update failed...");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };


  const checkEmailExists = async (email) => {
    const body = new FormData();
    body.append("type", "check_email");
    body.append("table_name", "vets");
    body.append("email", email);

    try {
      const response = await apiRequest({ body });
      return response;
    } catch (error) {
      console.error("Error checking email:", error);
      throw error;
    }
  };
  const validateEmail = async (_, value) => {
    if (!value) {
      return Promise.reject(new Error('Please enter an email address'));
    }
    try {
      const result = await checkEmailExists(value);
      if (!result.result) {
        return Promise.reject(new Error('This email is already registered'));
      }
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(new Error('Error checking email availability'));
    }
  };


  const handleFetchVets = async () => {
    setLoading(true);
    try {
      const body = new FormData();
      body.append("type", "get_list");
      body.append("table_name", 'vets');
      body.append("page", lastId);
      const res = await apiRequest({ body });
      if (res?.data?.length > 0) {
        setVets(res.data);
        const totalCount = res?.count || 0;
        const pageCount = Math.ceil(totalCount / 10);
        setCount(pageCount);
      } else {
        setVets([])
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchVets();
  }, [lastId]);

  const handleDelete = async (row) => {
    const body = new FormData();
    body.append("type", "delete_data");
    body.append("table_name", 'vets');
    body.append("id", row?.id);
    try {
      const res = await apiRequest({ body });
      if (res) {
        message.success("Vet Deleted Successfully");
        handleFetchVets();
      } else {
        message.error("Deletion failed...");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const columns = [
    {
      name: 'Image',
      sortable: true,
      // minWidth: '200px',
      cell: (row) => {
        return (
          <div className="flex w-full gap-2 items-center">
            <img
              onClick={() => handleImageClick(`${global.IMAGEURL}/${row?.image}` || avatar2)}
              alt='' style={{ width: '35px', cursor: 'pointer', borderRadius: '50%', height: '35px', objectFit: 'cover' }} src={`${global.IMAGEURL + '/' + row?.image}`} />
          </div>
        )
      },
    },
    {
      name: "Name",
      sortable: true,
      selector: (row) => row?.name,
    },
    {
      name: "Email",
      sortable: true,
      selector: (row) => row?.email,
    },
    {
      name: "Profession",
      sortable: true,
      selector: (row) => row?.profession,
    },
    {
      name: "Chat Status",
      sortable: true,
      selector: (row) => row?.chat_status,
    },
    {
      name: "Video Status",
      sortable: true,
      selector: (row) => row?.video_status,
    },
    {
      name: "Action",
      allowoverflow: true,
      cell: (row) => (
        <div className="flex gap-1">
          <button
            className="bg-[#ED5D67] flex justify-center rounded-3 items-center"
            style={{ width: "24px", height: "24px", backgroundColor: "#ED5D67" }}
            onClick={() => handleDelete(row)}
          >
            <img style={{ width: "14px", height: "auto" }} src={trash} alt="" />
          </button>
          <button
            className="bg-[#54A6FF] flex justify-center rounded-3 items-center"
            style={{ width: "24px", height: "24px", backgroundColor: '#54A6FF' }}
            onClick={() => {
              setSelectedVet(row);
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
        <main className="lg:container p-4 mx-auto" style={{ minHeight: '90vh' }}>
          <div className="flex justify-between mb-4 gap-2 items-center w-full">
            <h4 className="plusJakara_bold mb-0">Vets</h4>
            <button onClick={() => setModalOpen(true)} className="bg_primary text_white px-3 py-2 rounded-3 plusJakara_medium">
              Add
            </button>
          </div>
          <div className="mt-3">
            {loading ? (
              <main className="my-5 d-flex w-100 justify-content-center align-items-center">
                <CircularProgress size={24} className="text_dark" />
              </main>
            ) : !vets || vets.length === 0 ? (
              <main className="my-5 d-flex w-100 justify-content-center align-items-center">
                <span className="text_secondary plusJakara_medium">No Vets Found</span>
              </main>
            ) : (
              <ProductTable
                count={count}
                loading={loading}
                setCurrentPage={setLastId2}
                currentPage={lastId2}
                columns={columns}
                data={vets}
                setLastId={setLastId}
              />
            )}
          </div>
        </main>
      </div>

      <Modal
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setIsEditMode(false);
          setSelectedVet(null);
        }}
        footer={null}
        width={900}
        maskClosable={false}
        zIndex={9999}
        centered
      >
        <Form
          className="flex flex-wrap"
          form={form}
          onFinish={isEditMode ? handleUpdate : handleSubmit}
        >
          <Col span={24}>
            <h5 className="plusJakara_medium mb-4 text-[#252C32]">
              {isEditMode ? "Edit Vet" : "Add Vet"}
            </h5>

            <div className="flex gap-3 w-full flex-col justify-start">
              <span className="inter_medium text-sm text_dark w-full">
                Upload Image
              </span>
              <div className='w-full'>
                <Form.Item
                  name='file'
                  className="rounded-lg w-fit text-center"
                  rules={[
                    {
                      required: true,
                      message: 'Please upload a file',
                    },
                  ]}
                >
                  <div>
                    <label htmlFor="fileInput" className="cursor-pointer">
                      {selectedFile ? (
                        <img style={{ height: '100px', width: '120px' }} src={selectedFile?.fileURL} alt="Preview" className="rounded-lg object-cover" />
                      ) : (
                        <div style={{ height: '100px', width: '120px' }} className="border rounded-lg flex justify-center items-center">
                          {selectedVet?.image ? (
                            <img style={{ height: '100px', width: '120px' }} src={`${global.IMAGEURL}/${selectedVet?.image}`} alt="Deal Image" className="rounded-lg object-cover" />
                          ) : (
                            <img src={cameradark} alt="Camera Icon" />
                          )}
                        </div>
                      )}
                    </label>
                    <Input
                      size='large'
                      type="file"
                      id="fileInput"
                      className="visually-hidden"
                      onChange={handleFileChange3}
                    />
                  </div>
                </Form.Item>
              </div>
            </div>
            <div className="flex flex-wrap flex-md-nowrap mb-2 w-full gap-3">
              <div className="w-full">
                <span className="plusJakara_medium">Name</span>
                <Form.Item
                  name="name"
                  rules={[{ required: true, message: "Please enter the name" }]}
                >
                  <Input
                    size="large"
                    className="plusJakara_regular"
                    placeholder="Enter name..."
                  />
                </Form.Item>

              </div>
              <div className="w-full">
                <span className="plusJakara_medium">Profession</span>
                <Form.Item
                  name="profession"
                  rules={[{ required: true, message: "Please enter the profession" }]}
                >
                  <Input
                    size="large"
                    className="plusJakara_regular"
                    placeholder="Enter profession..."
                  />
                </Form.Item>
              </div>
            </div>
            {!isEditMode && <>
              <div className="flex flex-wrap flex-md-nowrap mb-2 w-full gap-3">
                <div className="w-full">
                  <span className="plusJakara_medium">Email</span>
                  <Form.Item
                    name="email"
                    rules={[
                      {
                        required: true,
                        message: "Please enter the Email Address",
                      },
                      {
                        type: "email",
                        message: "Please enter the valid Email Address",
                      },
                      {
                        validator: validateEmail,
                      }
                    ]}
                  >
                    <Input
                      size="large"
                      className="plusJakara_regular"
                      type="email"
                      placeholder="Email address..."
                    />
                  </Form.Item>
                </div>
                <div className="w-full">
                  <span className="plusJakara_medium">Password</span>
                  <Form.Item
                    name="password"
                    rules={[
                      {
                        required: true,
                        message: "Please enter the password",
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      className="plusJakara_regular"
                      type="text"
                      placeholder="Paddword"
                    />
                  </Form.Item>
                </div>
              </div>
            </>}
            <div className="flex flex-wrap flex-md-nowrap mb-2 w-full gap-3">
              <div className="w-full">
                <span className="plusJakara_medium">Chat Status</span>
                <Form.Item
                  name="chat_status"
                  rules={[{ required: true, message: "Please select chat status" }]}
                >
                  <Select
                    options={statusOptions}
                    size="large"
                    placeholder="Select chat status"
                  />
                </Form.Item>
              </div>
              <div className="w-full">
                <span className="plusJakara_medium">Video Status</span>
                <Form.Item
                  name="video_status"
                  rules={[{ required: true, message: "Please select video status" }]}
                >
                  <Select
                    options={statusOptions}
                    size="large"
                    placeholder="Select video status"
                  />
                </Form.Item>
              </div>
            </div>
          </Col>

          <div className="d-flex w-100 mt-4 justify-content-end">
            <button
              type="submit"
              disabled={isProcessing}
              className="px-4 py-2 text_white rounded-3 bg_dark plusJakara_medium"
            >
              {isProcessing ? (
                <CircularProgress color="inherit" size={16} />
              ) : isEditMode ? (
                "Update"
              ) : (
                "Continue"
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
          alt={selectedImage}
          className=" w-full"
          style={{ maxHeight: "20rem", objectFit: 'cover' }}
        />
      </Modal>

    </>
  );
};

export default Vets;