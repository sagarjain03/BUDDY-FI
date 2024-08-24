

const Button = ({ text ,color,position}) => {
  return (
    <button className={`${color} hover:bg-yellow-500 px-6 py-2 text-lg font-semibold rounded-md shadow-md transition duration-200 absolute z-20 ${position}`}>
      {text}
    </button>
  );
};

export default Button;
