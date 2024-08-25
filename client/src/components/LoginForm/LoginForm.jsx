import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Link } from 'react-router-dom';

const LoginForm = () => {
  const formRef = useRef(null);
  const signUpRef = useRef(null);

  useEffect(() => {
    // Animate the form scale and opacity
    gsap.fromTo(
      formRef.current,
      { scale: 0.9, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1, ease: 'power3.out' }
    );

    // Animate the shadow to create a moving effect
    gsap.to(
      formRef.current,
      {
        boxShadow: '0px 0px 15px rgba(0, 0, 0, 0.5)',
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      }
    );

    // Animate the Sign Up text with a bounce effect
    gsap.fromTo(
      signUpRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, delay: 1.5, ease: 'bounce.out' }
    );
  }, []);

  return (
    <div
      ref={formRef}
      className="bg-white border-2 border-orange-500 p-8 rounded-lg shadow-lg w-96 mx-auto mt-12"
      style={{
        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.3)',
      }}
    >
      <h2 className="text-2xl font-bold mb-4">Buddy-Fi</h2>
      <p className="text-lg mb-6">Hi Welcome Back, 👋</p>

      <form className="space-y-4">
        <div>
          <label className="block text-sm font-semibold">E-Mail</label>
          <input
            type="email"
            placeholder="Enter Your Email Address..."
            className="w-full border border-gray-300 p-2 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold">Password</label>
          <input
            type="password"
            placeholder="Password"
            className="w-full border border-gray-300 p-2 rounded-md"
          />
        </div>

        <div className="flex justify-between items-center">
          <Link to="/" className="text-orange-500 text-sm">Forgot Your Password?</Link>
          <div className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-sm">Remember Me</span>
          </div>
        </div>

        <Link to="/login">
          <button className="w-full bg-yellow-500 text-white p-2 rounded-md font-bold hover:bg-yellow-600">
            Log-in
          </button>
        </Link>

        <div
          ref={signUpRef}
          className="mt-4 text-center text-sm"
        >
          <p>
            Not registered yet?{' '}
            <Link to="/signup" className="text-blue-500 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
