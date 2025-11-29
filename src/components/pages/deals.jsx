/* eslint-disable no-unused-vars */
import { Modal, Select, message } from "antd";
import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Plus } from "react-feather";
import { clock } from "../icons/icon";
// import 'antd/dist/antd.css';
import { CircularProgress } from "@mui/material";
import { IoClose } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../api/auth_api";
const { Option } = Select;

const Deals = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [selectItem, setSelectItem] = useState(null)
  const [selectedImage, setSelectedImage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([]);
  const [totalPages, setTotalPages] = useState(null);
  const [totalDataCount, setTotalDataCount] = useState(0);
  const [deleteDeal, setDeleteDeal] = useState("no");
  const [showDeleteDeal, setShowDeleteDeal] = useState(false);
  const navigate = useNavigate();

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImagePreview(true);
  };

  const handleClick = (row) => {
    setSelectItem(row)
    setShowDeleteDeal(true)
  }

  const handleDeleteDeals = async (row) => {
    setLoading(true)
    const body = new FormData();
    body.append("type", "delete_data");
    body.append("table_name", "deals");
    body.append("id", row?.id);
    await apiRequest({ body })
      .then(async (res) => {
        if (res) {
          message.success("Deals Deleted Successfully");
          setLoading(false)
          handleFetchData(currentPage);
          setShowDeleteDeal(false)
        } else {
          message.error("Deletion failed...");
        }
      })
      .catch((error) => {
        console.error(error);
        setLoading(false)
      });
  };

  const calculateDiscountedAmount = (discount, dealServices) => {
    const validAmounts = dealServices?.filter((service) => service?.amount !== null && service?.amount !== undefined)?.map((service) => (parseFloat(service?.amount) || 0));
    const totalCost = validAmounts?.reduce((acc, serviceCost) => acc + serviceCost, 0);
    const discountValue = parseFloat(discount) || 0;
    const discountedAmount = totalCost * (1 - discountValue / 100);
    const result = discountedAmount?.toFixed(2);
    return result;
  };

  const handleFetchData = async (page) => {
    setIsProcessing(true);
    const body = new FormData();
    body.append("type", "get_list");
    body.append("table_name", "deals");
    body.append("business_created", "admin");
    body.append("page", page);
    await apiRequest({ body })
      .then(async (res) => {
        setIsProcessing(false);
        if (res) {
          setCategories(res?.data || []);
          setTotalDataCount(res?.count || 0);
          setTotalPages(Math.ceil(res?.count / 10));
        } else {
          console.error("Creation failed...");
        }
      })
      .catch((error) => {
        console.error(error);
        setIsProcessing(false);
      })
      .finally(() => {
        setIsProcessing(false);
      });

  };

  useEffect(() => {
    handleFetchData(currentPage);
  }, [currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handlePageClick = (page) => {
    setCurrentPage(page);
    handleFetchData(page);
  };

  const handleDealClick = (deal) => {
    navigate(`/deals/${deal?.id}`, { state: { dealDetail: deal } });
  };

  return (
    <main className="container m-auto height_calc flex-grow flex flex-col p-3 deal_modal">
      <div className="flex w-full justify-between items-center flex-wrap">
        <span className="text_dark plusJakara_medium text-2xl md:text-3xl">
          Deals
        </span>
        <button
          onClick={() => {
            navigate("/deals/create-deal");
          }}
          className="flex justify-center bg_primary p-2 rounded-lg items-center gap-2 button_shadow"
        >
          <Plus size={18} className="hidden md:block text_white" />
          <span className="inter_semibold max-md:text-xs text-sm text_white ">
            Create New Deal
          </span>
        </button>
      </div>
      {isProcessing ? (
        <div className="flex w-full justify-center items-center my-5">
          <CircularProgress className="text_primary" size={30} thickness={3} />
        </div>
      ) : (
        <div className="d-flex flex-wrap gap-3 my-5 justify-content-center justify-content-lg-start">
          {!categories || categories?.length === 0 ?
            <div className="my-5 flex justify-center items-center w-full">
              <span className="text_dark inter_medium">No Deal Found</span>
            </div>
            : categories?.map((item, i) => (
              <div
                key={i}
                className="border box_styling bg_white shadow-sm relative rounded-lg w-full h-auto p-3">
                <div className="deal_label">
                  <button onClick={() => handleClick(item)}>
                    <IoClose className="text_white" />
                  </button>
                </div>
                <div className="flex justify-start gap-2 mb-2">
                  {item?.image && (
                    <img
                      style={{
                        width: "64px",
                        height: "64px",
                        objectFit: 'cover'
                      }}
                      className="rounded-lg cursor-pointer object-cover"
                      alt=""
                      src={
                        item?.image
                          ? `${global.IMAGEURL}/${item?.image}`
                          : `${global.IMAGEURL}/${item?.business?.logo}`
                      }
                      onClick={() =>
                        handleImageClick(
                          item?.image
                            ? `${global.IMAGEURL}/${item?.image}`
                            : `${global.IMAGEURL}/${item?.business?.logo}`
                        )
                      }
                    />
                  )}
                  <div
                    className="flex flex-col ms-2 cursor-pointer w-full"
                    onClick={() => handleDealClick(item)}
                  >
                    <span className="text-xl text_dark plusJakara_medium">
                      {item?.business?.name || item?.business_name}
                    </span>
                    <span className="text-xs text_secondary plusJakara_medium line-clamp-2">
                      {item?.business?.address || item?.website_link}
                    </span>
                  </div>
                  {/* <button className="flex justify-center items-center rounded-lg bg_white text-sm inter_semibold text_primary w-[8rem] h-[2.6rem]" style={{ border: '1px solid #8930F9' }}>Book now</button> */}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xl plusJakara_medium text-[#FF6F61]">
                    {item?.discount}% off
                  </span>
                  {item?.deal_type === 'clinic' && <div className="flex items-center gap-1">
                    <span
                      className="text_secondary inter_regular"
                      style={{ textDecorationLine: "line-through" }}
                    >
                      $
                      {item?.deal_services?.reduce(
                        (acc, service) => acc + parseFloat(service?.amount),
                        0
                      )?.toFixed(2)}
                    </span>
                    <span className="text-[#06D6A0] inter_semibold text-xl">
                      $
                      {calculateDiscountedAmount(
                        item?.discount,
                        item?.deal_services
                      )}
                    </span>
                  </div>}
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <span className="text_secondary plusJakara_medium text-xs">
                      Code:
                    </span>
                    <div className="relative">
                      <span className="text_primary plusJakara_medium text-sm">
                        {item?.promo_code}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <img src={clock} height={16} width={16} alt="" />
                    <span className="text-xs plusJakara_medium text_secondary">
                      Exp. {item?.expiry_date}
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
      <div className="mt-auto">
        <div className="flex justify-between items-center border shadow-sm bg_white rounded-lg w-full py-2 px-3">
          <span className="text_secondary inter_medium text">{`Total showing ${totalDataCount}`}</span>
          <div className="flex">
            <button
              className={`px-3 py-1 text-sm border rounded-l-md ${currentPage === 1 ? "bg_white text_dark cursor-not-allowed" : ""
                }`}
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              <ArrowLeft size={16} className="text_secondary" />
            </button>
            <div className="flex">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page, i) => (
                  <button
                    key={i}
                    className={`px-3 py-1 text-sm border ${currentPage === page
                      ? "bg_primary text_white cursor-not-allowed"
                      : "bg_white text_dark"
                      }`}
                    disabled={currentPage === page}
                    onClick={() => handlePageClick(page)}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
            <button
              className={`px-3 py-1 text-sm border rounded-r-md ${currentPage >= totalPages ? "cursor-not-allowed" : ""
                }`}
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
            >
              <ArrowRight size={16} className="text_secondary" />
            </button>
          </div>
        </div>
      </div>
      <Modal
        open={showImagePreview}
        onCancel={() => setShowImagePreview(false)}
        footer={null}
      >
        <img
          src={selectedImage}
          alt={selectedImage}
          className="object-cover w-full"
          style={{ maxHeight: "30rem" }}
        />
      </Modal>
      <Modal
        centered
        open={showDeleteDeal}
        onCancel={() => setShowDeleteDeal(false)}
        footer={null}
      >
        <span className="text_dark text-xl text-center plusJakara_medium">
          Are you want to delete this Deals?
        </span>
        <div className="flex justify-center gap-2 w-full my-3">
          <button
            type="button"
            className={`border cursor-pointer rounded-lg gap-1 px-3 py-2 inter_medium text-sm flex justify-center items-center ${deleteDeal === "yes"
              ? "bg_primary text_white"
              : "bg_white text_secondary"}`}
            disabled={loading}
            onClick={() => handleDeleteDeals(selectItem)}
          >
            {loading ? <CircularProgress size={15} color="inherit" /> : 'Yes'}
          </button>
          <button
            type="button"
            className={`border cursor-pointer rounded-lg gap-1 px-3 py-2 inter_medium text-sm flex justify-center items-center ${deleteDeal === "no"
              ? "bg_primary text_white"
              : "bg_white text_secondary"
              }`}
            onClick={() => setShowDeleteDeal(false)}>
            No
          </button>
        </div>
      </Modal>
    </main>
  );
};

export default Deals;