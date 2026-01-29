// ------------------------------------------------------------
// hives.js
// Handles hive types, box types, and shared hive helpers.
// Creation of Fabric objects happens in canvas.js.
// Modal editing happens in modals.js.
// ------------------------------------------------------------

window.App = window.App || {};
App.Hives = {};


// ------------------------------------------------------------
// Hive box types (static list for dropdown)
// ------------------------------------------------------------
App.Hives.boxTypes = [
  "Standard Deep 11",
  "Extra Deep 11",
  "Standard Shallow"
];


// ------------------------------------------------------------
// Load hive types from storage
// ------------------------------------------------------------
App.Hives.getTypes = function () {
  return Storage.getHiveTypes() || [];
};


// ------------------------------------------------------------
// Save hive types
// ------------------------------------------------------------
App.Hives.saveTypes = function (types) {
  Storage.saveHiveTypes(types);
};


// ------------------------------------------------------------
// Populate the hive type <select> in the edit modal
// ------------------------------------------------------------
App.Hives.populateTypeSelect = function (selected = "") {
  const sel = document.getElementById("hiveType");
  if (!sel) return;

  sel.innerHTML = "";

  const types = App.Hives.getTypes();
  types.forEach(type => {
    const opt = document.createElement("option");
    opt.value = type;
    opt.textContent = type;
    if (type === selected) opt.selected = true;
    sel.appendChild(opt);
  });
};


// ------------------------------------------------------------
// Add a new hive type
// ------------------------------------------------------------
App.Hives.addType = function () {
  const newType = prompt("Enter new hive type:");
  if (!newType) return;

  const types = App.Hives.getTypes();
  types.push(newType);

  App.Hives.saveTypes(types);
  App.Hives.populateTypeSelect(newType);
};


// ------------------------------------------------------------
// Populate the box type dropdown in the hive modal
// ------------------------------------------------------------
App.Hives.populateBoxTypeSelect = function () {
  const sel = document.getElementById("boxTypeSelect");
  if (!sel) return;

  sel.innerHTML = "";

  App.Hives.boxTypes.forEach(type => {
    const opt = document.createElement("option");
    opt.value = type;
    opt.textContent = type;
    sel.appendChild(opt);
  });
};


// ------------------------------------------------------------
// Initialise hive system (buttons only)
// ------------------------------------------------------------
App.Hives.init = function () {
  const addHiveTypeBtn = document.getElementById("addHiveTypeBtn");
  if (addHiveTypeBtn) {
    addHiveTypeBtn.addEventListener("click", App.Hives.addType);
  }

  // Populate dropdowns on startup
  App.Hives.populateTypeSelect();
  App.Hives.populateBoxTypeSelect();
};

// ------------------------------------------------------------
// Get list of hives with due inspections across all apiaries
// ------------------------------------------------------------
App.Hives.getDueInspections = function () {
  const results = [];
  const apiaries = Storage.getAllApiaries();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  apiaries.forEach(apiaryName => {
    const layoutJSON = Storage.getHiveLayout(apiaryName);
    if (!layoutJSON) return;

    let layout;
    try {
      layout = JSON.parse(layoutJSON);
    } catch (e) {
      console.error("Invalid layout JSON for apiary:", apiaryName);
      return;
    }

    const objects = layout.objects || [];
    objects.forEach(obj => {
      if (!obj.hiveData) return;

      const hiveName = obj.hiveData.name || "Unnamed";
      const due = obj.hiveData.nextInspectionDate;
      if (!due) return;

      // Due if today or earlier
results.push({
  apiaryName,
  hiveName,
  dueDate: due
});

    });
  });

  // Sort by apiary name, then due date, then hive name
results.sort((a, b) => {
  // 1. Sort by apiary name
  if (a.apiaryName < b.apiaryName) return -1;
  if (a.apiaryName > b.apiaryName) return 1;

  // 2. Sort by due date (YYYY-MM-DD sorts correctly as a string)
  if (a.dueDate < b.dueDate) return -1;
  if (a.dueDate > b.dueDate) return 1;

  // 3. Sort by hive name (numeric or string)
  const numA = parseInt(a.hiveName, 10);
  const numB = parseInt(b.hiveName, 10);

  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB;
  }

  return a.hiveName.localeCompare(b.hiveName);
});

return results;

};
