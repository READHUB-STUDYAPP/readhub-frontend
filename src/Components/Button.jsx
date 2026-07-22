import React from "react";

const Button = ({ buttonText, buttonStyle, onButtonClick }) => {
  return (
    <div>
      <button className={`${buttonStyle}`} onClick={onButtonClick}>
        {buttonText}
      </button>
    </div>
  );
};

export default Button;
