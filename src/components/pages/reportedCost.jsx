/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { CircularProgress } from '@mui/material';
import { message } from 'antd';
import React, { useEffect, useState } from 'react';
import { Form, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { StyleSheetManager } from 'styled-components';
import { apiRequest } from '../../api/auth_api';
import ProductTable from '../DataTable/productTable';
import { avatar2 } from '../icons/icon';
import moment from 'moment';

const ReportedCost = () => {
    const [show, setShow] = useState(false);
    const [show3, setShow3] = useState(false);
    const [selectItem, setSelectItem] = useState(null)
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastId, setLastId] = useState(1);
    const [amount, setAmount] = useState(null)
    const [points, setPoints] = useState(null)
    const [lastId2, setLastId2] = useState(0);
    const [loading2, setLoading2] = useState('')
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

    const getLevelDetails = (points) => {
        if (points >= 1500) {
            return { level: "5", levelName: "Legend Status", };
        } else if (points >= 750) {
            return { level: "4", levelName: "Super Hero", };
        } else if (points >= 400) {
            return { level: "3", levelName: "Prime Hero", };
        } else if (points >= 220) {
            return { level: "2", levelName: "Junior Hero", };
        } else if (points >= 100) {
            return { level: "1", levelName: "Rookie Hero", };
        } else {
            return null;
        }
    }

    // useEffect(() => {
    //     if (selectItem && selectItem.services) {
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
                        <img
                            onClick={() => handleImageClick(`${global.IMAGEURL}/${row?.business?.logo}` || avatar2)}
                            alt='' style={{ width: '35px', cursor: 'pointer', borderRadius: '50%', height: '35px', objectFit: 'cover' }} src={`${global.IMAGEURL + '/' + row?.business?.logo}`} />
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
    const handleSubmit2 = async (e) => {
        e.preventDefault();
        setLoading2(true);
        const body2 = new FormData();
        const finalPoints = Number(selectedReport?.user?.points) + Number(points);
        const levelDetails = getLevelDetails(finalPoints);
        const level = levelDetails ? levelDetails.level : null;
        body2.append('type', 'update_data');
        body2.append('table_name', 'users');
        body2.append('user_type', 'customer');
        body2.append('level', level);
        body2.append('points', finalPoints);
        body2.append('id', selectedReport?.user_id);
        await apiRequest({ body: body2 })
            .then(async (res) => {
                setLoading2(false);
                if (res?.result === true) {
                    const body = new FormData();
                    body.append('type', 'update_data');
                    body.append('table_name', 'report_cost');
                    body.append('status', 'accepted');
                    body.append('id', selectedReport?.id);
                    await apiRequest({ body });
                    message.success("Points added successfully");
                    setShow3(false);
                    handleFetchBusiness();
                } else {
                    message.error("Creation failed...");
                    setShow3(false);
                }
            })
            .catch((error) => {
                console.error(error);
                setLoading2(false);
            })
            .finally(() => {
                setLoading2(false);
            });
    };


    const handleUpdate = async (status) => {
        setReportStatus(status);
        setLoading(true);
        if (status === 'accept') {
            setShow3(true)
            setShow(false)
        }
        else {
            try {
                const body = new FormData();
                body.append('type', 'update_data');
                body.append('table_name', 'report_cost');
                body.append('status', 'cancelled');
                body.append('id', selectedReport?.id);
                const res = await apiRequest({ body });
                if (res?.result === true) {
                    handleFetchBusiness();
                    setShow(false);
                } else {
                    message.error('Creation failed...');
                }
            } catch (error) {
                console.error(error);
                message.error(error.message || 'An error occurred');
            } finally {
                setLoading(false);
            }
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
                                        <CircularProgress size={18} className="text_white" />
                                    </button>
                                )}
                            </div>
                        </Form>
                    </Modal.Body>
                </Modal>
                <Modal show={show3} onHide={() => setShow3(false)} centered>
                    <Modal.Header closeButton
                        style={{ borderBottom: 'none' }}>
                    </Modal.Header>
                    <Modal.Body>
                        <Form
                            // form={form}
                            onSubmit={handleSubmit2} >
                            <span className="inter-sm text_dark inter_medium">Enter Points</span>
                            <Form.Group
                                className='mb-2'
                            >
                                <Form.Control
                                    required
                                    type='text'
                                    size='large'
                                    onChange={(e) => setPoints(e.target.value)}
                                />
                            </Form.Group>
                            <div className="flex justify-end w-full my-3">
                                {!loading2 ? (
                                    <button
                                        disabled={loading2}
                                        type="submit"
                                        className="flex justify-center bg_primary py-[12px] px-[1rem] rounded-3 items-center button_shadow">
                                        <span className="inter_semibold text-sm text_white">
                                            Add Points
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
                                // disabled={loading}
                                style={{ backgroundColor: '#06D6A0' }}
                                onClick={() => { handleUpdate('accept') }}
                                className="w-1/2 rounded-lg text_white flex items-center justify-center p-2"
                            >
                                {/* {loading && reportStatus === 'accept' ? <CircularProgress size={20} color='inherit' /> : 'Approve'} */}
                                Approve
                            </button>
                            <button
                                // disabled={loading}
                                style={{ backgroundColor: '#FF6F61' }}
                                onClick={() => { handleUpdate('reject') }}
                                className="w-1/2 rounded-lg text_white flex items-center justify-center p-2"
                            >
                                {loading && reportStatus === 'reject' ? <CircularProgress size={20} color='inherit' /> : 'Reject'}
                            </button>
                        </div>
                    </Modal.Body>
                </Modal>
            </main>
        </StyleSheetManager >
    )
}

export default ReportedCost;