import SignUpForm from '../components/SignUpForm/signUpForm';
import registerpng from '../assets/register.png'; // Import the image

const SignUp = () => {
  return (
    <div 
      className="flex snap-none"
      style={{
        backgroundImage: `url(${registerpng})`, // Correctly setting the background image
        backgroundSize: 'cover', // Make the image cover the entire area
        backgroundPosition: 'center', // Center the background image
        minHeight: '100vh', // Ensure it takes up the full viewport height
      }}
    >
      <div className="relative flex-1 flex justify-center items-center">
        <div>
          <SignUpForm />
        </div>
      </div>
    </div>
  );
};

export default SignUp;
