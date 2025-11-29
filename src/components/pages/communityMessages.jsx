/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { CircularProgress } from "@mui/material";
import { Col, Form, Input, Modal, message, Avatar, Radio, Space, Checkbox, Tooltip } from "antd";
import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api/auth_api";
import ProductTable from '../DataTable/productTable';
import { edit2, trash, plus, cameradark, avatar2 } from "../icons/icon";
import { IoCloseCircle } from "react-icons/io5";

const CommunityMessages = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false);
  const [lastId, setLastId] = useState(1);
  const [categories, setCategories] = useState([]);
  const [lastId2, setLastId2] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [selectedItem2, setselectedItem2] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loadselectedFile, setLoadselectedFile] = useState(null);
  const [selectionType, setSelectionType] = useState('radio');
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [form] = Form.useForm();
  const [answersModalOpen, setAnswersModalOpen] = useState(false);
  const [currentAnswers, setCurrentAnswers] = useState([]);

  useEffect(() => {
    if (selectedItem2) {
      form.setFieldsValue({
        title: selectedItem2?.title,
        description: selectedItem2?.description,
        question: selectedItem2?.question || '',
        image: selectedItem2?.image,
        selection_type: selectedItem2?.selection_type || 'radio',
        options: (JSON.parse(selectedItem2?.options).length > 0 ? JSON.parse(selectedItem2?.options) : ['', '']),
        button_title: selectedItem2?.button_title,
        link: selectedItem2?.link,
      });
      setLoadselectedFile(selectedItem2?.image)
      setSelectionType(selectedItem2?.selection_type || 'radio');
    } else {
      form.setFieldsValue({
        title: '',
        description: '',
        image: '',
        selection_type: 'radio',
        options: ['', ''],
        button_title: '',
        link: '',
      });
      setSelectionType('radio');
      setselectedItem2(null);
    }
  }, [selectedItem2, form]);

  useEffect(() => {
    if (selectedFile) {
      setLoadselectedFile(selectedFile?.file_name);
    }
  }, [selectedFile]);

  const handleSubmit = async (values) => {
    setIsProcessing(true);
    const body = new FormData();
    body.append("type", selectedItem2 ? "update_data" : "add_data");
    body.append("table_name", 'community_message');
    body.append("title", values?.title);
    body.append("description", values?.description);
    body.append("question", values?.question || '');
    body.append("image", loadselectedFile ? loadselectedFile : selectedItem2?.image);
    body.append("selection_type", values?.selection_type);
    body.append("options", JSON.stringify(values?.options.filter(option => option !== '')));
    body.append("button_title", values?.button_title);
    body.append("link", values?.link)
    if (selectedItem2) {
      body.append("id", selectedItem2?.id);
    }
    try {
      const res = await apiRequest({ body });
      if (res) {
        message.success(`Question ${selectedItem2 ? 'updated' : 'added'} successfully`);
        form.resetFields();
        handleFetchMessages();
        setselectedItem2(null)
        setLoadselectedFile(null)
        setSelectedFile(null)
        setModalOpen(false);
      } else {
        message.error("Operation failed...");
      }
    } catch (error) {
      console.error(error);
      message.error("Operation failed...");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePinMessage = async () => {
    setIsProcessing(true);
    const body = new FormData();
    body.append("type", "update_data");
    body.append("table_name", 'community_message');
    body.append("id", selectedMessage?.id);
    body.append("pin_message", selectedMessage?.pin_message === "1" ? "0" : "1");

    try {
      const res = await apiRequest({ body });
      if (res) {
        message.success(`Question ${selectedMessage?.pin_message === "1" ? "unpinned" : "pinned"} successfully`);
        handleFetchMessages();
      } else {
        message.error("Operation failed...");
      }
    } catch (error) {
      console.error(error);
      message.error("Operation failed...");
    } finally {
      setIsProcessing(false);
      setConfirmModal(false);
      setSelectedMessage(null);
    }
  };

  const handleClick2 = (row) => {
    setselectedItem2(row);
    setModalOpen(true);
  };

  const handleViewAnswers = (row) => {
    setCurrentAnswers(row?.answers || []);
    setAnswersModalOpen(true);
  };

  const handleFetchMessages = async () => {
    setIsProcessing(true);
    try {
      const body = new FormData();
      body.append("type", "get_list");
      body.append("table_name", 'community_message');
      body.append("page", lastId);
      const res = await apiRequest({ body });
      if (res && res.data && res.data.length > 0) {
        setCategories(res?.data);
        const totalCount = res?.count || 0;
        const pageCount = Math.ceil(totalCount / 10);
        setCount(pageCount);
      }
      setIsProcessing(false);
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    handleFetchMessages();
  }, [lastId]);

  const handleDelete = async (row) => {
    const body = new FormData();
    body.append("type", "delete_data");
    body.append("table_name", 'community_message');
    body.append("id", row?.id);
    await apiRequest({ body })
      .then(async (res) => {
        if (res) {
          message.success("Question deleted successfully");
          form.resetFields();
          setModalOpen(false);
          handleFetchMessages();
          setselectedItem2(null);
        } else {
          message.error("Operation failed...");
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleSelectionTypeChange = (e) => {
    const type = e.target.value;
    setSelectionType(type);
    form.setFieldsValue({
      options: ['', '']
    });
  }
  const isPinnedMessageExists = categories.some(msg => msg.pin_message === "1");

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

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImagePreview(true);
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
              alt='' style={{ width: '35px', cursor: 'pointer', borderRadius: '50%', height: '35px', objectFit: 'cover' }} src={`${(global.IMAGEURL + '/' + row?.image) || avatar2}`} />
          </div>
        )
      },
    },
    {
      name: "Title",
      sortable: true,
      cell: (row) => (
        <div className="flex gap-2">
          <span className="plusJakara_medium">{row?.title || 'N/A'}</span>
        </div>
      ),
    },
    {
      name: "Description",
      minWidth: '350px',
      maxWidth: '400px',
      sortable: true,
      cell: (row) => (
        <div className="flex py-2 gap-2">
          <span className="plusJakara_regular">{row?.description || 'N/A'}</span>
        </div>
      ),
    },
    {
      name: "Question",
      sortable: true,
      cell: (row) => (
        <div className="flex gap-2">
          <span className="plusJakara_regular">{row?.question || 'N/A'}</span>
        </div>
      ),
    },
    {
      name: "Options",
      sortable: true,
      cell: (row) => (
        <div className="flex gap-2">
          <span className="plusJakara_regular">
            {(JSON.parse(row.options).length > 0)
              ? JSON.parse(row.options)?.join(', ')
              : 'N/A'}
          </span>
        </div>
      ),
    },
    {
      name: "Selection Type",
      sortable: true,
      cell: (row) => (
        <div className="flex gap-2">
          <span className="plusJakara_medium">{row?.selection_type || 'N/A'}</span>
        </div>
      ),
    },
    {
      name: "Answers",
      minWidth: '150px',
      maxWidth: '180px',
      sortable: false,
      cell: (row) => (
        <div className="flex gap-2">
          <button
            style={{
              backgroundColor: "#54A6FF"
            }}
            onClick={() => handleViewAnswers(row)}
            className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm plusJakara_medium"
          >
            {row?.answers?.length || 0} Answers
          </button>
        </div>
      ),
    },
    {
      name: "Action",
      allowoverflow: true,
      noSort: true,
      minwidth: "160px",
      cell: (row) => {
        return (
          <div className="flex gap-1">
            <button
              style={{
                width: "24px",
                height: "24px",
                backgroundColor: "#ED5D67",
              }}
              onClick={() => handleDelete(row)}
              className="bg-[#ED5D67] flex justify-center rounded-3 items-center"
            >
              <img
                style={{ width: "14px", height: "auto" }}
                src={trash}
                alt=""
              />
            </button>
            <button
              style={{
                width: "24px",
                height: "24px",
                backgroundColor: "#54A6FF",
              }}
              onClick={() => handleClick2(row)}
              className="bg-[#54A6FF] flex justify-center rounded-3 items-center"
            >
              <img
                style={{ width: "14px", height: "auto" }}
                src={edit2}
                alt=""
              />
            </button>
            <Tooltip title="This message will show in the app">
              <button
                style={{
                  width: "24px",
                  height: "24px",
                  backgroundColor: row?.pin_message === "1" ? "#4CAF50" : "#9E9E9E",
                }}
                onClick={() => {
                  setSelectedMessage(row);
                  setConfirmModal(true);
                }}
                className="flex justify-center rounded-3 items-center"
              >
                <span className="text-white text-sm">📌</span>
              </button>
            </Tooltip>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div>
        <main className="lg:container p-4 mx-auto" style={{ minHeight: '90vh' }}>
          <div className="flex justify-between mb-4 gap-2 items-center w-full">
            <div className="flex flex-col w-full">
              <h4 className="plusJakara_bold">Community Question</h4>
              <p className="plusJakara_regular">The last Question created will automatically be displayed as the pinned Question in the community for all members.</p>
            </div>
            <button onClick={() => setModalOpen(true)} className="bg_primary text_white px-3 py-2 rounded-3 plusJakara_medium">Add</button>
          </div>
          <div className="mt-3">
            {loading ? (
              <main className="my-5 d-flex w-100 justify-content-center align-items-center">
                <CircularProgress size={24} className="text_dark" />
              </main>
            ) : !categories || categories.length === 0 ? (
              <main className="my-5 d-flex w-100 justify-content-center align-items-center">
                <span className="text_secondary plusJakara_medium">
                  No Question Found
                </span>
              </main>
            ) : (
              <ProductTable
                count={count}
                loading={loading}
                setCurrentPage={setLastId2}
                currentPage={lastId2}
                columns={columns}
                data={categories}
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
          setselectedItem2(null);
        }}
        footer={null}
        maskClosable={false}
        centered
        style={{
          maxHeight: "80vh",
          overflow: 'auto'
        }}
        zIndex={9999}
        width={800}
      >
        <Form
          className="flex flex-wrap"
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Col span={24} className="mt-4">
            <h5 className="plusJakara_medium mb-3 text-[#252C32]">
              {selectedItem2 ? "Edit Question" : "Add Question"}{" "}
            </h5>

            <div className='w-full md:w-[70%]'>
              <Form.Item
                name='image'
                className="rounded-lg w-fit text-center"
              // rules={[
              //   {
              //     required: true,
              //     message: "Please Upload Logo",
              //   },
              // ]}
              >
                <div>
                  <label htmlFor="fileInput" className="cursor-pointer">
                    {selectedFile ? (
                      <img style={{ height: '100px', width: '120px' }} src={selectedFile?.fileURL} alt="Preview" className="rounded-lg object-cover" />
                    ) : selectedItem2?.image ? (
                      <img style={{ height: '100px', width: '120px' }} src={selectedItem2?.url + selectedItem2.image} alt="Current Logo" className="rounded-lg object-cover" />
                    ) : (
                      <div style={{ height: '100px', width: '120px' }} className="border rounded-lg flex justify-center items-center">
                        <img src={cameradark} alt="Camera Icon" />
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
            <Form.Item
              name="title"
              label={<h6 className="plusJakara_medium mb-0">Title</h6>}
              rules={[
                {
                  required: true,
                  message: "Please enter the title",
                },
              ]}
            >
              <Input
                size="large"
                className="plusJakara_regular"
                placeholder="Enter title..."
              />
            </Form.Item>

            <Form.Item
              name="description"
              label={<h6 className="plusJakara_medium mb-0">Description</h6>}
              rules={[
                {
                  required: true,
                  message: "Please enter the description",
                },
              ]}
            >
              <Input.TextArea
                rows={4}
                size="large"
                className="plusJakara_regular"
                placeholder="Enter description..."
              />
            </Form.Item>

            <Form.Item
              name="selection_type"
              className="mb-2"
              label={<h6 className="plusJakara_medium mb-0">Selection Type</h6>}
              rules={[
                {
                  required: true,
                  message: "Please select a selection type",
                },
              ]}
            >
              <Radio.Group onChange={handleSelectionTypeChange}>
                <Radio value="radio">Radio</Radio>
                <Radio value="dropdown">Dropdown</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item
              name="question"
              className="mb-2"
              label={<h6 className="plusJakara_medium mb-0">Question</h6>}
            // rules={[
            //   {
            //     required: true,
            //     message: "Please enter the question",
            //   },
            // ]}
            >
              <Input
                size="large"
                className="plusJakara_regular"
                placeholder="Enter question..."
              />
            </Form.Item>
            <Form.Item
              label={<h6 className="plusJakara_medium mb-0">Options</h6>}
              // required
              className="mb-2 w-full"
            >
              <Form.List name="options">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field, index) => (
                      <div key={field.key} className="flex items-start relative w-full mb-2">
                        <Form.Item
                          {...field}
                          // rules={[
                          //   {
                          //     required: true,
                          //     message: "Please enter an option",
                          //   },
                          // ]}
                          className="mb-0 flex-1 w-full"
                        >
                          <Input
                            size="large"
                            placeholder={`Option ${index + 1}`}
                            className="plusJakara_regular relative mt-1 w-full"
                          />
                        </Form.Item>

                        {fields.length > 2 && (
                          <button
                            type="button"
                            onClick={() => remove(field.name)}
                            className="text-red-500"
                            style={{ color: "red", position: 'absolute', right: -10 }}
                          >
                            <IoCloseCircle size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                    {selectionType !== 'radio' &&
                      <button
                        type="button"
                        onClick={() => add()}
                        className="mt-2 bg_primary text_white rounded-3 text-sm px-2 py-1 plusJakara_medium flex items-center"
                      >
                        <span className="mr-1">+</span> Add Option
                      </button>}
                  </>
                )}
              </Form.List>
            </Form.Item>

            <Form.Item
              name="button_title"
              label={<h6 className="plusJakara_medium mb-0">Button Title</h6>}
              rules={[
                {
                  required: true,
                  message: "Please enter the button title",
                },
              ]}
            >
              <Input
                size="large"
                className="plusJakara_regular"
                placeholder="Enter button title..."
              />
            </Form.Item>

            {/* URL Field */}
            <Form.Item
              name="link"
              label={<h6 className="plusJakara_medium mb-0">URL</h6>}
              rules={[
                {
                  required: true,
                  message: "Please enter the URL",
                },
              ]}
            >
              <Input
                size="large"
                className="plusJakara_regular"
                placeholder="Enter URL..."
              />
            </Form.Item>
          </Col>

          {/* Submit Button */}
          <div className="flex w-full mt-4 justify-end">
            <button
              type="submit"
              disabled={isProcessing}
              className="px-4 py-2 text_white rounded-3 bg_dark plusJakara_medium"
            >
              {isProcessing ? <CircularProgress color="inherit" size={16} /> : "Continue"}
            </button>
          </div>
        </Form>
      </Modal>

      {/* Pin Confirmation Modal */}
      <Modal
        open={confirmModal}
        onCancel={() => {
          setConfirmModal(false);
          setSelectedMessage(null);
        }}
        footer={null}
        maskClosable={false}
        centered
      >
        <div className="p-4">
          <h5 className="plusJakara_medium mb-3 text-[#252C32]">
            Confirm Action
          </h5>
          <p className="plusJakara_regular mb-4">
            Are you sure you want to {selectedMessage?.pin_message === "1" ? "unpin" : "pin"} this Question?
            {selectedMessage?.pin_message === "1"
              ? " This will remove the Question from being displayed in the app."
              : " This community message will show in the app."}
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setConfirmModal(false);
                setSelectedMessage(null);
              }}
              className="px-4 py-2 text_dark rounded-3 border plusJakara_medium"
            >
              Cancel
            </button>
            <button
              onClick={handlePinMessage}
              disabled={isProcessing}
              className="px-4 py-2 text_white rounded-3 bg_primary plusJakara_medium"
            >
              {isProcessing ? <CircularProgress color="inherit" size={16} /> : "Yes"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Answers Modal */}
      <Modal
        open={answersModalOpen}
        onCancel={() => setAnswersModalOpen(false)}
        footer={null}
        maskClosable={false}
        centered
        width={600}
        title={
          <div className="text-center">
            <h4 className="plusJakara_bold text-lg text-[#252C32] mb-1">Community Answers</h4>
            <p className="plusJakara_regular text-sm text-gray-500">
              {currentAnswers.length} {currentAnswers.length === 1 ? 'response' : 'responses'} to this Question
            </p>
          </div>
        }
      >
        <div className="max-h-96 overflow-y-auto p-2">
          {currentAnswers.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <p className="text-gray-500 plusJakara_medium">No answers available</p>
            </div>
          ) : (
            currentAnswers.map((answer, index) => (
              <React.Fragment key={answer.id}>
                <div className={`rounded-lg flex flex-col gap-2 w-full ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={answer.user?.image ? `${answer.url}${answer.user.image}` : null}
                      size={40}
                      className="mr-3"
                    >
                      {!answer.user?.image && answer.user?.name ? answer.user.name.charAt(0) : 'U'}
                    </Avatar>
                    <div className="flex flex-col gap-2">
                      <h5 className="plusJakara_medium text-[#252C32] m-0">{answer.user?.name || 'Anonymous'}</h5>
                      <p className="text-xs text-gray-500 m-0">
                        {new Date(answer.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="ps-4">
                    <p className="plusJakara_regular text-gray-700">{answer.answer}</p>
                  </div>
                </div>
                <hr className="mt-0" style={{ color: "#ccc" }} />
              </React.Fragment>
            ))
          )}
        </div>
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

export default CommunityMessages;