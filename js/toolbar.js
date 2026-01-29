// ============================================================
//  SHARED MENU TOGGLE LOGIC
// ============================================================

const apiaryMenuBtn = document.getElementById("apiaryMenuBtn");
const apiaryMenu = document.getElementById("apiaryMenu");

const hivesMenuBtn = document.getElementById("hivesMenuBtn");
const hivesMenu = document.getElementById("hivesMenu");

const toolsMenuBtn = document.getElementById("toolsMenuBtn");
const toolsMenu = document.getElementById("toolsMenu");

// Close all menus
function closeAllMenus() {
  apiaryMenu.style.display = "none";
  hivesMenu.style.display = "none";
  toolsMenu.style.display = "none";
}

// Toggle a specific menu
function toggleMenu(menu) {
  const isOpen = menu.style.display === "flex";
  closeAllMenus();
  if (!isOpen) menu.style.display = "flex";
}

// Close menus when clicking outside
document.addEventListener("click", () => {
  closeAllMenus();
});

// Prevent clicks inside menus from closing them
apiaryMenu.addEventListener("click", (e) => e.stopPropagation());
hivesMenu.addEventListener("click", (e) => e.stopPropagation());
toolsMenu.addEventListener("click", (e) => e.stopPropagation());

// ============================================================
//  APIARY MENU
// ============================================================

apiaryMenuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleMenu(apiaryMenu);
});

document.getElementById("apiaryNew").addEventListener("click", () => {
  closeAllMenus();
  App.Apiaries.create();
});

document.getElementById("apiaryRename").addEventListener("click", () => {
  closeAllMenus();
  App.Apiaries.rename();
});

document.getElementById("apiaryDelete").addEventListener("click", () => {
  closeAllMenus();
  App.Apiaries.delete();
});

document.getElementById("apiaryPrint").addEventListener("click", () => {
  closeAllMenus();
  App.Canvas.print();
});

// ============================================================
//  HIVES MENU
// ============================================================

hivesMenuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleMenu(hivesMenu);
});

// Only REAL actions included
document.getElementById("hiveNew").addEventListener("click", () => {
  closeAllMenus();
  App.Modals.openHiveSizeModal();
});

document.getElementById("hiveDelete").addEventListener("click", () => {
  closeAllMenus();
  App.Canvas.deleteSelected();
});

// ============================================================
//  TOOLS MENU
// ============================================================

toolsMenuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleMenu(toolsMenu);
});

// Export
document.getElementById("toolsExport").addEventListener("click", () => {
  closeAllMenus();
  App.Export.exportAllData();
});

// Import (triggers existing hidden button)
document.getElementById("toolsImport").addEventListener("click", () => {
  document.getElementById("importAllBtn").click();
});

// Status colours
document.getElementById("toolsStatus").addEventListener("click", () => {
  closeAllMenus();
  App.Status.openSettings();
});

// Hive sizes
//document.getElementById("toolsHiveSizes").addEventListener("click", () => {
  //closeAllMenus();
 // App.HiveSize.openModal();
//});

// Stats
//document.getElementById("toolsStats").addEventListener("click", () => {
  //closeAllMenus();
 // App.Stats.open();
//});

const helpBtn = document.getElementById("toolsHelp");
const helpOverlay = document.getElementById("helpOverlay");
const helpModal = document.getElementById("helpModal");

const closeHelp = () => {
  helpOverlay.style.display = "none";
  helpModal.style.display = "none";
};

if (helpBtn && helpOverlay && helpModal) {
  helpBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeAllMenus();
    helpOverlay.style.display = "block";
    helpModal.style.display = "block";
  });

  document.getElementById("helpModalCloseBtn").addEventListener("click", closeHelp);
  document.getElementById("helpModalCloseBtn2").addEventListener("click", closeHelp);
  helpOverlay.addEventListener("click", closeHelp);
}

