document.addEventListener("DOMContentLoaded", () => {
  const currentUserId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  const toggleHeader = document.getElementById("toggleOpportunityForm");
  const form = document.getElementById("addOpportunityForm");

  toggleHeader.addEventListener("click", () => {
    const isHidden = form.style.display === "none";
    form.style.display = isHidden ? "block" : "none";
    toggleHeader.innerHTML = `Add New Opportunity +`;
  });

  let opportunities = [];
  let savedOpportunities = [];

  const tabs = document.querySelectorAll(".opportunity-tab");
  const list = document.getElementById("opportunityList");
  const empty = document.getElementById("emptyState");
  const savedEmpty = document.getElementById("savedEmptyState");

  // Load opportunities from backend
  async function loadAllOpportunities() {
    try {
      const response = await fetch('/api/opportunities');
      if (response.ok) {
        opportunities = await response.json();
        console.log('Loaded opportunities from API:', opportunities.length);
      } else {
        console.log('API failed, using mock data');
        opportunities = [
          {
            _id: "mock1",
            title: "Artistic Collaboration",
            location: "London",
            description: "We're looking for artist to collaborate on an exhibition with the theme: Elemental elegance, contact us at artsurdn@gmail.com for more information!",
            type: "exhibition",
            price: "Unpaid",
            createdBy: { _id: "mock-user-1", name: "Gallery Owner" },
            createdAt: new Date().toISOString()
          },
          {
            _id: "mock2",
            title: "Virtual Art Fair",
            location: "Remote",
            description: "Join the May 2025 global showcase.",
            type: "residency",
            price: "Free Entry",
            createdBy: { _id: "mock-user-2", name: "Event Organizer" },
            createdAt: new Date().toISOString()
          },
          {
            _id: "mock3",
            title: "Art Director Position",
            location: "Berlin",
            description: "Full-time creative lead position at innovative art studio.",
            type: "job",
            price: "€45k/year",
            createdBy: { _id: currentUserId || "mock-user-3", name: "Your Company" },
            createdAt: new Date().toISOString()
          }
        ];
      }
    } catch (error) {
      console.error('Error loading opportunities:', error);
      opportunities = [];
    }
  }

  // Load saved opportunities from backend
  async function loadSavedOpportunities() {
    if (!token) {
      savedOpportunities = [];
      return;
    }

    try {
      const response = await fetch('/api/opportunities/saved', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        savedOpportunities = await response.json();
      } else {
        console.error('Failed to load saved opportunities');
        savedOpportunities = [];
      }
    } catch (error) {
      console.error('Error loading saved opportunities:', error);
      savedOpportunities = [];
    }
  }

  // Save opportunity
  async function saveOpportunity(opportunityId) {
    if (!token) {
      alert('Please log in to save opportunities');
      return;
    }

    try {
      const response = await fetch('/api/opportunities/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ opportunityId })
      });

      if (response.ok) {
        alert('Opportunity saved successfully!');
        await loadSavedOpportunities();
        const activeTab = document.querySelector(".opportunity-tab.active");
        if (activeTab && activeTab.dataset.type === "saved") {
          renderOpportunities("saved");
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save opportunity');
      }
    } catch (error) {
      console.error('Error saving opportunity:', error);
      alert('Error saving opportunity');
    }
  }

  // Unsave opportunity
  async function unsaveOpportunity(opportunityId) {
    if (!token) {
      alert('Please log in to manage saved opportunities');
      return;
    }

    try {
      const response = await fetch(`/api/opportunities/unsave/${opportunityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Opportunity removed from saved list');
        await loadSavedOpportunities();
        const activeTab = document.querySelector(".opportunity-tab.active");
        if (activeTab && activeTab.dataset.type === "saved") {
          renderOpportunities("saved");
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to remove opportunity');
      }
    } catch (error) {
      console.error('Error unsaving opportunity:', error);
      alert('Error removing opportunity');
    }
  }

  // Delete opportunity
  async function deleteOpportunity(opportunityId) {
    if (!token) {
      alert('Please log in to delete opportunities');
      return;
    }

    const confirmed = confirm('Are you sure you want to delete this opportunity?');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/opportunities/${opportunityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Opportunity deleted successfully');
        opportunities = opportunities.filter(o => o._id !== opportunityId);
        renderOpportunities(document.querySelector(".opportunity-tab.active").dataset.type);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete opportunity');
      }
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      alert('Error deleting opportunity');
    }
  }

  function renderOpportunities(type) {
    list.innerHTML = "";
    
    let filtered;
    let emptyMessage;
    
    if (type === "saved") {
      filtered = savedOpportunities.map(savedOpp => ({
        ...savedOpp.opportunity,
        savedAt: savedOpp.savedAt,
        isSaved: true
      }));
      emptyMessage = savedEmpty;
    } else if (type === "all") {
      filtered = opportunities;
      emptyMessage = empty;
    } else {
      filtered = opportunities.filter(o => o.type === type);
      emptyMessage = empty;
    }

    // Hide both empty state messages first
    empty.classList.add("hidden");
    savedEmpty.classList.add("hidden");

    if (filtered.length === 0) {
      emptyMessage.classList.remove("hidden");
      return;
    }

    filtered.forEach(opp => {
      const el = document.createElement("div");
      el.className = "opportunity-item";
      el.dataset.type = opp.type;

      let extraInfo = "";
      if (opp.savedAt) {
        extraInfo = `<div class="saved-date">Saved on: ${new Date(opp.savedAt).toLocaleDateString()}</div>`;
      }

      const creatorId = opp.createdBy?._id || opp.createdBy;
      const creatorName = opp.createdBy?.name || 'Unknown';

      el.innerHTML = `
        <div class="opportunity-details">
          <div class="opportunity-title">${opp.title}</div>
          <div class="opportunity-location">${opp.location}</div>
          <div class="opportunity-description">${opp.description}</div>
          <div style="font-size: 0.8rem; color: #666; margin-top: 8px;">
            Posted by: ${creatorName}
          </div>
          ${extraInfo}
        </div>
        <div class="opportunity-actions">
          <div class="opportunity-price">${opp.price}</div>
          <div class="action-buttons"></div>
        </div>
      `;

      const actionButtons = el.querySelector(".action-buttons");

      // Contact button
      const contactBtn = document.createElement("button");
      contactBtn.classList.add("contact-btn");
      contactBtn.textContent = "Contact";
      actionButtons.appendChild(contactBtn);

      if (type === "saved") {
        const unsaveBtn = document.createElement("button");
        unsaveBtn.classList.add("unsave-btn");
        unsaveBtn.textContent = "Remove";
        unsaveBtn.addEventListener("click", () => unsaveOpportunity(opp._id));
        actionButtons.appendChild(unsaveBtn);
      } else {
        const saveBtn = document.createElement("button");
        saveBtn.classList.add("save-btn");
        saveBtn.textContent = "Save";
        saveBtn.addEventListener("click", () => saveOpportunity(opp._id));
        actionButtons.appendChild(saveBtn);

        if (creatorId === currentUserId) {
          const deleteBtn = document.createElement('button');
          deleteBtn.classList.add('delete-btn');
          deleteBtn.textContent = 'Delete';
          deleteBtn.addEventListener('click', () => deleteOpportunity(opp._id));
          actionButtons.appendChild(deleteBtn);
        }
      }

      list.appendChild(el);
    });
  }

  tabs.forEach(tab => {
    tab.addEventListener("click", async () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      
      const tabType = tab.dataset.type;
      
      if (tabType === "saved") {
        await loadSavedOpportunities();
      }
      
      renderOpportunities(tabType);
    });
  });

  // Create opportunities in database
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!token) {
      alert('Please log in to create opportunities');
      return;
    }

    const newOpp = {
      title: form.title.value.trim(),
      type: form.type.value,
      location: form.location.value.trim(),
      description: form.description.value.trim(),
      price: form.price.value.trim() || "Unpaid"
    };

    if (!newOpp.title || !newOpp.type || !newOpp.location || !newOpp.description) {
      alert("Please fill out all required fields.");
      return;
    }

    try {
      const response = await fetch('/api/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newOpp)
      });

      if (response.ok) {
        const createdOpp = await response.json();
        alert("Opportunity created successfully!");
        
        opportunities.unshift(createdOpp);
        
        renderOpportunities(document.querySelector(".opportunity-tab.active").dataset.type);
        
        form.reset();
        form.style.display = "none";
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create opportunity');
      }
    } catch (error) {
      console.error('Error creating opportunity:', error);
      alert('Error creating opportunity');
    }
  });

  // Initialise
  async function init() {
    await loadAllOpportunities();
    if (token) {
      await loadSavedOpportunities();
    }
    renderOpportunities("all");
  }

  init();
});