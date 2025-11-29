import { Form, Input, message } from 'antd';
import React, { useState } from 'react'
import { apiRequest } from '../../api/auth_api';
import { CircularProgress } from '@mui/material';

const ChangePassword = () => {
    const [isProcessing, setIsProcessing] = useState(false)
    const [form] = Form.useForm();
    const admindata = JSON.parse(window.localStorage.getItem('login_farevet_formData'))

    const handleSubmit2 = async (value) => {
        setIsProcessing(true)
        const body = new FormData();
        body.append("type", "admin_change_password");
        body.append("old_password", value?.password);
        body.append("new_password", value?.newPassword);
        body.append("admin_id", admindata?.user_id);
        await apiRequest({ body })
            .then(async (res) => {
                setIsProcessing(false)
                if (res.result === true) {
                    message.success("Password update Successfully");
                    form.setFieldsValue({
                        password: '',
                        newPassword: '',
                        confirmPassword: '',
                    })
                    form.resetFields();
                } else {
                    message.error("Please check your password");
                }
            })
            .catch((error) => {
                setIsProcessing(false)
            })
            .finally(() => {
                setIsProcessing(false)
            });
    }


    return (
        <main className="container m-auto height_calc flex-grow flex flex-col p-3">
            <div className="flex w-full justify-between my-4 items-center flex-wrap">
                <span className="text_dark plusJakara_medium text-2xl md:text-3xl">
                    Profile
                </span>
            </div>
            <div className='flex justify-center w-full flex-col items-center'>
                <h3 className="text_dark mb-4 mt-3 text-center manrope_regular">
                    Change Password
                </h3>
                <Form
                    form={form}
                    onFinish={handleSubmit2}
                    className="flex justify-center flex-col w-100 my-4" style={{ maxWidth: '500px' }}>
                    <h6 className='plusJakara_regular text_secondary w-full'>Current Password*</h6>
                    <Form.Item
                        name='password'
                        className="w-full mb-4 plusJakara_regular"
                        rules={[
                            { required: true, whitespace: false, message: 'Please enter password' },
                        ]}
                        hasFeedback
                    >
                        <Input.Password size='large' />
                    </Form.Item>
                    <h6 className='plusJakara_regular text_secondary w-full'>New Password</h6>
                    <Form.Item
                        name='newPassword'
                        className="w-full mb-4 plusJakara_regular"
                        rules={[
                            { required: true, whitespace: false, message: 'Please enter new password' },
                        ]}
                        hasFeedback
                    >
                        <Input.Password size='large' />
                    </Form.Item>
                    <h6 className='plusJakara_regular text_secondary w-full'>Confirm New Password*</h6>
                    <Form.Item
                        name='confirmPassword'
                        className="w-full mb-4 plusJakara_regular"
                        rules={[
                            { required: true, whitespace: false, message: 'Please enter confirm password' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('The passwords you entered do not match'));
                                },
                            }),
                        ]}
                        hasFeedback
                    >
                        <Input.Password size='large' />
                    </Form.Item>
                    <div className="flex items-center justify-center gap-4 w-full">
                        <button
                            className="bg_primary w-full px-5 py-2 rounded-3 plusJakara_regular text_white"
                            disabled={isProcessing}
                        >
                            {isProcessing ? <CircularProgress size={16} color='inherit' /> : 'Continue'}
                        </button>
                    </div>
                </Form>
            </div>
        </main>
    )
}

export default ChangePassword