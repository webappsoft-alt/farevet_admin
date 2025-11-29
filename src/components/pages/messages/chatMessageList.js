/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from 'react'
import { ChevronLeft, File, FilePlus, Image, Paperclip, Send, Trash, Trash2 } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import ChatMessage from './chatMessage'
// import { createChat, getChat, updateChat } from '../api/instructor.js/chat'
// import profileAvatar from '../assests/png/avatar2.png'
import { CircularProgress } from '@mui/material'
import { Fragment } from 'react'
import { Dropdown, Form, Spinner } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { apiRequest } from '../../../api/auth_api'
import { profileavatar } from '../../icons/icon'
import { setChatCount } from '../../../redux/videoCall'
import { useDispatch } from 'react-redux'

const ChatMessageList = ({ chatDetail, setShowChat, setCheckMsg, checkMsg, setReload, activeId, }) => {
    const navigate = useNavigate()
    const [formInfo, setFormInfo] = useState(null)
    const userData = JSON.parse(window.localStorage.getItem('login_farevet_formData'))
    const user_type = window.localStorage.getItem('user_type');
    const [chatMsg, setChatMsg] = useState([]);
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
            }).catch((err) => {
                console.log(err)
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
        <div className='chat_height position-relative' >
            <div className="px-3 py-2 boxshadow">
                <div className='d-flex justify-content-between align-items-center gap-3 flex-wrap'>
                    <div className="display_flex _link_">
                        <div className='d_left_button' onClick={() => { setShowChat(false) }}>
                            <ChevronLeft />
                        </div>
                        <div>
                            <img src={chatDetail.sender_img !== `${global.IMAGEURL}/` ? chatDetail.sender_img : profileavatar} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} className="chat_profile_im" /></div>
                        <div className="ps-sm-3 ps-2">
                            <h5 className="chat_detail chat_profile">
                                {chatDetail?.sender_name}
                            </h5>
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
            <div className="position-relative">
                <div ref={chatMessagesRef} className="chat-messages scrolbar px-2 py-3"  >
                    {chatMsg?.map((msg, index) => (
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
                        </Fragment>))}
                </div>
            </div>
            <form onSubmit={sendMessage}>
                {imageFiles.length > 0 &&
                    <div style={{ bottom: 50, backgroundColor: "#d3d3d3", margin: 10, borderRadius: '20px' }} className=' position-absolute selected_img'>
                        <div className='position-relative d-flex flex-column justify-content-between h-100'>
                            <button className='text-danger trash btn1' style={{ zIndex: "10" }} onClick={handleTrashBtn}>
                                <Trash2 />
                            </button>
                            <div className='position-relative' style={{ width: 200, height: 'auto' }}>
                                {!isFileLoader ?
                                    <img
                                        src={URL.createObjectURL(imageFiles[0])}
                                        alt='SelectedImage'
                                        className='w-100 h-100'
                                    /> :
                                    <div className=' position-absolute d-flex justify-content-center align-items-center h-100' style={{ inset: "0", backgroundColor: "rgba(0,0,0,0.25)", borderRadius: "inherit", zIndex: "2" }} >
                                        <Spinner />
                                    </div>}
                            </div>
                            <div className='d-flex mt-2 justify-content-between align-items-center gap-3'>
                                {/* <p className='m-0'> {imageFiles[0].name}</p> */}
                                <button className="send_btn rounded-3 ms-auto bg_darkSec" type='button' disabled={isFileLoader} onClick={() => sendFile(imageFiles[0])}>
                                    <Send className='text-white p-0 m-0' style={{ width: "1.2rem" }} />
                                </button>
                            </div>

                        </div>

                    </div>}
                {documentFiles.length > 0 &&
                    <div className=' position-absolute selected_img'>
                        <div className='position-relative d-flex flex-column justify-content-between h-100'>

                            <div className='h-100 d-grid justify-content-center align-items-center '>

                                <div className='file_doc m-auto position-relative'>
                                    <button className='text-danger trash2 btn1' disabled={isFileLoader} style={{ zIndex: "10" }} onClick={handleTrashBtn}>
                                        <Trash />
                                    </button>
                                    {!isFileLoader ?
                                        <File className='w-100 h-100'></File>
                                        : <div className=' position-absolute d-flex justify-content-center align-items-center h-100' style={{ inset: "0", backgroundColor: "rgba(0,0,0,0.25)", borderRadius: "inherit", zIndex: "2" }} >
                                            <Spinner />
                                        </div>
                                    }
                                </div>
                            </div>
                            <div className='d-flex mt-2 justify-content-between align-items-center gap-3'>
                                <p className='m-0'> {documentFiles[0].name}</p>
                                <button className="send_btn rounded-3 ms-auto bg_darkSec " disabled={isFileLoader} type='button' onClick={() => sendFile(documentFiles[0])}>
                                    <Send className='text-white p-0 m-0' style={{ width: "1.2rem" }} />
                                </button>
                            </div>

                        </div>

                    </div>}
                <div className=" position-absolute bottom-0  w-100">
                    <div className="d-flex my-3 mx-3 gap-2">
                        <div className="send_btn2 bg-light  rounded-circle" type='button'>
                            <Dropdown show={showDropdown} onToggle={handleDropdownToggle} onHide={handleDropdownHide}>
                                <Dropdown.Toggle
                                    disabled={isFileLoader}
                                    variant='transparent'
                                    id="dropdown-basic"
                                >
                                    {isFileLoader ? <CircularProgress color='inherit' size={16} /> :
                                        <Paperclip className='text-black p-0 m-0' style={{ width: "1.2rem" }} />}
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <div className='position-relative dropdown-item'>
                                        <Form.Control
                                            type='file'
                                            className='file_adjust'
                                            onClick={handleDropdownHide}
                                            accept='.doc, .docx, .pdf, .txt'
                                            ref={fileInputRef}
                                            onChange={(e) => handleFileChange(e, 'file')}
                                        />
                                        <FilePlus />
                                    </div>
                                    <div className='position-relative dropdown-item'>
                                        <Form.Control
                                            type='file'
                                            className='file_adjust'
                                            onClick={handleDropdownHide}
                                            ref={fileInputRef}
                                            accept='.jpg, .png, .jpeg'
                                            onChange={(e) => handleFileChange(e, 'image')}
                                        />
                                        <Image />
                                    </div>
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                        <div className="position-relative w-100" >
                            <input type="text" id="chatInput"
                                //  disabled={imageFiles.length > 0 || documentFiles.length > 0} 
                                required className="form-control rounded-3 ps-2 py-2 fs_10 " placeholder="Try to..." />
                        </div>
                        <button className={`send_btn rounded-3 bg-secondary`}
                            //  disabled={imageFiles.length > 0 || documentFiles.length > 0} 
                            type='submit'>
                            <Send className='text-white p-0 m-0' style={{ width: "1.2rem" }} />
                        </button>
                    </div>
                </div>
            </form>

        </div>
    )
}

export default ChatMessageList