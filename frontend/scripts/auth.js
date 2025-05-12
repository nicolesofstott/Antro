document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");

// Login
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const res = await fetch("http://localhost:5050/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Login failed");

      localStorage.clear();
      
      // Save token and user to localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      console.log("Saved token:", data.token);
      console.log("Saved user:", data.user);

      alert("Login successful!");
      window.location.href = "../profile/profile.html";
    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed: " + (err.message || "Please try again"));
    }
  });
}

  // Signup
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const displayName = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const username = document.querySelector("[name='username']").value;
      const password = document.getElementById("password").value;

      try {
        const res = await fetch("http://localhost:5050/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            username, 
            email, 
            password,
            displayName
          }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Signup failed");

        alert("Account created. You can now log in!");
        window.location.href = "login.html";
      } catch (err) {
        console.error(err);
        alert("Signup failed: " + (err.message || "Please try again"));
      }
    });
  }
});