import React from 'react'
import { arrowright2 } from '../../icons/icon'
import { Form } from 'react-bootstrap'
import { Link } from 'react-router-dom'

const Notification = () => {
    return (
        <main className='min-h-screen lg:container py-5 px-4 mx-auto'>
            <div className="flex md:gap-[5px] items-center mb-4">
                <Link to='/account' className="manrope_bold no-underline md:text-lg text-[#A6A6A6]">Profile</Link>
                <span className="flex items-center md:gap-[5px]"><img src={arrowright2} alt="" /><span className='text-lg md:text-2xl manrope_bold text-[#404040]'>Notification</span></span>
            </div>
            <div className="border bg_white p-4 rounded-lg">
                <h4 className="manrope_semibold text-[#1A2024]">Notification</h4>
                <hr className='text-[#f1f0f3]' />
                <div className="flex justify-between items-center gap-3 my-3">
                    <span className="text-sm manrope_medium">Allow Notification</span>
                    <div className="switch">
                        <Form.Check type='switch' />
                    </div>
                </div>
                <hr className='text-[#f1f0f3]' />
                <div className="flex justify-between gap-2 my-[12px] md:my-[24px]">
                    <div className="flex flex-col gap-2">
                        <span className="text-sm manrope_medium">Discount Notification</span>
                        <span className='manrope_regular  text-xs text-[#999]'>At a mauris volutpat cras vitae convallis gravida.</span>
                    </div>
                    <div className="switch">
                        <Form.Check type='switch' />
                    </div>
                </div>
                <hr className='text-[#f1f0f3]' />
                <div className="flex justify-between gap-2 my-[12px] md:my-[24px]">
                    <div className="flex flex-col gap-2">
                        <span className="text-sm manrope_medium">Store Notification</span>
                        <span className='manrope_regular  text-xs text-[#999]'>Tincidunt integer fringilla orci in non sed.</span>
                    </div>
                    <div className="switch">
                        <Form.Check type='switch' />
                    </div>
                </div>
                <hr className='text-[#f1f0f3]' />
                <div className="flex justify-between gap-2 my-[12px] md:my-[24px]">
                    <div className="flex flex-col gap-2">
                        <span className="text-sm manrope_medium">System Notification</span>
                        <span className='manrope_regular  text-xs text-[#999]'>Tincidunt integer fringilla orci in non sed.</span>
                    </div>
                    <div className="switch">
                        <Form.Check type='switch' />
                    </div>
                </div>
                <hr className='text-[#f1f0f3]' />
                <div className="flex justify-between gap-2 my-[12px] md:my-[24px]">
                    <div className="flex flex-col gap-2">
                        <span className="text-sm manrope_medium">Location Notification</span>
                        <span className='manrope_regular  text-xs text-[#999]'>Tincidunt integer fringilla orci in non sed.</span>
                    </div>
                    <div className="switch">
                        <Form.Check type='switch' />
                    </div>
                </div>
                <hr className='text-[#f1f0f3]' />
                <div className="flex justify-between items-center gap-3">
                    <div className="flex flex-col gap-2">
                        <span className="text-sm manrope_medium">Payment Notification</span>
                        <span className='manrope_regular text-xs text-[#999]'>Facilisis facilisis velit metus ipsum, vestibulum ipsum arcu, sem lectus.</span>
                    </div>
                    <div className="switch">
                        <Form.Check type='switch' />
                    </div>
                </div>
                <hr className='text-[#f1f0f3]' />
            </div>
        </main>
    )
}

export default Notification;