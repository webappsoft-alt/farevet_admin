/* eslint-disable react-hooks/exhaustive-deps */
import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Form, Input, InputNumber, Modal, Select, message } from "antd";
import { Spinner } from "react-bootstrap";
import moment from "moment";
import ReactPaginate from "react-paginate";
import { Check } from "react-feather";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../../../api/auth_api";
import CKEditorIframe from "../../ckeditor/CKEditorIframe";
import ProductTableNoData from "../../DataTable/NoDataComponent";
import {
  arrowleft2,
  arrowright2,
  edit2,
  imagecloud,
  preview,
  trash,
} from "../../icons/icon";
import "../medicationDatabase.scss";

const { TextArea } = Input;

const PAGE_SIZE = 10;
const REDEMPTION_PAGE_SIZE = 50;
const REWARD_CATEGORIES = [
  { key: "credits", label: "Credits & Premium" },
  { key: "gift_cards", label: "Gift Cards" },
  { key: "swag", label: "Swag" },
  { key: "donate", label: "Donate" },
];
const CREDIT_REWARD_KINDS = [
  {
    key: "credits",
    label: "Account credits",
    hint: "Adds dollar credits to the user's FareVet balance when approved.",
  },
  {
    key: "premium",
    label: "Premium access",
    hint: "Extends premium subscription by the number of months you set.",
  },
];
const REDEMPTION_TABS = [{ key: "all", label: "All" }, ...REWARD_CATEGORIES];
const SWAG_CATEGORY_PRESETS = [
  "Badges & Pins",
  "Hats",
  "Stickers",
  "T-Shirts",
  "Accessories",
];

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
  if (Array.isArray(value?.rewards)) return value.rewards;
  return [];
}

/** Admin table: newest rewards first (by id or created_at). */
function sortRewardsNewestFirst(rows) {
  return [...rows].sort((a, b) => {
    const aCreated = Date.parse(a?.created_at ?? a?.created_date ?? "");
    const bCreated = Date.parse(b?.created_at ?? b?.created_date ?? "");
    if (Number.isFinite(aCreated) && Number.isFinite(bCreated) && aCreated !== bCreated) {
      return bCreated - aCreated;
    }
    const aId = Number(a?.reward_id ?? a?.id) || 0;
    const bId = Number(b?.reward_id ?? b?.id) || 0;
    return bId - aId;
  });
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

function CreditRewardTypePicker({ value, onChange }) {
  return (
    <div className="reward-type-picker" role="radiogroup" aria-label="Reward type">
      {CREDIT_REWARD_KINDS.map((item) => {
        const selected = value === item.key;
        return (
          <button
            key={item.key}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`reward-type-picker__option${
              selected ? " reward-type-picker__option--active" : ""
            }`}
            onClick={() => onChange?.(item.key)}
          >
            <span className="reward-type-picker__label">{item.label}</span>
            <span className="reward-type-picker__hint">{item.hint}</span>
          </button>
        );
      })}
    </div>
  );
}

function categoryLabel(categoryKey) {
  return (
    REWARD_CATEGORIES.find((item) => item.key === categoryKey)?.label ||
    String(categoryKey || "—")
  );
}

function mergeSwagCategoryOptions(presetList, customList, rows) {
  const fromRows = (rows || [])
    .map((row) => String(row?.swag_category || "").trim())
    .filter(Boolean);
  return [...new Set([...presetList, ...customList, ...fromRows])].sort(
    (a, b) => a.localeCompare(b),
  );
}

function SwagCategorySelect({ value, onChange, options = [], disabled, onCustomCategory }) {
  const [customName, setCustomName] = useState("");

  const selectOptions = options.map((label) => ({
    value: label,
    label,
  }));

  const addCustomCategory = () => {
    const trimmed = compactLine(customName);
    if (!trimmed) return;
    onCustomCategory?.(trimmed);
    onChange?.(trimmed);
    setCustomName("");
  };

  return (
    <Select
      showSearch
      allowClear
      disabled={disabled}
      placeholder="Select swag category"
      value={value || undefined}
      onChange={onChange}
      options={selectOptions}
      optionFilterProp="label"
      dropdownRender={(menu) => (
        <>
          {menu}
          <div
            className="reward-swag-category-custom"
            style={{
              display: "flex",
              gap: 8,
              padding: "8px 12px",
              borderTop: "1px solid #f0f0f0",
            }}
          >
            <Input
              placeholder="Custom category name"
              value={customName}
              disabled={disabled}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomCategory();
                }
              }}
            />
            <Button
              type="default"
              disabled={disabled || !compactLine(customName)}
              onClick={addCustomCategory}
            >
              Add
            </Button>
          </div>
        </>
      )}
    />
  );
}

function suggestRewardKey({ category, kind, creditsAmount, premiumMonths }) {
  if (category !== "credits") return "";
  if (kind === "premium") {
    const months = Number(premiumMonths) || 1;
    return months === 1 ? "premium_1mo" : `premium_${months}mo`;
  }
  const credits = Number(creditsAmount);
  if (Number.isFinite(credits) && credits > 0) {
    return `credit_${credits}`;
  }
  return "credit_25";
}

function inferCreditRewardKind(row) {
  const rewardType = String(row?.reward_type || "").toLowerCase();
  if (rewardType === "premium") return "premium";
  if (rewardType === "account_credits") return "credits";
  if (Number(row?.premium_months) > 0) return "premium";
  if (Number(row?.credits_amount) > 0) return "credits";
  const key = String(row?.reward_key || "").toLowerCase();
  if (key.startsWith("premium")) return "premium";
  return "credits";
}

function formatRedemptionGrant(row) {
  const source = {
    ...row,
    credits_amount: row?.credits_amount ?? row?.reward?.credits_amount,
    premium_months: row?.premium_months ?? row?.reward?.premium_months,
    reward_type: row?.reward_type ?? row?.reward?.reward_type,
  };
  const credits = Number(source.credits_amount);
  if (Number.isFinite(credits) && credits > 0) {
    return `Grant: ${credits} credit${credits === 1 ? "" : "s"}`;
  }
  const months = Number(source.premium_months);
  if (Number.isFinite(months) && months >= 1) {
    return months === 1
      ? "Grant: 1 month premium"
      : `Grant: ${months} months premium`;
  }
  return null;
}

function creditRewardKindLabel(kind) {
  return (
    CREDIT_REWARD_KINDS.find((item) => item.key === kind)?.label ||
    String(kind || "—")
  );
}

function formatCreditRewardSummary(row) {
  const rewardType = String(row?.reward_type || "").toLowerCase();
  if (rewardType === "premium") {
    const months = Number(row?.premium_months) || 1;
    return `${months} mo premium`;
  }
  if (rewardType === "account_credits") {
    const credits = Number(row?.credits_amount);
    if (Number.isFinite(credits) && credits > 0) {
      return `$${credits} credits`;
    }
    return "Account credits";
  }
  const kind = inferCreditRewardKind(row);
  if (kind === "premium") {
    const months = Number(row?.premium_months) || 1;
    return `${months} mo premium`;
  }
  const credits = Number(row?.credits_amount);
  if (Number.isFinite(credits) && credits > 0) {
    return `$${credits} credits`;
  }
  return "Account credits";
}

function isRewardActive(value) {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    String(value || "").toLowerCase() === "true"
  );
}

function toPositiveInt(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(0, Math.trunc(parsed));
}

function toPositiveMoney(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(0, parsed);
}

function parsePositiveIntInput(value) {
  const raw = String(value ?? "");
  const digitsOnly = raw.replace(/[^\d]/g, "");
  return digitsOnly;
}

function parsePositiveMoneyInput(value) {
  const raw = String(value ?? "");
  const cleaned = raw.replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  const head = cleaned.slice(0, firstDot + 1);
  const tail = cleaned.slice(firstDot + 1).replace(/\./g, "");
  return head + tail;
}

function isRewardRowActive(row) {
  return isRewardActive(row?.is_active ?? 1);
}

function statusClass(status) {
  const value = String(status || "").toLowerCase();
  if (value === "fulfilled" || value === "approved") return "med-status med-s-active";
  if (value === "rejected") return "med-status med-s-urgent";
  return "med-tag med-tg-b";
}

function formatStatusLabel(value) {
  const raw = String(value || "").trim();
  if (!raw) return "Pending";
  const lower = raw.toLowerCase();
  if (lower === "pending") return "Pending";
  if (lower === "fulfilled" || lower === "approved") return "Fulfilled";
  if (lower === "rejected") return "Rejected";
  return lower
    .split(/[_\s]+/g)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function compactLine(value) {
  return String(value || "").trim();
}

function resolveImageUrl(imageUrl) {
  const raw = compactLine(imageUrl);
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = String(global.IMAGEURL || "").replace(/\/$/, "");
  if (!base) return raw;
  return `${base}/${raw.replace(/^\//, "")}`;
}

function isAdminThreadMessage(message) {
  const sender = String(
    message?.sender_type ??
      message?.sender ??
      message?.from ??
      message?.role ??
      message?.author_type ??
      "",
  ).toLowerCase();

  if (sender.includes("admin")) return true;
  if (sender.includes("user") || sender.includes("customer") || sender === "me") {
    return false;
  }

  if (message?.admin_id || message?.is_admin === true) return true;
  return false;
}

function extractAdminDetailMessages(payload) {
  if (!payload) return [];
  const candidates = [
    payload?.messages,
    payload?.message_thread,
    payload?.thread,
    payload?.data?.messages,
    payload?.data?.message_thread,
    payload?.data?.thread,
    payload?.redemption?.messages,
    payload?.redemption?.message_thread,
    payload?.redemption?.thread,
  ];
  for (const source of candidates) {
    if (Array.isArray(source)) return source;
  }
  return [];
}

function messageTextKey(msg) {
  return String(msg?.message ?? msg?.text ?? "").trim();
}

function isPendingChatMessage(msg) {
  return Boolean(msg?._pending || String(msg?.id || "").startsWith("pending-"));
}

function areDuplicateChatMessages(a, b) {
  if (!a || !b) return false;
  if (
    a.id &&
    b.id &&
    !String(a.id).startsWith("pending-") &&
    !String(b.id).startsWith("pending-")
  ) {
    return String(a.id) === String(b.id);
  }

  const onePending = isPendingChatMessage(a);
  const otherPending = isPendingChatMessage(b);
  if (onePending !== otherPending) {
    return (
      messageTextKey(a) === messageTextKey(b) &&
      isAdminThreadMessage(a) === isAdminThreadMessage(b)
    );
  }

  return false;
}

function dedupeChatMessages(messages) {
  const result = [];
  for (const msg of messages || []) {
    const duplicateIndex = result.findIndex((existing) =>
      areDuplicateChatMessages(existing, msg),
    );
    if (duplicateIndex >= 0) {
      const existing = result[duplicateIndex];
      if (isPendingChatMessage(existing) && !isPendingChatMessage(msg)) {
        result[duplicateIndex] = msg;
      }
      continue;
    }
    result.push(msg);
  }
  return result;
}

function pendingMessageExistsOnServer(pendingMsg, serverMessages) {
  const pendingText = messageTextKey(pendingMsg);
  if (!pendingText) return false;
  const pendingIsAdmin = isAdminThreadMessage(pendingMsg);
  return (serverMessages || []).some((serverMsg) => {
    if (messageTextKey(serverMsg) !== pendingText) return false;
    return isAdminThreadMessage(serverMsg) === pendingIsAdmin;
  });
}

function mergeChatMessages(serverMessages, localMessages) {
  const server = dedupeChatMessages(serverMessages);
  const pending = (Array.isArray(localMessages) ? localMessages : []).filter(
    (item) => item?._pending,
  );
  if (!pending.length) return server;

  const unmatchedPending = pending.filter(
    (pendingMsg) => !pendingMessageExistsOnServer(pendingMsg, server),
  );
  return dedupeChatMessages([...server, ...unmatchedPending]);
}

function resolveSendMessages(existingMessages, responsePayload, optimisticMsg, pendingId) {
  const baseline = (Array.isArray(existingMessages) ? existingMessages : []).filter(
    (item) => item.id !== pendingId,
  );
  const responseMessages = dedupeChatMessages(extractAdminDetailMessages(responsePayload));
  const baselineWithoutPending = baseline.filter((item) => !item._pending);

  if (responseMessages.length >= baselineWithoutPending.length + 1) {
    return responseMessages;
  }

  if (responseMessages.length > 0) {
    const confirmed =
      responseMessages.find(
        (item) =>
          messageTextKey(item) === messageTextKey(optimisticMsg) &&
          isAdminThreadMessage(item),
      ) || responseMessages[responseMessages.length - 1];

    return dedupeChatMessages([
      ...baselineWithoutPending,
      { ...confirmed, _pending: false },
    ]);
  }

  return dedupeChatMessages([
    ...baselineWithoutPending,
    { ...optimisticMsg, _pending: false },
  ]);
}

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function normalizeRedemptionDetail(payload) {
  if (!payload || payload.result === false) return null;

  const nestedData =
    payload?.data && typeof payload.data === "object" && !Array.isArray(payload.data)
      ? payload.data
      : null;
  const redemptionBlock = payload?.redemption || payload?.detail || null;
  const root = nestedData || redemptionBlock || payload;

  if (!root || typeof root !== "object" || Array.isArray(root)) return null;

  const user =
    root.user || root.user_info || root.customer || payload?.user || payload?.customer || {};
  const reward = root.reward || root.reward_details || payload?.reward || {};
  const messages = extractAdminDetailMessages(payload);
  const premiumGrant =
    root.premium_grant ??
    payload?.premium_grant ??
    reward?.premium_grant ??
    null;

  return {
    ...root,
    category: root.category ?? reward.category ?? root.reward_category,
    reward_type: root.reward_type ?? reward.reward_type,
    reward_key: root.reward_key ?? reward.reward_key ?? reward.key,
    reward_title:
      root.reward_title ??
      root.title ??
      reward.title ??
      reward.reward_title ??
      reward.name,
    reward_description:
      root.reward_description ??
      root.description ??
      reward.description ??
      reward.reward_description,
    dollar_value: root.dollar_value ?? reward.dollar_value,
    points_cost: root.points_cost ?? reward.points_cost,
    status: root.status ?? root.redemption_status,
    credits_amount: root.credits_amount ?? reward.credits_amount,
    premium_months: root.premium_months ?? reward.premium_months,
    badge_label: root.badge_label ?? reward.badge_label,
    reward,
    premium_grant: premiumGrant,
    subscription_expires_at:
      premiumGrant?.subscription_expires_at ??
      root.subscription_expires_at ??
      payload?.subscription_expires_at,
    user_name:
      root.user_name ?? root.name ?? user.name ?? user.user_name ?? user.customer_name,
    user_email: root.user_email ?? root.email ?? user.email ?? user.user_email,
    user_hero_level:
      root.user_hero_level ?? user.hero_level ?? user.user_hero_level ?? user.heroLevel,
    user_earned_points:
      root.user_earned_points ??
      user.earned_points ??
      user.user_earned_points ??
      user.points ??
      user.total_points,
    message_count:
      payload?.message_count ??
      payload?.messages_count ??
      root.message_count ??
      root.messages_count ??
      (messages.length ? messages.length : undefined),
    admin_seen: root.admin_seen ?? root.seen ?? root.is_seen ?? root.admin_viewed,
    messages,
  };
}

function formatAdminSeenLabel(value) {
  if (value === null || value === undefined || value === "") return "—";
  return isRewardActive(value) ? "Seen" : "Unseen";
}

function adminSeenClass(value) {
  if (value === null || value === undefined || value === "") return "med-tag med-tg-b";
  return isRewardActive(value) ? "med-status med-s-active" : "med-tag med-tg-b";
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
  const [redemptionUnseenMap, setRedemptionUnseenMap] = useState(new Map());
  const unseenTimerRef = useRef(null);
  const unseenLoadingRef = useRef(false);
  const detailThreadRef = useRef(null);
  const sendInFlightRef = useRef(false);

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
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [rewardPendingStatus, setRewardPendingStatus] = useState(null);
  const [rewardNextIsActive, setRewardNextIsActive] = useState(0);
  const [rewardForm] = Form.useForm();
  const creditRewardKind = Form.useWatch("credit_reward_kind", rewardForm);
  const [rewardImageUrl, setRewardImageUrl] = useState("");
  const [rewardImagePreview, setRewardImagePreview] = useState("");
  const [rewardImageUploading, setRewardImageUploading] = useState(false);
  const rewardImageBlobRef = useRef(null);
  const rewardImageInputRef = useRef(null);
  const rewardKeyTouchedRef = useRef(false);
  const [customSwagCategories, setCustomSwagCategories] = useState([]);

  const swagCategoryOptions = useMemo(
    () =>
      mergeSwagCategoryOptions(
        SWAG_CATEGORY_PRESETS,
        customSwagCategories,
        rewardRowsByCategory.swag,
      ),
    [customSwagCategories, rewardRowsByCategory.swag],
  );

  const [activeRedemptionCategory, setActiveRedemptionCategory] = useState("all");
  const [redemptionsStatus, setRedemptionsStatus] = useState("all");
  const [redemptionsPage, setRedemptionsPage] = useState(1);
  const [redemptionsCount, setRedemptionsCount] = useState(0);
  const [redemptionRows, setRedemptionRows] = useState([]);
  const [redemptionsLoading, setRedemptionsLoading] = useState(false);

  const [redemptionDetail, setRedemptionDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
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

  const buildRedemptionUnseenMap = (list) => {
    const items = safeArray(list);
    const map = new Map();
    items.forEach((item) => {
      const entry = {
        count: safeNumber(
          item?.unseen_message_count ??
            item?.unseen_messages_count ??
            item?.unseen_messages ??
            item?.count ??
            item?.unread ??
            0,
        ),
        lastMessageAt:
          item?.last_message_at ||
          item?.last_message_date ||
          item?.last_message_time ||
          item?.last_message_timestamp ||
          item?.last_message ||
          null,
      };
      const candidateKeys = [
        item?.redemption_id,
        item?.id,
      ]
        .map((value) => String(value ?? "").trim())
        .filter(Boolean);

      candidateKeys.forEach((key) => {
        map.set(key, entry);
      });
    });
    return map;
  };

  const getRedemptionUnseenEntry = (row) => {
    const candidateKeys = [
      row?.id,
      row?.redemption_id,
      row?.redemptionId,
    ]
      .map((value) => String(value ?? "").trim())
      .filter(Boolean);

    for (const key of candidateKeys) {
      const match = redemptionUnseenMap.get(key);
      if (match) return match;
    }

    return null;
  };

  const activeItemRows = rewardRowsByCategory[activeItemCategory] || [];
  const itemPage = itemPages[activeItemCategory] || 1;
  const itemPageCount = Math.max(1, Math.ceil(activeItemRows.length / PAGE_SIZE));
  const rewardItemTableColSpan =
    activeItemCategory === "credits" || activeItemCategory === "swag" ? 8 : 7;
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
    return dedupeChatMessages(extractAdminDetailMessages(redemptionDetail));
  }, [redemptionDetail]);

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
        const unseenPayload =
          res?.data && typeof res.data === "object" && !Array.isArray(res.data)
            ? res.data
            : res;
        const rawList =
          unseenPayload?.redemptions_with_unseen_messages ||
          [];

        if (includeList) {
          setRedemptionUnseenMap(buildRedemptionUnseenMap(rawList));
        }

        setUnseenCounts({
          unseen_redemptions_count: safeNumber(
            unseenPayload?.unseen_redemptions_count ??
              unseenPayload?.unseen_redemptions ??
              unseenPayload?.unseen_count,
          ),
          unseen_messages_count: safeNumber(
            unseenPayload?.unseen_messages_count ?? unseenPayload?.unseen_messages,
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
      if (res?.result === false) {
        message.error(res?.message || "Failed to load rewards.");
        setRewardRowsByCategory((prev) => ({
          ...prev,
          [category]: [],
        }));
        return;
      }
      setRewardRowsByCategory((prev) => ({
        ...prev,
        [category]: sortRewardsNewestFirst(
          safeArray(res).map((row) => ({
            ...row,
            category: row?.category || category,
          })),
        ),
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

  const fetchRedemptionDetail = async (id, options = {}) => {
    if (!id) return;
    const silent = options?.silent === true;
    if (!silent) setDetailLoading(true);
    try {
      const res = await postType({
        type: "admin_redemption_detail",
        admin_id: adminId,
        redemption_id: id,
      });
      const normalized = normalizeRedemptionDetail(res);
      if (normalized) {
        setRedemptionDetail((prev) => {
          const pending = extractAdminDetailMessages(prev).filter((item) => item?._pending);
          if (!pending.length) return normalized;
          return {
            ...normalized,
            messages: mergeChatMessages(normalized.messages, pending),
            message_count: mergeChatMessages(normalized.messages, pending).length,
          };
        });
      } else if (!silent) {
        setRedemptionDetail(null);
      }
    } catch (error) {
      if (!silent) {
        setRedemptionDetail(null);
      }
    } finally {
      if (!silent) setDetailLoading(false);
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
      fetchUnseen(section === "redemptions" ? 1 : 0);
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
    if (section === "redemptions" && !isDetailPage) {
      fetchUnseen(1);
    }
  }, [section, isDetailPage]);

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
      fetchUnseen(1);
      fetchRedemptionDetail(redemptionId);
      markSeen(redemptionId);
    }
  }, [isDetailPage, redemptionId]);

  useEffect(() => {
    if (!isDetailPage || !redemptionId) return undefined;
    const timer = setInterval(() => {
      fetchUnseen(1);
      fetchRedemptionDetail(redemptionId, { silent: true });
    }, 3000);
    return () => clearInterval(timer);
  }, [isDetailPage, redemptionId]);

  useEffect(() => {
    if (!detailThreadRef.current) return;
    detailThreadRef.current.scrollTop = detailThreadRef.current.scrollHeight;
  }, [detailMessages, detailLoading]);

  const clearRewardImageBlobPreview = () => {
    if (rewardImageBlobRef.current) {
      URL.revokeObjectURL(rewardImageBlobRef.current);
      rewardImageBlobRef.current = null;
    }
  };

  const setRewardImageFromValue = (imageUrl) => {
    clearRewardImageBlobPreview();
    const raw = compactLine(imageUrl);
    setRewardImageUrl(raw);
    setRewardImagePreview(raw ? resolveImageUrl(raw) : "");
  };

  const handleRewardImageChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      message.warning("Please choose an image file.");
      return;
    }

    setRewardImageUploading(true);
    const body = new FormData();
    body.append("type", "upload_data");
    body.append("file", new Blob([file], { type: file.type }), file.name);

    try {
      const response = await apiRequest({ body });
      if (response?.file_name) {
        clearRewardImageBlobPreview();
        const objectUrl = URL.createObjectURL(file);
        rewardImageBlobRef.current = objectUrl;
        setRewardImagePreview(objectUrl);
        setRewardImageUrl(String(response.file_name));
        message.success("Image uploaded successfully.");
      } else {
        message.error("Failed to upload image.");
      }
    } catch (error) {
      console.error("Error uploading reward image:", error);
      message.error("Error uploading image.");
    } finally {
      setRewardImageUploading(false);
    }
  };

  const openCreateReward = (preset) => {
    setRewardEditing(null);
    setRewardModalMode("create");
    rewardKeyTouchedRef.current = false;
    rewardForm.resetFields();
    const defaults = {
      credit_reward_kind: "credits",
      reward_key: "",
      title: "",
      description: "",
      points_cost: undefined,
      dollar_value: "",
      credits_amount: undefined,
      premium_months: 1,
      badge_label: "",
      sort_order: activeItemRows.length + 1,
      swag_category: activeItemCategory === "swag" ? SWAG_CATEGORY_PRESETS[0] : undefined,
    };
    if (preset === "credits") {
      Object.assign(defaults, {
        credit_reward_kind: "credits",
        reward_key: "credit_25",
        title: "$25 Account Credits",
        description: "Redeem points for $25 in FareVet account credits.",
        credits_amount: 25,
        dollar_value: 25,
        badge_label: "Credits",
      });
    } else if (preset === "premium") {
      Object.assign(defaults, {
        credit_reward_kind: "premium",
        reward_key: "premium_1mo",
        title: "1 Month Premium Access",
        description: "Unlock premium features for 30 days.",
        premium_months: 1,
        badge_label: "Premium",
      });
    }
    rewardForm.setFieldsValue(defaults);
    setRewardImageFromValue("");
    setRewardModalOpen(true);
  };

  const openEditReward = (row) => {
    setRewardEditing(row);
    setRewardModalMode("edit");
    rewardKeyTouchedRef.current = true;
    rewardForm.resetFields();
    const kind = inferCreditRewardKind(row);
    rewardForm.setFieldsValue({
      credit_reward_kind: kind,
      reward_key: row?.reward_key || "",
      title: row?.title || "",
      description: row?.description || "",
      points_cost:
        row?.points_cost !== undefined ? Number(row.points_cost) : undefined,
      dollar_value: row?.dollar_value || "",
      credits_amount:
        row?.credits_amount !== undefined ? Number(row.credits_amount) : undefined,
      premium_months:
        row?.premium_months !== undefined ? Number(row.premium_months) : 1,
      badge_label: row?.badge_label || "",
      sort_order:
        row?.sort_order !== undefined ? Number(row.sort_order) : undefined,
      swag_category: row?.swag_category || "",
    });
    setRewardImageFromValue(row?.image_url);
    setRewardModalOpen(true);
  };

  const handleRewardFormValuesChange = (changedValues, allValues) => {
    if (rewardModalMode !== "create" || rewardKeyTouchedRef.current) return;
    if (Object.prototype.hasOwnProperty.call(changedValues, "reward_key")) {
      rewardKeyTouchedRef.current = true;
      return;
    }
    if (activeItemCategory !== "credits") return;
    const shouldRefreshKey =
      Object.prototype.hasOwnProperty.call(changedValues, "credit_reward_kind") ||
      Object.prototype.hasOwnProperty.call(changedValues, "premium_months") ||
      Object.prototype.hasOwnProperty.call(changedValues, "credits_amount");
    if (!shouldRefreshKey) return;
    const suggested = suggestRewardKey({
      category: activeItemCategory,
      kind: allValues.credit_reward_kind || "credits",
      creditsAmount: allValues.credits_amount,
      premiumMonths: allValues.premium_months,
    });
    if (suggested) {
      rewardForm.setFieldValue("reward_key", suggested);
    }
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
      const isCreditsCategory = activeItemCategory === "credits";
      const kind = isCreditsCategory
        ? values.credit_reward_kind || "credits"
        : null;
      const payload = {
        type: "admin_save_reward",
        admin_id: adminId,
        category: activeItemCategory,
        reward_key: values.reward_key,
        title: values.title,
        description: values.description,
        points_cost: toPositiveInt(values.points_cost),
        dollar_value:
          values.dollar_value === undefined || values.dollar_value === null || values.dollar_value === ""
            ? undefined
            : toPositiveMoney(values.dollar_value),
        credits_amount:
          isCreditsCategory && kind === "credits"
            ? toPositiveInt(values.credits_amount)
            : undefined,
        premium_months:
          isCreditsCategory && kind === "premium"
            ? toPositiveInt(values.premium_months) || 1
            : undefined,
        badge_label: compactLine(values.badge_label) || undefined,
        sort_order: toPositiveInt(values.sort_order),
        is_active: 1,
      };
      if (activeItemCategory === "swag") {
        payload.swag_category = compactLine(values.swag_category) || undefined;
      }
      const trimmedImageUrl = compactLine(rewardImageUrl);
      if (trimmedImageUrl) {
        payload.image_url = trimmedImageUrl;
      }
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

  const openRewardStatusModal = (row, nextIsActive) => {
    const rewardId = row?.reward_id || row?.id;
    if (!rewardId) return;
    setRewardPendingStatus(row);
    setRewardNextIsActive(nextIsActive);
    setStatusModalOpen(true);
  };

  const updateRewardStatus = async () => {
    const rewardId =
      rewardPendingStatus?.reward_id || rewardPendingStatus?.id;
    if (!rewardId) return;
    setRewardSaving(true);
    try {
      const categoryKey =
        rewardPendingStatus?.category || activeItemCategory || "credits";
      const pendingKind = inferCreditRewardKind(rewardPendingStatus);
      const payload = {
        type: "admin_save_reward",
        admin_id: adminId,
        reward_id: rewardId,
        category: categoryKey,
        reward_key: rewardPendingStatus?.reward_key,
        title: rewardPendingStatus?.title,
        description: rewardPendingStatus?.description,
        points_cost: toPositiveInt(rewardPendingStatus?.points_cost),
        dollar_value:
          rewardPendingStatus?.dollar_value === undefined ||
          rewardPendingStatus?.dollar_value === null ||
          rewardPendingStatus?.dollar_value === ""
            ? undefined
            : toPositiveMoney(rewardPendingStatus?.dollar_value),
        credits_amount:
          String(categoryKey) === "credits" && pendingKind === "credits"
            ? toPositiveInt(rewardPendingStatus?.credits_amount)
            : undefined,
        premium_months:
          String(categoryKey) === "credits" && pendingKind === "premium"
            ? toPositiveInt(rewardPendingStatus?.premium_months) || 1
            : undefined,
        badge_label: compactLine(rewardPendingStatus?.badge_label) || undefined,
        sort_order: toPositiveInt(rewardPendingStatus?.sort_order),
        is_active: rewardNextIsActive,
      };
      if (String(categoryKey) === "swag") {
        payload.swag_category =
          compactLine(rewardPendingStatus?.swag_category) || undefined;
      }
      const statusImageUrl = compactLine(rewardPendingStatus?.image_url);
      if (statusImageUrl) {
        payload.image_url = statusImageUrl;
      }
      const res = await postType(payload);
      if (res?.result === false) {
        message.error(res?.message || "Reward update failed.");
        return;
      }
      message.success(
        rewardNextIsActive === 1 ? "Reward activated." : "Reward deactivated.",
      );
      setStatusModalOpen(false);
      setRewardPendingStatus(null);
      await fetchRewardCategory(activeItemCategory);
    } finally {
      setRewardSaving(false);
    }
  };

  const openRedemptionDetail = (row) => {
    const id = row?.redemption_id || row?.id;
    if (!id) return;
    fetchUnseen(1);
    navigate(`/reward/redemptions/${id}`);
  };

  const sendRedemptionMessage = async () => {
    const text = String(messageText || "").trim();
    if (!text || !redemptionId || sendInFlightRef.current) return;

    const pendingId = `pending-${Date.now()}`;
    const optimisticMsg = {
      id: pendingId,
      message: text,
      sender_type: "admin",
      created_at: new Date().toISOString(),
      _pending: true,
    };

    sendInFlightRef.current = true;
    setRedemptionDetail((prev) => {
      const currentMessages = extractAdminDetailMessages(prev);
      const nextMessages = [...currentMessages, optimisticMsg];
      return {
        ...(prev || {}),
        messages: nextMessages,
        message_count: nextMessages.length,
      };
    });
    setMessageText("");

    try {
      const res = await postType({
        type: "admin_redemption_message",
        admin_id: adminId,
        redemption_id: redemptionId,
        message: text,
      });
      if (res?.result === false) {
        message.error(res?.message || "Message send failed.");
        setRedemptionDetail((prev) => ({
          ...(prev || {}),
          messages: extractAdminDetailMessages(prev).filter((item) => item.id !== pendingId),
        }));
        return;
      }

      setRedemptionDetail((prev) => {
        const existingMessages = extractAdminDetailMessages(prev);
        const serverThread = resolveSendMessages(
          existingMessages,
          res,
          optimisticMsg,
          pendingId,
        );
        return {
          ...(prev || {}),
          messages: serverThread,
          message_count: serverThread.length,
        };
      });
      fetchUnseen(0);
    } catch (error) {
      setRedemptionDetail((prev) => ({
        ...(prev || {}),
        messages: extractAdminDetailMessages(prev).filter((item) => item.id !== pendingId),
      }));
      message.error("Message send failed.");
    } finally {
      sendInFlightRef.current = false;
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
      if (isApprove) {
        const expiresAt =
          res?.premium_grant?.subscription_expires_at ??
          res?.subscription_expires_at;
        if (expiresAt) {
          message.info(`Premium expires: ${formatDate(expiresAt)}`);
        }
      }
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
          <div className="med-page-title">Reward Points</div>
          <div className="med-page-sub">
            Users with points activity and current redemption summary.
          </div>
        </div>
      </div>

      <div className="med-card">
        <div className="med-ph">
          <div className="med-pt">
            Users Points
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
            Manage rewards by category. Use Credits &amp; Premium for account
            credits or premium access passes.
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
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {activeItemCategory === "credits" ? (
              <>
                <button
                  type="button"
                  className="med-btn med-btn-ghost"
                  onClick={() => openCreateReward("credits")}
                >
                  + Credit reward
                </button>
                <button
                  type="button"
                  className="med-btn med-btn-ghost"
                  onClick={() => openCreateReward("premium")}
                >
                  + Premium (1 mo)
                </button>
              </>
            ) : null}
            <button
              type="button"
              className="med-btn med-btn-primary"
              onClick={() => openCreateReward()}
            >
              + Create Reward
            </button>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="med-tbl" style={{ minWidth: 1080 }}>
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>{activeItemCategory === "swag" ? "Swag Category" : "Category"}</th>
                {activeItemCategory === "credits" ? <th>Type</th> : null}
                <th>Points Cost</th>
                <th>Dollar Value</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rewardsLoading ? (
                <tr>
                  <td colSpan={rewardItemTableColSpan} style={{ textAlign: "center", padding: 24 }}>
                    <Spinner size="sm" color="inherit" />
                  </td>
                </tr>
              ) : visibleItemRows.length === 0 ? (
                <tr>
                  <td colSpan={rewardItemTableColSpan} style={{ textAlign: "center", padding: 24 }}>
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
                      {row?.image_url ? (
                        <img
                          src={resolveImageUrl(row.image_url)}
                          alt=""
                          style={{
                            width: 40,
                            height: 40,
                            objectFit: "cover",
                            borderRadius: 6,
                            border: "1px solid #e8e8f0",
                          }}
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <div className="med-bold">{row?.title || "—"}</div>
                      <div style={{ fontSize: 11, color: "var(--med-ink3)" }}>
                        {row?.reward_key || "—"}
                      </div>
                    </td>
                    <td>
                      {activeItemCategory === "swag"
                        ? row?.swag_category || "—"
                        : categoryLabel(row?.category || activeItemCategory)}
                    </td>
                    {activeItemCategory === "credits" ? (
                      <td>{formatCreditRewardSummary(row)}</td>
                    ) : null}
                    <td>{row?.points_cost ?? "—"}</td>
                    <td>{row?.dollar_value || "—"}</td>
                    <td>
                      {(() => {
                        const active = isRewardRowActive(row);
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
                        {isRewardRowActive(row) ? (
                          <button
                            type="button"
                            className="bg-[#ED5D67] flex justify-center rounded-3 items-center"
                            style={{ width: "24px", height: "24px", backgroundColor: "#ED5D67", opacity: rewardSaving ? 0.7 : 1 }}
                            onClick={() => openRewardStatusModal(row, 0)}
                            disabled={rewardSaving}
                            aria-label="Deactivate reward"
                          >
                            <img style={{ width: "14px", height: "auto" }} src={trash} alt="" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="bg-[#22C55E] flex justify-center rounded-3 items-center"
                            style={{ width: "24px", height: "24px", backgroundColor: "#22C55E", opacity: rewardSaving ? 0.7 : 1 }}
                            onClick={() => openRewardStatusModal(row, 1)}
                            disabled={rewardSaving}
                            aria-label="Activate reward"
                          >
                            <Check size={14} color="#ffffff" />
                          </button>
                        )}
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
        width={780}
        centered
        className="reward-modal"
        onCancel={() => {
          setRewardModalOpen(false);
          clearRewardImageBlobPreview();
        }}
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
        <Form
          form={rewardForm}
          layout="vertical"
          className="reward-form"
          onValuesChange={handleRewardFormValuesChange}
        >
          {activeItemCategory === "credits" ? (
            <Form.Item
              name="credit_reward_kind"
              label="What does the user receive?"
              rules={[{ required: true, message: "Choose a reward type" }]}
              className="reward-form-full"
            >
              <CreditRewardTypePicker />
            </Form.Item>
          ) : activeItemCategory === "swag" ? (
            <Form.Item
              name="swag_category"
              label="Swag category"
              rules={[{ required: true, message: "Swag category is required" }]}
              className="reward-form-full"
            >
              <SwagCategorySelect
                options={swagCategoryOptions}
                onCustomCategory={(name) => {
                  setCustomSwagCategories((prev) =>
                    prev.includes(name) ? prev : [...prev, name],
                  );
                }}
              />
            </Form.Item>
          ) : (
            <Form.Item label="Category" className="reward-form-full">
              <Input value={categoryLabel(activeItemCategory)} disabled />
            </Form.Item>
          )}

          <div className="reward-form-grid">
            <Form.Item
              name="reward_key"
              label="Reward key"
              tooltip="Internal unique ID for this catalog item — set once when creating the reward, not per user redemption."
              extra={
                activeItemCategory === "credits"
                  ? "One key per reward product. For 2-month premium, create a new reward with key like premium_2mo — do not reuse premium_1mo."
                  : "Unique slug for this reward (e.g. amazon_25). Set once at creation."
              }
              rules={[{ required: true, message: "Reward key is required" }]}
            >
              <Input
                placeholder={
                  activeItemCategory === "credits"
                    ? creditRewardKind === "premium"
                      ? "premium_1mo"
                      : "credit_25"
                    : "amazon_25"
                }
              />
            </Form.Item>
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: "Title is required" }]}
            >
              <Input placeholder="Reward title" />
            </Form.Item>
            <Form.Item
              name="points_cost"
              label="Points cost"
              rules={[{ required: true, message: "Points cost is required" }]}
            >
              <InputNumber
                className="w-full"
                min={0}
                precision={0}
                parser={parsePositiveIntInput}
              />
            </Form.Item>
            {activeItemCategory === "credits" && creditRewardKind === "premium" ? (
              <Form.Item
                name="premium_months"
                label="Premium months"
                rules={[{ required: true, message: "Premium months is required" }]}
              >
                <InputNumber
                  className="w-full"
                  min={1}
                  precision={0}
                  parser={parsePositiveIntInput}
                  placeholder="1"
                />
              </Form.Item>
            ) : activeItemCategory === "credits" ? (
              <Form.Item
                name="credits_amount"
                label="Credits amount ($)"
                rules={[{ required: true, message: "Credits amount is required" }]}
              >
                <InputNumber
                  className="w-full"
                  min={1}
                  precision={0}
                  parser={parsePositiveIntInput}
                  placeholder="25"
                />
              </Form.Item>
            ) : (
              <Form.Item name="dollar_value" label="Dollar value">
                <InputNumber
                  className="w-full"
                  min={0}
                  precision={2}
                  step={0.01}
                  parser={parsePositiveMoneyInput}
                  placeholder="25.00"
                />
              </Form.Item>
            )}
            {activeItemCategory === "credits" && creditRewardKind !== "premium" ? (
              <Form.Item name="dollar_value" label="Display value ($)">
                <InputNumber
                  className="w-full"
                  min={0}
                  precision={2}
                  step={0.01}
                  parser={parsePositiveMoneyInput}
                  placeholder="25.00"
                />
              </Form.Item>
            ) : null}
            <Form.Item name="badge_label" label="Badge label">
              <Input
                placeholder={
                  activeItemCategory === "credits"
                    ? creditRewardKind === "premium"
                      ? "Premium"
                      : "Credits"
                    : "Optional badge"
                }
              />
            </Form.Item>
            <Form.Item name="sort_order" label="Sort order">
              <InputNumber
                className="w-full"
                min={0}
                precision={0}
                parser={parsePositiveIntInput}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label="Description"
            className="reward-form-full"
            rules={
              activeItemCategory === "swag"
                ? [{ required: true, message: "Description is required" }]
                : undefined
            }
            extra={
              activeItemCategory === "swag"
                ? "Rich text (HTML) shown in the swag rewards catalog."
                : undefined
            }
          >
            {activeItemCategory === "swag" ? (
              <CKEditorIframe
                minHeight={88}
                maxHeight={360}
                autoGrow
                className="reward-description-editor"
              />
            ) : (
              <TextArea rows={2} placeholder="Short description shown in the rewards catalog" />
            )}
          </Form.Item>

          <Form.Item label="Reward image" className="reward-form-full">
            <div className="reward-image-upload">
              <div className="reward-image-upload-preview" aria-hidden>
                {rewardImageUploading ? (
                  <Spinner size="sm" color="inherit" />
                ) : rewardImagePreview ? (
                  <img src={rewardImagePreview} alt="" />
                ) : (
                  <img src={imagecloud} alt="" className="reward-image-upload-icon" />
                )}
              </div>
              <div className="reward-image-upload-body">
                <div className="reward-image-upload-title">
                  {rewardImagePreview ? "Image attached" : "Add a reward image"}
                </div>
                <div className="reward-image-upload-hint">
                  PNG or JPG. Shown in the rewards catalog.
                </div>
                <div className="reward-image-upload-actions">
                  <input
                    ref={rewardImageInputRef}
                    type="file"
                    accept="image/*"
                    className="reward-image-upload-input"
                    disabled={rewardImageUploading || rewardSaving}
                    onChange={handleRewardImageChange}
                  />
                  <Button
                    type="primary"
                    disabled={rewardSaving}
                    loading={rewardImageUploading}
                    onClick={() => rewardImageInputRef.current?.click()}
                    style={{
                      backgroundColor: "#8930F9",
                      borderColor: "#8930F9",
                    }}
                  >
                    {rewardImagePreview ? "Change image" : "Choose image"}
                  </Button>
                  {rewardImageUrl ? (
                    <Button
                      type="default"
                      disabled={rewardImageUploading || rewardSaving}
                      onClick={() => setRewardImageFromValue("")}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={rewardNextIsActive === 1 ? "Activate Reward" : "Deactivate Reward"}
        open={statusModalOpen}
        centered
        onCancel={() => {
          if (rewardSaving) return;
          setStatusModalOpen(false);
          setRewardPendingStatus(null);
        }}
        onOk={updateRewardStatus}
        okText={rewardNextIsActive === 1 ? "Activate" : "Deactivate"}
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
          {rewardNextIsActive === 1
            ? "Are you sure you want to activate this reward?"
            : "Are you sure you want to deactivate this reward?"}
        </p>
        <p style={{ marginBottom: 0, color: "#6b7280", fontSize: 13 }}>
          <strong>{rewardPendingStatus?.title || "this reward"}</strong>.
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
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="med-tbl" style={{ minWidth: 1180 }}>
            <thead>
              <tr>
                <th>User</th>
                <th>Reward</th>
                <th>Grant</th>
                <th>Category</th>
                <th>Points</th>
                <th>Status</th>
                <th>Messages</th>
                <th>Unread</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {redemptionsLoading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: 24 }}>
                    <Spinner size="sm" color="inherit" />
                  </td>
                </tr>
              ) : redemptionRows.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: 24 }}>
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
                    <td className="med-bold" style={{ fontSize: 12 }}>
                      {formatRedemptionGrant(row) || "—"}
                    </td>
                    <td>{categoryLabel(row?.category)}</td>
                    <td>{row?.points_cost ?? "—"}</td>
                    <td>
                      {(() => {
                        const value = String(row?.status || "pending").toLowerCase();
                        return (
                      <span className={statusClass(row?.status)}>
                            {formatStatusLabel(value)}
                      </span>
                        );
                      })()}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span>{row?.message_count ?? row?.messages_count ?? "0"}</span>
                      </div>
                    </td>
                    <td>
                      {(() => {
                        const unseenEntry = getRedemptionUnseenEntry(row);
                        const unreadCount = safeNumber(unseenEntry?.count);
                        return (
                          <Badge
                            showZero
                            count={unreadCount}
                            overflowCount={99}
                            style={{
                              backgroundColor: unreadCount > 0 ? "#ef4444" : "#d1d5db",
                              boxShadow: "none",
                            }}
                          />
                        );
                      })()}
                    </td>
                    <td>{formatDate(row?.created_at || row?.created_date)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {String(row?.status || "").toLowerCase() === "pending" ? (
                          <>
                            <button
                              type="button"
                              className="med-btn med-btn-primary med-btn-sm"
                              onClick={() =>
                                openRedemptionActionModal(
                                  row?.redemption_id || row?.id,
                                  "approve",
                                )
                              }
                              disabled={actionLoading}
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
                              disabled={actionLoading}
                            >
                              Reject
                            </button>
                          </>
                        ) : null}
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

      <div className="redemption-detail-grid">
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
              <div className="redemption-info-sections">
                <div className="med-detail-block">
                  <div className="med-detail-section-label">Reward</div>
                  <dl className="med-detail-grid">
                    <div className="med-detail-item">
                      <dt className="med-detail-dt">Category</dt>
                      <dd className="med-detail-dd">{categoryLabel(redemptionDetail?.category)}</dd>
                    </div>
                    <div className="med-detail-item">
                      <dt className="med-detail-dt">Reward Key</dt>
                      <dd className="med-detail-dd">{displayValue(redemptionDetail?.reward_key)}</dd>
                    </div>
                    <div className="med-detail-item med-detail-item-full">
                      <dt className="med-detail-dt">Reward Title</dt>
                      <dd className="med-detail-dd med-detail-strong">
                        {displayValue(redemptionDetail?.reward_title)}
                      </dd>
                    </div>
                    <div className="med-detail-item med-detail-item-full">
                      <dt className="med-detail-dt">Reward Description</dt>
                      <dd className="med-detail-dd med-detail-multiline">
                        {redemptionDetail?.reward_description
                          ? compactLine(redemptionDetail.reward_description)
                          : "—"}
                      </dd>
                    </div>
                    <div className="med-detail-item med-detail-item-full">
                      <dt className="med-detail-dt">On approve</dt>
                      <dd className="med-detail-dd med-detail-strong">
                        {formatRedemptionGrant(redemptionDetail) || "—"}
                      </dd>
                    </div>
                    {redemptionDetail?.subscription_expires_at ? (
                      <div className="med-detail-item med-detail-item-full">
                        <dt className="med-detail-dt">Premium expires</dt>
                        <dd className="med-detail-dd">
                          {formatDate(redemptionDetail.subscription_expires_at)}
                        </dd>
                      </div>
                    ) : null}
                    <div className="med-detail-item">
                      <dt className="med-detail-dt">Reward type</dt>
                      <dd className="med-detail-dd">
                        {displayValue(redemptionDetail?.reward_type)}
                      </dd>
                    </div>
                    <div className="med-detail-item">
                      <dt className="med-detail-dt">Badge</dt>
                      <dd className="med-detail-dd">
                        {displayValue(redemptionDetail?.badge_label)}
                      </dd>
                    </div>
                    <div className="med-detail-item">
                      <dt className="med-detail-dt">Points Cost</dt>
                      <dd className="med-detail-dd">{displayValue(redemptionDetail?.points_cost)}</dd>
                    </div>
                    <div className="med-detail-item">
                      <dt className="med-detail-dt">Dollar Value</dt>
                      <dd className="med-detail-dd">{displayValue(redemptionDetail?.dollar_value)}</dd>
                    </div>
                    <div className="med-detail-item">
                      <dt className="med-detail-dt">Credits Amount</dt>
                      <dd className="med-detail-dd">{displayValue(redemptionDetail?.credits_amount)}</dd>
                    </div>
                    <div className="med-detail-item">
                      <dt className="med-detail-dt">Premium Months</dt>
                      <dd className="med-detail-dd">{displayValue(redemptionDetail?.premium_months)}</dd>
                    </div>
                  </dl>
                </div>

                <div className="med-detail-block">
                  <div className="med-detail-section-label">Request</div>
                  <dl className="med-detail-grid">
                    <div className="med-detail-item">
                      <dt className="med-detail-dt">Status</dt>
                      <dd className="med-detail-dd">
                        <span className={statusClass(detailStatus)}>
                          {formatStatusLabel(detailStatus)}
                        </span>
                      </dd>
                    </div>
                    <div className="med-detail-item">
                      <dt className="med-detail-dt">Message Count</dt>
                      <dd className="med-detail-dd">{displayValue(redemptionDetail?.message_count)}</dd>
                    </div>
                    <div className="med-detail-item">
                      <dt className="med-detail-dt">Admin Seen</dt>
                      <dd className="med-detail-dd">
                        <span className={adminSeenClass(redemptionDetail?.admin_seen)}>
                          {formatAdminSeenLabel(redemptionDetail?.admin_seen)}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="med-detail-block">
                  <div className="med-detail-section-label">User</div>
                  <dl className="med-detail-grid">
                    <div className="med-detail-item">
                      <dt className="med-detail-dt">User Name</dt>
                      <dd className="med-detail-dd med-detail-strong">
                        {displayValue(redemptionDetail?.user_name)}
                      </dd>
                    </div>
                    <div className="med-detail-item">
                      <dt className="med-detail-dt">User Email</dt>
                      <dd className="med-detail-dd">{displayValue(redemptionDetail?.user_email)}</dd>
                    </div>
                    <div className="med-detail-item">
                      <dt className="med-detail-dt">User Hero Level</dt>
                      <dd className="med-detail-dd">{displayValue(redemptionDetail?.user_hero_level)}</dd>
                    </div>
                    <div className="med-detail-item">
                      <dt className="med-detail-dt">User Earned Points</dt>
                      <dd className="med-detail-dd">{displayValue(redemptionDetail?.user_earned_points)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="med-card redemption-chat-card">
          <div className="med-ph">
            <div className="med-pt">Chat / Actions</div>
          </div>
          <div className="med-pb">
            {detailLoading ? (
              <div style={{ textAlign: "center", padding: 24 }}>
                <Spinner size="sm" color="inherit" />
              </div>
            ) : (
              <>
                <div ref={detailThreadRef} className="redemption-chat-thread">
                  {detailMessages.length ? (
                    detailMessages.map((msg, index) => {
                      const isAdmin = isAdminThreadMessage(msg);
                      const text = compactLine(msg?.message ?? msg?.text ?? "—") || "—";
                      const stamp = formatDate(
                        msg?.created_at ?? msg?.date ?? msg?.updated_at,
                      );

                      return (
                        <div
                          key={msg?.id ?? `${msg?.created_at ?? "msg"}-${index}`}
                          className={`redemption-chat-row ${
                            isAdmin ? "redemption-chat-row-admin" : "redemption-chat-row-user"
                          }`}
                        >
                          <div className="redemption-chat-bubble-wrap">
                            <div
                              className={`redemption-chat-bubble ${
                                isAdmin
                                  ? "redemption-chat-bubble-admin"
                                  : "redemption-chat-bubble-user"
                              }${msg?._pending ? " redemption-chat-bubble-pending" : ""}`}
                            >
                              {text}
                            </div>
                            <div className="redemption-chat-meta">
                              {isAdmin ? "Admin" : "User"}
                              {stamp && stamp !== "—" ? ` · ${stamp}` : ""}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <ProductTableNoData
                      title="No messages yet."
                      subtitle="Start the conversation from here."
                    />
                  )}

                </div>

                <div className="redemption-chat-compose">
                  <TextArea
                    rows={4}
                    value={messageText}
                    placeholder="Write a message to the user..."
                    onChange={(e) => setMessageText(e.target.value)}
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault();
                        if (String(messageText || "").trim()) {
                          sendRedemptionMessage();
                        }
                      }
                    }}
                  />
                  <div className="redemption-chat-actions">
                    <Button
                      type="primary"
                      onClick={sendRedemptionMessage}
                      disabled={!String(messageText || "").trim()}
                      style={{
                        backgroundColor: "#8930F9",
                        borderColor: "#8930F9",
                        color: "#ffffff",
                      }}
                    >
                      Send Message
                    </Button>
                  </div>
                </div>
              </>
            )}
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
