import fs from "fs";
import path from "path";

const cssFilePath = path.join(process.cwd(), "src", "App.css");
let cssContent = fs.readFileSync(cssFilePath, "utf8");

const replacements = {
  "var(--primary-color)": "var(--bg-surface)",
  "var(--secondary-color)": "var(--bg-primary)",
  "var(--accent-color)": "var(--accent-primary)",
  "var(--bg-color)": "var(--bg-primary)",
  "var(--card-bg)": "var(--bg-card)",
  "1px solid var(--border-color)": "var(--border-transparent)",
  "var(--border-color)": "transparent",
  "var(--text-color)": "var(--text-main)",
  "var(--text-secondary)": "var(--text-muted)",
};

for (const [oldVar, newVar] of Object.entries(replacements)) {
  cssContent = cssContent.split(oldVar).join(newVar);
}

// Clean up some old border-radius values
cssContent = cssContent.replace(
  /border-radius: 0\.5rem;/g,
  "border-radius: var(--border-radius-icon);",
);
cssContent = cssContent.replace(
  /border-radius: 0\.375rem;/g,
  "border-radius: var(--border-radius-icon);",
);
cssContent = cssContent.replace(
  /border-radius: 8px;/g,
  "border-radius: var(--border-radius-icon);",
);

fs.writeFileSync(cssFilePath, cssContent, "utf8");
console.log("Successfully updated App.css with new CSS variables.");
