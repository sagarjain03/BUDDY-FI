

import LoginForm from '../components/LoginForm/LoginForm';
import SocialLogin from '../components/SocialLogin/SocialLogin';

const Login = () => {
  return (
    <div className="min-h-screen overflow-hidden flex flex-col"
    style={{
      backgroundImage: "url('/src/assets/login-back.jpg')", // Set background image
      backgroundSize: 'cover', // Make the image cover the entire area
      backgroundPosition: 'center', // Center the background image
      
    }}
    >
     
      <div className="relative flex-1 flex justify-center items-center ">
        
        <div>
          <LoginForm />
          {/* <SocialLogin /> */}
        </div>
      </div>
    </div>
  );
};

export default Login;
