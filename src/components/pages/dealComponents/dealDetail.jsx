// DealDetail.js
import { Form } from 'antd';
import React from 'react';
import { ArrowLeft, Calendar, Code, Globe, PhoneCall } from 'react-feather';
import { IoLocationOutline } from 'react-icons/io5';
import { MdDiscount, MdPets } from 'react-icons/md';
import { useLocation, useNavigate } from 'react-router-dom';

const DealDetail = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const dealDetail = state?.dealDetail || null;

  const handleSubmit = (e) => {
  };

  const handleUpdate = () => {
    navigate(`/deals/update-deal/${dealDetail?.id}`, { state: { dealDetail: dealDetail } });
  };

  const renderDealContent = () => {
    if (dealDetail?.deal_type === "other") {
      return (
        <>
          <div className="flex my-3 flex-col gap-3 w-full">
            <div className="flex items-center gap-4">
              <div className="rounded-full text_primary p-3" style={{ backgroundColor: '#e5cfff' }}>
                <Calendar size={24} className='' />
              </div>
              <div className="flex flex-col items-start">
                <h6 className="text_black mb-0 inter_semibold">Validate Until:</h6>
                <span className="text_dark text-sm inter_medium">{dealDetail?.expiry_date}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-full text_primary p-3" style={{ backgroundColor: '#e5cfff' }}>
                <MdDiscount size={24} className='' />
              </div>
              <div className="flex flex-col items-start">
                <h6 className="text_black mb-0 inter_semibold">Discount:</h6>
                <span className="text_dark text-sm inter_medium">{dealDetail?.discount} %</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-full text_primary p-3" style={{ backgroundColor: '#cfdcff', color: '#405fb3' }}>
                <Code size={24} className='' />
              </div>
              <div className="flex flex-col items-start">
                <h6 className="text_black mb-0 inter_semibold">Promo Code:</h6>
                <span className="text_dark text-sm inter_medium">{dealDetail?.promo_code}</span>
              </div>
            </div>
            {dealDetail?.website_link && (
              <div className="flex items-center gap-4">
                <div className="rounded-full text_primary p-3" style={{ backgroundColor: '#cfdcff', color: '#405fb3' }}>
                  <Globe size={24} className='' />
                </div>
                <div className="flex flex-col items-start">
                  <h6 className="text_black mb-0 inter_semibold">Website:</h6>
                  <a href={dealDetail?.website_link} target="_blank" rel="noopener noreferrer" className="text_dark text-sm inter_medium">{dealDetail?.website_link}</a>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col mb-3 items-start">
            <h5 className='text_black inter_semibold'>Note</h5>
            <span className="text_dark inter_regular">{dealDetail?.description}</span>
          </div>
          {dealDetail?.business_name && (
            <div className="flex flex-col my-4 items-start">
              <h5 className='text_black inter_semibold'>Business Name:</h5>
              <span className="text_dark inter_medium">{dealDetail?.business_name}</span>
            </div>
          )}
        </>
      );
    }

    return (
      <>
        <div className="flex my-3 flex-col gap-3 w-full">
          <div className="flex items-center gap-4">
            <div className="rounded-full text_primary p-3" style={{ backgroundColor: '#e5cfff' }}>
              <Calendar size={24} className='' />
            </div>
            <div className="flex flex-col items-start">
              <h6 className="text_black mb-0 inter_semibold">Validate Until:</h6>
              <span className="text_dark text-sm inter_medium">{dealDetail?.expiry_date}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-full text_primary p-3" style={{ backgroundColor: '#e5cfff' }}>
              <MdDiscount size={24} className='' />
            </div>
            <div className="flex flex-col items-start">
              <h6 className="text_black mb-0 inter_semibold">Discount:</h6>
              <span className="text_dark text-sm inter_medium">{dealDetail?.discount} %</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-full text_primary p-3" style={{ backgroundColor: '#cfdcff', color: '#405fb3' }}>
              <Code size={24} className='' />
            </div>
            <div className="flex flex-col items-start">
              <h6 className="text_black mb-0 inter_semibold">Promo Code:</h6>
              <span className="text_dark text-sm inter_medium">{dealDetail?.promo_code} </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col mb-3 items-start">
          <h5 className='text_black inter_semibold'>Note</h5>
          <span className="text_dark inter_regular">{dealDetail?.description}</span>
        </div>
        <div className="flex flex-col items-start">
          <h5 className='text_black inter_semibold'>Services that are includes:</h5>
          <div className="flex items-center flex-wrap gap-2">
            {dealDetail?.deal_services?.map((service, index) => (
              <div key={index} className="border px-3 py-2 rounded-full bg_white">
                <span className="text_black">{service?.service_name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col my-4 items-start">
          <h5 className='text_black inter_semibold'>Store Details:</h5>
          <div className="flex my-3 flex-col gap-3 w-full">
            <div className="flex items-center gap-4">
              <div className="rounded-full text_primary p-3" style={{ backgroundColor: '#cfdcff', color: '#405fb3' }}>
                <MdPets size={24} className='' />
              </div>
              <div className="flex flex-col items-start">
                <h6 className="text_dark inter_medium">{dealDetail?.business?.name}</h6>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-full text_white p-3 text-[#e7e74d]" style={{ backgroundColor: '#e7e74d' }}>
                <IoLocationOutline size={24} className='' />
              </div>
              <div className="flex flex-col items-start">
                <h6 className="text_dark inter_medium">{dealDetail?.business?.address}</h6>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-full bg_primary text_white p-3">
                <PhoneCall className='' />
              </div>
              <div className="flex flex-col items-start">
                <h6 className="text_dark inter_medium">{dealDetail?.business?.phone} </h6>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <main className='container m-auto min-h-screen py-4'>
      <div className="flex justify-between flex-wrap gap-3 items-center mb-4">
        <div className="flex items-center gap-3">
          <button type='button' onClick={() => { navigate(-1) }} className="flex items-center justify-center w-[36px] h-[36px] bg_primary rounded-lg">
            <ArrowLeft className='text_white' />
          </button>
          <span className="inter_semibold text-xl md:text-2xl text_dark">Deal Detail</span>
        </div>
        <button onClick={() => handleUpdate(dealDetail)} type='button' className="flex justify-center bg_primary py-[12px] px-[1rem] rounded-lg items-center button_shadow">
          <span className="inter_semibold text-sm text_white">Edit Deal</span>
        </button>
      </div>
      <Form layout='verticle' onFinish={handleSubmit} className="w-full lg:w-[90%] xl:w-[80%] m-auto bg_white rounded-lg shadow-md p-[1rem] md:p-[2rem]">
        <h1 className="inter_medium text-2xl text_black">Deal Info</h1>
        {renderDealContent()}
      </Form>
    </main>
  );
};

export default DealDetail;