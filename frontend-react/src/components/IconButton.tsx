import React from 'react';
// import '/index.css';

type IconButtonProps = {
  icon: React.ReactNode;
  alt: string;
  onClick: () => void;
};

const IconButton: React.FC<IconButtonProps> = ({ icon, alt, onClick }) => {
  return (
    <div className="z-10">
      <style>
        {`
        button {
          background-color: #989898;
          border: none;
          border-radius: 100vw;
          color: #fff;
          padding: 0.5rem;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          font-size: 16px;
          margin: 4px;
          cursor: pointer;
        }
        `}
      </style>
      <button onClick={onClick}>{icon ? icon : alt}</button>
    </div>
  );
};

export default IconButton;
