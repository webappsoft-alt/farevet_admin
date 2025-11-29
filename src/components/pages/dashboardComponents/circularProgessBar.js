
import React from 'react'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const percentage = 66;
const CircularProgessBar = () => {

    const styles = buildStyles({
        strokeLinecap: 'butt',
        textColor: '#18173c',
        pathColor: '#18173c',
        trailColor: '#fff',
        backgroundColor: '#18173c',
        text: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '5px 10px',
            borderRadius: '50%',
        },
    });

    return (
        <>
            <CircularProgressbar
                className='max-w-[12rem] h-auto'
                value={percentage}
                strokeWidth={2}
                styles={styles}
                text={`${percentage}%`}
            />
        </>
    )
}

export default CircularProgessBar;
