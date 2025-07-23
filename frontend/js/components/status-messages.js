export function showStatusMessage(message, type = 'error') {
  const alertElement = document.getElementById(type === 'error' ? 'error-message' : 'success-message');
  if (alertElement) {
    const otherAlert = document.getElementById(type === 'error' ? 'success-message' : 'error-message');
    if (otherAlert) otherAlert.style.display = 'none';
    alertElement.textContent = message;
    alertElement.style.display = 'block';
    console.log(`🎯 Showing ${type} message: ${message}`);
    setTimeout(() => {
      alertElement.style.display = 'none';
    }, 5000);
    return;
  }

  const chat = document.getElementById("chat");
  if (!chat) {
    console.warn(`⚠️ No ${type}-message or chat element found for message: ${message}`);
    return;
  }
  const alertDiv = document.createElement("div");
  alertDiv.className = `message ${type}-message`;
  alertDiv.textContent = message;
  alertDiv.style.background = type === 'error' ? '#f8d7da' : '#d4edda';
  alertDiv.style.color = type === 'error' ? '#721c24' : '#155724';
  alertDiv.style.alignSelf = 'center';
  alertDiv.style.maxWidth = '90%';
  alertDiv.style.textAlign = 'center';
  chat.appendChild(alertDiv);
  chat.scrollTop = chat.scrollHeight;
  console.log(`🎯 Showing ${type} message in chat: ${message}`);
  setTimeout(() => alertDiv.remove(), 5000);
}
