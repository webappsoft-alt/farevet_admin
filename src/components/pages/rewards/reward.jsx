/* eslint-disable react-hooks/exhaustive-deps */
import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Form, Input, InputNumber, Modal, message } from "antd";
import { Spinner } from "react-bootstrap";
import moment from "moment";
import ReactPaginate from "react-paginate";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../../../api/auth_api";
import ProductTableNoData from "../../DataTable/NoDataComponent";
import { arrowleft2, arrowright2, edit2, preview, trash } from "../../icons/icon";
import "../medicationDatabase.scss";

const { TextArea } = Input;

const PAGE_SIZE = 10;
const REDEMPTION_PAGE_SIZE = 50;
const REWARD_CATEGORIES = [
  { key: "credits", label: "Credits" },
  { key: "gift_cards", label: "Gift Cards" },
  { key: "swag", label: "Swag" },
  { key: "donate", label: "Donate" },
];
const REDEMPTION_TABS = [{ key: "all", label: "All" }, ...REWARD_CATEGORIES];

function getAdminId() {
  const data = JSON.parse(
    window.localStorage.getItem("login_farevet_formData") || "{}",
  );
  return data?.user_id || data?.id || 1;
}

function toFormData(payload) {
  const body = new FormData();
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    body.append(key, String(value));
  });
  return body;
}

async function postType(payload) {
  return apiRequest({ body: toFormData(payload) });
}

function safeArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.list)) return value.list;
  return [];
}

function safeNumber(value) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value) {
  if (!value) return "—";
  const date = moment(value);
  if (!date.isValid()) return String(value);
  return date.format("DD MMM YYYY, hh:mm A");
}

function categoryLabel(categoryKey) {
  return (
    REWARD_CATEGORIES.find((item) => item.key === categoryKey)?.label ||
    String(categoryKey || "—")
  );
}

function isRewardActive(value) {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    String(value || "").toLowerCase() === "true"
  );
}

function statusClass(status) {
  const value = String(status || "").toLowerCase();
  if (value === "fulfilled" || value === "approved") return "med-status med-s-active";
  if (value === "rejected") return "med-status med-s-urgent";
  return "med-tag med-tg-b";
}

function sectionFromPath(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "reward") return "points-leaderboard";
  return parts[1] || "points-leaderboard";
}

const Reward = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { redemptionId } = useParams();
  const adminId = useMemo(() => getAdminId(), []);
  const section = sectionFromPath(location.pathname);
  const isDetailPage = section === "redemptions" && Boolean(redemptionId);

  const [unseenCounts, setUnseenCounts] = useState({
    unseen_redemptions_count: 0,
    unseen_messages_count: 0,
  });
  const unseenTimerRef = useRef(null);
  const unseenLoadingRef = useRef(false);

  const [leaderboardRows, setLeaderboardRows] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const [leaderboardCount, setLeaderboardCount] = useState(0);

  const [activeItemCategory, setActiveItemCategory] = useState("credits");
  const [itemPages, setItemPages] = useState({
    credits: 1,
    gift_cards: 1,
    swag: 1,
    donate: 1,
  });
  const [rewardRowsByCategory, setRewardRowsByCategory] = useState({
    credits: [],
    gift_cards: [],
    swag: [],
    donate: [],
  });
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [rewardModalMode, setRewardModalMode] = useState("create");
  const [rewardEditing, setRewardEditing] = useState(null);
  const [rewardSaving, setRewardSaving] = useState(false);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [rewardPendingDeactivate, setRewardPendingDeactivate] = useState(null);
  const [rewardForm] = Form.useForm();

  const [activeRedemptionCategory, setActiveRedemptionCategory] = useState("all");
  const [redemptionsStatus, setRedemptionsStatus] = useState("pending");
  const [redemptionsPage, setRedemptionsPage] = useState(1);
  const [redemptionsCount, setRedemptionsCount] = useState(0);
  const [redemptionRows, setRedemptionRows] = useState([]);
  const [redemptionsLoading, setRedemptionsLoading] = useState(false);

  const [redemptionDetail, setRedemptionDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionModalType, setActionModalType] = useState("approve");
  const [actionModalTargetId, setActionModalTargetId] = useState(null);
  const [actionNote, setActionNote] = useState("");

  const unseenTotal = useMemo(
    () =>
      safeNumber(unseenCounts.unseen_redemptions_count) +
      safeNumber(unseenCounts.unseen_messages_count),
    [unseenCounts],
  );

  const activeItemRows = rewardRowsByCategory[activeItemCategory] || [];
  const itemPage = itemPages[activeItemCategory] || 1;
  const itemPageCount = Math.max(1, Math.ceil(activeItemRows.length / PAGE_SIZE));
  const visibleItemRows = activeItemRows.slice(
    (itemPage - 1) * PAGE_SIZE,
    itemPage * PAGE_SIZE,
  );
  const leaderboardPageCount = Math.max(
    1,
    Math.ceil((leaderboardCount || leaderboardRows.length || 0) / PAGE_SIZE),
  );
  const redemptionsPageCount = Math.max(
    1,
    Math.ceil((redemptionsCount || redemptionRows.length || 0) / REDEMPTION_PAGE_SIZE),
  );

  const detailMessages = useMemo(() => {
    return safeArray(
      redemptionDetail?.messages ||
        redemptionDetail?.message_thread ||
        redemptionDetail?.thread,
    );
  }, [redemptionDetail]);

  const detailUser =
    redemptionDetail?.user || redemptionDetail?.user_info || redemptionDetail?.customer;
  const detailReward =
    redemptionDetail?.reward || redemptionDetail?.reward_details || null;
  const detailShipping =
    redemptionDetail?.shipping || redemptionDetail?.shipping_info || null;
  const detailStatus =
    redemptionDetail?.status || redemptionDetail?.redemption_status || "";

  const Previous = () => (
    <Fragment>
      <span>
        <img src={arrowleft2} alt="" />
      </span>
    </Fragment>
  );

  const Next = () => (
    <Fragment>
      <span>
        <img src={arrowright2} alt="" />
      </span>
    </Fragment>
  );

  const renderPagination = (currentPage, setPage, pageCount) => {
    return (
      <ReactPaginate
        previousLabel={<Previous />}
        nextLabel={<Next />}
        forcePage={Math.max(0, currentPage - 1)}
        onPageChange={(page) => setPage(page.selected + 1)}
        pageCount={pageCount}
        breakLabel="..."
        pageRangeDisplayed={2}
        marginPagesDisplayed={2}
        activeClassName="active"
        pageClassName="page-item"
        breakClassName="page-item"
        nextLinkClassName="page-link"
        pageLinkClassName="page-link"
        breakLinkClassName="page-link"
        previousLinkClassName="page-link"
        nextClassName="page-item next-item"
        previousClassName="page-item prev-item"
        containerClassName="pagination product-table-farevet-pagination react-paginate separated-pagination pagination-sm justify-content-end"
      />
    );
  };

  const fetchUnseen = async (includeList = 0) => {
    if (unseenLoadingRef.current) return;
    unseenLoadingRef.current = true;
    try {
      const res = await postType({
        type: "admin_redemption_unseen",
        admin_id: adminId,
        limit: 50,
        include_list: includeList ? 1 : 0,
      });
      if (res) {
        setUnseenCounts({
          unseen_redemptions_count: safeNumber(
            res.unseen_redemptions_count ??
              res.unseen_redemptions ??
              res.unseen_count,
          ),
          unseen_messages_count: safeNumber(
            res.unseen_messages_count ?? res.unseen_messages,
          ),
        });
      }
    } finally {
      unseenLoadingRef.current = false;
    }
  };

  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const offset = (leaderboardPage - 1) * PAGE_SIZE;
      const res = await postType({
        type: "admin_points_users",
        admin_id: adminId,
        limit: PAGE_SIZE,
        offset,
      });
      setLeaderboardRows(safeArray(res));
      setLeaderboardCount(
        safeNumber(res?.count ?? res?.total ?? safeArray(res).length),
      );
    } catch (error) {
      setLeaderboardRows([]);
      setLeaderboardCount(0);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const fetchRewardCategory = async (category) => {
    setRewardsLoading(true);
    try {
      const res = await postType({
        type: "admin_list_rewards",
        admin_id: adminId,
        category,
      });
      setRewardRowsByCategory((prev) => ({
        ...prev,
        [category]: safeArray(res).map((row) => ({
          ...row,
          category: row?.category || category,
        })),
      }));
    } catch (error) {
      setRewardRowsByCategory((prev) => ({
        ...prev,
        [category]: [],
      }));
    } finally {
      setRewardsLoading(false);
    }
  };

  const fetchRedemptions = async () => {
    setRedemptionsLoading(true);
    try {
      const offset = (redemptionsPage - 1) * REDEMPTION_PAGE_SIZE;
      const res = await postType({
        type: "admin_redemptions",
        admin_id: adminId,
        status: redemptionsStatus,
        category: activeRedemptionCategory === "all" ? "" : activeRedemptionCategory,
        limit: REDEMPTION_PAGE_SIZE,
        offset,
      });
      setRedemptionRows(safeArray(res));
      setRedemptionsCount(
        safeNumber(res?.count ?? res?.total ?? safeArray(res).length),
      );
    } catch (error) {
      setRedemptionRows([]);
      setRedemptionsCount(0);
    } finally {
      setRedemptionsLoading(false);
    }
  };

  const fetchRedemptionDetail = async (id) => {
    if (!id) return;
    setDetailLoading(true);
    try {
      const res = await postType({
        type: "admin_redemption_detail",
        admin_id: adminId,
        redemption_id: id,
      });
      setRedemptionDetail(res);
    } catch (error) {
      setRedemptionDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const markSeen = async (id) => {
    if (!id) return;
    try {
      await postType({
        type: "admin_redemption_unseen",
        admin_id: adminId,
        action: "mark_seen",
        redemption_id: id,
      });
      fetchUnseen(0);
    } catch (error) {
      // ignore
    }
  };

  useEffect(() => {
    fetchUnseen(0);
    unseenTimerRef.current = setInterval(() => {
      if (!unseenLoadingRef.current) fetchUnseen(0);
    }, 15000);
    return () => {
      if (unseenTimerRef.current) clearInterval(unseenTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (section === "points-leaderboard") {
      fetchLeaderboard();
    }
  }, [section, leaderboardPage]);

  useEffect(() => {
    if (section === "items") {
      fetchRewardCategory(activeItemCategory);
    }
  }, [section, activeItemCategory]);

  useEffect(() => {
    if (section === "redemptions" && !isDetailPage) {
      fetchRedemptions();
    }
  }, [section, isDetailPage, redemptionsPage, redemptionsStatus, activeRedemptionCategory]);

  useEffect(() => {
    if (isDetailPage && redemptionId) {
      fetchRedemptionDetail(redemptionId);
      markSeen(redemptionId);
    }
  }, [isDetailPage, redemptionId]);

  const openCreateReward = () => {
    setRewardEditing(null);
    setRewardModalMode("create");
    rewardForm.resetFields();
    rewardForm.setFieldsValue({
      reward_key: "",
      title: "",
      description: "",
      points_cost: undefined,
      dollar_value: "",
      credits_amount: undefined,
      sort_order: activeItemRows.length + 1,
    });
    setRewardModalOpen(true);
  };

  const openEditReward = (row) => {
    setRewardEditing(row);
    setRewardModalMode("edit");
    rewardForm.resetFields();
    rewardForm.setFieldsValue({
      reward_key: row?.reward_key || "",
      title: row?.title || "",
      description: row?.description || "",
      points_cost:
        row?.points_cost !== undefined ? Number(row.points_cost) : undefined,
      dollar_value: row?.dollar_value || "",
      credits_amount:
        row?.credits_amount !== undefined ? Number(row.credits_amount) : undefined,
      sort_order:
        row?.sort_order !== undefined ? Number(row.sort_order) : undefined,
    });
    setRewardModalOpen(true);
  };

  const saveReward = async () => {
    let values;
    try {
      values = await rewardForm.validateFields();
    } catch {
      return;
    }

    setRewardSaving(true);
    try {
      const payload = {
        type: "admin_save_reward",
        admin_id: adminId,
        category: activeItemCategory,
        reward_key: values.reward_key,
        title: values.title,
        description: values.description,
        points_cost: values.points_cost,
        dollar_value: values.dollar_value,
        credits_amount:
          activeItemCategory === "credits" ? values.credits_amount : undefined,
        sort_order: values.sort_order,
        is_active: 1,
      };
      const rewardId = rewardEditing?.reward_id || rewardEditing?.id;
      if (rewardModalMode === "edit" && rewardId) {
        payload.reward_id = rewardId;
      }

      const res = await postType(payload);
      if (res?.result === false) {
        message.error(res?.message || "Reward save failed.");
        return;
      }
      message.success(
        rewardModalMode === "create"
          ? "Reward created successfully."
          : "Reward updated successfully.",
      );
      setRewardModalOpen(false);
      await fetchRewardCategory(activeItemCategory);
    } finally {
      setRewardSaving(false);
    }
  };

  const openDeactivateRewardModal = (row) => {
    const rewardId = row?.reward_id || row?.id;
    if (!rewardId) return;
    setRewardPendingDeactivate(row);
    setDeactivateModalOpen(true);
  };

  const deactivateReward = async () => {
    const rewardId =
      rewardPendingDeactivate?.reward_id || rewardPendingDeactivate?.id;
    if (!rewardId) return;
    setRewardSaving(true);
    try {
      const res = await postType({
        type: "admin_save_reward",
        admin_id: adminId,
        reward_id: rewardId,
        is_active: 0,
      });
      if (res?.result === false) {
        message.error(res?.message || "Reward update failed.");
        return;
      }
      message.success("Reward deactivated.");
      setDeactivateModalOpen(false);
      setRewardPendingDeactivate(null);
      await fetchRewardCategory(activeItemCategory);
    } finally {
      setRewardSaving(false);
    }
  };

  const openRedemptionDetail = (row) => {
    const id = row?.redemption_id || row?.id;
    if (!id) return;
    navigate(`/reward/redemptions/${id}`);
  };

  const sendRedemptionMessage = async () => {
    const text = String(messageText || "").trim();
    if (!text || !redemptionId) return;
    setSendingMessage(true);
    try {
      const res = await postType({
        type: "admin_redemption_message",
        admin_id: adminId,
        redemption_id: redemptionId,
        message: text,
      });
      if (res?.result === false) {
        message.error(res?.message || "Message send failed.");
        return;
      }
      message.success("Message sent.");
      setMessageText("");
      await fetchRedemptionDetail(redemptionId);
      fetchUnseen(0);
    } finally {
      setSendingMessage(false);
    }
  };

  const openRedemptionActionModal = (targetId, action) => {
    if (!targetId) return;
    setActionModalTargetId(targetId);
    setActionModalType(action);
    setActionNote("");
    setActionModalOpen(true);
  };

  const submitRedemptionAction = async () => {
    if (!actionModalTargetId) return;
    const isApprove = actionModalType === "approve";
    setActionLoading(true);
    try {
      const payload = {
        type: "admin_redemption_action",
        admin_id: adminId,
        redemption_id: actionModalTargetId,
        action: actionModalType,
        admin_note: String(actionNote || "").trim(),
      };

      const res = await postType(payload);
      if (res?.result === false) {
        message.error(res?.message || "Action failed.");
        return;
      }

      message.success(isApprove ? "Redemption approved." : "Redemption rejected.");
      setActionModalOpen(false);
      setActionModalTargetId(null);
      setActionNote("");
      await fetchRedemptions();
      if (redemptionId && String(redemptionId) === String(actionModalTargetId)) {
        await fetchRedemptionDetail(redemptionId);
      }
      fetchUnseen(0);
    } finally {
      setActionLoading(false);
    }
  };

  const renderCategoryTabs = (items, activeKey, onChange) => (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        marginBottom: 12,
      }}
    >
      {items.map((item) => {
        const isActive = activeKey === item.key;
        return (
          <button
            key={item.key}
            type="button"
            className={`med-btn ${isActive ? "med-btn-primary" : "med-btn-ghost"}`}
            onClick={() => onChange(item.key)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );

  const renderLeaderboard = () => (
    <div className="medication-panel">
      <div className="med-page-hdr">
        <div>
          <div className="med-page-title">Points Leaderboard</div>
          <div className="med-page-sub">
            Users with points activity and current redemption summary.
          </div>
        </div>
      </div>

      <div className="med-card">
        <div className="med-ph">
          <div className="med-pt">
            Points Users - {leaderboardCount || leaderboardRows.length || 0}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="med-tbl" style={{ minWidth: 1100 }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Earned Points</th>
                <th>Hero Level</th>
                <th>Bills</th>
                <th>Pending Redemptions</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 24 }}>
                    <Spinner size="sm" color="inherit" />
                  </td>
                </tr>
              ) : leaderboardRows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 24 }}>
                    <ProductTableNoData
                      title="No points users found."
                      subtitle="There is nothing to show yet."
                    />
                  </td>
                </tr>
              ) : (
                leaderboardRows.map((row, index) => (
                  <tr key={row?.user_id || row?.id || index}>
                    <td className="med-bold">{row?.name || row?.full_name || "—"}</td>
                    <td>{row?.email || "—"}</td>
                    <td>{row?.earned_points ?? row?.points ?? "—"}</td>
                    <td>{row?.hero_level || row?.level || "—"}</td>
                    <td>{row?.bills_uploaded ?? row?.bills ?? "—"}</td>
                    <td>{row?.pending_redemptions ?? row?.pending ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="med-pb">
          {renderPagination(leaderboardPage, setLeaderboardPage, leaderboardPageCount)}
        </div>
      </div>
    </div>
  );

  const renderItems = () => (
    <div className="medication-panel">
      <div className="med-page-hdr">
        <div>
          <div className="med-page-title">Rewards</div>
          <div className="med-page-sub">
            Manage rewards category-wise with the same backend payload structure.
          </div>
        </div>
      </div>

      {renderCategoryTabs(REWARD_CATEGORIES, activeItemCategory, (category) => {
        setActiveItemCategory(category);
        setItemPages((prev) => ({ ...prev, [category]: 1 }));
      })}

      <div className="med-card">
        <div className="med-ph">
          <div className="med-pt">
            {categoryLabel(activeItemCategory)} - {activeItemRows.length || 0}
          </div>
          <button
            type="button"
            className="med-btn med-btn-primary"
            onClick={openCreateReward}
          >
            + Create Reward
          </button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="med-tbl" style={{ minWidth: 1080 }}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Points Cost</th>
                <th>Dollar Value</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rewardsLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 24 }}>
                    <Spinner size="sm" color="inherit" />
                  </td>
                </tr>
              ) : visibleItemRows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 24 }}>
                    <ProductTableNoData
                      title="No rewards found."
                      subtitle="Create the first reward for this category."
                    />
                  </td>
                </tr>
              ) : (
                visibleItemRows.map((row, index) => (
                  <tr key={row?.reward_id || row?.id || index}>
                    <td>
                      <div className="med-bold">{row?.title || "—"}</div>
                      <div style={{ fontSize: 11, color: "var(--med-ink3)" }}>
                        {row?.reward_key || "—"}
                      </div>
                    </td>
                    <td>{categoryLabel(row?.category || activeItemCategory)}</td>
                    <td>{row?.points_cost ?? "—"}</td>
                    <td>{row?.dollar_value || "—"}</td>
                    <td>
                      {(() => {
                        const active = isRewardActive(row?.is_active ?? 1);
                        return (
                      <span
                        className={
                              active
                            ? "med-status med-s-active"
                            : "med-tag med-tg-a"
                        }
                      >
                            {active ? "Active" : "Inactive"}
                      </span>
                        );
                      })()}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button
                          type="button"
                          className="bg-[#54A6FF] flex justify-center rounded-3 items-center"
                          style={{ width: "24px", height: "24px", backgroundColor: "#54A6FF" }}
                          onClick={() => openEditReward(row)}
                          aria-label="Edit reward"
                        >
                          <img style={{ width: "14px", height: "auto" }} src={edit2} alt="" />
                        </button>
                        <button
                          type="button"
                          className="bg-[#ED5D67] flex justify-center rounded-3 items-center"
                          style={{ width: "24px", height: "24px", backgroundColor: "#ED5D67", opacity: rewardSaving ? 0.7 : 1 }}
                          onClick={() => openDeactivateRewardModal(row)}
                          disabled={rewardSaving}
                          aria-label="Deactivate reward"
                        >
                          <img style={{ width: "14px", height: "auto" }} src={trash} alt="" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="med-pb">
          {renderPagination(
            itemPage,
            (page) =>
              setItemPages((prev) => ({
                ...prev,
                [activeItemCategory]: page,
              })),
            itemPageCount,
          )}
        </div>
      </div>

      <Modal
        title={
          rewardModalMode === "create"
            ? `Create ${categoryLabel(activeItemCategory)} Reward`
            : `Edit ${categoryLabel(activeItemCategory)} Reward`
        }
        open={rewardModalOpen}
        onCancel={() => setRewardModalOpen(false)}
        onOk={saveReward}
        okText={rewardModalMode === "create" ? "Create" : "Save"}
        confirmLoading={rewardSaving}
        okButtonProps={{
          style: {
            backgroundColor: "#8930F9",
            borderColor: "#8930F9",
            color: "#ffffff",
          },
        }}
        destroyOnClose
      >
        <Form form={rewardForm} layout="vertical">
          <Form.Item label="Category">
            <Input value={categoryLabel(activeItemCategory)} disabled />
          </Form.Item>
          <Form.Item
            name="reward_key"
            label="Reward Key"
            rules={[{ required: true, message: "Reward key is required" }]}
          >
            <Input placeholder="amazon_25 / credit_5" />
          </Form.Item>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Title is required" }]}
          >
            <Input placeholder="Reward title" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Reward description" />
          </Form.Item>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Form.Item
              name="points_cost"
              label="Points Cost"
              rules={[{ required: true, message: "Points cost is required" }]}
            >
              <InputNumber className="w-full" min={0} precision={0} />
            </Form.Item>
            <Form.Item name="dollar_value" label="Dollar Value">
              <Input placeholder="25.00" />
            </Form.Item>
            {activeItemCategory === "credits" ? (
              <Form.Item
                name="credits_amount"
                label="Credits Amount"
                rules={[{ required: true, message: "Credits amount is required" }]}
              >
                <InputNumber className="w-full" min={0} precision={0} />
              </Form.Item>
            ) : null}
            <Form.Item name="sort_order" label="Sort Order">
              <InputNumber className="w-full" min={0} precision={0} />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        title="Deactivate Reward"
        open={deactivateModalOpen}
        onCancel={() => {
          if (rewardSaving) return;
          setDeactivateModalOpen(false);
          setRewardPendingDeactivate(null);
        }}
        onOk={deactivateReward}
        okText="Deactivate"
        cancelText="Cancel"
        confirmLoading={rewardSaving}
        okButtonProps={{
          style: {
            backgroundColor: "#8930F9",
            borderColor: "#8930F9",
            color: "#ffffff",
          },
        }}
        destroyOnClose
      >
        <p style={{ marginBottom: 8 }}>
          Are you sure you want to deactivate this reward?
        </p>
        <p style={{ marginBottom: 0, color: "#6b7280", fontSize: 13 }}>
          This will send <strong>`is_active: 0`</strong> for{" "}
          <strong>{rewardPendingDeactivate?.title || "this reward"}</strong>.
        </p>
      </Modal>
    </div>
  );

  const renderRedemptions = () => (
    <div className="medication-panel">
      <div className="med-page-hdr">
        <div>
          <div className="med-page-title">Redemptions</div>
          <div className="med-page-sub">
            Review redemption requests category-wise and open detail to approve or reject.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Badge count={safeNumber(unseenCounts.unseen_redemptions_count)} overflowCount={99}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>Unseen redemptions</span>
          </Badge>
          <Badge count={safeNumber(unseenCounts.unseen_messages_count)} overflowCount={99}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>Unseen messages</span>
          </Badge>
        </div>
      </div>

      {renderCategoryTabs(REDEMPTION_TABS, activeRedemptionCategory, (category) => {
        setActiveRedemptionCategory(category);
        setRedemptionsPage(1);
      })}

      <div className="med-card">
        <div className="med-ph">
          <div className="med-pt capitalize">
            {categoryLabel(activeRedemptionCategory === "all" ? "all" : activeRedemptionCategory)} Redemptions
          </div>
          <select
            value={redemptionsStatus}
            onChange={(e) => {
              setRedemptionsStatus(e.target.value);
              setRedemptionsPage(1);
            }}
            className="med-fsel"
            aria-label="Filter redemptions"
          >
            <option value="pending">Pending</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="med-tbl" style={{ minWidth: 1180 }}>
            <thead>
              <tr>
                <th>User</th>
                <th>Reward</th>
                <th>Category</th>
                <th>Points</th>
                <th>Status</th>
                <th>Messages</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {redemptionsLoading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 24 }}>
                    <Spinner size="sm" color="inherit" />
                  </td>
                </tr>
              ) : redemptionRows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 24 }}>
                    <ProductTableNoData
                      title="No redemptions found."
                      subtitle="There is nothing to show for this filter."
                    />
                  </td>
                </tr>
              ) : (
                redemptionRows.map((row, index) => (
                  <tr key={row?.redemption_id || row?.id || index}>
                    <td>
                      <div className="med-bold">
                        {row?.user_name || row?.name || row?.customer_name || "—"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--med-ink3)" }}>
                        {row?.email || row?.user_email || "—"}
                      </div>
                    </td>
                    <td>{row?.reward_title || row?.title || "—"}</td>
                    <td>{categoryLabel(row?.category)}</td>
                    <td>{row?.points_cost ?? "—"}</td>
                    <td>
                      <span className={statusClass(row?.status)}>
                        {String(row?.status || "Pending")}
                      </span>
                    </td>
                    <td>{row?.message_count ?? row?.messages_count ?? "0"}</td>
                    <td>{formatDate(row?.created_at || row?.created_date)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="med-btn med-btn-primary med-btn-sm"
                          onClick={() =>
                            openRedemptionActionModal(
                              row?.redemption_id || row?.id,
                              "approve",
                            )
                          }
                          disabled={String(row?.status || "").toLowerCase() !== "pending" || actionLoading}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="med-btn med-btn-amber med-btn-sm"
                          onClick={() =>
                            openRedemptionActionModal(
                              row?.redemption_id || row?.id,
                              "reject",
                            )
                          }
                          disabled={String(row?.status || "").toLowerCase() !== "pending" || actionLoading}
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          className="bg-[#54A6FF] flex justify-center rounded-3 items-center"
                          style={{ width: "24px", height: "24px", backgroundColor: "#54A6FF" }}
                          onClick={() => openRedemptionDetail(row)}
                          aria-label="View redemption"
                        >
                          <img style={{ width: "14px", height: "auto" }} src={preview} alt="" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="med-pb">
          {renderPagination(redemptionsPage, setRedemptionsPage, redemptionsPageCount)}
        </div>
      </div>
    </div>
  );

  const renderRedemptionDetail = () => (
    <div className="medication-panel">
      <div className="med-page-hdr">
        <div>
          <div className="med-page-title">Redemption Detail</div>
          <div className="med-page-sub">
            Review request details. Approve and reject actions are handled from the redemption list.
          </div>
        </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="med-btn med-btn-ghost"
              onClick={() => navigate("/reward/redemptions")}
            >
              Back to Redemptions
            </button>
          </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(320px, 1fr) minmax(360px, 1fr)",
          gap: 16,
        }}
      >
        <div className="med-card">
          <div className="med-ph">
            <div className="med-pt">Request Info</div>
          </div>
          <div className="med-pb">
            {detailLoading ? (
              <div style={{ textAlign: "center", padding: 24 }}>
                <Spinner size="sm" color="inherit" />
              </div>
            ) : !redemptionDetail ? (
              <ProductTableNoData
                title="No redemption detail found."
                subtitle="Please try again."
              />
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <div className="med-stat-lbl">User Info</div>
                  <div className="med-bold">
                    {detailUser?.name ||
                      detailUser?.full_name ||
                      redemptionDetail?.user_name ||
                      "—"}
                  </div>
                  <div style={{ color: "var(--med-ink3)", fontSize: 12 }}>
                    {detailUser?.email ||
                      redemptionDetail?.email ||
                      redemptionDetail?.user_email ||
                      "—"}
                  </div>
                </div>
                <div>
                  <div className="med-stat-lbl">Reward Info</div>
                  <div>{detailReward?.title || redemptionDetail?.reward_title || "—"}</div>
                  <div style={{ color: "var(--med-ink3)", fontSize: 12 }}>
                    {categoryLabel(detailReward?.category || redemptionDetail?.category)}
                  </div>
                </div>
                <div>
                  <div className="med-stat-lbl">Status</div>
                  <span className={statusClass(detailStatus)}>{detailStatus || "pending"}</span>
                </div>
                <div>
                  <div className="med-stat-lbl">Shipping Info</div>
                  <div>
                    {String(detailReward?.category || redemptionDetail?.category) === "swag"
                      ? detailShipping?.address ||
                        detailShipping?.shipping_address ||
                        detailShipping?.full_address ||
                        "—"
                      : "Not required for this category."}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="med-card">
          <div className="med-ph">
            <div className="med-pt">Chat / Actions</div>
          </div>
          <div className="med-pb">
            <ProductTableNoData
              title="Chat system will be added later."
              subtitle="Approve and reject actions are available in the redemptions list section."
            />
          </div>
        </div>
      </div>
    </div>
  );

  const actionModalNode = (
    <Modal
      title={
        actionModalType === "approve"
          ? "Approve Redemption"
          : "Reject Redemption"
      }
      open={actionModalOpen}
      centered
      onCancel={() => {
        if (actionLoading) return;
        setActionModalOpen(false);
        setActionModalTargetId(null);
        setActionNote("");
      }}
      onOk={submitRedemptionAction}
      okText={actionModalType === "approve" ? "Approve" : "Reject"}
      cancelText="Cancel"
      confirmLoading={actionLoading}
      okButtonProps={{
        style: {
          backgroundColor: "#8930F9",
          borderColor: "#8930F9",
          color: "#ffffff",
        },
      }}
      destroyOnClose
    >
      <div style={{ display: "grid", gap: 10 }}>
        <p style={{ marginBottom: 0, color: "#6b7280", fontSize: 13 }}>
          {actionModalType === "approve"
            ? "Add an admin note before approving this redemption."
            : "Add an admin note before rejecting this redemption."}
        </p>
        <TextArea
          rows={5}
          value={actionNote}
          placeholder="Enter admin note..."
          onChange={(e) => setActionNote(e.target.value)}
        />
      </div>
    </Modal>
  );

  if (isDetailPage) {
    return (
      <>
        {renderRedemptionDetail()}
        {actionModalNode}
      </>
    );
  }

  if (section === "items") {
    return (
      <>
        {renderItems()}
        {actionModalNode}
      </>
    );
  }

  if (section === "redemptions") {
    return (
      <>
        {renderRedemptions()}
        {actionModalNode}
      </>
    );
  }

  return (
    <>
      {renderLeaderboard()}
      {actionModalNode}
    </>
  );
};

export default Reward;
