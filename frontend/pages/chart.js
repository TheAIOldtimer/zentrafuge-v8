<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Zentrafuge × Cael - Mood Tracker</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" href="Zentrafuge-WIDE-Logo-Transparent.png" />
  <!-- Firebase v8 scripts -->
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>
  <script src="firebases-init.js"></script>
  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background: #f7faff;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      color: #333;
    }

    /* Loading overlay for auth check */
    .auth-loading {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(247, 250, 255, 0.95);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      flex-direction: column;
      gap: 1rem;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #ddd;
      border-top: 4px solid #0055aa;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .auth-message {
      color: #0055aa;
      font-size: 1.1rem;
      text-align: center;
    }

    header {
      background: linear-gradient(135deg, #eef2ff 0%, #e6f3ff 100%);
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      border-bottom: 1px solid rgba(0, 85, 170, 0.1);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    header img {
      max-height: 40px;
    }

    .user-info {
      color: #666;
      font-size: 0.9rem;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .nav-link {
      color: #003366;
      text-decoration: none;
      font-size: 0.9rem;
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      transition: background 0.2s;
    }

    .nav-link:hover {
      background: rgba(0, 85, 170, 0.1);
    }

    .logout-btn {
      background-color: #dc3545;
      color: white;
      padding: 0.4rem 0.8rem;
      border: none;
      border-radius: 6px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: background 0.2s;
    }

    .logout-btn:hover {
      background-color: #c82333;
    }

    main {
      flex: 1;
      padding: 2rem 1rem;
      max-width: 720px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .mood-tracker-container {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      text-align: center;
    }

    .mood-tracker-container h2 {
      color: #003366;
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }

    .mood-tracker-container p {
      color: #666;
      font-size: 0.95rem;
      margin-bottom: 1.5rem;
    }

    canvas#moodChart {
      max-width: 100%;
      max-height: 400px;
    }

    .no-data-message {
      color: #666;
      font-style: italic;
      font-size: 1rem;
      padding: 1rem;
      background: linear-gradient(135deg, #eef2ff 0%, #e6f3ff 100%);
      border-radius: 12px;
      border-left: 4px solid #0055aa;
    }

    footer {
      text-align: center;
      padding: 1rem;
      font-size: 0.85rem;
      color: #777;
      margin-top: auto;
    }

    @media screen and (max-width: 600px) {
      header {
        flex-direction: column;
        gap: 0.5rem;
      }

      .header-left,
      .header-right {
        width: 100%;
        justify-content: center;
      }

      .mood-tracker-container {
        padding: 1rem;
      }

      main {
        padding: 1rem;
      }
    }
  </style>
</head>
<body>
  <!-- Auth Loading Overlay -->
  <div class="auth-loading" id="auth-loading">
    <div class="loading-spinner"></div>
    <div class="auth-message">Verifying access...</div>
  </div>

  <header style="display: none;" id="main-header">
    <div class="header-left">
      <img src="Zentrafuge-WIDE-Logo-Transparent.png" alt="Zentrafuge Logo"
           onerror="this.style.display='none'; this.insertAdjacentHTML('afterend', '<h1>Zentrafuge × Cael</h1>');" />
      <div class="user-info" id="user-info">Loading...</div>
    </div>
    <div class="header-right">
      <a class="nav-link" href="chat.html">Chat with Cael</a>
      <button class="logout-btn" onclick="handleLogout()">Logout</button>
    </div>
  </header>

  <main>
    <div class="mood-tracker-container">
      <h2>Your Mood Journey</h2>
      <p>Reflect on your emotional path over the past week.</p>
      <canvas id="moodChart"></canvas>
      <div class="no-data-message" id="no-data-message" style="display: none;">
        No mood data yet. Chat with Cael to start tracking your journey!
      </div>
    </div>
  </main>

  <footer>
    © 2025 Zentrafuge. All rights reserved.
  </footer>

  <script>
    const BACKEND_URL = "https://zentrafuge-v8.onrender.com";
    let currentUser = null;
    let isAuthorized = false;

    // Auth Guard - Check user authorization
    async function checkUserAuthorization(user) {
      try {
        if (!user.emailVerified) {
          throw new Error('Email not verified');
        }
        const db = firebase.firestore();
        const userDoc = await db.collection("users").doc(user.uid).get();
        if (!userDoc.exists) {
          throw new Error('User document not found');
        }
        const userData = userDoc.data();
        if (!userData.onboardingComplete) {
          throw new Error('Onboarding not completed');
        }
        return true;
      } catch (error) {
        console.error('Authorization check failed:', error);
        return false;
      }
    }

    // Redirect to auth page
    function redirectToAuth(reason = 'unauthorized') {
      console.log('Redirecting to auth:', reason);
      const params = new URLSearchParams({ reason });
      window.location.href = `index.html?${params}`;
    }

    // Initialize app
    async function initializeApp(user) {
      currentUser = user;
      document.getElementById('user-info').textContent = `Welcome, ${user.displayName || user.email}`;
      document.getElementById('auth-loading').style.display = 'none';
      document.getElementById('main-header').style.display = 'flex';
      await loadMoodData();
    }

    // Firebase Auth State Observer
    firebase.auth().onAuthStateChanged(async function(user) {
      if (user && !user.isAnonymous) {
        console.log('User authenticated:', user.email);
        const authorized = await checkUserAuthorization(user);
        if (authorized) {
          isAuthorized = true;
          await initializeApp(user);
        } else {
          if (!user.emailVerified) {
            redirectToAuth('email_verification');
          } else {
            redirectToAuth('onboarding_incomplete');
          }
        }
      } else {
        redirectToAuth('not_signed_in');
      }
    });

    // Logout handler
    async function handleLogout() {
      try {
        await firebase.auth().signOut();
        window.location.href = 'index.html';
      } catch (error) {
        console.error('Logout error:', error);
        alert('Error signing out. Please try again.');
      }
    }

    // Fetch mood data
    async function loadMoodData() {
      try {
        const res = await fetch(`${BACKEND_URL}/mood_data`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: currentUser.uid }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        console.log('📊 Mood data received:', data);

        if (data.moods && Array.isArray(data.moods) && data.moods.length > 0) {
          renderMoodChart(data.moods);
        } else {
          document.getElementById('no-data-message').style.display = 'block';
        }
      } catch (err) {
        console.error('❌ Error loading mood data:', err);
        document.getElementById('no-data-message').style.display = 'block';
      }
    }

    // Render Chart.js mood chart
    function renderMoodChart(moods) {
      const ctx = document.getElementById('moodChart').getContext('2d');
      const labels = moods.map(m => new Date(m.timestamp).toLocaleDateString('en-US', { weekday: 'short' }));
      const scores = moods.map(m => m.score);

      // Dynamic color based on average mood
      const avgMood = scores.reduce((a, b) => a + b, 0) / scores.length;
      const borderColor = avgMood < 4 ? '#FF6B6B' : avgMood < 7 ? '#0055aa' : '#28a745';
      const backgroundColor = avgMood < 4 ? 'rgba(255, 107, 107, 0.2)' : avgMood < 7 ? 'rgba(0, 85, 170, 0.2)' : 'rgba(40, 167, 69, 0.2)';

      new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Mood Score',
            data: scores,
            borderColor: borderColor,
            backgroundColor: backgroundColor,
            fill: true,
            tension: 0.3,
            pointRadius: 5,
            pointHoverRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          scales: {
            y: {
              min: 1,
              max: 10,
              title: {
                display: true,
                text: 'Mood Score (1-10)',
                color: '#003366',
                font: { size: 14 }
              },
              ticks: { color: '#666' }
            },
            x: {
              title: {
                display: true,
                text: 'Day',
                color: '#003366',
                font: { size: 14 }
              },
              ticks: { color: '#666' }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Your Weekly Mood Journey',
              color: '#003366',
              font: { size: 18 }
            },
            legend: {
              labels: { color: '#666' }
            }
          }
        }
      });
    }
  </script>
</body>
</html>
