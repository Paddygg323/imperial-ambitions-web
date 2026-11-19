// Native500920 aggregation. Inputs are already-calculated per-region potentials,
// not warehouse stocks or raw terrain yields. Campaign record producer not wired.
export function countryItemPotential(records, home) {
  if (!Number.isInteger(home) || !Array.isArray(records) || records.some(r =>
    !Number.isInteger(r.region) || !Number.isInteger(r.quantity) || r.quantity < 0 || r.quantity > 32767)) {
    throw Error('Invalid country potential records');
  }
  // The home region contributes only its first matching record. All other
  // regions contribute every record; the native flag partitions two sums.
  let foundHome = false, total = 0;
  for (const record of records) {
    if (record.region === home) {
      if (foundHome) continue;
      foundHome = true;
    }
    total += record.quantity;
  }
  return total;
}
