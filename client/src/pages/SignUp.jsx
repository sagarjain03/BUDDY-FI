
import Sidebar from '../components/Sidebar/Sidebar';
import StickyNote from '../components/Stickynote/StickyNote';
import SignUpForm from '../components/SignUpForm/signUpForm';

const SignUp = () => {
  return (
    <div className="flex">
      <Sidebar text="Sign-up"/>
      <div className="relative flex-1 flex justify-center items-center bg-yellow-300">
        <StickyNote text={
            <>
              DOST FAIL HO JAYE <br />
TOH DUKH HOTA HAI ... <br />
LEKIN DOST FIRST AA <br />
JAYE TOH ZYAADA DUKH <br />
HOTA HAI.🥲-Farahan <br />
            </>
          } positionNote="top-28 left-0" positionArrow="top-0 left-52" positionText="top-48 left-16" hide="hidden" />
        <div>
          <SignUpForm/>
       
        </div>
      </div>
    </div>
  );
};

export default SignUp;
