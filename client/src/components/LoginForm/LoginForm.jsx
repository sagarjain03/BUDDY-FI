import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons';

const LoginForm = () => {
  const formRef = useRef(null);
  const signUpRef = useRef(null);
  const iconsRef = useRef(null);
  const navigate = useNavigate();

  // State for handling form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Animate the form scale and opacity
    gsap.fromTo(
      formRef.current,
      { scale: 0.9, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1, ease: 'power3.out' }
    );

    // Animate the shadow to create a moving effect
    gsap.to(formRef.current, {
      boxShadow: '0px 0px 15px rgba(0, 0, 0, 0.5)',
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    // Animate the Sign Up text with a bounce effect
    gsap.fromTo(
      signUpRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, delay: 1.5, ease: 'bounce.out' }
    );

    // Animate the social icons
    gsap.fromTo(
      iconsRef.current.children,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.3,
        ease: 'power3.out'
      }
    );
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token); // Save token
        setSuccess('Login successful!');
        alert('Login successful!');
        navigate('/welcome'); // Redirect to /welcome after successful login
      } else {
        setError(data.message || 'Failed to log in');
      }
    } catch (error) {
      setError('There was an error logging in. Please try again.');
    }
  };

  return (
    <div
      ref={formRef}
      className="border-gray-500 border-2 bg-transparent bg-opacity-20 backdrop-blur-sm p-8 rounded-lg shadow-lg w-96 mx-auto relative"
      style={{
        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.3)',
      }}
    >
      <h2 className="text-2xl font-bold mb-4 text-white">Buddy-Fi</h2>
      <p className="text-lg mb-6 text-white">Hi, Welcome Back 👋</p>

      {/* Display success or error message */}
      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-semibold text-white">E-Mail</label>
          <input
            type="email"
            placeholder="Enter Your Email Address..."
            className="w-full placeholder-gray-600 border border-gray-300 p-2 rounded-md"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-white">Password</label>
          <input
            type="password"
            placeholder="Password"
            className="w-full placeholder-gray-600 border border-gray-300 p-2 rounded-md"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="flex justify-between items-center">
          <Link to="/" className="text-orange-500 text-sm">Forgot Your Password?</Link>
          <div className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-sm text-white">Remember Me</span>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-yellow-500 text-white p-2 rounded-md font-bold hover:bg-yellow-600"
        >
          Log-in
        </button>

        <div ref={signUpRef} className="mt-4 text-center text-sm">
          <p className="text-white">
            Not registered yet?{' '}
            <Link to="/register" className="text-blue-500 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm mb-4">Or</p>
          <div
            ref={iconsRef}
            className="flex justify-center space-x-4"
          >
            <FontAwesomeIcon icon={faGoogle} size="2x" className="text-red-600 cursor-pointer" />
            <FontAwesomeIcon icon={faFacebook} size="2x" className="text-blue-600 cursor-pointer" />
            <FontAwesomeIcon icon={faInstagram} size="2x" className="text-pink-600 cursor-pointer" />
          </div>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
