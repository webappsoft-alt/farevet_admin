/* eslint-disable jsx-a11y/img-redundant-alt */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import Spinner from "../Spinner";
import { Modal, message, Tooltip, Avatar, Select, Input } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheetManager } from 'styled-components';
import { apiRequest } from '../../api/auth_api';
import ProductTable from '../DataTable/productTable';
import { Eye, Trash, MessageSquare, Edit2, Plus } from "react-feather";
import moment from "moment";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination } from "swiper";
import CKEditorIframe from "../ckeditor/CKEditorIframe";

const MAX_FAREVET_SERVICES = 3;
const EMPTY_SERVICE_ROW = { name: "", cost: "" };

function normalizeImageFilename(value) {
    let raw = String(value ?? "").trim();
    if (!raw) return "";
    if (raw.startsWith("[") && raw.endsWith("]")) {
        try {
            const nested = JSON.parse(raw);
            if (Array.isArray(nested) && nested.length === 1) {
                return normalizeImageFilename(nested[0]);
            }
        } catch (e) {
            // keep raw
        }
    }
    const base = String(global.IMAGEURL || "").replace(/\/$/, "");
    if (base && raw.startsWith(base)) {
        raw = raw.slice(base.length).replace(/^\//, "");
    }
    if (/^https?:\/\//i.test(raw)) {
        try {
            raw = decodeURIComponent(raw.split("/").pop() || raw);
        } catch (e) {
            // keep raw
        }
    }
    return raw.replace(/^\/+/, "");
}

function parseImages(images) {
    if (images == null || images === "") return [];

    const parsed = parseLooseJsonField(images, null);
    if (Array.isArray(parsed)) {
        return parsed
            .flatMap((item) => {
                if (item == null || item === "") return [];
                if (typeof item === "string") {
                    const nested = parseLooseJsonField(item, null);
                    if (Array.isArray(nested)) return parseImages(nested);
                }
                return [normalizeImageFilename(item)];
            })
            .filter(Boolean);
    }

    if (Array.isArray(images)) {
        return images
            .flatMap((item) => parseImages(item))
            .filter(Boolean);
    }

    if (typeof images === "string") {
        const trimmed = images.trim();
        if (!trimmed) return [];
        if (trimmed.includes(",") && !trimmed.startsWith("[")) {
            return trimmed
                .split(",")
                .map((item) => normalizeImageFilename(item))
                .filter(Boolean);
        }
        return [normalizeImageFilename(trimmed)];
    }

    return [];
}

function parseLooseJsonField(value, fallback = null) {
    if (value == null || value === "") return fallback;
    if (Array.isArray(value)) return value;
    if (typeof value === "object") return value;

    let raw = String(value).trim();
    if (!raw) return fallback;

    for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
            const parsed = JSON.parse(raw);
            if (typeof parsed === "string") {
                const next = parsed.trim();
                if (!next || next === raw) break;
                raw = next;
                continue;
            }
            return parsed;
        } catch (e) {
            const unescaped = raw
                .replace(/\\"/g, '"')
                .replace(/\\'/g, "'")
                .replace(/\\\\/g, "\\");
            if (unescaped !== raw) {
                raw = unescaped;
                continue;
            }

            if (
                (raw.startsWith('"') && raw.endsWith('"')) ||
                (raw.startsWith("'") && raw.endsWith("'"))
            ) {
                raw = raw.slice(1, -1);
                continue;
            }

            break;
        }
    }

    return fallback;
}

function parseTags(tags) {
    const parsed = parseLooseJsonField(tags, null);
    if (Array.isArray(parsed)) {
        return parsed
            .map((tag) => String(tag ?? "").trim())
            .filter(Boolean);
    }
    if (typeof parsed === "string") {
        const trimmed = parsed.trim();
        if (!trimmed) return [];
        if (trimmed.includes(",")) {
            return trimmed.split(",").map((t) => t.trim()).filter(Boolean);
        }
        return [trimmed];
    }
    if (typeof tags === "string" && tags.includes(",")) {
        return tags.split(",").map((t) => t.trim()).filter(Boolean);
    }
    return [];
}

function parseServices(services) {
    const parsed = parseLooseJsonField(services, []);
    if (!Array.isArray(parsed)) return [];
    return parsed
        .map((item) => ({
            name: String(item?.name ?? item?.service_name ?? "").trim(),
            cost: String(item?.cost ?? item?.price ?? "").trim(),
        }))
        .filter((item) => item.name || item.cost);
}

function stringifyJsonField(value) {
    return JSON.stringify(value ?? []);
}

function imagePreviewUrl(filename) {
    const clean = normalizeImageFilename(filename);
    if (!clean) return "";
    if (/^https?:\/\//i.test(clean)) return clean;
    return `${global.IMAGEURL}/${clean}`;
}

function formatPostDateTimeForInput(row) {
    const raw = row?.post_date_time || row?.created_at;
    if (!raw) return "";
    const direct = moment(raw);
    if (direct.isValid()) return direct.format("YYYY-MM-DDTHH:mm");
    const parsed = moment(
        String(raw),
        [
            "MMM DD, YYYY hh:mm A",
            "MMM DD, YYYY h:mm A",
            "YYYY-MM-DD HH:mm:ss",
            "YYYY-MM-DD HH:mm",
            moment.ISO_8601,
        ],
        true,
    );
    return parsed.isValid() ? parsed.format("YYYY-MM-DDTHH:mm") : "";
}

function formatPostDateTimeForSave(value, fallbackRow) {
    if (value) {
        const parsed = moment(value, [moment.ISO_8601, "YYYY-MM-DDTHH:mm"], true);
        if (parsed.isValid()) return parsed.format("YYYY-MM-DD HH:mm:ss");
    }
    const fallbackRaw = fallbackRow?.post_date_time || fallbackRow?.created_at;
    if (!fallbackRaw) return "";
    const fallback = moment(fallbackRaw);
    if (fallback.isValid()) return fallback.format("YYYY-MM-DD HH:mm:ss");
    return String(fallbackRaw).trim();
}

function formatPostDateTimeDisplay(row) {
    const raw = row?.post_date_time || row?.created_at;
    if (!raw) return "—";
    const direct = moment(raw);
    if (direct.isValid()) return direct.format("MMM DD, YYYY h:mm A");
    const parsed = moment(
        String(raw),
        ["MMM DD, YYYY hh:mm A", "MMM DD, YYYY h:mm A", "YYYY-MM-DD HH:mm:ss"],
        true,
    );
    return parsed.isValid() ? parsed.format("MMM DD, YYYY h:mm A") : String(raw);
}

const Community = () => {
    const [lastId, setLastId] = useState(1);
    const [lastId2, setLastId2] = useState(0);
    const [showImagePreview, setShowImagePreview] = useState(false);
    const [selectedImage, setSelectedImage] = useState([]);
    const [loading, setLoading] = useState(false)
    const [count, setCount] = useState(0)
    const [isProcessing, setIsProcessing] = useState(false)
    const [statusId, setStatusId] = useState('')
    const [categories, setCategories] = useState([]);

    // View Modal State
    const [viewModal, setViewModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);

    // Tip Reply Modal State
    const [replyModal, setReplyModal] = useState(false);
    const [replyPost, setReplyPost] = useState(null);
    const [replyContent, setReplyContent] = useState("");
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    // Edit Modal State
    const [editModal, setEditModal] = useState(false);
    const [editPost, setEditPost] = useState(null);
    const [editForm, setEditForm] = useState({
        question: "",
        tags: [],
        post_type: "",
        post_date_time: "",
        admin_tip_reply: "",
        images: [],
        services: [{ ...EMPTY_SERVICE_ROW }],
    });
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);
    const originalEditImagesRef = useRef([]);
    const editImageInputRef = useRef(null);

    const handleFetchBusiness = async () => {
        setIsProcessing(true);
        try {
            const body = new FormData();
            body.append("type", "get_list");
            body.append("table_name", 'community');
            body.append("page", lastId);
            const res = await apiRequest({ body });
            if (res && res.data && res.data.length > 0) {
                setCategories(res?.data);
                const totalCount = res?.count || 0;
                const pageCount = Math.ceil(totalCount / 10); // Assuming 10 items per page
                setCount(pageCount);
            }
            setIsProcessing(false);
        } catch (error) {
            console.error(error);
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        handleFetchBusiness()
    }, [lastId])

    const buildServiceRowsForEdit = (row) => {
        const parsed = parseServices(row?.services);
        if (parsed.length) {
            return parsed.map((item) => ({ name: item.name, cost: item.cost }));
        }
        return [{ ...EMPTY_SERVICE_ROW }];
    };

    const formatServicesSummary = (row) => {
        const items = parseServices(row?.services);
        if (!items.length) return "";
        return items
            .map((item) => {
                const cost = item.cost ? `$${item.cost}` : "";
                return cost ? `${item.name} (${cost})` : item.name;
            })
            .join(", ");
    };

    const stripHtml = (html) => {
        if (!html) return "";
        return String(html)
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    };

    const openEditModal = (row) => {
        const parsedImages = parseImages(row?.images);
        originalEditImagesRef.current = parsedImages;
        setEditPost(row);
        setEditForm({
            question: row?.question || "",
            tags: parseTags(row?.tags),
            post_type: row?.post_type || "",
            post_date_time: formatPostDateTimeForInput(row),
            admin_tip_reply: row?.admin_tip_reply || "",
            images: parsedImages,
            services: buildServiceRowsForEdit(row),
        });
        setEditModal(true);
    };

    const updateEditField = (key, value) => {
        setEditForm((prev) => ({ ...prev, [key]: value }));
    };

    const addServiceRow = () => {
        setEditForm((prev) => {
            const current = prev.services || [];
            if (current.length >= MAX_FAREVET_SERVICES) return prev;
            return { ...prev, services: [...current, { ...EMPTY_SERVICE_ROW }] };
        });
    };

    const updateServiceRow = (index, field, value) => {
        setEditForm((prev) => {
            const next = [...(prev.services || [])];
            next[index] = { ...next[index], [field]: value };
            return { ...prev, services: next };
        });
    };

    const removeServiceRow = (index) => {
        setEditForm((prev) => {
            const next = (prev.services || []).filter((_, i) => i !== index);
            return {
                ...prev,
                services: next.length ? next : [{ ...EMPTY_SERVICE_ROW }],
            };
        });
    };

    const removeEditImage = (index) => {
        setEditForm((prev) => ({
            ...prev,
            images: (prev.images || []).filter((_, i) => i !== index),
        }));
    };

    const handleEditImageUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = "";
        if (!files.length) return;

        setImageUploading(true);
        try {
            const uploaded = [];
            for (const file of files) {
                if (!file.type.startsWith("image/")) {
                    message.warning(`${file.name} is not an image.`);
                    continue;
                }
                const body = new FormData();
                body.append("type", "upload_data");
                body.append("file", new Blob([file], { type: file.type }), file.name);
                const response = await apiRequest({ body });
                if (response?.file_name) {
                    uploaded.push(normalizeImageFilename(response.file_name));
                }
            }
            if (uploaded.length) {
                setEditForm((prev) => ({
                    ...prev,
                    images: [...(prev.images || []), ...uploaded],
                }));
                message.success(
                    uploaded.length === 1 ? "Image uploaded." : "Images uploaded.",
                );
            } else {
                message.error("Image upload failed.");
            }
        } catch (error) {
            console.error(error);
            message.error("Image upload failed.");
        } finally {
            setImageUploading(false);
        }
    };

    const handleEditSubmit = async () => {
        if (!editPost?.id) return;
        setIsSubmittingEdit(true);
        try {
            const cleanedTags = (editForm.tags || [])
                .map((tag) => String(tag || "").trim())
                .filter(Boolean);
            const cleanedImages = (editForm.images || [])
                .map((img) => normalizeImageFilename(img))
                .filter(Boolean);
            const imagesToSave = cleanedImages.length
                ? cleanedImages
                : originalEditImagesRef.current;
            const cleanedServices = (editForm.services || [])
                .map((item) => ({
                    name: String(item?.name || "").trim(),
                    cost: String(item?.cost || "").trim(),
                }))
                .filter((item) => item.name || item.cost);
            const postDateTime = formatPostDateTimeForSave(
                editForm.post_date_time,
                editPost,
            );

            const body = new FormData();
            body.append("type", "update_data");
            body.append("table_name", "community");
            body.append("id", String(editPost.id));
            body.append("question", editForm.question.trim());
            body.append("tags", stringifyJsonField(cleanedTags));
            body.append("post_type", editForm.post_type.trim());
            body.append("post_date_time", postDateTime);
            body.append("admin_tip_reply", editForm.admin_tip_reply || "");
            body.append("images", stringifyJsonField(imagesToSave));
            body.append("services", stringifyJsonField(cleanedServices));

            const res = await apiRequest({ body });
            if (!res) {
                message.error("Failed to update post.");
                return;
            }
            if (res.result === false) {
                message.error(res?.message || "Failed to update post.");
                return;
            }
            message.success("Post updated successfully.");
            handleFetchBusiness();
            setEditModal(false);
            setEditPost(null);
        } catch (error) {
            console.error(error);
            message.error("An error occurred while updating the post.");
        } finally {
            setIsSubmittingEdit(false);
        }
    };

    const columns = [
        {
            name: 'User',
            sortable: true,
            minWidth: '250px',
            cell: (row) => (
                <div className="flex items-center gap-3 py-2">
                    <Avatar
                        src={row?.user?.image ? `${global.IMAGEURL}/${row.user.image}` : undefined}
                        size={40}
                        className="bg-gray-200 text-gray-500 font-bold uppercase"
                    >
                        {row?.user?.name ? row.user.name.charAt(0) : "U"}
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="plusJakara_semibold text_dark" style={{ fontSize: "14px" }}>
                            {row?.user?.name || "Unknown User"}
                        </span>
                        <span className="text_secondary plusJakara_regular" style={{ fontSize: "12px" }}>
                            {row?.user?.email}
                        </span>
                    </div>
                </div>
            )
        },
        {
            name: 'Post Details',
            sortable: true,
            minWidth: '300px',
            cell: (row) => (
                <div className="flex flex-col gap-1 py-2">
                    <div className="text_dark plusJakara_semibold line-clamp-2" style={{ fontSize: "13px", lineHeight: "1.4" }}>
                        {row?.question || "No Question"}
                    </div>
                    <div className="text_secondary plusJakara_regular text-[11px] mt-1">
                        Posted: {formatPostDateTimeDisplay(row)}
                    </div>
                    {row?.post_type ? (
                        <div className="text_secondary plusJakara_regular text-[11px] capitalize">
                            Type: {row.post_type}
                        </div>
                    ) : null}
                </div>
            )
        },
        {
            name: 'Tags',
            sortable: false,
            minWidth: '160px',
            cell: (row) => {
                const tagsArray = parseTags(row?.tags);
                if (!tagsArray.length) {
                    return <span className="text_secondary plusJakara_regular text-[12px]">—</span>;
                }
                return (
                    <div className="flex flex-wrap gap-1 py-2">
                        {tagsArray.map((tag, idx) => (
                            <span
                                key={`${tag}-${idx}`}
                                className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full plusJakara_medium"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                );
            }
        },
        {
            name: 'FareVet Data',
            sortable: false,
            minWidth: '170px',
            cell: (row) => {
                const summary = formatServicesSummary(row);
                if (!summary) {
                    return <span className="text_secondary plusJakara_regular text-[12px]">—</span>;
                }
                return (
                    <Tooltip
                        title={summary}
                        color="#e5e7eb"
                        overlayInnerStyle={{ color: "black", maxWidth: 320 }}
                    >
                        <span className="plusJakara_regular text-[12px] text_dark line-clamp-2 cursor-help">
                            {summary}
                        </span>
                    </Tooltip>
                );
            }
        },
        {
            name: 'Images',
            sortable: false,
            center: true,
            minWidth: '120px',
            cell: (row) => {
                const imagesArray = parseImages(row?.images);
                if (imagesArray.length > 0) {
                    return (
                        <div className="flex -space-x-2 overflow-hidden py-2" onClick={() => {
                            setSelectedPost(row);
                            setViewModal(true);
                        }}>
                            {imagesArray.slice(0, 3).map((img, idx) => (
                                <img
                                    key={idx}
                                    src={`${global.IMAGEURL}/${img}`}
                                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover cursor-pointer hover:scale-110 transition-transform"
                                    alt="post"
                                />
                            ))}
                            {imagesArray.length > 3 && (
                                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 ring-2 ring-white text-xs font-medium text-gray-500 cursor-pointer">
                                    +{imagesArray.length - 3}
                                </div>
                            )}
                        </div>
                    );
                }
                return <span className="text_secondary plusJakara_regular text-[12px]">No Media</span>;
            }
        },
        {
            name: 'Engagement',
            sortable: true,
            center: true,
            minWidth: '150px',
            cell: (row) => (
                <div className="flex gap-4 plusJakara_semibold text_dark" style={{ fontSize: '13px' }}>
                    <div className="flex flex-col items-center">
                        <span className="text-[#8930F9]">{row?.like_count || 0}</span>
                        <span className="text_secondary text-[10px] uppercase font-normal">Likes</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[#8930F9]">{row?.comment_count || 0}</span>
                        <span className="text_secondary text-[10px] uppercase font-normal">Comments</span>
                    </div>
                </div>
            )
        },
        {
            name: 'Tip',
            sortable: false,
            minWidth: '180px',
            cell: (row) => {
                const tipText = stripHtml(row?.admin_tip_reply);
                if (!tipText) {
                    return <span className="text_secondary plusJakara_regular text-[12px]">—</span>;
                }
                const preview = tipText.length > 90 ? `${tipText.slice(0, 90)}…` : tipText;
                return (
                    <Tooltip
                        title={tipText}
                        color="#e5e7eb"
                        overlayInnerStyle={{ color: "black", maxWidth: 320 }}
                    >
                        <span className="text-[#8930F9] plusJakara_regular text-[12px] line-clamp-2 cursor-help">
                            {preview}
                        </span>
                    </Tooltip>
                );
            }
        },
        {
            name: 'Action',
            center: true,
            minWidth: '220px',
            cell: (row) => {
                return (
                    <div className='flex gap-2 justify-center items-center'>
                        <Tooltip title="Edit Post" color="#e5e7eb" overlayInnerStyle={{ color: "black" }}>
                            <button
                                className="bg-[#fef3c7] hover:bg-[#fde68a] p-1.5 rounded-md transition-colors"
                                onClick={() => openEditModal(row)}
                            >
                                <Edit2 size={16} color="#d97706" />
                            </button>
                        </Tooltip>
                        <Tooltip title="View Details" color="#e5e7eb" overlayInnerStyle={{ color: "black" }}>
                            <button
                                className="bg-[#f1f5f9] hover:bg-[#e2e8f0] p-1.5 rounded-md transition-colors"
                                onClick={() => {
                                    setSelectedPost(row);
                                    setViewModal(true);
                                }}
                            >
                                <Eye size={16} color="#3b82f6" />
                            </button>
                        </Tooltip>
                        <Tooltip title="Admin Tip Reply" color="#e5e7eb" overlayInnerStyle={{ color: "black" }}>
                            <button
                                className="bg-[#f3e8ff] hover:bg-[#e9d5ff] p-1.5 rounded-md transition-colors"
                                onClick={() => {
                                    setReplyPost(row);
                                    setReplyContent(row?.admin_tip_reply || "");
                                    setReplyModal(true);
                                }}
                            >
                                <MessageSquare size={16} color="#9333ea" />
                            </button>
                        </Tooltip>
                        <Tooltip title="Delete Post" color="#e5e7eb" overlayInnerStyle={{ color: "black" }}>
                            <button
                                className="bg-[#fee2e2] hover:bg-[#fecaca] p-1.5 rounded-md transition-colors relative"
                                disabled={loading}
                                onClick={() => {
                                    setPostToDelete(row);
                                    setDeleteModal(true);
                                }}
                            >
                                {statusId === row?.id && loading ? (
                                    <Spinner size={15} color="#dc2626" />
                                ) : (
                                    <Trash size={16} color="#dc2626" />
                                )}
                            </button>
                        </Tooltip>
                    </div>
                )
            }
        }
    ]

    const handleDeletePost = async () => {
        if (!postToDelete) return;
        setStatusId(postToDelete?.id)
        setLoading(true);
        try {
            const body = new FormData();
            body.append('type', 'delete_data');
            body.append('table_name', 'community');
            body.append('id', postToDelete?.id)
            const res = await apiRequest({ body })
            if (res) {
                message.success(`Deleted Successfully`)
                handleFetchBusiness()
                setDeleteModal(false);
                setPostToDelete(null);
            } else {
                setLoading(false);
                console.error("Deletion failed...");
            }
        } catch (error) {
            setLoading(false);
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    const handleReplySubmit = async () => {
        if (!replyPost) return;
        setIsSubmittingReply(true);
        try {
            const body = new FormData();
            body.append('type', 'update_data');
            body.append('table_name', 'community');
            body.append('id', replyPost.id);
            body.append('admin_tip_reply', replyContent);
            const res = await apiRequest({ body });
            if (res) {
                message.success('Reply saved successfully!');
                handleFetchBusiness(); // Refresh table
                setReplyModal(false);
                setReplyPost(null);
            } else {
                message.error('Failed to save reply.');
            }
        } catch (error) {
            console.error(error);
            message.error('An error occurred while saving the reply.');
        } finally {
            setIsSubmittingReply(false);
        }
    };

    return (
        <StyleSheetManager shouldForwardProp={(prop) => !['sortActive'].includes(prop)}>
            <main className='container m-auto height_calc flex-grow flex flex-col p-3'>
                <div className="flex w-full mb-4">
                    <span className="text_dark plusJakara_medium text-2xl md:text-3xl">Community Posts</span>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <ProductTable
                        loading={isProcessing}
                        count={count}
                        setCurrentPage={setLastId2}
                        currentPage={lastId2}
                        columns={columns}
                        data={categories}
                        setLastId={setLastId}
                    />
                </div>
            </main>

            {/* View Post Details Modal */}
            <Modal
                title={
                    <span className="plusJakara_bold text_dark" style={{ fontSize: "18px" }}>
                        Post Details
                    </span>
                }
                open={viewModal}
                onCancel={() => setViewModal(false)}
                footer={null}
                width={600}
                centered
                zIndex={9999}
            >
                {selectedPost && (
                    <div className="flex flex-col gap-4 mt-2">
                        {/* User Header */}
                        <div className="flex items-center gap-3 p-3 bg-[#f8fafc] rounded-xl border border-gray-100">
                            <Avatar
                                src={selectedPost?.user?.image ? `${global.IMAGEURL}/${selectedPost.user.image}` : undefined}
                                size={48}
                                className="bg-gray-200 text-gray-500 font-bold uppercase"
                            >
                                {selectedPost?.user?.name ? selectedPost.user.name.charAt(0) : "U"}
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="plusJakara_bold text_dark text-[15px]">
                                    {selectedPost?.user?.name || "Unknown User"}
                                </span>
                                <span className="text_secondary plusJakara_regular text-[13px]">
                                    {selectedPost?.user?.email} • {selectedPost?.user?.phone || "No phone"}
                                </span>
                            </div>
                        </div>

                        {/* Post Content */}
                        <div className="flex flex-col gap-2">
                            <span className="text_secondary text-[12px] uppercase font-bold tracking-wider">Question / Content</span>
                            <div
                                className="plusJakara_medium text_dark text-[15px] bg-white p-4 rounded-xl border border-gray-200 shadow-sm leading-relaxed custom-scrollbar"
                                style={{ maxHeight: '200px', overflowY: 'auto' }}
                            >
                                {selectedPost?.question || "No content provided."}
                            </div>
                        </div>

                        {/* Tags Display */}
                        {parseTags(selectedPost?.tags).length > 0 && (
                            <div className="flex flex-col gap-2">
                                <span className="text_secondary text-[12px] uppercase font-bold tracking-wider">Tags</span>
                                <div className="flex flex-wrap gap-2">
                                    {parseTags(selectedPost?.tags).map((tag, idx) => (
                                        <span key={idx} className="bg-blue-50 text-blue-700 text-[13px] px-3 py-1 rounded-full plusJakara_medium border border-blue-100">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {parseServices(selectedPost?.services).length > 0 && (
                            <div className="flex flex-col gap-2">
                                <span className="text_secondary text-[12px] uppercase font-bold tracking-wider">
                                    FareVet Data
                                </span>
                                <div className="flex flex-col gap-2">
                                    {parseServices(selectedPost?.services).map((item, idx) => (
                                        <div
                                            key={`${item.name}-${idx}`}
                                            className="flex items-center justify-between gap-3 bg-[#f8fafc] border border-gray-100 rounded-lg px-3 py-2"
                                        >
                                            <span className="plusJakara_medium text_dark text-[13px]">
                                                {item.name}
                                            </span>
                                            <span className="plusJakara_semibold text-[#8930F9] text-[13px]">
                                                {item.cost ? `$${item.cost}` : "—"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Admin Tip Reply Display */}
                        {selectedPost?.admin_tip_reply && (
                            <div className="flex flex-col gap-2">
                                <span className="text-[#8930F9] text-[12px] uppercase font-bold tracking-wider">Admin Tip Reply</span>
                                <div
                                    className="plusJakara_medium text_dark text-[14px] bg-[#fdfcff] p-4 rounded-xl border border-[#e9d5ff] shadow-sm leading-relaxed custom-scrollbar"
                                    style={{ maxHeight: '250px', overflowY: 'auto' }}
                                    dangerouslySetInnerHTML={{ __html: selectedPost.admin_tip_reply }}
                                >
                                </div>
                            </div>
                        )}

                        {/* Swiper for Images */}
                        {parseImages(selectedPost?.images).length > 0 && (
                            <div className="flex flex-col gap-2">
                                <span className="text_secondary text-[12px] uppercase font-bold tracking-wider">Attached Media</span>
                                <div className="rounded-xl overflow-hidden border border-gray-200">
                                    <Swiper
                                        modules={[Navigation, Pagination]}
                                        navigation
                                        pagination={{ clickable: true }}
                                        className="w-full bg-gray-50"
                                        style={{ height: '300px' }}
                                    >
                                        {parseImages(selectedPost?.images).map((img, idx) => (
                                            <SwiperSlide key={idx} className="flex justify-center items-center h-full w-full">
                                                <img
                                                    src={`${global.IMAGEURL}/${img}`}
                                                    alt={`Post media ${idx}`}
                                                    className="w-full h-full object-contain"
                                                />
                                            </SwiperSlide>
                                        ))}
                                    </Swiper>
                                </div>
                            </div>
                        )}

                        {/* Post Metadata */}
                        <div className="grid grid-cols-2 gap-3 mt-2">
                            <div className="bg-[#f8fafc] p-3 rounded-lg border border-gray-100 flex flex-col items-center justify-center">
                                <span className="text_secondary text-[11px] uppercase font-bold mb-1">Posted On</span>
                                <span className="plusJakara_semibold text_dark text-[13px]">
                                    {formatPostDateTimeDisplay(selectedPost)}
                                </span>
                            </div>
                            <div className="bg-[#f8fafc] p-3 rounded-lg border border-gray-100 flex flex-col items-center justify-center">
                                <span className="text_secondary text-[11px] uppercase font-bold mb-1">Post Type</span>
                                <span className="plusJakara_semibold text-[#8930F9] text-[13px] capitalize">
                                    {selectedPost?.post_type || "Regular"}
                                </span>
                            </div>
                        </div>

                        {selectedPost?.report && (
                            <div className="flex flex-col gap-2 mt-2">
                                <span className="text-red-500 text-[12px] uppercase font-bold tracking-wider">Reports</span>
                                <div className="plusJakara_medium text_dark text-[14px] bg-red-50 p-3 rounded-xl border border-red-100 leading-relaxed">
                                    {selectedPost?.report}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Edit Post Modal */}
            <Modal
                title={
                    <span className="plusJakara_bold text_dark" style={{ fontSize: "18px" }}>
                        Edit Community Post
                    </span>
                }
                open={editModal}
                onCancel={() => {
                    if (isSubmittingEdit) return;
                    setEditModal(false);
                    setEditPost(null);
                }}
                footer={null}
                width={820}
                centered
                zIndex={9999}
                destroyOnClose
            >
                {editPost ? (
                    <div className="flex flex-col gap-4 mt-2">
                        <div className="flex flex-col gap-2">
                            <span className="text_secondary text-[12px] uppercase font-bold tracking-wider">
                                Question / Content
                            </span>
                            <Input.TextArea
                                rows={4}
                                value={editForm.question}
                                onChange={(e) => updateEditField("question", e.target.value)}
                                placeholder="Post question or content"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text_secondary text-[12px] uppercase font-bold tracking-wider">
                                Tags
                            </span>
                            <Select
                                mode="tags"
                                style={{ width: "100%" }}
                                placeholder="Type a tag and press Enter"
                                value={editForm.tags}
                                onChange={(value) => updateEditField("tags", value)}
                                tokenSeparators={[","]}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-2">
                                <span className="text_secondary text-[12px] uppercase font-bold tracking-wider">
                                    Post type
                                </span>
                                <Input
                                    value={editForm.post_type}
                                    onChange={(e) => updateEditField("post_type", e.target.value)}
                                    placeholder="regular, tip, etc."
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text_secondary text-[12px] uppercase font-bold tracking-wider">
                                    Post date / time
                                </span>
                                <Input
                                    type="datetime-local"
                                    value={editForm.post_date_time}
                                    onChange={(e) => updateEditField("post_date_time", e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text_secondary text-[12px] uppercase font-bold tracking-wider">
                                    Post images
                                </span>
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#8930F9] text-white plusJakara_semibold text-[12px] hover:bg-[#7221d6] transition-colors disabled:opacity-60"
                                    onClick={() => editImageInputRef.current?.click()}
                                    disabled={imageUploading || isSubmittingEdit}
                                >
                                    {imageUploading ? "Uploading…" : "Upload image"}
                                </button>
                                <input
                                    ref={editImageInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleEditImageUpload}
                                    disabled={imageUploading || isSubmittingEdit}
                                />
                            </div>

                            {(editForm.images || []).length ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {(editForm.images || []).map((img, index) => (
                                        <div
                                            key={`${img}-${index}`}
                                            className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
                                        >
                                            <img
                                                src={imagePreviewUrl(img)}
                                                alt=""
                                                className="w-full h-28 object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.src =
                                                        "https://placehold.co/240x160?text=Image";
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="absolute top-2 right-2 bg-white/95 text-red-600 text-[11px] px-2 py-1 rounded-md shadow plusJakara_semibold"
                                                onClick={() => removeEditImage(index)}
                                                disabled={isSubmittingEdit}
                                            >
                                                Remove
                                            </button>
                                            <div
                                                className="px-2 py-1 text-[10px] text_secondary truncate border-t border-gray-100 bg-white"
                                                title={normalizeImageFilename(img)}
                                            >
                                                {normalizeImageFilename(img)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-gray-300 bg-[#fafafa] px-4 py-8 text-center text_secondary plusJakara_regular text-[13px]">
                                    No images attached. Upload to add, or save to keep existing post images.
                                </div>
                            )}
                        </div>

                        <div
                            className="rounded-xl border border-gray-200 bg-[#fafafa] p-4 flex flex-col gap-3"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="plusJakara_bold text_dark text-[15px]">
                                        FareVet Data (Optional)
                                    </div>
                                    <div className="text_secondary plusJakara_regular text-[12px] mt-1">
                                        Add up to 3 service name + cost pairs
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#8930F9] text-[#8930F9] plusJakara_semibold text-[12px] hover:bg-[#f3e8ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={addServiceRow}
                                    disabled={(editForm.services || []).length >= MAX_FAREVET_SERVICES}
                                >
                                    <Plus size={14} />
                                    Add
                                </button>
                            </div>

                            {(editForm.services || []).map((service, index) => (
                                <div key={`service-row-${index}`} className="flex flex-col gap-2">
                                    <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_auto] gap-2 items-center">
                                        <Input
                                            value={service.name}
                                            onChange={(e) =>
                                                updateServiceRow(index, "name", e.target.value)
                                            }
                                            placeholder="Service name"
                                        />
                                        <Input
                                            value={service.cost}
                                            onChange={(e) =>
                                                updateServiceRow(index, "cost", e.target.value)
                                            }
                                            placeholder="Cost"
                                        />
                                        {(editForm.services || []).length > 1 ? (
                                            <button
                                                type="button"
                                                className="text-red-500 plusJakara_medium text-[12px] px-2 py-1 hover:bg-red-50 rounded-md"
                                                onClick={() => removeServiceRow(index)}
                                            >
                                                Remove
                                            </button>
                                        ) : (
                                            <span />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-[#8930F9] text-[12px] uppercase font-bold tracking-wider">
                                Admin tip reply
                            </span>
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <CKEditorIframe
                                    value={editForm.admin_tip_reply}
                                    onChange={(value) => updateEditField("admin_tip_reply", value)}
                                    minHeight={260}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-2">
                            <button
                                className="px-5 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors plusJakara_semibold text-[14px]"
                                onClick={() => {
                                    setEditModal(false);
                                    setEditPost(null);
                                }}
                                disabled={isSubmittingEdit}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-5 py-2.5 rounded-lg bg-[#8930F9] text-white hover:bg-[#7221d6] transition-colors plusJakara_semibold text-[14px] flex items-center justify-center min-w-[120px]"
                                onClick={handleEditSubmit}
                                disabled={isSubmittingEdit}
                            >
                                {isSubmittingEdit ? <Spinner size={18} color="white" /> : "Save changes"}
                            </button>
                        </div>
                    </div>
                ) : null}
            </Modal>

            {/* Admin Tip Reply Modal */}
            <Modal
                title={
                    <span className="plusJakara_bold text_dark" style={{ fontSize: "18px" }}>
                        Admin Tip Reply
                    </span>
                }
                open={replyModal}
                onCancel={() => {
                    setReplyModal(false);
                    setReplyPost(null);
                }}
                footer={null}
                width={800}
                centered
                zIndex={9999}
            >
                {replyPost && (
                    <div className="flex flex-col gap-4 mt-2">
                        {/* Community Post Preview */}
                        <div className="p-4 bg-[#f8fafc] rounded-xl border border-gray-200">
                            <div className="flex items-center gap-3 mb-3">
                                <Avatar
                                    src={replyPost?.user?.image ? `${global.IMAGEURL}/${replyPost.user.image}` : undefined}
                                    size={36}
                                    className="bg-gray-300 text-gray-600 font-bold uppercase"
                                >
                                    {replyPost?.user?.name ? replyPost.user.name.charAt(0) : "U"}
                                </Avatar>
                                <span className="plusJakara_semibold text_dark text-[14px]">
                                    {replyPost?.user?.name || "Unknown User"}
                                </span>
                            </div>
                            <p className="plusJakara_medium text_dark text-[14px] leading-relaxed">
                                {replyPost?.question || "No content provided."}
                            </p>
                        </div>

                        {/* CKEditor Reply Box */}
                        <div className="flex flex-col gap-2 mt-2">
                            <span className="text_secondary text-[13px] uppercase font-bold tracking-wider">Write your Tip / Reply</span>
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <CKEditorIframe
                                    value={replyContent}
                                    onChange={(value) => setReplyContent(value)}
                                    minHeight={300}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                className="px-5 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors plusJakara_semibold text-[14px]"
                                onClick={() => {
                                    setReplyModal(false);
                                    setReplyPost(null);
                                }}
                                disabled={isSubmittingReply}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-5 py-2.5 rounded-lg bg-[#8930F9] text-white hover:bg-[#7221d6] transition-colors plusJakara_semibold text-[14px] flex items-center justify-center min-w-[120px]"
                                onClick={handleReplySubmit}
                                disabled={isSubmittingReply}
                            >
                                {isSubmittingReply ? <Spinner size={18} color="white" /> : "Save Reply"}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                title={
                    <span className="plusJakara_semibold text_dark" style={{ fontSize: "18px" }}>
                        Delete Post
                    </span>
                }
                open={deleteModal}
                onCancel={() => {
                    setDeleteModal(false);
                    setPostToDelete(null);
                }}
                footer={null}
                width={400}
                zIndex={9999}
                centered
            >
                <div className="flex flex-col gap-4 mt-2">
                    <p className="text_secondary plusJakara_regular text-[14px]">
                        Are you sure you want to delete this post? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors plusJakara_medium text-[13px]"
                            onClick={() => {
                                setDeleteModal(false);
                                setPostToDelete(null);
                            }}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors plusJakara_medium text-[13px] flex items-center justify-center min-w-[80px]"
                            onClick={handleDeletePost}
                            disabled={loading}
                        >
                            {loading ? <Spinner size={16} color="white" /> : "Delete"}
                        </button>
                    </div>
                </div>
            </Modal>
        </StyleSheetManager>
    )
}

export default Community;