/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from 'react'
import { ChevronLeft, File, FilePlus, Image, Paperclip, Send, Trash, Trash2 } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Dropdown, Form } from 'react-bootstrap'
import ChatMessage from './chatMessage'
// import { createChat, getChat, updateChat } from '../api/instructor.js/chat'
// import profileAvatar from '../assests/png/avatar2.png'
import Spinner from "../../Spinner";
import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { apiRequest } from '../../../api/auth_api'
import { profileavatar } from '../../icons/icon'
import { setChatCount } from '../../../redux/videoCall'
import { useDispatch } from 'react-redux'

const CustomToggle = React.forwardRef(({ children, onClick, disabled }, ref) => (
    <button
        ref={ref}
        type="button"
        disabled={disabled}
        onClick={(e) => {
            e.preventDefault();
            onClick(e);
        }}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors border-none bg-transparent flex items-center justify-center disabled:opacity-50"
    >
        {children}
    </button>
));

const ChatMessageList = ({ chatDetail, setShowChat, setCheckMsg, checkMsg, setReload, activeId, }) => {
    const navigate = useNavigate()

    const [formInfo, setFormInfo] = useState(null)
    const userData = JSON.parse(window.localStorage.getItem('login_farevet_formData'))
    const user_type = window.localStorage.getItem('user_type');
    const [chatMsg, setChatMsg] = useState([]);
    const [isLoadingMsgs, setIsLoadingMsgs] = useState(true);
    const [timeStamp, setTimeStamp] = useState('');
    const [isFileLoader, setIsFileLoader] = useState(false)
    const [isDelete, setIsDelete] = useState(false)
    const dispatch = useDispatch()
    const [fileType, setFileType] = useState('');
    const [isImageDelete, setIsImageDelete] = useState(false);
    const [businessData2, setBusinessData2] = useState('')
    const [lengthCount, setLengthCount] = useState(0)
    const chatMessagesRef = useRef(null);
    const { t } = useTranslation()

    const getFormattedDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };


    const getFormattedTime = (date) => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const period = hours >= 12 ? 'pm' : 'am';
        const formattedHours = String(hours % 12 || 12).padStart(2, '0');
        const formattedMinutes = String(minutes).padStart(2, '0');
        return `${formattedHours}:${formattedMinutes} ${period}`;
    };

    useEffect(() => {
        setIsLoadingMsgs(true);
        getChatData()
    }, [chatDetail]);

    const handleBusinessCreate = (business2, contractDetail) => {
        navigate('/business-contract-view', { state: { businessData: business2, url: business2?.url, contractDetail: contractDetail, businessCotract: true } })
    }

    const getChatData = async () => {
        const data = {
            to_chat_id: chatDetail?.sender_id,
            user_id: userData.user_id || userData?.id,
        };
        const body = new FormData()
        body.append('type', user_type === 'vet' ? "get_vet_chat" : 'getchat')
        body.append('user_id', data.user_id)
        body.append('to_chat_id', data.to_chat_id)
        await apiRequest({ body })
            .then((result) => {
                const reversedChatArray = [...result.chat];
                setChatMsg(reversedChatArray);
                setIsLoadingMsgs(false);
            }).catch((err) => {
                console.log(err)
                setIsLoadingMsgs(false);
            });
    };

    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
            window.scrollTo(0, chatMessagesRef.current.scrollHeight);
        }
    }, [chatMessagesRef.current, chatMsg, isDelete]);

    const currentDate = new Date();
    const formattedDate = getFormattedDate(currentDate);
    const formattedTime = getFormattedTime(currentDate);
    const sendMessage = async (e) => {
        e.preventDefault();
        const input = document.getElementById('chatInput');
        const message = input?.value;
        await sendMessageApi(message, "text")
        input.value = '';
    };


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


    useEffect(() => {
        if (chatMsg.length > 0) {
            const intervalId = setInterval(() => {
                const data = {
                    sender_id: userData.user_id,
                    time: formattedTime,
                    datetime: formattedDate,
                    // msg: message,
                }
                const body = new FormData()
                body.append('type', user_type === 'vet' ? "check_vet_msg" : 'checkmsg')
                body.append('user_id', data.sender_id)
                body.append('to_chat_id', chatDetail?.sender_id)
                body.append('timestamp', timeStamp)
                apiRequest({ body })
                    .then((result) => {
                        const lenghtChat = result?.chat?.length
                        // console.log(lenghtChat)
                        // console.log(chatMsg?.length, "chatmsg")
                        if (lenghtChat !== undefined) {
                            if (lenghtChat > chatMsg?.length) {
                                setTimeStamp(result.chat[lenghtChat - 1].timestamp)
                                setIsImageDelete(false)
                                const newMsg = result.chat[lenghtChat - 1]
                                setIsDelete(false)
                                setReload(true)
                                setChatMsg([...chatMsg, newMsg]);
                                return
                                // getChatData()
                            } else if (lenghtChat < chatMsg?.length) {
                                setTimeStamp(result.chat[lenghtChat - 1].timestamp)
                                const newMsg = result.chat
                                setIsDelete(false)
                                setReload(true)
                                newMsg.forEach(element => {
                                    if (element?.sender_id !== (userData?.user_id || userData?.id)) {
                                        setChatMsg([...chatMsg, element]);
                                    }
                                });
                                return
                            }
                        }
                    }).catch((err) => {
                        console.log(err)
                    });
            }, 3000);
            return () => clearInterval(intervalId);
        }
    }, [chatDetail, chatMsg]);

    const [showDropdown, setShowDropdown] = useState(false);
    const sendMessageApi = async (message, type) => {

        const currentTime = Math.floor(Date.now() / 1000);
        const data = {
            sender_id: userData.user_id || userData?.id,
            msg: message,
            timestamp: currentTime,
            msg_type: type,
            chatDetail: chatDetail?.sender_id,
        }
        // setChatMsg([...chatMsg, data]);

        chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        const scrollTimeout = setTimeout(() => {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }, 0.00000001);
        const body = new FormData()
        body.append('type', 'sendmsg')
        if (user_type === 'vet') {
            body.append('table_name', 'vet_chat')
            body.append('msg_from', 'parent')
        }
        body.append('msg', message)
        body.append('current_time', currentTime)
        body.append('user_id', userData.user_id || userData?.id)
        body.append('to_chat_id', chatDetail?.sender_id)
        body.append('msg_type', data.msg_type)
        await apiRequest({ body: body })
            .then((result) => {
                if (result) {
                    setReload(true)
                    setChatMsg([...chatMsg, data]);
                    setTimeStamp(result.timestamp)
                    setImageFiles([])
                    setDocumentFiles([])
                    setIsDelete(false)
                    getChatData()
                    clearTimeout(scrollTimeout)
                }
            }).catch((err) => {
                console.log(err)
            });
    }
    const sendFile = async (file) => {
        setIsFileLoader(true)
        await apiRequest(file)
            .then(async (result) => {
                if (result.result) {
                    setIsFileLoader(false)
                    setIsDelete(false)
                    handleDropdownHide()
                    await sendMessageApi(result.file_name, fileType)
                }
            }).catch((err) => {
                setIsFileLoader(false)
                console.log(err)
            });
    }
    const handleDropdownToggle = () => {
        setShowDropdown(!showDropdown);
    };
    const handleDropdownHide = () => {
        setShowDropdown(false);
    };
    const [documentFiles, setDocumentFiles] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);

    const handleFileChange = async (event, fileTypes) => {

        setIsFileLoader(true);
        // Handle different file types
        if (fileTypes === 'file') {
            setDocumentFiles(event.target.files[0]);
            setFileType('1');
        } else if (fileTypes === 'image') {
            setFileType('1');
            setImageFiles(event.target.files[0]);
        }

        // console.log(selectedFiles);
        // console.levent.target.files[0]les?.name);

        const body = new FormData();
        body.append('type', 'upload_data');
        body.append('file', new Blob([(event.target.files[0])], { type: event.target.files[0].type }), event.target.files[0]?.name);
        // console.log(body);
        try {
            const result = await apiRequest({ body });
            if (result) {
                setIsFileLoader(false);
                handleDropdownHide();
                await sendMessageApi(result.file_name, '1');
            }
        } catch (err) {
            setIsFileLoader(false);
            console.error(err);
        }
    };

    const fileInputRef = useRef(null);
    const handleTrashBtn = () => {
        fileInputRef.current.value = null
        setImageFiles([])
        setDocumentFiles([])
    }

    return (
        <div className='flex flex-col h-full w-full relative bg-white'>
            <div className="px-3 py-1.5 border-b border-gray-100 shrink-0 bg-white z-10">
                <div className='flex justify-between items-center gap-2 flex-wrap w-full'>
                    <div className="flex items-center gap-2">
                        <button className='md:hidden p-1 rounded-full hover:bg-gray-100 text-gray-600 border-none bg-transparent' onClick={() => { setShowChat(false) }}>
                            <ChevronLeft size={20} />
                        </button>
                        <div className="shrink-0">
                            <img src={chatDetail.sender_img !== `${global.IMAGEURL}/` ? chatDetail.sender_img : profileavatar} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-100 bg-white" />
                        </div>
                        <div className="flex flex-col justify-center">
                            <h6 className="text-sm font-semibold text-gray-900 m-0 leading-none">
                                {(!chatDetail?.sender_name || chatDetail?.sender_name === "undefined undefined" || chatDetail?.sender_name === "null null" || chatDetail?.sender_name.trim() === "" || chatDetail?.sender_name === "undefined")
                                    ? "No Name"
                                    : chatDetail?.sender_name}
                            </h6>
                            <span className="text-[11px] text-gray-500 m-0 mt-0.5 leading-none">
                                {chatDetail?.sender_email || chatDetail?.email || chatDetail?.user_email || "No email available"}
                            </span>
                        </div>
                    </div>
                    {
                        lengthCount >= 2 ? <>
                            <button className='btn1 chat_profile_btn btn_primary rounded_3 px-2 py-2' onClick={() => navigate('/business-contract')}>{t("Bus_create")}</button></> :
                            (businessData2?.length > 0 && ((businessData2?.business_base64 !== "" || businessData2?.investor_base64 !== "") &&
                                <div className=''>
                                    <button className='btn1 chat_profile_btn btn_primary rounded_3 px-2 py-2' onClick={() => handleBusinessCreate(businessData2, formInfo)}>{t("Bus_create")}</button>
                                </div>))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto scrolbar px-4 py-3 bg-[#FAFBFC]" ref={chatMessagesRef}>
                {isLoadingMsgs ? (
                    <div className="flex flex-col gap-4 p-2">
                        <div className="flex items-end gap-2 w-3/4">
                            <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0"></div>
                            <div className="bg-gray-200 rounded-2xl rounded-bl-none h-16 w-full"></div>
                        </div>
                        <div className="flex items-end gap-2 w-3/4 self-end flex-row-reverse">
                            <div className="bg-purple-100 rounded-2xl rounded-br-none h-12 w-full"></div>
                        </div>
                        <div className="flex items-end gap-2 w-2/3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0"></div>
                            <div className="bg-gray-200 rounded-2xl rounded-bl-none h-10 w-full"></div>
                        </div>
                    </div>
                ) : (
                    chatMsg?.map((msg, index) => (
                        <Fragment key={index}>
                            <ChatMessage
                                img={msg?.dumyImg}
                                id={msg?.id}
                                msg_type={msg?.msg_type}
                                left={msg?.sender_id === (userData?.user_id || userData?.id) ? false : true}
                                message={msg?.msg}
                                date={msg?.datetime}
                                chtData={msg}
                                timestamp={msg?.timestamp}
                                setIsDelete={setIsDelete}
                                index={index}
                                setIsImageDelete={setIsImageDelete}
                                time={`${msg?.time}`}
                                chatMsg={chatMsg}
                                setChatMsg={setChatMsg} />
                        </Fragment>))
                )}
            </div>

            <form onSubmit={sendMessage} className="px-4 py-2.5 border-t border-gray-100 shrink-0 bg-white relative">
                {imageFiles.length > 0 &&
                    <div style={{ bottom: '100%', left: 0, margin: 10, borderRadius: '12px' }} className='position-absolute bg-gray-100 p-2 shadow-sm'>
                        <div className='position-relative d-flex flex-column justify-content-between h-100'>
                            <button className='text-danger trash btn1 absolute top-1 right-1' style={{ zIndex: "10" }} onClick={handleTrashBtn}>
                                <Trash2 size={16} />
                            </button>
                            <div className='position-relative rounded-lg overflow-hidden' style={{ width: 120, height: 'auto' }}>
                                {!isFileLoader ?
                                    <img
                                        src={URL.createObjectURL(imageFiles[0])}
                                        alt='SelectedImage'
                                        className='w-100 h-100 object-cover'
                                    /> :
                                    <div className=' position-absolute d-flex justify-content-center align-items-center h-100' style={{ inset: "0", backgroundColor: "rgba(0,0,0,0.25)", zIndex: "2" }} >
                                        <Spinner />
                                    </div>}
                            </div>
                            <div className='d-flex mt-2 justify-content-between align-items-center gap-3'>
                                <button className="h-8 w-8 rounded-full bg_darkSec flex items-center justify-center ms-auto" type='button' disabled={isFileLoader} onClick={() => sendFile(imageFiles[0])}>
                                    <Send className='text-white' style={{ width: "1rem" }} />
                                </button>
                            </div>

                        </div>

                    </div>}
                {documentFiles.length > 0 &&
                    <div style={{ bottom: '100%', left: 0, margin: 10, borderRadius: '12px' }} className='position-absolute bg-gray-100 p-2 shadow-sm'>
                        <div className='position-relative d-flex flex-column justify-content-between h-100'>

                            <div className='h-100 d-grid justify-content-center align-items-center '>

                                <div className='file_doc m-auto position-relative'>
                                    <button className='text-danger trash2 btn1 absolute top-1 right-1' disabled={isFileLoader} style={{ zIndex: "10" }} onClick={handleTrashBtn}>
                                        <Trash size={16} />
                                    </button>
                                    {!isFileLoader ?
                                        <File className='w-100 h-100 text-gray-500'></File>
                                        : <div className=' position-absolute d-flex justify-content-center align-items-center h-100' style={{ inset: "0", backgroundColor: "rgba(0,0,0,0.25)", zIndex: "2" }} >
                                            <Spinner />
                                        </div>
                                    }
                                </div>
                            </div>
                            <div className='d-flex mt-2 justify-content-between align-items-center gap-3'>
                                <p className='m-0 text-xs truncate max-w-[100px]'> {documentFiles[0].name}</p>
                                <button className="h-8 w-8 rounded-full bg_darkSec flex items-center justify-center ms-auto" disabled={isFileLoader} type='button' onClick={() => sendFile(documentFiles[0])}>
                                    <Send className='text-white' style={{ width: "1rem" }} />
                                </button>
                            </div>

                        </div>

                    </div>}
                <div className="flex items-center gap-2">
                    <div className="shrink-0 flex items-center justify-center">
                        <Dropdown show={showDropdown} onToggle={handleDropdownToggle} onHide={handleDropdownHide}>
                            <Dropdown.Toggle as={CustomToggle} disabled={isFileLoader}>
                                {isFileLoader ? <Spinner color='inherit' size={16} /> :
                                    <Paperclip className='text-gray-500' style={{ width: "1.2rem" }} />}
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="shadow-sm border-gray-100">
                                <div className='position-relative dropdown-item d-flex align-items-center gap-2'>
                                    <Form.Control
                                        type='file'
                                        className='file_adjust absolute inset-0 opacity-0 cursor-pointer'
                                        onClick={handleDropdownHide}
                                        accept='.doc, .docx, .pdf, .txt'
                                        ref={fileInputRef}
                                        onChange={(e) => handleFileChange(e, 'file')}
                                    />
                                    <FilePlus size={16} /> <span className="text-sm">Document</span>
                                </div>
                                <div className='position-relative dropdown-item d-flex items-center gap-2'>
                                    <Form.Control
                                        type='file'
                                        className='file_adjust absolute inset-0 opacity-0 cursor-pointer'
                                        onClick={handleDropdownHide}
                                        ref={fileInputRef}
                                        accept='.jpg, .png, .jpeg'
                                        onChange={(e) => handleFileChange(e, 'image')}
                                    />
                                    <Image size={16} /> <span className="text-sm">Image</span>
                                </div>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                    <div className="flex-1 min-w-0" >
                        <input type="text" id="chatInput"
                            required className="w-full bg-gray-50 border border-gray-200 focus:border-[#8930f9] focus:ring-1 focus:ring-[#8930f9] rounded-full px-4 py-2 text-sm outline-none transition-colors" placeholder="Type a message..." />
                    </div>
                    <button className="shrink-0 h-9 w-9 flex items-center justify-center rounded-full bg_primary text-white hover:opacity-90 transition-opacity border-none"
                        type='submit'>
                        <Send style={{ width: "1rem" }} className="mr-0.5 mt-0.5" />
                    </button>
                </div>
            </form>
        </div>
    )
}

export default ChatMessageList