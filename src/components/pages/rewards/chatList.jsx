/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState } from "react";

const ChatList = ({
  name,
  discrip,
  points,
  img,
  activeId,
  setActiveChatId,
  setShowChat,
  setChatLoading,
  id,
  time,
  notify,
  data,
  setChatDetail,
  setCheckMsg,
  status,
  activeUser,
}) => {
  const [badge, setBadge] = useState(null);

  const toggleData = (chatData) => {
    setChatLoading(true);
    setChatDetail(chatData);
    setCheckMsg(true);
    setShowChat(true);
    // setCheck(true);
    setActiveChatId(chatData?.id);
    if (notify > 0) {
      setBadge("");
      // notifyUpdate(chatData?.sender_id);
    }
  };
  const isActive = id === activeId;
  // useEffect(() => {
  //     if (isActive) {
  //         toggleData(data)
  //     }
  // }, [activeId, isActive])

  const notifyUpdate = (id) => { };
  return (
    <div>
      <div
        className={`_link_  border-0 `}
        onClick={() => toggleData(data)}
      >
        <div
          className={`d-flex align-items-center chat-list-link border-b-2 border-b-[#E5E9EB] px-3 py-3 w-100 ${isActive ? "active" : ""
            }`}
        >
          <div>
            {/* <div className={`${status ? "status_div00" : ""}`}> */}
            <div className="position-relative">
              <img src={global.IMAGEURL + '/' + img} alt="" className="chat_profile_img" />
            </div>
          </div>
          {/* </div> */}

          <div className="d-flex justify-content-between align-items-center w-100 pe-1">
            <div className="ps-2 mt-1">
              <span className="text_dark inter_semibold line-clamp-1">{points}</span>
              <h4 className="text-xs text_secondary inter_medium line-clamp-1">{name}</h4>
              <div className="chat_detail00 line-clamp-1">{discrip}</div>
            </div>
            <div className="time_div00">
              <span
                className="noti_badges text-sm"
                style={{ height: "18px", width: "18px" }}
                id="chatbadge"
              >
                {badge === null ? notify : badge}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatList;
