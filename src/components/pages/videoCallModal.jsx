import { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { BiSolidPhoneCall } from "react-icons/bi";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setVideoCallModal } from "../../redux/videoCall";
import { useSocket } from "../../socket/socketProvider";

const VideoCallModal = ({ isVisible }) => {
    const navigate = useNavigate();
    const socket = useSocket()
    const userData = JSON.parse(localStorage.getItem('login_farevet_formData'))
    const dispatch = useDispatch();
    const videoCallData = useSelector((state) => state.videoCall?.videoCallData);
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setAnimate(true);
        } else {
            setAnimate(false);
        }
    }, [isVisible]);

    const onEndCall = async () => {
        const data = {
            to_id: videoCallData?.senderId,
            call_id: videoCallData?.call_id,
            type: 'reject',
        }
        socket.emit('call_response', data)
        dispatch(setVideoCallModal(false));
    };

    const onAcceptCall = () => {
        const data = {
            to_id: videoCallData?.senderId,
            call_id: videoCallData?.call_id,
            type: 'accept',
            name: userData?.name,
            userId: userData?.id + 'vet'
        }
        socket.emit('call_response', data)
        navigate("/video-call")
        dispatch(setVideoCallModal(false));
    };

    return (
        <Modal
            show={isVisible}
            centered
            style={{ zIndex: 999999 }}
            onHide={() => dispatch(setVideoCallModal(false))}
        >
            <div className={`p-3 ${animate ? "animate-zoom-in-out" : ""}`}>
                <div className="d-flex align-items-center justify-content-between">
                    <div
                        style={{ backgroundColor: '#b4b4b4' }}
                        className="rounded d-flex justify-content-center align-items-center"
                    >
                        <div style={{ width: '48px', height: '48px' }} className="d-flex align-items-center justify-content-center">
                            <BiSolidPhoneCall size={24} style={{ color: "green" }} />
                        </div>
                    </div>
                    <div className="ms-4 flex-grow-1">
                        <h5 className="fs-5 fw-medium mb-0">{videoCallData?.name} is calling you</h5>
                    </div>
                    <div className="d-flex flex-column gap-2">
                        <button
                            style={{ backgroundColor: "green" }}
                            className="btn text-white fw-medium px-4"
                            onClick={onAcceptCall}
                        >
                            Accept
                        </button>
                        <button
                            style={{ backgroundColor: "red" }}
                            className="btn text-white fw-medium px-4"
                            onClick={onEndCall}
                        >
                            Reject
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default VideoCallModal;