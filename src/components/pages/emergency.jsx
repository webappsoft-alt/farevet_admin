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
import moment from 'moment';
const { Option } = Select;

const Emergency = () => {
    const [form] = Form.useForm();
    const [userData, setUserData] = useState(null)
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastId, setLastId] = useState(1);
    const [lastId2, setLastId2] = useState(0);
    const [loading, setLoading] = useState(false)
    const [supportStatus, setsupportStatus] = useState('')
    const [supportId, setsupportId] = useState('')
    const [loading2, setLoading2] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    const [showDetail, setShowDetail] = useState(false);
    const [showImagePreview, setShowImagePreview] = useState(false);
    const [selectedImage, setSelectedImage] = useState("");
    const [count, setCount] = useState(0);
    const [categories, setCategories] = useState([]);
    const [show2, setShow2] = useState(false);
    const navigate = useNavigate();

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
                    handleFetchEmergency()
                    message.success("Licence Created Successfully!");
                    form.resetFields();
                    setShow2(false)
                } else {
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

    const handleFetchEmergency = async () => {
        setIsProcessing(true);
        try {
            const body = new FormData();
            body.append("type", "get_list");
            body.append("table_name", 'emergancy_assitant');
            // body.append("claim_business", 1);
            // body.append("claim_business_status", 0);
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
        handleFetchEmergency()
    }, [lastId])

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
                            alt='' style={{ width: '35px', cursor: 'pointer', borderRadius: '50%', height: '35px', objectFit: 'cover' }} src={`${global.IMAGEURL + '/' + row?.image}`} />
                    </div>
                )
            },
        },
        {
            name: 'Username',
            sortable: true,
            minWidth: '150px',
            selector: row => row?.user?.name
        },
        {
            name: 'Email',
            sortable: true,
            minWidth: '250px',
            selector: row => row?.user?.email
        },
        {
            name: "Phone",
            sortable: true,
            minWidth: '150px',
            selector: row => row?.user?.phone
        },
        {
            name: 'Description',
            sortable: true,
            // minWidth: '250px',
            cell: (row) => {
                return (
                    <p className="flex w-full mb-0 plusJakara_regular items-center">
                        {row?.description}
                    </p>
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
            name: 'Status',
            sortable: true,
            minWidth: '200px',
            cell: (row) => {
                return (
                    <div className="flex w-full gap-2 items-center">
                        {<button
                            disabled
                            style={{ backgroundColor: '#f4f4f4', fontSize: '12px' }}
                            // style={{ backgroundColor: row?.status === 'processing' ? '#8930F9' : row?.status === 'treated' ? '#00A3FF' : '#06D6A0', fontSize: '12px' }}
                            className="flex px-2 py-1 rounded-2 items-center text_black w-fit inter_regular"
                        >
                            {row?.status === 'processing' ? 'Query in Processing' : row?.status === 'treated' ? 'Query Being Treated' : row?.status === 'completed' ? 'Query Completed' : 'Not found'}
                        </button>}
                    </div>
                )
            }
        },
        {
            name: 'Action',
            sortable: true,
            // minWidth: '200px',
            cell: (row) => {
                return (
                    <div className="flex w-full gap-2 items-center">
                        {row?.status === 'processing' ?
                            <>
                                <button
                                    onClick={() => handleUpdateSupport('treated', row)}
                                    disabled={loading2}
                                    style={{ backgroundColor: '#00A3FF', fontSize: '12px', whiteSpace: 'nowrap' }}
                                    className="flex items-center w-fit inter_regular rounded-2 text_white p-2">
                                    {loading2 && supportId === row?.id && supportStatus === 'treated' ? <Spinner size={10} className='text_white' /> : 'Make Treated'}
                                </button>
                                <button
                                    onClick={() => handleUpdateSupport('completed', row)}
                                    disabled={loading2}
                                    style={{ backgroundColor: '#06D6A0', fontSize: '12px', whiteSpace: 'nowrap' }}
                                    className="flex items-center w-fit inter_regular rounded-2 text_white p-2">
                                    {loading2 && supportId === row?.id && supportStatus === 'completed' ? <Spinner size={10} className='text_white' /> : 'Make Complete'}
                                </button>
                            </> : row?.status === 'treated' ? <>
                                <button
                                    onClick={() => handleUpdateSupport('processing', row)}
                                    disabled={loading2}
                                    style={{ backgroundColor: '#8930F9', fontSize: '12px', whiteSpace: 'nowrap' }}
                                    className="flex items-center w-fit inter_regular rounded-2 text_white p-2">
                                    {loading2 && supportId === row?.id && supportStatus === 'processing' ? <Spinner size={10} className='text_white' /> : 'Make Processing'}
                                </button >
                                <button
                                    onClick={() => handleUpdateSupport('completed', row)}
                                    disabled={loading2}
                                    style={{ backgroundColor: '#06D6A0', fontSize: '12px', whiteSpace: 'nowrap' }}
                                    className="flex items-center w-fit inter_regular rounded-2 text_white p-2">
                                    {loading2 && supportId === row?.id && supportStatus === 'completed' ? <Spinner size={10} className='text_white' /> : 'Make Complete'}
                                </button>
                            </> : row?.status === 'completed' ? <>
                                <button
                                    onClick={() => handleUpdateSupport('processing', row)}
                                    disabled={loading2}
                                    style={{ backgroundColor: '#8930F9', fontSize: '12px', whiteSpace: 'nowrap' }}
                                    className="flex items-center w-fit inter_regular rounded-2 text_white p-2">
                                    {loading2 && supportId === row?.id && supportStatus === 'processing' ? <Spinner size={10} className='text_white' /> : 'Make Processing'}
                                </button>
                                <button
                                    onClick={() => handleUpdateSupport('treated', row)}
                                    disabled={loading2}
                                    style={{ backgroundColor: '#00A3FF', fontSize: '12px', whiteSpace: 'nowrap' }}
                                    className="flex items-center w-fit inter_regular rounded-2 text_white p-2">
                                    {loading2 && supportId === row?.id && supportStatus === 'treated' ? <Spinner size={10} className='text_white' /> : 'Make Treated'}
                                </button>
                            </> : ""}
                    </div >
                )
            }
        }
    ]

    const handleUpdateSupport = async (status, emergencyData) => {
        setsupportStatus(status)
        setsupportId(emergencyData?.id)
        setLoading2(true)
        try {
            const body = new FormData();
            body.append('type', 'update_data');
            body.append("table_name", 'emergancy_assitant');
            body.append("status", status);
            body.append('id', emergencyData?.id)
            const res = await apiRequest({ body })
            if (res?.result === true) {
                handleFetchEmergency()
                setLoading2(false)
            } else {
                console.error("Updation failed...");
            }
        } catch (error) {
            setLoading2(false)
            console.log(error);
        } finally {
            setLoading2(false)
        }
    }


    return (
        <StyleSheetManager shouldForwardProp={(prop) => !['sortActive'].includes(prop)}>
            <main className='container m-auto height_calc flex-grow flex flex-col p-3'>
                <div className="flex w-full mb-4">
                    <span className="text_dark plusJakara_medium text-2xl md:text-3xl">Emergency</span>
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

export default Emergency;