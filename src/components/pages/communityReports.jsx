/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import Spinner from "../Spinner";
import { Modal, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { StyleSheetManager } from 'styled-components';
import { apiRequest } from '../../api/auth_api';
import ProductTable from '../DataTable/productTable';

const CommunityReports = () => {
    const [lastId, setLastId] = useState(1);
    const [lastId2, setLastId2] = useState(0);
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusId, setStatusId] = useState('');
    const [reports, setReports] = useState([]);

    const handleFetchReports = async () => {
        setIsProcessing(true);
        try {
            const body = new FormData();
            body.append("type", "get_list");
            body.append("table_name", 'community_report');
            body.append("page", lastId);
            const res = await apiRequest({ body });
            if (res && res.data && res.data.length > 0) {
                setReports(res?.data);
                const totalCount = res?.count || 0;
                const pageCount = Math.ceil(totalCount / 10); // Assuming 10 items per page
                setCount(pageCount);
            } else {
                setReports([]);
                setCount(0);
            }
            setIsProcessing(false);
        } catch (error) {
            console.error(error);
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        handleFetchReports();
    }, [lastId]);

    const handleDeletePost = async (row) => {
        const communityId = row?.community?.id || row?.community_id;
        if (!communityId) {
            message.error("Community post ID not found");
            return;
        }

        Modal.confirm({
            title: "Delete Community Post?",
            content: "Are you sure you want to permanently delete this reported post from the community?",
            okText: "Yes, Delete",
            okType: "danger",
            cancelText: "No",
            onOk: async () => {
                setStatusId(row?.id);
                setLoading(true);
                try {
                    const body = new FormData();
                    body.append('type', 'delete_data');
                    body.append('table_name', 'community');
                    body.append('id', communityId);
                    const res = await apiRequest({ body });
                    if (res) {
                        message.success(`Post deleted successfully`);
                        handleFetchReports();
                    } else {
                        message.error("Failed to delete post");
                    }
                } catch (error) {
                    console.error(error);
                    message.error("Error occurred while deleting post");
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const columns = [
        {
            name: 'Question',
            sortable: true,
            minWidth: '250px',
            cell: (row) => {
                return (
                    <div className="flex w-full plusJakara_regular gap-2 items-center py-2">
                        {row?.community?.question || <span className="text_secondary italic">Deleted / Empty</span>}
                    </div>
                );
            }
        },
        {
            name: 'Report Reason',
            sortable: true,
            minWidth: '200px',
            cell: (row) => {
                return (
                    <div className="flex w-full plusJakara_regular gap-2 items-center py-2" style={{ wordBreak: 'break-all' }}>
                        {row?.report_reason || <span className="text_secondary italic">—</span>}
                    </div>
                );
            }
        },
        {
            name: 'Reported By',
            sortable: true,
            minWidth: '150px',
            selector: row => row?.user?.name || "Unknown User"
        },
        {
            name: 'Action',
            sortable: true,
            cell: (row) => {
                return (
                    <div className='flex gap-1'>
                        <button
                            style={{ backgroundColor: '#d15a5a' }}
                            disabled={loading}
                            onClick={() => handleDeletePost(row)}
                            className="text_white flex justify-center rounded-2 py-1 px-2 items-center relative"
                        >
                            {statusId === row?.id && loading ? (
                                <Spinner size={15} color='inherit' />
                            ) : (
                                'Delete Community Post'
                            )}
                        </button>
                    </div>
                );
            }
        }
    ];

    return (
        <StyleSheetManager shouldForwardProp={(prop) => !['sortActive'].includes(prop)}>
            <main className='container m-auto height_calc flex-grow flex flex-col p-3'>
                <div className="flex w-full mb-4">
                    <span className="text_dark plusJakara_medium text-2xl md:text-3xl">Community Reports</span>
                </div>
                <ProductTable
                    loading={isProcessing}
                    count={count}
                    setCurrentPage={setLastId2}
                    currentPage={lastId2}
                    columns={columns}
                    data={reports}
                    setLastId={setLastId}
                />
            </main>
        </StyleSheetManager>
    );
};

export default CommunityReports;
