/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import Spinner from "../Spinner";
import { Form, Input, Select, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { StyleSheetManager } from 'styled-components';
import { apiRequest } from '../../api/auth_api';
import ProductTable from '../DataTable/productTable';
import { avatar2, logofarevet } from '../icons/icon';
import { FaStore } from 'react-icons/fa';
import moment from 'moment';
const { Option } = Select;

const ClaimBusiness = () => {
    const [form] = Form.useForm();
    const [userData, setUserData] = useState(null)
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastId, setLastId] = useState(1);
    const [lastId2, setLastId2] = useState(0);
    const [loading, setLoading] = useState(false)
    const [claimStatus, setClaimStatus] = useState('')
    const [loading2, setLoading2] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    const [showDetail, setShowDetail] = useState(false);
    const [showImagePreview, setShowImagePreview] = useState(false);
    const [selectedImage, setSelectedImage] = useState("");
    const [count, setCount] = useState(0);
    const [categories, setCategories] = useState([]);
    const [show2, setShow2] = useState(false);
    const navigate = useNavigate();

    const handleLiceneShow = (row) => {
        setUserData(row)
        setShow2(true)
    }

    const handleSubmit = async (values) => {
        setLoading(true)
        const body = new FormData();
        body.append("type", "update_data");
        body.append("table_name", 'businesses');
        body.append("license", values?.licenseName);
        body.append("license_no", values?.licenseNumber);
        body.append("license_type", values?.licenseType);
        body.append("issued_by", values?.issuedBy);
        body.append("verified_by_farevet", values?.verifiedByFarevet);
        body.append("id", userData?.id);
        await apiRequest({ body })
            .then(async (res) => {
                setLoading(false)
                if (res?.result === true) {
                    const body = new FormData();
                    body.append('type', 'update_data');
                    body.append('table_name', 'businesses');
                    body.append('claim_business', 1)
                    body.append('claim_business_status', 1)
                    body.append('business_created', 'user')
                    body.append('id', userData?.id)
                    body.append('user_id', userData?.user_id)
                    const res = await apiRequest({ body })
                    if (res?.result === true) {
                        handleFetchBusiness()
                        message.success("Licence Created Successfully!");
                        form.resetFields();
                        setShow2(false)
                    }
                    else {
                        console.error("Creation failed...");
                    }
                } else {
                    handleFetchBusiness()
                    message.error("Creation failed...");
                }
            })
            .catch((error) => {
                console.error(error);
                setLoading(false)
            });
    }

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
            body.append("claim_business", 1);
            body.append("claim_business_status", 0);
            body.append("page", lastId);
            const res = await apiRequest({ body });
            if (res && res.data && res.data.length > 0) {
                setCategories(res?.data);
                setIsProcessing(false);
                const totalCount = res?.count || 0;
                const pageCount = Math.ceil(totalCount / 10);
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
    }, [lastId])

    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
        setShowImagePreview(true);
    };

    const columns = [
        {
            name: 'Business logo',
            sortable: true,
            // minWidth: '200px',
            cell: (row) => {
                return (
                    <div className="flex w-full gap-2 items-center">
                        {row?.logo ? (
                            <img
                                onClick={() => handleImageClick(`${global.IMAGEURL}/${row?.logo}`)}
                                alt='' 
                                style={{ width: '35px', cursor: 'pointer', borderRadius: '50%', height: '35px', objectFit: 'cover' }} 
                                src={`${global.IMAGEURL}/${row?.logo}`} 
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                        ) : null}
                        <div 
                            className="items-center justify-center bg-gray-100 text-gray-400" 
                            style={{ width: '35px', height: '35px', borderRadius: '50%', display: row?.logo ? 'none' : 'flex' }}
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
            minwidth: '200px',
            selector: row => row?.name
        },
        {
            name: 'Address',
            sortable: true,
            minWidth: '250px',
            selector: row => row?.address
        },
        {
            name: 'User Name',
            sortable: true,
            minwidth: '200px',
            selector: row => row?.user?.name
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
            minwidth: '450px',
            selector: row => row?.address
        },
        {
            name: 'License',
            sortable: true,
            // minwidth: '450px',
            cell: (row) => {
                return (
                    <div className="flex w-full gap-2 items-center">
                        <a
                            href={`${global.IMAGEURL + '/' + row?.user?.license_doc}`}
                            alt=''
                            target='_blank' className="text_dark plusJakara_medium"
                        >{'Check License' || 'No license available'}
                        </a>
                    </div>
                )
            },
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
                        {row?.claim_business_status === '0' ?
                            <>
                                <button
                                    disabled={loading2}
                                    style={{ backgroundColor: '#06D6A0' }}
                                    onClick={() => { handleClaimBusiness('accept', row) }}
                                    className="w-1/2 rounded-lg text_white flex items-center justify-center p-2">
                                    {loading2 && claimStatus === 'accept' ? <Spinner color='inherit' size={18} /> : 'Approve'}
                                </button>
                                <button
                                    disabled={loading2}
                                    style={{ backgroundColor: '#FF6F61' }}
                                    onClick={() => { handleClaimBusiness('reject', row) }}
                                    className="w-1/2 rounded-lg text_white flex items-center justify-center p-2">
                                    {loading2 && claimStatus === 'reject' ? <Spinner color='inherit' size={18} /> : 'Decline'}
                                </button>
                            </> :
                            <button
                                style={{ color: '#00A3FF' }}
                                onClick={() => handleViewDetail(row)}
                                className="flex ms-3 items-center w-fit inter_semibold"
                            >
                                View detail
                            </button>}
                    </div>
                )
            }
        },
    ]

    const handleClaimBusiness = async (status, business) => {
        setClaimStatus(status)
        if (status === 'accept') {
            handleLiceneShow(business)
        } else {
            setLoading2(true)
            try {
                const body = new FormData();
                body.append('type', 'update_data');
                body.append('table_name', 'businesses');
                body.append('claim_business', 0)
                body.append('claim_business_status', 0)
                body.append('business_created', 'admin')
                body.append('id', business?.id)
                body.append('user_id', 0)
                const res = await apiRequest({ body })
                if (res?.result === true) {
                    handleFetchBusiness()
                    setLoading2(false)
                } else {
                    console.error("Creation failed...");
                }
            } catch (error) {
                setLoading2(false)
                console.log(error);
            } finally {
                setLoading2(false)
            }
        }
    }


    return (
        <StyleSheetManager shouldForwardProp={(prop) => !['sortActive'].includes(prop)}>
            <main className='container m-auto height_calc flex-grow flex flex-col p-3'>
                <div className="flex w-full mb-4">
                    <span className="text_dark plusJakara_medium text-2xl md:text-3xl">Claim Business</span>
                </div>
                {isProcessing ? (
                    <div className="flex w-full justify-center items-center my-5">
                        <Spinner className="text_primary" size={30} thickness={3} />
                    </div>
                ) : (
                    !count ?
                        <div className="my-5 flex justify-center items-center w-full">
                            <span className="text_dark inter_medium">No business Found</span>
                        </div>
                        : (
                            <ProductTable
                                // loading={isProcessing}
                                count={count}
                                setCurrentPage={setLastId2}
                                currentPage={lastId2}
                                columns={columns}
                                data={categories}
                                setLastId={setLastId}
                            />))}
                <Modal show={show2} onHide={() => setShow2(false)} centered>
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
                                    {loading ? <Spinner size={18} color='inherit' /> : 'Confirm'}
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
            </main>
        </StyleSheetManager>
    )
}

export default ClaimBusiness;