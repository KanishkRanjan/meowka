import React from 'react';
import './TitleEffect.css';

const TitleEffect = ({ text = "meowka", layersCount = 10 }) => {
  return (
    <div className="title-twr">
      {/* 
        Render outline layers behind the solid layer. 
        Higher index = further back = shifted higher up and lower z-index.
      */}
      {[...Array(layersCount)].map((_, i) => (
        <h1 
          key={i} 
          className="title-layer outline-layer" 
          style={{ '--layer-index': i + 1 }}
        >
          {text}
        </h1>
      ))}
      
      {/* The front-most solid text layer (index 0) */}
      <h1 className="title-layer solid-layer" style={{ '--layer-index': 0 }}>
        {text}
      </h1>
    </div>
  );
};

export default TitleEffect;
