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
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
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
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        getChatList()
        const intervalId = setInterval(getChatList, 3000)
        return () => clearInterval(intervalId)
    }, [])

    const filteredChatList = chatlist.filter(chat =>
        chat?.sender_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat?.msg?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex w-full bg-white" style={{ height: "calc(100vh - 80px)" }}>
            <div className={`w-full md:w-[350px] shrink-0 border-r border-gray-100 flex-col ${!showChat ? "flex" : "hidden md:flex"}`}>
                <div className='p-2 border-b border-gray-100 shrink-0 bg-white'>
                    {/* <h4 className="text-xl font-bold mb-3 text-gray-800">{t("Messages")}</h4> */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search messages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#8930f9] focus:ring-1 focus:ring-[#8930f9] transition-colors"
                        />
                        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto scrolbar" >
                    {isLoading ? (
                        <>
                            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                <div key={i} className="w-full border-b border-gray-50 p-3 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0"></div>
                                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <div className="h-3 bg-gray-100 rounded-md w-24"></div>
                                            <div className="h-2 bg-gray-100 rounded-md w-10"></div>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-md w-2/3"></div>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : filteredChatList?.length > 0 ? (
                        filteredChatList.map((chat, index) => (
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
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            No chat found
                        </div>
                    )}
                </div>
            </div>

            <div className={`flex-1 flex-col min-w-0 bg-white ${showChat ? "flex" : "hidden md:flex"}`} id='chatScreen'>
                {check ? (
                    <ChatMessageList chatDetail={chatDetail && chatDetail} activeId={activeChatId} setReload={setReload} setCheckMsg={setCheckMsg} checkMsg={checkMsg} setShowChat={setShowChat} />
                ) : (
                    <div className='flex flex-col items-center justify-center h-full w-full text-center bg-[#FAFBFC]'>
                        <h4 className='text-3xl font-bold text-gray-500 tracking-tight mb-2'>Farevet</h4>
                        <h6 className='text-[13px] text-gray-400 max-w-md font-medium tracking-wide'>Select a chat to view messages</h6>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Message2