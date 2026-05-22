/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import Moment from 'react-moment';
import { apiRequest } from '../../../api/auth_api';
import { profileavatar } from '../../icons/icon';
import { setChatCount } from '../../../redux/videoCall';
import { useDispatch } from 'react-redux';

const ChatList = ({ name, discrip, img, activeId, setActiveChatId, setShowChat, id, timestamp, notify, data, setChatDetail, setCheckMsg, setCheck }) => {
    const [badge, setBadge] = useState(null)
    const user_type = window.localStorage.getItem('user_type');
    const dispatch = useDispatch()

    const handleFileChange = (fileName) => {
        if (fileName) {
            const fileExtension = fileName.split('.').pop().toLowerCase();
            const docExtensions = ['doc', 'docx', 'pdf', 'txt'];
            const imageExtensions = ['jpg', 'jpeg', 'png'];

            if (docExtensions.includes(fileExtension)) {
                return "Document";
            } else if (imageExtensions.includes(fileExtension)) {
                return "Photo";
            } else {
                if (fileExtension?.match(/^(gif|bmp|svg)$/)) {
                    return "Image";
                }
            }
        }
        return fileName;
    };

    const toggleData = async (chatData) => {
        setChatDetail(chatData)
        setCheckMsg(true)
        setShowChat(true)
        setCheck(true)
        setActiveChatId(chatData?.sender_id);
    }

    const isActive = id === activeId;
    useEffect(() => {
        if (isActive) {
            toggleData(data)
        }
    }, [activeId, isActive])
    const userData = JSON.parse(window.localStorage.getItem('login_farevet_formData'))

    const notifyUpdate = async (id) => {
        const body = new FormData()
        body.append('type', 'msg_seen')
        body.append('to_id', userData?.user_id || userData?.id)
        await apiRequest({ body })
            .then((result) => {
                // console.log(result)
            }).catch((err) => {
                console.log(err)
            });
    }

    const displayName = (!name || name === "undefined undefined" || name === "null null" || name.trim() === "" || name === "undefined") 
        ? "No Name" 
        : name;

    return (
        <div>
            <button 
                type="button" 
                className={`w-full text-left border-b border-gray-100 transition-colors hover:bg-gray-50 p-3 ${isActive ? 'bg-purple-50' : 'bg-white'}`}
                onClick={() => toggleData(data)} 
            >
                <div className='flex items-center gap-3 w-full'>
                    <div className="relative shrink-0">
                        <img src={img !== `${global.IMAGEURL}/` ? img : profileavatar} alt=""
                            className="w-10 h-10 rounded-full object-cover border border-gray-200 bg-white" />
                        {(badge === null ? notify : badge) && (
                            <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#8930f9] text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white shadow-sm">
                                {badge === null ? notify : badge}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                            <h6 className={`inter_semibold text-sm truncate pr-2 m-0 ${isActive ? 'text-[#8930f9]' : 'text-gray-900'}`}>
                                {displayName}
                            </h6>
                            <span className={`inter_regular text-[11px] shrink-0 mt-0.5 ${isActive ? 'text-purple-400' : 'text-gray-400'}`}>
                                <Moment unix fromNow>{timestamp}</Moment>
                            </span>
                        </div>
                        <p className="inter_regular text-xs text-gray-500 truncate m-0">
                            {discrip}
                        </p>
                    </div>
                </div>
            </button>
        </div >
    )
}

export default ChatList
