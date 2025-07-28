document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("register-form");
  const loading = document.getElementById("loading");
  const message = document.getElementById("message");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    loading.style.display = "block";
    message.style.display = "none";

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const isVeteran = document.getElementById("veteran").checked;

    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;

        return firebase.firestore().collection("users").doc(user.uid).set({
          name: name,
          email: email,
          isVeteran: isVeteran,
          createdAt: new Date().toISOString()
        });
      })
      .then(() => {
        loading.style.display = "none";
        window.location.href = "preferences.html"; // Redirect after registration
      })
      .catch((error) => {
        loading.style.display = "none";
        message.style.display = "block";
        message.textContent = error.message || "Something went wrong during registration.";
      });
  });
});
