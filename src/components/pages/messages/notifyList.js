/* eslint-disable no-unused-vars */
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
// import { updateNotify } from '../../Api/instructor.js/notifyUser';

const NotifyList = ({ name, discrip, courseName, img, time, date, id, status, setNotifyCheck }) => {
    const [expanded, setExpanded] = useState(false);

    const toggleExpanded = () => {
        setExpanded(!expanded);
    };

    const getDescriptionClass = () => {
        if (expanded) {
            return 'chat_detail4 fs_08 expanded';
        } else {
            return 'chat_detail3 fs_08';
        }
    };
    const updateData = (newStatus) => {
        // if (status === "Active") {
        //     updateNotify(id, newStatus)
        //         .then((result) => {
        //             if (result.data.result) {
        //                 setNotifyCheck(result.data.result)
        //             }
        //         }).catch((err) => {
        //             console.log(err)
        //         });
        // }
    }

    return (
        <div className='mb-3 px-2'>
            <Link to={""} className="_link_ notify_link  ">
                <div className="d-flex align-items-top mx-auto px-2 py-2 notify w_lg_80" onClick={() => updateData("Inactive")}>
                    <div className="bg_primary rounded-circle p-2 position-relative" style={{ width: "3rem", height: "3rem" }}>
                        <img src={img} alt="" className="chat_profile_img2" />
                        {status === "Active" &&
                            (<span className='noti_badges2'></span>)}
                    </div>

                    <div className="d-flex justify-content-between w-100 pe-2" >
                        <div className="ps-3 pt-1">
                            <h4 className="fs_09 sk_modernist_regular mb-1 mt-0">
                                {`${name} (${courseName})`}
                            </h4>
                            <div>
                                <span className={getDescriptionClass()}>{discrip}</span>
                                {discrip?.length > 80 && (
                                    <span onClick={toggleExpanded} className='seeMore'>
                                        {expanded ? 'See Less' : 'See More'}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div>
                            <h6 className="chat_detail fs_08 pt-1" style={{ whiteSpace: "nowrap" }} >
                                {date}
                                <br />
                                {time}
                            </h6>
                        </div>
                    </div>
                </div>
            </Link >
        </div >
    )
}

export default NotifyList