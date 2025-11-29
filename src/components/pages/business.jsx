/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { CircularProgress } from "@mui/material";
import { Input, Modal, Select, message } from "antd";
import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Plus, Search } from "react-feather";
import { IoClose } from "react-icons/io5";
import { useLocation, useNavigate } from "react-router-dom";
import StarRatings from "react-star-ratings";
import { apiRequest } from "../../api/auth_api";
import { HiDuplicate } from "react-icons/hi";
import { avatar2 } from "../icons/icon";
const { Option } = Select;

const Business = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteDeal, setShowDeleteDeal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalPages, setTotalPages] = useState(null);
  const [deleteDeal, setDeleteDeal] = useState("no");
  const [value, setValue] = useState('')
  const [selectItem, setSelectItem] = useState(null)
  const [totalDataCount, setTotalDataCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  const handleClick = (row) => {
    setSelectItem(row)
    setShowDeleteDeal(true)
  }

  const handlePageClick = (page) => {
    setCurrentPage(page);
    handleFetchData(page);
  };

  const handleChange = (e) => {
    const searchValue = e?.target?.value?.toLowerCase().trim();
    setValue(searchValue);
    handleFetchData(currentPage, searchValue);
  };

  const handleFetchData = async (page) => {
    setIsProcessing(true);
    const body = new FormData();
    body.append("type", "get_list");
    body.append("table_name", "businesses");
    body.append("business_created", "admin");
    body.append("page", page);

    if (value && value !== '') {
      body.append("search", value);
    }
    try {
      const res = await apiRequest({ body });
      setIsProcessing(false);
      if (res) {
        setCategories(res?.data || []);
        setTotalDataCount(res?.count || 0);
        setTotalPages(Math.ceil(res?.count / 10));
      } else {
        console.error("Creation failed...");
      }
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteService = async (row) => {
    const body = new FormData();
    body.append("type", "delete_data");
    body.append("table_name", "businesses");
    body.append("id", row?.id);
    await apiRequest({ body })
      .then(async (res) => {
        if (res) {
          message.success("Business Deleted Successfully");
          handleFetchData(currentPage);
          setShowDeleteDeal(false)
        } else {
          message.error("Deletion failed...");
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };
  useEffect(() => {
    handleFetchData(currentPage, value);
  }, [currentPage, value]);

  const handleBusinessClick = (business) => {
    navigate(`/business/${business?.id}`, {
      state: { businessStore: business },
    });
  };

  return (
    <main className="container m-auto height_calc flex-grow flex flex-col p-3">
      <div className="flex w-full justify-between my-4 items-center flex-wrap">
        <span className="text_dark plusJakara_medium text-2xl md:text-3xl">
          Business
        </span>
        <button
          onClick={() => {
            navigate("/business/create-business");
          }}
          className="flex justify-center bg_primary p-2 rounded-3 items-center gap-2 button_shadow"
        >
          <Plus size={18} className="hidden md:block text_white" />
          <span className="inter_semibold max-md:text-xs text-sm text_white">
            Create New Business
          </span>
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div>
          <Input
            prefix={<Search className="text_secondary" size={16} />}
            className="py-2 rounded-3 bg_white search_input_antd"
            onChange={handleChange}
            placeholder={`Search by Name or Address`}
            type="text"
            size="large"
          />
        </div>
        {/* <div className="select_ant">
          <Select
            size="large"
            className="inter_medium text_dark text-sm"
            allowClear
            defaultValue={selectedOption}
            onChange={(e) => {
              setSelectedOption(e);
            }}
          >
            <Option value="address">Address</Option>
            <Option value="name">Name</Option>
          </Select>
        </div> */}
      </div>
      {isProcessing ? (
        <div className="flex w-full justify-center items-center my-5">
          <CircularProgress className="text_primary" size={30} thickness={3} />
        </div>
      ) : (
        <div className="d-flex flex-wrap gap-3 mb-4 justify-content-center justify-content-lg-start">
          {!totalDataCount || totalDataCount < 0 ? <div className="my-5 w-100 d-flex justify-content-center align-items-center">
            <span className="plusJakara_medium text-lg text_black">No Store found</span>
          </div> :
            categories?.map((item, i) => (
              <div
                key={i}
                className="border box_styling no-underline cursor-pointer bg_white shadow-sm relative rounded-3 gap-2 flex items-start w-full py-3 h-auto px-3"
              >
                <button
                  onClick={() =>
                    navigate("/business/create-business", {
                      state: { businessData: item },
                    })
                  }
                  className="deal_label2 text_white p-1 bg_primary"
                >
                  <HiDuplicate size={18} />
                </button>

                <div className="deal_label p-1">
                  <button onClick={() => handleClick(item)}>
                    <IoClose className="text_white" />
                  </button>
                </div>

                <img
                  onClick={() => handleBusinessClick(item)}
                  src={
                    item?.logo ? `${global.IMAGEURL}/${item?.logo}` : avatar2
                  }
                  style={{
                    width: "3.5rem",
                    aspectRatio: "4/4",
                    objectFit: "cover",
                    borderRadius: "50%",
                    height: "auto",
                    cursor: "pointer",
                  }}
                  alt=""
                />

                <div
                  onClick={() => handleBusinessClick(item)}
                  style={{ cursor: "pointer" }}
                  className="flex flex-col gap-1"
                >
                  <span className="text-xl text_dark line-clamp-1 plusJakara_bold">
                    {item?.name}
                  </span>
                  <span className="text-xs text_secondary plusJakara_medium line-clamp-2">
                    {item?.address}
                  </span>
                  <div className="flex items-center">
                    <StarRatings
                      starEmptyColor="gray"
                      starRatedColor="#EFD01D"
                      rating={parseInt(item?.rating?.rating) || 0}
                      starDimension="20px"
                      starSpacing="1px"
                    />
                  </div>
                </div>
              </div>
            ))}

        </div>
      )}
      <div className="mt-auto">
        <div className="flex justify-between items-center border shadow-sm bg_white rounded-3 w-full py-2 px-3 w-100 overflow-x-auto">
          <span style={{ minWidth: '200px' }} className="text_secondary inter_medium text">{`Total showing ${totalDataCount}`}</span>
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
        centered
        open={showDeleteDeal}
        onCancel={() => setShowDeleteDeal(false)}
        footer={null}
      >
        <span className="text_dark text-xl plusJakara_medium">
          Are you want to delete this business?
        </span>
        <div className="flex justify-center gap-2 w-full my-3">
          <button
            type="button"
            className={`border cursor-pointer rounded-lg gap-1 px-3 py-2 inter_medium text-sm flex justify-center items-center ${deleteDeal === "yes"
              ? "bg_primary text_white"
              : "bg_white text_secondary"}`}
            onClick={() => handleDeleteService(selectItem)}
          >
            Yes{" "}
          </button>
          <button
            type="button"
            className={`border cursor-pointer rounded-lg gap-1 px-3 py-2 inter_medium text-sm flex justify-center items-center ${deleteDeal === "no"
              ? "bg_primary text_white"
              : "bg_white text_secondary"
              }`}
            onClick={() => setShowDeleteDeal(false)}
          >
            No
          </button>
        </div>
      </Modal>
    </main>
  );
};

export default Business;
