import React from 'react';
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
        },
    },
    scales: {
        x: {
            grid: {
                display: false,
            },
            ticks: {
                font: 'text-sm text-[#8E95A9] inter_medium',
            },
        },
        y: {
            min: 2,
            max: 30,
            ticks: {
                display: false,
                borderDraw: false,
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

export function LineChart() {
    return (
        <>
            <h5 className='text_primary inter_medium mb-[24px] lg:mb-[48px]'>Traffic</h5>
            <div className="flex flex-wrap justify-between gap-3 w-full h-auto">
                <div className="flex lg:flex-col flex-wrap gap-3 items-center w-full lg:w-[35%]">
                    <div className="border border-white shadow-md rounded-lg bg_white p-3 w-full sm:w-[48%] lg:w-full">
                        <div className="flex justify-between items-center mb-2">
                            <span className="inter_medium text-sm text-[#8E95A9]">Total Visits</span>
                            <span className="inter_bold text-sm text-[#279F51]">+ 22%</span>
                        </div>
                        <span className="text_primary text-2xl inter_semibold">8888</span>
                    </div>
                    <div className="border border-white shadow-md rounded-lg bg_white p-3 w-full sm:w-[48%] lg:w-full">
                        <div className="flex justify-between items-center mb-2">
                            <span className="inter_medium text-sm text-[#8E95A9]">Visitors</span>
                            <span className="inter_bold text-sm text-[#FF8901]">- 22%</span>
                        </div>
                        <span className="text_primary text-2xl inter_semibold">1256</span>
                    </div>
                </div>
                <div className="w-full lg:w-[60%]">
                    <span className="inter_medium text-sm lg:mb-4 text-[#8E95A9]">Jan 16 - Jan 30 store visits chart</span>
                    <Line options={options} data={data} className='h-full lg:max-h-[15rem] w-full' />
                </div>
            </div>
        </>
    );
}
