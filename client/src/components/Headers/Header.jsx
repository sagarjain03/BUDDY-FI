

const Header = ({position}) => {
  return (
    <div className={`z-10 absolute font-[inter]  ${position} w-1/2`}>
      <h1 className={`text-9xl font-extrabold text-black tracking-tight `}>BUDDY-fi</h1>
      <p className={`text-3xl text-gray-800 mt-4 font-bold tracking-tight`}>AS SRK SAID, “Pyaar dosti hai 😆”</p>
    </div>
  );
};

export default Header;
