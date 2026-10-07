import React from "react";

/**
 * A button whose label always fits inside it.
 *
 * The wrapper is full-width and centres its child, and the button lays its
 * label out with flex plus real side padding. Without that, a fixed-height
 * pill given a label wider than its box let the text spill straight out of
 * the rounded edge -- which is what "Start Focus Session" did on a phone.
 */
const Button = ({ buttonText, buttonStyle, onButtonClick }) => {
  return (
    <div className="flex w-full justify-center">
      <button
        className={`flex items-center justify-center px-5 text-center ${buttonStyle}`}
        onClick={onButtonClick}
      >
        {buttonText}
      </button>
    </div>
  );
};

export default Button;
