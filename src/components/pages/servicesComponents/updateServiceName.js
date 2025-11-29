/* eslint-disable no-unused-vars */
import { Form, Input, message, } from 'antd';
import React, { useEffect, useState } from 'react'
import { ArrowLeft } from 'react-feather';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../../../api/auth_api';
import { CircularProgress } from '@mui/material';


const serviceArray = [
    { title: "Both", value: 'both' },
    { title: "Individual", value: 'individual' },
    { title: "Business", value: 'business' },
];
const UpdateServiceName = () => {
    const { state } = useLocation();
    const serviceNameData = state?.serviceNameData || null;
    const [servicePet, setServicePet] = useState('');
    const [serviceType, setServiceType] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [addedServices, setAddedServices] = useState([]);
    const [form] = Form.useForm();
    const navigate = useNavigate();

    useEffect(() => {
        setServiceType(serviceNameData?.service_type)
    }, [serviceNameData])

    const allServices = [...addedServices];
    const capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    const handleServiceType = (title) => {
        setServiceType(title);
    };

    const handleSubmit = async (value) => {
        setIsProcessing(true)
        const body = new FormData();
        body.append("type", "update_data");
        body.append("table_name", 'services_list');
        body.append("service_type", serviceType);
        body.append("id", serviceNameData?.id);
        body.append("name", capitalizeFirstLetter(value?.serviceNameExtra));
        await apiRequest({ body })
            .then(async (res) => {
                setIsProcessing(false)
                if (res) {
                    message.success("Service Update Successfully");
                    form.resetFields();
                    navigate(-1)
                } else {
                    message.error("Creation failed...");
                }
            })
            .catch((error) => {
                console.error(error);
                setIsProcessing(false)
            })
            .finally(() => {
                setIsProcessing(false)
            });
    }

    return (
        <main className='container m-auto min-h-screen py-4'>
            <div className="flex items-center gap-3 mb-4">
                <button onClick={() => { navigate(-1) }} className="flex items-center justify-center w-[36px] h-[36px] bg_primary rounded-lg">
                    <ArrowLeft className='text_white' />
                </button>
                <span className="inter_semibold text-xl md:text-2xl text_dark">Update Services</span>
            </div>
            <Form layout='verticle' form={form} onFinish={handleSubmit} className="w-full lg:w-[90%] xl:w-[80%] mx-auto bg_white rounded-lg shadow-md p-[1rem] md:p-[2rem]">
                <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
                    <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
                        Type of Pet
                    </span>
                    <div className="w-full md:w-[70%] flex flex-wrap gap-2 items-center">
                        {serviceArray.map((item, i) => (
                            <button
                                key={i}
                                type="button"
                                style={{ cursor: "pointer" }}
                                className={`border cursor-pointer rounded-3 gap-1 px-[1rem] py-2 inter_medium text-sm flex justify-center items-center ${serviceType === item?.value
                                    ? "bg-[#F8F2FD] text_primary"
                                    : "bg_white text_secondary"
                                    }`}
                                onClick={() => handleServiceType(item?.value)}
                            >
                                {item?.title}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
                    <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
                        Services
                    </span>
                    <div className="w-full md:w-[70%] flex flex-col gap-2">
                        <div className="flex gap-2 items-center">
                            <Form.Item
                                initialValue={serviceNameData?.name || ''}
                                className="w-full mb-0"
                                name='serviceNameExtra'
                            >
                                <Input type='text' placeholder='Service Name' size='large' allowClear />
                            </Form.Item>
                            {!isProcessing ? (
                                <button type='submit' className='bg_primary rounded-lg text_white inter_semibold px-[1rem] py-2'>Update</button>
                            ) : (
                                <button type='button' disabled className='bg_primary rounded-lg px-[2rem] py-2 cursor-not-allowed'>
                                    <CircularProgress size={18} className='text_white' />
                                </button>
                            )}
                        </div>
                        <div className='flex flex-wrap gap-2 items-center'>
                            {allServices.map((item, i) => (
                                <button
                                    key={i}
                                    type='button'
                                    className={`border cursor-pointer rounded-lg gap-1 px-[1rem] py-2 inter_medium text-sm flex justify-center items-center ${servicePet === item ? 'bg-[#F8F2FD] text_primary' : 'bg_white text_secondary'}`}
                                    onClick={() => setServicePet(item)}
                                >
                                    {capitalizeFirstLetter(item)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Form>
        </main>
    )
}

export default UpdateServiceName;