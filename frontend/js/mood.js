import { BACKEND_URL } from './config.js';

export async function getMoodData(userId) {
  try {
    const res = await fetch(`${BACKEND_URL}/mood_data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    console.log('📊 Mood data received:', data);
    return data.moods || [];
  } catch (error) {
    console.error("❌ Error fetching mood data:", error);
    return [];
  }
}

export async function renderMoodChart(userId) {
  const moodData = await getMoodData(userId);
  const ctx = document.getElementById('moodChart')?.getContext('2d');
  if (!ctx) {
    console.warn('⚠️ No canvas element found for moodChart');
    return;
  }

  const labels = moodData.map(m => new Date(m.timestamp).toLocaleDateString());
  const scores = moodData.map(m => m.score);
  const moods = moodData.map(m => m.mood);

  let trend = 'stable';
  if (moodData.length >= 2) {
    const recentScore = scores[scores.length - 1];
    const prevScore = scores[0];
    trend = recentScore > prevScore ? 'improving' : recentScore < prevScore ? 'declining' : 'stable';
  }

  const summaryDiv = document.getElementById('moodSummary');
  if (summaryDiv) {
    summaryDiv.textContent = moodData.length > 0
      ? `Your mood has been ${trend} over the last ${moodData.length} entries. Latest mood: ${moods[moods.length - 1] || 'unknown'} (Score: ${scores[scores.length - 1] || 5}).`
      : 'No mood data available yet. Chat with your AI companion to start tracking your mood!';
  }

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Mood Score',
        data: scores,
        borderColor: '#0055aa',
        backgroundColor: 'rgba(0, 85, 170, 0.2)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#0055aa',
        pointHoverBackgroundColor: '#4a90e2',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top' },
        tooltip: {
          callbacks: {
            label: (context) => `Mood: ${moods[context.dataIndex]} (Score: ${context.parsed.y})`
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 10,
          ticks: { stepSize: 1 },
          title: { display: true, text: 'Mood Score (1-10)' }
        },
        x: {
          title: { display: true, text: 'Date' }
        }
      }
    }
  });
}

export async function renderModalMoodChart(userId) {
  const moodData = await getMoodData(userId);
  const ctx = document.getElementById('modal-mood-chart')?.getContext('2d');
  if (!ctx) return;

  const labels = moodData.map(m => new Date(m.timestamp).toLocaleDateString());
  const scores = moodData.map(m => m.score);
  const moods = moodData.map(m => m.mood);

  let trend = 'stable';
  if (moodData.length >= 2) {
    const recentScore = scores[scores.length - 1];
    const prevScore = scores[0];
    trend = recentScore > prevScore ? 'improving' : recentScore < prevScore ? 'declining' : 'stable';
  }

  const summaryDiv = document.getElementById('modal-mood-summary');
  if (summaryDiv) {
    summaryDiv.textContent = moodData.length > 0
      ? `Your mood has been ${trend} over the last ${moodData.length} entries. Latest mood: ${moods[moods.length - 1] || 'unknown'} (Score: ${scores[scores.length - 1] || 5}).`
      : 'No mood data available yet. Chat with Cael to start tracking your emotional journey!';
  }

  if (moodData.length === 0) {
    ctx.canvas.style.display = 'none';
    return;
  }

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Mood Score',
        data: scores,
        borderColor: '#0055aa',
        backgroundColor: 'rgba(0, 85, 170, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#0055aa',
        pointHoverBackgroundColor: '#4a90e2',
        pointRadius: 6,
        pointHoverRadius: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${moods[context.dataIndex]} (Score: ${context.parsed.y})`
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 10,
          ticks: { stepSize: 1 },
          title: { display: true, text: 'Mood Score (1-10)' }
        },
        x: {
          title: { display: true, text: 'Date' }
        }
      }
    }
  });
}
