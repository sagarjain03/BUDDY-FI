import React from 'react';
import { Link } from 'react-router-dom';

const SignUp = () => {
  return (
    <div className="bg-white border-2 border-orange-500 p-8 rounded-lg shadow-lg w-96 mx-auto mt-12">
      <h1 className="text-2xl font-bold mb-4">Sign Up</h1>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-semibold">Full Name</label>
          <input
            type="text"
            placeholder="Enter Your Full Name"
            className="w-full border border-gray-300 p-2 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold">E-Mail</label>
          <input
            type="email"
            placeholder="Enter Your Email Address"
            className="w-full border border-gray-300 p-2 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold">Password</label>
          <input
            type="password"
            placeholder="Enter Your Password"
            className="w-full border border-gray-300 p-2 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold">Confirm Password</label>
          <input
            type="password"
            placeholder="Confirm Your Password"
            className="w-full border border-gray-300 p-2 rounded-md"
          />
        </div>
        <button className="w-full bg-yellow-500 text-white p-2 rounded-md font-bold hover:bg-yellow-600">
          Sign Up
        </button>
      </form>
      <div className="mt-4 text-center text-sm">
        <p>
          Already have an account?{' '}
          <Link to="/login" className="text-blue-500 hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
