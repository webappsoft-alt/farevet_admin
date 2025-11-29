import React from 'react'
import ProductTable from '../DataTable/productTable';
import { dataTable } from '../DataTable/productsData';
import { avatarman, preview, trash } from '../icons/icon';
import { StyleSheetManager } from 'styled-components';

const AllAds = () => {

    const columns = [
        {
            name: 'No',
            sortable: true,
            maxwidth: '25px',
            selector: row => row.no
        },
        {
            name: 'Name',
            sortable: true,
            minwidth: '211px',
            cell: (row) => {
                return (
                    <div className="flex items-center w-full gap-1">
                        <img src={avatarman} className="h-[24px] w-auto rounded-full" alt="" />
                        <div className="w-full line-clamp-1">
                            {row.personal_infor}
                        </div>
                    </div>
                )
            }
        },
        {
            name: "Store Name",
            sortable: true,
            minwidth: '120px',
            selector: row => row.order_quantity
        },
        {
            name: 'Plan Type',
            sortable: true,
            minwidth: '120px',
            selector: row => row.total
        },
        {
            name: 'Total',
            sortable: true,
            minwidth: '140px',
            selector: row => row.total
        },
        {
            name: 'Address',
            sortable: true,
            minwidth: '220px',
            selector: row => row.total
        },
        {
            name: 'Status',
            sortable: true,
            minwidth: '100px',
            cell: (row) => {
                return (
                    <div className="border border-white bg-[#ecf8f0] text-[#1C8C6E] rounded text-center py-[6px] w-[100px] h-auto">
                        {row.status}
                    </div>
                )
            }
        },
        {
            name: 'Action',
            allowoverflow: true,
            minwidth: '100px',
            cell: () => {
                return (
                    <div className='flex gap-1'>
                        <button className="bg-[#2B7F75] flex justify-center rounded-lg w-[24px] h-[24px] items-center"><img className="w-[12px] h-auto" src={preview} alt="" /></button>
                        <button className="bg-[#CE2C60] flex justify-center rounded-lg w-[24px] h-[24px] items-center"><img className="w-[12px] h-auto" src={trash} alt="" /></button>
                    </div>
                )
            }
        }
    ]
    return (
        <StyleSheetManager shouldForwardProp={(prop) => !['sortActive'].includes(prop)}>
            <main className="min-h-screen lg:container py-5 px-4 mx-auto">
                <div className="flex justify-between max-md:flex-col max-md:gap-3 mb-4 md:items-center w-full">
                    <div>
                        <h4 className="manrope_bold max-md:text-xl text_black">Manage Ads</h4>
                        <h6 className="text_secondary max-md:text-sm manrope_regular">Activities that must be monitored in order to maintain buyer satisfaction</h6>
                    </div>
                </div>
                <ProductTable showFilter={true} columns={columns} data={dataTable} showRow={true} rowHeading='All Ads' />
            </main>
        </StyleSheetManager>
    )
}

export default AllAds;