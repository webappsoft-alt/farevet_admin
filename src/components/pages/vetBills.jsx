/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { message, Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import { Edit, Plus, Trash2 } from 'react-feather';
import { IoClose } from 'react-icons/io5';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../../api/auth_api';
import ProductTable from '../DataTable/productTable';
import { avatar2 } from '../icons/icon';

const VetBills = () => {
    const { type } = useParams();
    const [vetBills, setVetBills] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastId, setLastId] = useState(1);
    const [lastId2, setLastId2] = useState(0);
    const [count, setCount] = useState(0);
    const [showImagePreview, setShowImagePreview] = useState(false);
    const [selectedImage, setSelectedImage] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const navigate = useNavigate();

    const typeMapping = {
        'charity': { title: 'Charity', cat_type: 'charity' },
        'financing': { title: 'Financing', cat_type: 'financing' },
        'clinics': { title: 'Clinics', cat_type: 'clinics' }
    };

    const currentType = type ? typeMapping[type] : { title: 'All Vet Bills', cat_type: '' };

    const handleFetchData = async () => {
        setIsProcessing(true);
        try {
            const body = new FormData();
            body.append("type", "get_list");
            body.append("table_name", 'bill_covering');
            body.append("page", lastId);
            if (currentType.cat_type) {
                body.append("cat_type", currentType.cat_type);
            }

            const res = await apiRequest({ body });
            if (res && res.data && res.data.length > 0) {
                setVetBills(res.data);
                const totalCount = res?.count || 0;
                const pageCount = Math.ceil(totalCount / 10);
                setCount(pageCount);
            } else {
                setVetBills([]);
                setCount(0);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        handleFetchData();
    }, [lastId, type]);

    const deleteVetBill = async (id) => {
        const body = new FormData();
        body.append("type", "delete_data");
        body.append("table_name", 'bill_covering');
        body.append("id", id);

        try {
            const res = await apiRequest({ body });
            if (res) {
                handleFetchData();
                message.success("Data deleted Successfuly")
            } else {
                console.error("Deletion failed...");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const updateVetBill = (item) => {
        navigate(`/vet-bills/update/${type}/${item?.id}`, { state: { vetBillData: item } });
    };

    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
        setShowImagePreview(true);
    };

    const getColumns = () => {
        const baseColumns = [
            {
                name: 'Image',
                sortable: true,
                maxWidth: '100px',
                cell: (row) => {
                    return (
                        <div className="flex gap-2 items-center">
                            <img
                                onClick={() => handleImageClick(`${global.IMAGEURL}/${row?.image}` || avatar2)}
                                alt='' style={{ width: '35px', cursor: 'pointer', borderRadius: '50%', height: '35px', objectFit: 'cover' }} src={`${global.IMAGEURL + '/' + row?.image}`} />
                        </div>
                    )
                },
            },
            {
                name: currentType?.cat_type === 'clinics' ? 'Clinic Name' : 'Title',
                sortable: true,
                selector: row => row?.title
            },
            {
                name: 'Description',
                sortable: true,
                cell: row => {
                    const description = row?.description || '';
                    return description.length > 50 ? `${description.substring(0, 50)}...` : description;
                }
            },
            {
                name: 'Button Text',
                sortable: true,
                selector: row => row?.button_text
            },
            {
                name: 'Action',
                allowoverflow: true,
                cell: (row) => {
                    return (
                        <div className='flex gap-1'>
                            <button style={{ backgroundColor: '#06d6a0' }} onClick={() => updateVetBill(row)} className="flex justify-center inter_medium text-xs text_white rounded-lg p-2 items-center">
                                <Edit size={16} />
                            </button>
                            <button style={{ backgroundColor: '#ff6f61' }} onClick={() => { deleteVetBill(row?.id) }} className="flex justify-center inter_medium text-xs text_white rounded-lg p-2 items-center">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    );
                }
            }
        ];

        return baseColumns;
    };

    return (
        <main className='container m-auto height_calc flex-grow flex flex-col p-3'>
            <div className="flex w-full justify-between items-center flex-wrap mb-3">
                <span className="text_dark plusJakara_medium text-2xl md:text-3xl">Vet Bills </span>
            </div>
            <div className="mb-3 rounded-lg bg_white shadow-md w-full">
                <div className="flex items-center justify-between flex-wrap p-3 gap-2">
                    <span className="plusJakara_medium text_dark text-xl md:text-2xl">{currentType.title} List</span>
                    <button
                        onClick={() => { navigate(`/vet-bills/create/${type}`) }}
                        className="flex justify-center bg_primary p-[8px] md:p-[10px] rounded-lg items-center gap-[4px] md:gap-[8px] "
                    >
                        <Plus size={18} className='text_white' />
                        <span className="inter_semibold text-sm text_white">Add New</span>
                    </button>
                </div>
                <ProductTable
                    loading={isProcessing}
                    count={count}
                    setCurrentPage={setLastId2}
                    currentPage={lastId2}
                    columns={getColumns()}
                    data={vetBills}
                    setLastId={setLastId}
                />
            </div>

            <Modal
                centered
                open={showDeleteModal}
                onCancel={() => setShowDeleteModal(false)}
                footer={null}
                width='350px'
            >
                <div className="flex justify-center flex-col items-center gap-4">
                    <div className="rounded-full flex items-center justify-center bg-[#FF6F61] w-[4rem] md:w-[6rem] h-[4rem] md:h-[6rem]">
                        <IoClose className='text_white' size={50} />
                    </div>
                    <span className="text_dark text-xl plusJakara_medium">{currentType.title} record has been deleted.</span>
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


        </main>
    );
};

export default VetBills;