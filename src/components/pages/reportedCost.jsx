/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import Spinner from "../Spinner";
import { message } from 'antd';
import React, { useEffect, useState } from 'react';
import { Form, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { StyleSheetManager } from 'styled-components';
import { apiRequest } from '../../api/auth_api';
import ProductTable from '../DataTable/productTable';
import { avatar2 } from '../icons/icon';
import { FaStore } from 'react-icons/fa';
import moment from 'moment';

const ReportedCost = () => {
    const [show, setShow] = useState(false);
    const [selectItem, setSelectItem] = useState(null)
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastId, setLastId] = useState(1);
    const [amount, setAmount] = useState(null)
    const [lastId2, setLastId2] = useState(0);
    const [reportStatus, setReportStatus] = useState('')
    const [showImagePreview, setShowImagePreview] = useState(false);
    const [selectedImage, setSelectedImage] = useState("");
    const [value, setValue] = useState('')
    const [selectedReport, setSelectedReport] = useState({})
    const [loading, setLoading] = useState(false)
    const [count, setCount] = useState(0);
    const [categories, setCategories] = useState([]);
    const [show2, setShow2] = useState(false);
    const navigate = useNavigate();
    // const [form] = Form.useForm();
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

    // useEffect(() => {
    //     if (selectItem and selectItem.services) {
    //         form.setFieldsValue({
    //             service: selectItem.services
    //         });
    //         setservide(selectItem?.services)
    //     }
    // }, [selectItem]);
    useEffect(() => {
        handleFetchBusiness()
    }, [lastId])

    const handleClick = (row) => {
        setSelectItem(row)
        setShow2(true)
        setShow(false)
    }

    const handleClickReort = (row) => {
        setSelectedReport(row);
        setShow(true);
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
                )
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
                            rel='noreferrer'
                            href={global.IMAGEURL + '/' + row?.file_name}
                        >
                            <span>Report Bill</span>
                        </a>
                    </div>
                )
            }
        },
        {
            name: 'Created At',
            sortable: true,
            minWidth: '250px',
            cell: (row) => {
                return (
                    <p className="flex w-full mb-0 plusJakara_regular items-center">
                        {moment(row?.created_at).format('YYYY-MM-DD')}
                    </p>
                )
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
                            : <>
                                <button
                                    onClick={() => { handleClickReort(row) }}
                                    className="rounded-lg text_white flex items-center justify-center bg_primary p-2">
                                    See Services
                                </button>
                            </>}
                    </div>
                )
            }
        },
    ]

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const body = new FormData();
        body.append("type", "update_data");
        body.append("table_name", "services");
        body.append("amount", amount);
        body.append("id", selectItem?.id);
        await apiRequest({ body })
            .then(async (res) => {
                setLoading(false);
                if (res?.result === true) {
                    const updatedServices = selectedReport?.services?.map(service => {
                        if (service?.id === selectItem?.id) {
                            return {
                                ...service,
                                amount: amount,
                            };
                        }
                        return service;
                    });
                    setSelectedReport({
                        ...selectedReport,
                        services: updatedServices
                    });
                    // console.log(selectedReport);
                    message.success("Amount added successfully");
                    setShow2(false)
                    setShow(true)
                } else {
                    message.error("Creation failed...");
                    setShow2(false)
                }
            })
            .catch((error) => {
                console.error(error);
                setLoading(false);
            })
            .finally(() => {
                setLoading(false);
            });
    };
    // console.log(selectedReport)

    const handleUpdate = async (status) => {
        setReportStatus(status);
        setLoading(true);
        try {
            const body = new FormData();
            body.append('type', 'update_report_cost');
            body.append('id', selectedReport?.id);
            body.append('user_id', selectedReport?.user_id);
            body.append('status', status === 'accept' ? 'accepted' : 'cancelled');
            const res = await apiRequest({ body });
            if (res?.result === true) {
                message.success(`Report ${status === 'accept' ? 'accepted' : 'cancelled'} successfully`);
                handleFetchBusiness();
                setShow(false);
            } else {
                message.error(`${status === 'accept' ? 'Acceptance' : 'Cancellation'} failed...`);
            }
        } catch (error) {
            console.error(error);
            message.error(error.message || 'An error occurred');
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
                    setLastId={setLastId}
                />
                <Modal show={show2} onHide={handleClose2} centered>
                    <Modal.Header closeButton
                        style={{ borderBottom: 'none' }}>
                    </Modal.Header>
                    <Modal.Body>
                        <Form
                            // form={form}
                            onSubmit={handleSubmit} >
                            <span className="inter-sm text_dark inter_medium">Enter Amount</span>
                            <Form.Group
                                className='mb-2'
                            >
                                <Form.Control
                                    required
                                    type='text'
                                    size='large'
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </Form.Group>
                            <div className="flex justify-end w-full my-3">
                                {!loading ? (
                                    <button
                                        disabled={loading}
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
                            style={{ maxHeight: "20rem", objectFit: 'cover' }}
                        />
                    </Modal.Body>
                </Modal>
                <Modal
                    show={show}
                    onHide={() => setShow(false)}
                    centered
                >
                    <Modal.Header closeButton
                        style={{ borderBottom: 'none' }}>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="flex justify-between gap-2 flex-wrap mb-3">
                            {selectedReport?.services?.map((item, i) => (
                                <div
                                    key={i}
                                    className="border no-underline bg_white shadow-sm rounded-lg gap-1 flex flex-col items-start w-full h-auto p-2"
                                >
                                    <div className="flex w-full gap-2 justify-between">
                                        <div className="flex flex-col flex-wrap w-full">
                                            <span style={{ fontSize: '15px' }} className="text_dark plusJakara_bold">
                                                {item?.service_name}
                                            </span>
                                            <span
                                                style={{ fontSize: '13px' }}
                                                className="text_dark w-full plusJakara_regular">
                                                {item && item.sub_service
                                                    ? (() => {
                                                        const parsedSubService = JSON.parse(item?.sub_service || "[]");
                                                        return Array.isArray(parsedSubService)
                                                            ? parsedSubService.map((subService, index) => (
                                                                <React.Fragment key={index}>
                                                                    {index > 0 && ", "}
                                                                    {subService}
                                                                </React.Fragment>
                                                            ))
                                                            : parsedSubService;
                                                    })()
                                                    : ""}
                                            </span>
                                        </div>
                                        <div style={{ minWidth: '100px' }} className="d-flex flex-column w-fit flex-wrap align-items-end">
                                            <span className="text_dark plusJakara_bold">
                                                {item?.amount === '0' ? 'Free' : (item?.amount === '' || item?.amount == null) ? 'To be update' : '$' + item?.amount}
                                            </span>
                                            <span className="text_dark text-sm plusJakara_regular">
                                                {item?.cost_type}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex w-full mt-2 justify-between align-items-end">
                                        <span className="text-sm plusJakara_regular text_dark">
                                            {item?.description}
                                        </span>
                                        <button
                                            style={{ minWidth: '70px', height: '25px' }}
                                            className="bg_primary text-xs h-fit text_white rounded-2"
                                            onClick={() => {
                                                handleClick(item);
                                            }}
                                        >
                                            Edit Price
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div >
                        <div className="flex gap-2 items-center">
                            <button
                                disabled={loading}
                                style={{ backgroundColor: '#06D6A0' }}
                                onClick={() => { handleUpdate('accept') }}
                                className="w-1/2 rounded-lg text_white flex items-center justify-center p-2"
                            >
                                {loading && reportStatus === 'accept' ? <Spinner size={18} color='inherit' /> : 'Approve'}
                            </button>
                            <button
                                disabled={loading}
                                style={{ backgroundColor: '#FF6F61' }}
                                onClick={() => { handleUpdate('reject') }}
                                className="w-1/2 rounded-lg text_white flex items-center justify-center p-2"
                            >
                                {loading && reportStatus === 'reject' ? <Spinner size={18} color='inherit' /> : 'Reject'}
                            </button>
                        </div>
                    </Modal.Body>
                </Modal>
            </main>
        </StyleSheetManager >
    )
}

export default ReportedCost;