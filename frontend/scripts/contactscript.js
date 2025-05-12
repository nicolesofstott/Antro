document.getElementById("contact-form").addEventListener("submit", function (e) {
  e.preventDefault();

  // Get trimmed values from form inputs
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const message = document.getElementById("message").value.trim();

  // Basic validation
  if (!name || !email || !message) {
    alert("Please fill out all fields.");
    return;
  }

  console.log("Form submitted:", { name, email, message });

  alert("Thank you for your message!");

  this.reset();
});
