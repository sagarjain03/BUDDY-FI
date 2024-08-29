import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGoogle, FaFacebookF, FaInstagram } from 'react-icons/fa';
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';
import gsap from 'gsap';
import axios from 'axios';

const SignUpForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState(null);
  const [responseError, setResponseError] = useState(null); // Store error response from API
  const navigate = useNavigate();

  const formRef = useRef(null);
  const buttonRef = useRef(null);
  const inputRefs = useRef([]);

  useEffect(() => {
    gsap.fromTo(
      formRef.current,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 1, ease: 'bounce.out' }
    );
    gsap.fromTo(
      inputRefs.current,
      { x: -200, opacity: 0 },
      { x: 0, opacity: 1, stagger: 0.2, duration: 0.8, ease: 'power3.out' }
    );
    gsap.to(buttonRef.current, {
      scale: 1.05,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
      duration: 0.4,
    });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', formData);
      console.log(response.data); // Check API response
      navigate('/login');
    } catch (err) {
      console.error('Error response:', err.response?.data || err.message);
      setResponseError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div
      ref={formRef}
      className="bg-white border-2 border-orange-500 p-8 rounded-lg shadow-lg w-96 mx-auto mt-12 relative"
    >
      <h2 className="text-2xl font-bold mb-1">Buddy-Fi</h2>
      <p className="text-lg text-yellow-500 mb-6">
        <span className="font-bold text-black">MUCHO GUSTO</span>
        <span role="img" aria-label="emoji">😃</span>
        - Create Your Account
      </p>

      {error && <p className="text-red-500 mb-4">{error}</p>} {/* Display validation error */}
      {responseError && <p className="text-red-500 mb-4">{responseError}</p>} {/* Display API error */}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-semibold">Name</label>
          <input
            ref={(el) => (inputRefs.current[0] = el)}
            type="text"
            name="name"
            placeholder="Enter Your Name"
            className="w-full border-2 border-yellow-400 p-2 rounded-md"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold">Email</label>
          <input
            ref={(el) => (inputRefs.current[1] = el)}
            type="email"
            name="email"
            placeholder="Enter Your Email Address"
            className="w-full border-2 border-yellow-400 p-2 rounded-md"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold">Age</label>
          <input
            ref={(el) => (inputRefs.current[2] = el)}
            type="number"
            name="age"
            placeholder="Enter Your Age"
            className="w-full border-2 border-yellow-400 p-2 rounded-md"
            value={formData.age}
            onChange={handleChange}
            required
          />
        </div>

        <div className="relative">
          <label className="block text-sm font-semibold">Password</label>
          <input
            ref={(el) => (inputRefs.current[3] = el)}
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Password"
            className="w-full border-2 border-yellow-400 p-2 rounded-md"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <div
            className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <AiFillEye /> : <AiFillEyeInvisible />}
          </div>
        </div>
        <div className="relative">
          <label className="block text-sm font-semibold">Confirm Password</label>
          <input
            ref={(el) => (inputRefs.current[4] = el)}
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            placeholder="Confirm Password"
            className="w-full border-2 border-yellow-400 p-2 rounded-md"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          <div
            className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <AiFillEye /> : <AiFillEyeInvisible />}
          </div>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <label>
            <input type="checkbox" className="mr-2" required />
            Terms And Conditions
          </label>
          <label>
            <input type="checkbox" className="mr-2" required />
            Privacy Policy
          </label>
        </div>

        <button
          ref={buttonRef}
          type="submit"
          className="w-full bg-yellow-500 text-white p-2 rounded-md font-bold hover:bg-yellow-600"
        >
          Sign-Up
        </button>
      </form>

      <div className="text-center text-sm mt-4">
        <p>Or Register with</p>
        <div className="flex justify-center space-x-4 mt-2">
          <button className="text-blue-500">
            <FaGoogle size={24} />
          </button>
          <button className="text-blue-500">
            <FaFacebookF size={24} />
          </button>
          <button className="text-pink-500">
            <FaInstagram size={24} />
          </button>
        </div>
        <p className="mt-4">
          Already Have An Account?{' '}
          <Link to="/login" className="text-blue-500 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpForm;
