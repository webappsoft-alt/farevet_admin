/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import {
  calenderdashboard,
  revenue2dashboard,
  rewarddashboard,
  userdashboard,
  workdashboard,
} from "../icons/icon";
import { apiRequest } from "../../api/auth_api";
import { useDispatch } from "react-redux";
import { setChatCount } from "../../redux/videoCall";

function DashboardCard({ icon, iconBg, title, value, children }) {
  return (
    <div className="flex h-full min-h-[140px] gap-3 rounded-xl border border-[#E8E8F0] bg_white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
      >
        <img src={icon} alt="" className="h-7 w-7 object-contain" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="inter_semibold text-[11px] font-bold uppercase tracking-wider text_secondary">
          {title}
        </span>
        <span className="text_dark inter_semibold text-2xl tabular-nums leading-tight md:text-3xl">
          {value}
        </span>
        {children ? (
          <div className="mt-0.5 flex flex-col gap-1 border-t border-[#F0F0F5] pt-2">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatLine({ label, val }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[12px] leading-snug">
      <span className="inter_regular shrink-0 text_secondary">{label}</span>
      <span className="inter_semibold text_dark tabular-nums">{val}</span>
    </div>
  );
}

const Dashboard = () => {
  const [data, setdata] = useState([]);
  const userData = JSON.parse(
    window.localStorage.getItem("login_farevet_formData"),
  );
  const user_type = window.localStorage.getItem("user_type");
  const dispatch = useDispatch();

  const getChatCount = async () => {
    const body = new FormData();
    body.append(
      "type",
      user_type === "vet" ? "vet_unseen_overall" : "unseen_overall",
    );
    await apiRequest({ body })
      .then((res) => {
        if (res) {
          if (user_type === "vet") {
            dispatch(setChatCount(res.vet_unseen_overall));
          } else {
            dispatch(setChatCount(res.unseen_overall));
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (userData) {
      getChatCount();
    }
  }, []);

  const handleFetchData = async () => {
    try {
      const body = new FormData();
      body.append("type", "get_dashboard_count");
      const res = await apiRequest({ body });
      if (res) {
        setdata(res);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    handleFetchData();
  }, []);

  const revenueTotal =
    (parseInt(data?.appointment_amount, 10) || 0) +
    (parseInt(data?.order_amount, 10) || 0);

  return (
    <main className="container m-auto height_calc w-full px-3 py-6 md:px-4">
      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        <DashboardCard
          icon={userdashboard}
          iconBg="bg-[#F9F1FF]"
          title="Users"
          value={data?.all_users ?? "0"}
        />
        <DashboardCard
          icon={workdashboard}
          iconBg="bg-[#FFF9ED]"
          title="Business"
          value={data?.all_businesses ?? "0"}
        >
          <StatLine label="Professional" val={data?.professional ?? "0"} />
          <StatLine label="Unclaimed" val={data?.unclaimed ?? "0"} />
          <StatLine label="Claimed" val={data?.claimed ?? "0"} />
        </DashboardCard>
        <DashboardCard
          icon={calenderdashboard}
          iconBg="bg-[#EDFFFA]"
          title="Appointment"
          value={data?.all_orders ?? "0"}
        >
          <StatLine label="Confirmed" val={data?.completed_orders ?? "0"} />
          <StatLine label="Pending" val={data?.pending_orders ?? "0"} />
          <StatLine label="Canceled" val={data?.cancelled_orders ?? "0"} />
        </DashboardCard>
        <DashboardCard
          icon={revenue2dashboard}
          iconBg="bg-[#EDF7FF]"
          title="Revenue (USD)"
          value={String(revenueTotal)}
        >
          <StatLine label="Order" val={data?.order_amount ?? "0"} />
          <StatLine label="Appointment" val={data?.appointment_amount ?? "0"} />
        </DashboardCard>
        <DashboardCard
          icon={rewarddashboard}
          iconBg="bg-[#FFEFED]"
          title="Rewards"
          value={data?.total_rewards ?? "0"}
        >
          <StatLine label="Level 1" val={data?.level_1 ?? "0"} />
          <StatLine label="Level 2" val={data?.level_2 ?? "0"} />
          <StatLine label="Level 3" val={data?.level_3 ?? "0"} />
          <StatLine label="Level 4" val={data?.level_4 ?? "0"} />
          <StatLine label="Level 5" val={data?.level_5 ?? "0"} />
        </DashboardCard>
      </div>
    </main>
  );
};

export default Dashboard;
