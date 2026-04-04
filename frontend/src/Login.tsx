import { useNavigate } from '@solidjs/router';

export default function Login() {
  const navigate = useNavigate();

  return (
    <div class="login-page">
      <div class="login-card">
        <div class="login-logo">
          <span class="login-icon">⚖️</span>
          <h1>Prelegal</h1>
          <p>AI-powered legal document drafting</p>
        </div>
        <button class="btn btn-primary login-btn" onClick={() => navigate('/app')}>
          Continue as Guest
        </button>
      </div>
    </div>
  );
}
