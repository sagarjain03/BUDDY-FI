import React from 'react';
import Button from '../components/Button/Button';
import Header from '../components/Headers/Header';
import String from '../components/String/String';
import Footer from '../components/Footer/Footer';
import { Link } from 'react-router-dom';


const Home = () => {
  return (
    <div
      className="min-h-screen overflow-hidden flex flex-col"
      style={{
        backgroundImage: "url('/src/assets/home-back.png')", // Set background image
        backgroundSize: 'cover', // Make the image cover the entire area
        backgroundPosition: 'center', // Center the background image
        
      }}
    >
      <Header />
      <div className="flex flex-col gap-4 text-center mt-4">
        <Link to="/login"><Button color="bg-yellow-400" text="LOG-IN" /></Link>
        <Link to="/register"><Button color="bg-transparent" text="REGISTER+" /></Link>
      </div>
      <String />
      <Footer />
    </div>
  );
};

export default Home;
