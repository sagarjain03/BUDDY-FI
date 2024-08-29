

import LoginForm from '../components/LoginForm/LoginForm';
import SocialLogin from '../components/SocialLogin/SocialLogin';

const Login = () => {
  return (
    <div className="flex">
     
      <div className="relative flex-1 flex justify-center items-center ">
        
        <div>
          <LoginForm />
          <SocialLogin />
        </div>
      </div>
    </div>
  );
};

export default Login;
