/* eslint-disable no-unused-vars */
import Spinner from "../../Spinner";
import { Form, Input, message, Upload, Tag, Space, Button } from 'antd';
import React, { useRef, useState } from 'react';
import { ArrowLeft, Upload as UploadIcon, Plus } from 'react-feather';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../../../api/auth_api';
import Autocomplete from "react-google-autocomplete";
import { cameradark } from '../../icons/icon';

const { TextArea } = Input;

const CreateVetBills = () => {
    const { type } = useParams();
    const [isProcessing, setIsProcessing] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [form] = Form.useForm();
    const [selectedItem2, setselectedItem2] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [loadselectedFile, setLoadselectedFile] = useState(null);
    const [fileLoading, setfileLoading] = useState(false);
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [inputVisible, setInputVisible] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef(null);
    const [locationDetails, setLocationDetails] = useState({
        currentLocation: null,
        latitude: null,
        longitude: null,
    });
    const autocompleteRef = useRef();
    const navigate = useNavigate();

    const typeMapping = {
        'charity': { title: 'Charity', cat_type: 'charity', tagsTitle: 'Notes' },
        'financing': { title: 'Financing', cat_type: 'financing', tagsTitle: 'Terms Text' },
        'clinics': { title: 'Clinics', cat_type: 'clinics', tagsTitle: 'Tags' }
    };

    const handleFileChange3 = async (e, id) => {
        const file = e.target.files[0];
        const updatedFileName = file?.name;
        const body = new FormData();
        setfileLoading(true)
        body.append("type", "upload_data");
        body.append("file", new Blob([file], { type: file.type }), updatedFileName);
        try {
            const response = await apiRequest({ body });
            const fileURL = URL.createObjectURL(file);
            setSelectedFile({ file_name: response.file_name, fileURL });
            setLoadselectedFile(response?.file_name)
            setfileLoading(false)
        } catch (error) {
            setfileLoading(false)
            console.log(error);
        }
    };

    const currentType = typeMapping[type] || { title: 'Unknown', cat_type: '' };

    const handleSubmit = async (values) => {
        setIsProcessing(true);
        try {
            const body = new FormData();
            body.append("type", "add_data");
            body.append("table_name", 'bill_covering');
            body.append("title", values.title);
            body.append("description", values.description);
            body.append("button_text", values.button_text);
            body.append("link", values.link);
            body.append("cat_type", currentType.cat_type);
            body.append("image", loadselectedFile);

            if (currentType.cat_type === 'charity' || currentType.cat_type === 'financing') {
                body.append("tags", values.tags || '');
            } else if (currentType.cat_type === 'clinics') {
                // Use the tags state array instead of parsing from input
                const tagsJson = JSON.stringify(tags);
                body.append("tags", tagsJson);
            }

            if (currentType.cat_type === 'clinics') {
                body.append("clinic_name", values.clinic_name || '');
                body.append("address", (locationDetails?.currentLocation));
                body.append("lat", (locationDetails?.latitude));
                body.append("lng", (locationDetails?.longitude));
            }

            const res = await apiRequest({ body });

            if (res) {
                message.success(`${currentType.title} Added Successfully`);
                form.resetFields();
                setTags([]);
                navigate(`/vet-bills/${type}`);
            } else {
                message.error("Creation failed...");
            }
        } catch (error) {
            console.error(error);
            message.error("An error occurred while adding the record");
        } finally {
            setIsProcessing(false);
        }
    };


    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleTagInputKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag();
        }
    };

    return (
        <main className='container m-auto min-h-screen py-4'>
            <div className="flex items-center gap-3 mb-4">
                <button onClick={() => { navigate(`/vet-bills/${type}`) }} className="flex items-center justify-center w-[36px] h-[36px] bg_primary rounded-lg">
                    <ArrowLeft className='text_white' />
                </button>
                <span className="inter_semibold text-xl md:text-2xl text_dark">Create {currentType.title}</span>
            </div>
            <Form
                layout='vertical'
                form={form}
                onFinish={handleSubmit}
                className="w-full lg:w-[90%] xl:w-[80%] mx-auto bg_white rounded-lg shadow-md p-[1rem] md:p-[2rem]"
            >
                <div className='w-full'>
                    <Form.Item
                        label={<h6 className="plusJakara_medium mb-0">Upload Image</h6>}
                        name='image'
                        className="rounded-lg w-fit text-center"
                    >
                        <div>
                            <label htmlFor="fileInput" className="cursor-pointer">
                                {selectedFile ? (
                                    <img style={{ height: '100px', width: '120px' }} src={selectedFile?.fileURL} alt="Preview" className="rounded-lg object-cover" />
                                ) : selectedItem2?.image ? (
                                    <img style={{ height: '100px', width: '120px' }} src={selectedItem2?.url + selectedItem2.image} alt="Current Logo" className="rounded-lg object-cover" />
                                ) : (
                                    <div style={{ height: '100px', width: '120px' }} className="border rounded-lg flex justify-center items-center">
                                        <img src={cameradark} alt="Camera Icon" />
                                    </div>
                                )}
                            </label>
                            <Input
                                size='large'
                                type="file"
                                id="fileInput"
                                className="visually-hidden"
                                onChange={handleFileChange3}
                            />
                        </div>
                    </Form.Item>
                </div>
                <Form.Item
                    label={<h6 className="plusJakara_medium mb-0">{currentType?.cat_type === 'clinics' ? 'Clinic Name' : 'Title'}</h6>}
                    name="title"
                    rules={[{ required: true, message: `Please enter the ${currentType?.cat_type === 'clinics' ? 'Clinic Name' : 'Title'}!` }]}
                >
                    <Input
                        className='plusJakara_regular'
                        placeholder="Enter title" size="large" />
                </Form.Item>

                <Form.Item
                    label={<h6 className="plusJakara_medium mb-0">Description</h6>}
                    name="description"
                    rules={[{ required: true, message: 'Please enter the description!' }]}
                >
                    <TextArea
                        className='plusJakara_regular' rows={4}
                        placeholder="Enter description" />
                </Form.Item>

                <Form.Item
                    label={<h6 className="plusJakara_medium mb-0">Button Text</h6>}
                    name="button_text"
                    rules={[{ required: true, message: 'Please enter button text!' }]}
                >
                    <Input
                        className='plusJakara_regular'
                        placeholder="Enter button text" size="large" />
                </Form.Item>

                <Form.Item
                    label={<h6 className="plusJakara_medium mb-0">Link</h6>}
                    name="link"
                >
                    <Input
                        className='plusJakara_regular'
                        placeholder="Enter link URL" size="large" />
                </Form.Item>

                {currentType.cat_type === 'clinics' && (
                    <>
                        <h6 className="plusJakara_medium mb-1">Address</h6>
                        <div className='w-full mb-3'>
                            <Autocomplete
                                className='w-full border rounded-lg inter_medium ps-3 py-[10px]'
                                apiKey='AIzaSyBYV5W31rEUeTVj2Ws_qJuhMX7IudkRlHw'
                                ref={autocompleteRef}
                                options={{
                                    types: ['address'],
                                }}
                                onPlaceSelected={(place) => {
                                    setLocationDetails({
                                        currentLocation: place?.formatted_address,
                                        latitude: place?.geometry?.location.lat(),
                                        longitude: place?.geometry?.location.lng(),
                                    });
                                }}
                            />
                        </div>
                    </>
                )}

                {currentType.cat_type === 'clinics' ? (
                    <>
                        <h6 className="plusJakara_medium mb-0">{currentType.tagsTitle}</h6>
                        <div className="flex flex-wrap gap-2 my-3">
                            {tags.map((tag, index) => (
                                <Tag
                                    key={index}
                                    closable
                                    onClose={() => handleRemoveTag(tag)}
                                    className="flex items-center bg-gray-100 py-1 px-2 rounded-md"
                                >
                                    {tag}
                                </Tag>
                            ))}
                        </div>
                        <div className="flex gap-3 items-center">
                            <Input
                                className='plusJakara_regular flex-1'
                                placeholder="Enter a tag"
                                size="large"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={handleTagInputKeyPress}
                            />
                            <Button
                                type="primary"
                                className="ml-2 flex items-center justify-center bg_primary"
                                onClick={handleAddTag}
                                icon={<Plus size={16} />}
                            />
                        </div>
                    </>
                ) : (
                    <Form.Item
                        label={<h6 className="plusJakara_medium mb-0">{currentType.tagsTitle}</h6>}
                        name="tags"
                    >
                        <TextArea
                            className='plusJakara_regular' rows={4}
                            placeholder={`Enter ${currentType.tagsTitle.toLowerCase()}`} />
                    </Form.Item>
                )}

                <Form.Item className='w-full flex mt-3 justify-end'>
                    <button
                        disabled={isProcessing || fileLoading}
                        type="submit"
                        className="bg_primary rounded-lg text_white inter_semibold px-5 py-2"
                    >
                        {(isProcessing) ? <Spinner size={18} className="text_white" /> : 'Create'}
                    </button>
                </Form.Item>
            </Form>
        </main>
    );
};

export default CreateVetBills;