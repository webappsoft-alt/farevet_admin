import React from 'react'
import { avatarman, folder, mapPin } from '../../icons/icon';
import { Phone } from 'react-feather';
import ProductTable from '../../DataTable/productTable';
import { dataTable } from '../../DataTable/productsData';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { StyleSheetManager } from 'styled-components';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export const options = {
    responsive: true,
    plugins: {
        legend: false,
        tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
                label: function (context) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    label += context.parsed.y;
                    return label;
                },
            },
        },
    },
    scales: {
        x: {
            ticks: {
                font: 'manrope_bold',
            },
            grid: {
                display: false,
            },

        },
        y: {
            min: 2,
            max: 30,
            ticks: {
                font: 'manrope_bold',
                callback: function (value) {
                    return value + 'k';
                },
            },
            grid: {
                borderDash: [10],
            },
        },
    },
};


export const data = {
    labels: [16, 18, 20, 24, 26, 28, 30],
    datasets: [
        {
            data: [23, 15, 29, 10, 23, 15, 30],
            borderColor: '#18173c',
            borderWidth: 3,
            backgroundColor: 'rgba(98, 60, 234, 0.08)',
            pointBorderColor: 'transparent',
            pointBackgroundColor: '#18173c',
            pointBorderWidth: 20,
            tension: 0.5,
            Filler: true,
        },
    ],
};

const VenderProfile = () => {
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
            minwidth: '311px',
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
            name: "Lime",
            sortable: true,
            minwidth: '120px',
            selector: row => row.order_quantity
        },
        {
            name: 'Price',
            sortable: true,
            minwidth: '120px',
            selector: row => row.total
        },
        {
            name: 'Total Sale',
            sortable: true,
            minwidth: '140px',
            selector: row => row.total
        },

    ]

    return (
        <StyleSheetManager shouldForwardProp={(prop) => !['sortActive'].includes(prop)}>
            <main className="min-h-screen lg:container py-5 px-4 mx-auto">
                <div className="flex justify-between max-md:flex-col max-md:gap-3 mb-4 md:items-center w-full">
                    <div>
                        <h4 className="manrope_bold max-md:text-xl text_black">Vender Profile</h4>
                        <h6 className="text_secondary max-md:text-sm manrope_regular">Activities that must be monitored in order to maintain buyer satisfaction</h6>
                    </div>
                </div>
                <div className="flex justify-between mt-5 max-md:flex-wrap gap-[24px] w-full">
                    <div className="border border-white shadow px-[24px] py-[10px] lg:py-[20px] w-full md:w-[35%] xl:w-[30%] rounded-xl bg_white">
                        <div className=" flex items-center justify-center">
                            <div className="flex flex-col items-center gap-1">
                                <img src={avatarman} className='h-[120px] w-auto rounded-full mb-2' alt="" />
                                <span className="inter_bold text_primary text-sm">SARAH SMITH</span>
                                <span className="inter_regular text-sm text_secondary mb-2">sarahsmith@gmail.com</span>
                            </div>
                        </div>
                        <hr className='text-[#E9EAF3]' />
                        <div className="my-3 mx-[8px] lg:mx-[24px] flex flex-col gap-2">
                            <div className="flex gap-3 items-start">
                                <img src={folder} alt="" />
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm inter_semibold text_primary">Store Name</span>
                                    <span className="text-sm inter_regular text_secondary">Lime</span>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <img src={folder} alt="" />
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm inter_semibold text_primary">Brand Type</span>
                                    <span className="text-sm inter_regular text_secondary">Clothing</span>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <Phone size={16} className='text-[#C8CAD8]' />
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm inter_semibold text_primary">Phone No</span>
                                    <span className="text-sm inter_regular text_secondary">7837930349</span>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <img src={mapPin} alt="" />
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm inter_semibold text_primary">Location</span>
                                    <span className="text-sm inter_regular text_secondary">Lahore, Pakistan</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="border border-white shadow px-[24px] py-[10px] lg:py-[20px] w-full md:w-[65%] xl:w-[70%] rounded-xl bg_white">
                        <div className="my-3 flex gap-2 items-center">
                            <div className="border w-2 h-2 rounded-full bg_dark border-white"></div>
                            <span className="manrope_medium text_primary">Revenue</span>
                        </div>
                        <Line options={options} data={data} />
                    </div>
                </div>
                <div className="my-5">
                    <ProductTable rowHeading='All Products' showFilter={false} data={dataTable} columns={columns} showRow={true} />
                </div>
            </main>
        </StyleSheetManager>
    )
}

export default VenderProfile;