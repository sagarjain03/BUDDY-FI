import AuthLayout from '../components/layout/AuthLayout';
import SignUpForm from '../components/SignUpForm/SignUpForm';
import registerImage from '../assets/register.png';

const SignUp = () => (
  <AuthLayout
    image={registerImage}
    quote="Your people are out there. They just answered the same seven questions."
    quoteAuthor="Join BUDDYFI today."
  >
    <SignUpForm />
  </AuthLayout>
);

export default SignUp;
