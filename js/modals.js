// ------------------------------------------------------------
// modals.js
// Handles all modal windows: hive edit modal, hive size modal,
// inspection history, box management, and saving hive data.
// ------------------------------------------------------------

window.App = window.App || {};
App.Modals = {};

let selectedHive = null;   // Fabric group currently being edited


App.Modals.openHiveModal = function (hiveGroup) {
  selectedHive = hiveGroup;
  const data = hiveGroup.hiveData || {};

  // Ensure arrays exist
  data.boxes = data.boxes || [];
  data.inspections = data.inspections || [];

  // Populate fields
  document.getElementById("hiveName").value = data.name || "";
  App.Hives.populateTypeSelect(data.hiveType || "");
  document.getElementById("lastInspection").value = "";
  document.getElementById("nextInspection").value = data.nextInspectionDate || "";
  document.getElementById("notes").value = "";

  // Latest inspection
  const latest = data.inspections[data.inspections.length - 1] || {};
  App.Status.populateStatusSelect(latest.queenStatus || "");

  // Render boxes + inspection history
  App.Modals.renderBoxList();
  App.Modals.renderInspectionHistory();

  // 🔹 Show correct archive/restore button and wire handlers
  const archiveBtn = document.getElementById("archiveHiveBtn");
  const restoreBtn = document.getElementById("restoreHiveBtn");

  if (archiveBtn && restoreBtn) {
    if (data.status === "archived") {
      archiveBtn.style.display = "none";
      restoreBtn.style.display = "inline-block";
    } else {
      archiveBtn.style.display = "inline-block";
      restoreBtn.style.display = "none";
    }

    archiveBtn.onclick = function () {
      if (!selectedHive) return;

      selectedHive.hiveData.status = "archived";
      selectedHive.visible = false;

      App.Canvas.saveLayout();
      App.Canvas.requestRender();
      App.Modals.closeHiveModal();
    };

    restoreBtn.onclick = function () {
      if (!selectedHive) return;

      selectedHive.hiveData.status = "active";
      selectedHive.visible = true;

      App.Canvas.saveLayout();
      App.Canvas.requestRender();
      App.Modals.closeHiveModal();
    };
  }

  // Show modal
  document.getElementById("modal").style.display = "block";
  document.getElementById("overlay").style.display = "block";
};


// ------------------------------------------------------------
// Close hive edit modal
// ------------------------------------------------------------
App.Modals.closeHiveModal = function () {
  document.getElementById("modal").style.display = "none";
  document.getElementById("overlay").style.display = "none";
  selectedHive = null;
};


// ------------------------------------------------------------
// Save hive data from modal
// ------------------------------------------------------------
App.Modals.saveHiveData = function () {
  if (!selectedHive) return;

  const hiveData = selectedHive.hiveData;

  const name = document.getElementById("hiveName").value.trim() || "Unnamed";
  const hiveType = document.getElementById("hiveType").value;
  const date = document.getElementById("lastInspection").value;
  const queenStatus = document.getElementById("queenStatus").value;
  const notes = document.getElementById("notes").value;
  const nextInspection = document.getElementById("nextInspection").value;


  // Update name + type
  hiveData.name = name;
  hiveData.hiveType = hiveType;
  hiveData.nextInspectionDate = nextInspection;


  // Ensure inspections array exists
  hiveData.inspections = hiveData.inspections || [];
  const latest = hiveData.inspections[hiveData.inspections.length - 1] || {};

  // Append new inspection only if changed
  if (date !== latest.date || queenStatus !== latest.queenStatus || notes !== latest.notes) {
    hiveData.inspections.push({ date, queenStatus, notes });
  }

  // Update label + colour
  const currentInspection = hiveData.inspections[hiveData.inspections.length - 1] || {};
  selectedHive._objects[1].set("text", name);

  const color = App.Status.getColor(currentInspection.queenStatus || "");
  selectedHive._objects[0].set("fill", color);

  selectedHive.setCoords();
  App.Canvas.requestRender();

  App.Canvas.saveLayout();
  App.updateDueInspectionsBadge();
  App.Stats.update();
  App.Modals.closeHiveModal();
};


// ------------------------------------------------------------
// Render inspection history list
// ------------------------------------------------------------
App.Modals.renderInspectionHistory = function () {
  const container = document.getElementById("inspectionHistoryList");
  if (!container || !selectedHive) return;

  const data = selectedHive.hiveData;
  container.innerHTML = "";

  data.inspections.slice().reverse().forEach((ins, reversedIndex) => {
    const originalIndex = data.inspections.length - 1 - reversedIndex;

    const li = document.createElement("li");
    li.style.marginBottom = "6px";

    li.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:start; gap:6px;">
        <div>
          <strong>${App.Utils.formatDateUK(ins.date)}</strong> - Status: ${ins.queenStatus || "N/A"}<br>
          Notes: ${ins.notes || ""}
        </div>
        <button type="button"
                class="deleteInspectionBtn small-delete"
                data-index="${originalIndex}">
                ×
        </button>
      </div>
    `;

    container.appendChild(li);
  });

  // Attach delete handlers
  container.querySelectorAll(".deleteInspectionBtn").forEach(btn => {
    btn.addEventListener("click", e => {
      const index = parseInt(e.target.dataset.index, 10);
      App.Modals.deleteInspection(index);
    });
  });
};


// ------------------------------------------------------------
// Delete an inspection
// ------------------------------------------------------------
App.Modals.deleteInspection = function (index) {
  if (!selectedHive) return;

  const hiveData = selectedHive.hiveData;
  if (!hiveData.inspections || index < 0 || index >= hiveData.inspections.length) return;

  if (!confirm("Delete this inspection? This cannot be undone.")) return;

  hiveData.inspections.splice(index, 1);

  // Refresh modal
  App.Modals.renderInspectionHistory();
  App.Canvas.saveLayout();
};


// ------------------------------------------------------------
// Render hive box list
// ------------------------------------------------------------
App.Modals.renderBoxList = function () {
  const container = document.getElementById("boxList");
  if (!container || !selectedHive) return;

  container.innerHTML = "";

  selectedHive.hiveData.boxes.forEach((box, idx) => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.marginBottom = "4px";

    row.innerHTML = `
      <span>${box.count} × ${box.type}</span>
      <button type="button"
              class="deleteBoxBtn small-delete"
              data-index="${idx}">
        ×
      </button>
    `;

    container.appendChild(row);
  });

  // Attach delete handlers
  container.querySelectorAll(".deleteBoxBtn").forEach(btn => {
    btn.addEventListener("click", e => {
      const index = parseInt(e.target.dataset.index, 10);
      selectedHive.hiveData.boxes.splice(index, 1);
      App.Modals.renderBoxList();
      App.Canvas.saveLayout();
    });
  });
};


// ------------------------------------------------------------
// Add a box to the hive
// ------------------------------------------------------------
App.Modals.addBox = function () {
  if (!selectedHive) return;

  const type = document.getElementById("boxTypeSelect").value;
  const count = parseInt(document.getElementById("boxCountInput").value, 10);

  if (!count || count < 1) {
    alert("Count must be at least 1");
    return;
  }

  selectedHive.hiveData.boxes.push({ type, count });
  App.Modals.renderBoxList();
  App.Canvas.saveLayout();
};


// ------------------------------------------------------------
// HIVE SIZE MODAL
// ------------------------------------------------------------

// Open
App.Modals.openHiveSizeModal = function () {
  document.getElementById("hiveSizeModal").style.display = "block";
  document.getElementById("hiveSizeOverlay").style.display = "block";

  // Auto-suggest next hive number
  const used = App.Canvas.getHiveNames();
  let n = 1;
  while (used.includes(String(n))) n++;

  document.getElementById("hiveNameInput").value = n;
  document.getElementById("usedHiveNumbers").textContent =
    used.length ? "Used: " + used.join(", ") : "No hives yet";
};

// Close
App.Modals.closeHiveSizeModal = function () {
  document.getElementById("hiveSizeModal").style.display = "none";
  document.getElementById("hiveSizeOverlay").style.display = "none";
};


// Toggle custom size fields
App.Modals.toggleCustomSizeFields = function () {
  const select = document.getElementById("hiveSizeSelect");
  const fields = document.getElementById("customSizeFields");
  fields.style.display = select.value === "custom" ? "block" : "none";
};


// Confirm creation
App.Modals.confirmCreateHive = function () {
  const size = document.getElementById("hiveSizeSelect").value;
  const name = document.getElementById("hiveNameInput").value.trim() || "Hive";

  // Duplicate check
  if (App.Canvas.getHiveNames().includes(name)) {
    alert(`Hive name "${name}" already exists.`);
    return;
  }

  let width, height;

  if (size === "custom") {
    width = parseInt(document.getElementById("hiveWidthInput").value) || 40;
    height = parseInt(document.getElementById("hiveHeightInput").value) || 40;
  } else {
    [width, height] = size.split("x").map(Number);
  }

  // Delegate creation to Canvas module
  App.Canvas.createHive(name, width, height);
App.Stats.update();
  App.Modals.closeHiveSizeModal();
};

// ------------------------------------------------------------
// Open the Inspections Due modal
// ------------------------------------------------------------
App.Modals.openDueInspections = function () {
  const fullList = App.Hives.getDueInspections();
  const container = document.getElementById("dueInspectionsList");
  const filterCheckbox = document.getElementById("filterNext7");

  function render() {
    container.innerHTML = "";
    const today = new Date().toISOString().slice(0, 10);

    // Calculate date 7 days from now
    const next7 = new Date();
    next7.setDate(next7.getDate() + 7);
    const next7Str = next7.toISOString().slice(0, 10);

    // Apply filter if checkbox is ticked
const list = filterCheckbox.checked
  ? fullList.filter(item =>
      item.dueDate <= today || // overdue or today
      (item.dueDate > today && item.dueDate <= next7Str) // next 7 days
    )
  : fullList;


    if (list.length === 0) {
      container.innerHTML = "<li>No inspections in this range.</li>";
      return;
    }

    list.forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.apiaryName} – Hive ${item.hiveName} (${App.Utils.formatDateUK(item.dueDate)})`;

      if (item.dueDate < today) {
        li.classList.add("due-overdue");
      } else if (item.dueDate === today) {
        li.classList.add("due-today");
      } else {
        li.classList.add("due-future");
      }

      container.appendChild(li);
    });
  }

  // Render immediately
  render();

  // Re-render when checkbox changes
  filterCheckbox.onchange = render;

  // Show modal + overlay
  document.getElementById("overlay").style.display = "block";
  document.getElementById("dueInspectionsModal").style.display = "block";
};


// ------------------------------------------------------------
// Close the Inspections Due modal
// ------------------------------------------------------------
App.Modals.closeDueInspections = function () {
  
  document.getElementById("dueInspectionsModal").style.display = "none";
document.getElementById("overlay").style.display = "none";

};

App.Modals.openArchivedHives = function () {
  const list = document.getElementById("archivedHivesList");
  list.innerHTML = "";

  const archived = canvas.getObjects().filter(o =>
    o.hiveData && o.hiveData.status === "archived"
  );

  if (archived.length === 0) {
    list.innerHTML = "<li>No archived hives.</li>";
  } else {
    archived.forEach(obj => {
      const li = document.createElement("li");
      li.style.marginBottom = "6px";

li.innerHTML = `
  ${obj.hiveData.name}
  <button class="small-btn viewArchivedBtn">View</button>
  <button class="small-btn restoreArchivedBtn">Restore</button>
`;


      li.querySelector(".restoreArchivedBtn").onclick = () => {
        obj.hiveData.status = "active";
        obj.visible = true;
        App.Canvas.saveLayout();
        App.Canvas.requestRender();
        App.Modals.openArchivedHives(); // refresh list
        App.Stats.update();
      };
li.querySelector(".viewArchivedBtn").onclick = () => {
  selectedHive = obj;
  App.Modals.openHiveModal(obj);
};

      list.appendChild(li);
    });
  }

  document.getElementById("overlay").style.display = "block";
  document.getElementById("archivedHivesModal").style.display = "block";
};

// ------------------------------------------------------------
// Initialise modal system
// ------------------------------------------------------------
App.Modals.init = function () {
  // Hive edit modal
  document.getElementById("modalCloseBtn").addEventListener("click", App.Modals.closeHiveModal);
  document.getElementById("cancelHiveBtn").addEventListener("click", App.Modals.closeHiveModal);
  document.getElementById("saveHiveBtn").addEventListener("click", App.Modals.saveHiveData);

  // Hive size modal
  document.getElementById("addHiveBtn").addEventListener("click", App.Modals.openHiveSizeModal);
  document.getElementById("hiveSizeCloseBtn").addEventListener("click", App.Modals.closeHiveSizeModal);
  document.getElementById("cancelCreateHiveBtn").addEventListener("click", App.Modals.closeHiveSizeModal);
  document.getElementById("confirmCreateHiveBtn").addEventListener("click", App.Modals.confirmCreateHive);
  document.getElementById("hiveSizeSelect").addEventListener("change", App.Modals.toggleCustomSizeFields);

  // Box add button
  document.getElementById("addBoxBtn").addEventListener("click", App.Modals.addBox);
  document.getElementById("closeDueInspectionsBtn").addEventListener("click", App.Modals.closeDueInspections);

  document.getElementById("closeDueInspectionsBtn2").addEventListener("click", App.Modals.closeDueInspections);
  document.getElementById("hivesArchived").addEventListener("click", App.Modals.openArchivedHives);
document.getElementById("closeArchivedHivesBtn")
  .addEventListener("click", () => {
    document.getElementById("archivedHivesModal").style.display = "none";
    document.getElementById("overlay").style.display = "none";
  });


};
