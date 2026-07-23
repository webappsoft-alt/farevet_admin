/* eslint-disable jsx-a11y/img-redundant-alt */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import Spinner from "../Spinner";
import { Modal, message, Tooltip, Avatar } from 'antd';
import React, { useEffect, useState } from 'react';
import { StyleSheetManager } from 'styled-components';
import { apiRequest } from '../../api/auth_api';
import ProductTable from '../DataTable/productTable';
import { Eye, Trash, MessageSquare } from "react-feather";
import moment from "moment";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination } from "swiper";
import CKEditorIframe from "../ckeditor/CKEditorIframe";

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

    const parseImages = (images) => {
        if (!images) return [];
        if (Array.isArray(images)) return images;
        if (typeof images === 'string') {
            try {
                return JSON.parse(images);
            } catch (e) {
                return [images];
            }
        }
        return [];
    };

    const parseTags = (tags) => {
        if (!tags) return [];
        if (Array.isArray(tags)) return tags;
        if (typeof tags === 'string') {
            try {
                return JSON.parse(tags);
            } catch (e) {
                if (tags.includes(',')) {
                    return tags.split(',').map(t => t.trim());
                }
                return [tags];
            }
        }
        return [];
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
            minWidth: '350px',
            cell: (row) => {
                const tagsArray = parseTags(row?.tags);
                return (
                    <div className="flex flex-col gap-1 py-2">
                        <div className="text_dark plusJakara_semibold line-clamp-2" style={{ fontSize: "13px", lineHeight: "1.4" }}>
                            {row?.question || "No Question"}
                        </div>
                        {tagsArray.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {tagsArray.map((tag, idx) => (
                                    <span key={idx} className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full plusJakara_medium">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                        <div className="text_secondary plusJakara_regular text-[11px] mt-1">
                            Posted: {row?.post_date_time || moment(row?.created_at).format("MMM DD, YYYY hh:mm A")}
                        </div>
                    </div>
                )
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
            name: 'Action',
            center: true,
            minWidth: '180px',
            cell: (row) => {
                return (
                    <div className='flex gap-2 justify-center items-center'>
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
                                    {selectedPost?.post_date_time || moment(selectedPost?.created_at).format("MMM DD, YYYY hh:mm A")}
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