
import Sidebar from '../components/Sidebar/Sidebar';
import StickyNote from '../components/Stickynote/StickyNote';
import LoginForm from '../components/LoginForm/LoginForm';
import SocialLogin from '../components/SocialLogin/SocialLogin';

const Login = () => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="relative flex-1 flex justify-center items-center bg-yellow-300">
        <StickyNote />
        <div>
          <LoginForm />
          <SocialLogin />
        </div>
      </div>
    </div>
  );
};

export default Login;
