import { message } from 'antd';
import { arrowrightgray, avatarman, bellnotify, changePassword, language, locationaccount, logout, penciledit, subscription } from '../icons/icon';
import { useNavigate } from 'react-router-dom';


const Account = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        window.localStorage.removeItem("isLogin_farevet_admin");
        message.error("Logout Successful!");
        // console.log("Logging out ");
        navigate('/login');
    };


    return (
        <main className='min-h-screen lg:container py-5 px-4 mx-auto'>
            <div className="flex justify-between max-md:flex-col max-md:gap-3 mb-4 md:items-center w-full">
                <div>
                    <h4 className='manrope_bold max-md:text-xl text_black'>Vender Profiles</h4>
                    <h6 className="text_secondary max-md:text-sm manrope_regular">Activities that must be monitored in order to maintain buyer satisfaction</h6>
                </div>
            </div>
            <div className="flex justify-between mt-5 max-md:flex-wrap gap-[24px] md:gap-[48px] w-full">
                <div className="border border-white shadow px-[24px] py-[10px] lg:py-[20px] w-full md:w-[35%] rounded-xl bg_white flex items-center justify-center">
                    <div className="flex flex-col items-center gap-1">
                        <img src={avatarman} className='h-[120px] w-auto rounded-full mb-2' alt="" />
                        <span className="manrope_semibold text_black text-sm">SARAH SMITH</span>
                        <span className="manrope_regular text-xs text-[#252C32] mb-2">sarahsmith@gmail.com</span>
                        <button onClick={() => { navigate("/account/edit-profile") }} className="px-3 py-2 mb-2 border bg_white rounded-lg flex gap-2 items-center justify-center">
                            <img src={penciledit} alt="" />
                            <span className='inter_regular text-sm text-[#252C32]'>Edit profile</span>
                        </button>
                        <button onClick={handleLogout} className="px-3 py-2 border bg_white rounded-lg flex gap-1 items-center justify-center">
                            <img src={logout} alt="" />
                            <span className='inter_regular text-sm text-[#252C32]'>Logout</span>
                        </button>
                    </div>
                </div>
                <div className="border border-white shadow px-[24px] lg:px-[38px] py-[30px] w-full md:w-[65%] items-center justify-center flex flex-col gap-[16px] rounded-xl bg_white">
                    <button onClick={() => { navigate('/account/subscription') }} className='flex justify-between pb-2 border-b-2 border-b-gray-200 w-full items-center'>
                        <div className="flex gap-2 items-center">
                            <img src={subscription} alt="" />
                            <span className="manrope_medium text-sm text_dark">Subscriptions</span>
                        </div>
                        <img src={arrowrightgray} alt="" />
                    </button>
                    <button onClick={() => { navigate("/account/notification") }} className='flex justify-between pb-2 border-b-2 border-b-gray-200 w-full items-center'>
                        <div className="flex items-center gap-2">
                            <img src={bellnotify} alt="" />
                            <span className="manrope_medium text-sm text_dark">Notification</span>
                        </div>
                        <img src={arrowrightgray} alt="" />
                    </button>
                    <button className='flex justify-between pb-2 border-b-2 border-b-gray-200 w-full items-center'>
                        <div className="flex items-center gap-2">
                            <img src={language} alt="" />
                            <span className="manrope_medium text-sm text_dark">Language</span>
                        </div>
                        <img src={arrowrightgray} alt="" />
                    </button>
                    <button onClick={() => { navigate('/account/address') }} className='flex justify-between pb-2 border-b-2 border-b-gray-200 w-full items-center'>
                        <div className="flex items-center gap-2">
                            <img src={locationaccount} alt="" />
                            <span className="manrope_medium text-sm text_dark">Address</span>

                        </div>
                        <img src={arrowrightgray} alt="" />
                    </button>
                    <button onClick={() => { navigate("/account/change-password") }} className='flex justify-between pb-2 w-full items-center'>
                        <div className="flex items-center gap-2">
                            <img src={changePassword} alt="" />
                            <span className="manrope_medium text-sm text_dark">Change Password</span>
                        </div>
                        <img src={arrowrightgray} alt="" />
                    </button>
                </div>
            </div>
        </main>
    )
}

export default Account;