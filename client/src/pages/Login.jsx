import AuthLayout from '../components/layout/AuthLayout';
import LoginForm from '../components/LoginForm/LoginForm';
import loginBack from '../assets/login-back.jpg';

const Login = () => (
  <AuthLayout
    image={loginBack}
    quote="The best friendships start with one honest answer."
    quoteAuthor="Seven questions. That is the whole signup."
  >
    <LoginForm />
  </AuthLayout>
);

export default Login;
