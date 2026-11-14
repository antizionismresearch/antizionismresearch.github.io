/**
 * 
 * HOW TO DO THIS:
 * 
 * - Copy and paste antizionsim/tweets, so you have a backup copy 
 * - Delete all folders in antizionism/tweets
 * - Copy israel-website-backend/tweets, paste into the antizionism/tweets folder
 * - Run node convert.js (this file)
 * - In antizionism/tweets/tweets_1_anti_zionism, delete each previously pasted .js file, leave the newly created folders
 * - After you see that the Tweets have been successfully converted, delete antizionism/tweets-copy
 * 
 * 
 * Conversion script: JS modules --> JSON folder structure (filtered by claimIds)
 *
 * Requirements:
 * - Old files: tweets/tweets_X_categoryName/*.js
 * - Each JS file exports: { claimN, examplesN }
 *
 * Behavior:
 * - You define a list of target claimIds you want to convert.
 * - Script scans ALL .js files.
 * - It collects:
 *    - claims whose claimId is in TARGET_CLAIM_IDS
 *    - examples that reference at least one TARGET_CLAIM_ID in their claimIds array
 * - Each example is assigned to exactly ONE claim:
 *    - the FIRST claimId in example.claimIds that is in TARGET_CLAIM_IDS
 * - No example is written into more than one claim's examples.json.
 *
 * Output structure:
 * tweets/tweets_X_categoryName/N_slug/claim.json
 * tweets/tweets_X_categoryName/N_slug/examples.json
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "tweets");

// 👉 EDIT THIS: list of claimIds you want to convert
const TARGET_CLAIM_IDS = new Set([
  // "1",
  // "6",
  // "17",
  // ...
  "3", "5", "6", "6y", "6z", "10", "11", "13", "14", "15", "17", "18", "19", "20", "21", "22", "24", "25", "30x", "31a", "31b", "31g", "31k", "31l", "31m", "31p", "31q", "31r", "41", "42", "44", "45", "46", "47", "49", "50", "52x", "56", "58", "59"
]);

// special claims that require additional depth
const deepDiveIds = new Set([
  "4", "7", "8", "9", "10", "11", "12", "DIFF_16", "50"
])


function isJsFile(file) {
  return file.endsWith(".js");
}

function extractNumberAndSlug(filename) {
  // example: "3_languageOfCompassion.js"
  const base = filename.replace(".js", "");
  const parts = base.split("_");
  const number = parts[0]; // "3"
  const slug = parts.slice(1).join("_"); // "languageOfCompassion"
  return { number, slug };
}

(function convert() {
  console.log("Starting filtered conversion...\n");
  if (TARGET_CLAIM_IDS.size === 0) {
    console.error("⚠️  TARGET_CLAIM_IDS is empty. Add claimIds you want to convert.");
    process.exit(1);
  }

  // claimId -> { claim, categoryPath, folderName }
  const claimMetaById = {};

  // claimId -> [examples...]
  const examplesByClaimId = {};

  // To ensure no example is added more than once (by exampleId)
  const assignedExampleIds = new Set();

  const categories = fs
    .readdirSync(ROOT)
    .filter((dir) => dir.startsWith("tweets_") && fs.statSync(path.join(ROOT, dir)).isDirectory());

  for (const category of categories) {
    const categoryPath = path.join(ROOT, category);
    const files = fs.readdirSync(categoryPath).filter(isJsFile);

    console.log(`Scanning category: ${category}`);

    for (const file of files) {
      const { number, slug } = extractNumberAndSlug(file);
      const inputPath = path.join(categoryPath, file);

      console.log(`  → Reading ${file}`);

      // Import the JS module dynamically
      const moduleExports = require(inputPath);

      // Example: claim3, examples3
      const claimKey = Object.keys(moduleExports).find((k) => k.startsWith("claim"));
      const examplesKey = Object.keys(moduleExports).find((k) => k.startsWith("examples"));

      if (!claimKey || !examplesKey) {
        console.error(`    ⚠️ Missing expected exports in ${file}, skipping this file...`);
        continue;
      }

      const claimData = moduleExports[claimKey];
      const examplesData = moduleExports[examplesKey];

      if (!claimData || typeof claimData.claimId === "undefined") {
        console.error(`    ⚠️ claim object in ${file} has no claimId, skipping claim...`);
      } else {
        const claimId = String(claimData.claimId);

        // Only store claim meta if claimId is in our target list
        if (TARGET_CLAIM_IDS.has(claimId)) {
          const folderName = `${number}_${slug}`;
          const existing = claimMetaById[claimId];

          if (existing) {
            console.warn(
              `    ⚠️ Duplicate claimId ${claimId} found in multiple files. ` +
                `Keeping first folder mapping (${existing.folderName}), ignoring ${folderName}`
            );
          } else {
            claimMetaById[claimId] = {
              claim: claimData,
              categoryPath,
              folderName,
            };
            console.log(`    ✔ Registered claimId ${claimId} for conversion`);
          }
        }
      }

      // Process examples: assign only to target claimIds based on first match
      if (Array.isArray(examplesData)) {
        for (const ex of examplesData) {
          const exId = ex.exampleId ? String(ex.exampleId) : null;

          if (!exId) {
            console.warn(
              `    ⚠️ Example without exampleId in file ${file}, skipping to avoid collisions`
            );
            continue;
          }

          if (assignedExampleIds.has(exId)) {
            // Already assigned to a claim, skip
            continue;
          }

          const claimIds = Array.isArray(ex.claimIds)
            ? ex.claimIds.map(String)
            : [];

          // Find the FIRST claimId in this example that is in our target list
          // Find the FIRST claimId in this example that is in our target list
          let assignedClaimId = null;
          for (const cid of claimIds) {
            if (TARGET_CLAIM_IDS.has(cid)) {
              assignedClaimId = cid;
              break;
            }
          }

          // Detect if this example is coming from a file whose main claimId is NOT targeted
          const parentClaimId = claimData && claimData.claimId ? String(claimData.claimId) : null;

          if (
            assignedClaimId &&                       // example will be converted
            parentClaimId &&                         // file has a valid parent claim
            !TARGET_CLAIM_IDS.has(parentClaimId)     // parent claim is NOT in target list
          ) {
            console.log(
              `\n⚠️  Cross-claim example found:` +
              `\n    exampleId: ${ex.exampleId}` +
              `\n    file: ${file}` +
              `\n    parent claimId (not targeted): ${parentClaimId}` +
              `\n    matched target claimId: ${assignedClaimId}\n`
            );
          }


          if (!assignedClaimId) {
            // This example does not participate in any target claimId
            continue;
          }

          if (!examplesByClaimId[assignedClaimId]) {
            examplesByClaimId[assignedClaimId] = [];
          }

          examplesByClaimId[assignedClaimId].push(ex);
          assignedExampleIds.add(exId);
        }
      } else {
        console.warn(`    ⚠️ examples export in ${file} is not an array, skipping examples`);
      }
    }
  }

  console.log("\nWriting filtered claim & examples JSON...\n");

  // For each target claimId, write claim.json and examples.json if we have metadata for it
  for (const claimId of TARGET_CLAIM_IDS) {
    const meta = claimMetaById[claimId];

    if (!meta) {
      console.warn(
        `⚠️ Target claimId ${claimId} was not found in any claim file. ` +
          `No claim.json will be written for this id.`
      );
      continue;
    }

    const { claim, categoryPath, folderName } = meta;
    const outputDir = path.join(categoryPath, folderName);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Write claim.json
    fs.writeFileSync(
      path.join(outputDir, "claim.json"),
      JSON.stringify(claim, null, 2),
      "utf8"
    );

    // Write examples.json (may be empty array if no examples matched)
    const examplesForClaim = examplesByClaimId[claimId] || [];
    fs.writeFileSync(
      path.join(outputDir, "examples.json"),
      JSON.stringify(examplesForClaim, null, 2),
      "utf8"
    );

    console.log(
      `✔ Wrote claimId ${claimId} to ${path.join(folderName, "claim.json")} ` +
        `with ${examplesForClaim.length} example(s)`
    );
  }

  console.log("\nFiltered conversion completed!");
})();
