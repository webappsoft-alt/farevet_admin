/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import Spinner from "../Spinner";
import { Col, Form, Input, Modal, message } from "antd";
import React, { useEffect, useState } from "react";
import Select from "react-select";
import { apiRequest } from "../../api/auth_api";
import ProductTable from '../DataTable/productTable';
import { edit2, trash } from "../icons/icon";

const pagesOptions = [
  { value: "Dashboard", label: "Dashboard" },
  { value: "Individual Users", label: "Individual Users" },
  { value: "Vets", label: "Vets" },
  { value: "Services List", label: "Services List" },
  { value: "Services", label: "Services" },
  { value: "Business", label: "Business" },
  { value: "Claim Business", label: "Claim Business" },
  { value: "Reported Cost", label: "Reported Cost" },
  { value: "Sub Admin", label: "Sub Admin" },
  { value: "Application", label: "Application" },
  { value: "Appointments", label: "Appointments" },
  { value: "Deals", label: "Deals" },
  { value: "Pet Insurance", label: "Pet Insurance" },
  { value: "Charity", label: "Charity" },
  { value: "Financing", label: "Financing" },
  { value: "Clinics", label: "Clinics" },
  { value: "Community", label: "Community" },
  { value: "Community Messages", label: "Community Messages" },
  { value: "Emergency", label: "Emergency" },
  { value: "Quotes", label: "Quotes" },
  { value: "Fund Campaign", label: "Fund Campaign" },
  { value: "Services Budget", label: "Services Budget" },
  { value: "Customer Support", label: "Customer Support" },
  { value: "Chat", label: "Chat" },
  { value: "Change Password", label: "Change Password" }
];
const SubAdmin = () => {
  // states-------
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessing2, setIsProcessing2] = useState(false);
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false);
  const [lastId, setLastId] = useState(1);
  const [categories, setCategories] = useState([1, 2, 3]);
  const [lastId2, setLastId2] = useState(0);
  const [selectPages, setselectPages] = useState([]);
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem2, setselectedItem2] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form] = Form.useForm();

  const handleChange = (selectedOption) => {
    setselectPages(selectedOption);
  };

  useEffect(() => {
    if (selectedItem2) {
      const parsedPages = selectedItem2.pages ? JSON.parse(selectedItem2.pages) : [];
      const formattedPages = parsedPages.map(page => ({ value: page, label: page }));
      setselectPages(formattedPages);
      form.setFieldsValue({
        email: selectedItem2?.email,
      });
      setIsEditMode(true);
    } else {
      form.setFieldsValue({
        email: '',
        password: '',
        pages: [],
      })
      setIsEditMode(false);
    }
  }, [selectedItem2, form]);

  console.log(selectedItem2);

  const getFilteredOptions = () => {
    const selectedValues = selectPages.map(option => option.value);
    return pagesOptions.filter(option => !selectedValues.includes(option.value));
  };

  const handleSubmit = async (value) => {
    setIsProcessing(true)
    const body = new FormData();
    body.append("type", "add_data");
    body.append("table_name", 'admin');
    body.append("admin_type", 'sub_admin');
    body.append("email", value?.email);
    body.append("password", value?.password);
    body.append("pages", JSON.stringify(selectPages?.map(item => item?.label)));
    console.log({ body });
    // return
    await apiRequest({ body })
      .then(async (res) => {
        setIsProcessing(false)
        if (res) {
          message.success("Sub-admin Added Successfully");
          form.resetFields();
          handleFetchAdmin()
          setModalOpen(false)
        } else {
          message.error("Creation failed...");
        }
      })
      .catch((error) => {
        setIsProcessing(false)
      })
      .finally(() => {
        setIsProcessing(false)
      });
  }

  const handleSubmit2 = async (value) => {
    setIsProcessing(true)
    const body = new FormData();
    body.append("type", "update_data");
    body.append("table_name", 'admin');
    body.append("admin_type", 'sub_admin');
    body.append("email", value?.email);
    // body.append("password", value?.password);
    body.append("pages", JSON.stringify(selectPages?.map(item => item?.label)));
    body.append("id", selectedItem2?.id);
    console.log({ body });
    await apiRequest({ body })
      .then(async (res) => {
        setIsProcessing(false)
        if (res) {
          message.success("Sub-admin update Successfully");
          form.resetFields();
          setModalOpen(false)
          handleFetchAdmin()
          setselectPages([])
          setIsEditMode(false)
          setselectedItem2(null)
        } else {
          message.error("Creation failed...");
        }
      })
      .catch((error) => {
        setIsProcessing(false)
      })
      .finally(() => {
        setIsProcessing(false)
      });
  }

  const handleClick2 = (row) => {
    setselectedItem2(row);
    setModalOpen(true)
  };

  const handleFetchAdmin = async () => {
    setIsProcessing(true);
    try {
      const body = new FormData();
      body.append("type", "get_list");
      body.append("table_name", 'admin');
      // body.append("user_type", 'individual');
      body.append("page", lastId);
      const res = await apiRequest({ body });
      if (res && res.data && res.data.length > 0) {
        const subAdminUsers = res?.data?.filter((user) => user.admin_type === "sub_admin");
        setCategories(subAdminUsers);
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
    handleFetchAdmin()
  }, [lastId,])

  const handleDelete = async (row) => {
    const body = new FormData();
    body.append("type", "delete_data");
    body.append("table_name", 'admin');
    body.append("admin_type", 'sub_admin');
    body.append("id", row?.id);
    console.log({ body });
    await apiRequest({ body })
      .then(async (res) => {
        if (res) {
          message.success("Sub-admin update Successfully");
          form.setFieldsValue({
            email: '',
            password: '',
            pages: [],
          })
          setModalOpen(false)
          handleFetchAdmin()
          setselectPages([])
          setIsEditMode(false)
          setselectedItem2(null)
        } else {
          message.error("Creation failed...");
        }
      })
      .catch((error) => {
        console.log(error);
      })
  };

  const columns = [
    {
      name: "Email",
      sortable: true,
      selector: (row) => row?.email || 'example@example.com',
    },
    {
      name: "Pages",
      allowoverflow: true,
      noSort: true,
      minwidth: "200px",
      cell: (row) => {
        return (
          <div className="flex plusJakara_semibold gap-1">
            {JSON.parse(row.pages || '[]').join(', ') || 'No found'}
          </div>
        );
      },
    },
    {
      name: "Action",
      allowoverflow: true,
      noSort: true,
      minwidth: "112px",
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
          </div>
        );
      },
    },
    // {
    //   name: "Status",
    //   allowoverflow: true,
    //   cell: (row) => {
    //     return (
    //       <div className="flex gap-1">
    //         {
    //           <button
    //             style={{
    //               backgroundColor:
    //                 row?.status === "active" ? "#d15a5a" : "#06D6A0",
    //             }}
    //             disabled={loadingstatus}
    //             onClick={() => handleUpdate2(row)}
    //             className={`text_white flex justify-center rounded-2 py-1 px-2 items-center relative`}
    //           >
    //             {statusId === row?._id && loadingstatus ? (
    //               <Spinner size={15} color="inherit" />
    //             ) : row.status === "active" ? (
    //               "Deactivate now"
    //             ) : (
    //               "Activate now"
    //             )}
    //           </button>
    //         }
    //       </div>
    //     );
    //   },
    // },
  ];

  return (
    <>
      <div>
        <main className="lg:container p-4 mx-auto" style={{ minHeight: '90vh' }}>
          <div className="flex justify-between mb-4 gap-2 items-center w-full">
            <h4 className="plusJakara_bold mb-0">Sub-Admins</h4>
            <button onClick={() => setModalOpen(true)} className="bg_primary text_white px-3 py-2 rounded-3 plusJakara_medium">Add</button>
          </div>
          <div className="mt-3 ">
            {loading ? (
              <main className="my-5 d-flex w-100 justify-content-center align-items-center">
                <Spinner size={24} className="text_dark" />
              </main>
            ) : !categories || categories.length === 0 ? (
              <main className="my-5 d-flex w-100 justify-content-center align-items-center">
                <span className="text_secondary plusJakara_medium">
                  No Category Found
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
          setModalOpen(false)
          form.setFieldsValue({
            email: '',
            password: '',
            pages: [],
          })
          setIsEditMode(false)
          setselectPages([])
        }}
        footer={null}
        maskClosable={false}
        centered
      >
        <Form
          className="flex flex-wrap"
          form={form}
          initialValues={{
            email: selectedItem2?.email,
          }}
          onFinish={isEditMode ? handleSubmit2 : handleSubmit}
        >
          <Col span={24} className="mt-">
            <h5 className="plusJakara_medium mb-3 text-[#252C32]">
              {isEditMode ? "Edit Sub-Admin" : "Add Sub-Admin"}{" "}
            </h5>
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
              ]}
            >
              <Input
                size="large"
                className="plusJakara_regular"
                type="email"
                placeholder="Email address..."
              />
            </Form.Item>
            {!isEditMode && <>
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
            </>}
            <span className="plusJakara_medium">Select Pages</span>
            <Select
              options={pagesOptions}
              value={selectPages}
              isMulti
              onChange={handleChange}
            />
          </Col>
          <div className="d-flex w-100 mt-4 justify-content-end">
            <button
              type="submit"
              disabled={isProcessing || isProcessing2}
              className="px-4 py-2 text_white rounded-3 bg_dark plusJakara_medium"
            >
              {isEditMode ? (
                isProcessing2 ? (
                  <Spinner color="inherit" size={16} />
                ) : (
                  "Update"
                )
              ) : isProcessing ? (
                <Spinner color="inherit" size={16} />
              ) : (
                "Continue"
              )}
            </button>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default SubAdmin;
