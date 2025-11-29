/* eslint-disable no-unused-vars */
import { Form, Input, Select, Switch, TreeSelect } from 'antd';
import React, { useState } from 'react'
import { ArrowLeft, Check, Plus, X } from 'react-feather';
import { useNavigate } from 'react-router-dom';
import { cameradark, searchLogin, spotlight1, spotlight2, spotlight3, spotlight4 } from '../../icons/icon';
const Option = Select

const reportedByArray = [
    { title: 'Admin' },
    { title: 'User' },
    { title: 'Veterinarian' },
]
const petsArray = [
    { title: 'Dog' },
    { title: 'Cat' },
    { title: 'Other' },
]

const costOfPet = [
    { title: 'Extra Cost' },
    { title: 'Average Cost' },
    { title: 'Per min' },
    { title: 'Per Hour' },
    { title: 'day' },
    { title: 'Night' },
]

const serviceArray = [
    { title: 'Checkup' },
    { title: 'Vaccine/Shots' },
    { title: 'Emergency' },
    { title: 'Testing' },
    { title: 'Cardiology' },
    { title: 'Ears' },
    { title: 'Identification' },
    { title: 'Procedures' },
    { title: 'Eyes' },
    { title: 'Radiographs' },
    { title: 'Dentistry' },
    { title: 'Surgery' },
]
const treeData = [
    { value: 'small', title: 'Samll ( 20 < lbs)' },
    { value: 'medium', title: 'Medium ( 21-40 lbs)' },
    { value: 'large', title: 'Large ( 41-90 lbs)' },
    { value: 'extraLarge', title: 'Extra Large ( 90+ lbs)' },
]
const CreateReport = () => {
    const [pet, setPet] = useState([0])
    const [cost, setCost] = useState([0])
    const [value, setValue] = useState();
    const [selectedOption, setSelectedOption] = useState('address');
    const [reportedBy, setReportedBy] = useState([0])
    const [servicePet, setServicePet] = useState([0])
    const navigate = useNavigate();

    const handleServiceSelect = (categoryId) => {
        if (servicePet.includes(categoryId)) {
            setServicePet(servicePet.filter(id => id !== categoryId));
        } else {
            setServicePet([...servicePet, categoryId]);
        }
    };

    const handleReportedBy = (categoryId) => {
        if (reportedBy.includes(categoryId)) {
            setReportedBy(reportedBy.filter(id => id !== categoryId));
        } else {
            setReportedBy([...reportedBy, categoryId]);
        }
    };
    const handleCost = (categoryId) => {
        if (cost.includes(categoryId)) {
            setCost(cost.filter(id => id !== categoryId));
        } else {
            setCost([...cost, categoryId]);
        }
    };

    const handlePetSelect = (categoryId) => {
        if (pet.includes(categoryId)) {
            setPet(pet.filter(id => id !== categoryId));
        } else {
            setPet([...pet, categoryId]);
        }
    };

    const handleSelectChange = (value) => {
        setSelectedOption(value);
    };

    const handleSubmit = (e) => {
        navigate('/reported-cost')
    }

    return (
        <main className='container m-auto min-h-screen py-4'>
            <div className="flex items-center gap-3 mb-4">
                <button onClick={() => { navigate('/reported-cost') }} className="flex items-center justify-center w-[36px] h-[36px] bg_primary rounded-lg">
                    <ArrowLeft className='text_white' />
                </button>
                <span className="inter_semibold text-xl md:text-2xl text_dark">Create Report cost</span>
            </div>
            <Form layout='verticle' onFinish={handleSubmit} className="w-full lg:w-[90%] xl:w-[80%] mx-auto bg_white rounded-lg shadow-md p-[1rem] md:p-[2rem]">
                <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
                    <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
                        Search By
                    </span>
                    <div className='w-full md:w-[70%] flex flex-wrap gap-2 items-center'>
                        <div>
                            <Select
                                size='large'
                                className='inter_medium text_dark text-sm'
                                allowClear
                                defaultValue={selectedOption}
                                onChange={handleSelectChange}
                            >
                                <Option value="address">Address</Option>
                                <Option value="name">Name</Option>
                            </Select>
                        </div>
                        <input
                            type="text"
                            className='border p-2 rounded-md bg_white w-1/2'
                            placeholder={`${selectedOption === "address" ? "Address" : "Name"}`}
                            name=""
                            id=""
                        />
                    </div>
                </div>
                <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
                    <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
                        Type of Pet
                    </span>
                    <div className='w-full md:w-[70%] flex flex-wrap gap-2 items-center'>
                        {petsArray.map((item, i) => (
                            <button
                                key={i}
                                type='button'
                                className={`border cursor-pointer rounded-lg gap-1 px-[1rem] py-2 inter_medium text-sm flex justify-center items-center ${pet.includes(i) ? 'bg-[#F8F2FD] text_primary' : 'bg_white text_secondary'}`}
                                onClick={() => handlePetSelect(i)}
                            >
                                {item.title}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
                    <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
                        Service
                    </span>
                    <div className='w-full md:w-[70%] flex flex-wrap gap-2 items-center'>
                        {serviceArray.map((item, i) => (
                            <button
                                key={i}
                                type='button'
                                className={`border cursor-pointer rounded-lg gap-1 px-[1rem] py-2 inter_medium text-sm flex justify-center items-center ${servicePet.includes(i) ? 'bg-[#F8F2FD] text_primary' : 'bg_white text_secondary'}`}
                                onClick={() => handleServiceSelect(i)}
                            >
                                {item.title}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
                    <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
                        Subservice
                    </span>
                    <div className='w-full md:w-[70%] flex flex-wrap gap-2 items-center'>
                        <Form.Item
                            className="w-full mb-0"
                            name='subService'
                            rules={[
                                {
                                    required: true,
                                    message: 'Please Select your Subservice',
                                },
                            ]}
                        >
                            <Select size="large" defaultValue='1' className="inter_medium text_dark text-sm" allowClear>
                                <Select.Option value="1">Olivia</Select.Option>
                                <Select.Option value="2">Olivia</Select.Option>
                                <Select.Option value="3">Olivia</Select.Option>
                            </Select>
                        </Form.Item>
                    </div>
                </div>
                <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
                    <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
                        Description
                    </span>
                    <div className='w-full md:w-[70%] flex flex-wrap gap-2 items-center'>
                        <Form.Item
                            className="w-full mb-0"
                            name='descriptionPet'
                            rules={[

                                {
                                    required: true,
                                    message: 'Please enter your description',
                                },
                            ]}
                        >
                            <Input.TextArea rows={2} size='large' />
                        </Form.Item>
                    </div>
                </div>
                <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
                    <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
                        Amount
                    </span>
                    <div className='w-full md:w-[70%] flex flex-wrap gap-2 items-center'>
                        <Form.Item
                            className="w-full mb-0"
                            name='amountPet'
                            rules={[
                                {
                                    required: true,
                                    message: 'Please enter the amount',
                                },
                            ]}
                        >
                            <Input type='number' rows={2} size='large' />
                        </Form.Item>
                    </div>
                </div>
                <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
                    <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
                        Cost
                    </span>
                    <div className='w-full md:w-[70%] flex flex-wrap gap-2 items-center'>
                        {costOfPet.map((item, i) => (
                            <button
                                key={i}
                                type='button'
                                className={`border cursor-pointer rounded-lg gap-1 px-[1rem] py-2 inter_medium text-sm flex justify-center items-center ${cost.includes(i) ? 'bg-[#F8F2FD] text_primary' : 'bg_white text_secondary'}`}
                                onClick={() => handleCost(i)}
                            >
                                {item.title}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
                    <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
                        Weight(LBS)
                    </span>
                    <div className='w-full md:w-[70%] flex flex-wrap gap-2 items-center'>
                        <Form.Item
                            className="w-full mb-0"
                            name='weightOfPet'
                            rules={[
                                {
                                    required: true,
                                    message: 'Please Select weight',
                                },
                            ]}
                        >
                            <TreeSelect
                                showSearch
                                style={{
                                    width: '100%',
                                }}
                                value={value}
                                size='large'
                                placeholder="Samll ( 20 < lbs)"
                                allowClear
                                treeDefaultExpandAll
                                onChange={(e) => { setValue(e) }}
                                treeData={treeData}
                            />
                        </Form.Item>
                    </div>
                </div>
                <div className="flex gap-3 mb-4 w-full max-md:flex-col justify-start">
                    <span className="inter_medium text-sm text_dark w-full md:w-[30%]">
                        Service Reported By
                    </span>
                    <div className='w-full md:w-[70%] flex flex-wrap gap-2 items-center'>
                        {reportedByArray.map((item, i) => (
                            <button
                                key={i}
                                type='button'
                                className={`border cursor-pointer rounded-lg gap-1 px-[1rem] py-2 inter_medium text-sm flex justify-center items-center ${reportedBy.includes(i) ? 'bg-[#F8F2FD] text_primary' : 'bg_white text_secondary'}`}
                                onClick={() => handleReportedBy(i)}
                            >
                                {item.title}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end w-full">
                    <button type='submit' className="flex justify-center bg_primary py-[12px] px-[1rem] rounded-lg items-center button_shadow">
                        <span className="inter_semibold text-sm text_white">Create Report Cost</span>
                    </button>
                </div>
            </Form>
        </main>
    )
}

export default CreateReport;