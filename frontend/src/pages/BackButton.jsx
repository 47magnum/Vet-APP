import { useNavigate } from 'react-router-dom';
import '../sql_search.css';

export default function BackButton() {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate('/')} className="back-button">
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
      >
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      Back to Home
    </button>
  );
}