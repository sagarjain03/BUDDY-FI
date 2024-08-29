

const Button = ({ text ,color}) => {
  return (
    <button className={`${color} hover:opacity-30 px-14 py-3 text-xl font-semibold rounded-md shadow-md transition duration-200  z-20 `}>
      {text}
    </button>
  );
};

export default Button;
