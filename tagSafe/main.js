let creatives = [];

function analyzeSingleTag() {
  const input = document.getElementById("tagInput").value.trim();
  if (!input) return;

  creatives = [buildCreativeFromTag("Pasted Tag", input)];
  renderCreativeTable(creatives);
}

function clearTagInput() {
  document.getElementById("tagInput").value = "";
  creatives = [];
  document.getElementById("creativeTable").innerHTML = "";
}

function buildCreativeFromTag(name, tag) {
  return {
    creativeName: name,
    tag: tag,
    type: detectType(tag),
    dimensions: getDimensions(tag),
    httpsSafe: isHTTPS(tag),
    isValid: isWellFormed(tag),
    vendor: detectVendor(tag)
  };
}

function getDimensions(tag) {
  const widthMatch = tag.match(/width=["']?(\d{2,4})["']/i);
  const heightMatch = tag.match(/height=["']?(\d{2,4})["']/i);
  if (widthMatch && heightMatch) {
    return `${widthMatch[1]}x${heightMatch[1]}`;
  }

  const szMatch = tag.match(/sz=(\d+x\d+)/i);
  if (szMatch) return szMatch[1];

  return "Unknown";
}

function calculatePreviewHeight(dimensions) {
  if (!dimensions || !dimensions.includes("x")) return 150;
  const parts = dimensions.split("x").map(Number);
  const height = parts[1];
  return isNaN(height) ? 150 : Math.min(Math.max(height, 60), 600);
}

function detectType(tag) {
  if (/<script/i.test(tag)) return "JavaScript Tag";
  if (/<iframe/i.test(tag)) return "iFrame Tag";
  if (/<img/i.test(tag) || /1x1/.test(tag)) return "Tracker Tag";
  return "Unknown";
}

function detectVendor(tag) {
  const vendors = {
    flashtalking: /flashtalking/i,
    sizmek: /sizmek/i,
    doubleclick: /doubleclick|dcmads|googletagservices|googlesyndication/i,
    amazon: /amazon-adsystem|aax\.amazon/i,
    adform: /adform/i,
    dv360: /displayvideo\.google/i,
    mediamath: /mathtag/i
  };

  for (let [name, pattern] of Object.entries(vendors)) {
    if (pattern.test(tag)) return name;
  }

  return "Unknown";
}

function isHTTPS(tag) {
  return tag.toLowerCase().includes("https://");
}

function isWellFormed(tag) {
  try {
    const el = document.createElement("div");
    el.innerHTML = tag;
    return el.children.length > 0;
  } catch (e) {
    return false;
  }
}

function countIssues(c) {
  let count = 0;
  if (!c.httpsSafe) count++;
  if (!c.isValid) count++;
  if (!/\d+x\d+/.test(c.dimensions)) count++;
  return count;
}

function renderCreativeTable(data) {
  const container = document.getElementById("creativeTable");

  const rows = data.map((c, i) => {
    const issueCount = countIssues(c);
    const statusText = issueCount === 0 ? "Passed" : `${issueCount} issue${issueCount > 1 ? "s" : ""}`;
    const statusClass = issueCount === 0 ? "status-pass" : "status-fail";

    const previewHeight = calculatePreviewHeight(c.dimensions);
    const iframeStyle = `width:100%; height:${previewHeight}px; border:1px solid #ccc; margin-top:10px;`;

    return `
      <tr class="main-row">
        <td>${c.creativeName}</td>
        <td>${c.type}</td>
        <td>${c.vendor}</td>
        <td class="${statusClass}">${statusText}</td>
        <td><button onclick="togglePreview(${i}, this)">Preview</button></td>
      </tr>
      <tr id="preview-row-${i}" class="preview-row" style="display:none;">
        <td colspan="5" id="preview-cell-${i}">
          <iframe id="preview-frame-${i}" style="${iframeStyle}" sandbox="allow-scripts allow-same-origin"></iframe>
          <div style="margin-top:10px">
            <strong>Tag Test Results:</strong><br/>
            ✅ HTTPS: ${c.httpsSafe ? "Yes" : "No"}<br/>
            ✅ Valid Syntax: ${c.isValid ? "Yes" : "No"}<br/>
            ✅ Dimensions: ${c.dimensions}<br/>
            ✅ Vendor: ${c.vendor}<br/>
            <br/>
            <button onclick="toggleRawTag(${i}, this)">Show Raw Tag</button>
            <pre id="raw-tag-${i}" style="display:none;">${escapeHTML(c.tag)}</pre>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  container.innerHTML = `
    <table class="tag-table">
      <thead>
        <tr>
          <th>Creative Name</th>
          <th>Type</th>
          <th>Vendor</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

function togglePreview(index, btn) {
  const row = document.getElementById(`preview-row-${index}`);
  const frame = document.getElementById(`preview-frame-${index}`);
  const visible = row.style.display === "table-row";
  row.style.display = visible ? "none" : "table-row";
  btn.textContent = visible ? "Preview" : "Hide Preview";
  if (frame && !visible) frame.srcdoc = creatives[index].tag;
}

function toggleRawTag(index, btn) {
  const pre = document.getElementById(`raw-tag-${index}`);
  const isVisible = pre.style.display === "block";
  pre.style.display = isVisible ? "none" : "block";
  btn.textContent = isVisible ? "Show Raw Tag" : "Hide Raw Tag";
}

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, function (m) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
  });
}
