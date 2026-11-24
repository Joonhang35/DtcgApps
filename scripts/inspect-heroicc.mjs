
const API = "https://api.heroi.cc/bulk-data";

const response = await fetch(API);
if (!response.ok) throw new Error(`API error: ${response.status}`);

const catalog = await response.json();
const item = catalog.data?.find(
  x => x.attributes?.name?.toLowerCase() === "english cards"
);

if (!item?.links?.download) {
  throw new Error("English Cards download not found");
}

const download = await fetch(item.links.download);
if (!download.ok) throw new Error("Download failed");

const records = await download.json();

console.log("Total records:", records.length);

const parallelRecords = records.filter(record => {
  const id = record.data?.id ?? "";
  const attrs = record.data?.attributes ?? {};

  return /_P\d*$/i.test(id) ||
    (Number(attrs["parallel-id"]) > 0);
});

console.log("Parallel records:", parallelRecords.length);
console.log("\nFirst 5 parallel examples:");


console.log("\nFirst card attributes:");

console.log(JSON.stringify(
  records[1500]?.data?.attributes,
  null,
  2
));

