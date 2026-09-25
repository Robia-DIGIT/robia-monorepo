export type ImportedLocation = { legacyId: string; name: string; address?: string; city?: string; country?: string; phone?: string; isPrimary: boolean };
export const LOCATION_CSV_EXAMPLE = 'identifiant;nom;adresse;ville;pays;telephone;principal\nancien-1;Mon établissement;12 rue des Fleurs;Paris;France;+33123456789;oui';
// Semicolon CSV with quoted cells, escaped quotes and CRLF; no guessed columns.
export function parseLocationsCsv(text: string): ImportedLocation[] {
  if (text.length > 2_000_000) throw new Error('Le fichier est trop volumineux (2 Mo maximum).');
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false; let closed = false;
  const input = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"') { if (input[i + 1] === '"') { cell += '"'; i++; } else { quoted = false; closed = true; } }
      else cell += ch;
    } else if (ch === '"') {
      if (cell || closed) throw new Error('Guillemets invalides dans le fichier CSV.');
      quoted = true;
    } else if (ch === ';') { row.push(cell); cell = ''; closed = false; }
    else if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && input[i + 1] === '\n') i++;
      row.push(cell); if (row.some(v => v.trim())) rows.push(row); row = []; cell = ''; closed = false;
    } else { if (closed && ch.trim()) throw new Error('Séparateur manquant après une cellule entre guillemets.'); if (!closed) cell += ch; }
  }
  if (quoted) throw new Error('Une cellule entre guillemets n’est pas terminée.');
  row.push(cell); if (row.some(v => v.trim())) rows.push(row);
  const header = rows.shift()?.map(v => v.trim().toLowerCase());
  if (header?.join(';') !== 'identifiant;nom;adresse;ville;pays;telephone;principal') throw new Error('Utilisez les colonnes du modèle, séparées par des points-virgules.');
  if (!rows.length || rows.length > 100) throw new Error('Importez entre 1 et 100 établissements à la fois.');
  const ids = new Set<string>();
  return rows.map((values, i) => {
    if (values.length !== 7) throw new Error('Ligne ' + (i + 2) + ' : sept colonnes sont attendues.');
    const [legacyId,name,address,city,country,phone,primary] = values.map(v => v.trim());
    if (!legacyId || !name || legacyId.length > 200 || name.length > 200 || address.length > 500 || city.length > 200 || country.length > 200 || phone.length > 100) throw new Error('Ligne ' + (i + 2) + ' : vérifiez l’identifiant, le nom et la longueur des champs.');
    if (ids.has(legacyId)) throw new Error('Identifiant en double : ' + legacyId);
    ids.add(legacyId);
    if (!['','oui','non','true','false','1','0'].includes(primary.toLowerCase())) throw new Error('Ligne ' + (i + 2) + ' : principal doit valoir oui ou non.');
    return { legacyId, name, address: address || undefined, city: city || undefined, country: country || undefined, phone: phone || undefined, isPrimary: ['oui','true','1'].includes(primary.toLowerCase()) };
  });
}
