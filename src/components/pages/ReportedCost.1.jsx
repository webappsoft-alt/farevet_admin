/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/jsx-no-target-blank */
import { Form, Input, Select, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { StyleSheetManager } from 'styled-components';
import { apiRequest } from '../../api/auth_api';
import ProductTable from '../DataTable/productTable';
import { avatar2 } from '../icons/icon';
import Spinner from "../Spinner";
import { FaStore } from 'react-icons/fa';

export const ReportedCost = () => {
    const [selectItem, setSelectItem] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastId, setLastId] = useState(1);
    const [lastId2, setLastId2] = useState(0);
    const [reportStatus, setReportStatus] = useState('');
    const [showImagePreview, setShowImagePreview] = useState(false);
    const [selectedImage, setSelectedImage] = useState("");
    const [value, setValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState(0);
    const [categories, setCategories] = useState([]);
    const [show2, setShow2] = useState(false);
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const handleClose2 = () => setShow2(false);

    const handleFetchBusiness = async () => {
        setIsProcessing(true);
        try {
            const body = new FormData();
            body.append("type", "get_list");
            body.append("table_name", 'report_cost');
            body.append("page", lastId);
            const res = await apiRequest({ body });
            if (res && res.data) {
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
        handleFetchBusiness();
    }, [lastId]);

    const handleClick = (row) => {
        setSelectItem(row);
        setShow2(true);
    };

    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
        setShowImagePreview(true);
    };

    const columns = [
        {
            name: 'Business logo',
            sortable: true,
            minWidth: '150px',
            cell: (row) => {
                return (
                    <div className="flex w-full gap-2 items-center">
                        {row?.business?.logo ? (
                            <img
                                onClick={() => handleImageClick(`${global.IMAGEURL}/${row?.business?.logo}`)}
                                alt=''
                                style={{ width: '35px', cursor: 'pointer', borderRadius: '50%', height: '35px', objectFit: 'cover' }}
                                src={`${global.IMAGEURL}/${row?.business?.logo}`}
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                        ) : null}
                        <div
                            className="items-center justify-center bg-gray-100 text-gray-400"
                            style={{ width: '35px', height: '35px', borderRadius: '50%', display: row?.business?.logo ? 'none' : 'flex' }}
                        >
                            <FaStore size={18} />
                        </div>
                    </div>
                );
            },
        },
        {
            name: 'Business/Name',
            sortable: true,
            minWidth: '150px',
            selector: row => row?.business?.name
        },
        {
            name: 'Address',
            sortable: true,
            minWidth: '250px',
            selector: row => row?.business?.address
        },
        // {
        //     name: 'Service Name',
        //     sortable: true,
        //     // minWidth: '202px',
        //     selector: row => row?.service?.service_name
        // },
        // {
        //     name: 'Sub-service Name',
        //     sortable: true,
        //     minWidth: '302px',
        //     cell: (row) => {
        //         if (Array.isArray(row?.service?.sub_service)) {
        //             return row?.service?.sub_service.join(', ').replace(/["']/g, "");
        //         } else if (typeof row?.service?.sub_service === 'string') {
        //             const parsedArray = JSON.parse(row?.service?.sub_service);
        //             return parsedArray.join(', ');
        //         } else {
        //             return row?.service?.sub_service;
        //         }
        //     }
        // },
        // {
        //     name: "Cost Type",
        //     sortable: true,
        //     // minWidth: '200px',
        //     selector: row => row?.service?.cost_type
        // },
        // {
        //     name: 'Pet Type',
        //     sortable: true,
        //     // minWidth: '200px',
        //     selector: row => row?.service?.pet_type
        // },
        // {
        //     name: 'Weight ',
        //     sortable: true,
        //     minWidth: '200px',
        //     selector: row => row?.service?.weight
        // },
        {
            name: 'File',
            sortable: true,
            // minWidth: '200px',
            cell: (row) => {
                return (
                    <div>
                        <a
                            alt=''
                            target='_blank'
                            href={global.IMAGEURL + '/' + row?.file_name}
                        >
                            <span>Report Bill</span>
                        </a>
                    </div>
                );
            }
        },
        {
            name: 'Action',
            sortable: true,
            minWidth: '200px',
            cell: (row) => {
                return (
                    <div className="flex w-full gap-2 items-center">
                        {row?.status !== 'pending' ?
                            <button
                                style={{ backgroundColor: '#f4f4f4' }}
                                disabled
                                className="rounded-3 text_dark flex items-center justify-center p-2">Report {row?.status}</button>
                            :
                            <>
                                <button
                                    style={{ backgroundColor: '#06D6A0' }}
                                    disabled={loading}
                                    onClick={() => { handleUpdate('accept', row); }}
                                    className="w-1/2 rounded-lg text_white flex items-center justify-center p-2">
                                    {loading && reportStatus === 'accept' ? <Spinner size={18} color='inherit' /> : 'Approve'}
                                </button>
                                <button
                                    style={{ backgroundColor: '#FF6F61' }}
                                    disabled={loading}
                                    onClick={() => { handleUpdate('reject', row); }}
                                    className="w-1/2 rounded-lg text_white flex items-center justify-center p-2">
                                    {loading && reportStatus === 'reject' ? <Spinner size={18} color='inherit' /> : 'Decline'}
                                </button>
                            </>}
                    </div>
                );
            }
        },
    ];

    const handleSubmit = async (values) => {
        setIsProcessing(true);
        const body = new FormData();
        body.append("type", "update_data");
        body.append("table_name", "services");
        body.append("amount", values?.amountPet);
        body.append("id", value);
        // body.append("business_created", "admin");
        await apiRequest({ body })
            .then(async (res) => {
                setIsProcessing(false);
                if (res?.result === true) {
                    message.success("Service Added Successfully");
                    setShow2(false);
                    handleFetchBusiness();
                    form.resetFields();
                } else {
                    message.error("Creation failed...");
                    setShow2(false);
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

    const handleUpdate = async (status, business) => {
        setReportStatus(status);
        setLoading(true);
        try {
            const body = new FormData();
            body.append('type', 'update_data');
            body.append('table_name', 'report_cost');
            body.append('status', status === 'accept' ? 'accepted' : "cancelled");
            body.append('id', business?.id);
            const res = await apiRequest({ body });
            if (res?.result === true) {
                if (status === 'accept') {
                    // setShow2(true);
                    handleClick(business);
                }
                handleFetchBusiness();
                setLoading(false);
            } else {
                message.error("Creation failed...");
            }
        } catch (error) {
            setLoading(false);
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <StyleSheetManager shouldForwardProp={(prop) => !['sortActive'].includes(prop)}>
            <main className='container m-auto height_calc flex-grow flex flex-col p-3'>
                <div className="flex w-full mb-4">
                    <span className="text_dark plusJakara_medium text-2xl md:text-3xl">Reported Cost</span>
                </div>
                <ProductTable
                    loading={isProcessing}
                    count={count}
                    setCurrentPage={setLastId2}
                    currentPage={lastId2}
                    columns={columns}
                    data={categories}
                    setLastId={setLastId} />
                <Modal show={show2} onHide={handleClose2} centered>
                    <Modal.Header closeButton
                        style={{ borderBottom: 'none' }}>
                    </Modal.Header>
                    <Modal.Body>
                        <Form
                            form={form}
                            layout='verticle' onFinish={handleSubmit}>
                            <span className="inter-sm text_dark inter_medium">Select Service</span>
                            <Form.Item
                                name='service'
                                className="rounded-lg w-full"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please input the field',
                                    },
                                ]}
                            >
                                <Select
                                    showSearch
                                    style={{
                                        width: '100%',
                                    }}
                                    size='large'
                                    placeholder="Select Service"
                                    allowClear
                                    value={value}
                                    onChange={(value) => setValue(value)}
                                >
                                    {selectItem?.services?.map(item => (
                                        <Select.Option key={item?.id} value={item?.id}>
                                            {item?.service_name}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            <span className="inter-sm text_dark inter_medium">Enter Amount</span>
                            <Form.Item
                                name='amountPet'
                                className="rounded-lg w-full"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please input the field',
                                    },
                                ]}
                            >
                                <Input type='text' size='large' />
                            </Form.Item>
                            <div className="flex justify-end w-full my-3">
                                {!isProcessing ? (
                                    <button
                                        disabled={isProcessing}
                                        type="submit"
                                        className="flex justify-center bg_primary py-[12px] px-[1rem] rounded-3 items-center button_shadow">
                                        <span className="inter_semibold text-sm text_white">
                                            Update Price
                                        </span>
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="flex justify-center bg_primary cursor-not-allowed py-[12px] px-[4rem] rounded-3 items-center button_shadow"
                                        disabled
                                    >
                                        <Spinner size={18} className="text_white" />
                                    </button>
                                )}
                            </div>
                        </Form>
                    </Modal.Body>
                </Modal>

                <Modal
                    show={showImagePreview}
                    onHide={() => setShowImagePreview(false)}
                    centered>
                    <Modal.Header closeButton
                        style={{ borderBottom: 'none' }}>
                    </Modal.Header>
                    <Modal.Body>
                        <img
                            src={selectedImage}
                            alt={selectedImage}
                            className=" w-full"
                            style={{ maxHeight: "20rem", objectFit: 'cover' }} />
                    </Modal.Body>
                </Modal>
            </main>
        </StyleSheetManager>
    );
};
