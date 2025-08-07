async function analyzeTags() {
    const input = document.getElementById("tagInput").value.trim();
    const tags = input.split(/\n{2,}/);
  
    const promises = tags.map(async (tag, index) => {
      const tagType = getTagType(tag);
      const httpsSafe = isSecure(tag);
      const dimensions = getDimensions(tag);
      const isValid = isWellFormed(tag);
      const { sizeKB, loadMS } = await getFileInfo(tag);
  
      return {
        index: index + 1,
        tag,
        tagType,
        httpsSafe,
        dimensions,
        isValid,
        sizeKB,
        loadMS,
      };
    });
  
    const results = await Promise.all(promises);
    renderTable(results);
  }
  
  
  function getTagType(tag) {
    if (/<\?xml/i.test(tag) && /<VAST/i.test(tag)) return "VAST";
    if (/iframe/i.test(tag)) return "Iframe";
    if (/script/i.test(tag)) return "Script";
    if (/img/i.test(tag)) return "Image";
    if (/pixel/i.test(tag)) return "Pixel";
    if (/video/i.test(tag)) return "Video";
    return "Unknown";
  }
  
  function isSecure(tag) {
    const urls = tag.match(/src=["']?(http[s]?:\/\/[^"'>\s]+)/gi) || [];
    return urls.every(url => url.startsWith('src="https://') || url.startsWith("src='https://"));
  }
  
  function getDimensions(tag) {
    let width = tag.match(/width=["']?(\d+)/i);
    let height = tag.match(/height=["']?(\d+)/i);
  
    // Check inline style as fallback
    if (!width || !height) {
      const style = tag.match(/style=["'][^"']*["']/i);
      if (style) {
        const w = style[0].match(/width:\s*(\d+)/i);
        const h = style[0].match(/height:\s*(\d+)/i);
        if (w) width = [null, w[1]];
        if (h) height = [null, h[1]];
      }
    }
  
    return width && height ? `${width[1]}x${height[1]}` : "❓";
  }
  
  
  function isWellFormed(tag) {
    try {
      new DOMParser().parseFromString(tag, "text/html");
      return true;
    } catch {
      return false;
    }
  }
  
  function renderTable(data) {
  const container = document.getElementById("results");
  container.innerHTML = `
    <table>
      <tr>
        <th>#</th>
        <th>Type</th>
        <th>Dimensions</th>
        <th>HTTPS</th>
        <th>Valid</th>
        <th>Size (KB)<br/><small>Max: 500</small></th>
        <th>Load (ms)<br/><small>Max: 2000</small></th>
        <th>Preview</th>
      </tr>
      ${data
        .map((d) => {
          // Flags for over-spec
          const sizeWarn =
            typeof d.sizeKB === "number" && d.sizeKB > 500 ? "🔥" : "";
          const loadWarn =
            typeof d.loadMS === "number" && d.loadMS > 2000 ? "🔥" : "";

          return `
        <tr>
          <td>${d.index}</td>
          <td>${d.tagType}</td>
          <td>${d.dimensions}</td>
          <td class="${d.httpsSafe ? "valid" : "invalid"}">${d.httpsSafe ? "✅" : "❌"}</td>
          <td class="${d.isValid ? "valid" : "invalid"}">${d.isValid ? "✅" : "❌"}</td>
          <td class="${sizeWarn ? "invalid" : "valid"}">${d.sizeKB} ${sizeWarn}</td>
          <td class="${loadWarn ? "invalid" : "valid"}">${d.loadMS} ${loadWarn}</td>
          <td><button onclick="showTag(${d.index - 1}, '${d.tagType}')">View</button></td>
        </tr>
      `;
        })
        .join("")}
    </table>
  `;
}

  
  
  function showTag(index, type) {
    const input = document.getElementById("tagInput").value.trim();
    const tags = input.split(/\n{2,}/); // Re-parse tags
    const tag = tags[index];
    const previewBox = document.getElementById("preview");
    const liveFrame = document.getElementById("livePreviewFrame");
  
    // Show raw code
    previewBox.innerHTML = `
      <h3>Tag #${index + 1} - ${type}</h3>
      <pre>${escapeHTML(tag)}</pre>
    `;
  
    // Render tag in iframe if it's not VAST
    if (type === "VAST") {
      liveFrame.style.display = "none";
      previewBox.innerHTML += `
        <p><strong>Note:</strong> This appears to be a VAST XML tag. It cannot be rendered directly in a browser.</p>
        <p>Recommended: test in a VAST video player or validation tool.</p>
      `;
    } else {
      const doc = liveFrame.contentWindow.document;
      doc.open();
      doc.write(tag);
      doc.close();
      liveFrame.style.display = "block";
    }
  }
  
  function escapeHTML(str) {
    return str.replace(/[&<>"']/g, (match) => {
      const escape = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };
      return escape[match];
    });
  }
  

  async function getFileInfo(tag) {
    const urlMatch = tag.match(/src=["']?(https?:\/\/[^"'>\s]+)/i);
    if (!urlMatch) return { sizeKB: "—", loadMS: "—" }; // No URL found
  
    const url = urlMatch[1];
    const start = performance.now();
  
    try {
      const res = await fetch(url, { method: "GET" });
      const end = performance.now();
      const buffer = await res.arrayBuffer();
      const sizeKB = Math.round(buffer.byteLength / 1024);
      const loadMS = Math.round(end - start);
      return { sizeKB, loadMS };
    } catch (e) {
      return { sizeKB: "Error (CORS)", loadMS: "Error (CORS)" };
    }
  }
  
  