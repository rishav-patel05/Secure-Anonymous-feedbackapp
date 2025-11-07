import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import ReCAPTCHA from 'react-google-recaptcha';
import { saveAs } from 'file-saver';
import './App.css';

const SECRET_KEY = 'secure_feedback_key';
const ADMIN_PASSWORD = 'admin123'; // Simple demo password
const RECAPTCHA_SITE_KEY = '6Lfo4worAAAAADaVAWwlosqECQx86HcMt7S9myJc';

const encryptData = (data) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
};

const decryptData = (ciphertext) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch {
    return [];
  }
};

function App() {
  const [feedback, setFeedback] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [role, setRole] = useState('viewer'); // 'admin' or 'viewer'
  const [allFeedback, setAllFeedback] = useState([]);
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('encryptedFeedback');
    if (stored) {
      setAllFeedback(decryptData(stored));
    }
  }, []);

  const handleSubmit = () => {
    if (!feedback.trim()) return alert('Feedback cannot be empty');
    if (!captchaVerified) return alert('CAPTCHA not verified');

    const newEntry = { text: feedback, date: new Date().toLocaleString() };
    const updated = [...allFeedback, newEntry];
    setAllFeedback(updated);
    localStorage.setItem('encryptedFeedback', encryptData(updated));
    setFeedback('');
    setCaptchaVerified(false);
    alert('Feedback submitted anonymously!');
  };

  const handleAuth = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setAdminAuth(true);
    } else {
      alert('Incorrect password');
    }
  };

  const handleExport = () => {
    const csv = allFeedback.map(entry => `"${entry.date}","${entry.text.replace(/"/g, '""')}"`).join('\n');
    const blob = new Blob([`Date,Feedback\n${csv}`], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'feedback.csv');
  };

  return (
    <div className="app">
      <h1>📮 Anonymous Feedback</h1>

      <div className="auth-section">
        <label>Select Role: </label>
        <select onChange={(e) => setRole(e.target.value)} value={role}>
          <option value="viewer">Viewer</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {role === 'admin' && !adminAuth ? (
        <div className="admin-login">
          <input
            type="password"
            placeholder="Enter admin password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
          />
          <button onClick={handleAuth}>Login as Admin</button>
        </div>
      ) : (
        <>
          <div className="form-section">
            <textarea
              rows="4"
              placeholder="Write your feedback..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            ></textarea>

            <ReCAPTCHA
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={() => setCaptchaVerified(true)}
              onExpired={() => setCaptchaVerified(false)}
            />

            <button onClick={handleSubmit}>Submit Feedback</button>
          </div>

          {role === 'admin' && adminAuth && (
            <div className="admin-section">
              <h2>📂 Submitted Feedback (Admin View)</h2>
              <button onClick={handleExport}>Export to CSV</button>
              {allFeedback.length === 0 ? (
                <p>No feedback submitted yet.</p>
              ) : (
                <ul>
                  {allFeedback.map((entry, index) => (
                    <li key={index}>
                      <strong>{entry.date}:</strong> {entry.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;