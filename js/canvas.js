// ------------------------------------------------------------
// canvas.js
// Fabric.js canvas engine: creation, loading, saving, printing,
// tooltip handling, and hive object management.
// ------------------------------------------------------------

window.App = window.App || {};
App.Canvas = {};

let canvas = null;
let tooltip = null;


// ------------------------------------------------------------
// Initialise Fabric canvas
// ------------------------------------------------------------
App.Canvas.init = function () {
  tooltip = document.getElementById("tooltip");

  canvas = new fabric.Canvas("hiveCanvas", {
    selection: true,
    preserveObjectStacking: true
  });

  // Touch double‑tap to open modal
  if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
    let lastTap = 0;
    canvas.on("mouse:down", e => {
      if (!e.target || !e.target.hiveData) return;
      const now = Date.now();
      if (now - lastTap < 300) {
        App.Modals.openHiveModal(e.target);
        lastTap = 0;
      } else {
        lastTap = now;
      }
    });
  }

  // Tooltip
  canvas.on("mouse:move", App.Canvas.handleTooltip);
  canvas.on("mouse:out", () => tooltip.style.display = "none");

  // Save layout on changes
  canvas.on("object:modified", App.Canvas.saveLayout);
  canvas.on("object:added", App.Canvas.saveLayout);

  // Load initial layout
  App.Canvas.loadLayout();

  // Underline labels
  App.Canvas.underlineLabels();
};


// ------------------------------------------------------------
// Create a hive (Fabric group)
// ------------------------------------------------------------
App.Canvas.createHive = function (name, width, height) {
  const rect = new fabric.Rect({
    width,
    height,
    fill: "#ffe680",
    stroke: "#000",
    strokeWidth: 1,
    originX: "center",
    originY: "center"
  });

  const label = new fabric.Text(name, {
    fontSize: 14,
    fontFamily: "Arial, sans-serif",
    underline: true,
    originX: "center",
    originY: "center",
    fill: "#000"
  });

  const group = new fabric.Group([rect, label], {
    left: 100,
    top: 100,
    hasControls: true,
    lockScalingX: true,
    lockScalingY: true,
    lockUniScaling: true,
    hiveData: {
      name,
      hiveType: "Hive",
      inspections: [],
      boxes: []
    }
  });

  group.setControlsVisibility({
    mt:false, mb:false, ml:false, mr:false,
    tl:false, tr:false, bl:false, br:false, mtr:true
  });

  group.on("mousedblclick", () => App.Modals.openHiveModal(group));

  canvas.add(group);
  canvas.setActiveObject(group);
  App.Canvas.requestRender();
};


// ------------------------------------------------------------
// Tooltip handler
// ------------------------------------------------------------
App.Canvas.handleTooltip = function (options) {
  if (!options.target || !options.target.hiveData) {
    tooltip.style.display = "none";
    return;
  }

  const hive = options.target.hiveData;
  const latest = hive.inspections[hive.inspections.length - 1] || {};

  tooltip.style.left = (options.e.pageX + 10) + "px";
  tooltip.style.top = (options.e.pageY + 10) + "px";

  tooltip.innerHTML = `
    Hive ID: <strong>${hive.name}</strong><br>
    Hive type: ${hive.hiveType || "N/A"}<br>
    Boxes:<br>
    ${hive.boxes.map(b => `- ${b.type} x${b.count}`).join("<br>") || "None"}<br>
    Last inspection: ${App.Utils.formatDateUK(latest.date)}<br>
    Queen status: ${latest.queenStatus || "N/A"}
  `;

  tooltip.style.display = "block";
};


// ------------------------------------------------------------
// Save layout to storage
// ------------------------------------------------------------
App.Canvas.saveLayout = function () {
  const current = Storage.getCurrentApiary();
  if (!current) return;

  const json = JSON.stringify(canvas.toJSON(["hiveData"]));
  Storage.saveHiveLayout(current, json);
};


// ------------------------------------------------------------
// Load layout from storage
// ------------------------------------------------------------
App.Canvas.loadLayout = function () {
  const current = Storage.getCurrentApiary();
  if (!current) return;

  const json = Storage.getHiveLayout(current);
  canvas.clear();

  if (!json) {
    App.Canvas.requestRender();
    return;
  }

  canvas.loadFromJSON(json, () => {
    canvas.getObjects().forEach(obj => {
      if (obj.type === "group" && obj.hiveData) {
        obj.on("mousedblclick", () => App.Modals.openHiveModal(obj));
      }
    });
    App.Canvas.requestRender();
  });
};


// ------------------------------------------------------------
// Get list of hive names (for duplicate checks)
// ------------------------------------------------------------
App.Canvas.getHiveNames = function () {
  return canvas.getObjects()
    .filter(o => o.hiveData)
    .map(o => String(o.hiveData.name).trim());
};


// ------------------------------------------------------------
// Delete selected hives
// ------------------------------------------------------------
App.Canvas.deleteSelected = function () {
  const active = canvas.getActiveObjects();
  if (!active.length) {
    alert("No hive selected.");
    return;
  }

  if (!confirm(`Delete ${active.length} selected hive(s)? This cannot be undone.`)) return;

  active.forEach(obj => canvas.remove(obj));

  canvas.discardActiveObject();
  App.Canvas.requestRender();
  App.Canvas.saveLayout();
  App.Stats.update();
};


// ------------------------------------------------------------
// Underline all hive labels
// ------------------------------------------------------------
App.Canvas.underlineLabels = function () {
  canvas.getObjects().forEach(obj => {
    if (obj.type === "group" && obj._objects[1] instanceof fabric.Text) {
      obj._objects[1].set({ underline: true });
    }
  });
  App.Canvas.requestRender();
};


// ------------------------------------------------------------
// Print apiary canvas + inspection cards
// ------------------------------------------------------------
App.Canvas.print = function () {
  const apiaryName = Storage.getCurrentApiary() || "Untitled Apiary";

  // Disable controls for clean snapshot
  const prev = canvas.getObjects().map(o => ({
    obj: o,
    hasControls: o.hasControls,
    hasBorders: o.hasBorders,
    selectable: o.selectable,
    hoverCursor: o.hoverCursor
  }));

  canvas.getObjects().forEach(o => {
    o.hasControls = false;
    o.hasBorders = false;
    o.selectable = false;
    o.hoverCursor = "default";
  });

  canvas.discardActiveObject();
  App.Canvas.requestRender();

  const dataURL = canvas.toDataURL({ format: "png", multiplier: 2 });

  // Restore state
  prev.forEach(s => {
    s.obj.hasControls = s.hasControls;
    s.obj.hasBorders = s.hasBorders;
    s.obj.selectable = s.selectable;
    s.obj.hoverCursor = s.hoverCursor;
  });
  App.Canvas.requestRender();

  const win = window.open("", "_blank");

  const objects = canvas.getObjects().filter(o => o.hiveData);
  objects.sort((a, b) => (a.hiveData.name || "").localeCompare(b.hiveData.name || ""));

  let cardsHTML = "";
  objects.forEach(o => {
    const data = o.hiveData;
    const inspections = data.inspections || [];
    const last = inspections[inspections.length - 1];

    cardsHTML += `
      <div class="hive-card">
        <div class="hc-title">${data.name}</div>
        <div class="hc-item"><strong>Last:</strong> ${last ? last.date : "—"}</div>
        <div class="hc-item"><strong>Status:</strong> ${last?.queenStatus || "—"}</div>
        <div class="hc-item"><strong>Notes:</strong> ${last?.notes || "—"}</div>
      </div>
    `;
  });

  const dateStr = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  win.document.write(`
    <html>
    <head>
      <title>Print Apiary</title>
      <style>
        body { margin: 0; font-family: sans-serif; }
        img { width: 100%; display: block; margin-bottom: -50px; }
        .stamp {
          position: absolute;
          right: 12px;
          top: 12px;
          padding: 6px 10px;
          background: rgba(255,255,255,0.85);
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 12px;
        }
        .cards {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 10px;
        }
        .hive-card {
          border: 1px solid #000;
          padding: 6px;
          width: 120px;
          font-size: 11px;
          box-sizing: border-box;
        }
        .hc-title {
          font-weight: bold;
          margin-bottom: 4px;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <img id="printImg" src="${dataURL}">
      <div class="stamp">${apiaryName} — ${dateStr}</div>
      <div class="cards">${cardsHTML}</div>
    </body>
    </html>
  `);

  win.document.close();

  win.document.getElementById("printImg").onload = () => {
    win.focus();
    win.print();
  };
};


// ------------------------------------------------------------
// Request canvas render
// ------------------------------------------------------------
App.Canvas.requestRender = function () {
  if (canvas) canvas.requestRenderAll();
};


// ------------------------------------------------------------
// Expose canvas for debugging if needed
// ------------------------------------------------------------
App.Canvas.get = function () {
  return canvas;
};
