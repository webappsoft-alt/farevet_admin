/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import "bootstrap/dist/js/bootstrap.bundle";
import { Suspense, lazy, useEffect, useState } from 'react';
import './App.scss';
import './components/styles/main.css'
import { logofarevet } from './components/icons/icon';
import { CircularProgress } from "@mui/material"
import { Route, Routes, useLocation, useParams } from 'react-router-dom';
import PublicRoutes from "./components/authRoutes/publicRoutes";
import PrivateRoutes from "./components/authRoutes/privateRoutes";
import Business from "./components/pages/business";
import CreateBusiness from "./components/pages/businessComponents/createBusiness";
import PreviewBusiness from "./components/pages/businessComponents/previewBusiness";
import ReportedCost from "./components/pages/reportedCost";
import CreateReport from "./components/pages/reportComponents/createReport";
import Application from "./components/pages/application";
import Appointments from "./components/pages/appointment";
import Deals from "./components/pages/deals";
import CreateDeal from "./components/pages/dealComponents/createDeal";
import Reward from "./components/pages/rewards/reward";
import CreateSubservice from "./components/pages/servicesComponents/createCategory";
import CreateService from "./components/pages/servicesComponents/createService";
import Services from "./components/pages/services";
import UpdateBusiness from "./components/pages/businessComponents/updateBusiness";
import CreatePetService from "./components/pages/petServices/createPetService";
import PetService from "./components/pages/petService";
import UpdateServiceName from "./components/pages/servicesComponents/updateServiceName";
import UpdateSubservice from "./components/pages/servicesComponents/updateSubservice";
import UpdatePetService from "./components/pages/petServices/updatePetService";
import DealDetail from "./components/pages/dealComponents/dealDetail";
import UpdateDeal from "./components/pages/dealComponents/updateDeal";
import { pdfjs } from "react-pdf";
import ClaimBusiness from "./components/pages/claimBusiness";
import IndividualUsers from "./components/pages/individualUsers";
import Community from "./components/pages/community";
import Message2 from "./components/pages/messages/message2";
import Emergency from "./components/pages/emergency";
import Support from "./components/pages/support";
import SubAdmin from "./components/pages/subAdmin";
import ChangePassword from "./components/pages/changePassword";
import CommunityMessages from "./components/pages/communityMessages";
import Vets from "./components/pages/vets";
import EditProfile from "./components/pages/profile";
import VideoCall from "./components/pages/videocall";
import VideoCallModal from "./components/pages/videoCallModal";
import { useSocket } from "./socket/socketProvider";
import { useDispatch, useSelector } from "react-redux";
import PetInsurance from "./components/pages/petInsurance";
import CreatePetInsurance from "./components/pages/petInsuranceComponent/createPetInsurance";
import UpdatePetInsurance from "./components/pages/petInsuranceComponent/updatePetInsurance";
import VetBills from "./components/pages/vetBills";
import UpdateVetBills from "./components/pages/vetBills/updateVetBills";
import CreateVetBills from "./components/pages/vetBills/createVetBills";
import Quotes from "./components/pages/quotes";
import FundCampaign from "./components/pages/fundCampaign";
import ServicesBudget from "./components/pages/servicesBudget";
import VetPro from "./components/pages/vetPro";
import { apiRequest } from "./api/auth_api";
import { setChatCount } from "./redux/videoCall";

const NavHeader = lazy(() => import('./components/header/navHeader'));
const SidebarMenu = lazy(() => import('./components/pages/sidebar'));
const LoginPage1 = lazy(() => import('./components/auth/dynomoLogin1'));
const Dashboard = lazy(() => import('./components/pages/dashboard'));

function App() {
  const [toggled, setToggled] = useState(false);
  const socket = useSocket()
  const { type } = useParams();
  const videoCallModal = useSelector((state) => state.videoCall?.videoCallModal);
  const [broken, setBroken] = useState(false);

  const [isLogin, setIsLogin] = useState(false);
  const { pathname } = useLocation();

  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url,
  ).toString();
  useEffect(() => {
    const isLoginData = JSON.parse(localStorage.getItem("isLogin_farevet_admin") || false);
    setIsLogin(isLoginData)
  }, [pathname]);

  // useEffect(() => {
  //   if (socket) {
  //     socket.on('start_call', (call) => {
  //       console.log('Connected to the server', call);
  //     });
  //     console.log('socket call');

  //   }
  // }, [socket])

  useEffect(() => {
    global.BASEURL = 'https://danishgoheer.com/farevet_app/api.php'
    global.IMAGEURL = 'https://danishgoheer.com/farevet_app/upload'
  }, [])


  function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
      window.scrollTo(0, 0);
    }, [pathname]);

    return null;
  }

  return (
    <>
      {pathname !== '/video-call' ? <SidebarMenu toggled={toggled} setBroken={setBroken} broken={broken} setToggled={setToggled}>
        {isLogin && <NavHeader toggled={toggled} setBroken={setBroken} broken={broken} setToggled={setToggled} />}
        <Suspense fallback={
          <main className='h-screen flex flex-col justify-center items-center'>
            <CircularProgress className='text_primary' size={60} thickness={2} />
            <img src={logofarevet} className='w-[2rem] absolute' alt="" />
          </main>
        }>
          <ScrollToTop />
          <Routes>
            <Route element={<PublicRoutes />} >
              <Route index element={<LoginPage1 />}></Route>
              <Route path='/login' element={<LoginPage1 />}></Route>
            </Route>
            <Route element={<PrivateRoutes />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/business" element={<Business />} />
              <Route path="/claim-business" element={<ClaimBusiness />} />
              <Route path="/individual-users" element={<IndividualUsers />} />
              <Route path="/service-names" element={<Services />} />
              <Route path="/services" element={<PetService />} />
              <Route path="/reported-cost" element={<ReportedCost />} />
              <Route path="/application" element={<Application />} />
              <Route path="/vet-bills/:type" element={<VetBills />} />
              <Route path="/vet-bills/update/:type/:id" element={<UpdateVetBills />} />
              <Route path="/vet-bills/create/:type" element={<CreateVetBills />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/deals" element={<Deals />} />
              <Route path="/pet-insurance" element={<PetInsurance />} />
              <Route path="/pet-insurance/update" element={<UpdatePetInsurance />} />
              <Route path="/pet-insurance/create" element={<CreatePetInsurance />} />
              <Route path="/reward" element={<Reward />} />
              <Route path="/quotes" element={<Quotes />} />
              <Route path="/fund_campaign" element={<FundCampaign />} />
              <Route path="/pet_services_budget" element={<ServicesBudget />} />
              <Route path="/sub-admin" element={<SubAdmin />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/chat" element={<Message2 />} />
              <Route path="/business/create-business" element={<CreateBusiness />} />
              <Route path="/deals/:id" element={<DealDetail />} />
              <Route path="/deals/update-deal/:dealId" element={<UpdateDeal />} />
              <Route path="/services/create-service" element={<CreatePetService />} />
              <Route path="/business/update-business/:businessId" element={<UpdateBusiness />} />
              <Route path="/update-service-name/:serviceNameId" element={<UpdateServiceName />} />
              <Route path="/update-sub-service-name/:subserviceNameId" element={<UpdateSubservice />} />
              <Route path="/services/update-service/:serviceId" element={<UpdatePetService />} />
              <Route path="/deals/create-deal" element={<CreateDeal />} />
              <Route path="/community" element={<Community />} />
              <Route path="/messge-community" element={<CommunityMessages />} />
              <Route path="/emergency" element={<Emergency />} />
              <Route path="/support" element={<Support />} />
              <Route path="/profile" element={<EditProfile />} />
              <Route path="/vets" element={<Vets />} />
              <Route path="/vet-pro" element={<VetPro />} />
              <Route path="/video-call" element={<VideoCall />} />
              <Route path="/business/:id" element={<PreviewBusiness />} />
              <Route path="/service-names/create-service" element={<CreateService />} />
              <Route path="/reported-cost/create-report" element={<CreateReport />} />
              <Route path="/service-names/create-subservice" element={<CreateSubservice />} />
            </Route>
          </Routes>
        </Suspense>
      </SidebarMenu> :
        <Suspense fallback={
          <main className='h-screen flex flex-col justify-center items-center'>
            <CircularProgress className='text_primary' size={60} thickness={2} />
            <img src={logofarevet} className='w-[2rem] absolute' alt="" />
          </main>
        }>
          <ScrollToTop />
          <Routes>
            <Route element={<PublicRoutes />} >
              <Route index element={<LoginPage1 />}></Route>
              <Route path='/login' element={<LoginPage1 />}></Route>
            </Route>
            <Route element={<PrivateRoutes />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/business" element={<Business />} />
              <Route path="/claim-business" element={<ClaimBusiness />} />
              <Route path="/individual-users" element={<IndividualUsers />} />
              <Route path="/service-names" element={<Services />} />
              <Route path="/services" element={<PetService />} />
              <Route path="/reported-cost" element={<ReportedCost />} />
              <Route path="/application" element={<Application />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/deals" element={<Deals />} />
              <Route path="/reward" element={<Reward />} />
              <Route path="/sub-admin" element={<SubAdmin />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/chat" element={<Message2 />} />
              <Route path="/business/create-business" element={<CreateBusiness />} />
              <Route path="/deals/:id" element={<DealDetail />} />
              <Route path="/deals/update-deal/:dealId" element={<UpdateDeal />} />
              <Route path="/services/create-service" element={<CreatePetService />} />
              <Route path="/business/update-business/:businessId" element={<UpdateBusiness />} />
              <Route path="/update-service-name/:serviceNameId" element={<UpdateServiceName />} />
              <Route path="/update-sub-service-name/:subserviceNameId" element={<UpdateSubservice />} />
              <Route path="/services/update-service/:serviceId" element={<UpdatePetService />} />
              <Route path="/deals/create-deal" element={<CreateDeal />} />
              <Route path="/community" element={<Community />} />
              <Route path="/messge-community" element={<CommunityMessages />} />
              <Route path="/emergency" element={<Emergency />} />
              <Route path="/support" element={<Support />} />
              <Route path="/profile" element={<EditProfile />} />
              <Route path="/vets" element={<Vets />} />
              <Route path="/vet-pro" element={<VetPro />} />
              <Route path="/video-call" element={<VideoCall />} />
              <Route path="/business/:id" element={<PreviewBusiness />} />
              <Route path="/service-names/create-service" element={<CreateService />} />
              <Route path="/reported-cost/create-report" element={<CreateReport />} />
              <Route path="/service-names/create-subservice" element={<CreateSubservice />} />
            </Route>
          </Routes>
        </Suspense>}

      <VideoCallModal isVisible={videoCallModal} />
    </>
  );
}
export default App;
