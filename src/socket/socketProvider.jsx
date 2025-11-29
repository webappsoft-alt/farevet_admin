/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { useDispatch } from "react-redux";
import { io } from "socket.io-client";
import { setVideoCallData } from "../redux/videoCall";

const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);
export const SocketProvider = ({ children }) => {
    const userData = JSON.parse(localStorage.getItem('login_farevet_formData'))
    const [socket, setSocket] = useState(null);
    const socketRef = useRef(null);
    const dispatch = useDispatch()

    useEffect(() => {
        const initializeSocket = async () => {
            try {
                const newSocket = io("https://farevetbackendcall.onrender.com", {
                    reconnectionAttempts: 15,
                    transports: ["websocket"],
                });
                newSocket.emit("authenticate", userData?.id + 'vet');
                newSocket.on("authenticated", (id) => {
                    setSocket(newSocket);
                });
                newSocket.on("connect_error", (error) => {
                    console.error("Socket connection error:", error);
                });

                newSocket.on("unauthorized", (error) => {
                    console.error("Unauthorized socket connection:", error.message);
                });
                newSocket.on("start_call", (callData) => {
                    dispatch(setVideoCallData(callData))
                });
                newSocket.on("call_response", (callData) => {
                    console.log(callData);
                });
                newSocket.on("disconnect", () => {
                    console.log("Socket disconnected. Attempting to reconnect...");
                    setSocket(null);
                    initializeSocket();
                });
                socketRef.current = newSocket;
            } catch (error) {
                console.error("Error initializing socket:", error);
            }
        };
        if (userData?.id) {
            initializeSocket();
            console.log("===============Socket Initialize");
        } else {
            // console.log("No userData?.id found for authentication");
        }
        return () => {
            if (!userData?.id && socketRef.current) {
                console.log("Disconnecting socket...");
                socketRef.current.disconnect();
                setSocket(null);
            }
        };
    }, [userData?.id]);

    return (
        <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
    );
};