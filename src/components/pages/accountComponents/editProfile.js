import React, { useRef, useState } from 'react'
import { arrowright2, avatarman } from '../../icons/icon';
import { Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

const EditProfile = () => {
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);
    const inputRef = useRef(null)

    const handleSubmit = (e) => {
        e.preventDefault();
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedFile(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleButtonClick = () => {
        inputRef.current.click();
    }

    return (
        <main className='min-h-screen lg:container py-5 px-4 mx-auto'>
            <div className="flex md:gap-[5px] items-center mb-4">
                <Link to='/account' className="manrope_bold no-underline md:text-lg text-[#A6A6A6]">Profile</Link>
                <span className="flex items-center md:gap-[5px]"><img src={arrowright2} alt="" /><span className='text-lg md:text-2xl manrope_bold text-[#404040]'>Edit Account</span></span>
            </div>
            <div className="border bg_white p-4 rounded-lg">
                <Form className='flex flex-wrap justify-between mt-4' onSubmit={handleSubmit}>
                    <h4 className="manrope_semibold text_black">Edit Account</h4>
                    <hr />
                    <div className="flex max-md:flex-col gap-3 w-full items-center">
                        <Form.Group className="rounded-lg py-3 w-fit text-center" controlId="exampleForm.ControlInput1">
                            <label htmlFor="fileInput" className="cursor-pointer">
                                {selectedFile ? (
                                    <img src={selectedFile} alt='' className="w-[4.5rem] h-[4.5rem] rounded-full object-cover" />
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <img src={avatarman} alt="" className="w-[4.5rem] h-[4.5rem] rounded-full" />
                                    </div>
                                )}
                            </label>
                            <Form.Control
                                type="file"
                                id="fileInput"
                                className="visually-hidden"
                                onChange={handleFileChange}
                                ref={inputRef}
                            />
                        </Form.Group>
                        <button onClick={handleButtonClick} className="manrope_bold text_white bg_dark max-md:text-xs rounded-lg px-[14px] md:px-[24px] py-[8px]">Upload new</button>
                        <button className="manrope_bold border text_dark max-md:text-xs bg_white rounded-lg px-[18px] md:px-[34px] py-[10px]">Delete</button>
                    </div>
                    <Form.Group className="mb-[8px] lg:mb-[16px] w-full md:w-[48%]" controlId="exampleForm.ControlInput1">
                        <Form.Label className='manrope_medium text_black text-sm'>First Name</Form.Label>
                        <Form.Control type="text" className='text-sm' placeholder='First Name' />
                    </Form.Group>
                    <Form.Group className="mb-[8px] lg:mb-[16px] w-full md:w-[48%]" controlId="exampleForm.ControlInput1">
                        <Form.Label className='manrope_medium text_black text-sm'>Last Name</Form.Label>
                        <Form.Control type="text" className='text-sm' placeholder='Last Name' />
                    </Form.Group>
                    <Form.Group className="mb-[8px] lg:mb-[16px] w-full" controlId="exampleForm.ControlInput1">
                        <Form.Label className='manrope_medium text_black text-sm'>Email Address</Form.Label>
                        <Form.Control type="email" className='text-sm' placeholder='Email' />
                    </Form.Group>
                    <Form.Group className="mb-[8px] lg:mb-[16px] w-full md:w-[48%]" controlId="exampleForm.ControlInput1">
                        <Form.Label className='manrope_medium text_black text-sm'>DOB</Form.Label>
                        <Form.Control type="date" className='text-sm' />
                    </Form.Group>
                    <Form.Group className="mb-[8px] lg:mb-[16px] w-full md:w-[48%]" controlId="exampleForm.ControlInput1">
                        <Form.Label className='manrope_medium text_black text-sm'>Gender</Form.Label>
                        <Form.Select className='manrope_medium text-[#252C32] text-sm'>
                            <option>Female</option>
                            <option value="1">Male</option>
                            <option value="2">Female</option>
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-[8px] lg:mb-[16px] w-full md:w-[48%]" controlId="exampleForm.ControlInput1">
                        <Form.Label className='manrope_medium text_black text-sm'>Country of origin</Form.Label>
                        <Form.Select className='manrope_medium text-[#252C32] text-sm'>
                            <option>United State</option>
                            <option value="1">One</option>
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-[8px] lg:mb-[16px] w-full md:w-[48%]" controlId="exampleForm.ControlInput1">
                        <Form.Label className='manrope_medium text_black text-sm'>Country of residence</Form.Label>
                        <Form.Select className='manrope_medium text-[#252C32] text-sm'>
                            <option>California</option>
                            <option value="1">One</option>
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-[8px] lg:mb-[16px] w-full" controlId="exampleForm.ControlInput1">
                        <Form.Label className='manrope_medium text_black text-sm'>Communication Preference</Form.Label>
                        <Form.Select className='manrope_medium text-[#252C32] text-sm'>
                            <option>English</option>
                            <option value="1">One</option>
                        </Form.Select>
                    </Form.Group>
                    <div className='w-full flex justify-end'>
                        <button onClick={() => { navigate('/account') }} type='submit' className='w-fit rounded-md bg_dark text_white text-sm p-[8px] md:py-[12px] md:px-[28px] inter_semibold flex justify-center items-center'>Save Changes</button>
                    </div>
                </Form>
            </div>
        </main>
    )
}

export default EditProfile;