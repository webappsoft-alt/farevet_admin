/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import Spinner from "../Spinner";
import { Input, Select, message } from "antd";
import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Plus, Search, Trash2 } from "react-feather";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../api/auth_api";
const { Option } = Select;

const PetService = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [value, setValue] = useState("");
  const [totalPages, setTotalPages] = useState(null);
  const [totalDataCount, setTotalDataCount] = useState(0);

  const handleFetchData = async (page) => {
    setIsProcessing(true);
    const body = new FormData();
    body.append("type", "get_list");
    body.append("table_name", "services");
    body.append("page", page);
    if (value && value !== "") {
      body.append("search", value);
    }
    await apiRequest({ body })
      .then(async (res) => {
        setIsProcessing(false);
        if (res) {
          setCategories(res?.data || []);
          setTotalDataCount(res?.count || 0);
          setTotalPages(Math.ceil(res?.count / 10));
        } else {
          console.error("API request failed...");
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

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleChange = (e) => {
    const searchValue = e?.target?.value?.toLowerCase().trim();
    setValue(searchValue);
    handleFetchData(currentPage, searchValue);
  };

  useEffect(() => {
    handleFetchData(currentPage, value);
  }, [currentPage, value]);

  const handlePageClick = (page) => {
    setCurrentPage(page);
    handleFetchData(page);
  };

  const handleDeleteService = async (id) => {
    const body = new FormData();
    body.append("type", "delete_data");
    body.append("table_name", "services");
    body.append("id", id);
    await apiRequest({ body })
      .then(async (res) => {
        if (res) {
          message.success("Service Deleted Successfully");
          handleFetchData(currentPage);
        } else {
          console.error("deletion failed...");
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleBusinessClick = (service) => {
    navigate(`/services/update-service/${service?.id}`, {
      state: { serviceData: service },
    });
  };

  return (
    <main className="container m-auto height_calc flex-grow flex flex-col p-3">
      <div className="flex w-full justify-between my-4 items-center flex-wrap">
        <span className="text_dark plusJakara_medium text-2xl md:text-3xl">
          Pet Services
        </span>
        <button
          onClick={() => {
            navigate("/services/create-service");
          }}
          className="flex justify-center bg_primary p-2 rounded-lg items-center gap-2 button_shadow"
        >
          <Plus size={18} className="hidden md:block text_white" />
          <span className="inter_semibold max-md:text-xs text-sm text_white">
            Create New service
          </span>
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div>
          <Input
            prefix={<Search className="text_secondary" size={16} />}
            className="py-2 rounded-3 bg_white search_input_antd"
            onChange={handleChange}
            placeholder={`Search by Name, Pet Name or description`}
            type="text"
            size="large"
          />
        </div>
      </div>
      {isProcessing ? (
        <div className="flex w-full justify-center items-center my-5">
          <Spinner className="text_primary" size={30} thickness={3} />
        </div>
      ) : (
        <div className="d-flex flex-wrap gap-3 mb-4 justify-content-center justify-content-lg-start">
          {!categories || categories?.length === 0 ? (
            <div className="my-5 flex justify-center items-center w-full">
              <span className="text_dark inter_medium">No Service Found</span>
            </div>
          ) : (
            categories?.map((item, i) => (
              <div
                key={i}
                className="border border-[#EDF2F6] box_styling no-underline bg_white shadow-sm rounded-lg gap-1 flex justify-between flex-col items-start w-full h-auto p-2"
              >
                <button
                  disabled={item?.business_created === "user"}
                  onClick={() => handleBusinessClick(item)}
                  className="w-full"
                >
                  <div className="flex w-full gap-2 justify-between">
                    <div className="flex flex-col items-start flex-wrap w-full">
                      <span className="text_dark plusJakara_bold">
                        {item?.service_name} , {item?.additional_service_name}
                      </span>
                      <span className="text_dark text-start text-sm plusJakara_regular">
                        {item && item?.sub_service
                          ? (() => {
                              try {
                                const parsedSubService = JSON.parse(
                                  item?.sub_service || "[]"
                                );
                                const parsedAdditionalSubService =
                                  item?.additional_subservice_name
                                    ? JSON.parse(
                                        item?.additional_subservice_name || "[]"
                                      )
                                    : [];

                                // Combine both arrays
                                const allSubservices = [...parsedSubService];
                                if (parsedAdditionalSubService.length > 0) {
                                  allSubservices.push(
                                    ...parsedAdditionalSubService
                                  );
                                }

                                if (Array.isArray(allSubservices)) {
                                  return allSubservices.map(
                                    (subService, index) => (
                                      <React.Fragment key={index}>
                                        {index > 0 && ", "}
                                        {subService}
                                      </React.Fragment>
                                    )
                                  );
                                } else {
                                  console.error(
                                    "Combined subservices is not an array:",
                                    allSubservices
                                  );
                                  return null;
                                }
                              } catch (error) {
                                console.error(
                                  "Error parsing subservice JSON:",
                                  error
                                );
                                return null;
                              }
                            })()
                          : ""}
                      </span>
                    </div>
                    <div className="d-flex flex-column w-full flex-wrap align-items-end">
                      <span className="text-xl text_dark plusJakara_bold">
                        {item?.amount === 0
                          ? "Free"
                          : item?.amount === "" ||
                            item?.amount == null ||
                            item?.amount === "undefined"
                          ? "Need to update"
                          : (item?.currency === "GBP" ? "£" : "$") +
                            item?.amount}
                      </span>
                      <span className="text_dark text-sm plusJakara_regular">
                        {item?.cost_type}
                      </span>
                    </div>
                  </div>
                  <div className="flex w-full flex-wrap justify-start my-2">
                    <span className="text-sm text-start plusJakara_regular text_dark">
                      {item?.description}
                    </span>
                  </div>
                </button>
                <div className="flex justify-end w-full">
                  {item?.business_created === "admin" ? (
                    <button
                      className=""
                      onClick={() => {
                        handleDeleteService(item?.id);
                      }}
                    >
                      <Trash2 style={{ color: "red" }} />
                    </button>
                  ) : (
                    <span className="text_primary plusJakara_medium">
                      Created by User
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      <div className="mt-auto">
        <div className="flex justify-between items-center border shadow-sm bg_white rounded-3 w-full py-2 px-3 w-100 overflow-x-auto">
          <span
            style={{ minWidth: "200px" }}
            className="text_secondary inter_medium text"
          >{`Total showing ${totalDataCount}`}</span>
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
                )
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
    </main>
  );
};

export default PetService;
