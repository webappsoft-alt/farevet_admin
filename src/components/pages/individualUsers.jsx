/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import Spinner from "../Spinner";
import { Modal, Select, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { StyleSheetManager } from 'styled-components';
import { apiRequest } from '../../api/auth_api';
import ProductTable from '../DataTable/productTable';
import { profileavatar } from '../icons/icon';
import moment from 'moment';
const { Option } = Select;

const IndividualUsers = () => {
    const [lastId, setLastId] = useState(1);
    const [lastId2, setLastId2] = useState(0);
    const [showImagePreview, setShowImagePreview] = useState(false);
    const [selectedItem, setSelectedItem] = useState("");
    const [selectedImage, setSelectedImage] = useState("");
    const [actionType, setActionType] = useState('')
    const [openModal, setOpenModal] = useState(false)
    const [loading, setLoading] = useState(false)
    const [count, setCount] = useState(0)
    const [isProcessing, setIsProcessing] = useState(false)
    const [statusId, setStatusId] = useState('')
    const [categories, setCategories] = useState([]);

    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
        setShowImagePreview(true);
    };

    const handleClick = (row) => {
        setSelectedItem(row);
        setOpenModal(true);
    };

    const handleFetchBusiness = async () => {
        setIsProcessing(true);
        try {
            const body = new FormData();
            body.append("type", "get_list");
            body.append("table_name", 'users');
            body.append("user_type", 'individual');
            body.append("page", lastId);
            const res = await apiRequest({ body });
            if (res && res.data && res.data.length > 0) {
                setCategories(res?.data);
                const totalCount = res?.count || 0;
                const pageCount = Math.ceil(totalCount / 10); // Assuming 10 items per page
                setCount(pageCount);
            }
            setIsProcessing(false);
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
            name: 'User Name',
            sortable: true,
            minWidth: '180px',
            selector: row => row?.name || '',
            cell: row => row?.name?.trim() ? row.name.trim() : '-'
        },
        {
            name: 'Email',
            sortable: true,
            minWidth: '220px',
            selector: row => row?.email || '',
            cell: row => row?.email?.trim() ? row.email.trim() : '-'
        },
        {
            name: "Phone",
            sortable: true,
            minWidth: '120px',
            selector: row => row?.phone || '',
            cell: row => row?.phone?.trim() ? row.phone.trim() : '-'
        },
        {
            name: "Bio",
            sortable: true,
            minWidth: '200px',
            selector: row => row?.bio || '',
            cell: row => row?.bio?.trim() ? row.bio.trim() : '-'
        },
        {
            name: "Job Title",
            sortable: true,
            minWidth: '180px',
            selector: row => row?.job_title || '',
            cell: row => row?.job_title?.trim() ? row.job_title.trim() : '-'
        },
        {
            name: 'Portfolio',
            sortable: true,
            minWidth: '100px',
            cell: (row) => {
                if (!row?.portfolio?.trim()) return '-';
                const src = `${global.IMAGEURL}/${row.portfolio}`;
                return (
                    <div className="flex w-full gap-2 items-center">
                        <img
                            src={src}
                            onError={(e) => { e.currentTarget.src = profileavatar }}
                            onClick={() => handleImageClick(src)}
                            style={{ width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', objectFit: 'cover' }} alt="Portfolio" />
                    </div>
                )
            }
        },
        {
            name: 'License Doc',
            sortable: true,
            minWidth: '100px',
            cell: (row) => {
                if (!row?.license_doc?.trim()) return '-';
                const src = `${global.IMAGEURL}/${row.license_doc}`;
                return (
                    <div className="flex w-full gap-2 items-center">
                        <img
                            src={src}
                            onError={(e) => { e.currentTarget.src = profileavatar }}
                            onClick={() => handleImageClick(src)}
                            style={{ width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', objectFit: 'cover' }} alt="License" />
                    </div>
                )
            }
        },
        {
            name: 'Subscription Type',
            sortable: true,
            minWidth: '150px',
            selector: row => row?.sub_type || '',
            cell: row => row?.sub_type?.trim() ? row.sub_type.trim() : '-'
        },
        {
            name: 'Total Credits',
            sortable: true,
            minWidth: '120px',
            selector: row => row?.total_credits || '',
            cell: row => (row?.total_credits !== null && row?.total_credits !== undefined && row?.total_credits !== "") ? row.total_credits : '0'
        },
        {
            name: 'Created At',
            sortable: true,
            minWidth: '120px',
            cell: (row) => {
                return (
                    <p className="flex w-full mb-0 plusJakara_regular items-center text-[10.5px]">
                        {row?.created_at ? moment(row.created_at).format('DD-MM-YYYY') : '-'}
                    </p>
                )
            }
        },
        {
            name: 'Action',
            sortable: true,
            minWidth: '150px',
            cell: (row) => {
                return (
                    <div className='flex gap-1'>
                        {row?.status === '0' && (
                            <>
                                <button
                                    style={{ backgroundColor: '#FFA500' }}
                                    onClick={() => handleClick(row)}
                                    className={`text_white flex justify-center rounded-2 py-1 px-2 items-center relative`}
                                >Pending</button>
                            </>
                        )}
                        {row?.status !== '0' && (
                            <button
                                style={{ backgroundColor: row?.status === '1' ? '#06D6A0' : '#d15a5a' }}
                                disabled={loading}
                                onClick={() => handleUpdateIndividual(row?.status === '1' ? '2' : '1', row)}
                                className={`text_white flex justify-center rounded-2 py-1 px-2 items-center relative`}
                            >
                                {statusId === row?.id && loading ? (
                                    <Spinner size={15} color='inherit' />
                                ) : (
                                    row?.status === '1' ? 'Approved' : 'Declined'
                                )}
                            </button>
                        )}
                    </div>
                )
            }
        }
    ]

    const handleUpdateIndividual = async (status, business, actionType) => {
        setActionType(actionType);
        setStatusId(business?.id)
        setLoading(true);
        try {
            const body = new FormData();
            body.append('type', 'update_data');
            body.append('table_name', 'users');
            body.append('user_type', 'individual');
            body.append('status', status)
            body.append('id', business?.id)
            const res = await apiRequest({ body })
            if (res) {
                message.success(`User ${status === '1' ? 'Activate' : 'Deactivate'} Successfully`)
                handleFetchBusiness()
                setOpenModal(false)
            } else {
                setLoading(false);
                console.error("Creation failed...");
            }
        } catch (error) {
            setLoading(false);
            console.log(error);
        } finally {
            setLoading(false);
        }
    }


    return (
        <StyleSheetManager shouldForwardProp={(prop) => !['sortActive'].includes(prop)}>
            <main className='container m-auto height_calc flex-grow flex flex-col p-3'>
                <div className="flex w-full mb-4">
                    <span className="text_dark plusJakara_medium text-xl md:text-2xl">Individual Users</span>
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
            </main>
            <Modal
                open={showImagePreview}
                onCancel={() => setShowImagePreview(false)}
                footer={null}
            >
                <img
                    src={selectedImage}
                    alt={selectedImage}
                    className="object-cover w-full"
                    style={{ maxHeight: "30rem" }}
                />
            </Modal>
            <Modal
                centered
                open={openModal}
                onCancel={() => setOpenModal(false)}
                footer={null}
            >
                {/* <span className="text_dark text-xl plusJakara_medium">
                    Are you want to delete this business?
                </span> */}
                <div className="flex justify-center gap-2 w-full my-3">
                    <button
                        type="button"
                        disabled={loading}
                        style={{ backgroundColor: '#06D6A0' }}
                        className={`border cursor-pointer rounded-lg gap-1 px-3 py-2 inter_medium text-sm flex justify-center items-center text_white`}
                        onClick={() => handleUpdateIndividual('1', selectedItem, 'approve')}
                    >
                        {(statusId === selectedItem?.id && actionType === 'approve' && loading) ? (
                            <Spinner size={15} color='inherit' />
                        ) : (
                            'Activate Account'
                        )}
                    </button>
                    <button
                        type="button"
                        disabled={loading}
                        style={{ backgroundColor: '#d15a5a' }}
                        className={`border cursor-pointer rounded-lg gap-1 px-3 py-2 inter_medium text-sm flex justify-center items-center text_white`}
                        onClick={() => handleUpdateIndividual('2', selectedItem, 'reject')}
                    >
                        {(statusId === selectedItem?.id && actionType === 'reject' && loading) ? (
                            <Spinner size={15} color='inherit' />
                        ) : (
                            'Deactivate account'
                        )}
                    </button>
                </div>

            </Modal>
        </StyleSheetManager>
    )
}

export default IndividualUsers;