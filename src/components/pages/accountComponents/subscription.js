import React, { useState } from 'react'
import { arrowright2 } from '../../icons/icon';
import { bronze, gold, platinum, silver } from '../../icons/icon';
import { Link, useNavigate } from 'react-router-dom';

const Subscription = () => {
    const navigate = useNavigate();
    const [select, setSelect] = useState('monthly')
    const [selectSubscription, setSelectSubscription] = useState('bronze')
    return (
        <main className='min-h-screen lg:container py-5 px-4 mx-auto'>
            <div className="flex md:gap-[5px] items-center mb-4">
                <Link to='/account' className="manrope_bold no-underline md:text-lg text-[#A6A6A6]">Profile</Link>
                <span className="flex items-center md:gap-[5px]"><img src={arrowright2} alt="" /><span className='text-lg md:text-2xl manrope_bold text-[#404040]'>Subscription Plan</span></span>
            </div>
            <div className="border bg_white p-4 rounded-lg">
                <h4 className="manrope_semibold text_black">Subscription Plan</h4>
                <hr className='text-[#f1f0f3]' />
                <div className="border rounded-xl bg_dark p-1 flex mb-4 gap-1 w-fit">
                    <button onClick={() => { setSelect('monthly') }} className={`manrope_semibold text-sm px-[24px] md:px-[48px] py-[2px] rounded-lg ${select === 'monthly' ? 'bg_white text_dark' : 'bg_dark text_white'}`}>Monthly</button>
                    <button onClick={() => { setSelect('yearly') }} className={`manrope_semibold text-sm px-[24px] md:px-[48px] py-[2px] rounded-lg ${select === 'yearly' ? 'bg_white text_dark' : 'bg_dark text_white'}`}>Yearly</button>
                </div>
                <div className="flex gap-y-4 justify-between w-full flex-wrap items-center mb-4">
                    <div
                        onClick={() => { setSelectSubscription("bronze") }}
                        className={`w-full md:w-[49%] cursor-pointer border rounded-lg px-[16px] py-[12px] ${selectSubscription === 'bronze' ? 'bg_dark' : 'bg_white shadow-sm'} `}>
                        <div className="flex justify-between mb-2 items-center">
                            <div className="flex items-center gap-1">
                                <img src={bronze} alt="" />
                                <span className="manrope_semibold text-sm text-[#CD7F32]">Bronze</span>
                            </div>
                            <span className={`inter_semibold ${selectSubscription === 'bronze' ? 'text_white' : 'text_black'} text-sm`}>$893</span>
                        </div>
                        <div className="lg:w-[80%]">
                            <p className={`manrope_regular text-xs ${selectSubscription === 'bronze' ? 'text_white' : 'text-[#00010080]'}`}>
                                Unlock basic premium features, including priority service booking and exclusive discounts.
                            </p>
                        </div>
                    </div>
                    <div
                        onClick={() => { setSelectSubscription("silver") }}
                        className={`w-full md:w-[49%] cursor-pointer border rounded-lg bg_white shadow-sm px-[16px] py-[12px] ${selectSubscription === 'silver' ? 'bg_dark' : 'bg_white shadow-sm'}`}>
                        <div className="flex justify-between mb-2 items-center">
                            <div className="flex items-center gap-1">
                                <img src={silver} alt="" />
                                <span className="manrope_semibold text-sm text-[#6E7C87]">Silver</span>
                            </div>
                            <span className={`inter_semibold ${selectSubscription === 'silver' ? 'text_white' : 'text_black'} text-sm`}>$893</span>
                        </div>
                        <div className="">
                            <p className={`manrope_regular text-xs ${selectSubscription === 'silver' ? 'text_white' : 'text-[#00010080]'}`}>
                                Enjoy enhanced benefits, such as premium customer support and access to premium service providers.
                            </p>
                        </div>
                    </div>
                    <div
                        onClick={() => { setSelectSubscription("gold") }}
                        className={`w-full md:w-[49%] cursor-pointer border rounded-lg bg_white shadow-sm px-[16px] py-[12px] ${selectSubscription === 'gold' ? 'bg_dark' : 'bg_white shadow-sm'}`}>
                        <div className="flex justify-between mb-2 items-center">
                            <div className="flex items-center gap-1">
                                <img src={gold} alt="" />
                                <span className="manrope_semibold text-sm text-[#D29404]">Gold</span>
                            </div>
                            <span className={`inter_semibold ${selectSubscription === 'gold' ? 'text_white' : 'text_black'} text-sm`}>$893</span>
                        </div>
                        <div className="">
                            <p className={`manrope_regular text-xs ${selectSubscription === 'gold' ? 'text_white' : 'text-[#00010080]'}`}>
                                Take advantage of advanced features, including personalized recommendations and VIP access to events.
                            </p>
                        </div>
                    </div>
                    <div
                        onClick={() => { setSelectSubscription("platinum") }}
                        className={`w-full md:w-[49%] cursor-pointer border rounded-lg bg_white shadow-sm px-[16px] py-[12px] ${selectSubscription === 'platinum' ? 'bg_dark' : 'bg_white shadow-sm'}`}>
                        <div className="flex justify-between mb-2 items-center">
                            <div className="flex items-center gap-1">
                                <img src={platinum} alt="" />
                                <span className="manrope_semibold text-sm text-[#7B61FF]">Platinum</span>
                            </div>
                            <span className={`inter_semibold ${selectSubscription === 'platinum' ? 'text_white' : 'text_black'} text-sm`}>$893</span>
                        </div>
                        <div className="">
                            <p className={`manrope_regular text-xs ${selectSubscription === 'platinum' ? 'text_white' : 'text-[#00010080]'}`}>
                                Experience the ultimate premium experience with top-tier benefits, including 24/7 concierge support and exclusive perks.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end w-full">
                    <button onClick={() => { navigate('/account/subscription/add-plan') }} type='submit' className="px-[20px] py-2 text_white rounded-lg bg_dark inter_semibold">Add Plan</button>
                </div>
            </div>
        </main>
    )
}

export default Subscription;