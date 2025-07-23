export function showLoadingSpinner() {
  const spinner = document.getElementById('auth-loading');
  if (spinner) {
    console.log('🎯 Showing loading spinner');
    spinner.style.display = 'flex';
  } else {
    console.warn('⚠️ No auth-loading element found for spinner');
  }
}

export function hideLoadingSpinner() {
  const spinner = document.getElementById('auth-loading');
  if (spinner) {
    console.log('🎯 Hiding loading spinner');
    spinner.style.display = 'none';
  } else {
    console.warn('⚠️ No auth-loading element found for spinner');
  }
}
