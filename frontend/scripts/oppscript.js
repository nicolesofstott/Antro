document.addEventListener("DOMContentLoaded", () => {
    let opportunities = [
      {
        title: "Virtual Art Fair",
        location: "Remote",
        description: "Join the May 2025 global showcase.",
        type: "residency",
        price: "Free",
      },
      {
        title: "Creator Network Internship",
        location: "London",
        description: "Work with artists and curators.",
        type: "internship",
        price: "Paid",
      },
      {
        title: "Art Director Job",
        location: "Berlin",
        description: "Full-time creative lead position.",
        type: "job",
        price: "€45k/year",
      },
    ];
  
    // Sample data for opportunities - this would normally come from backend
    const tabs = document.querySelectorAll(".opportunity-tab");
    const list = document.getElementById("opportunityList");
    const empty = document.getElementById("emptyState");
    const form = document.getElementById("addOpportunityForm");
  
    // Function to render opportunities based on selected tab
    function renderOpportunities(type) {
      list.innerHTML = "";
      const filtered = type === "all" ? opportunities : opportunities.filter(o => o.type === type);
  
      if (filtered.length === 0) {
        empty.classList.remove("hidden");
        return;
      } else {
        empty.classList.add("hidden");
      }
  
      filtered.forEach(opp => {
        const el = document.createElement("div");
        el.className = "opportunity-item";
        el.innerHTML = `
          <div class="opportunity-details">
            <div class="opportunity-title">${opp.title}</div>
            <div class="opportunity-location">${opp.location}</div>
            <div class="opportunity-description">${opp.description}</div>
          </div>
          <div class="opportunity-actions">
            <div class="opportunity-price">${opp.price}</div>
            <div class="action-buttons">
              <button class="save-btn">Save</button>
              <button class="contact-btn">Contact</button>
            </div>
          </div>
        `;
        list.appendChild(el);
      });
    }
  
    // Set up event listeners for tabs
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        renderOpportunities(tab.dataset.type);
      });
    });
  
    // Set up event listener for the form
    form.addEventListener("submit", (e) => {
      e.preventDefault();
  
      const newOpp = {
        title: form.title.value.trim(),
        type: form.type.value,
        location: form.location.value.trim(),
        description: form.description.value.trim(),
        price: form.price.value.trim() || "Unpaid",
      };
  
      if (!newOpp.title || !newOpp.type || !newOpp.location || !newOpp.description) {
        alert("Please fill out all required fields.");
        return;
      }
  
      opportunities.unshift(newOpp);
      renderOpportunities(document.querySelector(".opportunity-tab.active").dataset.type);
      form.reset();
      alert("Opportunity added successfully.");
    });
  
    renderOpportunities("all");
  });
  