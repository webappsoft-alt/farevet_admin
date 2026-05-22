import { Form, Input, message } from 'antd';
import React, { useState, useEffect } from 'react'
import { apiRequest } from '../../api/auth_api';
import Spinner from "../Spinner";
import { Camera, X } from "lucide-react";

const DEFAULT_USER_AVATAR = "https://ui-avatars.com/api/?name=Admin&background=random";

const ChangePassword = () => {
    const [activeTab, setActiveTab] = useState("security");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isProfileProcessing, setIsProfileProcessing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFileName, setImageFileName] = useState("");

    const [passwordForm] = Form.useForm();
    const [profileForm] = Form.useForm();
    const admindata = JSON.parse(window.localStorage.getItem('login_farevet_formData'))

    useEffect(() => {
        if (admindata) {
            profileForm.setFieldsValue({
                name: admindata?.name || admindata?.username || "",
                phone: admindata?.phone || "",
                email: admindata?.email || "",
            });
        }
    }, [admindata, profileForm]);

    const handleImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);

        const body = new FormData();
        body.append("type", "upload_data");
        body.append("file", new Blob([file], { type: file.type }), file.name);

        setIsUploading(true);
        try {
            const res = await apiRequest({ body });
            if (res?.file_name) {
                setImageFileName(res.file_name);
                message.success("Image uploaded successfully");
            } else {
                message.error("Upload failed");
            }
        } catch (error) {
            console.error("Profile image upload failed:", error);
            message.error("Something went wrong");
        } finally {
            setIsUploading(false);
        }
    };

    const onProfileSubmit = async (values) => {
        setIsProfileProcessing(true);
        const body = new FormData();
        body.append("type", "update_admin_profile");
        body.append("admin_id", admindata?.user_id || admindata?.id);
        body.append("name", values.name);
        body.append("phone", values.phone);
        if (imageFileName) {
            body.append("image", imageFileName);
        }

        try {
            const res = await apiRequest({ body });
            if (res.result) {
                message.success("Profile updated successfully");
                const updatedData = { ...admindata, name: values.name, phone: values.phone };
                if (imageFileName) updatedData.image = imageFileName;
                window.localStorage.setItem('login_farevet_formData', JSON.stringify(updatedData));
            } else {
                message.success("Profile updated successfully");
            }
        } catch (err) {
            console.error(err);
            message.error("Something went wrong");
        } finally {
            setIsProfileProcessing(false);
        }
    };

    const handleSubmit2 = async (value) => {
        setIsProcessing(true)
        const body = new FormData();
        body.append("type", "admin_change_password");
        body.append("old_password", value?.password);
        body.append("new_password", value?.newPassword);
        body.append("admin_id", admindata?.user_id || admindata?.id);
        await apiRequest({ body })
            .then(async (res) => {
                setIsProcessing(false)
                if (res.result === true) {
                    message.success("Password update Successfully");
                    passwordForm.resetFields();
                } else {
                    message.error("Please check your password");
                }
            })
            .catch((error) => {
                setIsProcessing(false)
            });
    }

    return (
        <div className="mx-auto w-full  px-4 py-8 md:px-7 min-h-[calc(100vh-80px)] bg-[#FAFBFC]">
            {/* <div className="mb-4">
                <h1 className="text-3xl font-bold text-[#1A1A2E] m-0 tracking-tight">
                    Settings
                </h1>
                <p className="mt-1 text-sm text-[#9B9BB5] m-0">
                    Manage your profile and account security.
                </p>
            </div> */}

            {/* <div className="mb-6 flex space-x-6 border-b w-full border-[#E8E8F0]">
                 <button
                    onClick={() => setActiveTab("account")}
                    className={`pb-3 text-sm font-semibold transition-all border-none bg-transparent ${activeTab === "account"
                            ? "border-b-2 border-b-solid border-[#8930F9] text-[#8930F9]"
                            : "text-[#9B9BB5] hover:text-[#1A1A2E]"
                        }`}
                    style={{ borderBottomWidth: activeTab === 'account' ? '2px' : '0px' }}
                >
                    Account
                </button> 
            <button
                onClick={() => setActiveTab("security")}
                className={`pb-3 text-sm font-semibold transition-all border-none bg-transparent ${activeTab === "security"
                    ? "border-b-2 border-b-solid border-[#8930F9] text-[#8930F9]"
                    : "text-[#9B9BB5] hover:text-[#1A1A2E]"
                    }`}
                style={{ borderBottomWidth: activeTab === 'security' ? '2px' : '0px' }}
            >
                Security
            </button>
        </div> */}

            <div className="w-full">
                {activeTab === "account" && (
                    <div
                        className="w-full rounded-xl border border-[#E8E8F0] bg-white p-5 md:p-6 transition-all duration-300"
                    >
                        <h2 className="text-xl font-bold text-[#1A1A2E] m-0">
                            Update Profile
                        </h2>

                        <div className="mt-4 flex flex-col items-center">
                            <div className="relative">
                                <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-[#E8E8F0] bg-[#F9F9FB]">
                                    {isUploading ? (
                                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-full bg-white/60">
                                            <Spinner size={16} className="text-[#8930F9]" />
                                        </div>
                                    ) : null}
                                    <img
                                        src={
                                            imagePreview ||
                                            (imageFileName ? `${global.IMAGEURL}/${imageFileName}` : false) ||
                                            (admindata?.image ? `${global.IMAGEURL}/${admindata.image}` : DEFAULT_USER_AVATAR)
                                        }
                                        alt="Profile preview"
                                        onError={(e) => { e.target.src = DEFAULT_USER_AVATAR }}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <label
                                    className={`absolute bottom-0 right-0 cursor-pointer rounded-full bg-[#8930F9] p-1.5 text-white shadow-sm transition-colors hover:bg-[#7a28e0] ${isUploading ? "pointer-events-none opacity-50" : ""}`}
                                >
                                    <Camera className="h-3.5 w-3.5" />
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        disabled={isUploading}
                                    />
                                </label>
                                {(imagePreview || (imageFileName && imageFileName !== DEFAULT_USER_AVATAR)) && !isUploading ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setImagePreview(null);
                                            setImageFileName("");
                                        }}
                                        className="absolute -right-1 -top-1 rounded-full border border-[#E8E8F0] bg-white p-0.5 text-[#dc2626] shadow-sm flex items-center justify-center"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                ) : null}
                            </div>
                            <p className="mt-2 text-xs text-[#71717A]">Upload profile picture</p>
                        </div>

                        <Form
                            form={profileForm}
                            onFinish={onProfileSubmit}
                            layout="vertical"
                            className="mt-4"
                            requiredMark={false}
                        >
                            <div className="grid grid-cols-1 gap-x-4 gap-y-0 md:grid-cols-2">
                                <Form.Item
                                    label={<span className="text-sm font-medium text-gray-700">Name</span>}
                                    name='name'
                                    rules={[{ required: true, message: 'Name is required' }]}
                                >
                                    <Input size='large' className="rounded-lg" placeholder="Your full name" />
                                </Form.Item>

                                <Form.Item
                                    label={<span className="text-sm font-medium text-gray-700">Phone</span>}
                                    name='phone'
                                    rules={[{ required: true, message: 'Phone is required' }]}
                                >
                                    <Input size='large' className="rounded-lg" placeholder="Phone number" />
                                </Form.Item>

                                <div className="md:col-span-2">
                                    <Form.Item
                                        label={<span className="text-sm font-medium text-gray-700">Email</span>}
                                        name='email'
                                    >
                                        <Input size='large' className="rounded-lg bg-gray-50 text-gray-500" readOnly />
                                    </Form.Item>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isProfileProcessing || isUploading}
                                className="mt-2 w-full cursor-pointer rounded-lg bg-[#8930F9] border-none px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 flex justify-center items-center h-10"
                            >
                                {isProfileProcessing ? <Spinner size={16} color="inherit" /> : "Save Profile"}
                            </button>
                        </Form>
                    </div>
                )}

                {activeTab === "security" && (
                    <div
                        className="w-full rounded-xl border border-[#E8E8F0] bg-white p-3 md:p-5 transition-all duration-300"
                    >
                        <h2 className="text-xl font-bold text-[#1A1A2E] m-0">
                            Change Password
                        </h2>

                        <Form
                            form={passwordForm}
                            onFinish={handleSubmit2}
                            layout="vertical"
                            className="mt-4"
                            requiredMark={false}
                        >
                            <div className="grid grid-cols-1 gap-x-4 gap-y-0 md:grid-cols-2">
                                <Form.Item
                                    label={<span className="text-sm font-medium text-gray-700">Current Password</span>}
                                    name='password'
                                    rules={[{ required: true, message: 'Please enter current password' }]}
                                >
                                    <Input.Password size='large' className="rounded-lg" placeholder="Enter current password" />
                                </Form.Item>
                                {/* <div className="hidden md:block"></div> */}
                                <Form.Item
                                    label={<span className="text-sm font-medium text-gray-700">New Password</span>}
                                    name='newPassword'
                                    rules={[
                                        { required: true, message: 'Please enter new password' },
                                        { min: 6, message: 'Must be at least 6 characters' }
                                    ]}
                                >
                                    <Input.Password size='large' className="rounded-lg" placeholder="Enter new password" />
                                </Form.Item>

                                <Form.Item
                                    label={<span className="text-sm font-medium text-gray-700">Confirm Password</span>}
                                    name='confirmPassword'
                                    dependencies={['newPassword']}
                                    rules={[
                                        { required: true, message: 'Please confirm your new password' },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || getFieldValue('newPassword') === value) {
                                                    return Promise.resolve();
                                                }
                                                return Promise.reject(new Error('The passwords do not match'));
                                            },
                                        }),
                                    ]}
                                >
                                    <Input.Password size='large' className="rounded-lg" placeholder="Confirm new password" />
                                </Form.Item>
                            </div>

                            <button
                                type="submit"
                                disabled={isProcessing}
                                className="mt-2 w-full cursor-pointer rounded-lg bg-[#8930F9] border-none px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 flex justify-center items-center h-10"
                            >
                                {isProcessing ? <Spinner size={16} color="inherit" /> : "Update Password"}
                            </button>
                        </Form>
                    </div>
                )}
            </div>
        </div >
    )
}

export default ChangePassword