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

    return (
        <div>
            <div className={`_link_  border-0 `} onClick={() => toggleData(data)} style={{ cursor: "pointer" }}>
                <div className={`chat-list-link px-2 py-2 w-100 ${isActive ? 'active' : ''}`}>
                    <div className='d-flex gap-2 align-items-center'>
                        <div className="position-relative">
                            <img src={img !== `${global.IMAGEURL}/` ? img : profileavatar} alt=""
                                style={{ width: '50px', height: '50px', marginRight: '16px', borderRadius: '50%', objectFit: 'cover' }}
                                className="chat_profile_img border" />
                            <span>
                                <span className="noti_badges fs_06" style={{ height: "1.2rem", width: "1.2rem" }} id="chatbadge">
                                    {
                                        badge === null ? notify : badge
                                    }
                                </span>
                            </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center w-100">
                            <div className="mt-1">
                                <h6 className="plusJakara_medium line-clamp-1 my-0">
                                    {name}
                                </h6>
                                <span className="chat_detail1 plusJakara_regular" style={{ fontSize: '14px' }}>
                                    {discrip}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="d-flex justify-content-end w-100">
                        <span className="chat_detail plusJakara_regular text-sm" style={{ whiteSpace: "nowrap", fontSize: '14px' }}>
                            <Moment unix fromNow>
                                {timestamp}
                            </Moment>
                            {/* {formattedTime} */}
                        </span>
                    </div>
                </div>
            </div>
        </div >
    )
}

export default ChatList
