/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import { calenderdashboard, revenue2dashboard, rewarddashboard, userdashboard, workdashboard } from '../icons/icon';
import { apiRequest } from '../../api/auth_api';
import { useDispatch } from 'react-redux';
import { setChatCount } from '../../redux/videoCall';

const Dashboard = () => {
    const [data, setdata] = useState([])
    const userData = JSON.parse(window.localStorage.getItem('login_farevet_formData'))
    const user_type = window.localStorage.getItem('user_type');
    const dispatch = useDispatch()


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

    const handleFetchData = async () => {
        try {
            const body = new FormData();
            body.append("type", "get_dashboard_count");
            // body.append("table_name", 'get_dashboard_count');
            const res = await apiRequest({ body });
            // console.log(res);
            if (res) {
                setdata(res);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        handleFetchData()
    }, [])


    return (
        <main className='container m-auto height_calc flex justify-center items-center py-4'>
            <div className="flex justify-center gap-4 flex-wrap items-center">
                <div className="border border-white bg_white rounded-lg shadow-sm w-full sm:max-w-[240px] md:max-w-[380px] min-h-[210px] gap-3 flex items-center justify-center">
                    <div className="flex justify-center items-center rounded-lg w-[50px] h-[50px] bg-[#F9F1FF]">
                        <img src={userdashboard} alt="" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="inter_semibold text-sm text_secondary">Users</span>
                        <span className="text_dark inter_semibold text-3xl">{data?.all_users || '0'}</span>
                    </div>
                </div>
                <div className="border border-white bg_white rounded-lg shadow-sm w-full sm:max-w-[240px] md:max-w-[380px] min-h-[210px] gap-3 flex items-center justify-center">
                    <div className="flex justify-center items-center rounded-lg w-[50px] h-[50px] bg-[#FFF9ED]">
                        <img src={workdashboard} alt="" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="inter_semibold text-sm text_secondary">Business</span>
                        <span className="text_dark inter_semibold text-3xl">{data?.all_businesses || '0'}</span>
                        <div className="flex flex-col gap-1">
                            <div className="flex gap-1 item-center">
                                <span className="text-sm inter_regular text_secondary">Pofessional:</span>
                                <span className="text-sm inter_semibold text_dark">{data?.professional || '0'}</span>
                            </div>
                            <div className="flex gap-1 item-center">
                                <span className="text-sm inter_regular text_secondary">Unclaimed:</span>
                                <span className="text-sm inter_semibold text_dark">{data?.unclaimed || '0'}</span>
                            </div>
                            <div className="flex gap-1 item-center">
                                <span className="text-sm inter_regular text_secondary">Claimed:</span>
                                <span className="text-sm inter_semibold text_dark">{data?.claimed || '0'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="border border-white bg_white rounded-lg shadow-sm w-full sm:max-w-[240px] md:max-w-[380px] min-h-[210px] gap-3 flex items-center justify-center">
                    <div className="flex justify-center items-center rounded-lg w-[50px] h-[50px] bg-[#EDFFFA]">
                        <img src={calenderdashboard} alt="" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="inter_semibold text-sm text_secondary">Appointment</span>
                        <span className="text_dark inter_semibold text-3xl">{data?.all_orders || '0'}</span>
                        <div className="flex flex-col gap-1">
                            <div className="flex gap-1 item-center">
                                <span className="text-sm inter_regular text_secondary">Confirmed:</span>
                                <span className="text-sm inter_semibold text_dark">{data?.completed_orders || '0'}</span>
                            </div>
                            <div className="flex gap-1 item-center">
                                <span className="text-sm inter_regular text_secondary">Pending:</span>
                                <span className="text-sm inter_semibold text_dark">{data?.pending_orders || '0'}</span>
                            </div>
                            <div className="flex gap-1 item-center">
                                <span className="text-sm inter_regular text_secondary">Canceled:</span>
                                <span className="text-sm inter_semibold text_dark">{data?.cancelled_orders || '0'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* <div className="border border-white bg_white rounded-lg shadow-sm w-full sm:max-w-[240px] md:max-w-[380px] min-h-[210px] gap-3 flex items-center justify-center">
                    <div className="flex justify-center items-center rounded-lg w-[50px] h-[50px] bg-[#FFEBF7]">
                        <img src={revenuedashboard} alt="" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="inter_semibold text-sm text_secondary">Revenue (CAD)</span>
                        <span className="text_dark inter_semibold text-3xl">$ 0</span>
                        <div className="flex flex-col gap-1">
                            <div className="flex gap-1 item-center">
                                <span className="text-sm inter_regular text_secondary">Booking:</span>
                                <span className="text-sm inter_semibold text_dark">{data?.all_businesses || '0'}</span>
                            </div>
                            <div className="flex gap-1 item-center">
                                <span className="text-sm inter_regular text_secondary">Ads:</span>
                                <span className="text-sm inter_semibold text_dark">{data?.all_businesses || '0'}</span>
                            </div>
                        </div>
                    </div>
                </div> */}
                <div className="border border-white bg_white rounded-lg shadow-sm w-full sm:max-w-[240px] md:max-w-[380px] min-h-[210px] gap-3 flex items-center justify-center">
                    <div className="flex justify-center items-center rounded-lg w-[50px] h-[50px] bg-[#EDF7FF]">
                        <img src={revenue2dashboard} alt="" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="inter_semibold text-sm text_secondary">Revenue (USD)</span>
                        <span className="text_dark inter_semibold text-3xl">{parseInt(data?.appointment_amount) + parseInt(data?.order_amount) || '0'}</span>
                        <div className="flex flex-col gap-1">
                            <div className="flex gap-1 item-center">
                                <span className="text-sm inter_regular text_secondary">Order:</span>
                                <span className="text-sm inter_semibold text_dark">{data?.order_amount || '0'}</span>
                            </div>
                            <div className="flex gap-1 item-center">
                                <span className="text-sm inter_regular text_secondary">Appointment:</span>
                                <span className="text-sm inter_semibold text_dark">{data?.appointment_amount || '0'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="border border-white bg_white rounded-lg shadow-sm w-full sm:max-w-[240px] md:max-w-[380px] min-h-[210px] gap-3 flex items-center justify-center">
                    <div className="flex justify-center items-center rounded-lg w-[50px] h-[50px] bg-[#FFEFED]">
                        <img src={rewarddashboard} alt="" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="inter_semibold text-sm text_secondary">Rewards</span>
                        <span className="text_dark inter_semibold text-3xl">{data?.total_rewards || '0'}</span>
                        <div className="flex flex-col gap-1">
                            <div className="flex gap-1 item-center">
                                <span className="text-sm inter_regular text_secondary">Level1:</span>
                                <span className="text-sm inter_semibold text_dark">{data?.level_1 || '0'}</span>
                            </div>
                            <div className="flex gap-1 item-center">
                                <span className="text-sm inter_regular text_secondary">Level2:</span>
                                <span className="text-sm inter_semibold text_dark">{data?.level_2 || '0'}</span>
                            </div>
                            <div className="flex gap-1 item-center">
                                <span className="text-sm inter_regular text_secondary">Level3:</span>
                                <span className="text-sm inter_semibold text_dark">{data?.level_3 || '0'}</span>
                            </div>
                            <div className="flex gap-1 item-center">
                                <span className="text-sm inter_regular text_secondary">Level4:</span>
                                <span className="text-sm inter_semibold text_dark">{data?.level_4 || '0'}</span>
                            </div>
                            <div className="flex gap-1 item-center">
                                <span className="text-sm inter_regular text_secondary">Level5:</span>
                                <span className="text-sm inter_semibold text_dark">{data?.level_5 || '0'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

export default Dashboard;