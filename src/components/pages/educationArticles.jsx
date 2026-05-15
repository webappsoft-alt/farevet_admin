/* eslint-disable no-lone-blocks */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { message, Modal } from "antd";
import { CircularProgress } from "@mui/material";
import { apiRequest } from "../../api/auth_api";
import "./educationArticles.scss";
import CKEditorIframe from "../ckeditor/CKEditorIframe";
import { ArrowLeft } from "react-feather";

const TABLE_NAME = "education_articles";

function toNum(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function formatViewsLabel(n) {
  if (n == null || n === "") return null;
  const num = Number(n);
  if (Number.isNaN(num)) return String(n);
  return num.toLocaleString();
}

function parseRowViews(v) {
  if (v == null || v === "") return 0;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

/** Accepts several possible API shapes for `type: education_counts`. */
function pickStatsFromResponse(res) {
  if (!res || typeof res !== "object") return null;

  let row = null;
  if (Array.isArray(res.data) && res.data.length > 0) {
    row = res.data[0];
  } else if (
    res.data &&
    typeof res.data === "object" &&
    !Array.isArray(res.data)
  ) {
    row = res.data;
  } else if (res.result && typeof res.result === "object") {
    row = res.result;
  } else if (res.stats && typeof res.stats === "object") {
    row = res.stats;
  } else {
    row = res;
  }
  if (!row || typeof row !== "object") return null;

  const mostReadBlock =
    row.most_read && typeof row.most_read === "object"
      ? row.most_read
      : row.most_read_article && typeof row.most_read_article === "object"
        ? row.most_read_article
        : null;

  const total = toNum(
    row.total_articles ??
      row.total ??
      row.article_count ??
      row.total_count ??
      row.count,
  );
  const published = toNum(
    row.published ??
      row.published_count ??
      row.published_articles ??
      row.live_count,
  );
  const drafts = toNum(
    row.drafts ?? row.draft_count ?? row.draft_articles ?? row.draft,
  );

  let mostReadTitle =
    row.most_read_title ??
    row.top_article_title ??
    row.most_read_article_title ??
    row.top_title ??
    "";
  let mostReadViews = toNum(
    row.most_read_views ??
      row.top_views ??
      row.most_read_view_count ??
      row.views,
  );

  if (mostReadBlock) {
    const t =
      mostReadBlock.title ??
      mostReadBlock.article_title ??
      mostReadBlock.name ??
      "";
    if (String(t).trim()) mostReadTitle = t;
    const v = toNum(
      mostReadBlock.views ??
        mostReadBlock.view_count ??
        mostReadBlock.total_views,
    );
    if (v != null) mostReadViews = v;
  }

  return {
    total: total ?? 0,
    published: published ?? 0,
    drafts: drafts ?? 0,
    mostReadTitle: String(mostReadTitle || "").trim() || null,
    mostReadViews,
  };
}

/** Accepts several possible API shapes for `type: education_most_read`. */
function pickMostReadFromResponse(res) {
  if (!res || typeof res !== "object") return null;

  let row = null;
  if (Array.isArray(res.data) && res.data.length > 0) {
    row = res.data[0];
  } else if (
    res.data &&
    typeof res.data === "object" &&
    !Array.isArray(res.data)
  ) {
    row = res.data;
  } else if (res.result && typeof res.result === "object") {
    row = res.result;
  } else if (res.article && typeof res.article === "object") {
    row = res.article;
  } else if (res.stats && typeof res.stats === "object") {
    row = res.stats;
  } else {
    row = res;
  }
  if (!row || typeof row !== "object") return null;

  const nested =
    row.most_read && typeof row.most_read === "object"
      ? row.most_read
      : row.most_read_article && typeof row.most_read_article === "object"
        ? row.most_read_article
        : row.article && typeof row.article === "object"
          ? row.article
          : null;

  let mostReadTitle =
    row.title ??
    row.article_title ??
    row.most_read_title ??
    row.top_article_title ??
    row.most_read_article_title ??
    row.top_title ??
    "";
  let mostReadViews = toNum(
    row.views ??
      row.view_count ??
      row.total_views ??
      row.most_read_views ??
      row.most_read_view_count,
  );

  if (nested) {
    const t =
      nested.title ??
      nested.article_title ??
      nested.name ??
      nested.most_read_title ??
      "";
    if (String(t).trim()) mostReadTitle = t;
    const v = toNum(
      nested.views ??
        nested.view_count ??
        nested.total_views ??
        nested.read_count,
    );
    if (v != null) mostReadViews = v;
  }

  const titleStr = String(mostReadTitle || "").trim();
  if (!titleStr && mostReadViews == null) return null;

  return {
    mostReadTitle: titleStr || null,
    mostReadViews,
  };
}

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "saving", label: "Saving" },
  { id: "understanding_bills", label: "Understanding Bills" },
  { id: "insurrance", label: "Insurance" },
  { id: "emergancy", label: "Emergency" },
  { id: "medications", label: "Medications" },
  { id: "tips", label: "Tips" },
];

/** API `category` values (spellings match backend). */
const CATEGORY_LABELS = {
  saving: "Saving",
  understanding_bills: "Understanding Bills",
  insurrance: "Insurance",
  emergancy: "Emergency",
  medications: "Medications",
  tips: "Tips",
};

const CATEGORY_TAG_CLASS = {
  Saving: "edu-tg-g",
  "Understanding Bills": "edu-tg-a",
  Insurance: "edu-tg-b",
  Emergency: "edu-tg-r",
  Medications: "edu-tg-p",
  Tips: "edu-tg-p",
};

function parseTagsInput(input) {
  if (!input || !String(input).trim()) return [];
  return String(input)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Normalizes API `tags` (JSON array string, double-escaped JSON, or array) into strings.
 * Handles values like `"[\\\"New\\\",\\\"ysd\\\"]"` after HTTP JSON decode.
 */
function parseTagsArray(tagsRaw) {
  if (tagsRaw == null || tagsRaw === "") return [];
  if (Array.isArray(tagsRaw)) {
    return tagsRaw.map((t) => String(t).trim()).filter(Boolean);
  }

  let s = String(tagsRaw).trim();
  if (!s || s === "[]") return [];

  let candidate = s;
  for (let i = 0; i < 6; i++) {
    try {
      const v = JSON.parse(candidate);
      if (Array.isArray(v)) {
        return v.map((x) => String(x).trim()).filter(Boolean);
      }
      if (typeof v === "string") {
        candidate = v.trim();
        continue;
      }
      break;
    } catch {
      const trimmed = candidate.replace(/^"+|"+$/g, "");
      const unescaped = trimmed.replace(/\\"/g, '"');
      const next =
        unescaped !== trimmed ? unescaped : candidate.replace(/\\\\/g, "\\");
      if (next === candidate) break;
      candidate = next;
    }
  }

  const inner = s.replace(/^\[|\]$/g, "").trim();
  if (inner) {
    const pieces = inner
      .split(/\s*,\s*/)
      .map((p) =>
        p
          .replace(/\\"/g, '"')
          .replace(/^["']+|["']+$/g, "")
          .trim(),
      )
      .filter(Boolean);
    if (pieces.length) return pieces;
  }

  return s ? [s] : [];
}

function tagsToFormInput(tagsRaw) {
  const arr = parseTagsArray(tagsRaw);
  return arr.length ? arr.join(", ") : "";
}

function formatTagDisplay(tagsRaw) {
  const arr = parseTagsArray(tagsRaw);
  return arr.length ? arr.join(", ") : "—";
}

function isFeaturedValue(v) {
  return v === 1 || v === "1" || v === true;
}

/** API uses `article_type` (e.g. draft / published); UI uses `status` the same way. */
function articleTypeToStatus(articleType, legacyStatus) {
  const raw = String(articleType ?? legacyStatus ?? "published")
    .toLowerCase()
    .trim();
  if (raw === "draft") return "draft";
  return "published";
}

function normalizeCoverImage(v) {
  if (v == null || v === "" || v === "0" || v === 0) return "";
  return String(v);
}

function isHttpUrl(s) {
  return /^https?:\/\//i.test(String(s || "").trim());
}

function uploadBaseFromItem(item) {
  if (!item?.url) return "";
  return String(item.url).replace(/\/?$/, "/");
}

function normalizeArticle(item) {
  const categoryKey = item.category || "";
  const label = CATEGORY_LABELS[categoryKey] || item.category || "—";
  return {
    id: item.id,
    order: item.display_order ?? item.order ?? 99,
    title: item.title || "",
    category: label,
    categoryKey,
    filterKey: categoryKey,
    tag: formatTagDisplay(item.tags),
    tagsList: parseTagsArray(item.tags),
    readTime: item.read_time || item.readTime || "",
    views: item.views ?? null,
    featured: isFeaturedValue(item.featured),
    status: articleTypeToStatus(item.article_type, item.status),
    body: item.body || "",
    cover_image: normalizeCoverImage(item.cover_image),
    uploadBaseUrl: uploadBaseFromItem(item),
    tagsRaw: item.tags,
  };
}

function sortArticlesByDisplayOrderAsc(list) {
  return [...list].sort((a, b) => {
    const ao = Number(a?.order ?? 99);
    const bo = Number(b?.order ?? 99);
    if (ao !== bo) return ao - bo;
    return Number(b?.id ?? 0) - Number(a?.id ?? 0);
  });
}

function RowToggle({ on, onToggle, disabled }) {
  return (
    <button
      type="button"
      className="edu-toggle"
      onClick={onToggle}
      disabled={disabled}
      style={{ background: on ? "var(--edu-green)" : "var(--edu-border)" }}
      aria-pressed={on}
    >
      <span
        className="edu-toggle-thumb"
        style={{ left: on ? "16px" : "2px" }}
      />
    </button>
  );
}

const EducationArticles = () => {
  const [showCatalog, setShowCatalog] = useState(true);
  const [formMode, setFormMode] = useState("new");
  const [activeFilter, setActiveFilter] = useState("all");
  const [rows, setRows] = useState([]);
  const [listPage, setListPage] = useState(1);
  const [listCount, setListCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  /** `draft` | `published` while that form action is in flight */
  const [formSaveLoading, setFormSaveLoading] = useState(null);
  const [deletingRowId, setDeletingRowId] = useState(null);
  const [articleStats, setArticleStats] = useState(null);
  const [mostReadStats, setMostReadStats] = useState(null);

  const [editingArticleId, setEditingArticleId] = useState(null);

  const [articleTitle, setArticleTitle] = useState("");
  const [articleBody, setArticleBody] = useState("");
  const [articleCategory, setArticleCategory] = useState("");
  const [articleTag, setArticleTag] = useState("");
  const [articleReadTime, setArticleReadTime] = useState("5 min read");
  const [articleImage, setArticleImage] = useState("");
  const [articleOrder, setArticleOrder] = useState("99");
  const [formFeatured, setFormFeatured] = useState(false);

  const [coverImageSource, setCoverImageSource] = useState("url");
  const [coverUploadFileName, setCoverUploadFileName] = useState("");
  const [coverUploadBaseUrl, setCoverUploadBaseUrl] = useState("");
  const [coverUploadBlobPreview, setCoverUploadBlobPreview] = useState(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverDropActive, setCoverDropActive] = useState(false);
  const coverPreviewBlobRef = useRef(null);
  const coverFileInputRef = useRef(null);
  const coverDragDepthRef = useRef(0);

  const [searchInput, setSearchInput] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const articlesFetchIdRef = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => {
      const q = searchInput.trim();
      setSearchDebounced((prev) => {
        if (q !== prev) setListPage(1);
        return q;
      });
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchArticles = useCallback(async () => {
    const fetchId = ++articlesFetchIdRef.current;
    setLoading(true);
    try {
      const body = new FormData();
      body.append("type", "get_list");
      body.append("table_name", TABLE_NAME);
      {
        activeFilter !== "all" &&
          body.append(
            "category_name",
            activeFilter === "all" ? "" : activeFilter,
          );
      }
      {searchDebounced && body.append("search", searchDebounced);}
      {
        statusFilter !== "all" &&
          body.append(
            "article_type",
            statusFilter === "all" ? "" : statusFilter,
          );
      }
      // body.append("page", String(listPage));
      const res = await apiRequest({ body });
      if (fetchId !== articlesFetchIdRef.current) return;
      if (res && Array.isArray(res.data)) {
        setRows(sortArticlesByDisplayOrderAsc(res.data.map(normalizeArticle)));
        setListCount(Number(res.count) || res.data.length);
      } else if (res === null) {
        message.error("Could not load articles.");
        setRows([]);
      } else {
        setRows([]);
      }
    } catch (e) {
      console.error(e);
      if (fetchId !== articlesFetchIdRef.current) return;
      message.error("Could not load articles.");
      setRows([]);
    } finally {
      if (fetchId === articlesFetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [activeFilter, searchDebounced, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const body = new FormData();
      body.append("type", "education_counts");
      const res = await apiRequest({ body });
      const parsed = pickStatsFromResponse(res);
      if (parsed) {
        setArticleStats(parsed);
      } else if (res) {
        console.warn("education_counts: unrecognized response shape", res);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchMostReadStats = useCallback(async () => {
    try {
      const body = new FormData();
      body.append("type", "education_most_read");
      const res = await apiRequest({ body });
      const parsed = pickMostReadFromResponse(res);
      setMostReadStats(parsed);
    } catch (e) {
      console.error(e);
      setMostReadStats(null);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    void fetchStats();
    void fetchMostReadStats();
  }, [fetchStats, fetchMostReadStats]);

  /** When `education_counts` is missing or all zeros but the list has rows, derive from current list.
   *  Most read is overridden when `education_most_read` returns data (see `mostReadStats`). */
  const statsFromList = useMemo(() => {
    const published = rows.filter((r) => r.status === "published").length;
    const drafts = rows.filter((r) => r.status === "draft").length;
    const total = Number(listCount) > 0 ? Number(listCount) : rows.length;

    let mostReadTitle = null;
    let mostReadViews = null;
    let maxV = -1;
    for (const r of rows) {
      const v = parseRowViews(r.views);
      if (v > maxV) {
        maxV = v;
        mostReadTitle = r.title;
        mostReadViews = v;
      }
    }
    if (maxV <= 0) {
      mostReadTitle = null;
      mostReadViews = null;
    }

    return {
      total,
      published,
      drafts,
      mostReadTitle,
      mostReadViews,
    };
  }, [rows, listCount]);

  const stats = useMemo(() => {
    const weHaveListData = rows.length > 0 || Number(listCount) > 0;

    let base;
    if (!articleStats) {
      base = statsFromList;
    } else {
      const api = articleStats;
      const apiEmpty =
        (api.total ?? 0) === 0 &&
        (api.published ?? 0) === 0 &&
        (api.drafts ?? 0) === 0 &&
        !api.mostReadTitle;

      if (apiEmpty && weHaveListData) {
        base = statsFromList;
      } else {
        base = api;
      }
    }

    if (
      mostReadStats &&
      (mostReadStats.mostReadTitle || mostReadStats.mostReadViews != null)
    ) {
      return {
        ...base,
        mostReadTitle:
          mostReadStats.mostReadTitle ?? base.mostReadTitle ?? null,
        mostReadViews:
          mostReadStats.mostReadViews != null
            ? mostReadStats.mostReadViews
            : base.mostReadViews,
      };
    }

    return base;
  }, [articleStats, statsFromList, mostReadStats, rows.length, listCount]);

  const clearCoverBlobPreview = () => {
    if (coverPreviewBlobRef.current) {
      URL.revokeObjectURL(coverPreviewBlobRef.current);
      coverPreviewBlobRef.current = null;
    }
    setCoverUploadBlobPreview(null);
  };

  const clearCoverUpload = () => {
    clearCoverBlobPreview();
    setCoverUploadFileName("");
  };

  const coverUploadPreviewSrc = useMemo(
    () =>
      coverUploadBlobPreview ||
      (coverUploadFileName && coverUploadBaseUrl
        ? `${coverUploadBaseUrl}${coverUploadFileName}`
        : null),
    [coverUploadBlobPreview, coverUploadFileName, coverUploadBaseUrl],
  );

  const openForm = (mode, row = null) => {
    clearCoverBlobPreview();
    setCoverUploadFileName("");
    setCoverUploadBaseUrl("");
    setFormMode(mode);
    setShowCatalog(false);
    if (mode === "new") {
      setEditingArticleId(null);
      setArticleTitle("");
      setArticleBody("");
      setArticleTag("");
      setArticleImage("");
      setArticleCategory("");
      setArticleReadTime("5 min read");
      setArticleOrder("99");
      setFormFeatured(false);
      setCoverImageSource("url");
    } else if (row) {
      setEditingArticleId(row.id);
      setArticleTitle(row.title);
      setArticleBody(row.body || "");
      setArticleCategory(row.categoryKey || "");
      setArticleTag(tagsToFormInput(row.tagsRaw));
      setArticleReadTime(row.readTime || "5 min read");
      setArticleOrder(String(row.order ?? 99));
      setFormFeatured(!!row.featured);
      const cv = row.cover_image || "";
      setCoverUploadBaseUrl(row.uploadBaseUrl || "");
      if (isHttpUrl(cv)) {
        setCoverImageSource("url");
        setArticleImage(cv);
      } else if (cv) {
        setCoverImageSource("upload");
        setArticleImage("");
        setCoverUploadFileName(cv);
      } else {
        setCoverImageSource("url");
        setArticleImage("");
      }
    }
  };

  const closeForm = () => {
    clearCoverBlobPreview();
    setShowCatalog(true);
    setEditingArticleId(null);
  };

  const processCoverFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      message.warning("Please choose an image file.");
      return;
    }
    setCoverUploading(true);
    try {
      const body = new FormData();
      body.append("type", "upload_data");
      body.append("file", new Blob([file], { type: file.type }), file.name);
      const response = await apiRequest({ body });
      if (response?.file_name) {
        if (coverPreviewBlobRef.current) {
          URL.revokeObjectURL(coverPreviewBlobRef.current);
          coverPreviewBlobRef.current = null;
        }
        const objectUrl = URL.createObjectURL(file);
        coverPreviewBlobRef.current = objectUrl;
        setCoverUploadBlobPreview(objectUrl);
        setCoverUploadFileName(response.file_name);
        message.success("Image uploaded.");
      } else {
        message.error("Upload failed.");
      }
    } catch (err) {
      console.error(err);
      message.error("Upload failed.");
    } finally {
      setCoverUploading(false);
    }
  };

  const handleCoverFileInputChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    await processCoverFile(file);
  };

  const handleCoverDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    coverDragDepthRef.current = 0;
    setCoverDropActive(false);
    if (coverUploading || formSaveLoading) return;
    const file = e.dataTransfer?.files?.[0];
    void processCoverFile(file);
  };

  const handleCoverDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleCoverDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (coverUploading || formSaveLoading) return;
    coverDragDepthRef.current += 1;
    setCoverDropActive(true);
  };

  const handleCoverDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    coverDragDepthRef.current -= 1;
    if (coverDragDepthRef.current <= 0) {
      coverDragDepthRef.current = 0;
      setCoverDropActive(false);
    }
  };

  const buildArticleFormBody = (type, status) => {
    const body = new FormData();
    body.append("type", type);
    body.append("table_name", TABLE_NAME);
    body.append("title", articleTitle.trim());
    body.append("body", articleBody || "");
    body.append("category", articleCategory);
    body.append("tags", JSON.stringify(parseTagsInput(articleTag)));
    body.append("read_time", articleReadTime);
    const coverOut =
      coverImageSource === "url"
        ? (articleImage || "").trim()
        : (coverUploadFileName || "").trim();
    body.append("cover_image", coverOut);
    /* Backend: false = external URL in cover_image; true = server filename from upload */
    body.append(
      "isUpload",
      coverImageSource === "upload" ? "true" : "false",
    );
    body.append("display_order", String(parseInt(articleOrder, 10) || 0));
    body.append("featured", formFeatured ? "1" : "0");
    body.append("article_type", status);
    if (type === "update_data" && editingArticleId != null) {
      body.append("id", String(editingArticleId));
    }
    return body;
  };

  const saveArticle = async (status) => {
    if (!articleTitle.trim()) {
      message.warning("Please enter a title.");
      return;
    }
    if (!articleCategory) {
      message.warning("Please select a category.");
      return;
    }
    const type = formMode === "new" ? "add_data" : "update_data";
    if (type === "update_data" && editingArticleId == null) {
      message.error("No article selected to update.");
      return;
    }
    const loadingKey = status === "published" ? "published" : "draft";
    setFormSaveLoading(loadingKey);
    try {
      const body = buildArticleFormBody(type, status);
      const res = await apiRequest({ body });
      if (res?.result) {
        message.success(
          status === "published"
            ? "Article published! It is now live on the Education page."
            : "Saved as draft. It will not appear on the site until you publish it.",
        );
        closeForm();
        await Promise.all([
          fetchArticles(),
          fetchStats(),
          fetchMostReadStats(),
        ]);
      } else {
        message.error("Save failed. Please try again.");
      }
    } catch (e) {
      console.error(e);
      message.error("Save failed. Please try again.");
    } finally {
      setFormSaveLoading(null);
    }
  };

  const handleDelete = (row) => {
    Modal.confirm({
      title: "Delete this article?",
      content: row.title,
      okText: "Delete",
      okType: "danger",
      centered: true,
      onOk: async () => {
        const idStr = String(row.id);
        setDeletingRowId(idStr);
        try {
          const body = new FormData();
          body.append("type", "delete_data");
          body.append("table_name", TABLE_NAME);
          body.append("id", idStr);
          const res = await apiRequest({ body });
          if (res) {
            message.success("Article deleted.");
            await Promise.all([
          fetchArticles(),
          fetchStats(),
          fetchMostReadStats(),
        ]);
          } else {
            message.error("Delete failed.");
          }
        } catch (e) {
          console.error(e);
          message.error("Delete failed.");
        } finally {
          setDeletingRowId(null);
        }
      },
    });
  };

  const toggleRowFeatured = (row) => {
    const idStr = String(row.id);
    const prevFeatured = !!row.featured;
    const nextFeatured = !prevFeatured;
    const nextFlag = nextFeatured ? "1" : "0";

    setRows((prev) =>
      prev.map((r) =>
        String(r.id) === idStr ? { ...r, featured: nextFeatured } : r,
      ),
    );

    void (async () => {
      try {
        const body = new FormData();
        body.append("type", "update_data");
        body.append("table_name", TABLE_NAME);
        body.append("id", idStr);
        body.append("featured", nextFlag);
        const res = await apiRequest({ body });
        if (res) {
          message.success(
            nextFlag === "1" ? "Marked as featured." : "Removed from featured.",
          );
          void Promise.all([fetchStats(), fetchMostReadStats()]);
        } else {
          message.error("Update failed.");
          setRows((p) =>
            p.map((r) =>
              String(r.id) === idStr ? { ...r, featured: prevFeatured } : r,
            ),
          );
        }
      } catch (e) {
        console.error(e);
        message.error("Update failed.");
        setRows((p) =>
          p.map((r) =>
            String(r.id) === idStr ? { ...r, featured: prevFeatured } : r,
          ),
        );
      }
    })();
  };

  const commitDisplayOrder = async (row, value) => {
    const num = parseInt(value, 10);
    if (Number.isNaN(num)) return;
    setIsProcessing(true);
    try {
      const body = new FormData();
      body.append("type", "update_data");
      body.append("table_name", TABLE_NAME);
      body.append("id", String(row.id));
      body.append("display_order", String(num));
      const res = await apiRequest({ body });
      if (res) {
        await Promise.all([
          fetchArticles(),
          fetchStats(),
          fetchMostReadStats(),
        ]);
      } else {
        message.error("Could not update order.");
        await fetchArticles();
      }
    } catch (e) {
      console.error(e);
      message.error("Could not update order.");
      await fetchArticles();
    } finally {
      setIsProcessing(false);
    }
  };

  const previewImage = (url) => {
    return url && /^https?:\/\//i.test(url.trim());
  };

  const orderValue = (id) => {
    const r = rows.find((x) => x.id === id);
    return r ? String(r.order) : "";
  };

  const pageCount = Math.max(1, Math.ceil((listCount || 0) / 10));

  return (
    <div className="education-articles-panel">
      {showCatalog ? (
        <>
          <div className="edu-page-hdr">
            <div>
              <div className="edu-page-title">Education Articles</div>
              <div className="edu-page-sub">
                Manage all articles shown on the Education Hub page. Publish,
                feature, and organise by category.
              </div>
            </div>
            <button
              type="button"
              className="edu-btn edu-btn-primary"
              onClick={() => openForm("new")}
              disabled={isProcessing}
            >
              New article
            </button>
          </div>

          <div className="edu-stat-grid">
            <div className="edu-stat-card">
              <div className="edu-stat-lbl">Total articles</div>
              <div className="edu-stat-val">{stats.total}</div>
              <div className="edu-stat-delta edu-nt">Across 6 categories</div>
            </div>
            <div className="edu-stat-card">
              <div className="edu-stat-lbl">Published</div>
              <div className="edu-stat-val">{stats.published}</div>
              <div className="edu-stat-delta edu-up">Live on site</div>
            </div>
            <div className="edu-stat-card">
              <div className="edu-stat-lbl">Drafts</div>
              <div className="edu-stat-val">{stats.drafts}</div>
              <div className="edu-stat-delta edu-nt">Not yet published</div>
            </div>
            <div className="edu-stat-card">
              <div className="edu-stat-lbl">Most read</div>
              <div className="edu-stat-val" style={{ fontSize: "14px" }}>
                {stats.mostReadTitle || "—"}
              </div>
              <div className="edu-stat-delta edu-up">
                {stats.mostReadViews != null
                  ? `↑ ${formatViewsLabel(stats.mostReadViews)} views`
                  : "—"}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`edu-filter-pill ${activeFilter === tab.id ? "is-active" : ""}`}
                onClick={() => {
                  setActiveFilter(tab.id);
                  setListPage(1);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="edu-card">
            <div className="edu-ph">
              <div className="edu-pt">All articles</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  className="edu-finput"
                  placeholder="Search articles..."
                  style={{ width: 200, maxWidth: "100%" }}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  aria-label="Search articles"
                />
                <select
                  className="edu-fsel"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setListPage(1);
                  }}
                  aria-label="Filter by status"
                >
                  <option value="all">All statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
                {pageCount > 1 ? (
                  <div
                    style={{ display: "flex", gap: 6, alignItems: "center" }}
                  >
                    <button
                      type="button"
                      className="edu-btn edu-btn-ghost edu-btn-sm"
                      disabled={listPage <= 1 || isProcessing}
                      onClick={() => setListPage((p) => Math.max(1, p - 1))}
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      className="edu-btn edu-btn-ghost edu-btn-sm"
                      disabled={listPage >= pageCount || isProcessing}
                      onClick={() =>
                        setListPage((p) => Math.min(pageCount, p + 1))
                      }
                    >
                      Next
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            <table className="edu-tbl">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>Order</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Tag</th>
                  <th>Read time</th>
                  <th>Views</th>
                  <th>Featured</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      style={{ textAlign: "center", padding: 40 }}
                    >
                      <CircularProgress size={32} />
                    </td>
                  </tr>
                ) : null}
                {!loading || rows.length > 0
                  ? rows.map((row) => (
                      <tr
                        key={row.id}
                        style={{
                          opacity: row.status === "draft" ? 0.6 : 1,
                        }}
                      >
                        <td>
                          <input
                            className="edu-svc-input"
                            defaultValue={orderValue(row.id)}
                            style={{ width: 40, textAlign: "center" }}
                            key={`ord-${row.id}-${row.order}`}
                            disabled={isProcessing}
                            onBlur={(e) => {
                              const v = e.target.value;
                              if (v !== String(row.order)) {
                                commitDisplayOrder(row, v);
                              }
                            }}
                          />
                        </td>
                        <td className="edu-bold">{row.title}</td>
                        <td>
                          <span
                            className={`edu-tag ${CATEGORY_TAG_CLASS[row.category] || "edu-tg-g"}`}
                          >
                            {row.category}
                          </span>
                        </td>
                        <td>
                          {row.tagsList?.length ? (
                            <span
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 4,
                                maxWidth: 280,
                              }}
                            >
                              {row.tagsList.map((t, idx) => (
                                <span
                                  key={`${row.id}-tag-${idx}-${t}`}
                                  className="edu-tag edu-tg-g"
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 500,
                                  }}
                                >
                                  {t}
                                </span>
                              ))}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>{row.readTime}</td>
                        <td
                          style={{
                            fontWeight: 600,
                            color: row.views
                              ? "var(--edu-ink)"
                              : "var(--edu-ink3)",
                          }}
                        >
                          {row.views ?? "—"}
                        </td>
                        <td>
                          <RowToggle
                            on={!!row.featured}
                            disabled={!!deletingRowId}
                            onToggle={() => toggleRowFeatured(row)}
                          />
                        </td>
                        <td>
                          <span
                            className={`edu-status ${row.status === "published" ? "edu-s-active" : "edu-s-pending"}`}
                          >
                            {row.status === "published" ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: 4,
                              flexWrap: "wrap",
                            }}
                          >
                            {row.status === "draft" ? (
                              <button
                                type="button"
                                className="edu-btn edu-btn-primary edu-btn-sm"
                                disabled={isProcessing || !!deletingRowId}
                                onClick={() => openForm("edit", row)}
                              >
                                Edit & publish
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="edu-btn edu-btn-ghost edu-btn-sm"
                                disabled={isProcessing || !!deletingRowId}
                                onClick={() => openForm("edit", row)}
                              >
                                Edit
                              </button>
                            )}
                            <button
                              type="button"
                              className="edu-btn edu-btn-red edu-btn-sm"
                              disabled={isProcessing || !!deletingRowId}
                              onClick={() => handleDelete(row)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                                minWidth:
                                  deletingRowId === String(row.id)
                                    ? 88
                                    : undefined,
                              }}
                            >
                              {deletingRowId === String(row.id) ? (
                                <CircularProgress size={14} color="inherit" />
                              ) : null}
                              {deletingRowId === String(row.id)
                                ? "Deleting…"
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
            {!loading && rows.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  textAlign: "center",
                  color: "var(--edu-ink3)",
                }}
              >
                No articles in this view.
              </div>
            ) : null}
            <div className="edu-tip-bar">
              <span>💡</span>
              <span>
                <strong>Tip:</strong> The Order number controls which articles
                appear first within each category. Lower number = shown first.
                Featured articles always appear at the top of their category
                regardless of order.
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="edu-page-hdr">
            <div>
              <div className="edu-page-title">
                {formMode === "new" ? "New article" : "Edit article"}
              </div>
              <div className="edu-page-sub">
                Fill in the details below. Save as draft to come back later, or
                publish to make it live immediately.
              </div>
            </div>
            <button
              type="button"
              className="edu-btn edu-btn-ghost"
              onClick={closeForm}
              disabled={isProcessing || !!formSaveLoading}
            >
              <ArrowLeft size={15} /> Back to articles
            </button>
          </div>

          <div className="edu-two-col">
            <div>
              <div className="edu-card" style={{ marginBottom: 14 }}>
                <div className="edu-ph">
                  <div className="edu-pt">Article content</div>
                </div>
                <div className="edu-pb">
                  <div style={{ marginBottom: 14 }}>
                    <div className="edu-field-lbl">Title *</div>
                    <input
                      className="edu-finput"
                      value={articleTitle}
                      onChange={(e) => setArticleTitle(e.target.value)}
                      placeholder="e.g. 5 ways to cut vet costs without cutting corners"
                    />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <CKEditorIframe
                      value={articleBody}
                      onChange={(value) => setArticleBody(value)}
                      minHeight={400}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="edu-two-col-settings">
              <div className="edu-card" style={{ marginBottom: 14 }}>
                <div className="edu-ph">
                  <div className="edu-pt">Settings</div>
                </div>
                <div className="edu-pb">
                  <div style={{ marginBottom: 14 }}>
                    <div className="edu-field-lbl">
                      Category * — which tab it appears under
                    </div>
                    <select
                      className="edu-finput"
                      value={articleCategory}
                      onChange={(e) => setArticleCategory(e.target.value)}
                    >
                      <option value="">Select category</option>
                      <option value="saving">Saving</option>
                      <option value="understanding_bills">
                        Understanding Bills
                      </option>
                      <option value="insurrance">Insurance</option>
                      <option value="emergancy">Emergency</option>
                      <option value="medications">Medications</option>
                      <option value="tips">Tips</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div className="edu-field-lbl">
                      Tag — small label shown on the card (comma-separated →
                      stored as JSON array)
                    </div>
                    <input
                      className="edu-finput"
                      value={articleTag}
                      onChange={(e) => setArticleTag(e.target.value)}
                      placeholder="e.g. Money Tip, Insurance, Budget, Saving"
                    />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div className="edu-field-lbl">Read time</div>
                    <select
                      className="edu-finput"
                      value={articleReadTime}
                      onChange={(e) => setArticleReadTime(e.target.value)}
                    >
                      <option>3 min read</option>
                      <option>4 min read</option>
                      <option>5 min read</option>
                      <option>6 min read</option>
                      <option>7 min read</option>
                      <option>8 min read</option>
                      <option>10 min read</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div className="edu-field-lbl">Cover image</div>
                    <div
                      role="radiogroup"
                      aria-label="Cover image source"
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 16,
                        marginBottom: 10,
                      }}
                    >
                      <label
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: "pointer",
                          fontSize: 13,
                        }}
                      >
                        <input
                          type="radio"
                          name="cover-image-source"
                          checked={coverImageSource === "url"}
                          onChange={() => setCoverImageSource("url")}
                        />
                        Image link (URL)
                      </label>
                      <label
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: "pointer",
                          fontSize: 13,
                        }}
                      >
                        <input
                          type="radio"
                          name="cover-image-source"
                          checked={coverImageSource === "upload"}
                          onChange={() => setCoverImageSource("upload")}
                        />
                        Upload image
                      </label>
                    </div>
                    {coverImageSource === "url" ? (
                      <>
                        <input
                          className="edu-finput"
                          value={articleImage}
                          onChange={(e) => setArticleImage(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                        />
                        <div
                          style={{
                            fontSize: 10,
                            color: "var(--edu-ink3)",
                            marginTop: 3,
                          }}
                        >
                          Paste any image URL. Use{" "}
                          <a
                            href="https://unsplash.com/s/photos/pet"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "var(--edu-primary)" }}
                          >
                            unsplash.com
                          </a>{" "}
                          for free pet photos.
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          className={`edu-cover-dropzone ${coverDropActive ? "is-drag" : ""} ${coverUploading ? "is-busy" : ""} ${coverUploadPreviewSrc && !coverUploading ? "has-preview" : ""}`}
                          role="button"
                          tabIndex={0}
                          onClick={(ev) => {
                            if (
                              ev.target.closest?.(".edu-cover-dropzone-clear")
                            ) {
                              return;
                            }
                            if (!coverUploading && !formSaveLoading) {
                              coverFileInputRef.current?.click();
                            }
                          }}
                          onKeyDown={(ev) => {
                            if (ev.key === "Enter" || ev.key === " ") {
                              ev.preventDefault();
                              if (!coverUploading && !formSaveLoading) {
                                coverFileInputRef.current?.click();
                              }
                            }
                          }}
                          onDragEnter={handleCoverDragEnter}
                          onDragLeave={handleCoverDragLeave}
                          onDragOver={handleCoverDragOver}
                          onDrop={handleCoverDrop}
                        >
                          <input
                            ref={coverFileInputRef}
                            type="file"
                            accept="image/*"
                            className="edu-cover-dropzone-input"
                            disabled={coverUploading || !!formSaveLoading}
                            onChange={handleCoverFileInputChange}
                            aria-label="Choose cover image file"
                          />
                          {coverUploading ? (
                            <div className="edu-cover-dropzone-body">
                              <CircularProgress size={32} />
                              <span className="edu-cover-dropzone-title">
                                Uploading…
                              </span>
                            </div>
                          ) : coverUploadPreviewSrc ? (
                            <>
                              <img
                                src={coverUploadPreviewSrc}
                                alt=""
                                className="edu-cover-dropzone-preview-img"
                              />
                              <div className="edu-cover-dropzone-preview-shade" />
                              <button
                                type="button"
                                className="edu-cover-dropzone-clear"
                                aria-label="Remove cover image"
                                disabled={!!formSaveLoading}
                                onClick={(ev) => {
                                  ev.preventDefault();
                                  ev.stopPropagation();
                                  clearCoverUpload();
                                }}
                              >
                                ×
                              </button>
                              <span className="edu-cover-dropzone-replace">
                                Click or drop to replace
                              </span>
                            </>
                          ) : (
                            <div className="edu-cover-dropzone-body">
                              <span
                                className="edu-cover-dropzone-icon"
                                aria-hidden
                              >
                                <svg
                                  width="44"
                                  height="44"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="edu-cover-dropzone-svg"
                                >
                                  <path
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                              <span className="edu-cover-dropzone-title">
                                Drop image here or click to browse
                              </span>
                              <span className="edu-cover-dropzone-hint">
                                JPG, PNG, or WebP. Saved on the server; we store
                                the filename in cover_image.
                              </span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    {coverImageSource === "url" &&
                    previewImage(articleImage) ? (
                      <div style={{ marginTop: 8 }}>
                        <img
                          src={articleImage.trim()}
                          alt="Cover preview"
                          style={{
                            width: "100%",
                            height: 100,
                            objectFit: "cover",
                            borderRadius: 8,
                            border: "1px solid var(--edu-border)",
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div className="edu-field-lbl">
                      Display order within category
                    </div>
                    <input
                      className="edu-finput"
                      type="number"
                      value={articleOrder}
                      onChange={(e) => setArticleOrder(e.target.value)}
                      placeholder="1 = first, 99 = last"
                    />
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--edu-ink3)",
                        marginTop: 3,
                      }}
                    >
                      Lower number appears first in the category tab.
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div className="edu-field-lbl">
                      Featured — appears first in its category
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <RowToggle
                        on={formFeatured}
                        disabled={isProcessing || !!formSaveLoading}
                        onToggle={() => setFormFeatured((f) => !f)}
                      />
                      <span
                        style={{
                          fontSize: 12,
                          color: formFeatured
                            ? "var(--edu-green)"
                            : "var(--edu-ink2)",
                        }}
                      >
                        {formFeatured
                          ? "Featured — appears first in category"
                          : "Not featured"}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      borderTop: "1px solid var(--edu-border)",
                      paddingTop: 14,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <button
                      type="button"
                      className="edu-btn edu-btn-ghost"
                      style={{
                        width: "100%",
                        justifyContent: "center",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                      disabled={!!formSaveLoading}
                      onClick={() => saveArticle("draft")}
                    >
                      {formSaveLoading === "draft" ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : null}
                      {formSaveLoading === "draft"
                        ? "Saving…"
                        : "Save as draft"}
                    </button>
                    <button
                      type="button"
                      className="edu-btn edu-btn-green"
                      style={{
                        width: "100%",
                        justifyContent: "center",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                      disabled={!!formSaveLoading}
                      onClick={() => saveArticle("published")}
                    >
                      {formSaveLoading === "published" ? (
                        <CircularProgress size={18} style={{ color: "#fff" }} />
                      ) : null}
                      {formSaveLoading === "published"
                        ? "Publishing…"
                        : "Publish article"}
                    </button>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--edu-ink3)",
                        textAlign: "center",
                      }}
                    >
                      Published articles appear immediately on the Education
                      page
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EducationArticles;
