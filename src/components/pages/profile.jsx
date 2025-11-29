/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/img-redundant-alt */
/* eslint-disable no-unused-vars */
import { Button, Col, Form, Input, Row, Select, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Container } from "reactstrap";
import { apiRequest } from '../../api/auth_api';
import { cameradark } from '../icons/icon';
import { useSocket } from '../../socket/socketProvider';
import { useDispatch } from 'react-redux';
import { setChatCount, setVideoCallModal } from '../../redux/videoCall';

const { Option } = Select;

const EditProfile = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const socket = useSocket()
    const [isLoading, setIsLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState(null);
    const dispatch = useDispatch()
    const [loadselectedFile, setLoadselectedFile] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const userData = JSON.parse(window.localStorage.getItem('login_farevet_formData'));
    const user_type = window.localStorage.getItem('user_type');


    const getChatCount = async () => {
        const body = new FormData()
        body.append('type', user_type === 'vet' ? 'vet_unseen_overall' : "unseen_overall")
        await apiRequest({ body }).then((res) => {
            if (res) {
                if (user_type === 'vet') {
                    dispatch(setChatCount(res.vet_unseen_overall))
                } else {
                    dispatch(setChatCount(res.unseen_overall))
                }
            }
        }).catch((err) => {
        })
    }

    useEffect(() => {
        if (userData) {
            getChatCount()
        }
    }, [])

    useEffect(() => {
        if (socket) {
            socket.on('start_call', (call) => {
                dispatch(setVideoCallModal(true))
            });
        }
    }, [socket])

    useEffect(() => {
        if (userData) {
            form.setFieldsValue({
                name: userData?.name || '',
                profession: userData?.profession || '',
                chat_status: userData?.chat_status || 'online',
                video_status: userData?.video_status || 'online',
                profile: userData?.image || '',
            });
            setImageUrl(userData?.profile);
        }
    }, [userData, form]);

    const handleFileUpload = async (e, id) => {
        const file = e.target.files[0];
        const updatedFileName = file?.name;
        const body = new FormData();
        body.append("type", "upload_data");
        body.append("file", new Blob([file], { type: file.type }), updatedFileName);
        try {
            const response = await apiRequest({ body });
            // console.log(response);
            const fileURL = URL.createObjectURL(file);
            setSelectedFile({ file_name: response.file_name, fileURL });
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (selectedFile) {
            setLoadselectedFile(selectedFile?.file_name);
        }
    }, [selectedFile]);

    const handleSubmit = async (values) => {
        setIsLoading(true);
        const body = new FormData();
        body.append("type", "update_data");
        body.append("table_name", 'vets');
        body.append("name", values?.name);
        body.append("profession", values?.profession);
        body.append("chat_status", values?.chat_status);
        body.append("video_status", values?.video_status);
        body.append("id", userData?.id);
        body.append("image", loadselectedFile ? loadselectedFile : userData?.image);
        try {
            const res = await apiRequest({ body });
            if (res?.result) {
                message.success("Vet Updated Successfully");
                form.resetFields();
                window.localStorage.setItem("login_farevet_formData", JSON.stringify({ ...userData, ...values }));
            } else {
                message.error("Update failed...");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="p-3 p-md-5 w-full">
            <Container className="bg_white p-4 rounded-3">
                <div className="flex gap-4 items-center justify-between w-full mb-4">
                    <div className="flex flex-col gap-3 w-full">
                        <div className="flex gap-4 mb-3 items-center w-full">
                            {/* <button
                                onClick={() => navigate(-1)}
                                className="bg_primary rounded-3 p-2"
                            >
                                <FaArrowLeft className="text_white" />
                            </button> */}
                            <h4 className="text_primary mb-0 plusJakara_semibold">Edit Profile</h4>
                        </div>
                    </div>
                </div>
                <div className="flex justify-center w-full flex-col items-center">
                    <Form
                        form={form}
                        layout="vertical"
                        className="w-full"
                        onFinish={handleSubmit}
                    >
                        <Row gutter={16}>
                            <Col xs={24}>
                                <Form.Item
                                    className='poppins_regular'
                                    label="Profile Picture"
                                    name='profile'
                                >
                                    <div className="flex flex-col items-start mb-3 mt-2 gap-2">
                                        <div>
                                            <label htmlFor="fileInput" className="cursor-pointer">
                                                {selectedFile ? (
                                                    <img style={{ height: '100px', width: '120px' }} src={selectedFile?.fileURL} alt="Preview" className="rounded-lg object-cover" />
                                                ) : (
                                                    <div style={{ height: '100px', width: '120px' }} className="border rounded-lg flex justify-center items-center">
                                                        {userData?.image ? (
                                                            <img style={{ height: '100px', width: '120px' }} src={`${global.IMAGEURL}/${userData?.image}`} alt="Deal Image" className="rounded-lg object-cover" />
                                                        ) : (
                                                            <img src={cameradark} alt="Camera Icon" />
                                                        )}
                                                    </div>
                                                )}
                                            </label>
                                            <Input
                                                size='large'
                                                type="file"
                                                id="fileInput"
                                                className="visually-hidden"
                                                onChange={handleFileUpload}
                                            />
                                        </div>
                                    </div>
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    className='poppins_regular'
                                    label="Name"
                                    name="name"
                                    rules={[{ required: true, message: 'Please enter your name' }]}
                                >
                                    <Input className="h-12 poppins_regular" size='large' />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    className='poppins_regular'
                                    label="Profession"
                                    name="profession"
                                    rules={[{ required: true, message: 'Please enter your profession' }]}
                                >
                                    <Input className="h-12 poppins_regular" size='large' />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    className='poppins_regular'
                                    label="Chat Status"
                                    name="chat_status"
                                    rules={[{ required: true, message: 'Please select chat status' }]}
                                >
                                    <Select size='large' className="h-12 poppins_regular">
                                        <Option value="online">Online</Option>
                                        <Option value="offline">Offline</Option>
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    className='poppins_regular'
                                    label="Video Status"
                                    name="video_status"
                                    rules={[{ required: true, message: 'Please select video status' }]}
                                >
                                    <Select size='large' className="h-12 poppins_regular">
                                        <Option value="online">Online</Option>
                                        <Option value="offline">Offline</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24}>
                                <div className="flex justify-end">
                                    <Button
                                        style={{ maxWidth: "250px" }}
                                        className="h-12 w-full bg_primary text_white"
                                        loading={isLoading}
                                        disabled={isLoading}
                                        type="primary"
                                        htmlType="submit"
                                    >
                                        Save
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </Form>
                </div>
            </Container>
        </main>
    );
};

export default EditProfile;