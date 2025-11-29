/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { Edit, Plus, Trash2, } from 'react-feather';
import { Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import { IoClose } from 'react-icons/io5';
import ProductTable from '../DataTable/productTable';
import { StyleSheetManager } from 'styled-components';
import { apiRequest } from '../../api/auth_api';

const Services = () => {
    const [selectedOption, setSelectedOption] = useState("service");
    const [showSubservice, setShowSubservice] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [categories, setCategories] = useState([])
    const [lastIdService, setLastIdService] = useState(1);
    const [lastId2Service, setLastId2Service] = useState(0);
    const [loading, setLoading] = useState(false)
    const [countService, setCountService] = useState(0);
    const [subServices, setSubservices] = useState([])
    const [lastIdSubservice, setLastIdSubservice] = useState(1);
    const [lastId2Subservice, setLastId2Subservice] = useState(0);
    const [countSubservice, setCountSubservice] = useState(0);
    const [showDeleteCategory, setShowDeleteCategory] = useState(false)
    const [showDeleteService, setShowDeleteService] = useState(false)
    const [showService, setShowService] = useState(true)
    const navigate = useNavigate();


    const handleSubserviceClick = () => {
        setSelectedOption('subservice')
        setShowSubservice(true)
        setShowService(false)
    }
    const handleServiceClick = () => {
        setSelectedOption('service')
        setShowService(true)
        setShowSubservice(false)
    }

    const updateServiceName = (item) => {
        navigate(`/update-service-name/${item?.id}`, { state: { serviceNameData: item } });
    };
    const updateSuberviceName = (item) => {
        navigate(`/update-sub-service-name/${item?.id}`, { state: { subServiceNameData: item } });
    };

    const handleFetchData = async () => {
        setIsProcessing(true)
        try {
            const body = new FormData();
            body.append("type", "get_list");
            body.append("table_name", 'services_list');
            body.append("page", lastIdService);
            const res = await apiRequest({ body })
            if (res && res.data && res.data.length > 0) {
                setCategories(res.data);
                const totalCount = res?.count || 0;
                const pageCount = Math.ceil(totalCount / 10);
                setCountService(pageCount);
            }
            setIsProcessing(false)
        } catch (error) {
            console.log(error);
            setIsProcessing(false)
        } finally {
            setIsProcessing(false)
        }
    }

    const handleFetchDataSubservice = async () => {
        setLoading(true)
        try {
            const body = new FormData();
            body.append("type", "get_list");
            body.append("table_name", 'sub_services_list');
            body.append("page", lastIdSubservice);
            const res = await apiRequest({ body })
            if (res && res.data && res.data.length > 0) {
                setSubservices(res.data);
                const totalCount = res?.count || 0;
                const pageCount = Math.ceil(totalCount / 10);
                setCountSubservice(pageCount);
            }
            setLoading(false)
        } catch (error) {
            console.log(error);
            setLoading(false)
        } finally {
            setLoading(false)

        }
    }

    useEffect(() => {
        handleFetchData();
    }, [lastIdService])


    useEffect(() => {
        handleFetchDataSubservice();
    }, [lastIdSubservice])

    const subServiceColumn = [
        {
            name: 'Services',
            sortable: true,
            selector: (row) => row?.service?.name
        },
        {
            name: 'Subservices',
            sortable: true,
            cell: (row) => {
                try {
                    if (Array.isArray(row?.name)) {
                        return row?.name.join(', ').replace(/["']/g, "");
                    } else if (typeof row?.name === 'string') {
                        const parsedArray = JSON.parse(row?.name);
                        return Array.isArray(parsedArray) ? parsedArray.join(', ') : row?.name;
                    } else {
                        return row?.name;
                    }
                } catch (error) {
                    console.error("Error parsing subservice name:", error);
                    return row?.name;
                }
            }
        },
        {
            name: 'Action',
            allowoverflow: true,
            cell: (row) => {
                return (
                    <div className='flex gap-1'>
                        <button style={{ backgroundColor: '#06d6a0' }} onClick={() => updateSuberviceName(row)} className="blex justify-center inter_medium text-xs text_white rounded-lg p-2 items-center"><Edit size={16} /></button>
                        <button style={{ backgroundColor: '#ff6f61' }} onClick={() => { deleteSubserviceName(row?.id) }} className="flex justify-center inter_medium text-xs text_white rounded-lg p-2 items-center"><Trash2 size={16} /></button>
                    </div>
                )
            }
        }
    ];

    const deleteServiceName = async (id) => {
        const body = new FormData();
        body.append("type", "delete_data");
        body.append("table_name", 'services_list');
        body.append("id", id);
        await apiRequest({ body })
            .then(async (res) => {
                // console.log(res, "ress");
                if (res) {
                    // console.log(res);
                    handleFetchData();
                    setShowDeleteService(true)
                } else {
                    console.error("deletion failed...");
                }
            })
            .catch((error) => {
                console.error(error);
            })
    }
    const deleteSubserviceName = async (id) => {
        const body = new FormData();
        body.append("type", "delete_data");
        body.append("table_name", 'sub_services_list');
        body.append("id", id);
        await apiRequest({ body })
            .then(async (res) => {
                // console.log(res, "ress");
                if (res) {
                    // console.log(res);
                    handleFetchDataSubservice();
                    setShowDeleteCategory(true)
                } else {
                    console.error("deletion failed...");
                }
            })
            .catch((error) => {
                console.error(error);
            })
    }

    const capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    const servicesColumn = [
        {
            name: 'Services',
            sortable: true,
            selector: row => row?.name
        },
        {
            name: 'Service Type',
            sortable: true,
            selector: row => capitalizeFirstLetter(row?.service_type)
        },
        {
            name: 'Action',
            allowoverflow: true,
            cell: (row) => {
                return (
                    <div className='flex gap-1'>
                        <button style={{ backgroundColor: '#06d6a0' }} onClick={() => updateServiceName(row)} className="flex justify-center inter_medium text-xs text_white rounded-lg p-2 items-center"><Edit size={16} /></button>
                        <button style={{ backgroundColor: '#ff6f61' }} onClick={() => { deleteServiceName(row?.id) }} className="flex justify-center inter_medium text-xs text_white rounded-lg p-2 items-center"><Trash2 size={16} /></button>
                    </div>
                )
            }
        }
    ];

    return (
        <StyleSheetManager shouldForwardProp={(prop) => !['sortActive'].includes(prop)}>
            <main className='container m-auto height_calc flex-grow flex flex-col p-3'>
                <div className="flex w-full justify-between items-center flex-wrap mb-3">
                    <span className="text_dark plusJakara_medium text-2xl md:text-3xl">Services List</span>
                    <div className="flex items-center bg_white rounded-lg">
                        <button onClick={handleServiceClick} className={`px-[1rem] max-md:text-sm md:px-3 py-2 rounded-lg inter_semibold ${selectedOption === 'service' ? 'bg_primary text_white' : 'bg_white text_dark'}`}>Services</button>
                        <button onClick={handleSubserviceClick} className={`px-[1rem] max-md:text-sm md:px-3 py-2 rounded-lg inter_semibold ${selectedOption === 'subservice' ? 'bg_primary text_white' : 'bg_white text_dark'}`}>Subservices</button>
                    </div>
                </div>
                <div className="mb-3 rounded-lg bg_white shadow-md w-full">
                    {showService && (
                        <>
                            <div className="flex items-center justify-between flex-wrap p-3 gap-2">
                                <span className="plusJakara_medium text_dark text-xl md:text-2xl">Services</span>
                                <button
                                    onClick={() => { navigate('/service-names/create-service') }}
                                    className="flex justify-center bg_primary p-[8px] md:p-[10px] rounded-lg items-center gap-[4px] md:gap-[8px] button_shadow">
                                    <Plus size={18} className='text_white' />
                                    <span className="inter_semibold text-sm text_white ">Add New</span>
                                </button>
                            </div>
                            <ProductTable
                                loading={isProcessing}
                                count={countService}
                                setCurrentPage={setLastId2Service}
                                currentPage={lastId2Service}
                                columns={servicesColumn}
                                data={categories}
                                setLastId={setLastIdService}
                            />
                        </>
                    )}
                    {showSubservice && (
                        <>
                            <div className="flex items-center justify-between flex-wrap p-3 gap-2">
                                <span className="plusJakara_medium text_dark text-xl md:text-2xl">Subservices</span>
                                <button
                                    onClick={() => { navigate('/service-names/create-subservice') }}
                                    className="flex justify-center bg_primary p-[8px] md:p-[10px] rounded-lg items-center gap-[4px] md:gap-[8px] button_shadow">
                                    <Plus size={18} className='text_white' />
                                    <span className="inter_semibold text-sm text_white ">Add New</span>
                                </button>
                            </div>
                            <ProductTable
                                loading={loading}
                                count={countSubservice}
                                setCurrentPage={setLastId2Subservice}
                                currentPage={lastId2Subservice}
                                columns={subServiceColumn}
                                data={subServices}
                                setLastId={setLastIdSubservice}
                            />
                        </>
                    )}
                </div>
                <Modal
                    centered
                    open={showDeleteCategory}
                    onCancel={() => setShowDeleteCategory(false)}
                    footer={null}
                    width='350px'
                >
                    <div className="flex justify-center flex-col items-center gap-4">
                        <div className="rounded-full flex items-center justify-center bg-[#FF6F61] w-[4rem] md:w-[6rem] h-[4rem] md:h-[6rem]">
                            <IoClose className='text_white' size={50} />
                        </div>
                        <span className="text_dark text-xl plusJakara_medium">Subservice has been deleted.</span>
                    </div>
                </Modal>

                <Modal
                    centered
                    open={showDeleteService}
                    onCancel={() => setShowDeleteService(false)}
                    footer={null}
                    width='350px'
                >
                    <div className="flex justify-center flex-col items-center gap-4">
                        <div className="rounded-full flex items-center justify-center bg-[#FF6F61] w-[4rem] md:w-[6rem] h-[4rem] md:h-[6rem]">
                            <IoClose className='text_white' size={50} />
                        </div>
                        <span className="text_dark text-xl plusJakara_medium">Service Name has been deleted.</span>
                    </div>
                </Modal>
            </main>
        </StyleSheetManager>
    );
};

export default Services;
