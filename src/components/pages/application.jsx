/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable jsx-a11y/anchor-has-content */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react'
import ProductTable from '../DataTable/productTable';
import { dataTable } from '../DataTable/productsData';
import { application1, archive, avatar2, avatarman, downloadpdf, logofarevet, preview, profileavatar, trash } from '../icons/icon';
import { Link, useNavigate } from 'react-router-dom';
import { StyleSheetManager } from 'styled-components';
import { Form, Input, Select, message } from 'antd';
import { Search } from 'react-feather';
import { Modal } from 'react-bootstrap';
import { apiRequest } from '../../api/auth_api';
import ReactPdfViewer from './reactPdfViewer';
import { CircularProgress } from '@mui/material';
import moment from 'moment';
const { Option } = Select;

const Application = () => {
    const [form] = Form.useForm();
    const [show, setShow] = useState(false);
    const [statusStore, setStatusStore] = useState('')
    const [userData, setUserData] = useState(null)
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastId, setLastId] = useState(1);
    const [lastId2, setLastId2] = useState(0);
    const [loading, setLoading] = useState(false)
    const [loading2, setLoading2] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    const [showDetail, setShowDetail] = useState(false);
    const [count, setCount] = useState(0)
    const [categories, setCategories] = useState([]);
    const [show2, setShow2] = useState(false);
    const navigate = useNavigate();

    const handleClose = () => setShow(false);
    const handleShow = (row) => {
        setUserData(row)
        setShow(true);
    }
    const handleShow2 = (row) => {
        setShow2(true);
        setUserData(row)
    }
    const handleClose2 = () => setShow2(false);
    const handleViewDetail = (row) => {
        setSelectedItem(row)
        setShowDetail(true);
    }

    const handleFetchBusiness = async () => {
        setIsProcessing(true);
        try {
            const body = new FormData();
            body.append("type", "get_list");
            body.append("table_name", 'businesses');
            body.append("business_created", 'user');
            body.append("page", lastId);
            const res = await apiRequest({ body });
            if (res && res.data && res.data.length > 0) {
                setCategories(res?.data);
                const totalCount = res?.count || 0;
                setIsProcessing(false);
                const pageCount = Math.ceil(totalCount / 10)
                setCount(pageCount);
            } else {
                setIsProcessing(false);
                setCategories([]);
            }
        } catch (error) {
            console.error(error);
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        handleFetchBusiness()
    }, [lastId,])

    const columns = [
        {
            name: 'Business/Name',
            sortable: true,
            minwidth: '200px',
            selector: row => row?.name
        },
        {
            name: 'Email',
            sortable: true,
            minwidth: '272px',
            selector: row => row?.user?.email
        },
        {
            name: "Phone",
            sortable: true,
            minwidth: '160px',
            selector: row => row?.user?.phone
        },
        {
            name: 'Address',
            sortable: true,
            minWidth: '250px',
            selector: row => row?.address
        },
        {
            name: 'Licenses',
            sortable: true,
            minWidth: '200px',
            cell: (row) => {
                return (
                    <div className="d-flex w-100">
                        {row?.status === '1' ? (
                            row?.license ? (
                                <button
                                    style={{ color: '#00A3FF' }}
                                    onClick={() => handleViewDetail(row)}
                                    className="flex ms-3 items-center w-fit inter_semibold"
                                >
                                    View detail
                                </button>
                            ) : (
                                <button
                                    style={{ color: '#00A3FF' }}
                                    onClick={() => handleShow2(row)}
                                    className="flex ms-3 items-center w-fit inter_semibold"
                                >
                                    Open
                                </button>
                            )
                        ) : row?.status === '0' ? (
                            <button
                                style={{ color: '#00A3FF' }}
                                onClick={() => handleShow(row)}
                                className="flex ms-3 items-center w-fit inter_semibold"
                            >
                                View
                            </button>
                        ) : <span className="w-fit inter_semibold">No License Available</span>}
                    </div>
                );
            }
        },
        {
            name: 'Created At',
            sortable: true,
            minWidth: '250px',
            cell: (row) => {
                return (
                    <p className="flex w-full mb-0 plusJakara_regular items-center">
                        {moment(row?.timestamp).format('DD-MM-YYYY')}
                    </p>
                )
            }
        },
        {
            name: 'Action',
            allowoverflow: true,
            minWidth: '100px',
            cell: (row) => {
                let buttonColor, buttonText;
                switch (row?.status) {
                    case '0':
                        buttonColor = '#FFA500';
                        buttonText = 'Pending';
                        break;
                    case '1':
                        buttonColor = '#06D6A0';
                        buttonText = 'Approved';
                        break;
                    case '2':
                        buttonColor = '#d15a5a';
                        buttonText = 'Rejected';
                        break;
                    default:
                        buttonColor = '#FFFFFF';
                        buttonText = 'Unknown';
                }
                return (
                    <div className='flex items-center gap-1'>
                        <button
                            disabled
                            style={{ backgroundColor: buttonColor }}
                            className={`text_white flex justify-center rounded-md py-[2px] px-2 items-center`}
                        >
                            {buttonText}
                        </button>
                    </div>
                );
            }
        }

    ]

    const handleSubmit = async (values) => {
        setLoading(true)
        const body = new FormData();
        body.append("type", "update_data");
        body.append("table_name", 'businesses');
        body.append("license", values?.licenseName);
        body.append("license_no", values?.licenseNumber);
        body.append("license_type", values?.licenseType);
        body.append("issued_by", values?.issuedBy);
        body.append('status', userData?.status === '1' ? '1' : statusStore)
        body.append("verified_by_farevet", values?.verifiedByFarevet);
        body.append("id", userData?.id);
        await apiRequest({ body })
            .then(async (res) => {
                setLoading(false)
                if (res?.result === true) {
                    message.success("Licence Created Successfully!");
                    form.resetFields();
                    setShow2(false)
                    handleFetchBusiness()
                } else {
                    message.error("Creation failed...");
                }
            })
            .catch((error) => {
                console.error(error);
                setLoading(false)
            });
    }

    const handleUpdate = async (value) => {
        setStatusStore(value)
        setLoading2(true)
        try {
            const body = new FormData();
            body.append('type', 'update_data');
            body.append('table_name', 'businesses');
            body.append('id', userData?.id)
            body.append('status', value)
            const res = await apiRequest({ body })
            if (res?.result === true) {
                if (value === '1') {
                    setShow2(true)
                } else {
                    message.error('Application Rejected')
                }
                handleFetchBusiness()
                setShow(false)
                setLoading2(false)
            } else {
                console.error("Creation failed...");
                setLoading2(false)
            }
        } catch (error) {
            console.log(error);
            setLoading2(false)
        } finally {
            setLoading2(false)
        }
    }

    return (
        <StyleSheetManager shouldForwardProp={(prop) => !['sortActive'].includes(prop)}>
            <main className='container m-auto height_calc flex-grow flex flex-col p-3'>
                <div className="flex w-full my-4">
                    <span className="text_dark plusJakara_medium text-2xl md:text-3xl">Application</span>
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
                {userData && (
                    <Modal show={show} onHide={handleClose} centered>
                        <Modal.Body>
                            <Form>
                                <div className="flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text_dark text-xl plusJakara_medium">{userData?.user?.name}</span>
                                    </div>
                                </div>
                                <div className='flex flex-col gap-2 mb-3'>
                                    {userData?.user?.license_doc ? (
                                        <>
                                            <ReactPdfViewer pdfSource={global.IMAGEURL + '/' + userData?.user?.license_doc} />
                                            <a target='_blank' href={global.IMAGEURL + '/' + userData?.user?.license_doc}>
                                                <span>Licence Document</span>
                                            </a>
                                        </>
                                    ) : (
                                        <img src={avatar2} alt="" />
                                    )}
                                    <img style={{ height: "15rem", width: '100%' }} src={global.IMAGEURL + '/' + userData?.logo || profileavatar} alt="" />
                                </div>
                                <div className="flex gap-2 items-center">
                                    <button
                                        disabled={loading2}
                                        style={{ backgroundColor: '#06D6A0' }}
                                        onClick={() => { handleUpdate('1') }}
                                        className="w-1/2 rounded-lg text_white flex items-center justify-center p-2"
                                    >
                                        {loading2 && statusStore === '1' ? <CircularProgress size={18} color='inherit' /> : 'Approve'}
                                    </button>
                                    <button
                                        disabled={loading2}
                                        style={{ backgroundColor: '#FF6F61' }}
                                        onClick={() => { handleUpdate('2') }}
                                        className="w-1/2 rounded-lg text_white flex items-center justify-center p-2"
                                    >
                                        {loading2 && statusStore === '2' ? <CircularProgress size={18} color='inherit' /> : 'Reject'}
                                    </button>
                                </div>
                            </Form>
                        </Modal.Body>
                    </Modal>
                )}
                <Modal show={show2} onHide={handleClose2} centered>
                    <Modal.Header closeButton
                        style={{ borderBottom: 'none' }}
                    >
                    </Modal.Header>
                    <Modal.Body>
                        <Form layout='verticle' onFinish={handleSubmit} >
                            <div className="flex w-full mb-2 justify-center">
                                <button type='button' onClick={() => { navigate('/dashboard') }}>
                                    <img src={logofarevet} className='w-[5rem] h-auto' alt="" />
                                </button>
                            </div>
                            <span className="inter-sm text_dark inter_medium">License</span>
                            <Form.Item
                                name='licenseName'
                                className="rounded-lg w-full"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please enter the License',
                                    },
                                ]}
                            >
                                <Input type='text' size='large' />
                            </Form.Item>
                            <span className="inter-sm text_dark inter_medium">License #</span>
                            <Form.Item
                                name='licenseNumber'
                                className="rounded-lg w-full"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please enter the License Number',
                                    },
                                ]}
                            >
                                <Input type='number' size='large' />
                            </Form.Item>
                            <span className="inter-sm text_dark inter_medium">Issued By</span>
                            <Form.Item
                                name='issuedBy'
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
                            <span className="inter-sm text_dark inter_medium">License Type</span>
                            <Form.Item
                                name='licenseType'
                                className="rounded-lg w-full"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please enter the license type',
                                    },
                                ]}
                            >
                                <Input type='text' size='large' />
                            </Form.Item>
                            <span className="inter-sm text_dark inter_medium">Verified by Farevet</span>
                            <Form.Item
                                name='verifiedByFarevet'
                                className="rounded-lg w-full"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please input the field',
                                    },
                                ]}
                            >
                                <Input type='date' size='large' />
                            </Form.Item>
                            <div className="flex mt-3 w-full justify-center">
                                <button
                                    disabled={loading}
                                    type='submit'
                                    className="bg_primary w-full text_white flex justify-center items-center inter_semibold px-[2rem] py-2 rounded-lg"
                                >
                                    {loading ? <CircularProgress size={18} color='inherit' /> : 'Confirm'}
                                </button>
                            </div>
                        </Form>
                    </Modal.Body>
                </Modal>

                <Modal show={showDetail} onHide={() => setShowDetail(false)} centered>
                    <Modal.Header closeButton />
                    <Modal.Body>
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                                <h5 className="text_dark plusJakara_medium">Licence</h5>
                                <span className="text_secondary mb-2 plusJakara_medium">{selectedItem?.license}</span>
                                <h5 className="text_dark plusJakara_medium">Licence No</h5>
                                <span className="text_secondary mb-2 plusJakara_medium">{selectedItem?.license_no}</span>
                                <h5 className="text_dark plusJakara_medium">Issued by</h5>
                                <span className="text_secondary mb-2 plusJakara_medium">{selectedItem?.issued_by}</span>
                                <h5 className="text_dark plusJakara_medium">Licence Type</h5>
                                <span className="text_secondary mb-2 plusJakara_medium">{selectedItem?.license_type}</span>
                                <h5 className="text_dark plusJakara_medium">Verified by farevet</h5>
                                <span className="text_secondary mb-2 plusJakara_medium">{selectedItem?.verified_by_farevet}</span>
                            </div>
                        </div>
                    </Modal.Body>
                </Modal>
            </main>
        </StyleSheetManager>
    )
}

export default Application;