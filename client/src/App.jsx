import { Suspense, lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import PageTransition from "./components/motion/PageTransition";

/*
 * Everything past the front door is loaded on demand. The Welcome page alone
 * pulls in three.js, which is most of the bundle — nobody should download that
 * just to read the landing page.
 */
const QuestionForm = lazy(() => import("./pages/QuestionForm"));
const Welcome = lazy(() => import("./pages/Welcome"));
const ShowUsers = lazy(() => import("./pages/ShowUsers"));
const MatchDetail = lazy(() => import("./pages/MatchDetail"));
const Buddies = lazy(() => import("./pages/Buddies"));
const Chat = lazy(() => import("./pages/Chat"));
const Location = lazy(() => import("./pages/Location"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const BlockedList = lazy(() => import("./pages/BlockedList"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const Notifications = lazy(() => import("./pages/Notifications"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Privacy = lazy(() => import("./pages/Legal").then((m) => ({ default: m.Privacy })));
const Terms = lazy(() => import("./pages/Legal").then((m) => ({ default: m.Terms })));
const Guidelines = lazy(() =>
  import("./pages/Legal").then((m) => ({ default: m.Guidelines }))
);

/** Shown while a route's chunk is fetched. Deliberately quiet. */
const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-ink-50">
    <div className="skeleton h-10 w-10 rounded-full" />
  </div>
);

const page = (element) => (
  <Suspense fallback={<RouteFallback />}>
    <PageTransition>{element}</PageTransition>
  </Suspense>
);
const protect = (element) => <ProtectedRoute>{page(element)}</ProtectedRoute>;

const router = createBrowserRouter([
  { path: "/", element: page(<Home />) },
  { path: "/login", element: page(<Login />) },
  { path: "/register", element: page(<SignUp />) },
  { path: "/forgot-password", element: page(<ForgotPassword />) },
  { path: "/reset-password/:token", element: page(<ResetPassword />) },
  { path: "/verify-email/:token", element: page(<VerifyEmail />) },
  { path: "/submit-answer", element: protect(<QuestionForm />) },
  { path: "/welcome", element: protect(<Welcome />) },
  { path: "/show-users", element: protect(<ShowUsers />) },
  { path: "/discover/:id", element: protect(<MatchDetail />) },
  { path: "/buddies", element: protect(<Buddies />) },
  { path: "/chat", element: protect(<Chat />) },
  { path: "/chat/:conversationId", element: protect(<Chat />) },
  { path: "/location", element: protect(<Location />) },
  { path: "/profile", element: protect(<UserProfile />) },
  { path: "/profile/edit", element: protect(<EditProfile />) },
  { path: "/profile/blocked", element: protect(<BlockedList />) },
  { path: "/admin/reports", element: protect(<AdminReports />) },
  { path: "/notifications", element: protect(<Notifications />) },
  { path: "/settings/notifications", element: protect(<NotificationSettings />) },
  { path: "/privacy", element: page(<Privacy />) },
  { path: "/terms", element: page(<Terms />) },
  { path: "/guidelines", element: page(<Guidelines />) },
  { path: "*", element: page(<Home />) },
]);

const App = () => <RouterProvider router={router} />;

export default App;
