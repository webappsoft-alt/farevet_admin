import React, { useState } from 'react'
import { arrowright2 } from '../../icons/icon';
import { Link, useNavigate } from 'react-router-dom';
import { Col, Input, Select, Form } from 'antd';
import { CircularProgress } from '@mui/material';
const { Option } = Select;

const AddSubscription = () => {
    const navigate = useNavigate()
    const [isProcessing, setIsProcessing] = useState(false)

    const handleSubmit = async (value) => {
        setIsProcessing(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            // console.log(value);
            navigate('/account/subscription')
        } catch (error) {
            console.log(error);
        } finally {
            setIsProcessing(false);
        }
    };
    return (
        <main className='min-h-screen lg:container py-5 px-4 mx-auto'>
            <div className="flex md:gap-[5px] items-center mb-4">
                <Link to='/account' className="manrope_bold no-underline md:text-lg text-[#A6A6A6]">Profile</Link>
                <span className="flex items-center md:gap-[5px]"><img src={arrowright2} alt="" /><span className='text-lg md:text-2xl manrope_bold text-[#404040]'>Subscription Plan</span></span>
            </div>
            <div className="border bg_white p-4 rounded-lg">
                <h4 className="manrope_semibold text-[#1A2024]">Add Subscription Plan</h4>
                <hr className='text-[#f1f0f3]' />
                <Form layout='verticle' className='flex flex-wrap justify-between' onFinish={handleSubmit}>
                    <Col xs={24} md={11}>
                        <span className='manrope_medium text_black text-sm'>Name</span>
                        <Form.Item
                            name='name'
                            className="mt-2 mb-[20px]"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please enter the Subscription Name'
                                },
                            ]}
                        >
                            <Input
                                size='large' className='inter_regular text-[#9AA6AC] text-sm py-2' type="text" placeholder='Name' />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={11}>
                        <span className='inter_medium text-lg text_black'>Plan Type</span>
                        <Form.Item
                            className="mt-2 mb-[20px]"
                            name="planType"
                            rules={[

                                {
                                    required: true,
                                    message: 'Please Select your Plan type'
                                },
                            ]}
                        >
                            <Select
                                size='large'
                                placeholder="Select your Plan type"
                                className='inter_regular text-[#9AA6AC] text-sm'
                                allowClear
                            >
                                <Option value="basic">Basic</Option>
                                <Option value="premium">Premium</Option>
                                <Option value="other">other</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <span className='manrope_medium text_black text-sm'>Price</span>
                        <Form.Item
                            name='price'
                            className="mt-2 mb-[20px]"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please enter the price'
                                },
                            ]}
                        >
                            <Input
                                size='large' className='inter_regular text-[#9AA6AC] text-sm py-2' type="number" placeholder='$156' />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <span className='manrope_medium text_black text-sm'>Description</span>
                        <Form.Item
                            name='description'
                            className="mt-2 mb-[20px]"
                            rules={[
                                {
                                    min: 20,
                                    required: true,
                                    message: 'Please enter the description'
                                },
                            ]}
                        >
                            <Input.TextArea
                                size='large' className='inter_regular text-[#9AA6AC] text-sm' rows={5} placeholder='description...' />
                        </Form.Item>
                    </Col>
                    <div className='w-full flex justify-end'>
                        {!isProcessing ? (
                            <button type='submit' className='w-fit rounded-md bg_dark text_white text-sm py-[10px] px-[2rem] md:px-[44px] inter_semibold flex justify-center items-center'>Add</button>
                        ) : (
                            <button type='submit' className='w-fit rounded-md bg_dark text_white text-sm py-[10px] px-[4.5rem] md:px-[44px] inter_semibold flex justify-center items-center' disabled>
                                <CircularProgress size={20} />
                            </button>
                        )
                        }
                    </div>
                </Form>
            </div>
        </main>
    )
}

export default AddSubscription;