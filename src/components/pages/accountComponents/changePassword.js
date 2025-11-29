/* eslint-disable no-unused-vars */
import React, { useState } from 'react'
import { arrowright2, eye, eyeoff } from '../../icons/icon'
import { Link, useNavigate } from 'react-router-dom';
import { Col, Input, Form } from 'antd';
import { CircularProgress } from '@mui/material';

const ChangePassword = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);
    const [showPassword3, setShowPassword3] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false)

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };
    const togglePasswordVisibility2 = () => {
        setShowPassword2(!showPassword2);
    };
    const togglePasswordVisibility3 = () => {
        setShowPassword3(!showPassword3);
    };


    const handleSubmit = async (value) => {
        setIsProcessing(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            navigate('/account');
            // console.log(value);
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
                <span className="flex items-center md:gap-[5px]"><img src={arrowright2} alt="" /><span className='text-lg md:text-2xl manrope_bold text-[#404040]'>Change Password</span></span>
            </div>
            <div className="border bg_white p-4 rounded-lg">
                <Form layout='verticle' className='flex flex-wrap justify-between' onFinish={handleSubmit}>
                    <h4 className="manrope_semibold text-[#1A2024] w-full mb-4">Change Password</h4>
                    <hr className='text-[#f1f0f3]' />
                    <Col xs={24} md={11}>
                        <span className='manrope_medium text_black text-sm w-full'>Current Password</span>
                        <Form.Item
                            name='currentPassword'
                            className="w-full mb-[10px] mt-2 lg:mb-[18px]"
                            rules={[
                                { min: 8, message: "Please enter your current password", required: true, whitespace: true }
                            ]}
                            hasFeedback>
                            <div className="relative">
                                <div className="flex justify-end">
                                    <img
                                        src={showPassword ? eye : eyeoff}
                                        className='absolute m-2 cursor-pointer'
                                        alt="Toggle Password Visibility"
                                        onClick={togglePasswordVisibility}
                                    />
                                    <Input.Password size='large' placeholder='********' />
                                </div>
                            </div>
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={11}>
                        <span className='manrope_medium text_black text-sm w-full'>New Password</span>
                        <Form.Item
                            name='newPassword'
                            className="w-full  mb-[10px] mt-2 lg:mb-[18px]"
                            rules={[
                                { min: 8, message: "Please enter new password", required: true, whitespace: true }
                            ]}
                            hasFeedback>
                            <div className="relative">
                                <div className="flex justify-end">
                                    <img
                                        src={showPassword2 ? eye : eyeoff}
                                        className='absolute m-2 cursor-pointer'
                                        alt="Toggle Password Visibility"
                                        onClick={togglePasswordVisibility2}
                                    />
                                    <Input.Password size='large' placeholder='********' />
                                </div>
                            </div>
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <span className='manrope_medium text_black text-sm w-full'>Confirm New Password</span>
                        <Form.Item
                            name='confirmNewPassword'
                            className="w-full  mb-[10px] mt-2 lg:mb-[18px]"
                            rules={[
                                { min: 8, message: "Please match your password", required: true, whitespace: true }
                            ]}
                            hasFeedback
                        >
                            <div className="relative">
                                <div className="flex justify-end">
                                    <img
                                        src={showPassword3 ? eye : eyeoff}
                                        className='absolute m-2 cursor-pointer'
                                        alt="Toggle Password Visibility"
                                        onClick={togglePasswordVisibility3}
                                    />
                                    <Input.Password size='large' placeholder='********' />
                                </div>
                            </div>
                        </Form.Item>
                    </Col>
                    <div className='w-full flex justify-end'>
                        {!isProcessing ? (
                            <button type='submit' className='w-fit rounded-md bg_dark text_white text-sm py-[12px] px-[10px] md:py-[12px] md:px-[28px] inter_semibold flex justify-center items-center'>Save Changes</button>
                        ) : (
                            <button type='submit' className='w-fit rounded-md bg_dark text_white text-sm py-[10px] px-[3rem] md:px-[4rem] inter_semibold flex justify-center items-center' disabled>
                                <CircularProgress size={24} />
                            </button>
                        )
                        }
                    </div>
                </Form>
            </div>

        </main>
    )
}

export default ChangePassword