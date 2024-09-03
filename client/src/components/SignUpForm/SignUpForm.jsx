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
    gender: '', // Added gender to the form data
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
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        name: formData.name,
        email: formData.email,
        age: formData.age,
        password: formData.password,
        confirmPassword: formData.confirmPassword, 
        gender: formData.gender,
      });
  
      console.log(response.data);
  
      // Store the email in local storage
      localStorage.setItem('registeredEmail', formData.email);
  
      // Navigate to the next page after successful registration
      navigate('/submit-answer');
    } catch (err) {
      console.error('Error response:', err.response?.data || err.message);
      setResponseError(err.response?.data?.message || 'Registration failed');
    }
  };
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent relative">
      <div
        ref={formRef}
        className="border-gray-500 border-2 bg-transparent bg-opacity-20 backdrop-blur-sm p-8 rounded-lg shadow-lg w-96 mx-auto relative "
      >
        <h2 className="text-2xl font-semibold text-black mb-2 font-baloo">Buddy-Fi</h2>
        <p className="font-semibold mb-4 text-md">
          <span>MUCHO GUSTO - 😃 Create Your Account</span>
        </p>

        {error && <p className="text-red-500 mb-4">{error}</p>} {/* Display validation error */}
        {responseError && <p className="text-red-500 mb-4">{responseError}</p>} {/* Display API error */}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <input
              ref={(el) => (inputRefs.current[0] = el)}
              type="text"
              name="name"
              placeholder="Enter Your Name"
              className="w-full border-2 border-gray-400 bg-white bg-opacity-30 text-black placeholder-gray-700 p-3 rounded-lg focus:border-yellow-400"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <input
              ref={(el) => (inputRefs.current[1] = el)}
              type="email"
              name="email"
              placeholder="Enter Your Email Address"
              className="w-full border-2 border-gray-400 bg-white bg-opacity-30 text-black placeholder-gray-700 p-3 rounded-lg focus:border-yellow-400"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="flex space-x-2">
            <input
              ref={(el) => (inputRefs.current[2] = el)}
              type="number"
              name="age"
              placeholder="Age"
              className="w-1/3 border-2 border-gray-400 bg-white bg-opacity-30 text-black placeholder-gray-700 p-3 rounded-lg focus:border-yellow-400"
              value={formData.age}
              onChange={handleChange}
              required
            />
            <div className="flex items-center space-x-3">
              <span className="text-gray-600 text-sm font-semibold">GENDER</span>
              <label className="text-gray-700">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  className="mr-1"
                  onChange={handleChange}
                /> MALE
              </label>
              <label className="text-gray-700">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  className="mr-1"
                  onChange={handleChange}
                /> FEMALE
              </label>
            </div>
          </div>
          <div className="relative">
            <input
              ref={(el) => (inputRefs.current[3] = el)}
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              className="w-full border-2 border-gray-400 bg-white bg-opacity-30 text-black placeholder-gray-700 p-1 rounded-lg focus:border-yellow-400"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <div
              className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-white"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <AiFillEye /> : <AiFillEyeInvisible />}
            </div>
          </div>
          <div className="relative">
            <input
              ref={(el) => (inputRefs.current[4] = el)}
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Confirm Password"
              className="w-full border-2 border-gray-400 bg-white bg-opacity-30 text-black placeholder-gray-700 p-1 rounded-lg focus:border-yellow-400"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <div
              className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-white"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <AiFillEye /> : <AiFillEyeInvisible />}
            </div>
          </div>
          <div className="flex justify-between items-center text-sm text-white">
            <label className="flex items-center text-blue-400">
              <input type="checkbox" className="mr-2" required />
              Terms And Conditions
            </label>
            <label className="flex items-center text-blue-400">
              <input type="checkbox" className="mr-2" required />
              Privacy Policy
            </label>
          </div>
          <button
            ref={buttonRef}
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-bold"
          >
            Sign-Up
          </button>
        </form>

        <div className="text-center text-white text-sm mt-4">
          <p>Or Register with</p>
          <div className="flex justify-center space-x-4 mt-2">
             <button className="text-red-500"> 
              {/* added a hover feature here :-gd */}
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
            <Link to="/login" className="text-blue-400 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpForm;