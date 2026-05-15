/* eslint-disable no-unused-vars */
import { Fragment, useState, forwardRef } from "react";
import ReactPaginate from "react-paginate";
import DataTable from "react-data-table-component";
import { ChevronDown } from "react-feather";
import { Card, Input } from "reactstrap";
import {
  arrowleft2,
  arrowright2,
  filter,
  searchnormal,
  noDataIcon,
} from "../icons/icon";
import { CircularProgress } from "@mui/material";
import "./productTable.scss";
import ProductTableNoData from "./NoDataComponent";

const PRODUCT_TABLE_CUSTOM_STYLES = {
  table: {
    style: {
      backgroundColor: "transparent",
    },
  },
  tableWrapper: {
    style: {
      backgroundColor: "transparent",
    },
  },
  headRow: {
    style: {
      backgroundColor: "#f4f5f9",
      borderBottom: "1px solid #e6e8ef",
      minHeight: "32px",
    },
  },
//   headCells: {
//     style: {
//       fontSize: "8.75px",
//       fontWeight: "700",
//       letterSpacing: "0.05em",
//       textTransform: "uppercase",
//       color: "#737791",
//       paddingLeft: "0.65rem",
//       paddingRight: "0.65rem",
//       paddingTop: "0.45rem",
//       paddingBottom: "0.45rem",
//       lineHeight: "1.2",
//     },
//   },
  rows: {
    style: {
      fontSize: "10.5px",
      color: "#32395F",
      borderBottom: "1px solid #f0f1f5",
      minHeight: "38px",
      backgroundColor: "#fff",
    },
    highlightOnHoverStyle: {
      backgroundColor: "rgba(137, 48, 249, 0.045)",
      borderBottomColor: "#eceef4",
    },
  },
  cells: {
    style: {
      paddingLeft: "0.65rem",
      paddingRight: "0.65rem",
      paddingTop: "0.4rem",
      paddingBottom: "0.4rem",
      fontSize: "10.5px",
      lineHeight: "1.32",
    },
  },
  pagination: {
    style: {
      borderTop: "none",
      paddingTop: "0",
      paddingBottom: "0",
      minHeight: "0",
      backgroundColor: "transparent",
    },
  },
  noData: {
    style: {
      backgroundColor: "#fafbfd",
    },
  },
};

// const BootstrapCheckbox = forwardRef((props, ref) => (
//     <div className='form-check'>
//         <Input type='checkbox' ref={ref} {...props} />
//     </div>
// ))



const ProductTable = ({
  data,
  columns,
  currentPage,
  selectedLevel,
  showFilter,
  showRow,
  rowHeading,
  setCurrentPage,
  setLastId,
  count,
  setSearch,
  loading,
  noDataTitle,
  noDataSubtitle,
}) => {
  const [modal, setModal] = useState(false);
  // const [currentPage, setCurrentPage] = useState(0)
  const [searchValue, setSearchValue] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  // ** Function to handle Modal toggle
  const handleModal = () => setModal(!modal);

  // ** Function to handle filter
  const handleFilter = (e) => {
    const value = e.target.value;
    let updatedData = [];
    setSearchValue(value);

    if (!value.length) {
      setFilteredData([]);
      return;
    }

    if (value.length) {
      updatedData = data.filter((item) => {
        const startsWith =
          item.full_name.toLowerCase().startsWith(value.toLowerCase()) ||
          item.post.toLowerCase().startsWith(value.toLowerCase()) ||
          item.email.toLowerCase().startsWith(value.toLowerCase()) ||
          item.age.toLowerCase().startsWith(value.toLowerCase()) ||
          item.salary.toLowerCase().startsWith(value.toLowerCase()) ||
          item.start_date.toLowerCase().startsWith(value.toLowerCase());

        const includes =
          item.full_name.toLowerCase().includes(value.toLowerCase()) ||
          item.post.toLowerCase().includes(value.toLowerCase()) ||
          item.email.toLowerCase().includes(value.toLowerCase()) ||
          item.age.toLowerCase().includes(value.toLowerCase()) ||
          item.salary.toLowerCase().includes(value.toLowerCase()) ||
          item.start_date.toLowerCase().includes(value.toLowerCase());
        if (startsWith) {
          return startsWith;
        } else if (!startsWith && includes) {
          return includes;
        } else return null;
      });
      setFilteredData(updatedData);
    }
  };

  // ** Function to handle Pagination
  const handlePagination = (page) => {
    setCurrentPage(page.selected);
    setLastId(page.selected + 1);
  };

  // ** Pagination Previous Component
  const Previous = () => {
    return (
      <Fragment>
        <span>
          <img src={arrowleft2} alt="" />
        </span>
      </Fragment>
    );
  };

  // ** Pagination Next Component
  const Next = () => {
    return (
      <Fragment>
        <span>
          <img src={arrowright2} alt="" />
        </span>
      </Fragment>
    );
  };
  const tableData = searchValue.length ? filteredData : data || [];
  const hasRows = tableData.length > 0;
  const emptyTitle =
    noDataTitle ??
    (searchValue.length ? "No matching records" : "No records found");
  const emptySubtitle =
    noDataSubtitle ??
    (searchValue.length
      ? "Try a different search term."
      : "There is nothing to show yet.");

  // ** Custom Pagination
  const CustomPagination = () => (
    <ReactPaginate
      previousLabel={<Previous size={15} />}
      nextLabel={<Next size={15} />}
      forcePage={currentPage}
      onPageChange={(page) => handlePagination(page)}
      pageCount={count}
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

  return (
    <>
      <Fragment>
        <Card className="product-table-farevet w-full border-0">
          {showRow && (
            <div className="product-table-farevet-toolbar w-full">
              <h6 className="product-table-farevet-title plusJakara_semibold">
                {rowHeading}
              </h6>
              <div className="product-table-farevet-actions">
                <div className="product-table-farevet-search-wrap">
                  <img
                    src={searchnormal}
                    className="product-table-farevet-search-icon"
                    alt=""
                  />
                  <Input
                    className="product-table-farevet-search-input w-full"
                    type="text"
                    placeholder="Search…"
                    id="search-input-1"
                    value={searchValue}
                    onChange={handleFilter}
                  />
                </div>
                {showFilter && (
                  <button
                    type="button"
                    className="product-table-farevet-filter-btn"
                  >
                    <img src={filter} alt="" />
                    <span className="plusJakara_semibold text_dark text-sm">
                      Filter
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="product-table-farevet-table-wrap border border-gray-200 rounded-lg  react-dataTable">
            <DataTable
              noHeader
              pagination={hasRows}
              selectableRowsNoSelectAll
              highlightOnHover
              customStyles={PRODUCT_TABLE_CUSTOM_STYLES}
              columns={columns}
              paginationPerPage={10}
              className="react-dataTable"
              sortIcon={
                <ChevronDown
                  size={10}
                  className="text_secondary"
                  strokeWidth={2.25}
                />
              }
              paginationDefaultPage={currentPage + 1}
              paginationComponent={CustomPagination}
              data={tableData}
              progressPending={loading}
              progressComponent={
                <div className="d-flex justify-content-center align-items-center py-5">
                  <CircularProgress size={22} sx={{ color: "#8930f9" }} />
                </div>
              }
              noDataComponent={
                <ProductTableNoData
                  title={emptyTitle}
                  subtitle={emptySubtitle}
                />
              }
            />
          </div>
        </Card>
      </Fragment>
    </>
  );
};

export default ProductTable;
