import { useState } from 'react';

const colors = ['#111827', '#2563eb', '#dc2626', '#16a34a', '#7c3aed'];

export default function App() {
  const [colorIndex, setColorIndex] = useState(0);

  const changeColor = () => {
    setColorIndex((prev) => (prev + 1) % colors.length);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors[colorIndex],
        transition: 'background-color 0.3s ease',
      }}
    >
      <button
        onClick={changeColor}
        style={{
          padding: '14px 24px',
          border: 'none',
          borderRadius: '999px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: 'pointer',
          backgroundColor: '#ffffff',
          color: '#111827',
        }}
      >
        Change Color
      </button>
      <button
        onClick={cicdok}
        style={{
          padding: '14px 24px',
          border: 'none',
          borderRadius: '999px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: 'pointer',
          backgroundColor: '#ffffff',
          color: '#111827',
        }}
      >
        CI/CD is working !
      </button>
    </div>
  );
}
