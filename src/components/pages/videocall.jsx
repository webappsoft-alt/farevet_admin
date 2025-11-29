/* eslint-disable react-hooks/exhaustive-deps */
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { message } from 'antd';
import React, { useEffect, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../socket/socketProvider';

const VideoCall = () => {
    const navigate = useNavigate();
    const videoCallData = useSelector((state) => state.videoCall?.videoCallData);
    const socket = useSocket();
    const userData = JSON.parse(localStorage.getItem('login_farevet_formData'))
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const uniqueID = Math.floor(Math.random() * 10000)?.toString();

    const handleCallEnd = async () => {
        try {
            setLoading(true);
            const data = {
                to_id: videoCallData?.senderId,
                call_id: videoCallData?.call_id,
                type: 'end',
                name: userData?.name,
                userId: userData?.id + 'vet'
            };
            socket.emit('call_response', data);
            message.success("Call Ended successfully");
            setVisible(false);
            navigate('/profile', { replace: true });

        } catch (error) {
            console.error(error);
            message.error("Error ending call");
        } finally {
            setLoading(false);
        }
    };

    const getCallInstance = async () => {
        const appID = 2141600550;
        const serverSecret = '6c43345b7b4f509388cc8a1a68cbb598';
        const userID = uniqueID || `user_${Date.now()}`;
        const userName = videoCallData?.name || "Guest";
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(appID, serverSecret, videoCallData?.call_id, userID, userName);

        if (!kitToken) {
            console.error("Failed to generate kitToken");
            return;
        }

        const zc = ZegoUIKitPrebuilt.create(kitToken);
        if (!zc) {
            console.error("Failed to create ZegoUIKitPrebuilt instance");
            return;
        }
        const roomConfig = {
            container: document.querySelector('#video-call-container'),
            sharedLinks: [{
                name: 'Personal link',
                url: window.location.href,
            }],
            scenario: {
                mode: ZegoUIKitPrebuilt.OneONoneCall,
            },
            showScreenSharingButton: true,
            onLeaveRoom: () => {
                handleCallEnd();
            },
            onHangUp: () => {
                handleCallEnd();
            },
            onLeave: () => {
                handleCallEnd();
            }
        };
        await zc.joinRoom(roomConfig);
    };

    useEffect(() => {
        if (socket) {
            const handleCallResponse = (data) => {
                if (data.type === 'end') {
                    // message.error("Call rejected by the user")
                    navigate('/profile', { replace: true });
                }
            };

            socket.on('call_response', handleCallResponse);
            return () => socket.off('call_response', handleCallResponse);
        }
    }, [socket]);

    useEffect(() => {
        getCallInstance();
    }, []);

    const ConfirmationModal = ({ show, onHide, onConfirm, message, loading }) => (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Confirm</Modal.Title>
            </Modal.Header>
            <Modal.Body>{message}</Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={loading}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={onConfirm} disabled={loading}>
                    {loading ? 'Loading...' : 'Confirm'}
                </Button>
            </Modal.Footer>
        </Modal>
    );

    return (
        <div className="d-flex align-items-center justify-content-center vh-100">
            <div id="video-call-container" style={{ width: '100%', height: '100vh' }}></div>

            <ConfirmationModal
                show={visible}
                onHide={() => {
                    setVisible(false);
                    navigate('/profile', { replace: true });
                }}
                onConfirm={() => {
                    handleCallEnd();
                }}
                message={'Are you sure you want to leave meeting?'}
                loading={loading}
            />
        </div>
    );
};

export default VideoCall;