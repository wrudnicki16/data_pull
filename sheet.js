// console.log(process.stdin);
let fs = require('fs');

process.stdin.resume();
process.stdin.setEncoding('utf-8');

function exportCSVFile(csv, fileTitle) {
  var exportedFilename = fileTitle + '.csv';
  fs.writeFile(exportedFilename, csv, (err) => {
    if (err) {
      throw err;
    }
    console.log("Saved!");
  })
}

function sortHeroesFromJSON(json) {
  // sort by: attr, range > 150, creep dps
  let heroes = Object.keys(json);

  heroes = heroes.sort((hero1Name, hero2Name) => {
    let hero1 = json[hero1Name], hero2 = json[hero2Name];

    if (hero1.attribute > hero2.attribute) return 1;
    if (hero1.attribute < hero2.attribute) return -1;
    if (hero1.projSpeed === "" && hero2.projSpeed !== "") return 1;
    if (hero1.projSpeed !== "" && hero2.projSpeed === "") return -1;
    if (hero1.creepDPS < hero2.creepDPS) return 1;
    if (hero1.creepDPS > hero2.creepDPS) return -1;
    return 0;
  });
  return heroes;
}

function jsonToCSV(json) {
  let headers = Object.keys(json["pangolier"]);
  // let heroes = Object.keys(json).sort();
  let heroes = sortHeroesFromJSON(json);

  const replacer = (key, value) => value === null ? '' : value // specify how you want to handle null values here
  let csv = heroes.map(heroName => headers.map(fieldName => JSON.stringify(json[heroName][fieldName], replacer)).join(','))
  csv.unshift(headers.join(','))
  csv = csv.join('\r\n')

  return csv;
}

let chunks = [];

process.stdin.on('data', (chunk) => {
  chunks.push(chunk);
})

process.stdin.on('end', () => {
  let inputJSON = chunks.join("");
  let parsedData = JSON.parse(inputJSON);
  // console.log(parsedData);
  
  let csv = jsonToCSV(parsedData);
  exportCSVFile(csv, "heroes");


});

