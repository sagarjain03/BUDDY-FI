import Sidebar from '../components/Sidebar/Sidebar';
import StickyNote from '../components/Stickynote/StickyNote';
import LoginForm from '../components/LoginForm/LoginForm';
import SocialLogin from '../components/SocialLogin/SocialLogin';

const Login = () => {
  return (
    <div className="flex">
      <Sidebar text="LOG-IN"/>
      <div className="relative flex-1 flex justify-center items-center bg-yellow-300">
        <StickyNote 
          text={
            <>
              Kuch Logon Ke Saath <br />
              Rehne Se Hi Sab Theek <br />
              Ho Jata Hai - Aditi
            </>
          }
          positionNote="top-0 left-20" 
          positionArrow="bottom-64 left-52" 
          positionText="top-20 left-36" 
          hide2="hidden"
        />
        <div>
          <LoginForm />
          <SocialLogin />
        </div>
      </div>
    </div>
  );
};

export default Login;
