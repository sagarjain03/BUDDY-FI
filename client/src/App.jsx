// import QuestionPage from "./components/Questionpage/QuestionPage";
import Chat from "./pages/Chat";
import Home from "./pages/Home";
import Location from "./pages/Location";
import Login from "./pages/Login";
import QuestionForm from "./pages/QuestionForm";
import ShowUsers from "./pages/ShowUsers";
import SignUp from "./pages/SignUp";
import UserProfile from "./pages/UserProfile";
import Welcome from "./pages/Welcome"
import { createBrowserRouter, RouterProvider } from "react-router-dom";
// import Welcome from "./pages/Welcome";
// import "./style.css"
const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <SignUp />,
  },
  {
    path: "/submit-answer",
    element: <QuestionForm/>
  },
  {
    path: "/welcome",
    element: <Welcome/>
  }
]);

const App = () => {
  return (
    <div>
      <RouterProvider router={router} />
    {/* <Welcome/> */}
      {/* <QuestionForm/> */}
      {/* <Location/> */}
      {/* <Chat/> */}
      {/* <ShowUsers/> */}
      {/* <UserProfile/> */}


   
    </div>
  );
};

export default App;
