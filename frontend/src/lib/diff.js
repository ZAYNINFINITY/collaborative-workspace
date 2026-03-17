export const toComparableString = (value) => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export const diffFields = (beforeObj, afterObj, fields) => {
  const before = beforeObj || {};
  const after = afterObj || {};
  return (fields || []).map((field) => {
    const prev = before[field];
    const next = after[field];
    const changed = toComparableString(prev) !== toComparableString(next);
    return { field, before: prev, after: next, changed };
  });
};

export const summarizeSheet = (sheet) => {
  const rows = Array.isArray(sheet) ? sheet : [];
  const rowCount = rows.length;
  const colCount = rows.reduce((max, row) => Math.max(max, (row || []).length), 0);
  return { rowCount, colCount };
};

export const countCellDiffs = (a, b, maxCells = 2000) => {
  const aRows = Array.isArray(a) ? a : [];
  const bRows = Array.isArray(b) ? b : [];
  const maxRows = Math.max(aRows.length, bRows.length);
  const maxCols = Math.max(
    aRows.reduce((m, r) => Math.max(m, (r || []).length), 0),
    bRows.reduce((m, r) => Math.max(m, (r || []).length), 0),
  );

  const totalCells = maxRows * maxCols;
  if (totalCells > maxCells) {
    return { comparable: false, totalCells, changedCells: null };
  }

  let changedCells = 0;
  for (let r = 0; r < maxRows; r += 1) {
    const ar = aRows[r] || [];
    const br = bRows[r] || [];
    for (let c = 0; c < maxCols; c += 1) {
      const av = ar[c];
      const bv = br[c];
      if (toComparableString(av) !== toComparableString(bv)) changedCells += 1;
    }
  }

  return { comparable: true, totalCells, changedCells };
};

export const summarizeText = (text) => {
  const value = typeof text === "string" ? text : "";
  const lines = value.split(/\r?\n/);
  const lineCount = lines.length;
  const charCount = value.length;
  return { lineCount, charCount };
};

export const countLineDiffs = (beforeText, afterText, maxLines = 4000) => {
  const a = (typeof beforeText === "string" ? beforeText : "").split(/\r?\n/);
  const b = (typeof afterText === "string" ? afterText : "").split(/\r?\n/);

  const totalLines = Math.max(a.length, b.length);
  if (totalLines > maxLines) {
    return { comparable: false, totalLines, changedLines: null };
  }

  let changedLines = 0;
  for (let i = 0; i < totalLines; i += 1) {
    if ((a[i] || "") !== (b[i] || "")) changedLines += 1;
  }
  return { comparable: true, totalLines, changedLines };
};
