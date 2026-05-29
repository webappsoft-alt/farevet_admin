/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import "bootstrap/dist/js/bootstrap.bundle";
import { Suspense, lazy, useEffect, useState } from "react";
import "./App.scss";
import "./components/styles/main.css";
import logofarevet from "./components/assets/svg/farevetlogo.svg";
import Spinner from "./components/Spinner";
import { Route, Routes, useLocation } from "react-router-dom";
import PublicRoutes from "./components/authRoutes/publicRoutes";
import PrivateRoutes from "./components/authRoutes/privateRoutes";
import { useSocket } from "./socket/socketProvider";
import { useSelector } from "react-redux";

const NavHeader = lazy(() => import("./components/header/navHeader"));
const SidebarMenu = lazy(() => import("./components/pages/sidebar"));
const LoginPage1 = lazy(() => import("./components/auth/dynomoLogin1"));
const Dashboard = lazy(() => import("./components/pages/dashboard"));
const Partners = lazy(() => import("./components/pages/partners"));
const Reports = lazy(() => import("./components/pages/reports"));

const Business = lazy(() => import("./components/pages/business"));
const CreateBusiness = lazy(() =>
  import("./components/pages/businessComponents/createBusiness"),
);
const PreviewBusiness = lazy(() =>
  import("./components/pages/businessComponents/previewBusiness"),
);
const ReportedCost = lazy(() => import("./components/pages/reportedCost"));
const CreateReport = lazy(() =>
  import("./components/pages/reportComponents/createReport"),
);
const Application = lazy(() => import("./components/pages/application"));
const Appointments = lazy(() => import("./components/pages/appointment"));
const Deals = lazy(() => import("./components/pages/deals"));
const CreateDeal = lazy(() =>
  import("./components/pages/dealComponents/createDeal"),
);
const Reward = lazy(() => import("./components/pages/rewards/reward"));
const CreateSubservice = lazy(() =>
  import("./components/pages/servicesComponents/createCategory"),
);
const CreateService = lazy(() =>
  import("./components/pages/servicesComponents/createService"),
);
const Services = lazy(() => import("./components/pages/services"));
const UpdateBusiness = lazy(() =>
  import("./components/pages/businessComponents/updateBusiness"),
);
const CreatePetService = lazy(() =>
  import("./components/pages/petServices/createPetService"),
);
const PetService = lazy(() => import("./components/pages/petService"));
const UpdateServiceName = lazy(() =>
  import("./components/pages/servicesComponents/updateServiceName"),
);
const UpdateSubservice = lazy(() =>
  import("./components/pages/servicesComponents/updateSubservice"),
);
const UpdatePetService = lazy(() =>
  import("./components/pages/petServices/updatePetService"),
);
const DealDetail = lazy(() =>
  import("./components/pages/dealComponents/dealDetail"),
);
const UpdateDeal = lazy(() =>
  import("./components/pages/dealComponents/updateDeal"),
);
const ClaimBusiness = lazy(() => import("./components/pages/claimBusiness"));
const IndividualUsers = lazy(() =>
  import("./components/pages/individualUsers"),
);
const Community = lazy(() => import("./components/pages/community"));
const CommunityReports = lazy(() => import("./components/pages/communityReports"));
const Message2 = lazy(() => import("./components/pages/messages/message2"));
const Emergency = lazy(() => import("./components/pages/emergency"));
const Support = lazy(() => import("./components/pages/support"));
const SubAdmin = lazy(() => import("./components/pages/subAdmin"));
const ChangePassword = lazy(() =>
  import("./components/pages/changePassword"),
);
const CommunityMessages = lazy(() =>
  import("./components/pages/communityMessages"),
);
const Vets = lazy(() => import("./components/pages/vets"));
const EditProfile = lazy(() => import("./components/pages/profile"));
const VideoCall = lazy(() => import("./components/pages/videocall"));
const VideoCallModal = lazy(() => import("./components/pages/videoCallModal"));
const PetInsurance = lazy(() => import("./components/pages/petInsurance"));
const CreatePetInsurance = lazy(() =>
  import("./components/pages/petInsuranceComponent/createPetInsurance"),
);
const UpdatePetInsurance = lazy(() =>
  import("./components/pages/petInsuranceComponent/updatePetInsurance"),
);
const VetBills = lazy(() => import("./components/pages/vetBills"));
const UpdateVetBills = lazy(() =>
  import("./components/pages/vetBills/updateVetBills"),
);
const CreateVetBills = lazy(() =>
  import("./components/pages/vetBills/createVetBills"),
);
const Quotes = lazy(() => import("./components/pages/quotes"));
const FundCampaign = lazy(() => import("./components/pages/fundCampaign"));
const ServicesBudget = lazy(() =>
  import("./components/pages/servicesBudget"),
);
const VetPro = lazy(() => import("./components/pages/vetPro"));
const EducationArticles = lazy(() =>
  import("./components/pages/educationArticles"),
);
const MedicationDatabase = lazy(() =>
  import("./components/pages/medicationDatabase"),
);
const MedicationCategories = lazy(() =>
  import("./components/pages/medicationCategories"),
);
const ConciergeRequests = lazy(() =>
  import("./components/pages/conciergeRequests"),
);
const ConciergeRequestDetail = lazy(() =>
  import("./components/pages/conciergeRequestDetail"),
);

const suspenseFallback = (
  <main className="h-screen flex flex-col justify-center items-center">
    <Spinner className="text_primary" size={60} thickness={2} />
    <img src={logofarevet} className="w-[2rem] absolute" alt="" />
  </main>
);

function App() {
  const [toggled, setToggled] = useState(false);
  useSocket();
  const videoCallModal = useSelector(
    (state) => state.videoCall?.videoCallModal,
  );
  const [broken, setBroken] = useState(false);

  const [isLogin, setIsLogin] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const isLoginData = JSON.parse(
      localStorage.getItem("isLogin_farevet_admin") || false,
    );
    setIsLogin(isLoginData);
  }, [pathname]);

  useEffect(() => {
    global.BASEURL = "https://danishgoheer.com/farevet_app/api.php";
    global.IMAGEURL = "https://danishgoheer.com/farevet_app/upload";
  }, []);

  function ScrollToTop() {
    const { pathname: path } = useLocation();
    useEffect(() => {
      window.scrollTo(0, 0);
    }, [path]);

    return null;
  }

  const privateRoutesInner = (
    <>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/partners" element={<Partners />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/business" element={<Business />} />
      <Route path="/claim-business" element={<ClaimBusiness />} />
      <Route path="/individual-users" element={<IndividualUsers />} />
      <Route path="/service-names" element={<Services />} />
      <Route path="/services" element={<PetService />} />
      <Route path="/reported-cost" element={<ReportedCost />} />
      <Route path="/application" element={<Application />} />
      <Route path="/education-articles" element={<EducationArticles />} />
      <Route
        path="/medication/categories"
        element={<MedicationCategories />}
      />
      <Route path="/medication" element={<MedicationDatabase />} />
      <Route path="/concierge-requests" element={<ConciergeRequests />} />
      <Route
        path="/concierge-requests/:id"
        element={<ConciergeRequestDetail />}
      />
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
      <Route
        path="/business/update-business/:businessId"
        element={<UpdateBusiness />}
      />
      <Route
        path="/update-service-name/:serviceNameId"
        element={<UpdateServiceName />}
      />
      <Route
        path="/update-sub-service-name/:subserviceNameId"
        element={<UpdateSubservice />}
      />
      <Route
        path="/services/update-service/:serviceId"
        element={<UpdatePetService />}
      />
      <Route path="/deals/create-deal" element={<CreateDeal />} />
      <Route path="/community" element={<Community />} />
      <Route path="/community-reports" element={<CommunityReports />} />
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
      <Route
        path="/service-names/create-subservice"
        element={<CreateSubservice />}
      />
    </>
  );

  const privateRoutesInnerCompact = (
    <>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/partners" element={<Partners />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/business" element={<Business />} />
      <Route path="/claim-business" element={<ClaimBusiness />} />
      <Route path="/individual-users" element={<IndividualUsers />} />
      <Route path="/service-names" element={<Services />} />
      <Route path="/services" element={<PetService />} />
      <Route path="/reported-cost" element={<ReportedCost />} />
      <Route path="/application" element={<Application />} />
      <Route path="/education-articles" element={<EducationArticles />} />
      <Route
        path="/medication/categories"
        element={<MedicationCategories />}
      />
      <Route path="/medication" element={<MedicationDatabase />} />
      <Route path="/concierge-requests" element={<ConciergeRequests />} />
      <Route
        path="/concierge-requests/:id"
        element={<ConciergeRequestDetail />}
      />
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
      <Route
        path="/business/update-business/:businessId"
        element={<UpdateBusiness />}
      />
      <Route
        path="/update-service-name/:serviceNameId"
        element={<UpdateServiceName />}
      />
      <Route
        path="/update-sub-service-name/:subserviceNameId"
        element={<UpdateSubservice />}
      />
      <Route
        path="/services/update-service/:serviceId"
        element={<UpdatePetService />}
      />
      <Route path="/deals/create-deal" element={<CreateDeal />} />
      <Route path="/community" element={<Community />} />
      <Route path="/community-reports" element={<CommunityReports />} />
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
      <Route
        path="/service-names/create-subservice"
        element={<CreateSubservice />}
      />
    </>
  );

  return (
    <>
      {pathname !== "/video-call" ? (
        <SidebarMenu
          toggled={toggled}
          setBroken={setBroken}
          broken={broken}
          setToggled={setToggled}
        >
          {isLogin && (
            <NavHeader
              toggled={toggled}
              setBroken={setBroken}
              broken={broken}
              setToggled={setToggled}
            />
          )}
          <Suspense fallback={suspenseFallback}>
            <ScrollToTop />
            <Routes>
              <Route element={<PublicRoutes />}>
                <Route index element={<LoginPage1 />} />
                <Route path="/login" element={<LoginPage1 />} />
              </Route>
              <Route element={<PrivateRoutes />}>{privateRoutesInner}</Route>
            </Routes>
          </Suspense>
        </SidebarMenu>
      ) : (
        <Suspense fallback={suspenseFallback}>
          <ScrollToTop />
          <Routes>
            <Route element={<PublicRoutes />}>
              <Route index element={<LoginPage1 />} />
              <Route path="/login" element={<LoginPage1 />} />
            </Route>
            <Route element={<PrivateRoutes />}>
              {privateRoutesInnerCompact}
            </Route>
          </Routes>
        </Suspense>
      )}

      {videoCallModal ? (
        <Suspense fallback={null}>
          <VideoCallModal isVisible={videoCallModal} />
        </Suspense>
      ) : null}
    </>
  );
}
export default App;
