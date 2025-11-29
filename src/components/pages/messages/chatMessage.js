/* eslint-disable jsx-a11y/img-redundant-alt */
/* eslint-disable no-unused-vars */
import React from 'react';
import { Trash2, X } from 'react-feather';
// import ImageLoader from '../snackbar/imageLoader';
import { useState } from 'react';
import { Dropdown, Modal, Spinner } from 'react-bootstrap';
import { apiRequest } from '../../../api/auth_api';
import './chat.css';


const ChatMessage = ({ message, msg_type, img, left, index, chtData, setIsDelete, timestamp, id, setIsImageDelete, setChatMsg, chatMsg }) => {
    const userData = JSON.parse(window.localStorage.getItem('login_farevet_formData'))
    const [modalShow, setModalShow] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [msg_id, setMsg_id] = useState(null);
    const [msgIndex, setMsgindex] = useState(null);
    const [imageSrc, setImageSrc] = useState(null);
    const handleClose = () => {
        setModalShow(false)
    }
    const [show, setShow] = useState(false);
    const handleCloseDelete = () => setShow(false);
    const handleShowDelete = (id, index) => {
        setShow(true);
        setMsgindex(index)
        setShowDropdown(false);
        setMsg_id(id)
        setIsImageDelete(true)
    }

    const handleDeleteMsg = async () => {
        setIsImageDelete(true)
        setIsLoading(true)
        const body = new FormData()
        body.append('type', 'delete_data')
        body.append('table_name', 'chat')
        body.append('id', msg_id)
        await apiRequest({ body })
            .then((result) => {
                if (result.result) {
                    setIsDelete(true)
                    removeImage(msgIndex)
                    setShow(false)
                    setIsImageDelete(true)
                    handleClose()
                }
                setIsLoading(false)
            }).catch((err) => {
                console.log(err)
                setIsLoading(false)
            });
    }
    const removeImage = (index) => {
        const newImages = [...chatMsg];
        newImages.splice(index, 1);
        setIsDelete(true)
        setChatMsg(newImages);
    };
    const [showDropdown, setShowDropdown] = useState(false);

    const renderMessageContent = (msg, msgType) => {
        if (msgType === "1") {
            const fileExtension = msg.split('.').pop().toLowerCase();
            if (['pdf', 'docx', 'doc'].includes(fileExtension)) {
                return <a href={msg} target="_blank" rel="noopener noreferrer">{msg}</a>;
            } else {
                return <img
                    src={msg}
                    alt="Chat image"
                    style={{ width: '180px', height: '180px', borderRadius: '20px', objectFit: 'cover', cursor: 'pointer' }
                    }
                />;
            }
        } else if (msgType === "0") {
            return <span>{msg}</span>;
        }
        return null;
    };


    const date = new Date(timestamp * 1000);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    const formattedTime = `${hours}:${formattedMinutes} ${ampm}`;


    return (
        <div className=''>
            <div className={`pb-3 ${left ? "chat-message-left " : "chat-message-right"}`}>
                <div>
                    <div className={`flex-shrink-1 delmsg fs_08  ${left ? "chat_card_left" : "chat_card_right"}`} style={{ padding: chtData?.msg_type === '0' ? "0.7rem 0.9rem" : '.2rem', marginBottom: "0.2rem" }} >
                        {left === false ?
                            <Dropdown drop={left ? "end" : "start"} className='delmsg'>
                                <Dropdown.Toggle className='fs_08 text-start text-wrap' variant='transparent' id="dropdown-basic" style={{ color: "inherit" }}>
                                    {/* {msg_type === '0' ? (
                                        <span>{message}</span>
                                    ) : (
                                        (() => {
                                            const fileExtension = message.split('.').pop().toLowerCase();
                                            if (['pdf', 'docx', 'doc'].includes(fileExtension)) {
                                                return <a href={message} target="_blank" rel="noopener noreferrer">{message}</a>;
                                            } else {
                                                return <img
                                                    src={message}
                                                    alt="Chat image"
                                                    style={{ width: '180px', height: '180px', borderRadius: '20px', objectFit: 'cover', cursor: 'pointer' }}
                                                />;
                                            }
                                        })()
                                    )} */}
                                    {renderMessageContent(chtData.msg, chtData.msg_type)}
                                </Dropdown.Toggle>
                            </Dropdown> : renderMessageContent(chtData.msg, chtData.msg_type)
                        }
                        {/* {left === false ?
                            (msg_type === "file" &&
                                <div className='d-flex align-items-center gap-2'>
                                    <Dropdown show={showDropdown} drop={left ? "end" : "start"} className='delmsg' onToggle={handleDropdownToggle} onHide={handleDropdownHide} >
                                        <Dropdown.Toggle className='fs_08' variant='transparent' id="dropdown-basic" style={{ color: "inherit" }}>
                                            <div><File className='doc'></File></div>
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu >
                                            <div className='position-relative dropdown-item text-danger btn btn-light' onClick={() => handleShowDelete(id, index)}>
                                                <Trash2 />
                                            </div>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                    <Link target='_blank' download={message} rel="noreferrer" className='text-white' to={userData?.url + message} style={{ wordBreak: "break-word" }}>
                                        {message}
                                    </Link>
                                </div>) : msg_type === "file" &&
                            <div className='d-flex align-items-center gap-2'>
                                <Link target='_blank' className='text-black' to={userData?.url + message} ><File className='doc'></File></Link>
                                <Link target='_blank' download={message} rel="noreferrer" className='text-black' to={userData?.url + message} style={{ wordBreak: "break-word" }}>
                                    {message}
                                </Link>
                            </div>
                        } */}

                        {/* {msg_type === "image" && <>
                            <div style={{ borderRadius: "inherit" }} onClick={() => handleShow(img ? img : userData?.url + message)}>
                                <ImageLoader imageUrl={img ? img : userData?.url + message} classes={'h-100 w-100'} />
                            </div>
                        </>} */}

                        {/* {msg_type === "file" &&
                            <div className='d-flex align-items-center gap-2'>
                                <Link target='_blank' className='text-white' to={userData?.url + message} ><File className='doc'></File></Link>
                                <Link target='_blank' download={message} rel="noreferrer" className='text-white' to={userData?.url + message} style={{ wordBreak: "break-word" }}>
                                    {message}
                                </Link>
                                <div>
                                    <div className='border border-3 p-1 btn1 border-white rounded-circle' onClick={() => downloadFile(message)} style={{ width: "2rem", height: "2rem", cursor: "pointer" }} >
                                        <Download className='' style={{ width: "1.2rem" }} />
                                    </div>
                                </div>
                            </div>} */}
                    </div>
                    <div className={`text-nowrap fs_07 ${left ? "chat-message-left" : "chat-message-right"}`} style={{ color: "#848FAC" }} >
                        {/* <Moment unix fromNow>
                            {timestamp}
                        </Moment> */}
                        {formattedTime}
                    </div>
                </div>
            </div>
            <Modal
                fullscreen={true}
                className='chat_msg'
                centered
                show={modalShow} onHide={handleClose} >
                <Modal.Body className='h-100 position-relative'>
                    <div className='position-absolute d-flex gap-2 flex-column m-2' style={{ right: "0", top: "0" }}>
                        <button onClick={handleClose} className='btn btn-light rounded-circle p-0' style={{ height: "2rem", width: "2rem" }}> <X /> </button>
                        {left === false && (<div className='btn btn-light rounded-circle p-1 btn1' style={{ height: "2rem", width: "2rem" }} onClick={() => handleShowDelete(id, index)}>
                            <Trash2 style={{ height: "1.1rem", width: "1.3rem" }} />
                        </div>)}
                    </div>
                    <div className='h-100 d-grid'>
                        <img src={imageSrc} alt='' className='msg_show_img' />
                    </div>
                </Modal.Body>
            </Modal>
            <Modal
                show={show}
                onHide={handleCloseDelete}
                backdrop="static"
                centered
                keyboard={false}
            >
                <Modal.Body className='pt-2 text-center'>
                    <div className='position-absolute m-2' style={{ right: "0", top: "0", zIndex: "10" }}>
                        <button onClick={handleCloseDelete} className='btn btn-dark rounded-circle p-0' style={{ height: "2rem", width: "2rem" }}> <X /> </button>
                    </div>
                    <div className='mb-3 mt-2 text-start popins_semibold'>Delete message?</div>
                    Are you sure you want to delete this message?
                </Modal.Body>
                <Modal.Footer className='border-0'>
                    <button className='btn btn-light border me-2' disabled={isLoading} onClick={handleCloseDelete}>
                        Cancel
                    </button>
                    <button className='btn  btn_secondary' disabled={isLoading} onClick={handleDeleteMsg}>
                        {isLoading ?
                            <Spinner size='sm' /> :
                            "Delete"}
                    </button>
                </Modal.Footer>
            </Modal>
        </div >
    )
}

export default ChatMessage