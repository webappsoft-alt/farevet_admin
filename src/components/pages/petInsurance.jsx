/* eslint-disable no-unused-vars */
import { Modal, Select, message } from "antd";
import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Plus } from "react-feather";
import { clock } from "../icons/icon";
import { CircularProgress } from "@mui/material";
import { IoClose } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../api/auth_api";
const { Option } = Select;

const PetInsurance = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [selectItem, setSelectItem] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [petInsurances, setPetInsurances] = useState([]);
  const [totalPages, setTotalPages] = useState(null);
  const [totalDataCount, setTotalDataCount] = useState(0);
  const [deleteAction, setDeleteAction] = useState("no");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const navigate = useNavigate();

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImagePreview(true);
  };

  const handleDeleteClick = (row) => {
    setSelectItem(row);
    setShowDeleteModal(true);
  };

  const handleDetailClick = (item) => {
    setDetailItem(item);
    setShowDetailModal(true);
  };

  const handleDeletePetInsurance = async (row) => {
    setLoading(true);
    const body = new FormData();
    body.append("type", "delete_data");
    body.append("table_name", "pet_insurance");
    body.append("id", row?.id);
    await apiRequest({ body })
      .then(async (res) => {
        if (res) {
          message.success("Pet Insurance Deleted Successfully");
          setLoading(false);
          handleFetchData(currentPage);
          setShowDeleteModal(false);
        } else {
          message.error("Deletion failed...");
        }
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  };

  const calculateDiscountedAmount = (discount, services) => {
    const validAmounts = services
      ?.filter(
        (service) => service?.amount !== null && service?.amount !== undefined,
      )
      ?.map((service) => parseFloat(service?.amount) || 0);
    const totalCost = validAmounts?.reduce(
      (acc, serviceCost) => acc + serviceCost,
      0,
    );
    const discountValue = parseFloat(discount) || 0;
    const discountedAmount = totalCost * (1 - discountValue / 100);
    const result = discountedAmount?.toFixed(2);
    return result;
  };

  const handleFetchData = async (page) => {
    setIsProcessing(true);
    const body = new FormData();
    body.append("type", "get_list");
    body.append("table_name", "pet_insurance");
    body.append("page", page);
    await apiRequest({ body })
      .then(async (res) => {
        setIsProcessing(false);
        if (res) {
          setPetInsurances(res?.data || []);
          setTotalDataCount(res?.count || 0);
          setTotalPages(Math.ceil(res?.count / 10));
        } else {
          console.error("Failed to fetch pet insurance data...");
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

  const handleEditClick = (insurance) => {
    navigate(`/pet-insurance/update`, {
      state: { insuranceDetail: insurance },
    });
  };

  return (
    <main className="container m-auto height_calc flex-grow flex flex-col p-3 pet_insurance_modal">
      <div className="flex w-full justify-between items-center flex-wrap">
        <span className="text_dark plusJakara_medium text-2xl md:text-3xl">
          Pet Insurance
        </span>
        <button
          onClick={() => {
            navigate("/pet-insurance/create");
          }}
          className="flex justify-center bg_primary p-2 rounded-lg items-center gap-2 button_shadow"
        >
          <Plus size={18} className="hidden md:block text_white" />
          <span className="inter_semibold max-md:text-xs text-sm text_white ">
            Create New Pet Insurance
          </span>
        </button>
      </div>
      {isProcessing ? (
        <div className="flex w-full justify-center items-center my-5">
          <CircularProgress className="text_primary" size={30} thickness={3} />
        </div>
      ) : (
        <div className="d-flex flex-wrap gap-3 my-5 justify-content-center justify-content-lg-start">
          {!petInsurances || petInsurances?.length === 0 ? (
            <div className="my-5 flex justify-center items-center w-full">
              <span className="text_dark inter_medium">
                No Pet Insurance Found
              </span>
            </div>
          ) : (
            petInsurances?.map((item, i) => (
              <div
                key={i}
                className="border box_styling bg_white shadow-sm relative rounded-lg w-full h-auto p-3"
                onClick={() => handleEditClick(item)}
              >
                <div className="deal_label">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(item);
                    }}
                  >
                    <IoClose className="text_white" />
                  </button>
                </div>
                <div className="flex justify-start gap-2 mb-2">
                  {item?.logo && item.logo !== "null" && (
                    <img
                      style={{
                        width: "64px",
                        height: "64px",
                        objectFit: "cover",
                      }}
                      className="rounded-lg cursor-pointer object-cover"
                      alt=""
                      src={`${item.url}${item.logo}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageClick(`${item.url}${item.logo}`);
                      }}
                    />
                  )}
                  <div className="flex flex-col ms-2 cursor-pointer w-full">
                    <span className="text-xl text_dark plusJakara_medium">
                      {item?.provider_name}
                    </span>
                    <div className="flex items-center">
                      <span className="text-xs text_secondary plusJakara_medium line-clamp-2">
                        Rating: {item?.rating}/5
                      </span>
                    </div>
                    <span className="text-xs text_secondary plusJakara_medium line-clamp-2">
                      Website:{" "}
                      <a
                        className="plusJakara_semibold text_black"
                        href={item?.website_link || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item?.website_link || "N/A"}
                      </a>
                    </span>
                  </div>
                </div>
                <div className="flex cursor-pointer justify-between items-center">
                  <span className="text-xl plusJakara_medium text-[#FF6F61]">
                    ${item?.cost}
                  </span>
                  <div className="flex gap-1">
                    <img src={clock} height={16} width={16} alt="" />
                    <span className="text-xs plusJakara_medium text_secondary">
                      Updated: {new Date(item?.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {/* <div className="flex cursor-pointer gap-1">
                  <span className="text_secondary plusJakara_medium text-xs">
                    Highlight:
                  </span>
                  <span className="text_primary plusJakara_medium text-sm">
                    {item?.highlight || 'N/A'}
                  </span>
                </div> */}
                {/* <div className="flex cursor-pointer justify-between flex-wrap gap-2 items-center">
                  <div className="flex gap-1">
                    <span className="text_secondary plusJakara_medium text-xs">
                      Coverage:
                    </span>
                    <div className="relative">
                      <span className="text_primary plusJakara_medium text-sm">
                        {item?.coverage || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <img src={clock} height={16} width={16} alt="" />
                    <span className="text-xs plusJakara_medium text_secondary">
                      Updated: {new Date(item?.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div> */}
              </div>
            ))
          )}
        </div>
      )}
      <div className="mt-auto">
        <div className="flex justify-between items-center border shadow-sm bg_white rounded-lg w-full py-2 px-3">
          <span className="text_secondary inter_medium text">{`Total showing ${totalDataCount}`}</span>
          <div className="flex">
            <button
              className={`px-3 py-1 text-sm border rounded-l-md ${
                currentPage === 1 ? "bg_white text_dark cursor-not-allowed" : ""
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
                    className={`px-3 py-1 text-sm border ${
                      currentPage === page
                        ? "bg_primary text_white cursor-not-allowed"
                        : "bg_white text_dark"
                    }`}
                    disabled={currentPage === page}
                    onClick={() => handlePageClick(page)}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>
            <button
              className={`px-3 py-1 text-sm border rounded-r-md ${
                currentPage >= totalPages ? "cursor-not-allowed" : ""
              }`}
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
            >
              <ArrowRight size={16} className="text_secondary" />
            </button>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
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

      {/* Delete Confirmation Modal */}
      <Modal
        centered
        open={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        footer={null}
      >
        <span className="text_dark text-xl text-center plusJakara_medium">
          Are you want to delete this Pet Insurance?
        </span>
        <div className="flex justify-center gap-2 w-full my-3">
          <button
            type="button"
            className={`border cursor-pointer rounded-lg gap-1 px-3 py-2 inter_medium text-sm flex justify-center items-center ${
              deleteAction === "yes"
                ? "bg_primary text_white"
                : "bg_white text_secondary"
            }`}
            disabled={loading}
            onClick={() => handleDeletePetInsurance(selectItem)}
          >
            {loading ? <CircularProgress size={15} color="inherit" /> : "Yes"}
          </button>
          <button
            type="button"
            className={`border cursor-pointer rounded-lg gap-1 px-3 py-2 inter_medium text-sm flex justify-center items-center ${
              deleteAction === "no"
                ? "bg_primary text_white"
                : "bg_white text_secondary"
            }`}
            onClick={() => setShowDeleteModal(false)}
          >
            No
          </button>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        centered
        open={showDetailModal}
        onCancel={() => setShowDetailModal(false)}
        width={700}
        footer={null}
      >
        {detailItem && (
          <div className="p-2">
            <h2 className="text-2xl text_dark plusJakara_medium mb-4">
              Pet Insurance Details
            </h2>

            <div className="flex gap-4 mb-4">
              {detailItem?.image && (
                <img
                  className="rounded-lg h-32 w-32 object-cover"
                  src={
                    detailItem?.image
                      ? `${global.IMAGEURL}/${detailItem?.image}`
                      : `${global.IMAGEURL}/${detailItem?.business?.logo}`
                  }
                  alt="Insurance"
                />
              )}

              <div className="flex-1">
                <h3 className="text-xl text_dark plusJakara_medium">
                  {detailItem?.business?.name || detailItem?.business_name}
                </h3>
                <p className="text_secondary plusJakara_medium">
                  {detailItem?.business?.address || detailItem?.website_link}
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-lg text-[#FF6F61] plusJakara_medium">
                    {detailItem?.discount}% off
                  </span>
                  <span className="text_secondary plusJakara_medium text-sm">
                    Code:{" "}
                    <span className="text_primary">
                      {detailItem?.promo_code}
                    </span>
                  </span>
                </div>

                <div className="flex items-center mt-2">
                  <img src={clock} height={16} width={16} alt="" />
                  <span className="text-sm plusJakara_medium text_secondary ml-1">
                    Expires on {detailItem?.expiry_date}
                  </span>
                </div>
              </div>
            </div>

            {detailItem?.description && (
              <div className="mb-4">
                <h4 className="text-lg text_dark plusJakara_medium mb-1">
                  Description
                </h4>
                <p className="text_secondary">{detailItem?.description}</p>
              </div>
            )}

            {detailItem?.insurance_services &&
              detailItem.insurance_services.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-lg text_dark plusJakara_medium mb-1">
                    Covered Services
                  </h4>
                  <div className="border rounded-lg p-2">
                    {detailItem.insurance_services.map((service, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center border-b py-2 last:border-b-0"
                      >
                        <span className="text_dark">{service.name}</span>
                        <span className="text_primary font-medium">
                          ${parseFloat(service.amount).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {detailItem?.insurance_type === "premium" && (
                      <div className="flex justify-between items-center mt-2 pt-2 border-t">
                        <span className="text_dark font-medium">
                          Total After Discount
                        </span>
                        <span className="text-[#06D6A0] font-medium">
                          $
                          {calculateDiscountedAmount(
                            detailItem?.discount,
                            detailItem?.insurance_services,
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                className="border rounded-lg px-4 py-2 inter_medium text-sm bg_white text_secondary"
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="rounded-lg px-4 py-2 inter_medium text-sm bg_primary text_white"
                onClick={() => {
                  setShowDetailModal(false);
                  handleEditClick(detailItem);
                }}
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
};

export default PetInsurance;
