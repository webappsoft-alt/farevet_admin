/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Fragment, useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { apiRequest } from '../../../api/auth_api'
import { avatar2 } from '../../icons/icon'
import ChatList from '../messages/chatList'
import ChatMessageList from '../messages/chatMessageList'
import './chat.css'

const Message2 = () => {
    const [chatlist, setChatlist] = useState([])
    const [chatlist2, setChatlist2] = useState([])
    const [chatDetail, setChatDetail] = useState()
    const [reload, setReload] = useState(false)
    const [showChat, setShowChat] = useState(false);
    const [checkMsg, setCheckMsg] = useState(false)
    const [check, setCheck] = useState(false)
    const user_type = window.localStorage.getItem('user_type');
    const [activeChatId, setActiveChatId] = useState(null);
    const { state } = useLocation()
    const userData = JSON.parse(window.localStorage.getItem('login_farevet_formData'))
    const { t } = useTranslation()

    useEffect(() => {
        setChatlist(chatlist2)
    }, [])

    const getChatList = async () => {
        setReload(false)
        const body = new FormData()
        body.append('type', user_type === 'vet' ? 'vet_chat_list' : 'chat_list')
        body.append('user_id', userData?.user_id || userData?.id)
        if (user_type === 'vet') {
            body.append('chat_opening', 'parent')
        }
        try {
            const result = await apiRequest({ body })
            const data = result.chat
            const sortedChatlist = data.sort((a, b) => parseInt(b.timestamp, 10) - parseInt(a.timestamp, 10))
            setChatlist(sortedChatlist)
            setChatlist2(sortedChatlist)
            if (activeChatId && chatDetail) {
                const activeChat = sortedChatlist.find(chat => chat.sender_id === activeChatId)
                if (activeChat?.msg !== chatDetail.msg) {
                    setChatDetail(activeChat)
                    setCheckMsg(true)
                }
            }
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        getChatList()
        const intervalId = setInterval(getChatList, 3000)
        return () => clearInterval(intervalId)
    }, [])

    return (
        <Container fluid={'lg'} className='px-0'>
            <div className=''>
                <div className="bg-lightgray">
                    <div className="">
                        <div className="chat_grid ">
                            <div className={` chat_screen ${!showChat ? "" : "d_chat_none"} `}>
                                <div className='pb-1' >
                                    <h4 className="fs_12 semi_bold_heading my-4 px-3 sk_modernist_regular">{t("Messages")}</h4>
                                    <hr style={{ color: "#EDEEF0" }} className="mb-1" />
                                    <div className="chat_height_contol scrolbar" >
                                        {
                                            chatlist?.length > 0 ? (
                                                <>
                                                    {chatlist.map((chat, index) => (
                                                        <Fragment key={index}>
                                                            <ChatList
                                                                id={chat?.sender_id}
                                                                img={chat?.sender_img}
                                                                name={chat?.sender_name}
                                                                notify={chat?.unseen > 0 ? chat?.unseen : ""}
                                                                discrip={chat?.msg}
                                                                timestamp={chat?.timestamp}
                                                                data={chat}
                                                                setChatDetail={setChatDetail}
                                                                setCheckMsg={setCheckMsg}
                                                                setCheck={setCheck}
                                                                setShowChat={setShowChat}
                                                                activeId={activeChatId}
                                                                setActiveChatId={setActiveChatId}
                                                            />
                                                        </Fragment>
                                                    ))}
                                                </>
                                            ) : (
                                                <div className="text-center py-4 text-gray-500">
                                                    No chat found
                                                </div>
                                            )
                                        }
                                    </div>
                                </div>
                            </div>
                            <div className={`chat_screen ${showChat ? "" : "d_chat_none"} `} id='chatScreen'>
                                {check ?
                                    (<ChatMessageList chatDetail={chatDetail && chatDetail} activeId={activeChatId} setReload={setReload} setCheckMsg={setCheckMsg} checkMsg={checkMsg} setShowChat={setShowChat} />)
                                    :
                                    (<div className='display_flex2 flex-column h-100 w-100' >
                                        {/* <img src={logo} alt='' className='logo me-1' /> */}
                                        <h4 className='popins_semibold ms-2 my-0 fs_12' >
                                            Farevet
                                        </h4>
                                        <h6 className='text-center sk_modernist_regular text_light fs_08 w_lg_80 mt-1'>
                                            {t("About_Paragraph1")}
                                        </h6>
                                    </div>)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Container>
    )
}

export default Message2