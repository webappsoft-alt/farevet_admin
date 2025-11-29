/* eslint-disable no-unused-vars */
import React, { useState } from 'react'
import 'react-phone-input-2/lib/style.css'
import { applelogo, eye, eyeoff, google, logoDynomo, logofarevet, techLogin } from '../icons/icon'
import { } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { Form, Input, message } from 'antd'
import { CircularProgress } from '@mui/material'
import { apiRequest } from '../../api/auth_api'

const DynomoLogin1 = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [userType, setuserType] = useState('')
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [state, setState] = useState({
        email: "",
        password: ""
    });

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleChange = (e) => {
        setState((s) => ({ ...s, [e.target.name]: e.target.value }))
    }

    const handleSubmit = (data, type) => {
        setuserType(type)
        setIsProcessing(true)
        const body = new FormData();
        body.append("type", type === 'admin' ? "admin_login" : "vet_login");
        body.append("email", data?.email);
        body.append("password", data?.password);

        apiRequest({ body })
            .then(async (res) => {
                setIsProcessing(false)
                if (res.result === true) {
                    if (type === 'admin') {
                        window.localStorage.setItem("isLogin_farevet_admin", true);
                        window.localStorage.setItem("user_type", type);
                        window.localStorage.setItem("login_farevet_formData", JSON.stringify(res));
                        message.success("Login Successfully!");
                        navigate('/dashboard');
                    } else {
                        const body2 = new FormData();
                        body2.append("type", "get_data");
                        body2.append("table_name", "vets");
                        body2.append("id", res?.user_id);
                        apiRequest({ body: body2 })
                            .then((response) => {
                                if (response?.data) {
                                    window.localStorage.setItem("isLogin_farevet_admin", true);
                                    window.localStorage.setItem("user_type", type);
                                    window.localStorage.setItem("login_farevet_formData", JSON.stringify(response?.data[0]));
                                    message.success("Login Successfully!");
                                    navigate('/profile');
                                } else {
                                    message.error("Login failed...");
                                }
                            }).catch((err) => {
                                message.error("Login failed...");
                            })
                    }
                } else {
                    message.error("Login failed...");
                }
            })
            .catch((error) => {
                console.error(error);
                setIsProcessing(false)
            });
    };

    const onFinish = (type) => {
        form.validateFields()
            .then(values => {
                handleSubmit(values, type);
            })
            .catch(errorInfo => {
            });
    };

    return (
        <>
            <div className='w-full h-screen overflow-hidden flex flex-row'>
                <div className='d-none bg_primary d-md-flex justify-content-center align-items-center p-5 w-full lg:w-1/2'>
                    <img src={techLogin} alt="ImageNotfound" />
                </div>
                <div className='w-full lg:w-1/2 h-full overflow-y-scroll p-4'>
                    <div className='flex flex-col justify-between h-[90vh] md:h-[100%]'>
                        <div className='d-flex justify-content-end w-full mb-5'>
                            <Link to='/dashboard'>
                                <img src={logofarevet} className='' alt="" />
                            </Link>
                        </div>
                        <div className='border border-white mt-5 lg:p-[24px] xl:p-[32px]'>
                            <h2 className='inter_bold text-xl mb-0 md:mb-auto md:text-2xl lg:text-3xl text_black'>Login</h2>
                            <p className='text_secondary max-md:text-sm inter_regular my-[8px]'>Login to your account</p>

                            <Form
                                form={form}
                                layout='verticle'
                                className='flex flex-wrap justify-between'
                            >
                                <span className='manrope_medium mb-2 text_black text-lg w-full'>Email Address</span>
                                <Form.Item
                                    name='email'
                                    className="mb-3 w-full"
                                    rules={[
                                        {
                                            type: 'email',
                                            message: 'The Input is not valid E-mail!',
                                        },
                                        {
                                            required: true,
                                            message: 'Please Input your E-mail!',
                                        },
                                    ]}>
                                    <Input size='large' placeholder='Your Email Address' onChange={handleChange} />
                                </Form.Item>
                                <span className='manrope_medium mb-2 text_black text-lg w-full'>Password</span>
                                <Form.Item
                                    name='password'
                                    className="w-full mb-0"
                                    rules={[
                                        { min: 6, message: "Please Enter a strong Password", required: true, whitespace: true }
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
                                            <Input.Password size='large' placeholder='********' onChange={handleChange} />
                                        </div>
                                    </div>
                                </Form.Item>

                                <div className='w-full my-3 flex flex-col gap-3'>
                                    <>
                                        <button
                                            type='button'
                                            disabled={isProcessing}
                                            onClick={() => onFinish('admin')}
                                            className='w-full rounded-md bg_primary text_white p-2 text-lg manrope_regular flex justify-center items-center'
                                        >
                                            {(isProcessing && userType === 'admin') ? <CircularProgress style={{ color: 'white' }} size={24} className='text_white' /> : 'Login as Admin'}
                                        </button>
                                        <div className="flex justify-center w-full">
                                            <h5 className="manrope_medium mb-0">or</h5>
                                        </div>
                                        <button
                                            type='button'
                                            disabled={isProcessing}
                                            onClick={() => onFinish('vet')}
                                            style={{ backgroundColor: "#2563EB" }}
                                            className='w-full rounded-md bg-[#2563EB] text_white p-2 text-lg manrope_regular flex justify-center items-center'
                                        >
                                            {(isProcessing && userType === 'vet') ? <CircularProgress style={{ color: 'white' }} size={24} className='text_white' /> : 'Login as Vet'}
                                        </button>
                                    </>

                                </div>
                            </Form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default DynomoLogin1;