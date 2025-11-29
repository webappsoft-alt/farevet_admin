/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { Fragment, useEffect, useState } from "react";
import "./chat.css";
import ChatList from "./chatList";
import { avatarman, avatarman2, avatarman3, tickblue, tickgreen, tickorange, tickred, tickyellow } from "../../icons/icon";
import RewardTable from "../../DataTable/rewardTable";
import { apiRequest } from "../../../api/auth_api";

const Reward = () => {
  const [chatLoading, setChatLoading] = useState(false);
  const [chatDetail, setChatDetail] = useState();
  const [showChat, setShowChat] = useState(false);
  const [reward, setReward] = useState([]);
  const [checkMsg, setCheckMsg] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastId, setLastId] = useState(1);
  const [points, c] = useState(null);
  const [count, setCount] = useState(0);
  const [lastId2, setLastId2] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [check, setCheck] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);

  const handleFetchBusiness = async (page) => {
    const body = new FormData();
    body.append("type", "get_list");
    body.append("table_name", "users");
    body.append("user_type", "customer");
    body.append("page", page);
    const res = await apiRequest({ body });
    if (res && res.data) {
      if (page === 1) {
        setReward(res?.data);
      } else {
        setReward(prevReward => [...prevReward, ...res?.data]);
      }
      if (res.data.length < 10) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      if (res.data.length > 0 && page === 1) {
        setActiveChatId(res.data[0].id);
        setChatDetail(res.data[0]);
      }
    }
  };

  useEffect(() => {
    handleFetchBusiness(page);
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    handleFetchBusiness(nextPage);
  };



  const getLevelDetails = (points) => {
    if (points >= 1500) {
      return { level: "Legend", levelName: "Legend Status", tick: tickyellow, color: "#FFCE1E" };
    } else if (points >= 750) {
      return { level: "Superhero", levelName: "Super Hero", tick: tickblue, color: "#0080EF" };
    } else if (points >= 400) {
      return { level: "Prime Hero", levelName: "Prime Hero", tick: tickred, color: "#FF6F61" };
    } else if (points >= 220) {
      return { level: "Junior Hero", levelName: "Junior Hero", tick: tickorange, color: "#FF914D" };
    } else if (points >= 100) {
      return { level: "Rookie Hero", levelName: "Rookie Hero", tick: tickgreen, color: "#06D6A0" };
    } else {
      return null;
    }
  };

  const columns = [
    {
      name: <div className="flex flex-col items-center">
        <h6 className="inter_semibold text_dark">Rookie Hero</h6>
        <span className="inter_medium" style={{ color: "#06D6A0" }}>Level 1</span>
      </div>,
      sortable: true,
      cell: (row) => {
        const levelDetails = getLevelDetails(row.points);
        return (
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center" style={{ opacity: levelDetails?.level === "Rookie Hero" ? 1 : 0.1 }}>
              <img src={tickgreen} alt="" />
            </div>
          </div>
        );
      }
    },
    {
      name: <div className="flex flex-col items-center">
        <h6 className="inter_semibold text_dark">Junior Hero</h6>
        <span className="inter_medium" style={{ color: "#06D6A0" }}>Level 2</span>
      </div>,
      sortable: true,
      cell: (row) => {
        const levelDetails = getLevelDetails(row.points);
        return (
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center" style={{ opacity: levelDetails?.level === "Junior Hero" ? 1 : 0.1 }}>
              <img src={tickorange} alt="" />
            </div>
          </div>
        );
      }
    },
    {
      name: <div className="flex flex-col items-center">
        <h6 className="inter_semibold text_dark">Prime Hero</h6>
        <span className="inter_medium" style={{ color: "#06D6A0" }}>Level 3</span>
      </div>,
      sortable: true,
      cell: (row) => {
        const levelDetails = getLevelDetails(row.points);
        return (
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center" style={{ opacity: levelDetails?.level === "Prime Hero" ? 1 : 0.1 }}>
              <img src={tickred} alt="" />
            </div>
          </div>
        );
      }
    },
    {
      name: <div className="flex flex-col items-center">
        <h6 className="inter_semibold text_dark">Superhero</h6>
        <span className="inter_medium" style={{ color: "#06D6A0" }}>Level 4</span>
      </div>,
      sortable: true,
      cell: (row) => {
        const levelDetails = getLevelDetails(row.points);
        return (
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center" style={{ opacity: levelDetails?.level === "Superhero" ? 1 : 0.1 }}>
              <img src={tickblue} alt="" />
            </div>
          </div>
        );
      }
    },
    {
      name: <div className="flex flex-col items-center">
        <h6 className="inter_semibold text_dark">Legend</h6>
        <span className="inter_medium" style={{ color: "#06D6A0" }}>Level 5</span>
      </div>,
      sortable: true,
      cell: (row) => {
        const levelDetails = getLevelDetails(row.points);
        return (
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center" style={{ opacity: levelDetails?.level === "Legend" ? 1 : 0.1 }}>
              <img src={tickyellow} alt="" />
            </div>
          </div>
        );
      }
    },
  ];

  return (
    <main className='m-auto height_calc flex-grow flex flex-col p-3'>
      <div className="chat_grid">
        <div className={`chat_screen ${!showChat ? "" : "d_chat_none"} []`}>
          <div className="pb-1">
            <div className="flex justify-between items-center p-3">
              <span className="text-2xl text_dark plusJakara_medium">Users</span>
            </div>
            <hr style={{ color: "#EDEEF0" }} className="my-2" />
            <div className="chat_height_contol scrolbar">
              {reward?.map((chat, index) => (
                <Fragment key={index}>
                  <ChatList
                    id={chat?.id}
                    img={chat?.image}
                    points={`${chat?.points} Points`}
                    name={chat?.name}
                    notify={chat?.notify}
                    data={chat}
                    setChatDetail={setChatDetail}
                    setCheckMsg={setCheckMsg}
                    setCheck={setCheck}
                    setShowChat={setShowChat}
                    setChatLoading={setChatLoading}
                    activeId={activeChatId}
                    setActiveChatId={setActiveChatId}
                  />
                </Fragment>
              ))}
              {hasMore && reward.length > 10 && (
                <div className="flex justify-center">
                  <button onClick={loadMore} className="btn_load_more">Load More</button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={`chat_screen ${showChat ? "" : "d_chat_none"} `} id="chatScreen">
          <div className="flex m-3">
            <span className="text-xl md:text-2xl text_dark plusJakara_medium">Farvet Report Cost Reward Program</span>
          </div>
          {activeChatId && (
            <RewardTable
              loading={isProcessing}
              count={count}
              setCurrentPage={setLastId2}
              currentPage={lastId2}
              columns={columns}
              data={reward.filter(user => user.id === activeChatId)}
              setLastId={setLastId}
              activeChatId={activeChatId}
            />
          )}
        </div>
      </div>
    </main>
  );

};

export default Reward;
