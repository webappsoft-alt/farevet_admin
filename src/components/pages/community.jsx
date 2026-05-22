/* eslint-disable jsx-a11y/img-redundant-alt */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import Spinner from "../Spinner";
import { Modal, Select, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { StyleSheetManager } from 'styled-components';
import { apiRequest } from '../../api/auth_api';
import ProductTable from '../DataTable/productTable';
import { profileavatar } from '../icons/icon';
const { Option } = Select;

const Community = () => {
    const [lastId, setLastId] = useState(1);
    const [lastId2, setLastId2] = useState(0);
    const [showImagePreview, setShowImagePreview] = useState(false);
    const [selectedImage, setSelectedImage] = useState([]);
    const [loading, setLoading] = useState(false)
    const [count, setCount] = useState(0)
    const [isProcessing, setIsProcessing] = useState(false)
    const [statusId, setStatusId] = useState('')
    const [categories, setCategories] = useState([]);

    const handleImageClick = (imageUrls) => {
        setSelectedImage(imageUrls); // Set to an array of image URLs
        setShowImagePreview(true);
    };

    const handleFetchBusiness = async () => {
        setIsProcessing(true);
        try {
            const body = new FormData();
            body.append("type", "get_list");
            body.append("table_name", 'community');
            body.append("report", '1');
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
            minwidth: '200px',
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
            name: 'Question',
            sortable: true,
            minWidth: '200px',
            cell: (row) => {
                return (
                    <div className="flex w-full plusJakara_regular gap-2 items-center">
                        {row?.question}
                    </div>
                )
            }
        },
        {
            name: 'Report',
            sortable: true,
            minWidth: '200px',
            cell: (row) => {
                return (
                    <div className="flex w-full plusJakara_regular gap-2 items-center">
                        {row?.report}
                    </div>
                )
            }
        },
        {
            name: 'Image',
            sortable: true,
            cell: (row) => {
                if (row?.images) {
                    const imagesArray = JSON.parse(row?.images);
                    if (imagesArray.length > 0) {
                        return (
                            <div className="flex w-full gap-2 items-center">
                                <img
                                    src={`${global.IMAGEURL}/${imagesArray[0]}`}
                                    onClick={() => handleImageClick(imagesArray)}
                                    style={{ width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer' }}
                                    alt=""
                                />
                            </div>
                        );
                    }
                }
                return (
                    <div className="flex w-full plusJakara_medium gap-2 items-center">
                        No Image Available
                    </div>
                );
            }
        },
        {
            name: 'Action',
            sortable: true,
            cell: (row) => {
                return (
                    <div className='flex gap-1'>
                        <button
                            style={{ backgroundColor: '#d15a5a' }}
                            disabled={loading}
                            onClick={() => handleDeletePost(row)}
                            className={`text_white flex justify-center rounded-2 py-1 px-2 items-center relative`}
                        >
                            {statusId === row?.id && loading ? (
                                <Spinner size={15} color='inherit' />
                            ) : (
                                'Delete Post'
                            )}
                        </button>
                    </div>
                )
            }
        }
    ]

    const handleDeletePost = async (business) => {
        setStatusId(business?.id)
        setLoading(true);
        try {
            const body = new FormData();
            body.append('type', 'delete_data');
            body.append('table_name', 'community');
            body.append('id', business?.id)
            const res = await apiRequest({ body })
            if (res) {
                message.success(`Deleted Successfully`)
                handleFetchBusiness()
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
                    <span className="text_dark plusJakara_medium text-2xl md:text-3xl">Community</span>
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
                <div className="flex flex-wrap justify-start gap-4">
                    {selectedImage?.map((imageUrl, index) => (
                        <img
                            key={index}
                            src={`${global.IMAGEURL}/${imageUrl}`}
                            alt={`Image ${index}`}
                            style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: "50%" }}
                            className="object-cover"
                        />
                    ))}
                </div>
            </Modal>
        </StyleSheetManager>
    )
}

export default Community;