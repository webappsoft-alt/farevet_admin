import React from 'react'
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
                borderDraw: false,
            },
            ticks: {
                display: false,
                borderDraw: false,
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
                display: false,
                borderDraw: false,
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
            pointBackgroundColor: 'transparent',
            tension: 0.5,
            Filler: true,
        },
    ],
};
const EarningChart = () => {
    return (
        <div className="max-w-[6rem] h-auto">
            <Line options={options} data={data} />
        </div>
    )
}

export default EarningChart;