/* eslint-disable no-unused-vars */
import React, { useState } from 'react'
import Autocomplete from "react-google-autocomplete";
import GoogleMapReact from 'google-map-react';
import { arrowright2, locationdark } from '../../icons/icon';
import { Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

const Location = () => {
    const navigate = useNavigate()
    const [currentLocation, setCurrentLocation] = useState(null);
    const [mapCenter, setMapCenter] = useState({ lat: 0, lng: 0 })


    const handleSeeOnMap = () => {
        window.open(`https://www.google.com/maps/place/${encodeURIComponent(currentLocation)}`);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
    }
    return (
        <main className='min-h-screen lg:container py-5 px-4 mx-auto'>
            <div className="flex md:gap-[5px] items-center mb-4">
                <Link to='/account' className="manrope_bold no-underline md:text-lg text-[#A6A6A6]">Profile</Link>
                <span className="flex items-center md:gap-[5px]"><img src={arrowright2} alt="" /><span className='text-lg md:text-2xl manrope_bold text-[#404040]'>Location</span></span>
            </div>
            <div className="border bg_white p-4 rounded-lg">
                <h4 className="manrope_semibold text-[#1A2024]">Location</h4>
                <hr className='text-[#f1f0f3]' />
                <Form onSubmit={handleSubmit}>
                    <div className='relative'>
                        <img src={locationdark} className='absolute opacity-50 ps-[5px] md:ps-[10px] pt-[10px]' alt="" />
                        <Autocomplete
                            className='w-full border rounded-md text_secondary manrope_regular mb-[24px] py-2 px-[2.5rem] md:ps-[2.5rem]'
                            placeholder='Search location'
                            apiKey='AIzaSyBH0Ey-G2PbWkSCLyGG1A9TCg9LDPlzQpc'
                            onPlaceSelected={(place) => {
                                // console.log(place);
                            }}
                        />
                    </div>

                    <div>
                        <div className="mb-[16px] flex max-md:flex-col md:justify-between md:items-center">
                            <span className='inter_semibold text-lg'>Your current location</span>
                            <button className='text-sm inter_regular w-fit p-2' onClick={handleSeeOnMap}>See on the map</button>
                        </div>
                        <div className="border border-white rounded-md mb-3 flex items-center gap-2">
                            <img src={locationdark} alt='' />
                            <h6 className='manrope_semibold mb-0'>{currentLocation}</h6>
                        </div>
                        <div className='mb-3 h-[200px] md:h-[300px] w-full'>
                            <GoogleMapReact
                                bootstrapURLKeys={{ key: 'AIzaSyBYV5W31rEUeTVj2Ws_qJuhMX7IudkRlHw' }}
                                defaultCenter={mapCenter}
                                defaultZoom={18}
                            >
                                <Marker
                                    lat={mapCenter.lat}
                                    lng={mapCenter.lng}
                                />
                            </GoogleMapReact>
                        </div>
                    </div>
                    <div className='flex justify-end w-full'>
                        <button onClick={() => { navigate('/account') }} type='submit' className='w-fit rounded-md bg_dark text_white text-sm p-[8px] md:py-[12px] md:px-[28px] inter_semibold flex justify-center items-center'>Save Changes</button>
                    </div>
                </Form>
            </div>
        </main>
    )
}
export default Location;
const Marker = () => (
    <div style={{
        position: 'absolute',
        width: '15px',
        height: '15px',
        backgroundColor: '#18173C',
        borderRadius: '50%',
        border: '2px solid #fff',
        animation: 'pulse 1.5s infinite',
        textAlign: 'center',
        color: '#fff',
        fontSize: '14px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: 'translate(-50%, -50%)'
    }}>
    </div>
);
